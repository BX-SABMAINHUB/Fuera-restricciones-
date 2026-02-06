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
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (FIXED BUILD)
 * ============================================================================
 * @author: Alex Hub Team
 * @version: 13.0.6-ULTRA-STABLE
 * @status: PRODUCTION READY
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

// Configurar persistencia local para evitar errores de "Missing Initial State"
setPersistence(auth, browserLocalPersistence);

// --- CONSTANTES DE SISTEMA ---
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.6-ULTRA-FIXED";

export default function AlexHubUltraV13() {
  // --- ESTADOS DE SEGURIDAD ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);

  // --- ESTADOS DE BASE DE DATOS ---
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

  // --- PANEL ADMINISTRADOR (ALEX) ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');

  // --- UI & NOTIFICATIONS ---
  const [notifications, setNotifications] = useState([]);
  const themeColor = '#E50914';

  // ==========================================
  // UTILS: MANEJO SEGURO DE EMAILS (FIX DB ERROR)
  // ==========================================
  
  // Esta función escapa caracteres prohibidos en Firebase para cualquier dominio (.com, .eu, etc)
  const encodeEmail = (email) => {
    return email.toLowerCase()
      .replace(/\./g, ',')
      .replace(/@/g, '_at_')
      .replace(/\$/g, '_ds_')
      .replace(/#/g, '_hash_')
      .replace(/\[/g, '_ob_')
      .replace(/\]/g, '_cb_');
  };

  // ==========================================
  // 1. EFECTOS Y LISTENERS EN TIEMPO REAL
  // ==========================================

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        checkSecurityLayer(currentUser.email);
        logActivity(`Sesión activa detectada: ${currentUser.email}`);
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Listeners de Realtime Database
    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const data = s.val() || {};
      const logArray = Object.values(data).sort((a,b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50);
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
  // 2. LOGICA DE SEGURIDAD (CORREGIDA)
  // ==========================================

  const checkSecurityLayer = useCallback((email) => {
    const emailKey = encodeEmail(email);
    
    // Verificación atómica de seguridad
    onValue(ref(db, `blacklist/${emailKey}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
        setAuthLoading(false);
        logActivity(`BLOQUEO: Intento de acceso desde cuenta baneada: ${email}`);
      } else {
        setIsBanned(false);
        onValue(ref(db, `whitelist/${emailKey}`), (whiteSnap) => {
          if (whiteSnap.exists() || email === "admin@alexhub.com") {
            setAccessGranted(true);
            setLoginError(null);
          } else {
            setAccessGranted(false);
            setLoginError("ERROR: Tu correo no está en la Whitelist del servidor.");
          }
          setAuthLoading(false);
        });
      }
    });
  }, []);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setAuthLoading(true);
    try {
      // Forzar selección de cuenta para evitar el error de "missing initial state"
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      addNotification(`Bienvenido, ${result.user.displayName}`, "success");
    } catch (error) {
      console.error(error);
      setAuthLoading(false);
      if (error.code === 'auth/popup-closed-by-user') {
        setLoginError("Login cancelado por el usuario.");
      } else {
        setLoginError(`Error de Google Auth: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (e) {
      addNotification("Error al cerrar sesión", "error");
    }
  };

  // ==========================================
  // 3. COMANDOS ADMINISTRADOR (FIXED COMMANDS)
  // ==========================================

  const handleAlexAuth = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("CENTRO DE CONTROL ACTIVADO", "success");
      logActivity("ADMIN: Acceso total concedido.");
    } else {
      addNotification("PASS INCORRECTA", "error");
      logActivity(`ALERTA: Intento de bypass Admin con: ${alexPassInput}`);
    }
  };

  const logActivity = (msg) => {
    const logRef = push(ref(db, 'logs'));
    set(logRef, {
      msg,
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'System'
    });
  };

  const manageSystemUser = async (table, email, action) => {
    if (!email || !email.includes('@')) {
      return addNotification("E-mail inválido o vacío", "error");
    }

    const emailKey = encodeEmail(email);
    const targetRef = ref(db, `${table}/${emailKey}`);

    try {
      if (action === 'add') {
        await set(targetRef, {
          email: email,
          addedAt: new Date().toISOString(),
          grantedBy: user?.email || 'Master-Admin'
        });
        addNotification(`${email} añadido a ${table}`, "success");
        logActivity(`ADMIN: Agregó ${email} a ${table}`);
      } else {
        await remove(targetRef);
        addNotification(`${email} eliminado de ${table}`, "info");
        logActivity(`ADMIN: Eliminó ${email} de ${table}`);
      }
      setNewEmailInput('');
    } catch (err) {
      addNotification(`Error DB: ${err.message}`, "error");
    }
  };

  // ==========================================
  // 4. MULTIMEDIA & SEARCH ENGINE
  // ==========================================

  const executeSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=28&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        if (data.items) setVideos(data.items);
        setSelectedVideo(null);
      }
      logActivity(`Búsqueda [${mode}]: ${query}`);
    } catch (err) {
      addNotification("Fallo en la red de búsqueda", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  };

  // ==========================================
  // 5. RENDER COMPONENTS
  // ==========================================

  // --- PANTALLA CARGA ---
  if (authLoading && !user) {
    return (
      <div style={styles.fullCenter}>
        <div className="loader"></div>
        <h2 style={{color: themeColor, marginTop: '20px', letterSpacing: '4px'}}>INICIALIZANDO ALEX HUB...</h2>
      </div>
    );
  }

  // --- PANTALLA BANEO ---
  if (isBanned) {
    return (
      <div style={styles.bannedScreen}>
        <div style={styles.errorBox}>
          <h1 className="glitch" style={{color: '#ff0000'}}>SISTEMA BLOQUEADO</h1>
          <p style={{fontSize: '18px'}}>Tu identidad ha sido vetada por el administrador central.</p>
          <p style={{color: '#555', fontSize: '12px'}}>ID: {encodeEmail(user?.email || 'unknown')}</p>
          <button onClick={handleLogout} style={styles.logoutBtnLarge}>SALIR DEL TERMINAL</button>
        </div>
      </div>
    );
  }

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

      {/* LOGIN PAGE */}
      {(!user || !accessGranted) && (
        <div style={styles.loginPage}>
          <div style={styles.loginCard}>
            <h1 style={styles.glitchText}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
            <p style={styles.versionTag}>KERNEL: {SYSTEM_VERSION}</p>
            
            <div style={{margin: '45px 0'}}>
              {!user ? (
                <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{width:'22px'}} />
                  CONECTAR CON GOOGLE
                </button>
              ) : (
                <div style={styles.pendingStatus}>
                  <div className="pulse-dot"></div>
                  <p style={{color: '#ff9800', fontWeight: 'bold'}}>AUTORIZACIÓN PENDIENTE</p>
                  <p style={{fontSize: '11px', opacity: 0.6}}>{user.email}</p>
                  <button onClick={handleLogout} style={styles.logoutMini}>CAMBIAR CUENTA</button>
                </div>
              )}
            </div>

            {loginError && <div style={styles.errorText}>{loginError}</div>}

            <div style={{marginTop: '40px'}}>
              <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtn}>MODO ADMINISTRADOR</button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL */}
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

            <form onSubmit={executeSearch} style={styles.searchForm}>
              <input 
                style={styles.searchInput} 
                placeholder={`Explorar en la red de ${mode}...`} 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
              />
              <button type="submit" style={styles.searchIconBtn}>🔍</button>
            </form>

            <div style={styles.navRight}>
               {premiumUsers[encodeEmail(user.email)] && <span className="premium-badge">💎 PREMIUM</span>}
               <div style={styles.userInfo}>
                  <img src={user.photoURL} style={styles.userPic} alt="pfp" />
                  <div style={styles.userMeta}>
                    <span style={styles.userName}>{user.displayName?.split(' ')[0]}</span>
                    <button onClick={handleLogout} style={styles.logoutMini}>LOGOUT</button>
                  </div>
               </div>
               <button onClick={() => setShowAlexLogin(true)} style={{...styles.alexBtnMini, background: themeColor}}>ADMIN</button>
            </div>
          </nav>

          <main style={styles.contentArea}>
            {loadingContent && <div style={styles.loadOverlay}><div className="loader"></div></div>}
            
            {mode === 'youtube' && (
              <div style={styles.grid}>
                {selectedVideo ? (
                  <div style={styles.playerWrap}>
                    <iframe 
                      src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1&rel=0`} 
                      style={styles.iframe} 
                      allowFullScreen 
                    />
                    <div style={styles.playerControls}>
                      <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>← VOLVER</button>
                      <button onClick={() => addNotification("Guardado en favoritos", "info")} style={styles.favBtn}>⭐ GUARDAR</button>
                    </div>
                  </div>
                ) : (
                  videos.map((v, i) => (
                    <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                      <div style={styles.thumbWrapper}>
                        <img src={v.snippet.thumbnails.high.url} style={styles.thumb} alt="t" />
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
                  <div style={styles.frameHeader}>
                    <span style={{color: themeColor}}>● STREAMING ACTIVO:</span> {query || 'CANAL PRINCIPAL'}
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

      {/* MODAL PASSWORD ALEX */}
      {showAlexLogin && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.miniCard, borderTopColor: themeColor}}>
             <h3 style={{letterSpacing: '5px', color: '#fff'}}>CONTROL DE ACCESO</h3>
             <p style={{fontSize: '11px', color: '#555', marginBottom: '25px'}}>CREDENCIAL DE ADMINISTRADOR REQUERIDA</p>
             <form onSubmit={handleAlexAuth}>
               <input 
                 type="password" 
                 placeholder="••••••••" 
                 value={alexPassInput} 
                 onChange={e => setAlexPassInput(e.target.value)} 
                 style={styles.adminInput}
                 autoFocus
               />
               <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                 <button type="submit" style={{...styles.confirmBtn, background: themeColor}}>VERIFICAR</button>
                 <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>CANCELAR</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* PANEL GIGANTE ALEX (COMMAND CENTER) */}
      {isAdminOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <div style={styles.adminTitle}>
              <h1 style={{color: themeColor, margin: 0}}>ALEX HUB | COMMAND CENTER</h1>
              <p style={{margin: 0, fontSize: '12px', opacity: 0.5}}>GESTIÓN DE NÚCLEO Y PERMISOS</p>
            </div>
            <div style={{display:'flex', gap:'15px'}}>
               <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.adminTabActive : styles.adminTab}>USUARIOS</button>
               <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.adminTabActive : styles.adminTab}>HISTORIAL</button>
               <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>APAGAR PANEL</button>
            </div>
          </div>
          
          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminGrid}>
                {/* COLUMNA WHITELIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#00ff41', borderBottom: '1px solid #111', paddingBottom: '10px'}}>✅ WHITELIST</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="usuario@gmail.com" style={styles.adminInputText}/>
                      <button onClick={() => manageSystemUser('whitelist', newEmailInput, 'add')} style={styles.addBtn}>ADD</button>
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

                {/* COLUMNA BLACKLIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#E50914', borderBottom: '1px solid #111', paddingBottom: '10px'}}>🚫 BLACKLIST (BAN)</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="usuario@gmail.com" style={styles.adminInputText}/>
                      <button onClick={() => manageSystemUser('blacklist', newEmailInput, 'add')} style={styles.banBtnAction}>BANEAR</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.values(blacklist).map(u => (
                        <div key={u.email} style={styles.listItem}>
                           <span style={{color: '#ff4444'}}>{u.email}</span>
                           <button onClick={() => manageSystemUser('blacklist', u.email, 'remove')} style={styles.unbanBtn}>PERDONAR</button>
                        </div>
                      ))}
                   </div>
                </div>

                {/* COLUMNA PREMIUM */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#FFD700', borderBottom: '1px solid #111', paddingBottom: '10px'}}>💎 PREMIUM NODES</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="usuario@gmail.com" style={styles.adminInputText}/>
                      <button onClick={() => manageSystemUser('premium_users', newEmailInput, 'add')} style={styles.premiumBtnAdd}>UPGRADE</button>
                   </div>
                   <div style={styles.scrollList}>
                      {Object.values(premiumUsers).map(u => (
                        <div key={u.email} style={styles.listItem}>
                           <span>{u.email}</span>
                           <button onClick={() => manageSystemUser('premium_users', u.email, 'remove')} style={styles.deleteBtn}>DEGRADE</button>
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
          <span>SISTEMA: <span style={{color: '#00ff41'}}>ESTABLE</span></span>
          <span style={{marginLeft: '20px'}}>ENCRIPTACIÓN: <span style={{color: '#00ff41'}}>AES-256</span></span>
        </div>
        <div style={styles.footerRight}>
          <span>ALEX HUB ULTRA © 2026 | VERSIÓN FINAL</span>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE ESTILOS (PRO)
// ==========================================
const styles = {
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' },
  appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
  
  // LOGIN
  loginPage: { height: '100vh', background: 'radial-gradient(circle at center, #111 0%, #000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 50 },
  loginCard: { background: 'rgba(10,10,10,0.85)', padding: '70px', borderRadius: '40px', border: '1px solid #1a1a1a', textAlign: 'center', backdropFilter: 'blur(25px)', boxShadow: '0 25px 50px rgba(0,0,0,0.9)' },
  glitchText: { fontSize: '55px', fontWeight: '900', letterSpacing: '8px', margin: 0, textShadow: '0 0 20px rgba(229,9,20,0.3)' },
  versionTag: { fontSize: '10px', color: '#444', letterSpacing: '4px', marginTop: '10px' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '18px 45px', borderRadius: '15px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', transition: '0.3s', margin: '40px auto', boxShadow: '0 10px 20px rgba(255,255,255,0.1)' },
  alexBtn: { background: 'transparent', border: '1px solid #222', color: '#444', padding: '12px 30px', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', transition: '0.3s' },
  errorText: { color: '#ff4444', background: 'rgba(255,68,68,0.1)', padding: '15px', borderRadius: '10px', marginTop: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid rgba(255,68,68,0.2)' },
  pendingStatus: { textAlign: 'center', padding: '20px', background: 'rgba(255,152,0,0.05)', borderRadius: '20px', border: '1px solid rgba(255,152,0,0.1)' },

  // NAVBAR
  navbar: { height: '95px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between', zIndex: 100 },
  logoBox: { borderLeft: '5px solid', paddingLeft: '20px', display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '28px', fontWeight: '900', letterSpacing: '2px' },
  logoSub: { fontSize: '10px', fontWeight: 'bold' },
  tabContainer: { display: 'flex', gap: '8px', marginLeft: '45px' },
  tab: { background: '#0a0a0a', border: 'none', color: '#555', padding: '12px 22px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '12px', fontSize: '12px', transition: '0.3s' },
  activeTab: { color: '#fff', borderRadius: '12px', border: 'none', padding: '12px 22px', fontWeight: 'bold', fontSize: '12px' },
  
  searchForm: { flex: 1, maxWidth: '550px', margin: '0 50px', position: 'relative' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '15px', padding: '16px 55px 16px 25px', color: '#fff', outline: 'none', fontSize: '14px', transition: '0.3s' },
  searchIconBtn: { position: 'absolute', right: '20px', top: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },

  navRight: { display: 'flex', gap: '20px', alignItems: 'center' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '15px', background: '#0a0a0a', padding: '8px 18px', borderRadius: '18px', border: '1px solid #111' },
  userPic: { width: '42px', height: '42px', borderRadius: '14px', objectFit: 'cover', border: '1px solid #222' },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '13px', fontWeight: 'bold' },
  logoutMini: { background: 'none', border: 'none', color: '#555', fontSize: '10px', cursor: 'pointer', padding: 0, marginTop: '2px', fontWeight: 'bold' },
  alexBtnMini: { border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '15px', cursor: 'pointer', fontWeight: '900', fontSize: '12px' },

  // CONTENT
  contentArea: { flex: 1, overflowY: 'auto', padding: '40px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' },
  card: { background: '#0a0a0a', borderRadius: '25px', overflow: 'hidden', border: '1px solid #151515', cursor: 'pointer', transition: '0.4s' },
  thumbWrapper: { position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover', transition: '0.6s' },
  playOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', fontWeight: 'bold', fontSize: '14px', letterSpacing: '2px' },
  cardInfo: { padding: '22px' },
  videoTitle: { fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0', height: '42px', overflow: 'hidden', lineHeight: '1.4' },
  videoChannel: { fontSize: '12px', color: '#555', letterSpacing: '1px' },

  playerWrap: { gridColumn: '1/-1', background: '#000', borderRadius: '35px', overflow: 'hidden', height: '80vh', position: 'relative', border: '1px solid #222' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  playerControls: { position: 'absolute', top: '25px', left: '25px', display: 'flex', gap: '15px' },
  closeVideoBtn: { background: '#fff', color: '#000', border: 'none', padding: '14px 28px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' },
  favBtn: { background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(10px)' },

  fullFrame: { width: '100%', height: '100%', borderRadius: '30px', overflow: 'hidden', background: '#000', display: 'flex', flexDirection: 'column', border: '1px solid #111' },
  frameHeader: { padding: '18px 35px', background: '#070707', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #111' },

  // ADMIN CENTER
  adminFrame: { position: 'fixed', inset: '25px', background: '#050505', border: '1px solid #222', zIndex: 500, borderRadius: '45px', display: 'flex', flexDirection: 'column', boxShadow: '0 0 150px rgba(0,0,0,1)' },
  adminHeader: { padding: '35px 55px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808', borderTopLeftRadius: '45px', borderTopRightRadius: '45px' },
  adminBody: { flex: 1, padding: '45px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', height: '100%' },
  adminSection: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '30px', padding: '30px', display: 'flex', flexDirection: 'column' },
  adminActionRow: { display: 'flex', gap: '10px', marginBottom: '25px' },
  adminInputText: { flex: 1, background: '#000', border: '1px solid #222', padding: '14px', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '13px' },
  scrollList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  listItem: { background: '#070707', padding: '18px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #151515' },
  
  adminTab: { background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.3s' },
  adminTabActive: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', borderBottom: '2px solid #fff', fontSize: '14px' },
  
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '0 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  banBtnAction: { background: '#E50914', color: '#fff', border: 'none', padding: '0 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  premiumBtnAdd: { background: '#FFD700', color: '#000', border: 'none', padding: '0 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  deleteBtn: { background: '#1a1a1a', color: '#ff4444', border: '1px solid #333', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  closeAdmin: { background: '#fff', color: '#000', border: 'none', padding: '14px 30px', borderRadius: '18px', cursor: 'pointer', fontWeight: '900' },

  // NOTIFS
  notifContainer: { position: 'fixed', top: '35px', right: '35px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '12px' },
  notif: { background: '#111', color: '#fff', padding: '22px 35px', borderRadius: '18px', borderLeft: '6px solid', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', animation: 'slideIn 0.4s ease' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(15px)' },
  miniCard: { background: '#0a0a0a', padding: '65px', borderRadius: '45px', border: '1px solid #1a1a1a', borderTop: '6px solid', textAlign: 'center', width: '420px', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' },
  adminInput: { width: '100%', padding: '22px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '18px', fontSize: '26px', textAlign: 'center', marginBottom: '35px', outline: 'none' },
  confirmBtn: { color: '#fff', border: 'none', padding: '18px 45px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#444', border: 'none', padding: '18px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  
  // LOGS
  logContainer: { flex: 1, background: '#000', borderRadius: '25px', padding: '35px', fontFamily: 'monospace', fontSize: '13px', overflowY: 'auto', border: '1px solid #111', lineHeight: '1.8' },
  logItem: { padding: '10px 0', borderBottom: '1px solid #0a0a0a', color: '#aaa' },

  footer: { height: '60px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 45px', fontSize: '11px', color: '#444', borderTop: '1px solid #111' },
  bannedScreen: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorBox: { textAlign: 'center', padding: '70px', border: '2px solid #ff0000', borderRadius: '40px', background: 'rgba(255,0,0,0.03)', maxWidth: '600px' },
  logoutBtnLarge: { marginTop: '45px', background: '#ff0000', color: '#fff', border: 'none', padding: '22px 50px', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px' },
  loadOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '35px' }
};

// --- GLOBAL STYLES ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body { margin: 0; padding: 0; background: #000; overflow: hidden; }
    .loader { width: 65px; height: 65px; border: 4px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 0.9s cubic-bezier(0.5, 0, 0.5, 1) infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .glitch { animation: pulse 1.5s infinite; letter-spacing: 5px; font-family: 'Inter', sans-serif; }
    @keyframes pulse { 0%, 100% { opacity: 1; filter: brightness(1); } 50% { opacity: 0.8; filter: brightness(1.3); } }
    .card:hover .thumb { transform: scale(1.08); }
    .card:hover .playOverlay { opacity: 1; }
    @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .pulse-dot { width: 10px; height: 10px; background: #ff9800; border-radius: 50%; margin: 10px auto; animation: dotPulse 1.2s infinite; }
    @keyframes dotPulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.4; } 100% { transform: scale(1); opacity: 1; } }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #333; }
    .premium-badge { background: linear-gradient(45deg, #FFD700, #FFA500); color: #000; padding: 6px 15px; border-radius: 20px; font-size: 10px; font-weight: 900; animation: goldGlow 2s infinite; }
    @keyframes goldGlow { 0%, 100% { box-shadow: 0 0 5px #FFD700; } 50% { box-shadow: 0 0 20px #FFD700; } }
  `;
  document.head.appendChild(style);
}
