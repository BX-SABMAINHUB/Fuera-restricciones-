import React, { useState, useEffect } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURACIÓN FIREBASE ---
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

export default function AlexHubUltra() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  
  // Admin & UI States
  const [adminMode, setAdminMode] = useState('closed'); // 'closed', 'auth', 'panel'
  const [adminPass, setAdminPass] = useState('');
  const [activeUsers, setActiveUsers] = useState({});
  const [bannedList, setBannedList] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPuList, setShowPuList] = useState(false);

  // 1. GENERADOR DE TOKEN (IGUAL AL ORIGINAL PERO ESTABLE)
  const generateToken = () => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = '';
    for (let i = 0; i < 6; i++) {
      hash = (hash * 16807) % 2147483647;
      result += chars.charAt(Math.abs(hash) % chars.length);
    }
    return result;
  };

  // 2. SISTEMA DE IDENTIDAD Y BANEO REALTIME
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (!id) {
      id = 'ID-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      window.history.pushState(null, '', `?id=${id}`);
    }
    setUserId(id);

    // Registro en Firebase
    const presenceRef = ref(db, `online/${id}`);
    set(presenceRef, { id, lastSeen: serverTimestamp() });
    onDisconnect(presenceRef).remove();

    // Listeners Reales
    onValue(ref(db, `bans/${id}`), (snap) => setIsBanned(snap.exists()));
    onValue(ref(db, 'online'), (snap) => setActiveUsers(snap.val() || {}));
    onValue(ref(db, 'bans'), (snap) => setBannedList(snap.val() || {}));
    onValue(ref(db, 'premium_users'), (snap) => setPremiumUsers(snap.val() || []));
  }, []);

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (password.toUpperCase() === generateToken()) setAuthorized(true);
    else { alert("TOKEN INCORRECTO"); setPassword(''); }
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPass === 'Alex2706') { setAdminMode('panel'); setAdminPass(''); }
    else { alert("PASSWORD ADMIN INCORRECTA"); }
  };

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
      setSelectedVideo(null);
    } catch (err) { alert("Error de API"); }
    setLoading(false);
  };

  // --- RENDER ---
  if (isBanned) return (
    <div style={styles.banScreen}>
      <h1 style={{fontSize: '50px'}}>⚠️ ACCESO BLOQUEADO</h1>
      <p>Tu ID ({userId}) ha sido baneado permanentemente.</p>
    </div>
  );

  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="TOKEN DE 6 DÍGITOS" value={password} onChange={(e)=>setPassword(e.target.value)} style={styles.loginInput} />
          <button type="submit" style={styles.loginButton}>ENTRAR</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB ULTRA</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <form onSubmit={performSearch} style={styles.searchBox}>
          <input style={styles.searchInput} placeholder="Buscar contenido..." value={query} onChange={(e)=>setQuery(e.target.value)} />
        </form>

        <div style={{display: 'flex', gap: '10px'}}>
          <button onClick={() => setAdminMode('auth')} style={styles.adminBtn}>ADMIN</button>
          {premiumUsers.length > 0 && <button onClick={() => setShowPuList(true)} style={styles.premiumBadge}>👑 Premium Users</button>}
          <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
        </div>
      </nav>

      <main style={styles.contentArea}>
        <div style={styles.grid}>
          {selectedVideo ? (
            <div style={styles.playerWrapper}>
              <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
              <button onClick={() => setSelectedVideo(null)} style={styles.closeBtn}>VOLVER</button>
            </div>
          ) : (
            videos.map((v, i) => (
              <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                <img src={v.snippet.thumbnails.high.url} style={{width:'100%'}} />
                <p style={{padding:'10px', fontSize:'14px'}}>{v.snippet.title}</p>
              </div>
            ))
          )}
        </div>
      </main>

      {/* --- MODAL ADMIN (MUY TRABAJADO) --- */}
      {adminMode === 'auth' && (
        <div style={styles.modalBack} onClick={() => setAdminMode('closed')}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#FFD700', marginBottom: '20px'}}>SISTEMA DE CONTROL</h2>
            <form onSubmit={handleAdminAuth}>
              <input type="password" placeholder="CLAVE MAESTRA" autoFocus value={adminPass} onChange={e=>setAdminPass(e.target.value)} style={styles.loginInput} />
              <button type="submit" style={styles.loginButton}>DESBLOQUEAR</button>
            </form>
          </div>
        </div>
      )}

      {adminMode === 'panel' && (
        <div style={styles.modalBack}>
          <div style={styles.adminFrame}>
            <div style={styles.adminHeader}>
              <h2 style={{margin:0}}>ADMIN COMMAND CENTER V8.5</h2>
              <button onClick={() => setAdminMode('closed')} style={styles.closeBtn}>CERRAR PANEL</button>
            </div>
            <div style={styles.adminBody}>
              <div style={styles.adminSection}>
                <h3>🌐 ACTIVOS ({Object.keys(activeUsers).length})</h3>
                {Object.values(activeUsers).map(u => (
                  <div key={u.id} style={styles.adminRow}>
                    <span>{u.id}</span>
                    <button onClick={() => set(ref(db, `bans/${u.id}`), {t: Date.now()})} style={styles.banBtn}>BANEAR</button>
                  </div>
                ))}
              </div>
              <div style={styles.adminSection}>
                <h3>🚫 BANEADOS ({Object.keys(bannedList).length})</h3>
                {Object.keys(bannedList).map(id => (
                  <div key={id} style={styles.adminRow}>
                    <span style={{color: 'red'}}>{id}</span>
                    <button onClick={() => remove(ref(db, `bans/${id}`))} style={styles.unbanBtn}>QUITAR BAN</button>
                  </div>
                ))}
              </div>
              <div style={styles.adminSection}>
                <h3>⚙️ OPCIONES EXTRA</h3>
                <button onClick={() => set(ref(db, 'premium_users'), [...premiumUsers, prompt("Nombre Premium:")])} style={styles.loginButton}>+ AÑADIR PREMIUM</button>
                <button onClick={() => set(ref(db, 'premium_users'), [])} style={{...styles.loginButton, background: '#333'}}>LIMPIAR LISTA PREMIUM</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL PREMIUM --- */}
      {showPuList && (
        <div style={styles.modalBack} onClick={() => setShowPuList(false)}>
          <div style={styles.puModal}>
            <h1 style={{color:'#FFD700', textAlign:'center'}}>⚜️ PREMIUM USERS ⚜️</h1>
            {premiumUsers.map((u, i) => <div key={i} style={styles.puName}>{u}</div>)}
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>TOKEN ACTUAL: <b>{generateToken()}</b></span>
        <span>ID: {userId}</span>
        <span>STATUS: FIREBASE LIVE ✅</span>
      </footer>
    </div>
  );
}

const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center', boxShadow: '0 0 30px rgba(229,9,20,0.2)' },
  glitchText: { color: '#fff', fontSize: '28px', letterSpacing: '8px', marginBottom: '30px' },
  loginInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '20px', textAlign: 'center', outline: 'none' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #111' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '15px', display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '20px', fontWeight: 'bold' },
  logoSub: { fontSize: '10px', color: '#E50914' },
  tabContainer: { display: 'flex', background: '#111', borderRadius: '15px', padding: '5px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '12px' },
  
  searchBox: { flex: 1, maxWidth: '400px', margin: '0 20px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '12px 20px', borderRadius: '30px', outline: 'none' },
  
  adminBtn: { background: '#111', border: '1px solid #222', color: '#444', padding: '10px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold' },
  
  contentArea: { flex: 1, overflowY: 'auto', padding: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer' },
  playerWrapper: { gridColumn: '1/-1', height: '75vh', position: 'relative' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  closeBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
  
  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', border: '1px solid #333', textAlign: 'center' },
  
  adminFrame: { background: '#080808', width: '90%', height: '80%', border: '2px solid #FFD700', borderRadius: '20px', display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '20px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, gap: '1px', background: '#222' },
  adminSection: { background: '#080808', padding: '20px', overflowY: 'auto' },
  adminRow: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#0c0c0c', marginBottom: '5px', borderRadius: '5px' },
  banBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '5px', cursor: 'pointer' },
  unbanBtn: { background: '#00FF41', border: 'none', padding: '5px', fontWeight: 'bold' },
  
  puModal: { background: '#000', border: '2px solid #FFD700', padding: '50px', borderRadius: '40px', minWidth: '300px' },
  puName: { padding: '15px', textAlign: 'center', fontSize: '20px', borderBottom: '1px solid #111' },
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: '#333' },
  banScreen: { height: '100vh', background: '#000', color: '#f00', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }
};
