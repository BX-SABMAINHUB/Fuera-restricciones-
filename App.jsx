import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURACIÓN REAL DE FIREBASE ---
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
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltraV11() {
  // --- ESTADOS DE SEGURIDAD E ID ---
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [muteStatus, setMuteStatus] = useState({ muted: false, time: 0 });
  
  // --- ESTADOS DE MODO Y CONTENIDO ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // --- ESTADOS DE ADMIN & PREMIUM ---
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [bannedList, setBannedList] = useState({});
  const [showPuList, setShowPuList] = useState(false);
  const [newPuName, setNewPuName] = useState('');

  // ==========================================
  // 1. GENERADOR DE TOKEN (SINCRO EXACTA)
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

  // ==========================================
  // 2. SISTEMA DE IDENTIDAD Y FIREBASE REALTIME
  // ==========================================
  useEffect(() => {
    // A) Generar o recuperar ID de la URL
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (!id) {
      id = 'USR-' + Math.random().toString(36).substr(2, 7).toUpperCase();
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + id;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setUserId(id);

    // B) Registro de Presencia
    const myRef = ref(db, `online/${id}`);
    set(myRef, { 
      id: id, 
      lastSeen: serverTimestamp(), 
      ua: navigator.userAgent.split(')')[0] + ')' 
    });
    onDisconnect(myRef).remove();

    // C) Listeners de Seguridad (Baneo y Mute)
    onValue(ref(db, `bans/${id}`), (snap) => { if(snap.exists()) setIsBanned(true); });
    onValue(ref(db, `mutes/${id}`), (snap) => {
      if(snap.exists()){
        const data = snap.val();
        if(Date.now() < data.until) {
            setMuteStatus({ muted: true, time: Math.ceil((data.until - Date.now()) / 60000) });
        } else {
            remove(ref(db, `mutes/${id}`));
            setMuteStatus({ muted: false, time: 0 });
        }
      } else {
        setMuteStatus({ muted: false, time: 0 });
      }
    });

    // D) Listeners Globales para Admin
    onValue(ref(db, 'online'), (s) => setOnlineUsers(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));
    onValue(ref(db, 'bans'), (s) => setBannedList(s.val() || {}));

  }, []);

  // ==========================================
  // 3. FUNCIONES DE ADMINISTRACIÓN REAL
  // ==========================================
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPass === 'Alex2706') {
      setAdminPanelOpen(true);
      setAdminAuthOpen(false);
      setAdminPass('');
    } else {
      alert("ACCESO DENEGADO - CLAVE INCORRECTA");
    }
  };

  const executeBan = (targetId) => {
    if(targetId === userId) return alert("No puedes banearte a ti mismo");
    set(ref(db, `bans/${targetId}`), { reason: "Admin Action", date: serverTimestamp() });
  };

  const executeUnban = (targetId) => {
    remove(ref(db, `bans/${targetId}`));
  };

  const executeMute = (targetId) => {
    const mins = prompt("Minutos de mute (1-59):", "10");
    if(mins) {
        const until = Date.now() + (parseInt(mins) * 60000);
        set(ref(db, `mutes/${targetId}`), { until });
    }
  };

  const addPremium = (e) => {
    e.preventDefault();
    if(newPuName.trim()){
        const updated = [...premiumUsers, newPuName];
        set(ref(db, 'premium_users'), updated);
        setNewPuName('');
    }
  };

  const removePremium = (idx) => {
    const updated = premiumUsers.filter((_, i) => i !== idx);
    set(ref(db, 'premium_users'), updated);
  };

  // ==========================================
  // 4. LÓGICA DE NAVEGACIÓN
  // ==========================================
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === generateCurrentToken() || password === 'Alex2706') setAuthorized(true);
    else { alert("TOKEN INVÁLIDO"); setPassword(''); }
  };

  const handleModeChange = (m) => {
    setTransitioning(true);
    setTimeout(() => { setMode(m); setTransitioning(false); }, 1500);
  };

  const performSearch = async (e) => {
    if(e) e.preventDefault();
    if(muteStatus.muted) return alert(`ESTÁS MUTEADO. Te quedan ${muteStatus.time} min.`);
    if(!query) return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
      setSelectedVideo(null);
    } catch (err) { alert("Error API"); }
    setLoading(false);
  };

  // ==========================================
  // 5. RENDERIZADO DE COMPONENTES
  // ==========================================
  
  if (isBanned) return (
    <div style={styles.blackout}>
      <h1 style={{fontSize: '50px', color: '#f00'}}>🚫 ACCESO RESTRINGIDO</h1>
      <p>Tu ID: {userId} ha sido baneado permanentemente.</p>
    </div>
  );

  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitch}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
        <p style={{fontSize: '10px', color: '#444', marginBottom: '20px'}}>ID ASIGNADO: {userId}</p>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="TOKEN DE ACCESO" value={password} onChange={e=>setPassword(e.target.value)} style={styles.loginInput} />
          <button type="submit" style={styles.loginBtn}>ENTRAR AL SISTEMA</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      {/* NAVEGACIÓN */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logo}>ALEX<span style={{color:'#E50914'}}>HUB</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={()=>handleModeChange(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
           {premiumUsers.length > 0 && (
             <button onClick={()=>setShowPuList(true)} style={styles.puButton}>👑 Premium Users</button>
           )}
           <form onSubmit={performSearch} style={styles.searchForm}>
             <input placeholder={muteStatus.muted ? "MUTEADO..." : "Buscar..."} disabled={muteStatus.muted} value={query} onChange={e=>setQuery(e.target.value)} style={styles.searchInput} />
           </form>
           <button onClick={()=>window.location.href=PANIC_URL} style={styles.panicBtn}>PÁNICO</button>
           <button onClick={()=>setAdminAuthOpen(true)} style={styles.adminTrigger}>ADMIN</button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main style={styles.content}>
        {transitioning && <div style={styles.loader}><div className="spin"></div></div>}
        
        {mode === 'youtube' && (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.player}>
                <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
                <button onClick={()=>setSelectedVideo(null)} style={styles.closeBtn}>CERRAR VÍDEO</button>
              </div>
            ) : (
              videos.map((v, i) => (
                <div key={i} style={styles.card} onClick={()=>setSelectedVideo(v.id.videoId)}>
                  <img src={v.snippet.thumbnails.high.url} style={styles.thumb} />
                  <div style={styles.cardBody}><p>{v.snippet.title}</p></div>
                </div>
              ))
            )}
          </div>
        )}

        {(mode === 'movies' || mode === 'xbox') && (
            <div style={styles.fullView}>
                <iframe src={mode === 'movies' ? `https://www.google.com/search?q=${query}+watch+free&igu=1` : "https://www.bing.com/search?q=site:xbox.com+fortnite&igu=1"} style={styles.fullIframe} />
            </div>
        )}
      </main>

      {/* --- MODAL AUTENTICACIÓN ADMIN --- */}
      {adminAuthOpen && (
        <div style={styles.overlay} onClick={()=>setAdminAuthOpen(false)}>
          <div style={styles.modal} onClick={e=>e.stopPropagation()}>
            <h2 style={{color: '#E50914'}}>ADMIN LOCK</h2>
            <form onSubmit={handleAdminLogin}>
              <input type="password" placeholder="CONTRASEÑA SECRETA" value={adminPass} onChange={e=>setAdminPass(e.target.value)} style={styles.loginInput} autoFocus />
              <button type="submit" style={styles.loginBtn}>VERIFICAR</button>
            </form>
          </div>
        </div>
      )}

      {/* --- PANEL DE ADMINISTRACIÓN REAL (EL TRABAJADO) --- */}
      {adminPanelOpen && (
        <div style={styles.overlay}>
          <div style={styles.adminPanel}>
            <div style={styles.adminHeader}>
              <h2>CORE CONTROL HUB V11</h2>
              <button onClick={()=>setAdminPanelOpen(false)} style={styles.closeBtn}>CERRAR PANEL</button>
            </div>
            <div style={styles.adminBody}>
              {/* SECCIÓN USUARIOS ONLINE */}
              <div style={styles.adminSection}>
                <h3>🟢 USUARIOS ACTIVOS ({Object.keys(onlineUsers).length})</h3>
                <div style={styles.scrollList}>
                  {Object.values(onlineUsers).map(u => (
                    <div key={u.id} style={styles.userRow}>
                      <div>
                        <strong style={{color: u.id === userId ? '#00ff41' : '#fff'}}>{u.id}</strong>
                        <div style={{fontSize:'9px', color:'#555'}}>{u.ua}</div>
                      </div>
                      <div style={{display:'flex', gap:'5px'}}>
                        <button onClick={()=>executeMute(u.id)} style={styles.muteBtnSmall}>MUTE</button>
                        <button onClick={()=>executeBan(u.id)} style={styles.banBtnSmall}>BAN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN BLACKLIST & PREMIUM */}
              <div style={styles.adminSection}>
                <h3>🚫 BLACKLIST ({Object.keys(bannedList).length})</h3>
                <div style={{...styles.scrollList, height: '150px'}}>
                   {Object.keys(bannedList).map(id => (
                     <div key={id} style={styles.userRow}>
                        <span>{id}</span>
                        <button onClick={()=>executeUnban(id)} style={styles.unbanBtn}>DESBANEAR</button>
                     </div>
                   ))}
                </div>
                
                <h3 style={{marginTop:'20px', color:'#FFD700'}}>⚜️ GESTIÓN PREMIUM</h3>
                <form onSubmit={addPremium} style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                   <input value={newPuName} onChange={e=>setNewPuName(e.target.value)} placeholder="Nombre..." style={styles.adminInput} />
                   <button type="submit" style={styles.addBtn}>+</button>
                </form>
                <div style={{...styles.scrollList, height: '150px'}}>
                   {premiumUsers.map((p, i) => (
                     <div key={i} style={styles.userRow}>
                        <span>{p}</span>
                        <button onClick={()=>removePremium(i)} style={styles.banBtnSmall}>ELIMINAR</button>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTA PREMIUM PÚBLICA */}
      {showPuList && (
        <div style={styles.overlay} onClick={()=>setShowPuList(false)}>
           <div style={styles.puModal} onClick={e=>e.stopPropagation()}>
              <h1 style={{color: '#FFD700', textAlign:'center'}}>⚜️ PREMIUM USERS ⚜️</h1>
              <div style={styles.puGrid}>
                {premiumUsers.map((u, i) => (
                    <div key={i} style={styles.puCard}>{u}</div>
                ))}
              </div>
              <button onClick={()=>setShowPuList(false)} style={styles.puClose}>CERRAR</button>
           </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>SISTEMA: V11-ARCHITECT ✅</span>
        <span>ID: <b style={{color:'#fff'}}>{userId}</b></span>
        <span>TOKEN: <b style={{color:'#fff'}}>{generateCurrentToken()}</b></span>
      </footer>
    </div>
  );
}

// ==========================================
// DISEÑO ULTRA CURRADO (ESTILOS)
// ==========================================
const styles = {
  app: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'monospace' },
  navbar: { height: '70px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', borderBottom: '1px solid #111' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '25px' },
  logo: { fontSize: '22px', fontWeight: '900', letterSpacing: '2px' },
  tabContainer: { display: 'flex', background: '#0a0a0a', padding: '5px', borderRadius: '10px' },
  tab: { background: 'none', border: 'none', color: '#444', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '8px 15px', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  puButton: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', border: 'none', padding: '10px 18px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', color:'#000' },
  searchForm: { width: '300px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '10px 15px', borderRadius: '20px', outline: 'none' },
  panicBtn: { background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  adminTrigger: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  content: { flex: 1, padding: '25px', overflowY: 'auto', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.3s' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardBody: { padding: '12px', fontSize: '13px', fontWeight: 'bold' },
  player: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  fullIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '15px' },
  closeBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', marginTop: '10px' },
  fullView: { height: '100%', background: '#000' },

  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', border: '1px solid #E50914', textAlign: 'center' },
  loginPage: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginCard: { background: '#080808', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center' },
  glitch: { fontSize: '30px', letterSpacing: '8px' },
  loginInput: { background: '#000', border: '1px solid #222', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', textAlign: 'center', fontSize: '20px', marginBottom: '20px', outline: 'none' },
  loginBtn: { display: 'block', width: '100%', background: '#E50914', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  adminPanel: { background: '#080808', width: '90%', height: '85%', borderRadius: '25px', border: '1px solid #E50914', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminHeader: { padding: '20px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '25px', flex: 1, overflowY: 'auto' },
  adminSection: { background: '#0c0c0c', padding: '20px', borderRadius: '15px', border: '1px solid #1a1a1a' },
  scrollList: { maxHeight: '400px', overflowY: 'auto', marginTop: '15px' },
  userRow: { background: '#050505', padding: '12px', borderRadius: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  banBtnSmall: { background: '#E50914', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer' },
  muteBtnSmall: { background: '#FFD700', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' },
  adminInput: { flex: 1, background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px' },
  addBtn: { background: '#FFD700', border: 'none', width: '40px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

  puModal: { background: '#000', border: '2px solid #FFD700', padding: '50px', borderRadius: '40px', width: '500px' },
  puGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '25px' },
  puCard: { background: '#0a0a0a', border: '1px solid #333', padding: '15px', textAlign: 'center', borderRadius: '10px', color: '#FFD700', fontWeight: 'bold' },
  puClose: { width: '100%', marginTop: '30px', background: 'none', border: '1px solid #FFD700', color: '#FFD700', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
  
  footer: { height: '40px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', fontSize: '10px', color: '#333' },
  blackout: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  loader: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .spin { width: 40px; height: 40px; border: 3px solid #111; border-top-color: #E50914; borderRadius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .card:hover { transform: translateY(-5px); border-color: #E50914; }
  `;
  document.head.appendChild(style);
}
