import React, { useState, useEffect, useRef } from 'react';
// IMPORTAMOS FIREBASE (Versión Web Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURACIÓN DE FIREBASE ---
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

// Inicializamos
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// REFERENCIAS A LA BASE DE DATOS
const usersRef = ref(db, 'premium_users');
const activeRef = ref(db, 'active_sessions');
const bannedRef = ref(db, 'banned_devices');

// CONFIGURACIÓN MAESTRA
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltra() {
  // ESTADOS DE USUARIO NORMAL
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [modal, setModal] = useState(null);

  // ESTADOS DE ADMIN Y SISTEMA
  const [adminOpen, setAdminOpen] = useState(false); // Abre el login de admin
  const [adminPanel, setAdminPanel] = useState(false); // Abre el panel real
  const [adminPassInput, setAdminPassInput] = useState('');
  
  // DATOS EN TIEMPO REAL
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [activeSessions, setActiveSessions] = useState({});
  const [bannedList, setBannedList] = useState({});
  const [myId, setMyId] = useState('');
  const [amIBanned, setAmIBanned] = useState(false);

  const [newPuName, setNewPuName] = useState('');

  // --- 1. SISTEMA DE IDENTIDAD Y PRESENCIA (LO HACE REAL) ---
  useEffect(() => {
    // A. Generar ID único para este dispositivo
    let vid = localStorage.getItem('alex_visitor_id');
    if (!vid) {
      vid = 'anon_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('alex_visitor_id', vid);
    }
    setMyId(vid);

    // B. Reportar presencia a Firebase (Para que el Admin vea que estás ONLINE)
    const mySessionRef = ref(db, `active_sessions/${vid}`);
    const deviceName = navigator.platform + " - " + (authorized ? "Authorized" : "Guest");
    
    // Escribir en la DB que estoy conectado
    set(mySessionRef, { 
      status: 'online', 
      lastSeen: Date.now(),
      device: deviceName,
      id: vid
    });

    // C. Si cierro la pestaña, borrarme de la lista de activos automáticamente
    onDisconnect(mySessionRef).remove();

    // D. Escuchar si me han baneado
    const unsubscribeBans = onValue(bannedRef, (snapshot) => {
      const bans = snapshot.val() || {};
      setBannedList(bans);
      if (bans[vid]) {
        setAmIBanned(true); // BOOM, bloqueado
      } else {
        setAmIBanned(false);
      }
    });

    // E. Escuchar Premium Users
    const unsubscribeUsers = onValue(usersRef, (snap) => setPremiumUsers(snap.val() || []));
    
    // F. Escuchar Sesiones Activas (Solo útil si eres admin, pero lo cargamos igual)
    const unsubscribeActive = onValue(activeRef, (snap) => setActiveSessions(snap.val() || {}));

    return () => {
      unsubscribeBans();
      unsubscribeUsers();
      unsubscribeActive();
    };
  }, [authorized]);

  // --- 2. FUNCIONES DE ADMIN (BANEAR/DESBANEAR) ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassInput === 'Alex2706') {
      setAdminPanel(true);
      setAdminOpen(false);
      setAdminPassInput('');
    } else {
      alert("ACCESO DENEGADO: Contraseña incorrecta");
    }
  };

  const banUser = (targetId) => {
    if (targetId === myId) { alert("No puedes banearte a ti mismo, genio."); return; }
    const targetRef = ref(db, `banned_devices/${targetId}`);
    set(targetRef, { since: Date.now(), reason: "Admin Ban" });
    alert(`Usuario ${targetId} BANEADO.`);
  };

  const unbanUser = (targetId) => {
    const targetRef = ref(db, `banned_devices/${targetId}`);
    remove(targetRef);
  };

  const syncPremium = (newList) => {
    set(usersRef, newList);
  };

  const addPremiumUser = (e) => {
    e.preventDefault();
    if (newPuName.trim()) {
      syncPremium([...premiumUsers, newPuName]);
      setNewPuName('');
    }
  };

  const removePremiumUser = (index) => {
    const updated = premiumUsers.filter((_, i) => i !== index);
    syncPremium(updated);
  };

  // --- 3. LOGICA NORMAL (Login, Youtube, etc) ---
  const generateCurrentToken = () => {
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
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === generateCurrentToken()) setAuthorized(true);
    else { alert("TOKEN INVÁLIDO"); setPassword(''); }
  };

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setTransitioning(true);
    setTimeout(() => { setMode(newMode); setTransitioning(false); }, 4000);
  };

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query || mode !== 'youtube') return;
    setLoading(true);
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) {
        setVideos(data.items.filter(v => v.id?.videoId));
        setSelectedVideo(null);
      }
    } catch (err) { alert("Error de conexión"); }
    setLoading(false);
  };

  // --- 4. RENDERIZADO DEL PANEL DE ADMIN ---
  const renderAdminPanel = () => {
    if (!adminPanel) return null;
    return (
      <div style={styles.modalBack} onClick={() => setAdminPanel(false)}>
        <div style={styles.adminDashboard} onClick={e => e.stopPropagation()}>
          <div style={styles.adminHeader}>
            <h2>🛡️ SYSTEM OVERLORD 🛡️</h2>
            <button onClick={() => setAdminPanel(false)} style={styles.closeBtn}>X</button>
          </div>
          
          <div style={styles.adminGrid}>
            {/* COLUMNA 1: USUARIOS ACTIVOS (LIVE) */}
            <div style={styles.adminCol}>
              <h3 style={{color: '#00ff00'}}>● LIVE USERS ({Object.keys(activeSessions).length})</h3>
              <div style={styles.listScroll}>
                {Object.keys(activeSessions).map(key => (
                  <div key={key} style={styles.userRow}>
                    <div>
                      <span style={{color: '#fff', fontSize: '12px'}}>{key}</span><br/>
                      <span style={{color: '#666', fontSize: '10px'}}>{activeSessions[key].device}</span>
                    </div>
                    {/* SI NO ESTA BANEADO, MOSTRAR BOTON BAN */}
                    {!bannedList[key] && (
                       <button onClick={() => banUser(key)} style={styles.banBtn}>BAN 🔨</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMNA 2: LISTA NEGRA (BANEADOS) */}
            <div style={styles.adminCol}>
              <h3 style={{color: '#ff0000'}}>☠️ BANNED ({Object.keys(bannedList).length})</h3>
              <div style={styles.listScroll}>
                {Object.keys(bannedList).map(key => (
                  <div key={key} style={styles.userRow}>
                    <span style={{color: '#ff4444', fontSize: '12px'}}>{key}</span>
                    <button onClick={() => unbanUser(key)} style={styles.unbanBtn}>UNBAN 😇</button>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMNA 3: PREMIUM USERS */}
            <div style={styles.adminCol}>
              <h3 style={{color: '#FFD700'}}>⚜️ PREMIUM LIST</h3>
              <div style={styles.listScroll}>
                {premiumUsers.map((u, i) => (
                  <div key={i} style={styles.userRow}>
                    <span style={{color: '#FFD700'}}>{u}</span>
                    <button onClick={() => removePremiumUser(i)} style={styles.miniDelBtn}>x</button>
                  </div>
                ))}
              </div>
              <form onSubmit={addPremiumUser} style={{marginTop: '10px', display: 'flex'}}>
                <input value={newPuName} onChange={e => setNewPuName(e.target.value)} placeholder="Nuevo nombre..." style={{width: '70%', background: '#222', border: 'none', color: '#fff', padding: '5px'}} />
                <button type="submit" style={{width: '30%', background: '#FFD700', border: 'none'}}>ADD</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 5. RENDERIZADO PANTALLA DE BANEADO ---
  if (amIBanned) {
    return (
      <div style={{height: '100vh', background: 'red', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'black', fontFamily: 'Impact'}}>
        <h1 style={{fontSize: '100px', margin: 0}}>BANNED</h1>
        <h2 style={{fontSize: '40px'}}>YOU HAVE BEEN BLOCKED BY ADMIN</h2>
        <p>ID: {myId}</p>
      </div>
    );
  }

  // --- 6. PANTALLA DE LOGIN NORMAL ---
  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <button onClick={() => setAdminOpen(true)} style={styles.adminTriggerBtn}>ADMIN</button>
        
        {/* MODAL LOGIN ADMIN */}
        {adminOpen && (
          <div style={styles.modalBack} onClick={() => setAdminOpen(false)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h2 style={{color: '#fff'}}>ADMIN LOGIN</h2>
              <form onSubmit={handleAdminLogin}>
                 <input type="password" autoFocus placeholder="Password" value={adminPassInput} onChange={e => setAdminPassInput(e.target.value)} style={styles.loginInput} />
                 <button type="submit" style={styles.loginButton}>ACCESS</button>
              </form>
            </div>
          </div>
        )}

        {renderAdminPanel()}

        <button onClick={() => setModal('terms')} style={{...styles.miniBtn, top: 20, right: 20}}>TERMS</button>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN DE 6 DÍGITOS" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ENTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  // --- 7. APP PRINCIPAL ---
  return (
    <div style={styles.appContainer}>
      {transitioning && <div style={styles.loaderWrap}><div style={styles.spinner}></div></div>}
      
      {/* BOTON ADMIN DISPONIBLE TAMBIEN DENTRO */}
      <button onClick={() => setAdminOpen(true)} style={styles.adminTriggerBtnFixed}>ADMIN</button>
      {renderAdminPanel()}

      {/* LOGIN DE ADMIN SI SE ACTIVA DESDE DENTRO */}
      {adminOpen && !adminPanel && (
          <div style={styles.modalBack} onClick={() => setAdminOpen(false)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h2 style={{color: '#fff'}}>ADMIN VERIFICATION</h2>
              <form onSubmit={handleAdminLogin}>
                 <input type="password" placeholder="Pass: Alex2706" value={adminPassInput} onChange={e => setAdminPassInput(e.target.value)} style={styles.loginInput} />
                 <button type="submit" style={styles.loginButton}>VERIFY</button>
              </form>
            </div>
          </div>
      )}

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB ULTRA</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => handleModeChange(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>
        {premiumUsers.length > 0 && <button style={styles.premiumBadge}>👑 Premium Active</button>}
        <form onSubmit={performSearch} style={styles.searchForm}>
          <input style={styles.searchInput} placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
        <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
      </nav>

      <main style={styles.contentArea}>
        {mode === 'youtube' && (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.playerWrapper}>
                <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
                <button onClick={() => setSelectedVideo(null)} style={styles.closeButton}>VOLVER</button>
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
        {mode === 'movies' && <div style={styles.fullView}><iframe src={`https://www.google.com/search?q=${encodeURIComponent(query)}+watch+online+free&igu=1`} style={styles.fullIframe} allowFullScreen /></div>}
        {mode === 'twitch' && <div style={styles.fullView}><iframe src={`https://player.twitch.tv/?channel=${query.toLowerCase() || 'rivers_gg'}&parent=${window.location.hostname}&autoplay=true`} style={styles.fullIframe} /></div>}
        {mode === 'xbox' && <div style={styles.fullView}><iframe src="https://www.bing.com/search?q=site:xbox.com+fortnite+play+now&igu=1" style={styles.fullIframe} /></div>}
      </main>

      <footer style={styles.footer}>
        <span>SISTEMA: V7.0 ADMIN EDITION | ID: {myId}</span>
        <span>TOKEN: {generateCurrentToken()}</span>
      </footer>
    </div>
  );
}

const styles = {
  // ESTILOS NUEVOS DE ADMIN
  adminTriggerBtn: { position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: '1px solid #333', color: '#555', padding: '5px 10px', cursor: 'pointer', fontSize: '10px' },
  adminTriggerBtnFixed: { position: 'fixed', bottom: '20px', left: '20px', background: '#000', border: '1px solid #333', color: '#555', padding: '5px 10px', cursor: 'pointer', fontSize: '10px', zIndex: 9000 },
  adminDashboard: { background: '#111', width: '90%', height: '80vh', maxWidth: '1000px', border: '2px solid #333', borderRadius: '10px', display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px rgba(0,0,0,0.8)' },
  adminHeader: { padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' },
  closeBtn: { background: 'red', color: 'white', border: 'none', padding: '5px 15px', cursor: 'pointer', fontWeight: 'bold' },
  adminGrid: { display: 'flex', flex: 1, overflow: 'hidden' },
  adminCol: { flex: 1, padding: '20px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column' },
  listScroll: { flex: 1, overflowY: 'auto', marginTop: '10px', background: '#000', padding: '10px', border: '1px solid #222' },
  userRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #111', paddingBottom: '5px' },
  banBtn: { background: '#500', color: '#fff', border: 'none', fontSize: '10px', padding: '2px 5px', cursor: 'pointer' },
  unbanBtn: { background: '#050', color: '#fff', border: 'none', fontSize: '10px', padding: '2px 5px', cursor: 'pointer' },
  miniDelBtn: { background: 'transparent', color: 'red', border: '1px solid red', cursor: 'pointer', fontSize: '10px', marginLeft: '10px' },

  // ESTILOS ORIGINALES
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center', boxShadow: '0 0 30px rgba(229,9,20,0.2)' },
  glitchText: { color: '#fff', fontSize: '28px', letterSpacing: '8px', marginBottom: '30px' },
  loginInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '20px', textAlign: 'center', outline: 'none' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', position: 'relative' },
  loaderWrap: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '60px', height: '60px', border: '4px solid #111', borderTop: '4px solid #E50914', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #222' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  logoBox: { display: 'flex', flexDirection: 'column', borderLeft: '4px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '20px', fontWeight: 'bold' },
  logoSub: { fontSize: '10px', color: '#E50914' },
  tabContainer: { display: 'flex', background: '#111', borderRadius: '15px', padding: '5px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' },
  searchForm: { flex: 1, maxWidth: '450px', margin: '0 30px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '12px 20px', borderRadius: '30px', outline: 'none' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' },
  contentArea: { flex: 1, overflowY: 'auto', padding: '25px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px' },
  videoTitle: { fontSize: '14px', fontWeight: 'bold' },
  fullView: { height: '100%', background: '#000', borderRadius: '20px', overflow: 'hidden' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  playerWrapper: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  closeButton: { position: 'absolute', top: '-40px', right: 0, background: '#E50914', color: '#fff', border: 'none', padding: '5px 20px', borderRadius: '5px' },
  miniBtn: { position: 'absolute', background: 'transparent', border: '1px solid #222', color: '#333', padding: '5px 12px', borderRadius: '20px', fontSize: '10px', cursor: 'pointer', zIndex: 100 },
  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 },
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', maxWidth: '500px', width: '90%', border: '1px solid #333', textAlign: 'center' },
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: '#333' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
