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
 * SOFTWARE DE GESTIÓN MULTIMEDIA Y CONTROL DE ACCESO PROFESIONAL
 * @version: 13.0.5-FINAL-BUILD
 * @status: STABLE
 * ============================================================================
 */

// --- NÚCLEO DE CONFIGURACIÓN FIREBASE ---
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

// --- VARIABLES MAESTRAS ---
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.5-ULTRA";

export default function AlexHubUltraV13() {
  // --- ESTADOS DE SESIÓN Y SEGURIDAD ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);

  // --- ESTADOS DE DATOS (REALTIME) ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);

  // --- NAVEGACIÓN Y CONTENIDO ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // --- PANEL DE CONTROL ADMINISTRATIVO (ALEX) ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');

  // --- UI & NOTIFICACIONES ---
  const [notifications, setNotifications] = useState([]);
  const themeColor = '#E50914'; // Color corporativo (Rojo Alex)

  // ==========================================
  // 1. NÚCLEO DE ESCUCHA DE DATOS
  // ==========================================

  useEffect(() => {
    // Escucha el estado de autenticación de Google
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkSecurityLayer(currentUser.email);
        logActivity(`Intento de acceso: ${currentUser.email}`);
      } else {
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Escucha constante de las tablas de la Base de Datos
    const unsubWhite = onValue(ref(db, 'whitelist'), (snap) => setWhitelist(snap.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (snap) => setBlacklist(snap.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium_users'), (snap) => setPremiumUsers(snap.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (snap) => {
      const data = snap.val() || {};
      const logArray = Object.values(data).reverse().slice(0, 40);
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
  // 2. CAPA DE SEGURIDAD PROFESIONAL
  // ==========================================

  const checkSecurityLayer = useCallback((email) => {
    const emailKey = email.replace(/\./g, ',');

    // 1. Verificación de Baneo Inmediato
    onValue(ref(db, `blacklist/${emailKey}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
        setAuthLoading(false);
      } else {
        setIsBanned(false);
        // 2. Verificación de Whitelist
        onValue(ref(db, `whitelist/${emailKey}`), (whiteSnap) => {
          if (whiteSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("SISTEMA: Tu correo no figura en la Whitelist.");
          }
          setAuthLoading(false);
        });
      }
    });
  }, []);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      addNotification("Validando credenciales...", "info");
    } catch (error) {
      setLoginError("ERROR: Error de conexión con Google.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    window.location.reload();
  };

  // ==========================================
  // 3. LÓGICA DEL PANEL "ALEX" (CORREGIDA)
  // ==========================================

  const handleAlexSubmit = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("ACCESO ADMIN CONCEDIDO", "success");
      logActivity("ADMIN: Entró al Command Center.");
    } else {
      addNotification("CONTRASEÑA INVÁLIDA", "error");
      logActivity(`FALLO: Intento de acceso Admin: ${alexPassInput}`);
    }
  };

  const logActivity = (msg) => {
    const newLogRef = push(ref(db, 'logs'));
    set(newLogRef, {
      msg,
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'Visitante'
    });
  };

  const manageSystemUser = (table, email, action) => {
    if (!email.includes('@')) return addNotification("E-mail no válido", "error");
    const emailKey = email.replace(/\./g, ',');
    
    if (action === 'add') {
      set(ref(db, `${table}/${emailKey}`), { 
        email: email, 
        addedAt: serverTimestamp(),
        manager: user?.email || 'Alex'
      });
      addNotification(`${email} actualizado en ${table}`, "success");
    } else {
      remove(ref(db, `${table}/${emailKey}`));
      addNotification(`${email} eliminado de ${table}`, "info");
    }
    setNewEmailInput('');
  };

  // ==========================================
  // 4. MOTOR DE BÚSQUEDA Y MULTIMEDIA
  // ==========================================

  const startGlobalSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        if (data.items) setVideos(data.items);
        setSelectedVideo(null);
      }
      logActivity(`Búsqueda: [${mode}] ${query}`);
    } catch (err) { 
      addNotification("Error en la conexión con la API", "error");
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
  // 5. INTERFAZ DE USUARIO (RENDER)
  // ==========================================

  // --- CARGA INICIAL ---
  if (authLoading) return (
    <div style={styles.fullCenter}>
      <div className="loader"></div>
      <p style={{marginTop: '20px', color: themeColor, letterSpacing: '5px', fontWeight: 'bold'}}>ALEX HUB ULTRA V13</p>
    </div>
  );

  // --- UI FINAL ---
  return (
    <div style={styles.appContainer}>
      
      {/* CAPA 1: NOTIFICACIONES */}
      <div style={styles.notifContainer}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notif, borderLeftColor: n.type === 'error' ? '#ff0000' : '#00ff41'}}>
            {n.text}
          </div>
        ))}
      </div>

      {/* CAPA 2: MODAL DE LOGIN ADMIN (Siempre accesible) */}
      {showAlexLogin && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.miniCard, borderTopColor: themeColor}}>
             <h2 style={{letterSpacing: '4px'}}>SISTEMA ADMIN</h2>
             <p style={{fontSize: '10px', color: '#666', marginBottom: '25px'}}>INGRESE CLAVE DE ACCESO</p>
             <form onSubmit={handleAlexSubmit}>
               <input 
                 type="password" 
                 placeholder="CONTRASEÑA" 
                 value={alexPassInput} 
                 onChange={e => setAlexPassInput(e.target.value)} 
                 style={styles.adminInput}
                 autoFocus
               />
               <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                 <button type="submit" style={{...styles.confirmBtn, background: themeColor}}>ENTRAR</button>
                 <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>CANCELAR</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* CAPA 3: FRAME GIGANTE ADMINISTRADOR (Command Center) */}
      {isAdminOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <div>
              <h1 style={{color: themeColor, margin: 0, fontSize: '24px'}}>ALEX HUB | COMMAND CENTER</h1>
              <p style={{margin: 0, fontSize: '11px', color: '#555'}}>PROTOCOLO DE CONTROL NIVEL 1</p>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
               <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.adminTabActive : styles.adminTab}>USUARIOS</button>
               <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.adminTabActive : styles.adminTab}>LOGS</button>
               <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>SALIR DEL FRAME</button>
            </div>
          </div>
          
          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminGrid}>
                {/* GESTIÓN WHITELIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#00ff41', fontSize: '14px'}}>✅ LISTA DE ACCESO (WHITELIST)</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="correo@gmail.com" style={styles.adminInputText}/>
                      <button onClick={() => manageSystemUser('whitelist', newEmailInput, 'add')} style={styles.addBtn}>AÑADIR</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.values(whitelist).map(u => (
                        <div key={u.email} style={styles.listItem}>
                           <span>{u.email}</span>
                           <button onClick={() => manageSystemUser('whitelist', u.email, 'remove')} style={styles.deleteBtn}>QUITAR</button>
                        </div>
                      ))}
                   </div>
                </div>

                {/* GESTIÓN BLACKLIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#E50914', fontSize: '14px'}}>🚫 BLOQUEADOS (BAN)</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="correo@gmail.com" style={styles.adminInputText}/>
                      <button onClick={() => manageSystemUser('blacklist', newEmailInput, 'add')} style={styles.banBtnAction}>BANEAR</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.values(blacklist).map(u => (
                        <div key={u.email} style={styles.listItem}>
                           <span>{u.email}</span>
                           <button onClick={() => manageSystemUser('blacklist', u.email, 'remove')} style={styles.unbanBtn}>PERDONAR</button>
                        </div>
                      ))}
                   </div>
                </div>

                {/* GESTIÓN PREMIUM */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#FFD700', fontSize: '14px'}}>💎 USUARIOS PREMIUM</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="correo@gmail.com" style={styles.adminInputText}/>
                      <button onClick={() => manageSystemUser('premium_users', newEmailInput, 'add')} style={styles.premiumBtnAdd}>PREMIUM</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.values(premiumUsers).map(u => (
                        <div key={u.email} style={styles.listItem}>
                           <span>{u.email}</span>
                           <button onClick={() => manageSystemUser('premium_users', u.email, 'remove')} style={styles.deleteBtn}>QUITAR</button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
              <div style={styles.logSection}>
                <div style={styles.logContainer}>
                  {systemLogs.map((log, idx) => (
                    <div key={idx} style={styles.logItem}>
                      <span style={{color: '#444'}}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span style={{color: themeColor}}> {log.user}:</span> {log.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CAPA 4: PANTALLA DE BANEO TOTAL */}
      {isBanned ? (
        <div style={styles.bannedScreen}>
          <div style={styles.errorBox}>
            <h1 className="glitch">ACCESO DENEGADO</h1>
            <p>Tu cuenta ha sido expulsada permanentemente del sistema Alex Hub.</p>
            <button onClick={handleLogout} style={styles.logoutBtnLarge}>VOLVER AL INICIO</button>
          </div>
        </div>
      ) : (
        <>
          {/* CAPA 5: VISTA PÚBLICA / LOGIN GOOGLE */}
          {(!user || !accessGranted) ? (
            <div style={styles.loginPage}>
              <div style={styles.loginCard}>
                <h1 style={styles.glitchText}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
                <p style={styles.versionTag}>VERSIÓN {SYSTEM_VERSION}</p>
                
                <div style={{margin: '40px 0'}}>
                  {!user ? (
                    <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{width:'20px'}} />
                      INICIAR SESIÓN CON GOOGLE
                    </button>
                  ) : (
                    <div style={styles.pendingStatus}>
                      <p style={{color: '#ff9800', margin: 0}}>ESTADO: ESPERANDO AUTORIZACIÓN</p>
                      <p style={{fontSize: '12px', color: '#555'}}>{user.email}</p>
                      <button onClick={handleLogout} style={styles.logoutMini}>CANCELAR</button>
                    </div>
                  )}
                </div>

                {loginError && <div style={styles.errorText}>{loginError}</div>}

                <div style={{marginTop: '60px'}}>
                   <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtn}>ACCESO ADMIN (ALEX)</button>
                </div>
              </div>
            </div>
          ) : (
            /* CAPA 6: DASHBOARD PRINCIPAL (Si tiene acceso) */
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

                <form onSubmit={startGlobalSearch} style={styles.searchForm}>
                  <input 
                    style={styles.searchInput} 
                    placeholder={`¿Qué quieres ver en ${mode}?`} 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                  />
                  <button type="submit" style={styles.searchIconBtn}>🔍</button>
                </form>

                <div style={styles.navRight}>
                   {premiumUsers[user.email.replace(/\./g, ',')] && <span className="premium-badge">💎 PREMIUM</span>}
                   <div style={styles.userInfo}>
                      <img src={user.photoURL} style={styles.userPic} alt="profile" />
                      <div style={styles.userMeta}>
                        <span style={styles.userName}>{user.displayName}</span>
                        <button onClick={handleLogout} style={styles.logoutMini}>CERRAR SESIÓN</button>
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
                          src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} 
                          style={styles.iframe} 
                          allowFullScreen 
                        />
                        <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>CERRAR REPRODUCTOR</button>
                      </div>
                    ) : (
                      videos.map((v, i) => (
                        <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                          <div style={styles.thumbWrapper}>
                            <img src={v.snippet.thumbnails.high.url} style={styles.thumb} alt="thumb" />
                            <div style={styles.playOverlay}>REPRODUCIR</div>
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
        </>
      )}

      <footer style={styles.footer}>
        <div>SISTEMA: <span style={{color: '#00ff41'}}>PROTEGIDO</span></div>
        <div>ALEX HUB ULTRA V13 - 2026</div>
        <div>FIREBASE: <span style={{color: '#00ff41'}}>CONECTADO</span></div>
      </footer>
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE ESTILOS (PERFECTA)
// ==========================================
const styles = {
  appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' },
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  
  // LOGIN UI
  loginPage: { height: '100vh', background: 'radial-gradient(circle at center, #111 0%, #000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 10 },
  loginCard: { background: 'rgba(10,10,10,0.9)', padding: '70px', borderRadius: '40px', border: '1px solid #1a1a1a', textAlign: 'center', backdropFilter: 'blur(20px)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' },
  glitchText: { fontSize: '48px', fontWeight: '900', letterSpacing: '6px', margin: 0 },
  versionTag: { fontSize: '10px', color: '#444', letterSpacing: '4px', marginTop: '10px' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '16px 35px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', margin: '0 auto' },
  alexBtn: { background: 'transparent', border: '1px solid #222', color: '#444', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  errorText: { color: '#ff4444', marginTop: '20px', fontSize: '13px', fontWeight: 'bold' },

  // NAVBAR UI
  navbar: { height: '85px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 35px', justifyContent: 'space-between', zIndex: 100 },
  logoBox: { borderLeft: '4px solid', paddingLeft: '18px', display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '26px', fontWeight: '900', letterSpacing: '2px' },
  logoSub: { fontSize: '9px', fontWeight: 'bold' },
  tabContainer: { display: 'flex', gap: '8px', marginLeft: '35px' },
  tab: { background: '#111', border: 'none', color: '#555', padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px', fontSize: '11px' },
  activeTab: { color: '#fff', borderRadius: '8px', border: 'none', padding: '10px 18px', fontWeight: 'bold', fontSize: '11px' },
  
  searchForm: { flex: 1, maxWidth: '500px', margin: '0 40px', position: 'relative' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', padding: '14px 20px', color: '#fff', outline: 'none', fontSize: '14px' },
  searchIconBtn: { position: 'absolute', right: '15px', top: '12px', background: 'none', border: 'none', cursor: 'pointer' },

  navRight: { display: 'flex', gap: '20px', alignItems: 'center' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '12px', background: '#0a0a0a', padding: '8px 15px', borderRadius: '12px', border: '1px solid #111' },
  userPic: { width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '12px', fontWeight: 'bold' },
  logoutMini: { background: 'none', border: 'none', color: '#555', fontSize: '10px', cursor: 'pointer', padding: 0, textAlign: 'left' },
  alexBtnMini: { border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },

  // CONTENT AREA
  contentArea: { flex: 1, overflowY: 'auto', padding: '35px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.3s' },
  thumbWrapper: { position: 'relative', width: '100%', aspectRatio: '16/9' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  playOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', fontWeight: 'bold', fontSize: '14px' },
  cardInfo: { padding: '15px' },
  videoTitle: { fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0', height: '40px', overflow: 'hidden' },
  videoChannel: { fontSize: '11px', color: '#444' },

  playerWrap: { gridColumn: '1/-1', background: '#000', borderRadius: '25px', overflow: 'hidden', height: '75vh', position: 'relative', border: '1px solid #222' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  closeVideoBtn: { position: 'absolute', top: '20px', right: '20px', background: '#E50914', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' },

  fullFrame: { width: '100%', height: '100%', borderRadius: '25px', overflow: 'hidden', background: '#000' },

  // ADMIN FRAME UI (ALEX COMMAND CENTER)
  adminFrame: { position: 'fixed', inset: '25px', background: '#050505', border: '1px solid #333', zIndex: 1000, borderRadius: '35px', display: 'flex', flexDirection: 'column', boxShadow: '0 0 100px rgba(0,0,0,1)', animation: 'fadeIn 0.4s ease' },
  adminHeader: { padding: '25px 45px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { flex: 1, padding: '35px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', height: '100%' },
  adminSection: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '25px', display: 'flex', flexDirection: 'column' },
  adminActionRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  adminInputText: { flex: 1, background: '#000', border: '1px solid #222', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '12px' },
  scrollList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  listItem: { background: '#050505', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111', fontSize: '12px' },
  
  adminTab: { background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontWeight: 'bold', padding: '10px' },
  adminTabActive: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', borderBottom: '2px solid #fff', padding: '10px' },
  
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  banBtnAction: { background: '#E50914', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  premiumBtnAdd: { background: '#FFD700', color: '#000', border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  deleteBtn: { background: '#1a1a1a', color: '#555', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px' },
  closeAdmin: { background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },

  // NOTIFS & MODALS
  notifContainer: { position: 'fixed', top: '25px', right: '25px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notif: { background: '#0a0a0a', color: '#fff', padding: '18px 25px', borderRadius: '10px', borderLeft: '4px solid', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', animation: 'slideIn 0.3s ease' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  miniCard: { background: '#0a0a0a', padding: '50px', borderRadius: '30px', border: '1px solid #1a1a1a', borderTop: '4px solid', textAlign: 'center', width: '350px' },
  adminInput: { width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '12px', fontSize: '20px', textAlign: 'center', marginBottom: '25px', outline: 'none' },
  confirmBtn: { color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#444', border: 'none', padding: '15px', cursor: 'pointer', fontSize: '11px' },
  
  // LOGS
  logContainer: { background: '#000', borderRadius: '15px', padding: '25px', fontFamily: 'monospace', fontSize: '12px', height: '400px', overflowY: 'auto', border: '1px solid #111' },
  logItem: { padding: '6px 0', borderBottom: '1px solid #0a0a0a' },

  footer: { height: '45px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 35px', fontSize: '10px', color: '#333', borderTop: '1px solid #111' },
  bannedScreen: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorBox: { textAlign: 'center', padding: '50px', border: '1px solid #ff0000', borderRadius: '25px', background: 'rgba(255,0,0,0.05)' },
  logoutBtnLarge: { marginTop: '30px', background: '#ff0000', color: '#fff', border: 'none', padding: '15px 35px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  loadOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// --- INYECCIÓN DE ESTILOS GLOBALES ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body { margin: 0; background: #000; -webkit-font-smoothing: antialiased; }
    .loader { width: 50px; height: 50px; border: 3px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .glitch { animation: pulse 1.5s infinite; letter-spacing: 5px; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
    .card:hover { transform: translateY(-8px); border-color: #333; }
    .card:hover .playOverlay { opacity: 1; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
    .premium-badge { background: linear-gradient(45deg, #FFD700, #FFA500); color: #000; padding: 4px 10px; border-radius: 15px; font-size: 9px; font-weight: 900; }
  `;
  document.head.appendChild(style);
}
