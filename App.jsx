import React, { useState, useEffect } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, push, onDisconnect, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// CONFIGURACIÓN MAESTRA
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltra() {
  // Estados Básicos
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [modal, setModal] = useState(null);
  const [myId, setMyId] = useState('');

  // Estados Admin & PU
  const [puMode, setPuMode] = useState('closed'); 
  const [puCode, setPuCode] = useState('');
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [newPuName, setNewPuName] = useState('');
  
  // Estados de Control Real (Admin)
  const [activeUsers, setActiveUsers] = useState({});
  const [bannedList, setBannedList] = useState({});
  const [isBanned, setIsBanned] = useState(false);
  const [muteUntil, setMuteUntil] = useState(0);

  // --- 1. GESTIÓN DE IDENTIDAD Y SEGURIDAD REAL ---
  useEffect(() => {
    // Generar o recuperar ID único
    let userId = localStorage.getItem('alexhub_id');
    if (!userId) {
      userId = 'USER-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      localStorage.setItem('alexhub_id', userId);
    }
    setMyId(userId);

    // Poner ID en la URL sin recargar
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + userId;
    window.history.pushState({path:newUrl},'',newUrl);

    // Sistema de presencia: Avisar a Firebase que estoy online
    const myPresenceRef = ref(db, `active_sessions/${userId}`);
    set(myPresenceRef, {
      id: userId,
      lastSeen: serverTimestamp(),
      status: 'online'
    });
    onDisconnect(myPresenceRef).remove();

    // Escuchar si me banean
    const banRef = ref(db, `banned/${userId}`);
    onValue(banRef, (snapshot) => {
      if (snapshot.exists()) setIsBanned(true);
    });

    // Escuchar si me mutean
    const muteRef = ref(db, `muted/${userId}`);
    onValue(muteRef, (snapshot) => {
      if (snapshot.exists()) setMuteUntil(snapshot.val());
    });

    // Escuchar Premium Users
    onValue(ref(db, 'premium_users'), (snapshot) => setPremiumUsers(snapshot.val() || []));

    // Escuchar Lista de Activos (Solo para el Admin)
    onValue(ref(db, 'active_sessions'), (snapshot) => setActiveUsers(snapshot.val() || {}));
    
    // Escuchar Lista de Baneados
    onValue(ref(db, 'banned'), (snapshot) => setBannedList(snapshot.val() || {}));

    // Escuchar Orden de Pánico Global
    onValue(ref(db, 'global_panic'), (snapshot) => {
      if (snapshot.val() === true) window.location.href = PANIC_URL;
    });

  }, []);

  // --- 2. LÓGICA DE ADMIN (ACCIONES REALES) ---
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (puCode === 'Alex2706') { setPuMode('admin_panel'); setPuCode(''); }
    else { alert("ACCESO DENEGADO"); }
  };

  const banUser = (targetId) => {
    if (targetId === myId) return alert("No puedes banearte a ti mismo");
    set(ref(db, `banned/${targetId}`), true);
    remove(ref(db, `active_sessions/${targetId}`));
  };

  const unbanUser = (targetId) => {
    remove(ref(db, `banned/${targetId}`));
  };

  const muteUser = (targetId, minutes) => {
    const until = Date.now() + (minutes * 60000);
    set(ref(db, `muted/${targetId}`), until);
  };

  const triggerGlobalPanic = () => {
    set(ref(db, 'global_panic'), true);
    setTimeout(() => set(ref(db, 'global_panic'), false), 5000);
  };

  // --- 3. LÓGICA DE NAVEGACIÓN ---
  const handleLogin = (e) => {
    e.preventDefault();
    const token = generateToken();
    if (password === token) setAuthorized(true);
    else { alert("TOKEN INCORRECTO"); setPassword(''); }
  };

  const generateToken = () => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    return Math.abs(hash).toString().substring(0, 6);
  };

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (Date.now() < muteUntil) return alert(`ESTÁS MUTEADO. Espera ${Math.ceil((muteUntil - Date.now())/60000)} min.`);
    if (!query || mode !== 'youtube') return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (err) { alert("Error API"); }
    setLoading(false);
  };

  // --- 4. RENDERIZADO DE MODALES ---
  const renderAdminPanel = () => {
    if (puMode !== 'admin_panel') return null;
    return (
      <div style={styles.modalBack}>
        <div style={{...styles.modalContent, maxWidth: '800px', border: '2px solid #FFD700'}}>
          <h2 style={{color: '#FFD700', textAlign:'center'}}>⚡ CENTRAL DE MANDO ULTRA (ADMIN) ⚡</h2>
          
          <div style={styles.adminGrid}>
            {/* Columna Usuarios Activos */}
            <div style={styles.adminSection}>
              <h3>ACTIVOS AHORA</h3>
              {Object.keys(activeUsers).map(uid => (
                <div key={uid} style={styles.userRow}>
                  <span>{uid} {uid === myId && "(TÚ)"}</span>
                  <div style={{display:'flex', gap:'5px'}}>
                    <button onClick={() => muteUser(uid, 5)} style={styles.muteBtn}>MUTE 5m</button>
                    <button onClick={() => banUser(uid)} style={styles.banBtn}>BAN</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Columna Baneados */}
            <div style={styles.adminSection}>
              <h3>LISTA NEGRA</h3>
              {Object.keys(bannedList).map(uid => (
                <div key={uid} style={styles.userRow}>
                  <span style={{color:'red'}}>{uid}</span>
                  <button onClick={() => unbanUser(uid)} style={styles.unbanBtn}>DESBANEAR</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginTop: '20px', display:'flex', gap:'10px', justifyContent:'center'}}>
            <button onClick={triggerGlobalPanic} style={styles.panicGlobalBtn}>🔥 PÁNICO GLOBAL (REDIRIGIR A TODOS)</button>
            <button onClick={() => setPuMode('closed')} style={styles.loginButton}>CERRAR CONSOLA</button>
          </div>
        </div>
      </div>
    );
  };

  const renderPuSystem = () => {
    if (puMode === 'closed') return null;
    if (puMode === 'auth') {
      return (
        <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#FFD700'}}>ADMIN PASSWORD</h2>
            <form onSubmit={handleAdminAuth}>
              <input type="password" value={puCode} onChange={e => setPuCode(e.target.value)} style={styles.loginInput} placeholder="********" autoFocus />
              <button type="submit" style={styles.loginButton}>ENTRAR AL SISTEMA</button>
            </form>
          </div>
        </div>
      );
    }
    if (puMode === 'list') {
      return (
        <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
           <div style={{...styles.modalContent, border: '2px solid #FFD700'}} onClick={e => e.stopPropagation()}>
              <h1 style={{color: '#FFD700', textAlign: 'center'}}>⚜️ PREMIUM USERS ⚜️</h1>
              <div style={styles.puListContainer}>
                {premiumUsers.map((user, idx) => (
                  <div key={idx} style={{padding: '10px', borderBottom: '1px solid #222', textAlign: 'center'}}>{user}</div>
                ))}
              </div>
              <button onClick={() => setPuMode('closed')} style={styles.loginButton}>CERRAR</button>
           </div>
        </div>
      );
    }
    return renderAdminPanel();
  };

  if (isBanned) return <div style={styles.banPage}><h1>ESTÁS BANEADO PERMANENTEMENTE</h1><p>ID: {myId}</p></div>;

  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN DIARIO" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ENTRAR</button>
          </form>
          <p style={{marginTop:'20px', fontSize:'10px', color:'#333'}}>TU ID: {myId}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {transitioning && <div style={styles.loaderWrap}><div style={styles.spinner}></div></div>}
      
      {/* BOTONES DE ACCESO RÁPIDO */}
      <button onClick={() => setPuMode('auth')} style={{...styles.miniBtn, bottom: 20, left: 20, color: '#FFD700'}}>ADMIN PANEL</button>

      <nav style={styles.navbar}>
        <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>V6.8</span></div>
        
        {premiumUsers.length > 0 && (
          <button onClick={() => setPuMode('list')} style={styles.premiumBadge}>👑 Premium Users</button>
        )}

        <form onSubmit={performSearch} style={styles.searchForm}>
          <input style={styles.searchInput} placeholder={muteUntil > Date.now() ? "SILENCIADO..." : "Buscar contenido..."} value={query} onChange={(e) => setQuery(e.target.value)} disabled={muteUntil > Date.now()} />
        </form>
        
        <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
      </nav>

      <main style={styles.contentArea}>
        <div style={styles.grid}>
          {selectedVideo ? (
            <div style={styles.playerWrapper}>
              <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
              <button onClick={() => setSelectedVideo(null)} style={styles.closeButton}>CERRAR</button>
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
      </main>

      <footer style={styles.footer}>
        <span>SISTEMA ULTRA ACTIVO</span>
        <span>ID SESIÓN: {myId}</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </footer>

      {renderPuSystem()}
    </div>
  );
}

// --- ESTILOS MEJORADOS ---
const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#050505', padding: '50px', borderRadius: '20px', border: '1px solid #E50914', textAlign: 'center' },
  glitchText: { color: '#fff', fontSize: '30px', letterSpacing: '5px', marginBottom: '20px' },
  loginInput: { background: '#000', border: '1px solid #222', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', textAlign: 'center', fontSize: '18px' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '12px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold' },
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '70px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #111' },
  logoBox: { lineHeight: '1' },
  logoMain: { fontSize: '24px', fontWeight: 'bold', color: '#fff' },
  logoSub: { fontSize: '10px', color: '#E50914', display: 'block' },
  searchForm: { flex: 1, maxWidth: '500px', margin: '0 20px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '10px 20px', borderRadius: '20px' },
  panicButton: { background: '#fff', color: '#000', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  contentArea: { flex: 1, overflowY: 'auto', padding: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#0a0a0a', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #111' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '10px' },
  videoTitle: { fontSize: '13px', fontWeight: 'bold', color: '#ccc' },
  footer: { height: '30px', background: '#000', display: 'flex', justifyContent: 'space-between', padding: '0 20px', alignItems: 'center', fontSize: '10px', color: '#333' },
  modalBack: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#050505', padding: '30px', borderRadius: '20px', width: '90%', border: '1px solid #222' },
  premiumBadge: { background: 'linear-gradient(to right, #FFD700, #b8860b)', color: '#000', padding: '8px 15px', borderRadius: '15px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  miniBtn: { position: 'fixed', background: 'none', border: '1px solid #222', fontSize: '10px', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  banPage: { background: 'red', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign:'center' },
  
  // ESTILOS ADMIN PANEL
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  adminSection: { background: '#0a0a0a', padding: '15px', borderRadius: '10px', border: '1px solid #222', maxHeight: '300px', overflowY: 'auto' },
  userRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111', fontSize: '12px' },
  banBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
  muteBtn: { background: '#444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
  unbanBtn: { background: '#28a745', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
  panicGlobalBtn: { background: 'orange', color: '#000', fontWeight: 'bold', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' },
  puListContainer: { maxHeight: '300px', overflowY: 'auto', margin: '20px 0' },
  playerWrapper: { gridColumn: '1/-1', position: 'relative', height: '70vh' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  closeButton: { position: 'absolute', top: '-30px', right: 0, color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
};
