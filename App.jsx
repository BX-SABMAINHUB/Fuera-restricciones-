import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, update, push, get 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - RECONSTRUCCIÓN TOTAL DE SISTEMAS
 * ============================================================================
 * @version: 13.0.9-FINAL-FIXED
 * @author: Gemini AI (Rebuild)
 * @status: OPERATIONAL - ALL SYSTEMS GO
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
  appId: "1:463204402982:web:fe740a662fbfd50452a3e7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- CONSTANTES MAESTRAS ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-ULTRA-PRO";

// --- UTILIDADES DE SISTEMA ---
const sanitizeEmail = (email) => {
  // Solución definitiva para correos .eu / .com: Codificación segura para Firebase
  return btoa(email.toLowerCase()).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
};

export default function AlexHubUltraV13() {
  // --- ESTADOS DE NÚCLEO ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // --- ESTADOS DE SEGURIDAD (REALTIME) ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);

  // --- NAVEGACIÓN Y MULTIMEDIA ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // --- ADMINISTRACIÓN ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');
  const [notifications, setNotifications] = useState([]);

  // ==========================================
  // PROTOCOLO DE PÁNICO (MANAGEBAC REDIRECT)
  // ==========================================
  const triggerPanicButton = () => {
    // 1. Abrir la App ManageBac (Deep Link)
    window.location.href = "managebac://";
    
    // 2. Fallback: Si no abre la app, ir a la web en otra pestaña y cerrar esta
    setTimeout(() => {
        window.open("https://managebac.com", "_blank");
        window.close();
        // Fallback final para navegadores que bloquean window.close
        window.location.href = "about:blank";
    }, 300);
  };

  // ==========================================
  // 1. GESTIÓN DE AUTENTICACIÓN Y SEGURIDAD
  // ==========================================

  useEffect(() => {
    // Forzar persistencia para evitar "missing initial state"
    setPersistence(auth, browserLocalPersistence);

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await verifyPermissions(currentUser.email);
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Escucha Realtime de Bases de Datos
    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const data = s.val() || {};
      setSystemLogs(Object.values(data).reverse().slice(0, 60));
    });

    return () => {
      unsubscribeAuth(); unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs();
    };
  }, []);

  const verifyPermissions = async (email) => {
    const key = sanitizeEmail(email);
    
    // Verificar Ban primero
    const blackRef = ref(db, `blacklist/${key}`);
    const blackSnap = await get(blackRef);
    
    if (blackSnap.exists()) {
      setIsBanned(true);
      setAccessGranted(false);
      setAuthLoading(false);
      return;
    }

    // Verificar Whitelist
    const whiteRef = ref(db, `whitelist/${key}`);
    const whiteSnap = await get(whiteRef);
    
    if (whiteSnap.exists() || email === "alex.admin@pro.com") {
      setAccessGranted(true);
      setIsBanned(false);
    } else {
      setAccessGranted(false);
      setLoginError("SISTEMA: Tu cuenta no tiene permiso de acceso.");
    }
    setAuthLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      addNotification("Conectando con Google...", "info");
    } catch (error) {
      setLoginError(`ERROR AUTH: ${error.message}`);
      addNotification("Fallo en la autenticación", "error");
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => window.location.reload());
  };

  // ==========================================
  // 2. COMANDOS DE ADMINISTRADOR (FIXED)
  // ==========================================

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("MODO DIOS ACTIVADO", "success");
      logActivity("ACCESO ADMIN: Panel de control abierto");
    } else {
      addNotification("CONTRASEÑA INCORRECTA", "error");
      logActivity(`FALLO ADMIN: Intento con pass: ${alexPassInput}`);
    }
  };

  const processUserCommand = async (targetEmail, table, action) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      return addNotification("E-mail inválido", "error");
    }

    const key = sanitizeEmail(targetEmail);
    const databasePath = `${table}/${key}`;

    try {
      if (action === 'ADD') {
        await set(ref(db, databasePath), {
          email: targetEmail.toLowerCase(),
          timestamp: serverTimestamp(),
          authorized_by: user?.email || "System"
        });
        addNotification(`${targetEmail} agregado a ${table}`, "success");
      } else {
        await remove(ref(db, databasePath));
        addNotification(`${targetEmail} removido de ${table}`, "info");
      }
      setNewEmailInput('');
      logActivity(`COMMAND: ${action} en ${table} para ${targetEmail}`);
    } catch (err) {
      addNotification("Error de Base de Datos", "error");
    }
  };

  const logActivity = (msg) => {
    const logRef = push(ref(db, 'logs'));
    set(logRef, {
      msg,
      user: user?.email || 'Guest',
      time: new Date().toLocaleString()
    });
  };

  // ==========================================
  // 3. MOTOR MULTIMEDIA (YT API V3)
  // ==========================================

  const executeSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    
    try {
      if (mode === 'youtube') {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
      logActivity(`SEARCH: [${mode}] ${query}`);
    } catch (err) {
      addNotification("Error al conectar con YouTube", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // 4. RENDERIZADO DE INTERFAZ
  // ==========================================

  if (authLoading) return (
    <div style={styles.fullCenter}>
      <div className="loader"></div>
      <h1 style={styles.loadingText}>ALEX HUB ULTRA V13</h1>
      <p style={{color: '#333'}}>INICIALIZANDO PROTOCOLOS DE SEGURIDAD...</p>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      
      {/* BOTÓN DE PÁNICO FLOTANTE */}
      <button onClick={triggerPanicButton} style={styles.panicBtn}>PÁNICO</button>

      {/* SISTEMA DE NOTIFICACIONES */}
      <div style={styles.notifContainer}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notif, borderLeftColor: n.type === 'error' ? '#ff0000' : '#00ff41'}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={styles.bannedOverlay}>
          <div style={styles.bannedBox}>
            <h1 className="glitch">SISTEMA BLOQUEADO</h1>
            <p>Tu acceso ha sido revocado por el administrador Alex.</p>
            <button onClick={handleLogout} style={styles.logoutLarge}>SALIR DEL SISTEMA</button>
          </div>
        </div>
      ) : !accessGranted ? (
        <div style={styles.loginWrapper}>
          <div style={styles.loginCard}>
            <h1 style={styles.mainTitle}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
            <p style={styles.subTitle}>SISTEMA DE GESTIÓN MULTIMEDIA PRIVADO</p>
            
            <div style={{margin: '50px 0'}}>
              {!user ? (
                <button onClick={handleGoogleLogin} style={styles.googleAuthBtn}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" />
                  INICIAR CON GOOGLE
                </button>
              ) : (
                <div style={styles.waitingState}>
                  <p>HOLA, {user.displayName}</p>
                  <span style={{color: '#ff9800', fontSize: '11px'}}>ESPERANDO AUTORIZACIÓN DE WHITELIST...</span>
                  <button onClick={handleLogout} style={styles.cancelLink}>CANCELAR</button>
                </div>
              )}
            </div>

            {loginError && <div style={styles.errorBanner}>{loginError}</div>}

            <button onClick={() => setShowAlexLogin(true)} style={styles.alexTrigger}>ADMINISTRACIÓN</button>
          </div>
        </div>
      ) : (
        /* VISTA PRINCIPAL DEL HUB */
        <>
          <nav style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.brandBox}>
                <span style={styles.brandA}>ALEX</span>
                <span style={styles.brandB}>ULTRA V13</span>
              </div>
              <div style={styles.navLinks}>
                {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => {setMode(m); setSelectedVideo(null)}} 
                    style={mode === m ? styles.navActive : styles.navBtn}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={executeSearch} style={styles.searchContainer}>
              <input 
                style={styles.mainInput} 
                placeholder={`Buscar en ${mode.toUpperCase()}...`} 
                value={query} 
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" style={styles.searchIcon}>🔍</button>
            </form>

            <div style={styles.headerRight}>
              <div style={styles.userProfile}>
                <img src={user.photoURL} style={styles.avatar} alt="p" />
                <div style={styles.userText}>
                  <span style={styles.uName}>{user.displayName}</span>
                  <button onClick={handleLogout} style={styles.uLogout}>CERRAR</button>
                </div>
              </div>
              <button onClick={() => setShowAlexLogin(true)} style={styles.adminSquare}>ALEX</button>
            </div>
          </nav>

          <main style={styles.viewport}>
            {loadingContent && <div style={styles.loaderOverlay}><div className="loader"></div></div>}

            {mode === 'youtube' && (
              <div style={styles.contentGrid}>
                {selectedVideo ? (
                  <div style={styles.playerWrapper}>
                    <iframe 
                      src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`} 
                      style={styles.fullIframe} 
                      allowFullScreen 
                    />
                    <button onClick={() => setSelectedVideo(null)} style={styles.backBtn}>VOLVER AL LISTADO</button>
                  </div>
                ) : (
                  videos.map((v, i) => (
                    <div key={i} style={styles.videoCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                      <div style={styles.videoThumbWrap}>
                        <img src={v.snippet.thumbnails.high.url} style={styles.vImg} alt="t" />
                        <div style={styles.vHover}>REPRODUCIR AHORA</div>
                      </div>
                      <div style={styles.vMeta}>
                        <h4 style={styles.vTitle}>{v.snippet.title}</h4>
                        <p style={styles.vAuthor}>{v.snippet.channelTitle}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {mode !== 'youtube' && (
              <div style={styles.fullScreenPlayer}>
                <iframe 
                  src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                       "https://www.xbox.com/play"} 
                  style={styles.fullIframe}
                />
              </div>
            )}
          </main>
        </>
      )}

      {/* MODAL DE SEGURIDAD PARA PANEL ALEX */}
      {showAlexLogin && (
        <div style={styles.modalBackdrop}>
          <div style={styles.adminLoginCard}>
             <h2>PROTECCIÓN DE SISTEMA</h2>
             <p style={{fontSize: '11px', color: '#555'}}>SE REQUIERE CONTRASEÑA MAESTRA</p>
             <form onSubmit={handleAdminAuth}>
               <input 
                 type="password" 
                 placeholder="CONTRASEÑA" 
                 value={alexPassInput} 
                 onChange={e => setAlexPassInput(e.target.value)} 
                 style={styles.adminPassInput}
                 autoFocus
               />
               <div style={styles.adminBtnRow}>
                 <button type="submit" style={styles.btnConfirmAdmin}>ACCEDER</button>
                 <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.btnCancelAdmin}>CERRAR</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* PANEL DE CONTROL CENTRAL (COMMAND CENTER) */}
      {isAdminOpen && (
        <div style={styles.adminPanel}>
          <div style={styles.adminHeader}>
            <h1 style={{fontSize: '20px', color: '#E50914'}}>ALEX COMMAND CENTER V13</h1>
            <div style={styles.adminTabs}>
              <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.tabOn : styles.tabOff}>USUARIOS</button>
              <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.tabOn : styles.tabOff}>SISTEMA</button>
              <button onClick={() => setIsAdminOpen(false)} style={styles.exitAdmin}>X</button>
            </div>
          </div>

          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminColumns}>
                {/* COLUMNA WHITELIST */}
                <div style={styles.col}>
                  <h3 style={{color: '#00ff41'}}>✅ WHITELIST</h3>
                  <div style={styles.addInputRow}>
                    <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.colInp} />
                    <button onClick={() => processUserCommand(newEmailInput, 'whitelist', 'ADD')} style={styles.colAdd}>AÑADIR</button>
                  </div>
                  <div style={styles.colList}>
                    {Object.values(whitelist).map(u => (
                      <div key={u.email} style={styles.colItem}>
                        <span>{u.email}</span>
                        <button onClick={() => processUserCommand(u.email, 'whitelist', 'REMOVE')} style={styles.colDel}>QUITAR</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA BLACKLIST */}
                <div style={styles.col}>
                  <h3 style={{color: '#ff0000'}}>🚫 BLACKLIST (BAN)</h3>
                  <div style={styles.addInputRow}>
                    <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.colInp} />
                    <button onClick={() => processUserCommand(newEmailInput, 'blacklist', 'ADD')} style={styles.colBan}>BANEAR</button>
                  </div>
                  <div style={styles.colList}>
                    {Object.values(blacklist).map(u => (
                      <div key={u.email} style={styles.colItem}>
                        <span>{u.email}</span>
                        <button onClick={() => processUserCommand(u.email, 'blacklist', 'REMOVE')} style={styles.colUnban}>PERDONAR</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.logWrap}>
                <div style={styles.logMonitor}>
                  {systemLogs.map((l, i) => (
                    <div key={i} style={styles.logLine}>
                      <span style={{color: '#444'}}>[{l.time}]</span> <span style={{color: '#E50914'}}>{l.user}:</span> {l.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>SISTEMA: OPERATIVO</span>
        <span>ALEX HUB ULTRA V13 - 2026</span>
        <span>FIREBASE: CONECTADO</span>
      </footer>
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE ESTILOS (SISTEMA VISUAL)
// ==========================================
const styles = {
  appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#020202', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loadingText: { color: '#E50914', letterSpacing: '8px', fontSize: '24px', fontWeight: '900', marginTop: '20px' },
  
  panicBtn: { position: 'fixed', bottom: '30px', right: '30px', background: '#ff0000', color: '#fff', border: 'none', padding: '15px 25px', borderRadius: '50px', fontWeight: '900', fontSize: '14px', zIndex: 99999, cursor: 'pointer', boxShadow: '0 0 30px rgba(255,0,0,0.6)', border: '2px solid rgba(255,255,255,0.3)' },

  // LOGIN
  loginWrapper: { height: '100vh', background: 'radial-gradient(circle at center, #111, #000)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginCard: { background: 'rgba(5,5,5,0.8)', padding: '60px', borderRadius: '40px', border: '1px solid #1a1a1a', textAlign: 'center', backdropFilter: 'blur(20px)', width: '450px' },
  mainTitle: { fontSize: '42px', fontWeight: '900', letterSpacing: '5px', margin: 0 },
  subTitle: { fontSize: '10px', color: '#444', letterSpacing: '3px', marginTop: '10px' },
  googleAuthBtn: { background: '#fff', color: '#000', border: 'none', padding: '16px 30px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '700', cursor: 'pointer', transition: '0.3s', margin: '0 auto' },
  alexTrigger: { background: 'transparent', border: 'none', color: '#222', fontSize: '11px', cursor: 'pointer', marginTop: '30px' },
  errorBanner: { background: 'rgba(255,0,0,0.1)', color: '#ff4444', padding: '15px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },

  // HEADER
  header: { height: '80px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', zIndex: 100 },
  brandBox: { display: 'flex', flexDirection: 'column', borderLeft: '3px solid #E50914', paddingLeft: '15px' },
  brandA: { fontSize: '22px', fontWeight: '900' },
  brandB: { fontSize: '9px', color: '#E50914', fontWeight: 'bold' },
  navLinks: { display: 'flex', gap: '10px', marginLeft: '30px' },
  navBtn: { background: '#0a0a0a', border: 'none', color: '#555', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' },
  navActive: { background: '#E50914', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px' },

  searchContainer: { flex: 1, maxWidth: '600px', margin: '0 40px', position: 'relative' },
  mainInput: { width: '100%', background: '#050505', border: '1px solid #222', padding: '14px 25px', borderRadius: '12px', color: '#fff', outline: 'none' },
  searchIcon: { position: 'absolute', right: '15px', top: '12px', background: 'none', border: 'none', cursor: 'pointer' },

  headerRight: { display: 'flex', gap: '20px', alignItems: 'center' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', background: '#080808', padding: '6px 15px', borderRadius: '15px', border: '1px solid #111' },
  avatar: { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' },
  userText: { display: 'flex', flexDirection: 'column' },
  uName: { fontSize: '11px', fontWeight: 'bold' },
  uLogout: { background: 'none', border: 'none', color: '#E50914', fontSize: '9px', textAlign: 'left', cursor: 'pointer', padding: 0 },
  adminSquare: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' },

  // VIEWPORT
  viewport: { flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  videoCard: { background: '#080808', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: '0.3s', border: '1px solid #111' },
  videoThumbWrap: { position: 'relative', aspectRatio: '16/9' },
  vImg: { width: '100%', height: '100%', objectFit: 'cover' },
  vHover: { position: 'absolute', inset: 0, background: 'rgba(229, 9, 20, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', fontWeight: 'bold' },
  vMeta: { padding: '15px' },
  vTitle: { fontSize: '14px', margin: '0 0 10px 0', height: '40px', overflow: 'hidden' },
  vAuthor: { color: '#444', fontSize: '11px' },

  playerWrapper: { gridColumn: '1/-1', background: '#000', borderRadius: '20px', overflow: 'hidden', height: '80vh', position: 'relative' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  backBtn: { position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.8)', color: '#fff', border: '1px solid #333', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  fullScreenPlayer: { width: '100%', height: '85vh', borderRadius: '20px', overflow: 'hidden' },

  // ADMIN PANEL
  adminPanel: { position: 'fixed', inset: '30px', background: '#050505', borderRadius: '30px', zIndex: 1000, border: '1px solid #222', display: 'flex', flexDirection: 'column', boxShadow: '0 0 100px rgba(0,0,0,1)' },
  adminHeader: { padding: '25px 40px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminTabs: { display: 'flex', gap: '15px', alignItems: 'center' },
  tabOn: { background: 'none', border: 'none', color: '#fff', borderBottom: '2px solid #E50914', padding: '10px', fontWeight: 'bold', cursor: 'pointer' },
  tabOff: { background: 'none', border: 'none', color: '#444', padding: '10px', cursor: 'pointer' },
  exitAdmin: { background: '#222', color: '#fff', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' },
  adminBody: { flex: 1, padding: '40px', overflowY: 'auto' },
  adminColumns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  col: { background: '#080808', padding: '30px', borderRadius: '20px', border: '1px solid #111' },
  addInputRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  colInp: { flex: 1, background: '#000', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px' },
  colAdd: { background: '#00ff41', color: '#000', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  colBan: { background: '#ff0000', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  colList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  colItem: { background: '#000', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' },
  colDel: { background: '#111', color: '#555', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' },
  colUnban: { background: '#00ff41', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' },

  logMonitor: { background: '#000', padding: '30px', borderRadius: '15px', fontFamily: 'monospace', fontSize: '12px', height: '500px', overflowY: 'auto', border: '1px solid #111' },
  logLine: { padding: '5px 0', borderBottom: '1px solid #080808' },

  // NOTIFS & MODALS
  notifContainer: { position: 'fixed', top: '30px', right: '30px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notif: { background: '#0a0a0a', color: '#fff', padding: '15px 25px', borderRadius: '12px', borderLeft: '5px solid', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  adminLoginCard: { background: '#080808', padding: '50px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', width: '380px' },
  adminPassInput: { width: '100%', background: '#000', border: '1px solid #E50914', color: '#fff', padding: '15px', borderRadius: '12px', fontSize: '24px', textAlign: 'center', margin: '20px 0', outline: 'none' },
  adminBtnRow: { display: 'flex', gap: '10px' },
  btnConfirmAdmin: { flex: 1, background: '#E50914', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  btnCancelAdmin: { background: 'none', color: '#444', border: 'none', cursor: 'pointer' },

  footer: { height: '50px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', fontSize: '10px', color: '#333' }
};

// --- INYECCIÓN DE ESTILOS GLOBALES ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body { margin: 0; background: #000; overflow: hidden; }
    .loader { width: 40px; height: 40px; border: 4px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .videoCard:hover { border-color: #E50914; transform: translateY(-5px); }
    .videoCard:hover .vHover { opacity: 1; }
    .glitch { animation: flash 0.5s infinite; }
    @keyframes flash { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
  `;
  document.head.appendChild(style);
}
