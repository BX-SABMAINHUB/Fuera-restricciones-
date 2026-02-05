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

const TOKEN_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjR-SeywMdcLkMW5_bzihToX9WNzyNyK7SQJCQhqS89g_KO5tiyQiKd_iZaO-V5DQuf0-TyXP9JVsn10q9ob87hmTOXwucU0zhFh9HNZMKYLuve8gpdEXQtVaW5u94H9oquoelINeqc8siVX-H537LvGvk2sBjWUz416XgXYnkB47cvO_q1dtycnVMG9fumc-uEfrGQLtsQkUbtAavz2KX9Ou5qux3ZGUTY6pgBUuDG2LSf-hjb23nMtSAi5g2fqMlNHdcKE7Vz6TyGjRoAli2j577bsw&lib=Mho2v4Pq3qduztqlJtfUfKp2DlgL227C5";
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltraV8() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [remoteToken, setRemoteToken] = useState('');
  const [userId, setUserId] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  
  // Admin States
  const [adminMode, setAdminMode] = useState('closed'); 
  const [adminPass, setAdminPass] = useState('');
  const [activeUsers, setActiveUsers] = useState({});
  const [bannedList, setBannedList] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [showPuList, setShowPuList] = useState(false);

  // App States
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. OBTENER TOKEN REAL DE LA WEB EXTERNA
  useEffect(() => {
    fetch(TOKEN_URL)
      .then(res => res.text())
      .then(data => {
        // Limpiamos el texto por si trae espacios o comillas
        const cleanToken = data.replace(/["\s]/g, '');
        setRemoteToken(cleanToken);
      })
      .catch(err => console.error("Error cargando Token remoto"));
  }, []);

  // 2. IDENTIDAD Y FIREBASE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (!id) {
      id = 'ALEX-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      const newUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
      window.history.pushState(null, '', newUrl);
    }
    setUserId(id);

    // Sync Presence & Bans
    const presenceRef = ref(db, `online/${id}`);
    set(presenceRef, { id, lastSeen: serverTimestamp() });
    onDisconnect(presenceRef).remove();

    onValue(ref(db, `bans/${id}`), (snap) => setIsBanned(snap.exists()));
    onValue(ref(db, 'online'), (snap) => setActiveUsers(snap.val() || {}));
    onValue(ref(db, 'bans'), (snap) => setBannedList(snap.val() || {}));
    onValue(ref(db, 'premium_users'), (snap) => setPremiumUsers(snap.val() || []));
  }, []);

  // --- FUNCIONES ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === remoteToken) setAuthorized(true);
    else { alert("TOKEN INCORRECTO. REVISA LA WEB DEL TOKEN."); setPassword(''); }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${query}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
      setSelectedVideo(null);
    } catch (err) { alert("Error en búsqueda"); }
    setLoading(false);
  };

  // Admin Actions
  const doBan = (id) => id !== userId && set(ref(db, `bans/${id}`), { bannedAt: serverTimestamp() });
  const doUnban = (id) => remove(ref(db, `bans/${id}`));
  const addPu = (name) => set(ref(db, 'premium_users'), [...premiumUsers, name]);

  if (isBanned) return <div style={styles.banPage}><h1>🚫 ACCESO DENEGADO (ID: {userId})</h1><p>Has sido expulsado por un administrador.</p></div>;

  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="TOKEN REMOTO" value={password} onChange={(e)=>setPassword(e.target.value)} style={styles.loginInput} />
          <button type="submit" style={styles.loginButton}>VALIDAR ACCESO</button>
        </form>
        <p style={{marginTop: '20px', color: '#222', fontSize: '10px'}}>ID: {userId}</p>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
           <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>ULTRA</span></div>
           <button onClick={() => setAdminMode('auth')} style={styles.adminLink}>ADMIN</button>
        </div>

        <div style={styles.tabContainer}>
          {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{display: 'flex', gap: '10px', flex: 1, maxWidth: '400px', margin: '0 20px'}}>
          <input 
            style={styles.searchInput} 
            placeholder="Buscar en YouTube..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </form>

        <div style={{display: 'flex', gap: '15px'}}>
          {premiumUsers.length > 0 && <button onClick={() => setShowPuList(true)} style={styles.premiumBadge}>👑 Premium</button>}
          <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
        </div>
      </nav>

      <main style={styles.contentArea}>
        {loading ? <div className="spinner"></div> : (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.playerWrap}>
                <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
                <button onClick={() => setSelectedVideo(null)} style={styles.closePlayer}>CERRAR</button>
              </div>
            ) : (
              videos.map((v, i) => (
                <div key={i} style={styles.videoCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                  <img src={v.snippet.thumbnails.high.url} style={{width: '100%'}} />
                  <p style={{padding: '10px', fontSize: '13px'}}>{v.snippet.title}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* MODAL ADMIN */}
      {adminMode === 'auth' && (
        <div style={styles.modalBack} onClick={() => setAdminMode('closed')}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#FFD700'}}>ADMIN LOGIN</h2>
            <input type="password" placeholder="CLAVE" onChange={e => setAdminPass(e.target.value)} style={styles.loginInput} />
            <button onClick={() => adminPass === 'Alex2706' ? setAdminMode('panel') : alert("ERROR")} style={styles.loginButton}>ACCEDER</button>
          </div>
        </div>
      )}

      {adminMode === 'panel' && (
        <div style={styles.modalBack}>
          <div style={styles.adminFrame}>
            <div style={styles.adminHeader}>
              <h2>COMMAND CENTER V8</h2>
              <button onClick={() => setAdminMode('closed')}>CERRAR</button>
            </div>
            <div style={styles.adminGrid}>
              <div style={styles.adminSection}>
                <h3>ACTIVOS ({Object.keys(activeUsers).length})</h3>
                {Object.values(activeUsers).map(u => (
                  <div key={u.id} style={styles.row}>
                    <span>{u.id}</span>
                    <button onClick={() => doBan(u.id)} style={styles.banBtn}>BAN</button>
                  </div>
                ))}
              </div>
              <div style={styles.adminSection}>
                <h3>BANEADOS</h3>
                {Object.keys(bannedList).map(id => (
                  <div key={id} style={styles.row}>
                    <span>{id}</span>
                    <button onClick={() => doUnban(id)} style={styles.unbanBtn}>QUITAR</button>
                  </div>
                ))}
              </div>
              <div style={styles.adminSection}>
                <h3>PREMIUM CONTROL</h3>
                <input type="text" placeholder="Nombre..." onKeyDown={e => e.key === 'Enter' && addPu(e.target.value)} style={styles.loginInput} />
                {premiumUsers.map((u, i) => <div key={i} style={styles.row}>{u}</div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREMIUM */}
      {showPuList && (
        <div style={styles.modalBack} onClick={() => setShowPuList(false)}>
           <div style={styles.puModal}>
              <h1 style={{color: '#FFD700', textAlign: 'center'}}>⚜️ PREMIUM USERS ⚜️</h1>
              {premiumUsers.map((u, i) => <div key={i} style={styles.puRow}>{u}</div>)}
           </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>ID: {userId} | TOKEN_REMOTO: {remoteToken ? 'CARGADO ✅' : 'CARGANDO...'}</span>
      </footer>
    </div>
  );
}

const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '50px', borderRadius: '30px', border: '1px solid #E50914', textAlign: 'center' },
  glitchText: { color: '#fff', fontSize: '30px', letterSpacing: '8px', marginBottom: '20px' },
  loginInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', textAlign: 'center', outline: 'none', width: '250px' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #111' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '15px', display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '20px', fontWeight: 'bold' },
  logoSub: { fontSize: '10px', color: '#E50914' },
  adminLink: { background: 'transparent', border: 'none', color: '#111', fontSize: '9px', cursor: 'pointer' },
  
  tabContainer: { display: 'flex', background: '#111', borderRadius: '15px', padding: '5px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '12px' },
  
  searchInput: { background: '#111', border: '1px solid #333', color: '#fff', padding: '10px 20px', borderRadius: '20px', width: '100%', outline: 'none' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold' },
  
  contentArea: { flex: 1, padding: '30px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  videoCard: { background: '#0a0a0a', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #111' },
  playerWrap: { gridColumn: '1/-1', height: '70vh', position: 'relative' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  closePlayer: { position: 'absolute', top: '-40px', right: 0, background: '#E50914', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: '5px' },

  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '20px', border: '1px solid #333' },
  
  adminFrame: { background: '#080808', width: '90%', height: '80%', border: '2px solid #FFD700', borderRadius: '20px', display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '20px', background: '#111', display: 'flex', justifyContent: 'space-between' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, gap: '1px', background: '#222' },
  adminSection: { background: '#080808', padding: '20px', overflowY: 'auto' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#0c0c0c', marginBottom: '5px' },
  banBtn: { background: '#E50914', border: 'none', color: '#fff', cursor: 'pointer' },
  unbanBtn: { background: '#00FF41', border: 'none' },

  puModal: { background: '#000', border: '2px solid #FFD700', padding: '50px', borderRadius: '40px' },
  puRow: { padding: '10px', textAlign: 'center', fontSize: '20px', borderBottom: '1px solid #111' },
  footer: { height: '30px', background: '#000', fontSize: '10px', color: '#222', display: 'flex', alignItems: 'center', padding: '0 30px' },
  banPage: { height: '100vh', background: '#000', color: '#f00', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }
};
