import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update, push, get 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (FIXED & STABLE)
 * ============================================================================
 * @author: Alex Hub Engineering
 * @version: 13.0.7-ULTRA-STABLE
 * @patch: Auth State Fix, Key Mapping Fix, Admin Commands Fix
 * ============================================================================
 */

// --- CONFIGURACIÓN DE NÚCLEO (FIREBASE) ---
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

// Configuración de persistencia para evitar el error de "missing initial state"
setPersistence(auth, browserLocalPersistence);

// --- CONSTANTES ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.7-ULTRA-FIXED";

export default function AlexHubUltraV13() {
  // --- ESTADOS DE SEGURIDAD ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);

  // --- ESTADOS DE DATOS ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);

  // --- UI & NAVEGACIÓN ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // --- PANEL ADMIN ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');

  const [notifications, setNotifications] = useState([]);
  const themeColor = '#E50914';

  // --- UTILIDADES DE LLAVES (FIX PARA CUALQUIER DOMINIO) ---
  const encodeEmail = (email) => email.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_');
  const decodeEmail = (key) => key.replace(/_dot_/g, '.').replace(/_at_/g, '@');

  // ==========================================
  // 1. GESTIÓN DE AUTENTICACIÓN Y SEGURIDAD
  // ==========================================

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkFullAccess(currentUser.email);
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Suscripciones Realtime
    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const data = s.val() || {};
      setSystemLogs(Object.values(data).reverse().slice(0, 50));
    });

    return () => {
      unsubscribeAuth();
      unsubWhite();
      unsubBlack();
      unsubPrem();
      unsubLogs();
    };
  }, []);

  const checkFullAccess = async (email) => {
    const key = encodeEmail(email);
    
    // Primero verificar baneo
    const blackSnap = await get(ref(db, `blacklist/${key}`));
    if (blackSnap.exists()) {
      setIsBanned(true);
      setAccessGranted(false);
      setAuthLoading(false);
      return;
    }

    setIsBanned(false);
    // Luego verificar Whitelist
    const whiteSnap = await get(ref(db, `whitelist/${key}`));
    if (whiteSnap.exists() || email === "admin@alexhub.com") {
      setAccessGranted(true);
      logActivity(`Acceso Autorizado: ${email}`);
    } else {
      setAccessGranted(false);
      setLoginError("ACCESO DENEGADO: NO ESTÁS EN LA WHITELIST.");
    }
    setAuthLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      // Forzar popup para evitar problemas de redirección y sessionStorage
      const result = await signInWithPopup(auth, googleProvider);
      addNotification("Conectado con éxito", "success");
    } catch (error) {
      console.error(error);
      setLoginError(`Error de Auth: ${error.code}. Intenta limpiar caché.`);
      addNotification("Error de Google Login", "error");
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => window.location.reload());
  };

  // ==========================================
  // 2. COMANDOS DE ADMINISTRACIÓN (FIXED)
  // ==========================================

  const handleAlexSubmit = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("BIENVENIDO, ALEX", "success");
    } else {
      addNotification("CLAVE INCORRECTA", "error");
    }
  };

  const logActivity = (msg) => {
    const logRef = push(ref(db, 'logs'));
    set(logRef, {
      msg,
      user: auth.currentUser?.email || 'System',
      timestamp: new Date().toISOString()
    });
  };

  const runCommand = async (table, targetEmail, action) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      addNotification("Email inválido", "error");
      return;
    }

    const key = encodeEmail(targetEmail);
    const dbRef = ref(db, `${table}/${key}`);

    try {
      if (action === 'add') {
        await set(dbRef, {
          email: targetEmail.toLowerCase(),
          timestamp: serverTimestamp(),
          admin: user?.email || 'Alex'
        });
        addNotification(`Añadido: ${targetEmail}`, "success");
        logActivity(`ADMIN: Añadió ${targetEmail} a ${table}`);
      } else {
        await remove(dbRef);
        addNotification(`Eliminado: ${targetEmail}`, "info");
        logActivity(`ADMIN: Eliminó ${targetEmail} de ${table}`);
      }
      setNewEmailInput('');
    } catch (err) {
      addNotification("Error en base de datos", "error");
    }
  };

  // ==========================================
  // 3. MOTOR DE BÚSQUEDA
  // ==========================================

  const handleSearch = async (e) => {
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

  // --- LOADER ---
  if (authLoading) return (
    <div style={styles.fullCenter}>
      <div className="loader"></div>
      <h2 style={{color: themeColor, letterSpacing: '4px'}}>CARGANDO ALEX HUB ULTRA...</h2>
    </div>
  );

  // --- PANTALLA BANEO ---
  if (isBanned) return (
    <div style={styles.bannedScreen}>
      <div style={styles.errorBox}>
        <h1 className="glitch">SYSTEM BANNED</h1>
        <p>Tu cuenta ha sido bloqueada. Contacta con soporte para una apelación.</p>
        <button onClick={handleLogout} style={styles.logoutBtnLarge}>SALIR</button>
      </div>
    </div>
  );

  // ==========================================
  // 4. RENDERIZADO DE INTERFAZ
  // ==========================================

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

      {/* LOGIN O DASHBOARD */}
      {(!user || !accessGranted) ? (
        <div style={styles.loginPage}>
          <div style={styles.loginCard}>
            <h1 style={styles.glitchText}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
            <p style={styles.versionTag}>{SYSTEM_VERSION}</p>
            
            <div style={{margin: '40px 0'}}>
              {!user ? (
                <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" />
                  ENTRAR CON GOOGLE
                </button>
              ) : (
                <div style={styles.pendingStatus}>
                  <p style={{color: '#ff9800'}}>REVISANDO WHITELIST...</p>
                  <p style={{fontSize: '11px'}}>{user.email}</p>
                  <button onClick={handleLogout} style={styles.logoutMini}>CANCELAR</button>
                </div>
              )}
            </div>

            {loginError && <div style={styles.errorText}>{loginError}</div>}

            <div style={{marginTop: '50px'}}>
               <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtn}>LOGIN ADMINISTRADOR</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* NAVBAR */}
          <nav style={styles.navbar}>
            <div style={styles.navLeft}>
              <div style={styles.logoBox}>
                <span style={styles.logoMain}>ALEX</span>
                <span style={{color: themeColor, fontSize: '10px', fontWeight: 'bold'}}>V13 ULTRA</span>
              </div>
              <div style={styles.tabContainer}>
                {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
                  <button key={m} onClick={() => setMode(m)} style={mode === m ? {...styles.activeTab, background: themeColor} : styles.tab}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSearch} style={styles.searchForm}>
              <input 
                style={styles.searchInput} 
                placeholder={`Buscar en ${mode}...`} 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
              />
              <button type="submit" style={styles.searchIconBtn}>🔍</button>
            </form>

            <div style={styles.navRight}>
               {premiumUsers[encodeEmail(user.email)] && <span className="premium-badge">💎 PREMIUM</span>}
               <img src={user.photoURL} style={styles.userPic} />
               <button onClick={() => setShowAlexLogin(true)} style={{...styles.alexBtnMini, background: themeColor}}>ADMIN</button>
            </div>
          </nav>

          <main style={styles.contentArea}>
            {loadingContent && <div style={styles.loadOverlay}><div className="loader"></div></div>}
            
            {mode === 'youtube' && (
              <div style={styles.grid}>
                {selectedVideo ? (
                  <div style={styles.playerWrap}>
                    <iframe src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
                    <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>VOLVER</button>
                  </div>
                ) : (
                  videos.map((v, i) => (
                    <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                      <img src={v.snippet.thumbnails.high.url} style={styles.thumb} />
                      <div style={styles.cardInfo}>
                        <p style={styles.videoTitle}>{v.snippet.title}</p>
                        <p style={styles.videoChannel}>{v.snippet.channelTitle}</p>
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

      {/* MODAL PASSWORD ALEX */}
      {showAlexLogin && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.miniCard, borderTopColor: themeColor}}>
             <h3>ALEX COMMAND CENTER</h3>
             <form onSubmit={handleAlexSubmit}>
               <input 
                 type="password" 
                 placeholder="PASSWORD" 
                 value={alexPassInput} 
                 onChange={e => setAlexPassInput(e.target.value)} 
                 style={styles.adminInput}
                 autoFocus
               />
               <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                 <button type="submit" style={{...styles.confirmBtn, background: themeColor}}>AUTORIZAR</button>
                 <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>CANCELAR</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* PANEL ADMIN GIGANTE */}
      {isAdminOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <h1 style={{color: themeColor}}>ALEX HUB | MASTER CONTROL</h1>
            <div style={{display:'flex', gap:'10px'}}>
               <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.adminTabActive : styles.adminTab}>USUARIOS</button>
               <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.adminTabActive : styles.adminTab}>LOGS</button>
               <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>CERRAR</button>
            </div>
          </div>
          
          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminGrid}>
                {/* WHITELIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#00ff41'}}>WHITELIST</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@dominio..." style={styles.adminInputText}/>
                      <button onClick={() => runCommand('whitelist', newEmailInput, 'add')} style={styles.addBtn}>AÑADIR</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.keys(whitelist).map(key => (
                        <div key={key} style={styles.listItem}>
                           <span>{decodeEmail(key)}</span>
                           <button onClick={() => runCommand('whitelist', decodeEmail(key), 'remove')} style={styles.deleteBtn}>QUITAR</button>
                        </div>
                      ))}
                   </div>
                </div>

                {/* BLACKLIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#ff0000'}}>BAN LIST</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@dominio..." style={styles.adminInputText}/>
                      <button onClick={() => runCommand('blacklist', newEmailInput, 'add')} style={styles.banBtnAction}>BAN</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.keys(blacklist).map(key => (
                        <div key={key} style={styles.listItem}>
                           <span>{decodeEmail(key)}</span>
                           <button onClick={() => runCommand('blacklist', decodeEmail(key), 'remove')} style={styles.unbanBtn}>PERDONAR</button>
                        </div>
                      ))}
                   </div>
                </div>

                {/* PREMIUM */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#FFD700'}}>PREMIUM</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@dominio..." style={styles.adminInputText}/>
                      <button onClick={() => runCommand('premium_users', newEmailInput, 'add')} style={styles.premiumBtnAdd}>DAR</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.keys(premiumUsers).map(key => (
                        <div key={key} style={styles.listItem}>
                           <span>{decodeEmail(key)}</span>
                           <button onClick={() => runCommand('premium_users', decodeEmail(key), 'remove')} style={styles.deleteBtn}>QUITAR</button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
              <div style={styles.logContainer}>
                {systemLogs.map((log, i) => (
                  <div key={i} style={styles.logItem}>
                    <span style={{color: themeColor}}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span style={{color: '#666'}}> {log.user}:</span> {log.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <div>SISTEMA: <span style={{color: '#00ff41'}}>ONLINE</span></div>
        <div>ALEX HUB ULTRA V13 © 2026</div>
      </footer>
    </div>
  );
}

// --- ESTILOS MEJORADOS ---
const styles = {
  appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff', overflow: 'hidden', fontFamily: 'Inter, sans-serif' },
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loginPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #111 0%, #000 100%)' },
  loginCard: { background: 'rgba(15,15,15,0.95)', padding: '60px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', boxShadow: '0 0 50px rgba(0,0,0,1)' },
  glitchText: { fontSize: '40px', fontWeight: '900', letterSpacing: '5px' },
  versionTag: { color: '#444', fontSize: '10px', marginTop: '-10px' },
  googleBtn: { background: '#fff', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', margin: '0 auto' },
  alexBtn: { background: 'none', border: '1px solid #333', color: '#555', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
  errorText: { color: '#ff4444', fontSize: '12px', marginTop: '20px' },

  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', borderBottom: '1px solid #111' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  logoBox: { borderLeft: '3px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '24px', fontWeight: '900' },
  tabContainer: { display: 'flex', gap: '5px' },
  tab: { background: '#111', border: 'none', color: '#444', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  activeTab: { color: '#fff', padding: '10px 15px', borderRadius: '5px', border: 'none', fontSize: '11px', fontWeight: 'bold' },
  
  searchForm: { flex: 1, maxWidth: '400px', position: 'relative', margin: '0 20px' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #222', padding: '12px 20px', borderRadius: '20px', color: '#fff', outline: 'none' },
  searchIconBtn: { position: 'absolute', right: '15px', top: '10px', background: 'none', border: 'none', cursor: 'pointer' },
  
  navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  userPic: { width: '35px', height: '35px', borderRadius: '50%' },
  alexBtnMini: { border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },

  contentArea: { flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px' },
  videoTitle: { fontSize: '13px', fontWeight: 'bold', height: '35px', overflow: 'hidden' },
  videoChannel: { fontSize: '11px', color: '#444' },

  playerWrap: { gridColumn: '1/-1', height: '70vh', background: '#000', position: 'relative' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  closeVideoBtn: { position: 'absolute', top: '10px', right: '10px', background: '#ff0000', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' },
  fullFrame: { width: '100%', height: '100%', background: '#000' },

  adminFrame: { position: 'fixed', inset: '20px', background: '#080808', zIndex: 1000, borderRadius: '20px', display: 'flex', flexDirection: 'column', border: '1px solid #222', boxShadow: '0 0 100px #000' },
  adminHeader: { padding: '20px 40px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { flex: 1, padding: '30px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  adminSection: { background: '#0d0d0d', padding: '20px', borderRadius: '15px', border: '1px solid #1a1a1a' },
  adminActionRow: { display: 'flex', gap: '10px', marginBottom: '15px' },
  adminInputText: { flex: 1, background: '#000', border: '1px solid #222', color: '#fff', padding: '10px', borderRadius: '5px' },
  scrollList: { height: '300px', overflowY: 'auto' },
  listItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#050505', marginBottom: '5px', borderRadius: '5px', fontSize: '12px' },
  
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '10px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  deleteBtn: { background: '#222', color: '#ff4444', border: 'none', padding: '5px', borderRadius: '3px', cursor: 'pointer' },
  banBtnAction: { background: '#ff0000', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '5px', borderRadius: '3px', cursor: 'pointer' },
  premiumBtnAdd: { background: '#FFD700', color: '#000', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' },
  
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  miniCard: { background: '#0a0a0a', padding: '40px', borderRadius: '20px', borderTop: '4px solid' },
  adminInput: { width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '15px', fontSize: '20px', textAlign: 'center', marginBottom: '20px' },
  confirmBtn: { padding: '10px 30px', border: 'none', borderRadius: '5px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer' },

  notifContainer: { position: 'fixed', top: '20px', right: '20px', zIndex: 3000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notif: { background: '#0a0a0a', color: '#fff', padding: '15px 25px', borderRadius: '5px', borderLeft: '5px solid', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' },
  
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '10px', color: '#333' },
  loadOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// --- INYECCIÓN DE CSS ---
if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    .loader { border: 4px solid #111; border-top-color: #E50914; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .glitch { animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .premium-badge { background: linear-gradient(45deg, #FFD700, #FFA500); color: #000; padding: 3px 8px; border-radius: 10px; font-size: 9px; font-weight: 900; }
  `;
  document.head.appendChild(s);
}
