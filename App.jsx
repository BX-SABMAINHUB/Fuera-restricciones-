import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURACIÓN FIREBASE CORE ---
const firebaseConfig = {
  apiKey: "AIzaSyD1zUmhiUVDv-ZYyJF7vTwGaS1AO9t9jiE",
  authDomain: "alexhub-eefdf.firebaseapp.com",
  databaseURL: "https://alexhub-eefdf-default-rtdb.firebaseio.com",
  projectId: "alexhub-eefdf",
  storageBucket: "alexhub-eefdf.firebasestorage.app",
  messagingSenderId: "463204402982",
  appId: "1:463204402982:web:fe740a662fbfd50452a3e7",
  measurementId: "G-M8KSGN3WX9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";

// --- CONSTANTES DE SISTEMA ---
const ADMIN_PASS = "Alex2706";
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltraV10() {
  // ESTADOS DE IDENTIDAD Y SEGURIDAD
  const [userId, setUserId] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteTimeLeft, setMuteTimeLeft] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  
  // ESTADOS DE ADMIN
  const [adminMode, setAdminMode] = useState('closed'); // closed, auth, panel
  const [adminPassInput, setAdminPassInput] = useState('');
  const [activeUsers, setActiveUsers] = useState({});
  const [bannedUsers, setBannedUsers] = useState({});
  const [mutedUsers, setMutedUsers] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [globalMessage, setGlobalMessage] = useState("");

  // ESTADOS DE NAVEGACIÓN
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPuList, setShowPuList] = useState(false);

  // ==========================================
  // 1. GENERADOR DE TOKEN (ALGORITMO DE TU WEB)
  // ==========================================
  const generateToken = useCallback(() => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let result = ''; let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    for (let i = 0; i < 6; i++) {
        hash = (hash * 16807) % 2147483647;
        result += chars.charAt(Math.abs(hash) % chars.length);
    }
    return result;
  }, []);

  // ==========================================
  // 2. CORE ENGINE: IDENTIDAD Y FIREBASE
  // ==========================================
  useEffect(() => {
    // Manejo de ID en URL
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (!id) {
      id = 'AH-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + id;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setUserId(id);

    // Registro en Firebase Online
    const userRef = ref(db, `online/${id}`);
    set(userRef, { id, status: 'active', lastSeen: serverTimestamp(), browser: navigator.userAgent.slice(0, 30) });
    onDisconnect(userRef).remove();

    // LISTENERS DE SEGURIDAD (EN VIVO)
    onValue(ref(db, `bans/${id}`), (snap) => setIsBanned(snap.exists()));
    onValue(ref(db, `mutes/${id}`), (snap) => {
      if (snap.exists()) {
        const expiry = snap.val().expires;
        if (Date.now() < expiry) {
          setIsMuted(true);
          setMuteTimeLeft(Math.ceil((expiry - Date.now()) / 60000));
        } else {
          remove(ref(db, `mutes/${id}`));
          setIsMuted(false);
        }
      } else {
        setIsMuted(false);
      }
    });
    
    // Listeners de Admin
    onValue(ref(db, 'online'), (s) => setActiveUsers(s.val() || {}));
    onValue(ref(db, 'bans'), (s) => setBannedUsers(s.val() || {}));
    onValue(ref(db, 'mutes'), (s) => setMutedUsers(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));
    onValue(ref(db, 'broadcast'), (s) => setGlobalMessage(s.val()));
  }, []);

  // ==========================================
  // 3. FUNCIONES DE ADMINISTRACIÓN (MUTE/BAN/MOD)
  // ==========================================
  const executeMute = (targetId) => {
    const mins = prompt("¿Cuántos minutos mutear? (1-59):", "10");
    if (mins && !isNaN(mins)) {
      const expires = Date.now() + (parseInt(mins) * 60000);
      set(ref(db, `mutes/${targetId}`), { expires });
    }
  };

  const executeBan = (targetId) => {
    if (confirm(`¿Estás seguro de banear a ${targetId}?`)) {
      set(ref(db, `bans/${targetId}`), { time: serverTimestamp() });
    }
  };

  const sendBroadcast = () => {
    const msg = prompt("Mensaje para todos:");
    if (msg) set(ref(db, 'broadcast'), msg);
    else remove(ref(db, 'broadcast'));
  };

  const togglePremium = (targetId) => {
    const newPremium = [...premiumUsers, targetId];
    set(ref(db, 'premium_users'), newPremium);
  };

  // ==========================================
  // 4. LÓGICA DE LOGIN Y BÚSQUEDA
  // ==========================================
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === generateToken() || password === ADMIN_PASS) {
      setAuthorized(true);
    } else {
      alert("TOKEN INVÁLIDO. REVISA LA WEB.");
      setPassword('');
    }
  };

  const handleSearch = async (e) => {
    if(e) e.preventDefault();
    if(isMuted) { alert(`ESTÁS MUTEADO. Espera ${muteTimeLeft} min.`); return; }
    if(!query) return;
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=18&q=${query}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
      setSelectedVideo(null);
    } catch(err) { alert("Error API"); }
  };

  // ==========================================
  // 5. INTERFAZ DE USUARIO (REACTION)
  // ==========================================
  
  if (isBanned) return (
    <div style={styles.blackout}>
      <h1 style={styles.alertText}>CONEXIÓN TERMINADA</h1>
      <p>Tu ID ({userId}) ha sido expulsado del servidor por incumplir las reglas.</p>
    </div>
  );

  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitchTitle}>ALEX HUB <span style={{color: '#E50914'}}>V10</span></h1>
        <p style={styles.subText}>USER_ID: {userId}</p>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="ACCESS TOKEN" value={password} onChange={e=>setPassword(e.target.value)} style={styles.loginInput} />
          <button type="submit" style={styles.loginBtn}>ENTRAR AL NÚCLEO</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      {/* BARRA DE MENSAJE GLOBAL */}
      {globalMessage && <div style={styles.broadcastBar}>📢 ALERT: {globalMessage}</div>}

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logo}>ALEX<span style={{color:'#E50914'}}>HUB</span></div>
          <div style={styles.tabGroup}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(t => (
              <button key={t} onClick={()=>setMode(t)} style={mode===t ? styles.activeTab : styles.tab}>{t.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearch} style={styles.searchWrapper}>
          <input placeholder={isMuted ? "SISTEMA MUTEADO..." : "Buscar contenido..."} value={query} onChange={e=>setQuery(e.target.value)} style={styles.searchInput} disabled={isMuted} />
        </form>

        <div style={styles.navRight}>
          {premiumUsers.length > 0 && <button onClick={()=>setShowPuList(true)} style={styles.premiumGold}>👑 ELITE</button>}
          <button onClick={()=>window.location.href=PANIC_URL} style={styles.panicBtn}>PÁNICO</button>
          {/* BOTÓN ADMIN CAMUFLADO */}
          <button onClick={()=>setAdminMode('auth')} style={styles.secretAdminBtn}>.</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.grid}>
          {selectedVideo ? (
            <div style={styles.playerArea}>
              <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
              <button onClick={()=>setSelectedVideo(null)} style={styles.backBtn}>VOLVER A LA RED</button>
            </div>
          ) : (
            videos.map((v, i) => (
              <div key={i} style={styles.videoCard} onClick={()=>setSelectedVideo(v.id.videoId)}>
                <img src={v.snippet.thumbnails.high.url} style={{width:'100%', borderRadius:'10px'}} />
                <div style={{padding:'10px'}}>
                  <p style={styles.vTitle}>{v.snippet.title}</p>
                  <p style={styles.vChannel}>{v.snippet.channelTitle}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* --- SISTEMA DE ADMINISTRACIÓN --- */}

      {adminMode === 'auth' && (
        <div style={styles.overlay} onClick={()=>setAdminMode('closed')}>
          <div style={styles.modalSmall} onClick={e=>e.stopPropagation()}>
            <h2 style={{color: '#E50914'}}>SISTEMA DE SEGURIDAD</h2>
            <form onSubmit={(e)=>{
              e.preventDefault();
              if(adminPassInput === ADMIN_PASS) setAdminMode('panel');
              else alert("PASS INCORRECTA");
              setAdminPassInput('');
            }}>
              <input type="password" placeholder="CLAVE MAESTRA" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)} style={styles.loginInput} />
              <button style={styles.loginBtn}>DESBLOQUEAR PANEL</button>
            </form>
          </div>
        </div>
      )}

      {adminMode === 'panel' && (
        <div style={styles.overlay}>
          <div style={styles.adminContainer}>
            <header style={styles.adminHeader}>
              <h2 style={{margin:0}}>ALEX HUB COMMAND CENTER V10</h2>
              <div>
                <button onClick={sendBroadcast} style={styles.actionBtn}>ANUNCIO</button>
                <button onClick={()=>setAdminMode('closed')} style={styles.closeBtn}>SALIR</button>
              </div>
            </header>
            <div style={styles.adminGrid}>
              {/* COLUMNA ONLINE */}
              <div style={styles.adminCol}>
                <h3 style={{color:'#00ff41'}}>🟢 USUARIOS ONLINE</h3>
                {Object.values(activeUsers).map(u => (
                  <div key={u.id} style={styles.userRow}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontSize:'12px', fontWeight:'bold'}}>{u.id}</span>
                      <span style={{fontSize:'9px', color:'#555'}}>{u.browser}</span>
                    </div>
                    <div style={{display:'flex', gap:'5px'}}>
                      <button onClick={()=>executeMute(u.id)} style={styles.muteBtn}>MUTE</button>
                      <button onClick={()=>executeBan(u.id)} style={styles.banBtn}>BAN</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* COLUMNA BLACKLIST */}
              <div style={styles.adminCol}>
                <h3 style={{color:'#E50914'}}>🚫 BLACKLIST</h3>
                {Object.keys(bannedUsers).map(id => (
                  <div key={id} style={styles.userRow}>
                    <span>{id}</span>
                    <button onClick={()=>remove(ref(db, `bans/${id}`))} style={styles.unbanBtn}>REMITIR</button>
                  </div>
                ))}
              </div>

              {/* COLUMNA MUTED */}
              <div style={styles.adminCol}>
                <h3 style={{color:'#FFD700'}}>🔇 MUTEADOS</h3>
                {Object.keys(mutedUsers).map(id => (
                  <div key={id} style={styles.userRow}>
                    <span>{id}</span>
                    <button onClick={()=>remove(ref(db, `mutes/${id}`))} style={styles.unbanBtn}>QUITAR</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELITE USERS */}
      {showPuList && (
        <div style={styles.overlay} onClick={()=>setShowPuList(false)}>
           <div style={styles.goldModal}>
              <h1 style={{color: '#FFD700', letterSpacing: '5px'}}>ELITE USERS</h1>
              {premiumUsers.map((u, i) => (
                <div key={i} style={styles.puName}>{u}</div>
              ))}
           </div>
        </div>
      )}

      <footer style={styles.footer}>
        <div style={{display:'flex', gap:'20px'}}>
          <span>STATUS: <span style={{color:'#00ff41'}}>ONLINE</span></span>
          <span>ID: <b style={{color:'#fff'}}>{userId}</b></span>
          <span>TOKEN: <b style={{color:'#fff'}}>{generateToken()}</b></span>
        </div>
        <div>ALEX HUB © 2024 | V10 ULTRA CORE</div>
      </footer>
    </div>
  );
}

// ==========================================
// ESTILOS DE ALTA GAMA (CSS IN JS)
// ==========================================
const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' },
  loginCard: { background: '#050505', padding: '60px', borderRadius: '50px', border: '1px solid #111', textAlign: 'center', width: '450px', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' },
  glitchTitle: { color: '#fff', fontSize: '42px', letterSpacing: '10px', fontWeight: '900', margin: 0 },
  subText: { color: '#444', fontSize: '11px', letterSpacing: '2px', marginBottom: '30px' },
  loginInput: { width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '18px', borderRadius: '15px', textAlign: 'center', fontSize: '20px', outline: 'none', marginBottom: '20px' },
  loginBtn: { width: '100%', padding: '18px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' },

  app: { background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', position: 'relative' },
  navbar: { height: '80px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' },
  logo: { fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  tabGroup: { display: 'flex', background: '#111', borderRadius: '15px', padding: '5px', marginLeft: '30px' },
  tab: { background: 'none', border: 'none', color: '#444', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold' },
  searchWrapper: { flex: 1, maxWidth: '500px', margin: '0 40px' },
  searchInput: { width: '100%', background: '#080808', border: '1px solid #1a1a1a', padding: '12px 25px', borderRadius: '25px', color: '#fff', outline: 'none' },
  premiumGold: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', border: 'none', padding: '10px 20px', borderRadius: '20px', color: '#000', fontWeight: '900', cursor: 'pointer' },
  panicBtn: { background: '#fff', border: 'none', color: '#000', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  secretAdminBtn: { background: 'transparent', border: 'none', color: '#050505', cursor: 'default' },

  broadcastBar: { background: '#E50914', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px' },
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' },
  videoCard: { cursor: 'pointer', transition: '0.3s' },
  vTitle: { fontSize: '15px', fontWeight: 'bold', margin: '10px 0 5px 0' },
  vChannel: { fontSize: '12px', color: '#555' },
  playerArea: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  iframe: { width: '100%', height: '100%', border: 'none', borderRadius: '20px' },
  backBtn: { position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.8)', color: '#fff', border: '1px solid #333', padding: '10px 20px', borderRadius: '10px' },

  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modalSmall: { background: '#080808', padding: '40px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center' },
  adminContainer: { background: '#050505', width: '95%', height: '90%', borderRadius: '25px', border: '2px solid #E50914', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminHeader: { padding: '25px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, overflowY: 'auto' },
  adminCol: { padding: '20px', borderRight: '1px solid #111' },
  userRow: { background: '#0a0a0a', padding: '15px', marginBottom: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1a1a1a' },
  banBtn: { background: '#E50914', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' },
  muteBtn: { background: '#FFD700', border: 'none', color: '#000', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff41', border: 'none', color: '#000', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold' },
  actionBtn: { background: '#444', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '5px', marginRight: '10px' },
  closeBtn: { background: '#E50914', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '5px' },

  goldModal: { background: '#000', border: '3px solid #FFD700', padding: '60px', borderRadius: '50px', textAlign: 'center' },
  puName: { fontSize: '24px', padding: '15px', borderBottom: '1px solid #111', letterSpacing: '4px' },
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '10px', color: '#333' },
  blackout: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  alertText: { fontSize: '60px', color: '#E50914', letterSpacing: '10px' }
};
