import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, push, update 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - CORREGIDO & OPTIMIZADO
 * ============================================================================
 * VERSIÓN: 13.0.9-FINAL
 * ESTADO: SISTEMAS OPERATIVOS
 * ============================================================================
 */

const firebaseConfig = {
  apiKey: "AIzaSyD1zUmhiUVDv-ZYyJF7vTwGaS1AO9t9jiE",
  authDomain: "alexhub-eefdf.firebaseapp.com",
  databaseURL: "https://alexhub-eefdf-default-rtdb.firebaseio.com",
  projectId: "alexhub-eefdf",
  storageBucket: "alexhub-eefdf.firebasestorage.app",
  messagingSenderId: "463204402982",
  appId: "1:463204402982:web:fe740a662fbfd50452a3e7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// NUEVA API PROPORCIONADA
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";

export default function AlexHubUltraV13() {
  // --- ESTADOS NUCLEARES ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // --- DATOS REALTIME ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);

  // --- UI Y MULTIMEDIA ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  
  // --- ADMIN ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');
  const [notifications, setNotifications] = useState([]);

  // ==========================================
  // LÓGICA DE SEGURIDAD Y BOTÓN PÁNICO
  // ==========================================

  const triggerPanicButton = () => {
    // Intenta abrir ManageBac App y cerrar la pestaña actual
    window.open("managebac://", "_self");
    setTimeout(() => {
      window.location.href = "https://managebac.com"; // Fallback
      window.close();
    }, 100);
  };

  // Función para sanitizar correos para Firebase (Acepta .eu, .com, etc)
  const safeKey = (email) => email.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_');

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        verifyUserAccess(currentUser.email);
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Escuchadores Globales
    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const data = s.val() || {};
      setSystemLogs(Object.values(data).reverse().slice(0, 50));
    });

    return () => {
      unsubscribeAuth(); unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs();
    };
  }, []);

  const verifyUserAccess = (email) => {
    const key = safeKey(email);
    // Verificar si está baneado
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        // Verificar si está en whitelist
        onValue(ref(db, `whitelist/${key}`), (wSnap) => {
          if (wSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("CORREO NO AUTORIZADO EN WHITELIST");
          }
        });
      }
      setAuthLoading(false);
    });
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
      setLoginError("Error de sesión: Intenta limpiar caché del navegador.");
    }
  };

  // ==========================================
  // COMANDOS DE ADMINISTRACIÓN (ARREGLADOS)
  // ==========================================

  const executeCommand = async (type, targetEmail, action) => {
    if (!targetEmail.includes('@')) return addNotification("Email Inválido", "error");
    const key = safeKey(targetEmail);
    const path = `${type}/${key}`;

    try {
      if (action === 'add') {
        await set(ref(db, path), {
          email: targetEmail,
          date: serverTimestamp(),
          by: user?.email
        });
        addNotification(`Usuario añadido a ${type}`, "success");
      } else {
        await remove(ref(db, path));
        addNotification(`Removido de ${type}`, "info");
      }
      setNewEmailInput('');
      logActivity(`MOD: ${action} ${targetEmail} en ${type}`);
    } catch (e) {
      addNotification("Error en Base de Datos", "error");
    }
  };

  const logActivity = (msg) => {
    push(ref(db, 'logs'), {
      msg,
      user: user?.email || 'Sistema',
      time: new Date().toISOString()
    });
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // MOTOR DE BÚSQUEDA MULTIMEDIA
  // ==========================================

  const searchContent = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${query}&type=video&key=${YOUTUBE_API_KEY}`);
        const d = await r.json();
        setVideos(d.items || []);
        setSelectedVideo(null);
      }
    } catch (err) {
      addNotification("Error API YouTube", "error");
    }
    setLoadingContent(false);
  };

  // --- RENDERIZADO ---

  if (authLoading) return <div style={styles.loaderFull}>Cargando Alex Hub Ultra...</div>;

  return (
    <div style={styles.container}>
      {/* Botón de Pánico Flotante */}
      <button onClick={triggerPanicButton} style={styles.panicBtn}>PÁNICO</button>

      {/* Notificaciones */}
      <div style={styles.notifArea}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notif, borderColor: n.type === 'error' ? '#ff0000' : '#00ff00'}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={styles.bannedContainer}>
          <h1 style={{fontSize: '50px'}}>ACCESO BLOQUEADO</h1>
          <p>Has sido expulsado del sistema por un administrador.</p>
          <button onClick={() => signOut(auth)} style={styles.loginBtn}>SALIR</button>
        </div>
      ) : !accessGranted ? (
        <div style={styles.loginScreen}>
          <div style={styles.loginBox}>
            <h1 style={styles.brand}>ALEX HUB <span style={{color: '#ff0000'}}>ULTRA</span></h1>
            <button onClick={handleGoogleLogin} style={styles.googleBtn}>
              ACCEDER CON GOOGLE
            </button>
            <p style={{color: '#ff4444', fontSize: '12px'}}>{loginError}</p>
            <button onClick={() => setShowAlexLogin(true)} style={styles.adminTrigger}>COMANDOS ADMIN</button>
          </div>
        </div>
      ) : (
        <>
          {/* NAVBAR PRINCIPAL */}
          <nav style={styles.nav}>
            <div style={styles.navLeft}>
              <h2 style={{margin: 0, fontSize: '20px'}}>ALEX HUB <span style={{fontSize: '10px'}}>V13</span></h2>
              <div style={styles.tabGroup}>
                {['youtube', 'twitch', 'movies', 'radio'].map(m => (
                  <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={searchContent} style={styles.searchBar}>
              <input 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                placeholder={`Buscar en ${mode}...`}
                style={styles.input}
              />
            </form>

            <div style={styles.navRight}>
              <img src={user.photoURL} style={styles.avatar} alt="u" />
              <button onClick={() => signOut(auth)} style={styles.logoutBtn}>SALIR</button>
              <button onClick={() => setIsAdminOpen(true)} style={styles.adminBtn}>ADMIN</button>
            </div>
          </nav>

          {/* ÁREA DE CONTENIDO (PANTALLA GIGANTE) */}
          <main style={styles.main}>
            {mode === 'youtube' && !selectedVideo && (
              <div style={styles.videoGrid}>
                {videos.map((v, i) => (
                  <div key={i} style={styles.vCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                    <img src={v.snippet.thumbnails.high.url} style={styles.vThumb} />
                    <div style={styles.vInfo}>
                      <h4 style={styles.vTitle}>{v.snippet.title}</h4>
                      <p style={styles.vChan}>{v.snippet.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(selectedVideo || mode !== 'youtube') && (
              <div style={styles.playerContainer}>
                <iframe 
                  src={selectedVideo ? `https://www.youtube.com/embed/${selectedVideo}?autoplay=1` : 
                       mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` : ""}
                  style={styles.bigIframe}
                  allowFullScreen
                />
                {selectedVideo && <button onClick={() => setSelectedVideo(null)} style={styles.closePlayer}>VOLVER ATRÁS</button>}
              </div>
            )}
          </main>
        </>
      )}

      {/* MODAL ADMIN PANEL */}
      {isAdminOpen && (
        <div style={styles.adminModal}>
          <div style={styles.adminContent}>
            <div style={styles.adminHeader}>
              <h3>ALEX COMMAND CENTER</h3>
              <button onClick={() => setIsAdminOpen(false)} style={styles.closeBtn}>X</button>
            </div>
            
            <div style={styles.adminLayout}>
              <div style={styles.adminSidebar}>
                <button onClick={() => setAdminTab('users')} style={styles.sideBtn}>LISTAS</button>
                <button onClick={() => setAdminTab('logs')} style={styles.sideBtn}>LOGS</button>
              </div>

              <div style={styles.adminMain}>
                {adminTab === 'users' ? (
                  <div style={styles.userGrid}>
                    {/* WHITELIST */}
                    <div style={styles.userCol}>
                      <h4>WHITELIST (ACCESO)</h4>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.adminInp} />
                      <button onClick={() => executeCommand('whitelist', newEmailInput, 'add')} style={styles.btnA}>AÑADIR</button>
                      <div style={styles.list}>
                        {Object.values(whitelist).map(u => (
                          <div key={u.email} style={styles.listItm}>
                            {u.email} <button onClick={() => executeCommand('whitelist', u.email, 'remove')} style={styles.btnD}>X</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* BLACKLIST */}
                    <div style={styles.userCol}>
                      <h4 style={{color: '#ff0000'}}>BLACKLIST (BAN)</h4>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.adminInp} />
                      <button onClick={() => executeCommand('blacklist', newEmailInput, 'add')} style={styles.btnB}>BANEAR</button>
                      <div style={styles.list}>
                        {Object.values(blacklist).map(u => (
                          <div key={u.email} style={styles.listItm}>
                            {u.email} <button onClick={() => executeCommand('blacklist', u.email, 'remove')} style={styles.btnA}>PERDONAR</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.logList}>
                    {systemLogs.map((l, i) => (
                      <div key={i} style={styles.logLine}>
                        <span style={{color: '#555'}}>[{l.time}]</span> <b>{l.user}</b>: {l.msg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN DE PROTECCIÓN ADMIN */}
      {showAlexLogin && (
        <div style={styles.overlay}>
          <div style={styles.miniLogin}>
            <h3>SISTEMA DE CONTROL</h3>
            <input 
              type="password" 
              placeholder="PASS" 
              value={alexPassInput} 
              onChange={e=>setAlexPassInput(e.target.value)}
              style={styles.adminInp}
            />
            <button onClick={() => {
              if(alexPassInput === ADMIN_PASS) { setIsAdminOpen(true); setShowAlexLogin(false); setAlexPassInput(''); }
            }} style={styles.btnA}>ENTRAR</button>
            <button onClick={() => setShowAlexLogin(false)} style={styles.btnC}>CERRAR</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SISTEMA DE ESTILOS (UX PROFESIONAL)
// ==========================================
const styles = {
  container: { height: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  panicBtn: { position: 'fixed', bottom: '20px', right: '20px', background: '#ff0000', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '50px', fontWeight: 'bold', zIndex: 10000, cursor: 'pointer', boxShadow: '0 0 20px rgba(255,0,0,0.5)' },
  nav: { height: '70px', background: '#0a0a0a', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid #222' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  tabGroup: { display: 'flex', gap: '10px' },
  tab: { background: '#1a1a1a', border: 'none', color: '#888', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  activeTab: { background: '#ff0000', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold' },
  searchBar: { flex: 1, maxWidth: '600px', margin: '0 20px' },
  input: { width: '100%', background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff' },
  navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '35px', height: '35px', borderRadius: '50%' },
  main: { flex: 1, overflowY: 'auto', padding: '20px' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  vCard: { background: '#0a0a0a', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: '0.3s' },
  vThumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  vInfo: { padding: '12px' },
  vTitle: { margin: '0 0 5px 0', fontSize: '14px' },
  vChan: { color: '#666', fontSize: '12px' },
  playerContainer: { width: '100%', height: '85vh', position: 'relative' },
  bigIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '15px' },
  closePlayer: { position: 'absolute', top: '-50px', right: '0', background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
  adminModal: { position: 'fixed', inset: '40px', background: '#0a0a0a', zIndex: 5000, borderRadius: '20px', border: '1px solid #333', display: 'flex', flexDirection: 'column' },
  adminContent: { flex: 1, display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' },
  adminLayout: { flex: 1, display: 'flex' },
  adminSidebar: { width: '200px', borderRight: '1px solid #222', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' },
  adminMain: { flex: 1, padding: '20px', overflowY: 'auto' },
  userGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  userCol: { background: '#111', padding: '15px', borderRadius: '12px' },
  adminInp: { width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', marginBottom: '10px' },
  list: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '5px' },
  listItm: { background: '#050505', padding: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' },
  btnA: { background: '#00ff00', color: '#000', border: 'none', padding: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnB: { background: '#ff0000', color: '#fff', border: 'none', padding: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnD: { background: '#222', color: '#ff4444', border: 'none', cursor: 'pointer' },
  loginScreen: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loginBox: { textAlign: 'center', padding: '50px', background: '#0a0a0a', borderRadius: '30px', border: '1px solid #222' },
  brand: { fontSize: '40px', letterSpacing: '5px', marginBottom: '30px' },
  googleBtn: { background: '#fff', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  adminTrigger: { display: 'block', margin: '40px auto 0', background: 'none', border: 'none', color: '#333', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000 },
  miniLogin: { background: '#111', padding: '30px', borderRadius: '20px', textAlign: 'center' },
  notifArea: { position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notif: { background: '#111', padding: '15px 25px', borderRadius: '8px', borderLeft: '5px solid' }
};
