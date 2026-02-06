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
 * ALEX HUB ULTRA V13 - POWERED BY SUPREME LOGIC
 * ============================================================================
 * FIX: Login Auth State, Global Domain Support (@gmail.eu), Admin Ban Sync
 * @version: 13.0.9-FIXED
 * ============================================================================
 */

// --- CONFIGURACIÓN DE FIREBASE ---
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

// --- CONSTANTES ---
const YT_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4"; // API ACTUALIZADA
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-STABLE";

export default function AlexHubUltraV13() {
  // ESTADOS PRINCIPALES
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // DATOS REALTIME
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [logs, setLogs] = useState([]);

  // NAVEGACIÓN
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // ADMIN STATE
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');

  // UI
  const [notifications, setNotifications] = useState([]);
  const themeColor = '#E50914';

  // --- UTILIDADES ---
  // Convierte email a una clave válida para Firebase (soporta .eu, .com, etc)
  const emailToKey = (email) => email ? email.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_') : '';

  const addNotification = (text, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const logActivity = (msg) => {
    const logRef = push(ref(db, 'logs'));
    set(logRef, {
      msg,
      user: auth.currentUser?.email || 'Sistema',
      timestamp: serverTimestamp()
    });
  };

  // --- LÓGICA DE PANICO (Cerrar pestaña y abrir ManageBac) ---
  const triggerPanic = () => {
    addNotification("¡MODO PÁNICO ACTIVADO!", "error");
    // Intentamos abrir la App de ManageBac (Deep Link)
    window.location.assign("managebac://"); 
    
    // Si no abre la app, redirige a una URL segura inmediatamente
    setTimeout(() => {
        window.open("https://managebac.com", "_blank");
        window.close(); // Intenta cerrar la pestaña actual
        // Backup por si el navegador bloquea window.close()
        window.location.replace("about:blank");
    }, 100);
  };

  // --- NÚCLEO DE SEGURIDAD Y AUTH ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const key = emailToKey(currentUser.email);
        
        // Escuchar Baneo en tiempo real (Para que el comando quitar ban funcione al instante)
        onValue(ref(db, `blacklist/${key}`), (snapshot) => {
          if (snapshot.exists()) {
            setIsBanned(true);
            setAccessGranted(false);
          } else {
            setIsBanned(false);
            // Si no está baneado, chequear whitelist
            onValue(ref(db, `whitelist/${key}`), (whiteSnap) => {
              if (whiteSnap.exists() || currentUser.email === "alex.admin@pro.com") {
                setAccessGranted(true);
              } else {
                setAccessGranted(false);
                setLoginError("NO AUTORIZADO: No estás en la Whitelist.");
              }
            });
          }
          setAuthLoading(false);
        });
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Sync de bases de datos para el panel admin
    onValue(ref(db, 'whitelist'), s => setWhitelist(s.val() || {}));
    onValue(ref(db, 'blacklist'), s => setBlacklist(s.val() || {}));
    onValue(ref(db, 'premium_users'), s => setPremiumUsers(s.val() || {}));
    onValue(ref(db, 'logs'), s => {
      const data = s.val() || {};
      setLogs(Object.values(data).reverse().slice(0, 50));
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async () => {
    try {
      // Solución al error de Initial State: Forzar persistencia local
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
      addNotification("Conectando con Google...", "success");
    } catch (error) {
      console.error(error);
      setLoginError("Error de Sesión: " + error.code);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => window.location.reload());
  };

  // --- COMANDOS ADMINISTRATIVOS ---
  const modifyUserStatus = (table, email, action) => {
    if (!email || !email.includes('@')) return addNotification("Email inválido", "error");
    const key = emailToKey(email);
    
    if (action === 'add') {
      set(ref(db, `${table}/${key}`), {
        email: email.toLowerCase(),
        date: new Date().toISOString(),
        by: user?.email
      });
      addNotification(`${email} añadido a ${table}`, "success");
    } else {
      remove(ref(db, `${table}/${key}`));
      addNotification(`${email} eliminado de ${table}`, "info");
    }
    setNewEmailInput('');
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      logActivity("ACCESO AL COMMAND CENTER");
    } else {
      addNotification("PASSWORD INCORRECTO", "error");
    }
  };

  // --- BÚSQUEDA MULTIMEDIA ---
  const searchContent = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(query)}&type=video&key=${YT_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
    } catch (err) {
      addNotification("Error en API de YouTube", "error");
    }
    setLoadingContent(false);
  };

  // --- RENDERING ---
  if (authLoading) return <div style={styles.loaderFull}><div className="spinner"></div></div>;

  return (
    <div style={styles.app}>
      
      {/* NOTIFICACIONES EMERGENTES */}
      <div style={styles.notifArea}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.toast, borderLeft: `5px solid ${n.type === 'error' ? 'red' : '#00ff41'}`}}>
            {n.text}
          </div>
        ))}
      </div>

      {/* BOTÓN DE PÁNICO (SIEMPRE VISIBLE) */}
      <button onClick={triggerPanic} style={styles.panicBtn}>PÁNICO</button>

      {/* MODAL ADMIN LOGIN */}
      {showAlexLogin && (
        <div style={styles.overlay}>
          <div style={styles.loginModal}>
            <h2 style={{color: themeColor}}>ADMIN AUTH</h2>
            <form onSubmit={handleAdminAuth}>
              <input 
                type="password" 
                style={styles.inputAdmin} 
                value={alexPassInput} 
                onChange={e => setAlexPassInput(e.target.value)} 
                placeholder="CLAVE MAESTRA"
                autoFocus
              />
              <div style={styles.flex}>
                <button type="submit" style={styles.btnPrimary}>ENTRAR</button>
                <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.btnGhost}>SALIR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FRAME DEL ADMINISTRADOR */}
      {isAdminOpen && (
        <div style={styles.adminDashboard}>
          <div style={styles.adminNav}>
            <span style={styles.adminTitle}>ALEX COMMAND CENTER V13</span>
            <div style={styles.flex}>
              <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.tabActive : styles.tabAdmin}>GESTIÓN</button>
              <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.tabActive : styles.tabAdmin}>REGISTROS</button>
              <button onClick={() => setIsAdminOpen(false)} style={styles.btnCloseAdmin}>CERRAR SISTEMA</button>
            </div>
          </div>

          <div style={styles.adminContent}>
            {adminTab === 'users' ? (
              <div style={styles.grid3}>
                {/* COLUMNA WHITELIST */}
                <div style={styles.adminCard}>
                  <h3 style={{color: '#00ff41'}}>WHITELIST (ACCESO)</h3>
                  <div style={styles.flex}>
                    <input style={styles.miniInput} value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..."/>
                    <button style={styles.addSmall} onClick={() => modifyUserStatus('whitelist', newEmailInput, 'add')}>+</button>
                  </div>
                  <div style={styles.listContainer}>
                    {Object.values(whitelist).map(u => (
                      <div key={u.email} style={styles.listItem}>
                        <span>{u.email}</span>
                        <button onClick={() => modifyUserStatus('whitelist', u.email, 'remove')} style={styles.delBtn}>X</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA BLACKLIST (BAN) */}
                <div style={styles.adminCard}>
                  <h3 style={{color: 'red'}}>BLACKLIST (BANEO)</h3>
                  <div style={styles.flex}>
                    <input style={styles.miniInput} value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..."/>
                    <button style={styles.banSmall} onClick={() => modifyUserStatus('blacklist', newEmailInput, 'add')}>BAN</button>
                  </div>
                  <div style={styles.listContainer}>
                    {Object.values(blacklist).map(u => (
                      <div key={u.email} style={styles.listItem}>
                        <span>{u.email}</span>
                        <button onClick={() => modifyUserStatus('blacklist', u.email, 'remove')} style={styles.unbanBtn}>PERDONAR BAN</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA PREMIUM */}
                <div style={styles.adminCard}>
                  <h3 style={{color: 'gold'}}>SISTEMA PREMIUM</h3>
                  <div style={styles.flex}>
                    <input style={styles.miniInput} value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..."/>
                    <button style={styles.premSmall} onClick={() => modifyUserStatus('premium_users', newEmailInput, 'add')}>UP</button>
                  </div>
                  <div style={styles.listContainer}>
                    {Object.values(premiumUsers).map(u => (
                      <div key={u.email} style={styles.listItem}>
                        <span>{u.email}</span>
                        <button onClick={() => modifyUserStatus('premium_users', u.email, 'remove')} style={styles.delBtn}>X</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.logBox}>
                {logs.map((l, i) => (
                  <div key={i} style={styles.logRow}>
                    <span style={{color: '#666'}}>[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                    <span style={{color: themeColor, fontWeight: 'bold'}}> {l.user}:</span> {l.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UI SEGÚN ESTADO */}
      {isBanned ? (
        <div style={styles.bannedCover}>
          <div style={styles.bannedBox}>
            <h1 style={{fontSize: '50px', margin: 0}}>ACCESO BLOQUEADO</h1>
            <p>Has sido expulsado por un administrador. Contacta con Alex.</p>
            <button onClick={handleLogout} style={styles.btnPrimary}>REINTENTAR ACCESO</button>
          </div>
        </div>
      ) : (!user || !accessGranted) ? (
        <div style={styles.loginScreen}>
          <div style={styles.heroCard}>
            <h1 style={styles.mainTitle}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
            <p style={styles.sub}>ENTERTAINMENT & CONTROL SYSTEM V13</p>
            
            {!user ? (
              <button onClick={handleLogin} style={styles.googleBigBtn}>
                <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" width="24" />
                LOG IN WITH GOOGLE
              </button>
            ) : (
              <div style={styles.waitBox}>
                <p>BIENVENIDO: {user.email}</p>
                <p style={{color: '#ff9800', fontSize: '12px'}}>ESTADO: PENDIENTE DE WHITELIST</p>
                <button onClick={handleLogout} style={styles.btnGhost}>CANCELAR</button>
              </div>
            )}
            
            {loginError && <p style={styles.errorLabel}>{loginError}</p>}
            
            <button onClick={() => setShowAlexLogin(true)} style={styles.adminEntryBtn}>ALEX LOGIN</button>
          </div>
        </div>
      ) : (
        /* DASHBOARD PRINCIPAL */
        <>
          <nav style={styles.nav}>
            <div style={styles.navBrand}>
              <span style={{fontSize: '24px', fontWeight: '900'}}>ALEX</span>
              <span style={{color: themeColor, fontSize: '12px'}}>V13</span>
            </div>

            <div style={styles.navTabs}>
              {['youtube', 'twitch', 'movies', 'xbox'].map(t => (
                <button key={t} onClick={() => {setMode(t); setSelectedVideo(null)}} 
                        style={mode === t ? styles.navTabActive : styles.navTab}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <form onSubmit={searchContent} style={styles.searchBar}>
              <input 
                placeholder={`Buscar en ${mode}...`} 
                value={query} 
                onChange={e=>setQuery(e.target.value)} 
                style={styles.inputSearch}
              />
            </form>

            <div style={styles.navProfile}>
              <img src={user.photoURL} style={styles.avatar} />
              <button onClick={handleLogout} style={styles.btnGhost}>CERRAR</button>
              <button onClick={() => setShowAlexLogin(true)} style={styles.adminMiniBtn}>A</button>
            </div>
          </nav>

          <main style={styles.mainContent}>
            {loadingContent && <div style={styles.innerLoader}><div className="spinner"></div></div>}

            {mode === 'youtube' && (
              <div style={styles.grid}>
                {selectedVideo ? (
                  <div style={styles.videoPlayerContainer}>
                    {/* VÍDEO GRANDE COMO PEDISTE */}
                    <iframe 
                      src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} 
                      style={styles.bigIframe}
                      allowFullScreen
                    />
                    <button onClick={() => setSelectedVideo(null)} style={styles.closePlayer}>CERRAR VIDEO</button>
                  </div>
                ) : (
                  videos.map((v, i) => (
                    <div key={i} style={styles.videoCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                      <img src={v.snippet.thumbnails.high.url} style={styles.cardThumb} />
                      <div style={styles.cardBody}>
                        <h4 style={styles.vTitle}>{v.snippet.title}</h4>
                        <p style={styles.vChannel}>{v.snippet.channelTitle}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {mode !== 'youtube' && (
              <div style={styles.fullFrameWrapper}>
                {/* DIRECTOS Y PELIS EN PANTALLA COMPLETA */}
                <iframe 
                   src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                        mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                        "https://www.xbox.com/play"}
                   style={styles.bigIframe}
                />
              </div>
            )}
          </main>
        </>
      )}

      <footer style={styles.footer}>
        <span>SISTEMA ULTRA V13 - KERNEL ESTABLE</span>
        <span>ID: {user ? user.uid.substring(0,10) : 'GUEST'}</span>
        <span style={{color: '#00ff41'}}>FIREBASE CONNECTED</span>
      </footer>
    </div>
  );
}

// --- SISTEMA DE ESTILOS ---
const styles = {
  app: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' },
  loaderFull: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  innerLoader: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  // NAVEGACIÓN
  nav: { height: '70px', background: '#080808', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' },
  navBrand: { display: 'flex', flexDirection: 'column', lineHeight: 1 },
  navTabs: { display: 'flex', gap: '15px' },
  navTab: { background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontWeight: 'bold' },
  navTabActive: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', borderBottom: '2px solid red' },
  searchBar: { flex: 0.6 },
  inputSearch: { width: '100%', background: '#151515', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff' },
  navProfile: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #222' },
  
  // CONTENT
  mainContent: { flex: 1, overflowY: 'auto', padding: '25px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  videoCard: { background: '#111', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: '0.2s' },
  cardThumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardBody: { padding: '12px' },
  vTitle: { margin: 0, fontSize: '14px', height: '40px', overflow: 'hidden' },
  vChannel: { margin: '5px 0 0 0', fontSize: '11px', color: '#777' },

  // PLAYER
  videoPlayerContainer: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  bigIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '15px' },
  closePlayer: { position: 'absolute', top: '-40px', right: 0, background: 'red', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' },
  fullFrameWrapper: { width: '100%', height: '100%' },

  // ADMIN SYSTEM
  adminDashboard: { position: 'fixed', inset: '20px', background: '#0a0a0a', zIndex: 1000, borderRadius: '20px', border: '1px solid #333', display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px #000' },
  adminNav: { padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminTitle: { fontWeight: '900', color: 'red' },
  adminContent: { flex: 1, padding: '20px', overflowY: 'auto' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', height: '100%' },
  adminCard: { background: '#050505', border: '1px solid #222', padding: '15px', borderRadius: '15px', display: 'flex', flexDirection: 'column' },
  listContainer: { flex: 1, overflowY: 'auto', marginTop: '15px' },
  listItem: { padding: '10px', background: '#000', marginBottom: '5px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' },
  miniInput: { background: '#111', border: '1px solid #333', color: '#fff', padding: '8px', borderRadius: '5px', flex: 1 },
  addSmall: { background: '#00ff41', border: 'none', marginLeft: '5px', borderRadius: '5px', cursor: 'pointer', padding: '0 10px' },
  banSmall: { background: 'red', border: 'none', marginLeft: '5px', borderRadius: '5px', color: '#fff', cursor: 'pointer', padding: '0 10px' },
  premSmall: { background: 'gold', border: 'none', marginLeft: '5px', borderRadius: '5px', cursor: 'pointer', padding: '0 10px' },
  unbanBtn: { background: '#00ff41', border: 'none', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' },
  delBtn: { background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },

  // LOGIN SCREEN
  loginScreen: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #111 0%, #000 100%)' },
  heroCard: { textAlign: 'center', background: 'rgba(10,10,10,0.8)', padding: '60px', borderRadius: '30px', border: '1px solid #222', backdropFilter: 'blur(10px)' },
  mainTitle: { fontSize: '50px', fontWeight: '900', margin: 0, letterSpacing: '5px' },
  googleBigBtn: { marginTop: '30px', display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  adminEntryBtn: { marginTop: '50px', background: 'transparent', border: 'none', color: '#333', cursor: 'pointer' },

  // OTROS
  panicBtn: { position: 'fixed', bottom: '60px', right: '20px', background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: '80px', height: '80px', fontWeight: 'bold', cursor: 'pointer', zIndex: 9999, boxShadow: '0 0 20px rgba(255,0,0,0.5)' },
  toast: { background: '#111', color: '#fff', padding: '15px 25px', borderRadius: '8px', marginBottom: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' },
  notifArea: { position: 'fixed', top: '20px', right: '20px', zIndex: 10000 },
  footer: { height: '35px', background: '#050505', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '10px', color: '#444' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginModal: { background: '#111', padding: '40px', borderRadius: '20px', border: '1px solid #333', width: '300px', textAlign: 'center' },
  inputAdmin: { width: '100%', padding: '15px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '10px', marginBottom: '20px', fontSize: '18px', textAlign: 'center' },
  flex: { display: 'flex', gap: '10px', justifyContent: 'center' },
  btnPrimary: { background: 'red', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  btnGhost: { background: 'transparent', color: '#555', border: 'none', cursor: 'pointer' },
  bannedCover: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'red' },
  adminMiniBtn: { background: '#222', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }
};

// --- GLOBAL STYLES ---
if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    .spinner { width: 40px; height: 40px; border: 4px solid #111; border-top-color: red; border-radius: 50%; animation: rot 1s linear infinite; }
    @keyframes rot { to { transform: rotate(360deg); } }
    body { margin: 0; background: #000; overflow: hidden; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
    button:active { transform: scale(0.95); }
  `;
  document.head.appendChild(s);
}
