import React, { useState, useEffect, useRef } from 'react';
// IMPORTAMOS FIREBASE Y HERRAMIENTAS DE RED
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

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Referencias a la base de datos
const usersRef = ref(db, 'premium_users');
const activeUsersRef = ref(db, 'active_users'); // Gente conectada ahora
const bannedRef = ref(db, 'banned_users');     // Gente baneada

// CONFIGURACIÓN MAESTRA
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";
const ADMIN_PASS = "Alex2706"; // CONTRASEÑA MAESTRA

export default function AlexHubUltra() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [modal, setModal] = useState(null);

  // Estados del Panel Admin
  const [puMode, setPuMode] = useState('closed'); 
  const [puCode, setPuCode] = useState('');
  
  // Datos sincronizados
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [activeList, setActiveList] = useState({});
  const [bannedList, setBannedList] = useState({});
  const [newPuName, setNewPuName] = useState('');

  // Identidad del usuario actual
  const [myID, setMyID] = useState('');
  const [isBanned, setIsBanned] = useState(false);

  // --- 1. GESTIÓN DE IDENTIDAD Y PRESENCIA ---
  useEffect(() => {
    // A. Generar o recuperar ID único
    let storedID = localStorage.getItem('alex_user_id');
    if (!storedID) {
      storedID = 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      localStorage.setItem('alex_user_id', storedID);
    }
    setMyID(storedID);

    // Poner ID en la URL para que se vea
    const url = new URL(window.location);
    url.searchParams.set('uid', storedID);
    window.history.pushState({}, '', url);

    // B. Reportar presencia a Firebase (Soy activo)
    const myUserRef = ref(db, `active_users/${storedID}`);
    const connectedRef = ref(db, '.info/connected');

    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // Si me desconecto (cierro pestaña), borrame de la lista de activos
        onDisconnect(myUserRef).remove();
        // Estoy online ahora
        set(myUserRef, {
          id: storedID,
          last_seen: Date.now(),
          device: navigator.platform
        });
      }
    });

    // C. Escuchar si me banean
    onValue(ref(db, 'banned_users'), (snapshot) => {
      const bans = snapshot.val() || {};
      setBannedList(bans);
      if (bans[storedID]) {
        setIsBanned(true); // ¡ESTOY BANEADO!
      } else {
        setIsBanned(false);
      }
    });

    // D. Escuchar lista de Premium y Activos (Solo necesario si soy admin o para ver premium)
    onValue(usersRef, (s) => setPremiumUsers(s.val() || []));
    onValue(activeUsersRef, (s) => setActiveList(s.val() || {}));

  }, []);

  // --- 2. ACCIONES DE ADMINISTRADOR REAL ---
  
  const banUser = (userId) => {
    if (userId === myID) return alert("No te puedes banear a ti mismo, jefe.");
    // Añadir a la lista negra
    update(ref(db, 'banned_users'), {
      [userId]: true
    });
    alert(`Usuario ${userId} ha sido exterminado 🚫`);
  };

  const unbanUser = (userId) => {
    remove(ref(db, `banned_users/${userId}`));
    alert(`Usuario ${userId} perdonado.`);
  };

  const syncPremium = (newList) => {
    set(usersRef, newList);
  };

  const addPremiumUser = (e) => {
    e.preventDefault();
    if (newPuName.trim()) {
      const updated = [...premiumUsers, newPuName];
      syncPremium(updated); 
      setNewPuName('');
    }
  };

  const removePremiumUser = (index) => {
    const updated = premiumUsers.filter((_, i) => i !== index);
    syncPremium(updated);
  };

  // --- 3. LÓGICA GENERAL DE LA APP ---
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === generateCurrentToken()) setAuthorized(true);
    else { alert("TOKEN INVÁLIDO"); setPassword(''); }
  };

  const handlePuAuth = (e) => {
    e.preventDefault();
    if (puCode === ADMIN_PASS) { 
      setPuMode('admin'); 
      setPuCode(''); 
    } else { 
      alert("ACCESO DENEGADO: CÓDIGO INCORRECTO"); 
    }
  };

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

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setTransitioning(true);
    setTimeout(() => { setMode(newMode); setTransitioning(false); }, 3000);
  };

  // --- PANTALLA DE BANEO (SI ESTÁS BANEADO, SOLO VES ESTO) ---
  if (isBanned) {
    return (
      <div style={{
        background: 'black', height: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', color: 'red', fontFamily: 'monospace', zIndex: 99999
      }}>
        <h1 style={{fontSize: '50px', border: '5px solid red', padding: '20px'}}>🚫 ACCESS DENIED 🚫</h1>
        <p style={{marginTop: '20px', fontSize: '20px'}}>YOUR ID: {myID} HAS BEEN BANNED BY ADMINISTRATOR.</p>
        <p>Contact Alex for support.</p>
      </div>
    );
  }

  // --- RENDERIZADO DEL SISTEMA ADMIN ---
  const renderPuSystem = () => {
    if (puMode === 'closed') return null;

    // 1. LOGIN ADMIN
    if (puMode === 'auth') {
      return (
        <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#FFD700', textShadow: '0 0 10px #FFD700', textAlign:'center'}}>🔒 ADMIN ACCESS</h2>
            <p style={{color: '#555', textAlign:'center', fontSize:'12px'}}>SOLO PERSONAL AUTORIZADO</p>
            <form onSubmit={handlePuAuth} style={{marginTop: '20px'}}>
              <input type="password" value={puCode} onChange={e => setPuCode(e.target.value)} style={styles.loginInput} placeholder="CLAVE MAESTRA" />
              <button type="submit" style={{...styles.loginButton, background: '#111', border: '1px solid #FFD700', color: '#FFD700'}}>ENTRAR</button>
            </form>
          </div>
        </div>
      );
    }

    // 2. PANEL DE CONTROL REAL (DASHBOARD)
    if (puMode === 'admin') {
      const activeUserKeys = Object.keys(activeList);
      const bannedUserKeys = Object.keys(bannedList);

      return (
        <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
          <div style={{...styles.modalContent, border: '1px solid #FFD700', maxWidth: '800px', width: '95%'}} onClick={e => e.stopPropagation()}>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #333', paddingBottom:'10px'}}>
              <h2 style={{color: '#FFD700', margin:0}}>🛠️ GOD MODE PANEL</h2>
              <span style={{color: '#555', fontSize:'10px'}}>ADMIN ID: {myID}</span>
            </div>

            <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop:'20px'}}>
              
              {/* COLUMNA 1: USUARIOS ACTIVOS (Para Banear) */}
              <div style={styles.adminPanelCol}>
                <h3 style={{color: '#0f0'}}>🟢 ONLINE ({activeUserKeys.length})</h3>
                <div style={styles.listScroll}>
                  {activeUserKeys.map(uid => (
                    <div key={uid} style={styles.userRow}>
                      <span style={{color: uid === myID ? '#FFD700' : '#fff'}}>{uid} {uid === myID ? '(TÚ)' : ''}</span>
                      {uid !== myID && <button onClick={() => banUser(uid)} style={styles.banBtn}>BAN 🚫</button>}
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA 2: USUARIOS BANEADOS (Para Desbanear) */}
              <div style={styles.adminPanelCol}>
                <h3 style={{color: '#f00'}}>🔴 BANNED ({bannedUserKeys.length})</h3>
                <div style={styles.listScroll}>
                  {bannedUserKeys.map(uid => (
                    <div key={uid} style={styles.userRow}>
                      <span style={{color: '#888', textDecoration: 'line-through'}}>{uid}</span>
                      <button onClick={() => unbanUser(uid)} style={styles.unbanBtn}>REVIVE 😇</button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* SECCIÓN INFERIOR: PREMIUM USERS */}
            <div style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '10px'}}>
              <h3 style={{color: '#DAA520'}}>👑 GESTIÓN PREMIUM</h3>
              <div style={{display:'flex', gap:'10px', marginBottom: '10px'}}>
                 <input type="text" value={newPuName} onChange={e => setNewPuName(e.target.value)} style={{...styles.loginInput, flex:1, fontSize:'14px'}} placeholder="Nombre del nuevo Premium..." />
                 <button onClick={addPremiumUser} style={styles.addBtn}>AÑADIR</button>
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>
                {premiumUsers.map((u, i) => (
                  <span key={i} onClick={() => removePremiumUser(i)} style={styles.tagPremium}>{u} ✖</span>
                ))}
              </div>
            </div>

            <button onClick={() => setPuMode('closed')} style={{...styles.loginButton, marginTop: '20px'}}>CERRAR PANEL</button>
          </div>
        </div>
      );
    }

    // 3. LISTA PÚBLICA DE PREMIUM (Lo que ven los normales)
    if (puMode === 'list') {
      return (
        <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
           <div style={{...styles.modalContent, border: '2px solid #FFD700', background: 'black', boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)'}} onClick={e => e.stopPropagation()}>
              <h1 style={{color: '#FFD700', textAlign: 'center', fontSize: '30px', marginBottom: '20px'}}>⚜️ Premium Users ⚜️</h1>
              <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                {premiumUsers.map((user, idx) => (
                  <div key={idx} style={{padding: '10px', borderBottom: '1px solid #333', textAlign: 'center', color: '#fff', fontSize: '18px'}}>{user}</div>
                ))}
              </div>
              <button onClick={() => setPuMode('closed')} style={{...styles.loginButton, marginTop: '20px', background: 'transparent', border: '1px solid #FFD700', color: '#FFD700'}}>CERRAR</button>
           </div>
        </div>
      );
    }
  };

  const openModal = (type) => setModal(type);
  const renderModal = () => {
    if (!modal) return null;
    const info = {
      bx: { t: "About Bx Hub", c: "Sincronización total con redes de bypass escolar. Bx es el núcleo de la red Alex Hub." },
      creator: { t: "About Creator", c: "System Architect: Alex. ID Actual: " + myID },
      terms: { t: "Terms & Conditions", c: "Sistema monitoreado. Tu ID " + myID + " está siendo registrado en la base de datos de administración." },
      news: { t: "Latest News", c: "V7.0 ADMIN TOOLS: Ahora el administrador puede banear IDs en tiempo real." },
      help: { t: "Get Help", c: "Si has sido baneado, contacta al administrador." }
    };
    return (
      <div style={styles.modalBack} onClick={() => setModal(null)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{color: '#E50914', borderBottom: '1px solid #333', paddingBottom: '10px'}}>{info[modal].t}</h2>
          <p style={{fontSize: '14px', lineHeight: '1.8', color: '#ccc'}}>{info[modal].c}</p>
          <button onClick={() => setModal(null)} style={styles.loginButton}>ENTENDIDO</button>
        </div>
      </div>
    );
  };

  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <button onClick={() => openModal('creator')} style={{...styles.miniBtn, top: 20, left: 20}}>ABOUT CREATOR</button>
        <button onClick={() => openModal('terms')} style={{...styles.miniBtn, top: 20, right: 20}}>TERMS</button>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN DE 6 DÍGITOS" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ENTRAR</button>
          </form>
          <p style={{marginTop: '20px', color: '#333', fontSize: '10px'}}>YOUR ID: {myID}</p>
        </div>
        {renderModal()}
        {/* Botón Admin Secreto en Login */}
        <button onClick={() => setPuMode('auth')} style={{position:'absolute', bottom: 10, right: 10, background:'transparent', border:'none', color:'#111', cursor:'pointer'}}>π</button>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {transitioning && (
        <div style={styles.loaderWrap}>
          <div style={styles.spinner}></div>
          <p style={{marginTop: '20px', letterSpacing: '5px', color: '#E50914', fontWeight: 'bold'}}>CARGANDO {mode.toUpperCase()}...</p>
        </div>
      )}

      <button onClick={() => openModal('bx')} style={{...styles.miniBtn, bottom: 80, left: 20}}>About Bx</button>
      <button onClick={() => openModal('news')} style={{...styles.miniBtn, bottom: 80, right: 20}}>News</button>
      <button onClick={() => openModal('help')} style={{...styles.miniBtn, top: 90, right: 20}}>Help</button>
      
      {/* BOTÓN ADMIN PRINCIPAL */}
      <button onClick={() => setPuMode('auth')} style={{...styles.miniBtn, bottom: 30, left: 20, borderColor: '#FFD700', color: '#FFD700', background: 'rgba(0,0,0,0.5)'}}>
        ⚙️ ADMIN
      </button>

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB ULTRA</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => handleModeChange(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {premiumUsers.length > 0 && (
          <button onClick={() => setPuMode('list')} style={styles.premiumBadge}>👑 Premium Users</button>
        )}

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
        {mode === 'movies' && (
           <div style={styles.fullView}>
            <iframe src={`https://www.google.com/search?q=${encodeURIComponent(query)}+watch+online+free&igu=1`} style={styles.fullIframe} allowFullScreen />
          </div>
        )}
        {mode === 'twitch' && (
          <div style={styles.fullView}>
            <iframe src={`https://player.twitch.tv/?channel=${query.toLowerCase() || 'rivers_gg'}&parent=${window.location.hostname}&autoplay=true`} style={styles.fullIframe} />
          </div>
        )}
        {mode === 'xbox' && (
          <div style={styles.fullView}>
            <iframe src="https://www.bing.com/search?q=site:xbox.com+fortnite+play+now&igu=1" style={styles.fullIframe} />
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <span>SISTEMA: V7.0 ADMIN - ID: {myID}</span>
        <span>TOKEN ACTIVO: {generateCurrentToken()}</span>
      </footer>
      {renderModal()}
      {renderPuSystem()}
    </div>
  );
}

const styles = {
  // ESTILOS DE SIEMPRE
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', position:'relative' },
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
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', maxWidth: '500px', width: '90%', border: '1px solid #333' },
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: '#333' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  
  // NUEVOS ESTILOS PARA PANEL ADMIN
  adminPanelCol: { background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333' },
  listScroll: { maxHeight: '200px', overflowY: 'auto', marginTop: '10px' },
  userRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #222', fontSize: '12px' },
  banBtn: { background: '#E50914', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', padding: '2px 5px' },
  unbanBtn: { background: 'green', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', padding: '2px 5px' },
  addBtn: { background: '#DAA520', color: '#000', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  tagPremium: { background: '#222', color: '#DAA520', border: '1px solid #DAA520', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', cursor: 'pointer' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
