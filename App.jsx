import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update, push 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM
 * ============================================================================
 * @author: Alex Hub Team
 * @version: 13.0.0
 * @security: Firebase Google Auth + Admin Password Gate
 * ============================================================================
 */

// --- CONFIGURACIÓN DE NÚCLEO ---
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

// --- CONSTANTES DE SISTEMA ---
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.5-ULTRA";

export default function AlexHubUltraV13() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);

  // --- ESTADOS DE BASE DE DATOS ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [serverStats, setServerStats] = useState({ usersOnline: 0, totalRequests: 0 });

  // --- NAVEGACIÓN Y MULTIMEDIA ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // --- PANEL ADMINISTRADOR (ALEX) ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users'); // 'users', 'logs', 'stats'

  // --- UI & THEME ---
  const [notifications, setNotifications] = useState([]);
  const [themeColor, setThemeColor] = useState('#E50914');

  // ==========================================
  // 1. EFECTOS INICIALES Y ESCUCHADORES
  // ==========================================

  useEffect(() => {
    // Escuchador de Autenticación
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkUserAccess(currentUser.email);
        logActivity(`Sesión iniciada: ${currentUser.email}`);
      } else {
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Escuchadores de Base de Datos en Tiempo Real
    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const data = s.val() || {};
      const logArray = Object.values(data).reverse().slice(0, 50);
      setSystemLogs(logArray);
    });

    return () => {
      unsubscribeAuth();
      unsubWhite();
      unsubBlack();
      unsubPrem();
      unsubLogs();
    };
  }, []);

  // ==========================================
  // 2. LÓGICA DE SEGURIDAD (CORREGIDA)
  // ==========================================

  const checkUserAccess = useCallback((email) => {
    const emailKey = email.replace(/\./g, ',');
    
    // Verificación en cascada: Blacklist -> Whitelist
    onValue(ref(db, `blacklist/${emailKey}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
        setAuthLoading(false);
      } else {
        setIsBanned(false);
        onValue(ref(db, `whitelist/${emailKey}`), (whiteSnap) => {
          if (whiteSnap.exists() || email === "admin@alexhub.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("CORREO NO AUTORIZADO. CONTACTA CON ALEX.");
          }
          setAuthLoading(false);
        });
      }
    });
  }, []);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      addNotification("Conectando con Google...", "info");
    } catch (error) {
      setLoginError("Error de conexión: " + error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    window.location.reload();
  };

  // ==========================================
  // 3. SISTEMA ADMINISTRADOR "ALEX" (CORREGIDO)
  // ==========================================

  const handleAlexSubmit = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("MODO ADMINISTRADOR ACTIVADO", "success");
      logActivity("ADMIN: Acceso concedido al panel de control.");
    } else {
      addNotification("CONTRASEÑA INCORRECTA", "error");
      logActivity(`ALERTA: Intento fallido de acceso Admin con pass: ${alexPassInput}`);
    }
  };

  const logActivity = (msg) => {
    const newLogRef = push(ref(db, 'logs'));
    set(newLogRef, {
      msg,
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'Sistema'
    });
  };

  const manageUser = (type, email, action) => {
    if (!email.includes('@')) return addNotification("Email inválido", "error");
    const emailKey = email.replace(/\./g, ',');
    if (action === 'add') {
      set(ref(db, `${type}/${emailKey}`), { 
        email: email, 
        addedAt: serverTimestamp(),
        addedBy: user?.email || 'Admin'
      });
      addNotification(`${email} añadido a ${type}`, "success");
    } else {
      remove(ref(db, `${type}/${emailKey}`));
      addNotification(`${email} eliminado de ${type}`, "info");
    }
  };

  // ==========================================
  // 4. BÚSQUEDA Y MULTIMEDIA
  // ==========================================

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        if (data.items) setVideos(data.items);
        setSelectedVideo(null);
      }
      logActivity(`Búsqueda en ${mode}: ${query}`);
    } catch (err) { 
      addNotification("Error en la API de búsqueda", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // ==========================================
  // 5. COMPONENTES DE INTERFAZ (UI)
  // ==========================================

  // --- LOADER ---
  if (authLoading) return (
    <div style={styles.fullCenter}>
      <div className="loader"></div>
      <p style={{marginTop: '20px', color: themeColor, letterSpacing: '3px'}}>CARGANDO NÚCLEO...</p>
    </div>
  );

  // --- PANTALLA BANEO ---
  if (isBanned) return (
    <div style={styles.bannedScreen}>
      <div style={styles.errorBox}>
        <h1 className="glitch">SISTEMA BLOQUEADO</h1>
        <p>Tu acceso ha sido revocado por violación de los términos del Alex Hub.</p>
        <div style={styles.divider}></div>
        <p style={{fontSize: '12px', color: '#555'}}>ID DE RASTREO: {user?.uid}</p>
        <button onClick={handleLogout} style={styles.logoutBtnLarge}>SALIR DEL SISTEMA</button>
      </div>
    </div>
  );

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div style={styles.appContainer}>
      
      {/* NOTIFICACIONES FLOTANTES */}
      <div style={styles.notifContainer}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notif, borderLeftColor: n.type === 'error' ? '#ff0000' : '#00ff41'}}>
            {n.text}
          </div>
        ))}
      </div>

      {/* PANTALLA DE LOGIN (Si no tiene acceso) */}
      {(!user || !accessGranted) && (
        <div style={styles.loginPage}>
          <div style={styles.loginCard}>
            <div className="shimmer-box">
              <h1 style={styles.glitchText}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
            </div>
            <p style={styles.versionTag}>{SYSTEM_VERSION}</p>
            
            <div style={styles.loginActions}>
              {!user ? (
                <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{width:'20px'}} />
                  SIGN IN WITH GOOGLE
                </button>
              ) : (
                <div style={styles.pendingStatus}>
                  <p style={{color: '#ff9800'}}>ESTADO: PENDIENTE DE APROBACIÓN</p>
                  <p style={{fontSize: '12px'}}>{user.email}</p>
                </div>
              )}
            </div>

            {loginError && <div style={styles.errorText}>{loginError}</div>}

            <div style={{marginTop: '50px', opacity: 0.5}}>
               <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtn}>SISTEMA ADMINISTRADOR</button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD (Si tiene acceso) */}
      {user && accessGranted && (
        <>
          <nav style={styles.navbar}>
            <div style={styles.navLeft}>
              <div style={styles.logoBox}>
                <span style={styles.logoMain}>ALEX</span>
                <span style={{...styles.logoSub, color: themeColor}}>ULTRA V13</span>
              </div>
              <div style={styles.tabContainer}>
                {['youtube', 'twitch', 'movies', 'xbox', 'radio'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => {setMode(m); setSelectedVideo(null)}} 
                    style={mode === m ? {...styles.activeTab, background: themeColor} : styles.tab}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={performSearch} style={styles.searchForm}>
              <input 
                style={styles.searchInput} 
                placeholder={`Buscar en la red de ${mode}...`} 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
              />
              <button type="submit" style={styles.searchIconBtn}>🔍</button>
            </form>

            <div style={styles.navRight}>
               {premiumUsers.includes(user.email.replace(/\./g, ',')) && <span className="premium-badge">💎 PREMIUM</span>}
               <div style={styles.userInfo}>
                  <img src={user.photoURL} style={styles.userPic} alt="profile" />
                  <div style={styles.userMeta}>
                    <span style={styles.userName}>{user.displayName?.split(' ')[0]}</span>
                    <button onClick={handleLogout} style={styles.logoutMini}>LOGOUT</button>
                  </div>
               </div>
               <button onClick={() => setShowAlexLogin(true)} style={{...styles.alexBtnMini, background: themeColor}}>ALEX</button>
            </div>
          </nav>

          <main style={styles.contentArea}>
            {loadingContent && <div style={styles.loadOverlay}><div className="loader"></div></div>}
            
            {mode === 'youtube' && (
              <div style={styles.grid}>
                {selectedVideo ? (
                  <div style={styles.playerWrap}>
                    <iframe 
                      src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1&rel=0&modestbranding=1`} 
                      style={styles.iframe} 
                      allowFullScreen 
                    />
                    <div style={styles.playerControls}>
                      <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>← VOLVER AL LISTADO</button>
                      <button onClick={() => addNotification("Guardado en favoritos", "info")} style={styles.favBtn}>⭐ FAVORITO</button>
                    </div>
                  </div>
                ) : (
                  videos.map((v, i) => (
                    <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                      <div style={styles.thumbWrapper}>
                        <img src={v.snippet.thumbnails.high.url} style={styles.thumb} alt="thumb" />
                        <div style={styles.playOverlay}>▶ PLAY</div>
                      </div>
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
                  <div style={styles.frameHeader}>
                    <span style={{color: themeColor}}>● LIVE STREAMING:</span> {query || 'CANAL POR DEFECTO'}
                  </div>
                  <iframe 
                    src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                         mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                         mode === 'xbox' ? "https://www.xbox.com/play" :
                         "https://www.radio.net/embed/los40"} 
                    style={styles.iframe} 
                  />
               </div>
            )}
          </main>
        </>
      )}

      {/* --- MODAL PASSWORD ALEX (FUNCIONA SIEMPRE) --- */}
      {showAlexLogin && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.miniCard, borderTopColor: themeColor}}>
             <h3 style={{letterSpacing: '5px'}}>SYSTEM ACCESS</h3>
             <p style={{fontSize: '11px', color: '#444', marginBottom: '20px'}}>ENTER CLEARANCE KEY</p>
             <form onSubmit={handleAlexSubmit}>
               <input 
                 type="password" 
                 placeholder="••••••••" 
                 value={alexPassInput} 
                 onChange={e => setAlexPassInput(e.target.value)} 
                 style={styles.adminInput}
                 autoFocus
               />
               <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                 <button type="submit" style={{...styles.confirmBtn, background: themeColor}}>AUTHORIZE</button>
                 <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>ABORT</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* --- PANEL GIGANTE ADMINISTRADOR (EL FRAME DE ALEX) --- */}
      {isAdminOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <div style={styles.adminTitle}>
              <h1 style={{color: themeColor}}>ALEX HUB | COMMAND CENTER</h1>
              <p>CONTROL DE ACCESOS Y REGISTROS DE SEGURIDAD</p>
            </div>
            <div style={{display:'flex', gap:'15px'}}>
               <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.adminTabActive : styles.adminTab}>USUARIOS</button>
               <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.adminTabActive : styles.adminTab}>LOGS</button>
               <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>APAGAR SISTEMA</button>
            </div>
          </div>
          
          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminGrid}>
                {/* COLUMNA WHITELIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#00ff41'}}>✅ WHITELIST</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.adminInputText}/>
                      <button onClick={() => {manageUser('whitelist', newEmailInput, 'add'); setNewEmailInput('')}} style={styles.addBtn}>ADD</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.values(whitelist).map(u => (
                        <div key={u.email} style={styles.listItem}>
                           <span>{u.email}</span>
                           <button onClick={() => manageUser('whitelist', u.email, 'remove')} style={styles.deleteBtn}>REMOVE</button>
                        </div>
                      ))}
                   </div>
                </div>

                {/* COLUMNA BLACKLIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#E50914'}}>🚫 BLACKLIST (BAN)</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.adminInputText}/>
                      <button onClick={() => {manageUser('blacklist', newEmailInput, 'add'); setNewEmailInput('')}} style={styles.banBtnAction}>BAN</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.values(blacklist).map(u => (
                        <div key={u.email} style={styles.listItem}>
                           <span>{u.email}</span>
                           <button onClick={() => manageUser('blacklist', u.email, 'remove')} style={styles.unbanBtn}>REVOKE</button>
                        </div>
                      ))}
                   </div>
                </div>

                {/* COLUMNA PREMIUM */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#FFD700'}}>💎 PREMIUM NODES</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.adminInputText}/>
                      <button onClick={() => {manageUser('premium_users', newEmailInput, 'add'); setNewEmailInput('')}} style={styles.premiumBtnAdd}>UPGRADE</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.values(premiumUsers).map(u => (
                        <div key={u.email} style={styles.listItem}>
                           <span>{u.email}</span>
                           <button onClick={() => manageUser('premium_users', u.email, 'remove')} style={styles.deleteBtn}>DOWNGRADE</button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
              <div style={styles.logSection}>
                <div style={styles.logHeader}>REGISTRO DE ACTIVIDAD DEL SERVIDOR</div>
                <div style={styles.logContainer}>
                  {systemLogs.map((log, idx) => (
                    <div key={idx} style={styles.logItem}>
                      <span style={{color: '#555'}}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span style={{color: themeColor}}> {log.user}:</span> {log.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <span>SISTEMA: <span style={{color: '#00ff41'}}>ONLINE</span></span>
          <span style={{marginLeft: '20px'}}>ENCRIPTACIÓN: <span style={{color: '#00ff41'}}>AES-256</span></span>
        </div>
        <div style={styles.footerRight}>
          <span>ALEX HUB ULTRA © 2026</span>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// ESTILOS DE DISEÑO (EXTENDIDOS)
// ==========================================
const styles = {
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' },
  appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
  
  // LOGIN
  loginPage: { height: '100vh', background: 'radial-gradient(circle at center, #111 0%, #000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 50 },
  loginCard: { background: 'rgba(10,10,10,0.8)', padding: '80px', borderRadius: '40px', border: '1px solid #222', textAlign: 'center', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  glitchText: { fontSize: '50px', fontWeight: '900', letterSpacing: '8px', margin: 0 },
  versionTag: { fontSize: '10px', color: '#444', letterSpacing: '4px', marginTop: '5px' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '18px 40px', borderRadius: '12px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', transition: '0.3s', margin: '40px auto' },
  alexBtn: { background: 'transparent', border: '1px solid #222', color: '#444', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', transition: '0.3s' },
  errorText: { color: '#ff4444', background: 'rgba(255,68,68,0.1)', padding: '10px', borderRadius: '8px', marginTop: '20px', fontSize: '12px', fontWeight: 'bold' },

  // NAVBAR
  navbar: { height: '90px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between', zIndex: 100 },
  logoBox: { borderLeft: '5px solid', paddingLeft: '20px', display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '28px', fontWeight: '900', letterSpacing: '2px' },
  logoSub: { fontSize: '10px', fontWeight: 'bold' },
  tabContainer: { display: 'flex', gap: '8px', marginLeft: '40px' },
  tab: { background: '#111', border: 'none', color: '#666', padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '10px', fontSize: '12px', transition: '0.3s' },
  activeTab: { color: '#fff', borderRadius: '10px', border: 'none', padding: '12px 20px', fontWeight: 'bold', fontSize: '12px' },
  
  searchForm: { flex: 1, maxWidth: '600px', margin: '0 50px', position: 'relative', display: 'flex' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', padding: '15px 50px 15px 25px', color: '#fff', outline: 'none', fontSize: '14px', transition: '0.3s' },
  searchIconBtn: { position: 'absolute', right: '15px', top: '15px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },

  navRight: { display: 'flex', gap: '20px', alignItems: 'center' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '15px', background: '#0a0a0a', padding: '8px 15px', borderRadius: '15px', border: '1px solid #111' },
  userPic: { width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '13px', fontWeight: 'bold' },
  logoutMini: { background: 'none', border: 'none', color: '#555', fontSize: '10px', cursor: 'pointer', textAlign: 'left', padding: 0 },
  alexBtnMini: { border: 'none', color: '#fff', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '12px' },

  // CONTENT
  contentArea: { flex: 1, overflowY: 'auto', padding: '40px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' },
  card: { background: '#0a0a0a', borderRadius: '20px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.4s' },
  thumbWrapper: { position: 'relative', width: '100%', aspectRatio: '16/9' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  playOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', fontWeight: 'bold' },
  cardInfo: { padding: '20px' },
  videoTitle: { fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  videoChannel: { fontSize: '12px', color: '#555' },

  playerWrap: { gridColumn: '1/-1', background: '#000', borderRadius: '30px', overflow: 'hidden', height: '80vh', position: 'relative' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  playerControls: { position: 'absolute', bottom: '30px', left: '30px', display: 'flex', gap: '15px' },
  closeVideoBtn: { background: '#fff', color: '#000', border: 'none', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  favBtn: { background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(10px)' },

  fullFrame: { width: '100%', height: '100%', borderRadius: '30px', overflow: 'hidden', background: '#000', display: 'flex', flexDirection: 'column' },
  frameHeader: { padding: '15px 30px', background: '#0a0a0a', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #111' },

  // ADMIN FRAME (ALEX)
  adminFrame: { position: 'fixed', inset: '20px', background: '#050505', border: '1px solid #333', zIndex: 500, borderRadius: '40px', display: 'flex', flexDirection: 'column', boxShadow: '0 0 100px rgba(0,0,0,1)' },
  adminHeader: { padding: '30px 50px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminTitle: { display: 'flex', flexDirection: 'column' },
  adminBody: { flex: 1, padding: '40px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', height: '100%' },
  adminSection: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '25px', padding: '30px', display: 'flex', flexDirection: 'column' },
  adminActionRow: { display: 'flex', gap: '10px', marginBottom: '25px' },
  adminInputText: { flex: 1, background: '#000', border: '1px solid #222', padding: '12px', borderRadius: '10px', color: '#fff', outline: 'none' },
  scrollList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  listItem: { background: '#050505', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  
  adminTab: { background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontWeight: 'bold' },
  adminTabActive: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', borderBottom: '2px solid #fff' },
  
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  banBtnAction: { background: '#E50914', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  premiumBtnAdd: { background: '#FFD700', color: '#000', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  deleteBtn: { background: '#1a1a1a', color: '#555', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' },
  closeAdmin: { background: '#fff', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900' },

  // LOGS
  logSection: { height: '100%', display: 'flex', flexDirection: 'column' },
  logHeader: { fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#555' },
  logContainer: { flex: 1, background: '#000', borderRadius: '20px', padding: '30px', fontFamily: 'monospace', fontSize: '13px', overflowY: 'auto', border: '1px solid #111' },
  logItem: { padding: '8px 0', borderBottom: '1px solid #0a0a0a' },

  // NOTIFS & MODALS
  notifContainer: { position: 'fixed', top: '30px', right: '30px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notif: { background: '#0a0a0a', color: '#fff', padding: '20px 30px', borderRadius: '12px', borderLeft: '5px solid', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', animation: 'slideIn 0.3s ease-out' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  miniCard: { background: '#0a0a0a', padding: '60px', borderRadius: '35px', border: '1px solid #1a1a1a', borderTop: '5px solid', textAlign: 'center', width: '400px' },
  adminInput: { width: '100%', padding: '20px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '15px', fontSize: '24px', textAlign: 'center', marginBottom: '30px', outline: 'none' },
  confirmBtn: { color: '#fff', border: 'none', padding: '18px 40px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#444', border: 'none', padding: '18px', cursor: 'pointer', fontSize: '12px' },
  
  footer: { height: '50px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', fontSize: '11px', color: '#333', borderTop: '1px solid #111' },
  bannedScreen: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorBox: { textAlign: 'center', padding: '60px', border: '1px solid #ff0000', borderRadius: '30px', background: 'rgba(255,0,0,0.05)' },
  logoutBtnLarge: { marginTop: '40px', background: '#ff0000', color: '#fff', border: 'none', padding: '20px 40px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' },
  loadOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// --- INYECCIÓN DE ANIMACIONES GLOBALES ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    
    body { margin: 0; padding: 0; background: #000; }
    
    .loader { width: 60px; height: 60px; border: 3px solid #111; border-top-color: inherit; border-radius: 50%; animation: spin 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .glitch { font-size: 60px; font-weight: 900; color: #ff0000; animation: pulse 1s infinite; letter-spacing: 5px; }
    @keyframes pulse { 0% { opacity: 1; text-shadow: 0 0 10px rgba(255,0,0,0.5); } 50% { opacity: 0.7; text-shadow: 0 0 30px rgba(255,0,0,0.8); } 100% { opacity: 1; text-shadow: 0 0 10px rgba(255,0,0,0.5); } }
    
    .shimmer-box { animation: shimmer 3s infinite linear; }
    @keyframes shimmer { 0% { filter: brightness(1); } 50% { filter: brightness(1.5); } 100% { filter: brightness(1); } }
    
    .card:hover { transform: translateY(-10px); border-color: #333; }
    .card:hover .playOverlay { opacity: 1; }
    .card:hover .thumb { transform: scale(1.1); transition: 0.6s; }
    
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #444; }

    .premium-badge {
      background: linear-gradient(45deg, #FFD700, #FFA500);
      color: #000;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 900;
      animation: gold-glow 2s infinite;
    }
    @keyframes gold-glow { 0% { box-shadow: 0 0 5px #FFD700; } 50% { box-shadow: 0 0 20px #FFD700; } 100% { box-shadow: 0 0 5px #FFD700; } }
  `;
  document.head.appendChild(style);
}
