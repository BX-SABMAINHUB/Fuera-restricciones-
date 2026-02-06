import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update, push 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (REBUILT)
 * ============================================================================
 * @version: 13.0.9-FINAL-FIX
 * @status: OPERATIONAL
 * @author: ALEX ADMIN
 * ============================================================================
 */

// --- CONFIGURACIÓN FIREBASE (VERIFICADA) ---
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

// Configuración de persistencia para evitar errores de "initial state"
setPersistence(auth, browserLocalPersistence);

// --- CONSTANTES MAESTRAS ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-ULTRA-WIDE";

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

  // --- NAVEGACIÓN ---
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

  // ==========================================
  // NÚCLEO TÉCNICO: SANITIZACIÓN DE DB
  // ==========================================
  
  // Esta función permite correos .com, .eu, .es sin errores de Firebase
  const getSafeKey = (email) => {
    if (!email) return "anonymous";
    return email.toLowerCase()
      .replace(/\./g, '_dot_')
      .replace(/@/g, '_at_')
      .replace(/#/g, '_hash_')
      .replace(/\$/g, '_ds_')
      .replace(/\[/g, '_ob_')
      .replace(/\]/g, '_cb_');
  };

  // ==========================================
  // LOGICA DEL BOTÓN PÁNICO
  // ==========================================
  
  const handlePanicAction = useCallback(() => {
    addNotification("PROTOCOLO PÁNICO ACTIVADO", "error");
    
    // 1. Intentar abrir la App de ManageBac mediante deep link
    window.location.href = "managebac://"; 
    
    // 2. Fallback: Si no abre la app, ir a la web en 100ms
    setTimeout(() => {
      window.open("https://managebac.com", "_blank");
      // 3. Auto-destrucción de la pestaña actual
      window.close();
      // Si window.close falla (por seguridad del navegador), ofuscar la pestaña
      window.location.replace("https://google.com");
    }, 150);
  }, []);

  // ==========================================
  // GESTIÓN DE AUTENTICACIÓN Y SEGURIDAD
  // ==========================================

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        validatePermissions(currentUser.email);
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const logs = s.val() ? Object.values(s.val()).reverse().slice(0, 100) : [];
      setSystemLogs(logs);
    });

    return () => {
      unsubAuth(); unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs();
    };
  }, []);

  const validatePermissions = (email) => {
    const key = getSafeKey(email);
    
    // Chequeo de Ban
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        // Chequeo de Whitelist
        onValue(ref(db, `whitelist/${key}`), (wSnap) => {
          if (wSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("ACCESO DENEGADO: NO ESTÁS EN LA WHITELIST");
          }
        });
      }
      setAuthLoading(false);
    });
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      // Usamos Popup pero con manejo de error de estado
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Auth Error:", error);
      setLoginError("ERROR DE SESIÓN. Por favor, asegúrate de permitir ventanas emergentes y no usar modo incógnito extremo.");
      addNotification("Error de Autenticación", "error");
    }
  };

  // ==========================================
  // COMANDOS ADMINISTRATIVOS (FIXED)
  // ==========================================

  const manageUserStatus = async (table, targetEmail, action) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      return addNotification("E-mail inválido", "error");
    }

    const key = getSafeKey(targetEmail);
    const targetRef = ref(db, `${table}/${key}`);

    try {
      if (action === 'add') {
        await set(targetRef, {
          email: targetEmail,
          timestamp: serverTimestamp(),
          admin: user?.email
        });
        addNotification(`OPERACIÓN EXITOSA: ${targetEmail} -> ${table}`, "success");
        logActivity(`ADMIN ${action.toUpperCase()} - User: ${targetEmail} en ${table}`);
      } else {
        await remove(targetRef);
        addNotification(`ELIMINADO: ${targetEmail} de ${table}`, "info");
        logActivity(`ADMIN REMOVE - User: ${targetEmail} de ${table}`);
      }
      setNewEmailInput('');
    } catch (err) {
      addNotification("ERROR EN BASE DE DATOS", "error");
    }
  };

  const logActivity = (msg) => {
    const logRef = push(ref(db, 'logs'));
    set(logRef, {
      msg,
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'SYSTEM'
    });
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  // ==========================================
  // MOTOR MULTIMEDIA (ULTRA WIDE)
  // ==========================================

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.items) setVideos(data.items);
        setSelectedVideo(null);
      }
      logActivity(`Búsqueda Global: [${mode}] ${query}`);
    } catch (err) {
      addNotification("Error al conectar con YouTube", "error");
    }
    setLoadingContent(false);
  };

  // ==========================================
  // RENDERIZADO DE INTERFAZ
  // ==========================================

  if (authLoading) return (
    <div style={styles.loadingScreen}>
      <div className="main-loader"></div>
      <h2 style={{letterSpacing: '10px', marginTop: '30px'}}>ALEX HUB ULTRA</h2>
      <p style={{color: '#444'}}>INICIALIZANDO SISTEMAS DE SEGURIDAD...</p>
    </div>
  );

  return (
    <div style={styles.masterContainer}>
      
      {/* Botón de Pánico - Siempre Visible para el usuario */}
      <button onClick={handlePanicAction} style={styles.panicButton}>PÁNICO</button>

      {/* Sistema de Notificaciones Flotantes */}
      <div style={styles.notificationStack}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notifCard, borderRight: `5px solid ${n.type === 'error' ? '#ff0000' : '#00ff00'}`}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={styles.bannedOverlay}>
          <div style={styles.bannedBox}>
            <h1 style={{fontSize: '70px', color: '#ff0000'}}>BAN PERMANENTE</h1>
            <p>Tu acceso ha sido revocado por el administrador del sistema.</p>
            <button onClick={() => signOut(auth)} style={styles.primaryBtn}>CERRAR SESIÓN</button>
          </div>
        </div>
      ) : (!user || !accessGranted) ? (
        <div style={styles.loginGateway}>
          <div style={styles.loginCard}>
            <h1 style={styles.heroText}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
            <p style={styles.subText}>CONTROL TOTAL V13.0.9</p>
            
            <div style={{margin: '50px 0'}}>
              {!user ? (
                <button onClick={handleGoogleLogin} style={styles.googleButton}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pwa_loader/google.svg" width="20" />
                  ENTRAR CON GOOGLE
                </button>
              ) : (
                <div style={styles.statusBox}>
                  <p>CONECTADO COMO: <b>{user.email}</b></p>
                  <p style={{color: '#ff9800'}}>ESTADO: PENDIENTE DE WHITELIST</p>
                  <button onClick={() => signOut(auth)} style={styles.linkBtn}>CAMBIAR CUENTA</button>
                </div>
              )}
            </div>

            {loginError && <div style={styles.errorAlert}>{loginError}</div>}
            
            <button onClick={() => setShowAlexLogin(true)} style={styles.alexAdminTrigger}>ACCESO ALEX</button>
          </div>
        </div>
      ) : (
        /* SISTEMA OPERATIVO */
        <>
          <nav style={styles.mainNav}>
            <div style={styles.navSection}>
              <div style={styles.brandGroup}>
                <span style={styles.brandTitle}>ALEX HUB</span>
                <span style={styles.brandVersion}>ULTRA V13</span>
              </div>
              <div style={styles.tabGroup}>
                {['youtube', 'twitch', 'movies', 'xbox', 'radio'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => {setMode(m); setSelectedVideo(null)}} 
                    style={mode === m ? {...styles.navTab, borderBottom: `3px solid ${themeColor}`, color: '#fff'} : styles.navTab}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSearch} style={styles.searchWrapper}>
              <input 
                style={styles.globalSearch} 
                placeholder={`Buscar en ${mode}...`} 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
              />
              <button type="submit" style={styles.searchBtn}>BUSCAR</button>
            </form>

            <div style={styles.navSection}>
              <div style={styles.userBadge}>
                <img src={user.photoURL} style={styles.avatar} />
                <div style={styles.userLabels}>
                  <span style={styles.uName}>{user.displayName}</span>
                  <span style={styles.uStatus}>ACTIVO</span>
                </div>
              </div>
              <button onClick={() => setShowAlexLogin(true)} style={styles.alexCircularBtn}>A</button>
              <button onClick={() => signOut(auth)} style={styles.logoutBtn}>SALIR</button>
            </div>
          </nav>

          <main style={styles.contentBody}>
            {loadingContent && <div style={styles.loaderOverlay}><div className="loader"></div></div>}

            {mode === 'youtube' && (
              <div style={styles.viewContainer}>
                {selectedVideo ? (
                  <div style={styles.ultraPlayer}>
                    <iframe 
                      src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0&showinfo=0`} 
                      style={styles.fullIframe} 
                      allowFullScreen 
                    />
                    <button onClick={() => setSelectedVideo(null)} style={styles.backBtn}>CERRAR CINE</button>
                  </div>
                ) : (
                  <div style={styles.videoGrid}>
                    {videos.map((v, i) => (
                      <div key={i} style={styles.videoCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                        <div style={styles.imageBox}>
                          <img src={v.snippet.thumbnails.high.url} style={styles.vImg} />
                          <div style={styles.playHint}>REPRODUCIR HD</div>
                        </div>
                        <div style={styles.vData}>
                          <h4 style={styles.vTitle}>{v.snippet.title}</h4>
                          <p style={styles.vChan}>{v.snippet.channelTitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode !== 'youtube' && (
              <div style={styles.ultraWideFrame}>
                <iframe 
                  src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                       mode === 'xbox' ? "https://www.xbox.com/play" :
                       "https://www.radio.net/embed/los40"} 
                  style={styles.fullIframe} 
                />
              </div>
            )}
          </main>
        </>
      )}

      {/* MODAL ADMINISTRADOR - EL CORAZÓN DEL SISTEMA */}
      {(isAdminOpen) && (
        <div style={styles.adminPanel}>
          <div style={styles.adminHeader}>
            <div>
              <h2 style={{margin: 0, color: themeColor}}>ALEX COMMAND CENTER</h2>
              <p style={{margin: 0, fontSize: '10px', color: '#555'}}>PROTOCOLOS DE ACCESO NIVEL 10</p>
            </div>
            <div style={styles.adminTabs}>
              <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.tabActive : styles.tabIn}>USUARIOS</button>
              <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.tabActive : styles.tabIn}>REGISTROS</button>
              <button onClick={() => setIsAdminOpen(false)} style={styles.exitAdmin}>CERRAR SISTEMA</button>
            </div>
          </div>

          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.managementGrid}>
                {/* COLUMNA WHITELIST */}
                <div style={styles.mCol}>
                  <h3 style={{color: '#00ff00'}}>✅ WHITELIST</h3>
                  <div style={styles.addInputRow}>
                    <input 
                      value={newEmailInput} 
                      onChange={e=>setNewEmailInput(e.target.value)} 
                      placeholder="correo@ejemplo.eu" 
                      style={styles.mInput}
                    />
                    <button onClick={() => manageUserStatus('whitelist', newEmailInput, 'add')} style={styles.mAddBtn}>+</button>
                  </div>
                  <div style={styles.mList}>
                    {Object.values(whitelist).map(u => (
                      <div key={u.email} style={styles.mItem}>
                        <span>{u.email}</span>
                        <button onClick={() => manageUserStatus('whitelist', u.email, 'remove')} style={styles.mDelBtn}>X</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA BLACKLIST (ELIMINAR BAN) */}
                <div style={styles.mCol}>
                  <h3 style={{color: '#ff0000'}}>🚫 BLACKLIST (BAN)</h3>
                  <div style={styles.addInputRow}>
                    <input 
                      value={newEmailInput} 
                      onChange={e=>setNewEmailInput(e.target.value)} 
                      placeholder="correo@ejemplo.com" 
                      style={styles.mInput}
                    />
                    <button onClick={() => manageUserStatus('blacklist', newEmailInput, 'add')} style={styles.mBanBtn}>BAN</button>
                  </div>
                  <div style={styles.mList}>
                    {Object.values(blacklist).map(u => (
                      <div key={u.email} style={styles.mItem}>
                        <span>{u.email}</span>
                        <button onClick={() => manageUserStatus('blacklist', u.email, 'remove')} style={styles.mUnbanBtn}>PERDONAR</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.logsArea}>
                {systemLogs.map((log, i) => (
                  <div key={i} style={styles.logRow}>
                    <span style={styles.logTime}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span style={{color: themeColor}}> {log.user}:</span> {log.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE LOGIN ALEX */}
      {showAlexLogin && (
        <div style={styles.alexOverlay}>
          <div style={styles.alexBox}>
            <h2>AUTENTICACIÓN ADMIN</h2>
            <input 
              type="password" 
              placeholder="PASSCODE" 
              style={styles.alexInput} 
              value={alexPassInput} 
              onChange={e=>setAlexPassInput(e.target.value)}
              autoFocus
            />
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button onClick={() => {
                if(alexPassInput === ADMIN_PASS) { setIsAdminOpen(true); setShowAlexLogin(false); setAlexPassInput(''); }
                else { addNotification("ACCESO DENEGADO", "error"); }
              }} style={styles.primaryBtn}>ACCEDER</button>
              <button onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>VOLVER</button>
            </div>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>SISTEMA FIREBASE: CONECTADO</span>
        <span>ALEX HUB ULTRA V13.0.9 - 2026</span>
        <span>STATUS: SECURE MODE</span>
      </footer>
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE ESTILOS (PRO)
// ==========================================
const themeColor = '#E50914';

const styles = {
  masterContainer: { height: '100vh', width: '100vw', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter, sans-serif' },
  loadingScreen: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  
  // PÁNICO
  panicButton: { position: 'fixed', bottom: '30px', right: '30px', background: '#ff0000', color: '#fff', border: '4px solid #fff', borderRadius: '50px', padding: '20px 40px', fontSize: '20px', fontWeight: '900', cursor: 'pointer', zIndex: 99999, boxShadow: '0 0 30px rgba(255,0,0,0.8)', transition: '0.2s' },
  
  // LOGIN
  loginGateway: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #1a1a1a 0%, #000 100%)' },
  loginCard: { background: 'rgba(15,15,15,0.95)', padding: '80px', borderRadius: '50px', border: '1px solid #333', textAlign: 'center', width: '600px', boxShadow: '0 50px 100px rgba(0,0,0,0.9)' },
  heroText: { fontSize: '60px', fontWeight: '900', letterSpacing: '-2px', margin: 0 },
  subText: { color: '#555', letterSpacing: '8px', fontSize: '12px', fontWeight: 'bold' },
  googleButton: { background: '#fff', color: '#000', border: 'none', padding: '18px 40px', borderRadius: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', margin: '0 auto' },
  alexAdminTrigger: { background: 'none', border: 'none', color: '#222', cursor: 'pointer', marginTop: '50px' },
  errorAlert: { background: 'rgba(255,0,0,0.1)', color: '#ff4444', padding: '15px', borderRadius: '10px', fontSize: '12px', border: '1px solid #ff0000' },

  // NAV
  mainNav: { height: '90px', background: '#000', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between', zIndex: 100 },
  brandGroup: { display: 'flex', flexDirection: 'column' },
  brandTitle: { fontSize: '24px', fontWeight: '900' },
  brandVersion: { fontSize: '9px', color: themeColor, fontWeight: 'bold' },
  tabGroup: { display: 'flex', gap: '5px', marginLeft: '40px' },
  navTab: { background: 'none', border: 'none', color: '#444', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: '0.3s' },
  
  searchWrapper: { flex: 1, maxWidth: '800px', margin: '0 50px', display: 'flex', gap: '10px' },
  globalSearch: { flex: 1, background: '#0a0a0a', border: '1px solid #222', padding: '15px 25px', borderRadius: '15px', color: '#fff', outline: 'none', fontSize: '16px' },
  searchBtn: { background: themeColor, border: 'none', color: '#fff', padding: '0 25px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' },

  navSection: { display: 'flex', alignItems: 'center', gap: '20px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '12px', background: '#0a0a0a', padding: '8px 20px', borderRadius: '40px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%' },
  userLabels: { display: 'flex', flexDirection: 'column' },
  uName: { fontSize: '12px', fontWeight: 'bold' },
  uStatus: { fontSize: '9px', color: '#00ff00' },
  logoutBtn: { background: '#111', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' },
  alexCircularBtn: { width: '40px', height: '40px', borderRadius: '50%', background: themeColor, border: 'none', color: '#fff', fontWeight: '900', cursor: 'pointer' },

  // CONTENT
  contentBody: { flex: 1, overflowY: 'auto', position: 'relative', padding: '40px' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' },
  videoCard: { background: '#0a0a0a', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', transition: '0.4s', border: '1px solid #111' },
  imageBox: { position: 'relative', width: '100%', aspectRatio: '16/9' },
  vImg: { width: '100%', height: '100%', objectFit: 'cover' },
  playHint: { position: 'absolute', inset: 0, background: 'rgba(229, 9, 20, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', fontWeight: '900' },
  vData: { padding: '20px' },
  vTitle: { fontSize: '16px', margin: '0 0 10px 0', height: '45px', overflow: 'hidden' },
  vChan: { color: '#444', fontSize: '12px' },

  ultraPlayer: { width: '100%', height: '80vh', background: '#000', borderRadius: '30px', overflow: 'hidden', position: 'relative' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  backBtn: { position: 'absolute', top: '20px', right: '20px', background: themeColor, border: 'none', color: '#fff', padding: '15px 30px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' },
  ultraWideFrame: { width: '100%', height: '100%', borderRadius: '30px', overflow: 'hidden' },

  // ADMIN PANEL
  adminPanel: { position: 'fixed', inset: '30px', background: '#050505', zIndex: 2000, borderRadius: '40px', border: '1px solid #222', display: 'flex', flexDirection: 'column', boxShadow: '0 0 200px #000' },
  adminHeader: { padding: '30px 50px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminTabs: { display: 'flex', gap: '20px' },
  tabActive: { background: 'none', border: 'none', color: '#fff', borderBottom: '2px solid #fff', padding: '10px', cursor: 'pointer', fontWeight: 'bold' },
  tabIn: { background: 'none', border: 'none', color: '#333', padding: '10px', cursor: 'pointer' },
  exitAdmin: { background: '#fff', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },

  adminBody: { flex: 1, padding: '50px', overflowY: 'auto' },
  managementGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  mCol: { background: '#0a0a0a', padding: '30px', borderRadius: '30px', border: '1px solid #111' },
  addInputRow: { display: 'flex', gap: '10px', marginBottom: '30px' },
  mInput: { flex: 1, background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '12px', color: '#fff' },
  mAddBtn: { background: '#00ff00', border: 'none', width: '50px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },
  mBanBtn: { background: '#ff0000', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },
  
  mList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  mItem: { background: '#000', padding: '15px 25px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  mDelBtn: { background: '#111', color: '#444', border: 'none', cursor: 'pointer', padding: '5px 10px' },
  mUnbanBtn: { background: '#00ff00', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

  logsArea: { background: '#000', padding: '30px', borderRadius: '20px', fontFamily: 'monospace', height: '100%', overflowY: 'auto' },
  logRow: { padding: '10px 0', borderBottom: '1px solid #111', fontSize: '13px' },
  logTime: { color: '#333' },

  // NOTIFS
  notificationStack: { position: 'fixed', top: '30px', right: '30px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '15px' },
  notifCard: { background: '#0a0a0a', padding: '20px 35px', borderRadius: '15px', color: '#fff', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', animation: 'slideIn 0.4s ease' },

  alexOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  alexBox: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', textAlign: 'center', border: '1px solid #222' },
  alexInput: { background: '#000', border: '1px solid #333', padding: '20px', borderRadius: '15px', color: '#fff', fontSize: '24px', textAlign: 'center', width: '300px' },
  primaryBtn: { background: themeColor, color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer' },

  footer: { height: '60px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 50px', fontSize: '11px', color: '#333' }
};

// Inyectar CSS de animaciones
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .loader { width: 60px; height: 60px; border: 5px solid #111; border-top-color: ${themeColor}; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .videoCard:hover { transform: scale(1.03); border-color: ${themeColor}; }
    .videoCard:hover .playHint { opacity: 1; }
    body { overflow: hidden; }
  `;
  document.head.appendChild(style);
}
