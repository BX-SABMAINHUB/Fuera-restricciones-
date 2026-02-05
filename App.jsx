import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CORE CONFIGURATION ---
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
const TOKEN_SOURCE_URL = "https://bx-sabmainhub.github.io/alex-codes/";

export default function AlexHubUltraV9() {
  // --- STATE MANAGEMENT (SECURITY) ---
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [tokenFromWeb, setTokenFromWeb] = useState('CARGANDO...');
  const [userId, setUserId] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  
  // --- STATE MANAGEMENT (ADMIN) ---
  const [adminMode, setAdminMode] = useState('closed'); // closed, auth, panel
  const [adminTab, setAdminTab] = useState('online');
  const [adminPass, setAdminPass] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({});
  const [bannedList, setBannedList] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  // --- STATE MANAGEMENT (APP) ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPuList, setShowPuList] = useState(false);
  const [twitchChannel, setTwitchChannel] = useState('rivers_gg');

  // 1. OBTENCIÓN DEL TOKEN DESDE TU WEB EXTERNA
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(TOKEN_SOURCE_URL);
        const text = await response.text();
        // Intentamos buscar un patrón de 6-8 caracteres que parezca un código
        const match = text.match(/[A-Z0-9!@#$%&*]{6,8}/);
        if (match) setTokenFromWeb(match[0]);
      } catch (e) {
        // Fallback: Generar el mismo token que tu web si falla el fetch
        const now = new Date();
        const seed = now.getHours().toString();
        setTokenFromWeb("ALEX" + seed); // Ejemplo de fallback
      }
    };
    fetchToken();
    const interval = setInterval(fetchToken, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  // 2. SISTEMA DE IDENTIDAD Y PRESENCIA (REALTIME)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (!id) {
      id = 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      window.history.pushState(null, '', `?id=${id}`);
    }
    setUserId(id);

    // Conectar a Firebase
    const myPresenceRef = ref(db, `online/${id}`);
    set(myPresenceRef, { 
        id, 
        lastSeen: serverTimestamp(), 
        userAgent: navigator.userAgent.substring(0, 50),
        status: 'browsing'
    });
    onDisconnect(myPresenceRef).remove();

    // Listeners Globales
    onValue(ref(db, `bans/${id}`), (snap) => { if (snap.exists()) setIsBanned(true); });
    onValue(ref(db, 'online'), (snap) => setOnlineUsers(snap.val() || {}));
    onValue(ref(db, 'bans'), (snap) => setBannedList(snap.val() || {}));
    onValue(ref(db, 'premium_users'), (snap) => setPremiumUsers(snap.val() || []));
    onValue(ref(db, 'logs'), (snap) => {
        const l = snap.val() ? Object.values(snap.val()) : [];
        setLogs(l.reverse().slice(0, 20));
    });
  }, []);

  // 3. FUNCIONES DE SEGURIDAD
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === tokenFromWeb || password === "Alex2706") { // Master bypass Alex2706
      setAuthorized(true);
      pushLog(`Usuario ${userId} ha iniciado sesión.`);
    } else {
      alert("TOKEN INVÁLIDO. Mira en: " + TOKEN_SOURCE_URL);
      pushLog(`Intento fallido de login con token: ${password}`);
    }
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPass === 'Alex2706') {
      setAdminMode('panel');
      pushLog("ADMIN ha accedido al Command Center.");
    } else {
      alert("ACCESO DENEGADO");
    }
  };

  const pushLog = (msg) => {
    const logRef = ref(db, 'logs/' + Date.now());
    set(logRef, { msg, time: new Date().toLocaleTimeString(), id: userId });
  };

  // 4. ACCIONES DE ADMINISTRACIÓN
  const actionBan = (tid) => {
    if (tid === userId) return;
    set(ref(db, `bans/${tid}`), { reason: "Admin Discretion", time: serverTimestamp() });
    pushLog(`USUARIO BANEADO: ${tid}`);
  };

  const actionUnban = (tid) => {
    remove(ref(db, `bans/${tid}`));
    pushLog(`USUARIO DESBANEADO: ${tid}`);
  };

  const actionKickAll = () => {
    Object.keys(onlineUsers).forEach(id => {
      if(id !== userId) actionBan(id);
    });
  };

  // 5. NAVEGACIÓN Y BÚSQUEDA
  const handleSearch = async (e) => {
    if(e) e.preventDefault();
    if(!query) return;
    setLoading(true);
    if(mode === 'youtube') {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      } catch (e) { alert("Error API YouTube"); }
    } else if (mode === 'twitch') {
        setTwitchChannel(query.replace(/\s/g, ''));
    }
    setLoading(false);
  };

  // --- VISTAS CONDICIONALES ---

  if (isBanned) return (
    <div style={styles.killSwitch}>
      <h1 style={styles.glitchText}>SYSTEM TERMINATED</h1>
      <p style={{color: '#555'}}>Tu ID {userId} ha sido incluido en la Blacklist global.</p>
      <div style={styles.redLine}></div>
    </div>
  );

  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <div style={styles.chip}>V9.0 ULTRA</div>
        <h1 style={styles.mainTitle}>ALEX<span style={{color:'#E50914'}}>HUB</span></h1>
        <p style={{color: '#444', fontSize: '12px', marginBottom: '20px'}}>ID: {userId}</p>
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="TOKEN DE LA WEB" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={styles.loginInput} 
          />
          <button type="submit" style={styles.loginButton}>DESBLOQUEAR NÚCLEO</button>
        </form>
        <a href={TOKEN_SOURCE_URL} target="_blank" style={styles.tokenLink}>Obtener Token aquí</a>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      {/* NAVBAR SUPERIOR */}
      <nav style={styles.navbar}>
        <div style={styles.navSection}>
          <div style={styles.logoBox}>
            <span style={{fontWeight:'900', fontSize:'22px'}}>ALEX</span>
            <span style={{color:'#E50914', fontSize:'10px', letterSpacing:'2px'}}>ULTRA CORE</span>
          </div>
          <div style={styles.tabGroup}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(t => (
              <button 
                key={t} 
                onClick={() => setMode(t)} 
                style={mode === t ? styles.activeTab : styles.tab}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearch} style={styles.searchContainer}>
          <input 
            placeholder={`Buscar en ${mode}...`} 
            style={styles.searchInput} 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>

        <div style={styles.navSection}>
          <button onClick={() => setShowPuList(true)} style={styles.premiumBtn}>💎 PREMIUM</button>
          <button onClick={() => window.location.href = "https://faria.managebac.com/login"} style={styles.panicBtn}>PÁNICO</button>
          <button onClick={() => setAdminMode('auth')} style={styles.adminTrigger}>.</button>
        </div>
      </nav>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main style={styles.mainContent}>
        {mode === 'youtube' && (
          <div style={styles.videoGrid}>
            {selectedVideo ? (
              <div style={styles.playerContainer}>
                <iframe 
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} 
                  style={styles.fullIframe} 
                  allowFullScreen 
                />
                <button onClick={() => setSelectedVideo(null)} style={styles.closePlayer}>CERRAR VÍDEO</button>
              </div>
            ) : (
              videos.map((v, i) => (
                <div key={i} style={styles.videoCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                  <div style={styles.thumbWrapper}>
                    <img src={v.snippet.thumbnails.high.url} style={styles.thumb} alt="thumb" />
                    <div style={styles.playOverlay}>▶</div>
                  </div>
                  <div style={styles.videoInfo}>
                    <p style={styles.videoTitle}>{v.snippet.title}</p>
                    <p style={styles.videoMeta}>{v.snippet.channelTitle}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {mode === 'twitch' && (
          <div style={styles.fullView}>
            <iframe 
              src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}`} 
              style={styles.fullIframe}
            />
          </div>
        )}

        {mode === 'movies' && (
          <div style={styles.fullView}>
            <iframe 
              src={`https://www.google.com/search?q=${encodeURIComponent(query)}+pelicula+completa+gratis&igu=1`} 
              style={styles.fullIframe}
            />
          </div>
        )}
      </main>

      {/* --- MODALES Y ADMINISTRACIÓN --- */}

      {/* AUTH ADMIN */}
      {adminMode === 'auth' && (
        <div style={styles.overlay} onClick={() => setAdminMode('closed')}>
          <div style={styles.modalSmall} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#E50914'}}>SYSTEM OVERRIDE</h2>
            <form onSubmit={handleAdminAuth}>
              <input 
                type="password" 
                placeholder="PASSWORD MAESTRA" 
                style={styles.loginInput} 
                autoFocus
                onChange={e => setAdminPass(e.target.value)}
              />
              <button style={styles.loginButton}>ENTRAR</button>
            </form>
          </div>
        </div>
      )}

      {/* PANEL ADMIN COMPLETO */}
      {adminMode === 'panel' && (
        <div style={styles.overlay}>
          <div style={styles.adminPanel}>
            <header style={styles.adminHeader}>
              <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
                <h2 style={{margin:0, color:'#E50914'}}>CORE ADMIN V9</h2>
                <div style={styles.adminTabs}>
                  {['online', 'blacklist', 'premium', 'logs'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setAdminTab(tab)}
                      style={adminTab === tab ? styles.adminTabActive : styles.adminTab}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setAdminMode('closed')} style={styles.closeAdmin}>CERRAR</button>
            </header>

            <div style={styles.adminBody}>
              {adminTab === 'online' && (
                <div style={styles.listContainer}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                    <h3>Usuarios Conectados ({Object.keys(onlineUsers).length})</h3>
                    <button onClick={actionKickAll} style={styles.dangerBtn}>BANEAR A TODOS</button>
                  </div>
                  {Object.values(onlineUsers).map(u => (
                    <div key={u.id} style={styles.listRow}>
                      <div>
                        <strong style={{color:'#E50914'}}>{u.id}</strong>
                        <span style={{fontSize:'10px', marginLeft:'10px', color:'#444'}}>{u.userAgent}</span>
                      </div>
                      <button onClick={() => actionBan(u.id)} style={styles.banBtnSmall}>BANEAR</button>
                    </div>
                  ))}
                </div>
              )}

              {adminTab === 'blacklist' && (
                <div style={styles.listContainer}>
                  <h3>Lista de Baneo ({Object.keys(bannedList).length})</h3>
                  {Object.keys(bannedList).map(id => (
                    <div key={id} style={styles.listRow}>
                      <span>{id}</span>
                      <button onClick={() => actionUnban(id)} style={styles.unbanBtn}>REMITIR</button>
                    </div>
                  ))}
                </div>
              )}

              {adminTab === 'logs' && (
                <div style={styles.logContainer}>
                  {logs.map((l, i) => (
                    <div key={i} style={styles.logItem}>
                      <span style={{color: '#555'}}>[{l.time}]</span> 
                      <span style={{color: '#E50914', margin:'0 10px'}}>{l.id}:</span> 
                      {l.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREMIUM (DORADO) */}
      {showPuList && (
        <div style={styles.overlay} onClick={() => setShowPuList(false)}>
          <div style={styles.premiumModal} onClick={e => e.stopPropagation()}>
            <h1 style={{color:'#FFD700', textAlign:'center', letterSpacing:'5px'}}>⚜️ ELITE USERS ⚜️</h1>
            <div style={styles.premiumList}>
              {premiumUsers.map((name, i) => (
                <div key={i} style={styles.premiumItem}>{name}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={{display:'flex', gap:'20px'}}>
          <span>STATUS: <span style={{color:'#00ff41'}}>ONLINE</span></span>
          <span>TOKEN: <span style={{color:'#fff'}}>{tokenFromWeb}</span></span>
        </div>
        <span>ALEX HUB V9.0 © 2024 | USER: {userId}</span>
      </footer>
    </div>
  );
}

// --- ESTILOS ULTRA CURRADOS ---
const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' },
  loginCard: { background: '#050505', padding: '50px', borderRadius: '40px', border: '1px solid #111', textAlign: 'center', width: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  mainTitle: { fontSize: '48px', color: '#fff', letterSpacing: '-2px', margin: '10px 0' },
  chip: { display: 'inline-block', background: '#E50914', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' },
  loginInput: { background: '#111', border: '1px solid #222', color: '#fff', padding: '15px', borderRadius: '15px', width: '100%', marginBottom: '20px', textAlign: 'center', outline: 'none', fontSize: '18px' },
  loginButton: { width: '100%', padding: '15px', background: '#fff', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', transition: '0.3s' },
  tokenLink: { color: '#333', fontSize: '12px', display: 'block', marginTop: '20px', textDecoration: 'none' },
  
  appContainer: { background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '70px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', zIndex: 100 },
  navSection: { display: 'flex', alignItems: 'center', gap: '20px' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '12px', display: 'flex', flexDirection: 'column' },
  tabGroup: { display: 'flex', background: '#111', padding: '4px', borderRadius: '12px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  
  searchContainer: { flex: 1, maxWidth: '500px', margin: '0 40px' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '10px 20px', borderRadius: '25px', color: '#fff', outline: 'none' },
  premiumBtn: { background: 'linear-gradient(to right, #FFD700, #DAA520)', border: 'none', padding: '8px 18px', borderRadius: '20px', color: '#000', fontWeight: 'bold', cursor: 'pointer' },
  panicBtn: { background: '#fff', color: '#000', border: 'none', padding: '8px 18px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  adminTrigger: { background: 'transparent', border: 'none', color: '#050505', cursor: 'default' },

  mainContent: { flex: 1, padding: '30px', overflowY: 'auto' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' },
  videoCard: { cursor: 'pointer', transition: '0.3s' },
  thumbWrapper: { position: 'relative', borderRadius: '15px', overflow: 'hidden', aspectRatio: '16/9' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  playOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', fontSize: '40px' },
  videoInfo: { marginTop: '12px' },
  videoTitle: { fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#eee' },
  videoMeta: { fontSize: '12px', color: '#555', marginTop: '5px' },

  playerContainer: { gridColumn: '1/-1', height: '80vh', position: 'relative', background: '#000', borderRadius: '20px', overflow: 'hidden' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  closePlayer: { position: 'absolute', top: '20px', right: '20px', background: '#E50914', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' },
  fullView: { width: '100%', height: '100%', background: '#000' },

  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalSmall: { background: '#050505', padding: '40px', borderRadius: '30px', border: '1px solid #111', width: '350px', textAlign: 'center' },
  adminPanel: { background: '#050505', width: '90%', height: '85%', borderRadius: '30px', border: '1px solid #111', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminHeader: { padding: '25px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminTabs: { display: 'flex', gap: '10px' },
  adminTab: { background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontWeight: 'bold' },
  adminTabActive: { background: 'none', border: 'none', color: '#E50914', cursor: 'pointer', fontWeight: 'bold' },
  adminBody: { flex: 1, padding: '30px', overflowY: 'auto' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  listRow: { background: '#0a0a0a', padding: '15px 25px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  banBtnSmall: { background: '#E50914', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' },
  dangerBtn: { background: '#E50914', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', color: '#fff' },
  logContainer: { fontFamily: 'monospace', fontSize: '12px' },
  logItem: { padding: '5px 0', borderBottom: '1px solid #111' },

  premiumModal: { background: '#000', border: '3px solid #FFD700', padding: '60px', borderRadius: '50px', width: '400px', boxShadow: '0 0 100px rgba(255,215,0,0.2)' },
  premiumList: { marginTop: '30px', textAlign: 'center' },
  premiumItem: { fontSize: '24px', padding: '15px', borderBottom: '1px solid #111', letterSpacing: '3px' },

  footer: { height: '40px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', fontSize: '10px', color: '#333' },
  killSwitch: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  redLine: { width: '100px', height: '2px', background: '#E50914', marginTop: '20px', boxShadow: '0 0 20px #E50914' },
  glitchText: { color: '#E50914', fontSize: '40px', letterSpacing: '10px' }
};

// CSS ANIMATIONS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .videoCard:hover img { transform: scale(1.05); transition: 0.5s; }
    .videoCard:hover .playOverlay { opacity: 1; }
  `;
  document.head.appendChild(style);
}
