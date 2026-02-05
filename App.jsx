import React, { useState, useEffect, useCallback, useRef } from 'react';
// IMPORTAMOS FIREBASE DESDE LA RED (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- TU CONFIGURACIÓN REAL DE FIREBASE ---
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

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// CONFIGURACIÓN MAESTRA
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";
const ADMIN_PASS = "Alex2706";

export default function AlexHubUltraV12() {
  // --- ESTADOS DE IDENTIDAD Y SEGURIDAD ---
  const [userId, setUserId] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteTimeRemaining, setMuteTimeRemaining] = useState('');
  
  // --- ESTADOS DE NAVEGACIÓN ---
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [modal, setModal] = useState(null);

  // --- ESTADOS DE ADMIN ---
  const [adminMode, setAdminMode] = useState('closed'); // 'closed', 'auth', 'panel'
  const [adminInput, setAdminInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({});
  const [bannedUsers, setBannedUsers] = useState({});
  const [mutedUsers, setMutedUsers] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [newPuName, setNewPuName] = useState('');
  const [viewingPuList, setViewingPuList] = useState(false);

  // ==========================================
  // 1. SISTEMA DE ID EN EL ENLACE (URL PERSISTENCE)
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    
    if (!id) {
      // Si no hay ID, generamos uno aleatorio
      id = 'ALEX-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + id;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setUserId(id);

    // Registro de presencia en Firebase
    const userRef = ref(db, `online/${id}`);
    set(userRef, {
      id: id,
      lastSeen: serverTimestamp(),
      agent: navigator.userAgent.slice(0, 50)
    });
    onDisconnect(userRef).remove();

    // Listener de BANEO
    onValue(ref(db, `bans/${id}`), (snap) => {
      if (snap.exists()) setIsBanned(true);
    });

    // Listener de MUTE con Cronómetro
    onValue(ref(db, `mutes/${id}`), (snap) => {
      if (snap.exists()) {
        const expiry = snap.val().expiresAt;
        const interval = setInterval(() => {
          const now = Date.now();
          const diff = expiry - now;
          if (diff <= 0) {
            remove(ref(db, `mutes/${id}`));
            setIsMuted(false);
            clearInterval(interval);
          } else {
            setIsMuted(true);
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setMuteTimeRemaining(`${m}m ${s}s`);
          }
        }, 1000);
        return () => clearInterval(interval);
      } else {
        setIsMuted(false);
      }
    });

    // Listeners para el Panel de Admin
    onValue(ref(db, 'online'), (s) => setOnlineUsers(s.val() || {}));
    onValue(ref(db, 'bans'), (s) => setBannedUsers(s.val() || {}));
    onValue(ref(db, 'mutes'), (s) => setMutedUsers(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));
  }, []);

  // ==========================================
  // 2. SEGURIDAD Y TOKEN (TU ALGORITMO EXACTO)
  // ==========================================
  const generateCurrentToken = useCallback(() => {
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

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === generateCurrentToken() || password === ADMIN_PASS) setAuthorized(true);
    else { alert("TOKEN INVÁLIDO"); setPassword(''); }
  };

  // ==========================================
  // 3. FUNCIONES DE ADMIN (REALES)
  // ==========================================
  const unlockAdmin = (e) => {
    e.preventDefault();
    if (adminInput === ADMIN_PASS) {
      setAdminMode('panel');
      setAdminInput('');
    } else {
      alert("PASSWORD INCORRECTO");
    }
  };

  const banUser = (targetId) => {
    if (confirm(`¿Banear permanentemente a ${targetId}?`)) {
      set(ref(db, `bans/${targetId}`), { timestamp: serverTimestamp() });
    }
  };

  const unbanUser = (targetId) => {
    remove(ref(db, `bans/${targetId}`));
  };

  const muteUser = (targetId) => {
    const mins = prompt("¿Cuántos minutos de silencio? (1-59)", "10");
    if (mins && !isNaN(mins)) {
      const expiresAt = Date.now() + (parseInt(mins) * 60000);
      set(ref(db, `mutes/${targetId}`), { expiresAt });
    }
  };

  const addPremium = (e) => {
    e.preventDefault();
    if (newPuName.trim()) {
      const updated = [...premiumUsers, newPuName];
      set(ref(db, 'premium_users'), updated);
      setNewPuName('');
    }
  };

  // ==========================================
  // 4. LÓGICA DE BÚSQUEDA Y NAVEGACIÓN
  // ==========================================
  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setTransitioning(true);
    setTimeout(() => { setMode(newMode); setTransitioning(false); }, 1500);
  };

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (isMuted) return;
    if (!query || mode !== 'youtube') return;
    setLoading(true);
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      setVideos(data.items.filter(v => v.id?.videoId));
      setSelectedVideo(null);
    } catch (err) { alert("Error API"); }
    setLoading(false);
  };

  // ==========================================
  // 5. RENDERS (PANTALLAS ESPECIALES)
  // ==========================================

  if (isBanned) return (
    <div style={styles.fullscreenBlack}>
      <h1 style={styles.errorText}>SISTEMA BLOQUEADO</h1>
      <p style={{color: '#555'}}>Tu ID ({userId}) ha sido expulsado por el Administrador.</p>
    </div>
  );

  if (isMuted) return (
    <div style={styles.muteOverlay}>
      <div style={styles.muteBox}>
        <h1 style={{fontSize: '50px', margin: 0}}>🔇 MUTEADO</h1>
        <p style={{letterSpacing: '5px', fontSize: '20px'}}>TIEMPO RESTANTE:</p>
        <div style={styles.timer}>{muteTimeRemaining}</div>
        <p style={{color: '#E50914', marginTop: '20px'}}>No puedes buscar ni chatear hasta que el tiempo termine.</p>
      </div>
    </div>
  );

  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitchTitle}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
        <p style={{fontSize: '11px', color: '#444', marginBottom: '20px'}}>ENLACE_ID: {userId}</p>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="TOKEN DIARIO" value={password} onChange={e=>setPassword(e.target.value)} style={styles.loginInput} />
          <button type="submit" style={styles.loginBtn}>ENTRAR AL HUB</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      {/* NAVEGACIÓN */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB V12</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => handleModeChange(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {premiumUsers.length > 0 && (
          <button onClick={() => setViewingPuList(true)} style={styles.premiumBadge}>👑 Premium Users</button>
        )}

        <form onSubmit={performSearch} style={styles.searchForm}>
          <input style={styles.searchInput} placeholder="Buscar contenido..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
        
        <div style={{display:'flex', gap: '10px'}}>
           <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
           <button onClick={() => setAdminMode('auth')} style={styles.adminButton}>ADMIN</button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main style={styles.contentArea}>
        {transitioning && (
          <div style={styles.transitionOverlay}><div className="loader_spin"></div></div>
        )}

        {mode === 'youtube' && (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.playerWrapper}>
                <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
                <button onClick={() => setSelectedVideo(null)} style={styles.closeBtnVideo}>CERRAR VÍDEO</button>
              </div>
            ) : (
              videos.map((v, i) => (
                <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                  <img src={v.snippet.thumbnails.high.url} style={styles.thumbnail} />
                  <div style={styles.cardInfo}><p style={styles.videoTitle}>{v.snippet.title}</p></div>
                </div>
              ))
            )}
          </div>
        )}
        {/* RESTO DE MODOS IGUALES */}
        {mode !== 'youtube' && (
            <div style={styles.fullView}>
                <iframe 
                    src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` : 
                         mode === 'movies' ? `https://www.google.com/search?q=${query}+watch+free&igu=1` :
                         "https://www.bing.com/search?q=fortnite+play+xbox&igu=1"} 
                    style={styles.fullIframe} 
                />
            </div>
        )}
      </main>

      {/* --- PANEL ADMIN MODAL --- */}
      {adminMode === 'auth' && (
        <div style={styles.modalBack} onClick={()=>setAdminMode('closed')}>
          <div style={styles.modalContentSmall} onClick={e=>e.stopPropagation()}>
            <h2 style={{color: '#E50914'}}>SISTEMA DE CONTROL</h2>
            <form onSubmit={unlockAdmin}>
              <input type="password" value={adminInput} onChange={e=>setAdminInput(e.target.value)} style={styles.loginInput} placeholder="CONTRASEÑA MAESTRA" autoFocus />
              <button style={styles.loginBtn}>DESBLOQUEAR</button>
            </form>
          </div>
        </div>
      )}

      {adminMode === 'panel' && (
        <div style={styles.modalBack}>
          <div style={styles.adminPanelLarge}>
            <div style={styles.adminHeader}>
              <h1 style={{margin:0, fontSize: '20px'}}>ALEX HUB COMMAND CENTER V12</h1>
              <button onClick={()=>setAdminMode('closed')} style={styles.closeBtnSmall}>SALIR</button>
            </div>
            
            <div style={styles.adminBody}>
                {/* COLUMNA 1: USUARIOS ONLINE */}
                <div style={styles.adminCol}>
                    <h3 style={{color:'#00ff41'}}>🟢 ONLINE ({Object.keys(onlineUsers).length})</h3>
                    <div style={styles.adminScroll}>
                        {Object.values(onlineUsers).map(u => (
                            <div key={u.id} style={styles.userItem}>
                                <div>
                                    <div style={{fontWeight:'bold', color: u.id === userId ? '#E50914' : '#fff'}}>{u.id}</div>
                                    <div style={{fontSize:'9px', color:'#555'}}>{u.agent}</div>
                                </div>
                                <div style={{display:'flex', gap:'5px'}}>
                                    <button onClick={()=>muteUser(u.id)} style={styles.btnMute}>MUTE</button>
                                    <button onClick={()=>banUser(u.id)} style={styles.btnBan}>BAN</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMNA 2: BLACKLIST */}
                <div style={styles.adminCol}>
                    <h3 style={{color:'#E50914'}}>🚫 BANEADOS</h3>
                    <div style={styles.adminScroll}>
                        {Object.keys(bannedUsers).map(id => (
                            <div key={id} style={styles.userItem}>
                                <span>{id}</span>
                                <button onClick={()=>unbanUser(id)} style={styles.btnUnban}>DESBANEAR</button>
                            </div>
                        ))}
                    </div>
                    <h3 style={{color:'#FFD700', marginTop:'20px'}}>👑 GESTIÓN PREMIUM</h3>
                    <form onSubmit={addPremium} style={{display:'flex', gap:'5px'}}>
                        <input value={newPuName} onChange={e=>setNewPuName(e.target.value)} style={styles.adminInput} placeholder="Nombre..." />
                        <button style={styles.addBtn}>+</button>
                    </form>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREMIUM USERS PÚBLICO */}
      {viewingPuList && (
        <div style={styles.modalBack} onClick={()=>setViewingPuList(false)}>
           <div style={styles.puListCard} onClick={e=>e.stopPropagation()}>
              <h1 style={{color: '#FFD700', letterSpacing: '10px', textAlign: 'center'}}>⚜️ ELITE ⚜️</h1>
              <div style={styles.puGrid}>
                 {premiumUsers.map((name, i) => (
                     <div key={i} style={styles.puNameItem}>{name}</div>
                 ))}
              </div>
              <button onClick={()=>setViewingPuList(false)} style={styles.puClose}>CERRAR</button>
           </div>
        </div>
      )}

      <footer style={styles.footer}>
        <div style={{display:'flex', gap:'20px'}}>
            <span>ESTADO: <span style={{color: '#00ff41'}}>NÚCLEO ACTIVO</span></span>
            <span>MI_ID: <b style={{color: '#fff'}}>{userId}</b></span>
        </div>
        <span>ALEX HUB V12 © 2024 | TOKEN: {generateCurrentToken()}</span>
      </footer>
    </div>
  );
}

// ==========================================
// ESTILOS DE ALTA GAMA (MASIVO)
// ==========================================
const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#080808', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center', boxShadow: '0 0 50px rgba(229,9,20,0.1)' },
  glitchTitle: { color: '#fff', fontSize: '35px', letterSpacing: '10px', margin: 0 },
  loginInput: { background: '#000', border: '1px solid #222', color: '#fff', padding: '18px', borderRadius: '12px', width: '280px', fontSize: '22px', textAlign: 'center', marginBottom: '20px', outline: 'none' },
  loginBtn: { width: '100%', padding: '18px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },

  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #111' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '22px', fontWeight: '900' },
  logoSub: { fontSize: '10px', color: '#E50914', display: 'block' },
  tabContainer: { display: 'flex', background: '#0a0a0a', padding: '5px', borderRadius: '15px', marginLeft: '30px' },
  tab: { background: 'none', border: 'none', color: '#444', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', border: 'none' },
  searchForm: { flex: 1, maxWidth: '500px', margin: '0 30px' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '12px 25px', borderRadius: '30px', color: '#fff', outline: 'none' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' },
  adminButton: { background: '#E50914', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', border: 'none', padding: '10px 20px', borderRadius: '25px', color: '#000', fontWeight: '900', cursor: 'pointer' },

  contentArea: { flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' },
  card: { background: '#080808', borderRadius: '20px', overflow: 'hidden', border: '1px solid #111', cursor: 'pointer', transition: '0.3s' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '20px' },
  videoTitle: { fontSize: '14px', fontWeight: 'bold', margin: 0, height: '40px', overflow: 'hidden' },

  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 },
  modalContentSmall: { background: '#080808', padding: '40px', borderRadius: '30px', border: '1px solid #E50914', textAlign: 'center' },
  adminPanelLarge: { background: '#050505', width: '90%', height: '85%', borderRadius: '40px', border: '2px solid #E50914', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminHeader: { background: '#111', padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, padding: '30px', gap: '30px' },
  adminCol: { background: '#0a0a0a', borderRadius: '20px', padding: '25px', display: 'flex', flexDirection: 'column' },
  adminScroll: { flex: 1, overflowY: 'auto', marginTop: '20px' },
  userItem: { background: '#050505', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnBan: { background: '#E50914', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' },
  btnMute: { background: '#FFD700', border: 'none', color: '#000', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' },
  btnUnban: { background: '#00ff41', border: 'none', color: '#000', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
  adminInput: { background: '#000', border: '1px solid #222', color: '#fff', padding: '10px', borderRadius: '8px', flex: 1 },
  addBtn: { background: '#FFD700', border: 'none', width: '40px', borderRadius: '8px', fontWeight: 'bold' },
  closeBtnSmall: { background: '#E50914', border: 'none', padding: '10px 20px', borderRadius: '10px', color: '#fff' },

  muteOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  muteBox: { textAlign: 'center', border: '5px solid #E50914', padding: '80px', borderRadius: '50px' },
  timer: { fontSize: '120px', fontWeight: '900', color: '#fff', textShadow: '0 0 30px #E50914' },
  
  puListCard: { background: '#000', border: '3px solid #FFD700', padding: '60px', borderRadius: '50px', width: '600px' },
  puGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '40px' },
  puNameItem: { background: '#0a0a0a', padding: '20px', borderRadius: '15px', textAlign: 'center', color: '#FFD700', fontSize: '20px', border: '1px solid #222' },
  puClose: { width: '100%', marginTop: '40px', background: 'none', border: '1px solid #FFD700', color: '#FFD700', padding: '15px', borderRadius: '15px', cursor: 'pointer' },

  fullscreenBlack: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: '50px', color: '#E50914', letterSpacing: '10px' },
  footer: { height: '50px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: '#444' },
  playerWrapper: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  fullIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '30px' },
  closeBtnVideo: { position: 'absolute', top: '-50px', right: 0, background: '#E50914', border: 'none', color: '#fff', padding: '10px 25px', borderRadius: '10px' },
  transitionOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// --- ANIMACIONES CSS ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .loader_spin { width: 60px; height: 60px; border: 5px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .card:hover { transform: translateY(-10px); border-color: #E50914; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #E50914; }
  `;
  document.head.appendChild(style);
}
