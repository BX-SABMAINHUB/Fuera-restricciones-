import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, push 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (FIXED BUILD)
 * ============================================================================
 * @version: 13.0.6-STABLE
 * @author: Alex Hub Team
 * ============================================================================
 */

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

// --- INICIALIZACIÓN ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.6-ULTRA-FIX";

export default function AlexHubUltraV13() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);

  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);

  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');
  const [notifications, setNotifications] = useState([]);

  const themeColor = '#E50914';

  // --- UTILIDAD: LIMPIEZA DE KEYS ---
  const sanitizeKey = (email) => email ? email.toLowerCase().replace(/\./g, ',') : '';

  // --- LOGS DEL SISTEMA ---
  const logActivity = useCallback((msg) => {
    const newLogRef = push(ref(db, 'logs'));
    set(newLogRef, {
      msg,
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'Sistema'
    });
  }, []);

  // --- ESCUCHA DE SEGURIDAD ---
  const checkSecurityLayer = useCallback((email) => {
    const emailKey = sanitizeKey(email);
    
    // Escucha Blacklist
    onValue(ref(db, `blacklist/${emailKey}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
        setAuthLoading(false);
      } else {
        setIsBanned(false);
        // Escucha Whitelist
        onValue(ref(db, `whitelist/${emailKey}`), (whiteSnap) => {
          if (whiteSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("SISTEMA: ACCESO NO AUTORIZADO.");
          }
          setAuthLoading(false);
        });
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        checkSecurityLayer(currentUser.email);
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || {}));
    onValue(ref(db, 'logs'), (s) => {
      const logs = Object.values(s.val() || {}).reverse().slice(0, 30);
      setSystemLogs(logs);
    });

    return () => unsubscribeAuth();
  }, [checkSecurityLayer]);

  // --- ACCIONES DE AUTENTICACIÓN (ARREGLADO) ---
  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      // Forzar persistencia local para evitar pérdida de estado
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
      addNotification("Sincronizando con Google...", "info");
    } catch (error) {
      console.error(error);
      setLoginError("ERROR DE SESIÓN. Reintenta o limpia caché.");
      addNotification("Error de Initial State - Reintenta", "error");
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => window.location.reload());
  };

  // --- COMANDOS ADMIN (ARREGLADO) ---
  const handleAlexSubmit = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("MODO DIOS ACTIVADO", "success");
      logActivity("ADMIN: Acceso al panel maestro.");
    } else {
      addNotification("PASSWORD ERRÓNEA", "error");
    }
  };

  const manageSystemUser = async (table, email, action) => {
    if (!email || !email.includes('@')) return addNotification("Email inválido", "error");
    const emailKey = sanitizeKey(email);
    
    try {
      if (action === 'add') {
        await set(ref(db, `${table}/${emailKey}`), { 
          email: email.toLowerCase(), 
          addedAt: serverTimestamp() 
        });
        addNotification(`Añadido: ${email}`, "success");
        logActivity(`ADMIN: Añadió ${email} a ${table}`);
      } else {
        await remove(ref(db, `${table}/${emailKey}`));
        addNotification(`Eliminado: ${email}`, "info");
        logActivity(`ADMIN: Eliminó ${email} de ${table}`);
      }
      setNewEmailInput('');
    } catch (e) {
      addNotification("Error en base de datos", "error");
    }
  };

  // --- MULTIMEDIA ---
  const startGlobalSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
      logActivity(`Búsqueda: ${query}`);
    } catch (err) {
      addNotification("Error en búsqueda", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(p => [...p, { id, text, type }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 3500);
  };

  if (authLoading) return (
    <div style={styles.fullCenter}>
      <div className="loader"></div>
      <p style={{marginTop: '20px', color: themeColor, fontWeight: 'bold'}}>INICIANDO ALEX HUB...</p>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      
      {/* NOTIFICACIONES */}
      <div style={styles.notifContainer}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notif, borderLeftColor: n.type === 'error' ? '#ff0000' : '#00ff41'}}>
            {n.text}
          </div>
        ))}
      </div>

      {/* LOGIN ADMIN MODAL */}
      {showAlexLogin && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.miniCard, borderTopColor: themeColor}}>
             <h2 style={{letterSpacing: '3px'}}>ALEX ADMIN</h2>
             <form onSubmit={handleAlexSubmit}>
               <input 
                 type="password" 
                 placeholder="CLAVE MAESTRA" 
                 value={alexPassInput} 
                 onChange={e => setAlexPassInput(e.target.value)} 
                 style={styles.adminInput}
                 autoFocus
               />
               <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                 <button type="submit" style={{...styles.confirmBtn, background: themeColor}}>ACCEDER</button>
                 <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>SALIR</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* COMMAND CENTER GIGANTE */}
      {isAdminOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <div>
              <h1 style={{color: themeColor, margin: 0}}>COMMAND CENTER</h1>
              <p style={{margin: 0, fontSize: '10px', opacity: 0.5}}>SISTEMA DE CONTROL TOTAL V13</p>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
               <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.adminTabActive : styles.adminTab}>USUARIOS</button>
               <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.adminTabActive : styles.adminTab}>REGISTROS</button>
               <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>CERRAR PANEL</button>
            </div>
          </div>
          
          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminGrid}>
                {['whitelist', 'blacklist', 'premium_users'].map((table) => (
                  <div key={table} style={styles.adminSection}>
                    <h3 style={{textTransform: 'uppercase', fontSize: '13px', color: table === 'blacklist' ? '#ff4444' : '#00ff41'}}>
                      {table.replace('_', ' ')}
                    </h3>
                    <div style={styles.adminActionRow}>
                      <input 
                        value={newEmailInput} 
                        onChange={e => setNewEmailInput(e.target.value)} 
                        placeholder="email@gmail.com" 
                        style={styles.adminInputText}
                      />
                      <button onClick={() => manageSystemUser(table, newEmailInput, 'add')} style={styles.addBtn}>+</button>
                    </div>
                    <div style={styles.scrollList}>
                      {Object.values(table === 'whitelist' ? whitelist : table === 'blacklist' ? blacklist : premiumUsers).map(u => (
                        <div key={u.email} style={styles.listItem}>
                          <span style={{fontSize: '11px'}}>{u.email}</span>
                          <button onClick={() => manageSystemUser(table, u.email, 'remove')} style={styles.deleteBtn}>DEL</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.logContainer}>
                {systemLogs.map((log, i) => (
                  <div key={i} style={styles.logItem}>
                    <span style={{color: '#444'}}>[{log.timestamp.split('T')[1].split('.')[0]}]</span> 
                    <span style={{color: themeColor}}> {log.user}:</span> {log.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDERIZADO CONDICIONAL DE ACCESO */}
      {isBanned ? (
        <div style={styles.bannedScreen}>
          <div style={styles.errorBox}>
            <h1 className="glitch">SISTEMA BLOQUEADO</h1>
            <p>Tu cuenta ha sido expulsada. Contacta con Alex.</p>
            <button onClick={handleLogout} style={styles.logoutBtnLarge}>CERRAR</button>
          </div>
        </div>
      ) : (!user || !accessGranted) ? (
        <div style={styles.loginPage}>
          <div style={styles.loginCard}>
            <h1 style={styles.glitchText}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
            <div style={{margin: '40px 0'}}>
              {!user ? (
                <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="G"/>
                  CONECTAR CON GOOGLE
                </button>
              ) : (
                <div style={{color: '#ff9800'}}>PANTALLA DE ESPERA - WHITELIST REQUERIDA</div>
              )}
            </div>
            {loginError && <div style={styles.errorText}>{loginError}</div>}
            <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtn}>MODO ADMINISTRADOR</button>
          </div>
        </div>
      ) : (
        /* DASHBOARD */
        <>
          <nav style={styles.navbar}>
            <div style={styles.navLeft}>
              <div style={styles.logoBox}>
                <span style={styles.logoMain}>ALEX</span>
                <span style={{...styles.logoSub, color: themeColor}}>ULTRA V13</span>
              </div>
              <div style={styles.tabContainer}>
                {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
                  <button key={m} onClick={() => setMode(m)} style={mode === m ? {...styles.activeTab, background: themeColor} : styles.tab}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={startGlobalSearch} style={styles.searchForm}>
              <input style={styles.searchInput} placeholder="Buscar..." value={query} onChange={e => setQuery(e.target.value)} />
            </form>
            <div style={styles.navRight}>
               <div style={styles.userInfo}>
                  <img src={user.photoURL} style={styles.userPic} alt="p" />
                  <button onClick={handleLogout} style={styles.logoutMini}>SALIR</button>
               </div>
               <button onClick={() => setShowAlexLogin(true)} style={{...styles.alexBtnMini, background: themeColor}}>ALEX</button>
            </div>
          </nav>

          <main style={styles.contentArea}>
            {loadingContent && <div className="loader"></div>}
            {mode === 'youtube' && (
              <div style={styles.grid}>
                {selectedVideo ? (
                  <div style={styles.playerWrap}>
                    <iframe src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
                    <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>CERRAR</button>
                  </div>
                ) : (
                  videos.map((v, i) => (
                    <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                      <img src={v.snippet.thumbnails.high.url} style={styles.thumb} alt="t" />
                      <div style={styles.cardInfo}>
                        <p style={styles.videoTitle}>{v.snippet.title}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {mode !== 'youtube' && (
              <div style={styles.fullFrame}>
                <iframe 
                  src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                       "https://www.xbox.com/play"} 
                  style={styles.iframe} 
                />
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

const styles = {
  appContainer: { height: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loginPage: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 100 },
  loginCard: { background: '#0a0a0a', padding: '60px', borderRadius: '30px', border: '1px solid #111', textAlign: 'center', width: '400px' },
  glitchText: { fontSize: '40px', fontWeight: '900', letterSpacing: '5px' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', color: '#000', border: 'none', padding: '15px 25px', borderRadius: '10px', cursor: 'pointer', margin: '0 auto', fontWeight: 'bold' },
  alexBtn: { background: 'transparent', border: '1px solid #222', color: '#444', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', borderBottom: '1px solid #111' },
  logoBox: { borderLeft: '3px solid', paddingLeft: '15px' },
  logoMain: { fontSize: '22px', fontWeight: '900' },
  logoSub: { fontSize: '9px', display: 'block' },
  tabContainer: { display: 'flex', gap: '5px', marginLeft: '30px' },
  tab: { background: '#0a0a0a', border: 'none', color: '#444', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' },
  activeTab: { color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px' },
  searchForm: { flex: 1, maxWidth: '400px', margin: '0 30px' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', padding: '12px', color: '#fff' },
  navRight: { display: 'flex', gap: '15px', alignItems: 'center' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  userPic: { width: '35px', height: '35px', borderRadius: '50%' },
  logoutMini: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '10px' },
  alexBtnMini: { border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  contentArea: { flex: 1, overflowY: 'auto', padding: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #111' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px' },
  videoTitle: { fontSize: '13px', fontWeight: 'bold', margin: 0 },
  playerWrap: { gridColumn: '1/-1', height: '70vh', position: 'relative' },
  iframe: { width: '100%', height: '100%', border: 'none', borderRadius: '20px' },
  closeVideoBtn: { position: 'absolute', top: '15px', right: '15px', background: '#ff0000', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  fullFrame: { width: '100%', height: '100%' },
  adminFrame: { position: 'fixed', inset: '20px', background: '#050505', zIndex: 1000, borderRadius: '30px', border: '1px solid #222', display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '25px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' },
  adminBody: { flex: 1, padding: '25px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  adminSection: { background: '#0a0a0a', padding: '20px', borderRadius: '20px', border: '1px solid #111' },
  adminActionRow: { display: 'flex', gap: '10px', marginBottom: '15px' },
  adminInputText: { flex: 1, background: '#000', border: '1px solid #222', padding: '10px', color: '#fff', borderRadius: '8px' },
  scrollList: { height: '250px', overflowY: 'auto' },
  listItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #111' },
  deleteBtn: { background: '#ff0000', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px' },
  addBtn: { background: '#00ff41', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer' },
  logContainer: { background: '#000', padding: '20px', borderRadius: '15px', height: '100%', overflowY: 'auto', fontFamily: 'monospace' },
  logItem: { padding: '5px 0', borderBottom: '1px solid #0a0a0a', fontSize: '12px' },
  notifContainer: { position: 'fixed', top: '20px', right: '20px', zIndex: 2000 },
  notif: { background: '#0a0a0a', padding: '15px 25px', borderRadius: '10px', marginBottom: '10px', borderLeft: '4px solid' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  miniCard: { background: '#0a0a0a', padding: '40px', borderRadius: '25px', borderTop: '4px solid', width: '320px', textAlign: 'center' },
  adminInput: { width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '10px', fontSize: '20px', textAlign: 'center', marginBottom: '20px' },
  confirmBtn: { border: 'none', color: '#fff', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer' },
  errorText: { color: '#ff4444', marginBottom: '15px', fontSize: '12px' },
  bannedScreen: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorBox: { textAlign: 'center', border: '1px solid #ff0000', padding: '40px', borderRadius: '20px' }
};

if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    .loader { width: 40px; height: 40px; border: 3px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .glitch { animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  `;
  document.head.appendChild(s);
}
