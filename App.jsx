import React, { useState, useEffect, useRef } from 'react';
// IMPORTAMOS FIREBASE COMPLETO (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, onDisconnect, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// INICIALIZACIÓN
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// REFERENCIAS A LA BASE DE DATOS
const usersRef = ref(db, 'premium_users');
const onlineRef = ref(db, 'online_sessions'); // Aquí veremos quién está conectado
const bannedRef = ref(db, 'banned_ids');      // Lista negra real

// API KEYS Y URLS
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltra() {
  // ESTADOS DEL SISTEMA
  const [myID, setMyID] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [modal, setModal] = useState(null);

  // ESTADOS DEL ADMIN SYSTEM
  const [puMode, setPuMode] = useState('closed'); // 'closed', 'auth', 'panel'
  const [puCode, setPuCode] = useState('');
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [bannedList, setBannedList] = useState({});
  const [newPuName, setNewPuName] = useState('');
  const [adminTab, setAdminTab] = useState('users'); // 'users', 'bans', 'system'

  // --- 1. GENERACIÓN DE IDENTIDAD ÚNICA Y SISTEMA DE PRESENCIA ---
  useEffect(() => {
    // 1. Recuperar o Crear ID único para este dispositivo
    let storedID = localStorage.getItem('alexhub_uid');
    if (!storedID) {
      storedID = 'USR-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      localStorage.setItem('alexhub_uid', storedID);
    }
    setMyID(storedID);

    // 2. Reportarse como "En Línea" a Firebase
    const mySessionRef = ref(db, `online_sessions/${storedID}`);
    set(mySessionRef, {
      id: storedID,
      status: 'active',
      lastSeen: Date.now(),
      device: navigator.platform
    });

    // 3. Si cierra la pestaña, Firebase lo borra automáticamente (Magia de onDisconnect)
    onDisconnect(mySessionRef).remove();

    // 4. Chequear si estoy baneado en tiempo real
    const myBanRef = ref(db, `banned_ids/${storedID}`);
    onValue(myBanRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsBanned(true); // BAM! Bloqueo inmediato
      } else {
        setIsBanned(false);
      }
    });

  }, []);

  // --- 2. ESCUCHAS DE ADMIN (SOLO SI ERES ADMIN CARGA ESTOS DATOS) ---
  useEffect(() => {
    if (puMode === 'admin') {
      // Escuchar usuarios online
      onValue(onlineRef, (snap) => setOnlineUsers(snap.val() || {}));
      // Escuchar lista de baneados
      onValue(bannedRef, (snap) => setBannedList(snap.val() || {}));
      // Escuchar usuarios premium
      onValue(usersRef, (snap) => setPremiumUsers(snap.val() || []));
    }
  }, [puMode]);

  // --- LOGICA DEL ADMIN ---
  const handlePuAuth = (e) => {
    e.preventDefault();
    if (puCode === 'Alex2706') { 
      setPuMode('admin'); 
      setPuCode(''); 
    } else { 
      alert("ACCESO DENEGADO: CÓDIGO INCORRECTO"); 
    }
  };

  const banUser = (targetID) => {
    if (targetID === myID) return alert("No te puedes banear a ti mismo, jefe.");
    if (window.confirm(`¿Seguro que quieres BANEAR a ${targetID}? Perderá acceso inmediato.`)) {
      set(ref(db, `banned_ids/${targetID}`), {
        bannedAt: Date.now(),
        reason: "Admin Action"
      });
      // Opcional: Echarlo de la lista de online
      remove(ref(db, `online_sessions/${targetID}`));
    }
  };

  const unbanUser = (targetID) => {
    remove(ref(db, `banned_ids/${targetID}`));
  };

  const addPremiumUser = (e) => {
    e.preventDefault();
    if (newPuName.trim()) {
      const updated = [...premiumUsers, newPuName];
      set(usersRef, updated);
      setNewPuName('');
    }
  };

  const removePremiumUser = (index) => {
    const updated = premiumUsers.filter((_, i) => i !== index);
    set(usersRef, updated);
  };

  // --- LÓGICA GENERAL DE LA APP ---
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

  // --- PANTALLA DE BANEO (LO QUE VE LA VÍCTIMA) ---
  if (isBanned) {
    return (
      <div style={{...styles.loginPage, background: '#1a0000', color: 'red'}}>
        <div style={{border: '4px solid red', padding: '50px', borderRadius: '20px', textAlign: 'center', background: '#000'}}>
          <h1 style={{fontSize: '50px'}}>🚫 ACCESO DENEGADO 🚫</h1>
          <p style={{color: '#fff', fontSize: '20px'}}>TU ID ({myID}) HA SIDO BANEADO PERMANENTEMENTE POR EL ADMINISTRADOR.</p>
          <p style={{color: '#666'}}>No intentes recargar, el sistema te reconoce.</p>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO DEL PANEL DE ADMIN REAL ---
  const renderAdminPanel = () => {
    if (puMode !== 'admin') return null;
    
    return (
      <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
        <div style={{...styles.modalContent, border: '1px solid #00FF00', maxWidth: '800px', width: '95%', background: '#050505'}} onClick={e => e.stopPropagation()}>
          
          {/* HEADER DEL ADMIN */}
          <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px'}}>
            <h2 style={{color: '#00FF00', margin: 0, fontFamily: 'monospace'}}>🟢 ADMIN_CONSOLE_V2.0</h2>
            <span style={{color: '#555'}}>MASTER KEY: AUTHENTICATED</span>
          </div>

          {/* TABS DE NAVEGACIÓN */}
          <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
            <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.adminTabActive : styles.adminTab}>ACTIVOS ({Object.keys(onlineUsers).length})</button>
            <button onClick={() => setAdminTab('bans')} style={adminTab === 'bans' ? styles.adminTabActive : styles.adminTab}>BANEADOS ({Object.keys(bannedList).length})</button>
            <button onClick={() => setAdminTab('premium')} style={adminTab === 'premium' ? styles.adminTabActive : styles.adminTab}>PREMIUM DB</button>
          </div>

          {/* CONTENIDO DE LOS TABS */}
          <div style={{height: '300px', overflowY: 'auto', background: '#000', border: '1px solid #222', padding: '10px', fontFamily: 'monospace'}}>
            
            {/* TAB 1: USUARIOS ONLINE REALES */}
            {adminTab === 'users' && (
              <div>
                {Object.keys(onlineUsers).length === 0 && <p style={{color:'#444'}}>Escaneando red... No hay usuarios extra.</p>}
                {Object.values(onlineUsers).map((u, i) => (
                  <div key={i} style={styles.userRow}>
                    <div>
                      <span style={{color: u.id === myID ? '#00FF00' : '#fff'}}>👤 {u.id} {u.id === myID ? '(TÚ)' : ''}</span>
                      <br/><span style={{fontSize:'10px', color: '#666'}}>Platform: {u.device}</span>
                    </div>
                    {u.id !== myID && (
                      <button onClick={() => banUser(u.id)} style={styles.banBtn}>☠️ BANEAR IP</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: LISTA DE BANEADOS */}
            {adminTab === 'bans' && (
              <div>
                {Object.keys(bannedList).length === 0 && <p style={{color:'#444'}}>La lista negra está limpia.</p>}
                {Object.keys(bannedList).map((bid, i) => (
                  <div key={i} style={styles.userRow}>
                    <span style={{color: 'red'}}>🚫 {bid}</span>
                    <button onClick={() => unbanUser(bid)} style={styles.unbanBtn}>PERDONAR</button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: GESTIÓN PREMIUM */}
            {adminTab === 'premium' && (
               <div>
                  <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                    <input value={newPuName} onChange={e => setNewPuName(e.target.value)} placeholder="Nuevo nombre VIP" style={styles.adminInput} />
                    <button onClick={addPremiumUser} style={styles.addBtn}>AÑADIR</button>
                  </div>
                  {premiumUsers.map((user, idx) => (
                    <div key={idx} style={styles.userRow}>
                      <span style={{color: 'gold'}}>👑 {user}</span>
                      <button onClick={() => removePremiumUser(idx)} style={styles.deleteBtn}>X</button>
                    </div>
                  ))}
               </div>
            )}
          </div>

          <div style={{marginTop: '20px', textAlign: 'right'}}>
            <button onClick={() => setPuMode('closed')} style={{background: 'none', border: '1px solid #00FF00', color: '#00FF00', padding: '10px 20px', cursor: 'pointer'}}>CERRAR SESIÓN</button>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER NORMAL ---
  if (!authorized) {
    return (
      <div style={styles.loginPage}>
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

  return (
    <div style={styles.appContainer}>
      {transitioning && (
        <div style={styles.loaderWrap}>
          <div style={styles.spinner}></div>
          <p style={{marginTop: '20px', letterSpacing: '5px', color: '#E50914', fontWeight: 'bold'}}>CARGANDO {mode.toUpperCase()}...</p>
        </div>
      )}

      {/* BOTÓN ADMIN SECRETO */}
      <button onClick={() => setPuMode('auth')} style={styles.adminTrigger}>
        ADMIN PANEL
      </button>

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB ULTRA</span></div>
          {/* ID DEL USUARIO EN LA NAVBAR */}
          <div style={styles.idBadge}>ID: {myID} <span style={styles.onlineDot}></span></div>
          
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => handleModeChange(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {premiumUsers.length > 0 && (
          <button onClick={() => setModal('premiumList')} style={styles.premiumBadge}>👑 Premium</button>
        )}

        <form onSubmit={performSearch} style={styles.searchForm}>
          <input style={styles.searchInput} placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
        <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
      </nav>

      <main style={styles.contentArea}>
        {/* LÓGICA DE VIDEOS IGUAL QUE ANTES */}
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
          <div style={styles.fullView}><iframe src={`https://www.google.com/search?q=${encodeURIComponent(query)}+watch+online+free&igu=1`} style={styles.fullIframe} allowFullScreen /></div>
        )}
        {mode === 'twitch' && (
          <div style={styles.fullView}><iframe src={`https://player.twitch.tv/?channel=${query.toLowerCase() || 'rivers_gg'}&parent=${window.location.hostname}&autoplay=true`} style={styles.fullIframe} /></div>
        )}
        {mode === 'xbox' && (
          <div style={styles.fullView}><iframe src="https://www.bing.com/search?q=site:xbox.com+fortnite+play+now&igu=1" style={styles.fullIframe} /></div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <span>SYSTEM ID: {myID} - CONEXIÓN SEGURA</span>
        <span>TOKEN: {generateCurrentToken()}</span>
      </footer>

      {/* MODAL DE AUTENTICACIÓN ADMIN */}
      {puMode === 'auth' && (
        <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
           <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
             <h2 style={{color: '#fff'}}>🔒 SEGURIDAD DE NIVEL 5</h2>
             <p style={{color: '#666'}}>Introduce la llave maestra.</p>
             <form onSubmit={handlePuAuth}>
               <input type="password" value={puCode} onChange={e => setPuCode(e.target.value)} style={styles.loginInput} placeholder="PASSWORD" />
               <button type="submit" style={styles.loginButton}>ACCEDER</button>
             </form>
           </div>
        </div>
      )}

      {/* MODAL LISTA PREMIUM PÚBLICA */}
      {modal === 'premiumList' && (
        <div style={styles.modalBack} onClick={() => setModal(null)}>
          <div style={{...styles.modalContent, background: '#000', border: '1px solid gold'}} onClick={e => e.stopPropagation()}>
            <h2 style={{color: 'gold', textAlign: 'center'}}>👑 USUARIOS VIP 👑</h2>
            <div style={{textAlign: 'center', color: '#fff'}}>
              {premiumUsers.map(u => <div key={u} style={{padding:'5px'}}>{u}</div>)}
            </div>
            <button onClick={() => setModal(null)} style={{...styles.loginButton, background:'transparent', border:'1px solid gold', color:'gold'}}>CERRAR</button>
          </div>
        </div>
      )}

      {/* RENDERIZAR PANEL DE ADMIN SI ESTÁ ABIERTO */}
      {renderAdminPanel()}

    </div>
  );
}

// ESTILOS MEJORADOS
const styles = {
  // ... (Tus estilos anteriores se mantienen, aquí añado los nuevos para el Admin)
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
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', maxWidth: '500px', width: '90%', border: '1px solid #333' },
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: '#333' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  
  // NUEVOS ESTILOS PARA ADMIN
  adminTrigger: { position: 'absolute', bottom: '20px', left: '20px', background: '#000', color: '#333', border: '1px solid #333', padding: '5px 10px', fontSize: '10px', cursor: 'pointer', zIndex: 9000 },
  adminTab: { background: '#111', color: '#888', border: 'none', padding: '10px 20px', cursor: 'pointer', fontFamily: 'monospace' },
  adminTabActive: { background: '#00FF00', color: '#000', border: 'none', padding: '10px 20px', fontWeight: 'bold', fontFamily: 'monospace' },
  userRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #222', fontFamily: 'monospace' },
  banBtn: { background: '#ff0000', color: '#fff', border: 'none', fontSize: '10px', padding: '5px 10px', cursor: 'pointer' },
  unbanBtn: { background: '#00FF00', color: '#000', border: 'none', fontSize: '10px', padding: '5px 10px', cursor: 'pointer' },
  adminInput: { background: '#222', border: '1px solid #444', color: '#fff', padding: '5px' },
  addBtn: { background: 'gold', color: '#000', border: 'none', padding: '5px 10px', fontWeight: 'bold', cursor: 'pointer' },
  deleteBtn: { background: '#333', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer' },
  idBadge: { background: '#222', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', color: '#aaa', marginLeft: '15px', display: 'flex', alignItems: 'center', gap: '5px' },
  onlineDot: { width: '8px', height: '8px', background: '#00FF00', borderRadius: '50%', boxShadow: '0 0 5px #00FF00' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
