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
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (REBUILT)
 * ============================================================================
 * @author: Alex Hub Engineering
 * @version: 13.0.9-ULTRA-PRO
 * @fix: Fixes Google Auth Session, Firebase Key Sanitize, YT Scale, Ban Revoke
 * ============================================================================
 */

// --- CONFIGURACIÓN DE NÚCLEO CORE ---
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

// --- INICIALIZACIÓN DE SERVICIOS ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configuración de persistencia para evitar el error "Missing Initial State"
setPersistence(auth, browserLocalPersistence);

// --- CONSTANTES MAESTRAS ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-ULTRA-GOLD";

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

  // --- CONTENIDO Y NAVEGACIÓN ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // --- PANEL ADMINISTRADOR ALEX ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');

  // --- UI ---
  const [notifications, setNotifications] = useState([]);
  const themeColor = '#E50914';

  // ==========================================
  // 1. UTILIDADES DE LIMPIEZA DE DATOS (CRÍTICO)
  // ==========================================
  
  // Transforma cualquier email en una ruta válida de Firebase sin importar el dominio (@gmail.eu, @alex.pro, etc)
  const sanitizeEmail = (email) => {
    if (!email) return "";
    return email.toLowerCase()
      .replace(/\./g, '_dot_')
      .replace(/@/g, '_at_')
      .replace(/#/g, '_hash_')
      .replace(/\$/g, '_dollar_')
      .replace(/\[/g, '_open_')
      .replace(/\]/g, '_close_');
  };

  const desanitizeEmail = (key) => {
    if (!key) return "";
    return key
      .replace(/_dot_/g, '.')
      .replace(/_at_/g, '@')
      .replace(/_hash_/g, '#')
      .replace(/_dollar_/g, '$')
      .replace(/_open_/g, '[')
      .replace(/_close_/g, ']');
  };

  // ==========================================
  // 2. EFECTOS DE SINCRONIZACIÓN Y AUTH
  // ==========================================

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkComprehensiveSecurity(currentUser.email);
        logActivity(`Sesión Activa: ${currentUser.email}`);
      } else {
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Escuchadores en tiempo real con validación de existencia
    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const data = s.val() || {};
      setSystemLogs(Object.values(data).reverse().slice(0, 60));
    });

    return () => {
      unsubscribeAuth();
      unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs();
    };
  }, []);

  // ==========================================
  // 3. SISTEMA DE SEGURIDAD CORREGIDO
  // ==========================================

  const checkComprehensiveSecurity = useCallback(async (email) => {
    const emailKey = sanitizeEmail(email);
    
    // Verificación de Blacklist
    const blackRef = ref(db, `blacklist/${emailKey}`);
    onValue(blackRef, (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
        setAuthLoading(false);
      } else {
        setIsBanned(false);
        // Verificación de Whitelist
        const whiteRef = ref(db, `whitelist/${emailKey}`);
        onValue(whiteRef, (whiteSnap) => {
          if (whiteSnap.exists() || email === "admin@alexhub.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("CORREO NO REGISTRADO EN WHITELIST.");
          }
          setAuthLoading(false);
        });
      }
    });
  }, []);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      // Forzar el popup para evitar problemas de redirección y particionamiento de storage
      await signInWithPopup(auth, googleProvider);
      addNotification("Autenticación en curso...", "info");
    } catch (error) {
      console.error(error);
      setLoginError(`ERROR DE AUTH: ${error.code}. Asegúrate de permitir popups.`);
      addNotification("ERROR: No se pudo procesar el login de Google.", "error");
    }
  };

  // ==========================================
  // 4. COMANDOS DE ADMINISTRACIÓN (FIXED)
  // ==========================================

  const handleAlexSystemAuth = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("CENTRO DE COMANDO ACTIVADO", "success");
      logActivity("ADMIN: Acceso al panel maestro.");
    } else {
      addNotification("PASSWORD INCORRECTO", "error");
      logActivity(`ALERTA: Intento de intrusión fallido: ${alexPassInput}`);
    }
  };

  const manageGlobalDatabase = async (table, rawEmail, action) => {
    if (!rawEmail || !rawEmail.includes('@')) {
      return addNotification("Formato de Email inválido", "error");
    }

    const emailKey = sanitizeEmail(rawEmail);
    const dbPath = `${table}/${emailKey}`;

    try {
      if (action === 'add') {
        await set(ref(db, dbPath), { 
          email: rawEmail, 
          timestamp: serverTimestamp(),
          origin: "Alex Command"
        });
        addNotification(`Usuario añadido: ${rawEmail}`, "success");
        logActivity(`ADMIN: Añadió ${rawEmail} a ${table}`);
      } else if (action === 'remove') {
        await remove(ref(db, dbPath));
        addNotification(`Baja procesada: ${rawEmail}`, "info");
        logActivity(`ADMIN: Eliminó ${rawEmail} de ${table}`);
      }
      setNewEmailInput('');
    } catch (e) {
      addNotification("Error en Base de Datos", "error");
    }
  };

  // ==========================================
  // 5. MOTOR MULTIMEDIA (VÍDEOS GRANDES)
  // ==========================================

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        if (data.items) setVideos(data.items);
        setSelectedVideo(null);
      }
      logActivity(`Búsqueda: ${query} en ${mode}`);
    } catch (err) {
      addNotification("Error en búsqueda", "error");
    }
    setLoadingContent(false);
  };

  const logActivity = (msg) => {
    const newLogRef = push(ref(db, 'logs'));
    set(newLogRef, {
      msg,
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'System'
    });
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(p => [...p, { id, text, type }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // 6. RENDERIZADO DE COMPONENTES
  // ==========================================

  if (authLoading) return (
    <div style={styles.loaderFull}>
      <div className="main-spinner"></div>
      <h2 style={{color: themeColor, marginTop: '30px', letterSpacing: '8px'}}>ALEX HUB ULTRA</h2>
    </div>
  );

  return (
    <div style={styles.appWrapper}>
      
      {/* OVERLAY DE NOTIFICACIONES */}
      <div style={styles.notifArea}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notifCard, borderLeft: `6px solid ${n.type === 'error' ? '#ff0000' : '#00ff41'}`}}>
            {n.text}
          </div>
        ))}
      </div>

      {/* LOGIN DE ACCESO PRINCIPAL */}
      {(!user || !accessGranted) && !isBanned && (
        <div style={styles.loginOverlay}>
          <div style={styles.loginCenter}>
             <h1 className="shimmer-title" style={styles.mainTitle}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
             <p style={styles.subText}>{SYSTEM_VERSION}</p>
             
             <div style={styles.loginActions}>
               {!user ? (
                 <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                   <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{width:'24px'}} />
                   AUTENTICAR CON GOOGLE
                 </button>
               ) : (
                 <div style={styles.pendingBox}>
                   <div className="pulse-orange"></div>
                   <p style={{color: '#ff9800', fontWeight: 'bold'}}>ACCESO NO AUTORIZADO</p>
                   <p style={{fontSize: '11px'}}>{user.email}</p>
                   <button onClick={() => signOut(auth)} style={styles.cancelBtn}>CAMBIAR CUENTA</button>
                 </div>
               )}
             </div>

             {loginError && <div style={styles.errorBanner}>{loginError}</div>}

             <div style={{marginTop: '40px'}}>
               <button onClick={() => setShowAlexLogin(true)} style={styles.adminAccessBtn}>PANEL DE CONTROL ALEX</button>
             </div>
          </div>
        </div>
      )}

      {/* BLOQUEO POR BANEO */}
      {isBanned && (
        <div style={styles.bannedOverlay}>
          <div style={styles.bannedCard}>
            <h1 style={{color: '#ff0000', fontSize: '60px', margin: 0}}>BANNED</h1>
            <div style={styles.divider}></div>
            <p>TU ACCESO HA SIDO REVOCADO PERMANENTEMENTE.</p>
            <p style={{fontSize: '12px', color: '#333'}}>ID: {sanitizeEmail(user?.email)}</p>
            <button onClick={() => signOut(auth)} style={styles.exitBtn}>SALIR DEL SISTEMA</button>
          </div>
        </div>
      )}

      {/* PANEL DE ADMINISTRADOR (EL FRAME MAESTRO) */}
      {isAdminOpen && (
        <div style={styles.adminRoot}>
          <div style={styles.adminSidebar}>
             <h2 style={{color: themeColor, fontSize: '20px', textAlign:'center'}}>COMMAND</h2>
             <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.sideBtnActive : styles.sideBtn}>USUARIOS</button>
             <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.sideBtnActive : styles.sideBtn}>LOGS</button>
             <div style={{flex: 1}}></div>
             <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdminBtn}>CERRAR SISTEMA</button>
          </div>
          
          <div style={styles.adminMain}>
             {adminTab === 'users' ? (
               <div style={styles.adminContent}>
                  <div style={styles.adminRow}>
                     {/* SECCIÓN WHITELIST */}
                     <div style={styles.adminBox}>
                        <h3 style={{color: '#00ff41'}}>WHITELIST</h3>
                        <div style={styles.inputGroup}>
                           <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@gmail.com" style={styles.boxInput}/>
                           <button onClick={() => manageGlobalDatabase('whitelist', newEmailInput, 'add')} style={styles.addBtn}>ADD</button>
                        </div>
                        <div style={styles.dataList}>
                           {Object.values(whitelist).map(u => (
                             <div key={u.email} style={styles.dataItem}>
                                <span>{u.email}</span>
                                <button onClick={() => manageGlobalDatabase('whitelist', u.email, 'remove')} style={styles.delBtn}>DEL</button>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* SECCIÓN BLACKLIST */}
                     <div style={styles.adminBox}>
                        <h3 style={{color: '#ff0000'}}>BLACKLIST</h3>
                        <div style={styles.inputGroup}>
                           <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@gmail.eu" style={styles.boxInput}/>
                           <button onClick={() => manageGlobalDatabase('blacklist', newEmailInput, 'add')} style={styles.banBtn}>BAN</button>
                        </div>
                        <div style={styles.dataList}>
                           {Object.values(blacklist).map(u => (
                             <div key={u.email} style={styles.dataItem}>
                                <span>{u.email}</span>
                                <button onClick={() => manageGlobalDatabase('blacklist', u.email, 'remove')} style={styles.perdonBtn}>REVOKE</button>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div style={styles.logWrap}>
                  <h3>REGISTROS DEL SERVIDOR</h3>
                  <div style={styles.logBox}>
                     {systemLogs.map((l, i) => (
                       <div key={i} style={styles.logEntry}>
                         <span style={{color: '#444'}}>[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                         <span style={{color: themeColor, fontWeight: 'bold'}}> {l.user}:</span> {l.msg}
                       </div>
                     ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL */}
      {user && accessGranted && (
        <div style={styles.mainInterface}>
           <nav style={styles.topNav}>
              <div style={styles.navBrand}>
                 <h2 style={{margin:0}}>ALEX HUB <span style={{color: themeColor, fontSize: '12px'}}>V13</span></h2>
              </div>

              <div style={styles.navModes}>
                 {['youtube', 'twitch', 'movies', 'radio'].map(m => (
                   <button 
                     key={m} 
                     onClick={() => {setMode(m); setSelectedVideo(null)}} 
                     style={mode === m ? {...styles.modeBtn, color: themeColor, borderBottom: `2px solid ${themeColor}`} : styles.modeBtn}
                   >
                     {m.toUpperCase()}
                   </button>
                 ))}
              </div>

              <form onSubmit={performSearch} style={styles.searchBar}>
                 <input 
                   style={styles.navInput} 
                   placeholder={`Buscar contenido en ${mode}...`} 
                   value={query} 
                   onChange={(e) => setQuery(e.target.value)}
                 />
                 <button type="submit" style={styles.searchBtnIcon}>🔍</button>
              </form>

              <div style={styles.navUser}>
                 <img src={user.photoURL} style={styles.profileImg} alt="U" />
                 <button onClick={() => setShowAlexLogin(true)} style={styles.alexMiniBtn}>ADMIN</button>
                 <button onClick={() => signOut(auth)} style={styles.logoutBtn}>LOGOUT</button>
              </div>
           </nav>

           <main style={styles.contentScroll}>
              {loadingContent && <div style={styles.innerLoader}><div className="main-spinner"></div></div>}
              
              {mode === 'youtube' && (
                <div style={styles.ytGrid}>
                   {selectedVideo ? (
                     <div style={styles.ytPlayerContainer}>
                        <iframe 
                          src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1&rel=0&modestbranding=1`} 
                          style={styles.ytIframeLarge}
                          allowFullScreen
                        />
                        <button onClick={() => setSelectedVideo(null)} style={styles.closePlayer}>VOLVER A LA GALERÍA</button>
                     </div>
                   ) : (
                     videos.map((v, i) => (
                       <div key={i} style={styles.ytCardLarge} onClick={() => setSelectedVideo(v.id.videoId)}>
                          <div style={styles.ytThumbWrap}>
                             <img src={v.snippet.thumbnails.high.url} style={styles.ytThumbLarge} alt="T" />
                             <div style={styles.ytPlayLabel}>VER AHORA</div>
                          </div>
                          <div style={styles.ytMetaLarge}>
                             <h3 style={styles.ytTitleLarge}>{v.snippet.title}</h3>
                             <p style={styles.ytChannelLarge}>{v.snippet.channelTitle}</p>
                          </div>
                       </div>
                     ))
                   )}
                </div>
              )}

              {mode !== 'youtube' && (
                <div style={styles.fullEmbed}>
                   <iframe 
                     src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                          mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                          "https://www.radio.net/embed/los40"} 
                     style={styles.ytIframeLarge}
                   />
                </div>
              )}
           </main>
        </div>
      )}

      {/* MODAL DE PASSWORD ALEX */}
      {showAlexLogin && (
        <div style={styles.alexModal}>
          <div style={styles.alexModalContent}>
             <h2 style={{letterSpacing: '5px'}}>ACCESO RESTRINGIDO</h2>
             <form onSubmit={handleAlexSystemAuth}>
                <input 
                  type="password" 
                  placeholder="DIGITE CLAVE MAESTRA" 
                  style={styles.alexInput} 
                  value={alexPassInput}
                  onChange={e => setAlexPassInput(e.target.value)}
                  autoFocus
                />
                <div style={{display:'flex', gap:'15px', justifyContent:'center'}}>
                   <button type="submit" style={styles.confirmAlex}>ACCEDER</button>
                   <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.cancelAlex}>ABORTAR</button>
                </div>
             </form>
          </div>
        </div>
      )}

      <footer style={styles.mainFooter}>
         <span>SECURITY STATUS: <span style={{color: '#00ff41'}}>ENCRYPTED</span></span>
         <span>ALEX HUB V13 ULTRA © 2026</span>
         <span>CORE: FIREBASE 10.7.1</span>
      </footer>
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE DISEÑO (CSS-IN-JS)
// ==========================================
const styles = {
  appWrapper: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', overflow: 'hidden', fontFamily: 'Segoe UI, Roboto, Helvetica' },
  loaderFull: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  
  // LOGIN
  loginOverlay: { position: 'fixed', inset: 0, background: 'radial-gradient(circle at center, #111, #000)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginCenter: { width: '500px', textAlign: 'center', padding: '60px', borderRadius: '40px', background: 'rgba(20,20,20,0.8)', border: '1px solid #222', backdropFilter: 'blur(20px)' },
  mainTitle: { fontSize: '50px', fontWeight: '900', letterSpacing: '8px', margin: 0 },
  subText: { color: '#444', fontSize: '12px', letterSpacing: '4px', marginBottom: '40px' },
  googleBtn: { display: 'flex', alignItems: 'center', justifyContent:'center', gap: '20px', background: '#fff', color: '#000', border: 'none', padding: '20px 40px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', width: '100%' },
  adminAccessBtn: { background: 'none', border: '1px solid #333', color: '#555', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', transition: '0.3s' },
  errorBanner: { background: 'rgba(255,0,0,0.1)', color: '#ff4444', padding: '15px', borderRadius: '10px', marginTop: '20px', fontSize: '12px', border: '1px solid #ff4444' },

  // INTERFAZ
  topNav: { height: '80px', background: '#050505', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between', zIndex: 100 },
  navModes: { display: 'flex', gap: '25px', marginLeft: '50px' },
  modeBtn: { background: 'none', border: 'none', color: '#555', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', padding: '30px 0', transition: '0.2s' },
  searchBar: { flex: 1, margin: '0 60px', position: 'relative' },
  navInput: { width: '100%', background: '#0a0a0a', border: '1px solid #222', padding: '14px 25px', borderRadius: '12px', color: '#fff', outline: 'none' },
  searchBtnIcon: { position: 'absolute', right: '15px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
  navUser: { display: 'flex', alignItems: 'center', gap: '20px' },
  profileImg: { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #E50914' },
  alexMiniBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  logoutBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer' },

  // YT VÍDEOS GRANDES
  contentScroll: { flex: 1, overflowY: 'auto', padding: '40px' },
  ytGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '40px' },
  ytCardLarge: { background: '#0a0a0a', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', transition: '0.4s', border: '1px solid #151515' },
  ytThumbWrap: { position: 'relative', width: '100%', aspectRatio: '16/9' },
  ytThumbLarge: { width: '100%', height: '100%', objectFit: 'cover' },
  ytPlayLabel: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', opacity: 0, transition: '0.3s', fontWeight: '900' },
  ytMetaLarge: { padding: '25px' },
  ytTitleLarge: { fontSize: '20px', margin: '0 0 10px 0', fontWeight: 'bold', color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  ytChannelLarge: { fontSize: '14px', color: '#666' },

  ytPlayerContainer: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  ytIframeLarge: { width: '100%', height: '100%', border: 'none', borderRadius: '30px' },
  closePlayer: { position: 'absolute', top: '-60px', left: 0, background: '#fff', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  // ADMIN SYSTEM
  adminRoot: { position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex' },
  adminSidebar: { width: '280px', background: '#050505', borderRight: '1px solid #111', padding: '40px', display: 'flex', flexDirection: 'column', gap: '15px' },
  sideBtn: { background: 'none', border: 'none', color: '#444', textAlign: 'left', padding: '15px', fontSize: '16px', cursor: 'pointer', borderRadius: '12px' },
  sideBtnActive: { background: '#111', color: '#fff', border: 'none', textAlign: 'left', padding: '15px', fontSize: '16px', cursor: 'pointer', borderRadius: '12px' },
  adminMain: { flex: 1, padding: '50px', overflowY: 'auto' },
  adminRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  adminBox: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '30px', borderRadius: '25px' },
  inputGroup: { display: 'flex', gap: '10px', marginBottom: '30px' },
  boxInput: { flex: 1, background: '#000', border: '1px solid #222', color: '#fff', padding: '15px', borderRadius: '12px' },
  dataList: { maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  dataItem: { background: '#050505', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '0 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  banBtn: { background: '#ff0000', color: '#fff', border: 'none', padding: '0 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  delBtn: { background: '#111', color: '#ff4444', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  perdonBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

  // NOTIFS
  notifArea: { position: 'fixed', top: '30px', right: '30px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '15px' },
  notifCard: { background: '#050505', color: '#fff', padding: '20px 35px', borderRadius: '15px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', fontSize: '14px', fontWeight: 'bold', animation: 'slideIn 0.4s ease' },

  alexModal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  alexModalContent: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', textAlign: 'center', border: '1px solid #222', width: '450px' },
  alexInput: { width: '100%', background: '#000', border: '1px solid #E50914', color: '#fff', padding: '20px', borderRadius: '15px', fontSize: '24px', textAlign: 'center', marginBottom: '30px', outline: 'none' },
  confirmAlex: { background: '#E50914', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  cancelAlex: { background: 'none', border: 'none', color: '#444', cursor: 'pointer' },

  mainFooter: { height: '50px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', fontSize: '11px', color: '#222', borderTop: '1px solid #111' }
};

// --- ESTILOS DINÁMICOS ---
if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    .main-spinner { width: 60px; height: 60px; border: 4px solid #111; border-top-color: #E50914; border-radius: 50%; animation: rot 1s infinite linear; }
    @keyframes rot { to { transform: rotate(360deg); } }
    .ytCardLarge:hover { transform: scale(1.02); border-color: #333; }
    .ytCardLarge:hover .ytPlayLabel { opacity: 1; }
    .shimmer-title { animation: shim 3s infinite linear; }
    @keyframes shim { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5) drop-shadow(0 0 20px #E50914); } }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #E50914; }
  `;
  document.head.appendChild(s);
}
