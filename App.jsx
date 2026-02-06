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
 * @version: 13.0.9-ULTRA-STABLE
 * @description: Reconstrucción total para solucionar errores de persistencia,
 * autenticación y comandos de administración en tiempo real.
 * ============================================================================
 */

// --- NÚCLEO DE CONFIGURACIÓN FIREBASE (PRODUCCIÓN) ---
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

// --- INICIALIZACIÓN CRÍTICA ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configuración de persistencia para evitar el error de "Missing Initial State"
setPersistence(auth, browserLocalPersistence);

// --- VARIABLES MAESTRAS ACTUALIZADAS ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-ULTRA-GOLD";

export default function AlexHubUltraV13() {
  // --- ESTADOS DE SEGURIDAD Y ACCESO ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);

  // --- ESTADOS DE BASE DE DATOS (REALTIME) ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, onlineNow: 0 });

  // --- NAVEGACIÓN Y MULTIMEDIA ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // --- PANEL DE CONTROL ADMINISTRATIVO (ALEX) ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users'); // users, logs, cloud, security

  // --- UI & NOTIFICACIONES ---
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const themeColor = '#E50914';

  // --- UTILIDAD: NORMALIZADOR DE EMAILS ---
  // Elimina caracteres prohibidos por Firebase y maneja dominios .com, .eu, etc.
  const normalizeEmail = (email) => {
    if (!email) return "";
    return email.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_');
  };

  const denormalizeEmail = (key) => {
    if (!key) return "";
    return key.replace(/_dot_/g, '.').replace(/_at_/g, '@');
  };

  // ==========================================
  // 1. GESTIÓN DE AUTENTICACIÓN Y SEGURIDAD
  // ==========================================

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        verifyPermissions(currentUser.email);
        updateUserMetadata(currentUser);
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Suscripciones Realtime masivas
    const dbRefs = [
      { path: 'whitelist', state: setWhitelist },
      { path: 'blacklist', state: setBlacklist },
      { path: 'premium_users', state: setPremiumUsers }
    ];

    const unsubscribes = dbRefs.map(item => {
      return onValue(ref(db, item.path), (snap) => {
        item.state(snap.val() || {});
      });
    });

    // Logs con límite de 100
    const unsubLogs = onValue(ref(db, 'logs'), (snap) => {
      const data = snap.val() || {};
      setSystemLogs(Object.entries(data).reverse().slice(0, 100));
    });

    return () => {
      unsubscribeAuth();
      unsubscribes.forEach(u => u());
      unsubLogs();
    };
  }, []);

  const verifyPermissions = async (email) => {
    const emailKey = normalizeEmail(email);
    
    // Prioridad 1: Blacklist
    const blackRef = ref(db, `blacklist/${emailKey}`);
    const blackSnap = await get(blackRef);
    
    if (blackSnap.exists()) {
      setIsBanned(true);
      setAccessGranted(false);
      setAuthLoading(false);
      return;
    }

    // Prioridad 2: Admin o Whitelist
    const whiteRef = ref(db, `whitelist/${emailKey}`);
    const whiteSnap = await get(whiteRef);
    
    if (whiteSnap.exists() || email === "admin@alexhub.com") {
      setAccessGranted(true);
      setIsBanned(false);
      addNotification(`Bienvenido, ${email.split('@')[0]}`, "success");
    } else {
      setAccessGranted(false);
      setLoginError("ACCESO DENEGADO: Tu correo no está en la base de datos.");
    }
    setAuthLoading(false);
  };

  const updateUserMetadata = (u) => {
    const userRef = ref(db, `online_users/${normalizeEmail(u.email)}`);
    set(userRef, {
      lastSeen: serverTimestamp(),
      displayName: u.displayName,
      photo: u.photoURL
    });
    onDisconnect(userRef).remove();
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      // Forzamos el prompt para evitar el error de estado inicial en algunos navegadores
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      logActivity(`Intento de login Google: ${result.user.email}`);
    } catch (error) {
      console.error(error);
      setLoginError(`ERROR DE AUTENTICACIÓN: ${error.code}`);
      addNotification("Error en Google Auth. Intente de nuevo.", "error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  // ==========================================
  // 2. PANEL ADMINISTRATIVO Y COMANDOS
  // ==========================================

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      logActivity("ACCESO AL PANEL DE CONTROL");
    } else {
      addNotification("CLAVE INCORRECTA", "error");
    }
  };

  const executeCommand = async (type, targetEmail, action) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      addNotification("EMAIL INVÁLIDO", "error");
      return;
    }

    const emailKey = normalizeEmail(targetEmail);
    const targetPath = `${type}/${emailKey}`;

    try {
      if (action === 'add') {
        await set(ref(db, targetPath), {
          email: targetEmail,
          date: new Date().toISOString(),
          grantedBy: user?.email || 'SYSTEM'
        });
        addNotification(`${targetEmail} agregado a ${type}`, "success");
      } else {
        await remove(ref(db, targetPath));
        addNotification(`${targetEmail} eliminado de ${type}`, "info");
      }
      setNewEmailInput('');
      logActivity(`ADMIN ${action.toUpperCase()}: ${targetEmail} en ${type}`);
    } catch (err) {
      addNotification("Error en base de datos", "error");
    }
  };

  const logActivity = (msg) => {
    const logRef = push(ref(db, 'logs'));
    set(logRef, {
      msg,
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'Unknown',
      ip: 'Encrypted'
    });
  };

  // ==========================================
  // 3. MOTOR MULTIMEDIA (YOUTUBE & OTROS)
  // ==========================================

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    
    try {
      if (mode === 'youtube') {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=28&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.items) setVideos(data.items);
      }
      logActivity(`Búsqueda [${mode}]: ${query}`);
    } catch (error) {
      addNotification("Error de conexión con API", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // 4. COMPONENTES DE INTERFAZ (UI)
  // ==========================================

  // --- LOADER DEL SISTEMA ---
  if (authLoading) {
    return (
      <div style={styles.fullPageCenter}>
        <div className="system-loader"></div>
        <div style={styles.loadingText}>INICIALIZANDO ALEX HUB ULTRA...</div>
      </div>
    );
  }

  // --- PANTALLA DE BANEO ---
  if (isBanned) {
    return (
      <div style={styles.bannedContainer}>
        <div style={styles.bannedCard}>
          <h1 className="glitch" data-text="ACCESO BLOQUEADO">ACCESO BLOQUEADO</h1>
          <p>Tu cuenta ({user?.email}) ha sido identificada en la lista negra.</p>
          <div style={styles.divider}></div>
          <button onClick={handleLogout} style={styles.btnDangerLarge}>SALIR DEL SISTEMA</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.mainWrapper}>
      {/* NOTIFICACIONES DINÁMICAS */}
      <div style={styles.notifWrapper}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notifItem, borderLeft: `5px solid ${n.type === 'error' ? '#ff0000' : '#00ff41'}`}}>
            {n.text}
          </div>
        ))}
      </div>

      {/* LOGIN O DASHBOARD */}
      {(!user || !accessGranted) ? (
        <div style={styles.loginOverlay}>
          <div style={styles.loginBox}>
            <div className="title-shimmer">ALEX HUB <span style={{color: themeColor}}>ULTRA</span></div>
            <p style={styles.subtext}>CORE ENGINE v{SYSTEM_VERSION}</p>
            
            <div style={styles.loginActionArea}>
              {!user ? (
                <button onClick={handleGoogleLogin} style={styles.googleButton}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{width:'20px'}}/>
                  CONECTAR CON GOOGLE
                </button>
              ) : (
                <div style={styles.pendingBox}>
                  <div className="pulse-dot"></div>
                  <p>SOLICITUD PENDIENTE DE APROBACIÓN</p>
                  <small>{user.email}</small>
                  <button onClick={handleLogout} style={styles.logoutLink}>Cancelar</button>
                </div>
              )}
            </div>

            {loginError && <div style={styles.errorMessage}>{loginError}</div>}

            <div style={{marginTop: '40px'}}>
              <button onClick={() => setShowAlexLogin(true)} style={styles.adminAccessBtn}>CONSOLA DE MANTENIMIENTO</button>
            </div>
          </div>
        </div>
      ) : (
        /* --- DASHBOARD COMPLETO --- */
        <div style={styles.dashboardLayout}>
          {/* BARRA DE NAVEGACIÓN SUPERIOR */}
          <header style={styles.topNav}>
            <div style={styles.navLeft}>
              <div style={styles.brand}>ALEX<span style={{color: themeColor}}>ULTRA</span></div>
              <div style={styles.modeSelectors}>
                {['youtube', 'twitch', 'cinema', 'xbox'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => {setMode(m); setSelectedVideo(null)}} 
                    style={mode === m ? {...styles.modeBtn, background: themeColor, color:'#fff'} : styles.modeBtn}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSearch} style={styles.searchBar}>
              <input 
                type="text" 
                placeholder={`Buscar en ${mode}...`} 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={styles.searchInput}
              />
              <button type="submit" style={styles.searchBtn}>BUSCAR</button>
            </form>

            <div style={styles.navRight}>
              {premiumUsers[normalizeEmail(user.email)] && <div className="premium-tag">PREMIUM</div>}
              <div style={styles.profileArea}>
                <img src={user.photoURL} alt="p" style={styles.avatar} />
                <div style={styles.profileInfo}>
                  <span>{user.displayName.split(' ')[0]}</span>
                  <button onClick={handleLogout} style={styles.exitBtn}>LOGOUT</button>
                </div>
              </div>
              <button onClick={() => setShowAlexLogin(true)} style={styles.alexTrigger}>ALEX</button>
            </div>
          </header>

          {/* ÁREA DE CONTENIDO DINÁMICO */}
          <main style={styles.contentMain}>
            {loadingContent && <div className="content-loader-overlay"><div className="loader"></div></div>}
            
            <div style={styles.scrollArea}>
              {selectedVideo ? (
                <div style={styles.videoPlayerContainer}>
                  <div style={styles.videoHeader}>
                    <button onClick={() => setSelectedVideo(null)} style={styles.backBtn}>← VOLVER</button>
                  </div>
                  <iframe 
                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1&rel=0`}
                    style={styles.iframe}
                    allowFullScreen
                  />
                </div>
              ) : (
                <div style={styles.mediaGrid}>
                  {videos.map((vid, idx) => (
                    <div key={idx} style={styles.mediaCard} onClick={() => setSelectedVideo(vid.id.videoId)}>
                      <div style={styles.mediaThumb}>
                        <img src={vid.snippet.thumbnails.high.url} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                        <div className="play-hint">▶</div>
                      </div>
                      <div style={styles.mediaMeta}>
                        <h4 style={styles.mediaTitle}>{vid.snippet.title}</h4>
                        <p style={styles.mediaChannel}>{vid.snippet.channelTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mode !== 'youtube' && !selectedVideo && (
                <div style={styles.iframePlaceholder}>
                   <iframe 
                    src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                         mode === 'cinema' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                         "https://www.xbox.com/play"} 
                    style={styles.iframe} 
                   />
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* --- MODAL DE AUTENTICACIÓN ADMIN --- */}
      {showAlexLogin && (
        <div style={styles.adminModalBg}>
          <div style={styles.adminModalBox}>
            <h3>RESTRICTED ACCESS</h3>
            <p>CONSOLA DE NIVEL 4 - INGRESE CREDENCIALES</p>
            <form onSubmit={handleAdminAuth}>
              <input 
                type="password" 
                placeholder="TOKEN DE SEGURIDAD" 
                value={alexPassInput}
                onChange={(e) => setAlexPassInput(e.target.value)}
                style={styles.passInput}
                autoFocus
              />
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.btnConfirm}>AUTORIZAR</button>
                <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.btnCancel}>ABORTAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONSOLA MAESTRA DE ADMINISTRACIÓN (COMMAND CENTER) --- */}
      {isAdminOpen && (
        <div style={styles.commandCenter}>
          <div style={styles.commandHeader}>
            <div style={styles.commandTitle}>
              <h2>COMMAND CENTER V13</h2>
              <p>USER MANAGEMENT & CORE OVERRIDE</p>
            </div>
            <div style={styles.commandTabs}>
              <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.tabActive : styles.tabBtn}>ACCESOS</button>
              <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.tabActive : styles.tabBtn}>REGISTROS</button>
              <button onClick={() => setIsAdminOpen(false)} style={styles.closeConsole}>TERMINAR SESIÓN</button>
            </div>
          </div>

          <div style={styles.commandBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminLayout}>
                {/* SECCIÓN WHITELIST */}
                <div style={styles.adminCol}>
                  <h4 style={{color:'#00ff41'}}>✅ WHITELIST (ACCESO)</h4>
                  <div style={styles.addArea}>
                    <input 
                      value={newEmailInput} 
                      onChange={e => setNewEmailInput(e.target.value)}
                      placeholder="Email a permitir..."
                    />
                    <button onClick={() => executeCommand('whitelist', newEmailInput, 'add')}>ADD</button>
                  </div>
                  <div style={styles.listContainer}>
                    {Object.values(whitelist).map(item => (
                      <div key={item.email} style={styles.listRow}>
                        <span>{item.email}</span>
                        <button onClick={() => executeCommand('whitelist', item.email, 'remove')}>REVOKE</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECCIÓN BLACKLIST (BAN) */}
                <div style={styles.adminCol}>
                  <h4 style={{color:'#ff0000'}}>🚫 BLACKLIST (BANEO)</h4>
                  <div style={styles.addArea}>
                    <input 
                      value={newEmailInput} 
                      onChange={e => setNewEmailInput(e.target.value)}
                      placeholder="Email a bloquear..."
                    />
                    <button style={{background:'#ff0000'}} onClick={() => executeCommand('blacklist', newEmailInput, 'add')}>BAN</button>
                  </div>
                  <div style={styles.listContainer}>
                    {Object.values(blacklist).map(item => (
                      <div key={item.email} style={styles.listRow}>
                        <span style={{color:'#ff7b7b'}}>{item.email}</span>
                        <button style={{color:'#00ff41'}} onClick={() => executeCommand('blacklist', item.email, 'remove')}>UNBAN</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECCIÓN PREMIUM */}
                <div style={styles.adminCol}>
                  <h4 style={{color:'#FFD700'}}>💎 PREMIUM NODES</h4>
                  <div style={styles.addArea}>
                    <input 
                      value={newEmailInput} 
                      onChange={e => setNewEmailInput(e.target.value)}
                      placeholder="Email premium..."
                    />
                    <button style={{background:'#FFD700', color:'#000'}} onClick={() => executeCommand('premium_users', newEmailInput, 'add')}>GIVE</button>
                  </div>
                  <div style={styles.listContainer}>
                    {Object.values(premiumUsers).map(item => (
                      <div key={item.email} style={styles.listRow}>
                        <span>{item.email}</span>
                        <button onClick={() => executeCommand('premium_users', item.email, 'remove')}>REMOVE</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* SECCIÓN LOGS */
              <div style={styles.logWrapper}>
                <div style={styles.logMonitor}>
                  {systemLogs.map(([key, log]) => (
                    <div key={key} style={styles.logLine}>
                      <span style={{color: '#555'}}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span style={{color: themeColor}}> {log.user}</span>: {log.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER INFORMATIVO */}
      <footer style={styles.sysFooter}>
        <div style={styles.footerL}>
          SYSTEM STATUS: <span className="online-led"></span> OPERATIONAL
        </div>
        <div style={styles.footerR}>
          ENCRYPTION: AES-256-BIT | DATA_CENTER: DEFAULT-RTDB
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE ESTILOS CSS-IN-JS
// ==========================================
const styles = {
  mainWrapper: { height: '100vh', width: '100vw', background: '#000', color: '#fff', overflow: 'hidden', position: 'relative', fontFamily: "'Inter', sans-serif" },
  fullPageCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loadingText: { marginTop: '20px', color: '#E50914', fontSize: '14px', letterSpacing: '4px', fontWeight: 'bold' },
  
  // LOGIN UI
  loginOverlay: { position: 'fixed', inset: 0, background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginBox: { width: '450px', background: 'rgba(10,10,10,0.8)', border: '1px solid #222', padding: '60px', borderRadius: '40px', textAlign: 'center', backdropFilter: 'blur(20px)' },
  subtext: { fontSize: '10px', color: '#555', letterSpacing: '3px', marginTop: '10px' },
  googleButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', width: '100%', padding: '18px', borderRadius: '15px', border: 'none', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: '0.3s', marginTop: '40px' },
  errorMessage: { marginTop: '25px', padding: '12px', background: 'rgba(255,0,0,0.1)', color: '#ff4444', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  adminAccessBtn: { background: 'none', border: 'none', color: '#333', fontSize: '11px', cursor: 'pointer', letterSpacing: '1px' },
  
  // DASHBOARD UI
  dashboardLayout: { height: '100vh', display: 'flex', flexDirection: 'column' },
  topNav: { height: '80px', background: '#080808', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', zIndex: 50 },
  brand: { fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  modeSelectors: { display: 'flex', gap: '10px', marginLeft: '30px' },
  modeBtn: { background: '#151515', border: 'none', color: '#666', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: '0.3s' },
  
  searchBar: { flex: 1, maxWidth: '600px', display: 'flex', margin: '0 40px', background: '#111', borderRadius: '12px', padding: '4px', border: '1px solid #222' },
  searchInput: { flex: 1, background: 'none', border: 'none', padding: '12px 20px', color: '#fff', outline: 'none' },
  searchBtn: { background: '#E50914', border: 'none', color: '#fff', padding: '0 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  avatar: { width: '42px', height: '42px', borderRadius: '12px', border: '1px solid #333' },
  profileInfo: { display: 'flex', flexDirection: 'column', fontSize: '12px' },
  exitBtn: { background: 'none', border: 'none', color: '#E50914', fontSize: '10px', cursor: 'pointer', textAlign: 'left', padding: 0 },
  alexTrigger: { background: '#E50914', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900' },
  
  contentMain: { flex: 1, background: '#050505', position: 'relative', overflow: 'hidden' },
  scrollArea: { height: '100%', overflowY: 'auto', padding: '40px' },
  mediaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  mediaCard: { background: '#0d0d0d', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', transition: '0.3s', border: '1px solid #151515' },
  mediaThumb: { width: '100%', aspectRatio: '16/9', position: 'relative' },
  mediaMeta: { padding: '20px' },
  mediaTitle: { margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', height: '40px', overflow: 'hidden' },
  mediaChannel: { color: '#555', fontSize: '12px' },
  
  // ADMIN CONSOLE UI
  commandCenter: { position: 'fixed', inset: '30px', background: '#080808', border: '1px solid #333', borderRadius: '30px', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '0 50px 100px rgba(0,0,0,0.8)' },
  commandHeader: { padding: '30px 40px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  commandTabs: { display: 'flex', gap: '15px' },
  tabBtn: { background: '#111', border: 'none', color: '#555', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  tabActive: { background: '#E50914', border: 'none', color: '#fff', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  closeConsole: { background: '#fff', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  
  commandBody: { flex: 1, padding: '40px', overflowY: 'auto' },
  adminLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px' },
  adminCol: { background: '#0d0d0d', padding: '25px', borderRadius: '20px', border: '1px solid #1a1a1a' },
  addArea: { display: 'flex', gap: '10px', marginBottom: '20px' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  listRow: { background: '#050505', padding: '12px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' },
  
  // MODALS & MISC
  adminModalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  adminModalBox: { background: '#0d0d0d', padding: '50px', borderRadius: '35px', border: '1px solid #222', textAlign: 'center', width: '380px' },
  passInput: { width: '100%', padding: '20px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '15px', fontSize: '24px', textAlign: 'center', marginBottom: '30px', outline: 'none' },
  btnConfirm: { background: '#E50914', color: '#fff', padding: '15px 30px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  btnCancel: { background: 'none', color: '#555', padding: '15px 30px', border: 'none', cursor: 'pointer' },
  
  notifWrapper: { position: 'fixed', top: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' },
  notifItem: { background: '#111', color: '#fff', padding: '18px 30px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  
  sysFooter: { height: '40px', background: '#000', borderTop: '1px solid #111', padding: '0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#444' }
};

// --- INYECCIÓN DE ESTILOS GLOBALES DINÁMICOS ---
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    
    .system-loader { width: 60px; height: 60px; border: 4px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .title-shimmer { font-size: 40px; font-weight: 900; letter-spacing: 5px; background: linear-gradient(90deg, #fff, #555, #fff); background-size: 200%; animation: shimmer 3s infinite; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    @keyframes shimmer { to { background-position: 200%; } }
    
    .glitch { font-weight: 900; position: relative; color: #fff; }
    .glitch::before, .glitch::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .glitch::before { left: 2px; text-shadow: -2px 0 #ff00c1; clip: rect(44px, 450px, 56px, 0); animation: glitch-anim 5s infinite linear alternate-reverse; }
    @keyframes glitch-anim { 0% { clip: rect(31px, 9999px, 94px, 0); } 100% { clip: rect(89px, 9999px, 5px, 0); } }
    
    .mediaCard:hover { transform: scale(1.03); border-color: #E50914; }
    .play-hint { position: absolute; inset: 0; display: flex; align-items: center; justifyContent: center; background: rgba(0,0,0,0.5); opacity: 0; transition: 0.3s; font-size: 40px; }
    .mediaCard:hover .play-hint { opacity: 1; }
    
    .online-led { width: 8px; height: 8px; background: #00ff41; border-radius: 50%; display: inline-block; margin-right: 5px; box-shadow: 0 0 10px #00ff41; }
    .premium-tag { background: linear-gradient(45deg, #FFD700, #FFA500); color: #000; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 900; animation: gold-pulse 2s infinite; }
    @keyframes gold-pulse { 0% { box-shadow: 0 0 0px #FFD700; } 50% { box-shadow: 0 0 15px #FFD700; } 100% { box-shadow: 0 0 0px #FFD700; } }
    
    .pulse-dot { width: 12px; height: 12px; background: #ff9800; border-radius: 50%; margin: 0 auto 15px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
    
    input { outline: none; transition: 0.3s; }
    input:focus { border-color: #E50914 !important; }
    button { transition: 0.2s; }
    button:active { transform: scale(0.95); }
  `;
  document.head.appendChild(styleSheet);
}
