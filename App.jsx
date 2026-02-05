import React, { useState, useEffect } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURACIÓN FIREBASE (LA TUYA REAL) ---
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

export default function AlexHubUltra() {
  // SEGURIDAD Y TOKEN
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  
  // ADMIN SYSTEM
  const [adminMode, setAdminMode] = useState('closed'); // closed, auth, panel
  const [adminPass, setAdminPass] = useState('');
  const [activeUsers, setActiveUsers] = useState({});
  const [bannedUsers, setBannedUsers] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);

  // APP STATES
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPuList, setShowPuList] = useState(false);

  // ==========================================
  // 1. GENERADOR DE TOKEN SINCRONIZADO (EL DE TU WEB)
  // ==========================================
  const getSyncedToken = () => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let result = '';
    let hash = 0;
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

  // ==========================================
  // 2. IDENTIDAD Y BANEO (FIREBASE)
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (!id) {
      id = 'ALEX-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      window.history.pushState(null, '', `?id=${id}`);
    }
    setUserId(id);

    // Registro Online
    const myRef = ref(db, `online/${id}`);
    set(myRef, { id, time: serverTimestamp() });
    onDisconnect(myRef).remove();

    // Listeners Reales
    onValue(ref(db, `bans/${id}`), (s) => { if(s.exists()) setIsBanned(true); });
    onValue(ref(db, 'online'), (s) => setActiveUsers(s.val() || {}));
    onValue(ref(db, 'bans'), (s) => setBannedUsers(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));
  }, []);

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === getSyncedToken() || password === 'Alex2706') setAuthorized(true);
    else { alert("TOKEN INVÁLIDO. REVISA LA WEB DE CÓDIGOS."); setPassword(''); }
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPass === 'Alex2706') { setAdminMode('panel'); setAdminPass(''); }
    else alert("CONTRASEÑA INCORRECTA");
  };

  const searchContent = async (e) => {
    if(e) e.preventDefault();
    if(!query) return;
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${query}&type=video&key=${YOUTUBE_API_KEY}`);
      const d = await r.json();
      setVideos(d.items || []);
      setSelectedVideo(null);
    } catch(e) { alert("Error API"); }
  };

  // --- RENDER ---
  if (isBanned) return <div style={styles.banPage}><h1>🚫 ACCESO DENEGADO</h1><p>ID: {userId} ha sido bloqueado.</p></div>;

  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitch}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
        <p style={{fontSize: '10px', color: '#444'}}>Sincronizado con bx-sabmainhub.github.io</p>
        <form onSubmit={handleLogin} style={{marginTop: '20px'}}>
          <input type="text" placeholder="TOKEN DE LA WEB" value={password} onChange={e=>setPassword(e.target.value)} style={styles.loginInput} />
          <button type="submit" style={styles.loginBtn}>CONECTAR AL CORE</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logo}>ALEX<span style={{color:'#E50914'}}>HUB</span></div>
          <div style={styles.tabs}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(t => (
              <button key={t} onClick={()=>setMode(t)} style={mode===t ? styles.tabActive : styles.tab}>{t.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <form onSubmit={searchContent} style={styles.searchBox}>
          <input placeholder="Buscar..." value={query} onChange={e=>setQuery(e.target.value)} style={styles.searchInput} />
        </form>

        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          {premiumUsers.length > 0 && <button onClick={()=>setShowPuList(true)} style={styles.premiumBadge}>👑 PREMIUM USERS</button>}
          <button onClick={()=>window.location.href='https://faria.managebac.com/login'} style={styles.panic}>PÁNICO</button>
          <button onClick={()=>setAdminMode('auth')} style={styles.adminDot}>.</button>
        </div>
      </nav>

      <main style={styles.content}>
        <div style={styles.grid}>
          {selectedVideo ? (
            <div style={styles.player}>
              <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
              <button onClick={()=>setSelectedVideo(null)} style={styles.closeBtn}>VOLVER</button>
            </div>
          ) : (
            videos.map((v, i) => (
              <div key={i} style={styles.card} onClick={()=>setSelectedVideo(v.id.videoId)}>
                <img src={v.snippet.thumbnails.high.url} style={{width:'100%'}} />
                <p style={{padding:'10px', fontSize:'13px'}}>{v.snippet.title}</p>
              </div>
            ))
          )}
        </div>
      </main>

      {/* --- PANEL ADMIN (LO QUE PEDISTE) --- */}
      {adminMode === 'auth' && (
        <div style={styles.overlay} onClick={()=>setAdminMode('closed')}>
          <div style={styles.modal} onClick={e=>e.stopPropagation()}>
            <h2 style={{color: '#E50914'}}>ADMIN LOGIN</h2>
            <form onSubmit={handleAdminAuth}>
              <input type="password" placeholder="CLAVE" autoFocus value={adminPass} onChange={e=>setAdminPass(e.target.value)} style={styles.loginInput} />
              <button style={styles.loginBtn}>ENTRAR</button>
            </form>
          </div>
        </div>
      )}

      {adminMode === 'panel' && (
        <div style={styles.overlay}>
          <div style={styles.adminPanel}>
            <div style={styles.adminHeader}>
              <h3>CONTROL DE MANDOS V9.5</h3>
              <button onClick={()=>setAdminMode('closed')} style={styles.closeBtn}>CERRAR</button>
            </div>
            <div style={styles.adminBody}>
              <div style={styles.adminSection}>
                <h4>🌐 USUARIOS ONLINE ({Object.keys(activeUsers).length})</h4>
                {Object.keys(activeUsers).map(id => (
                  <div key={id} style={styles.row}>
                    <span>{id} {id === userId && "(Tú)"}</span>
                    <button onClick={()=>set(ref(db, `bans/${id}`), {t: Date.now()})} style={styles.banBtn}>BAN</button>
                  </div>
                ))}
              </div>
              <div style={styles.adminSection}>
                <h4>🚫 BANEADOS ({Object.keys(bannedUsers).length})</h4>
                {Object.keys(bannedUsers).map(id => (
                  <div key={id} style={styles.row}>
                    <span>{id}</span>
                    <button onClick={()=>remove(ref(db, `bans/${id}`))} style={styles.unbanBtn}>DESBANEAR</button>
                  </div>
                ))}
              </div>
              <div style={styles.adminSection}>
                <h4>👑 PREMIUM CONTROL</h4>
                <button onClick={()=>{
                  const n = prompt("Nombre:");
                  if(n) set(ref(db, 'premium_users'), [...premiumUsers, n]);
                }} style={styles.loginBtn}>AÑADIR PREMIUM</button>
                <button onClick={()=>set(ref(db, 'premium_users'), [])} style={{...styles.loginBtn, background:'#333'}}>LIMPIAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREMIUM */}
      {showPuList && (
        <div style={styles.overlay} onClick={()=>setShowPuList(false)}>
          <div style={styles.puModal}>
            <h1 style={{color:'#FFD700', textAlign:'center'}}>⚜️ ELITE USERS ⚜️</h1>
            {premiumUsers.map((u, i) => <div key={i} style={styles.puName}>{u}</div>)}
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>TOKEN ACTUAL: <b style={{color:'#fff'}}>{getSyncedToken()}</b></span>
        <span>ID: {userId}</span>
        <span>V9.5 ULTRA</span>
      </footer>
    </div>
  );
}

const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#080808', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center', boxShadow: '0 0 40px rgba(229,9,20,0.2)' },
  glitch: { color: '#fff', fontSize: '32px', letterSpacing: '10px' },
  loginInput: { background: '#000', border: '1px solid #222', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '20px', textAlign: 'center', outline: 'none' },
  loginBtn: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  app: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '75px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #111' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
  logo: { fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  tabs: { display: 'flex', gap: '5px', background: '#111', padding: '5px', borderRadius: '12px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  tabActive: { background: '#E50914', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  searchBox: { flex: 1, maxWidth: '400px', margin: '0 20px' },
  searchInput: { width: '100%', background: '#111', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: '20px', outline: 'none' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  panic: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  adminDot: { background: 'transparent', border: 'none', color: '#080808', cursor: 'default' },
  content: { flex: 1, padding: '30px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer' },
  player: { gridColumn: '1/-1', height: '75vh', position: 'relative' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  closeBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', border: '1px solid #333', textAlign: 'center' },
  adminPanel: { background: '#080808', width: '90%', height: '80%', borderRadius: '20px', border: '2px solid #FFD700', display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, padding: '20px', gap: '20px' },
  adminSection: { background: '#0c0c0c', padding: '15px', borderRadius: '10px' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', background: '#111', borderRadius: '5px' },
  banBtn: { background: '#E50914', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
  unbanBtn: { background: '#00FF41', border: 'none', color: '#000', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  puModal: { background: '#000', border: '2px solid #FFD700', padding: '60px', borderRadius: '40px' },
  puName: { fontSize: '22px', padding: '15px', textAlign: 'center', borderBottom: '1px solid #111' },
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: '#333' },
  banPage: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f00' }
};
