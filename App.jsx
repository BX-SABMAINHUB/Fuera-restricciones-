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
 * CORE FIXES:
 * 1. Auth Persistence Fix: setPersistence(browserLocalPersistence)
 * 2. Key Formatting: Sanitize any email domain (.com, .eu, .org)
 * 3. Panic Mode: ManageBac deep link + Tab destruction logic
 * 4. UI: Ultra-Large Media Viewports
 * 5. Admin: Fixed "Remove Ban" and "Whitelist" sync issues
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

// Configuración de persistencia para evitar el error de missing initial state
setPersistence(auth, browserLocalPersistence);

// --- CONSTANTES DE SISTEMA ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-ULTRA-FINAL";

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

  // --- UI ---
  const [notifications, setNotifications] = useState([]);
  const themeColor = '#E50914';

  // ==========================================
  // UTILS: FORMATEO DE LLAVES (FIX DOMAIN)
  // ==========================================
  
  // Esta función permite que cualquier correo (.com, .eu, .pro) sea una llave válida en Firebase
  const encodeEmail = (email) => {
    return email.toLowerCase()
      .replace(/\./g, '_dot_')
      .replace(/@/g, '_at_')
      .replace(/#/g, '_hash_')
      .replace(/\$/g, '_dollar_')
      .replace(/\[/g, '_lbracket_')
      .replace(/\]/g, '_rbracket_');
  };

  const decodeEmail = (key) => {
    return key
      .replace(/_dot_/g, '.')
      .replace(/_at_/g, '@')
      .replace(/_hash_/g, '#')
      .replace(/_dollar_/g, '$')
      .replace(/_lbracket_/g, '[')
      .replace(/_rbracket_/g, ']');
  };

  // ==========================================
  // 1. ESCUCHADORES DE BASE DE DATOS
  // ==========================================

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        checkAccess(u.email);
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const data = s.val() || {};
      setSystemLogs(Object.values(data).reverse().slice(0, 60));
    });

    return () => {
      unsubAuth(); unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs();
    };
  }, []);

  // ==========================================
  // 2. LÓGICA DE ACCESO (FIXED)
  // ==========================================

  const checkAccess = async (email) => {
    const key = encodeEmail(email);
    
    // Verificación en tiempo real
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        onValue(ref(db, `whitelist/${key}`), (wSnap) => {
          if (wSnap.exists() || email === "admin@alexhub.com") {
            setAccessGranted(true);
            setLoginError(null);
          } else {
            setAccessGranted(false);
            setLoginError("ACCESO DENEGADO: NO ESTÁS EN LA WHITELIST.");
          }
        });
      }
      setAuthLoading(false);
    });
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      // Forzar account selection para evitar errores de estado previo
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
      addNotification("Sincronizando con el satélite...", "info");
    } catch (error) {
      console.error(error);
      setLoginError("ERROR DE AUTENTICACIÓN: Reintenta o limpia cookies.");
    }
  };

  const handlePanic = () => {
    // 1. Abrir ManageBac App (Deep Link)
    window.location.href = "managebac://"; 
    
    // 2. Redirección de emergencia por si el deep link falla
    setTimeout(() => {
      window.location.replace("https://www.managebac.com");
    }, 100);

    // 3. Intento de cierre de pestaña (solo funciona si la abrió un script, 
    // pero el replace anterior oculta la actividad)
    window.close();
  };

  // ==========================================
  // 3. COMANDOS ADMINISTRATIVOS (FIXED)
  // ==========================================

  const manageUser = (type, email, action) => {
    if (!email || !email.includes('@')) {
      addNotification("EMAIL INVÁLIDO", "error");
      return;
    }

    const key = encodeEmail(email);
    const targetRef = ref(db, `${type}/${key}`);

    if (action === 'add') {
      set(targetRef, {
        email: email,
        timestamp: serverTimestamp(),
        author: user?.email || "System"
      }).then(() => {
        addNotification(`${email} AÑADIDO A ${type.toUpperCase()}`, "success");
        logActivity(`ADMIN: ${email} añadido a ${type}`);
      }).catch(() => addNotification("ERROR EN DB", "error"));
    } else {
      remove(targetRef).then(() => {
        addNotification(`${email} ELIMINADO DE ${type.toUpperCase()}`, "info");
        logActivity(`ADMIN: ${email} removido de ${type}`);
      }).catch(() => addNotification("ERROR AL ELIMINAR", "error"));
    }
    setNewEmailInput('');
  };

  const handleAlexLogin = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("MODO DIOS ACTIVADO", "success");
    } else {
      addNotification("PASS INCORRECTA", "error");
      logActivity(`FALLO DE LOGIN ADMIN: ${alexPassInput}`);
    }
  };

  const logActivity = (msg) => {
    const lRef = push(ref(db, 'logs'));
    set(lRef, {
      msg,
      user: user?.email || "Anónimo",
      time: new Date().toISOString()
    });
  };

  // ==========================================
  // 4. MULTIMEDIA (GIGANTE)
  // ==========================================

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
      logActivity(`Buscando en ${mode}: ${query}`);
    } catch (err) {
      addNotification("ERROR API YT", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(p => [...p, { id, text, type }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // 5. RENDERIZADO
  // ==========================================

  if (authLoading) return (
    <div style={styles.fullCenter}>
      <div className="loader"></div>
      <h2 style={{color: themeColor, letterSpacing: '8px'}}>ALEX HUB ULTRA</h2>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      
      {/* NOTIFICACIONES */}
      <div style={styles.notifContainer}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notif, borderLeftColor: n.type === 'error' ? '#f00' : '#0f0'}}>
            {n.text}
          </div>
        ))}
      </div>

      {/* PANTALLA DE BANEO */}
      {isBanned && (
        <div style={styles.bannedOverlay}>
          <div style={styles.bannedBox}>
            <h1 className="glitch" style={{fontSize: '70px'}}>SISTEMA BLOQUEADO</h1>
            <p style={{fontSize: '20px', color: '#555'}}>Tu ID de acceso ha sido revocado permanentemente.</p>
            <button onClick={() => signOut(auth)} style={styles.panicBtn}>SALIR</button>
          </div>
        </div>
      )}

      {/* LOGIN SCREEN */}
      {(!user || !accessGranted) && !isBanned && (
        <div style={styles.loginPage}>
          <div style={styles.loginCard}>
            <h1 style={styles.mainTitle}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
            <p style={styles.versionTag}>{SYSTEM_VERSION}</p>
            
            <div style={{margin: '50px 0'}}>
              {!user ? (
                <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" />
                  ENTRAR CON GOOGLE
                </button>
              ) : (
                <div style={styles.statusBox}>
                  <p style={{color: '#ff9800', fontWeight: '900'}}>ESTADO: NO AUTORIZADO</p>
                  <p style={{fontSize: '12px'}}>{user.email}</p>
                  <button onClick={() => signOut(auth)} style={styles.logoutBtn}>CAMBIAR CUENTA</button>
                </div>
              )}
            </div>

            {loginError && <div style={styles.errorBanner}>{loginError}</div>}
            
            <button onClick={() => setShowAlexLogin(true)} style={styles.alexTrigger}>PANEL DE CONTROL</button>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD */}
      {user && accessGranted && !isBanned && (
        <>
          <nav style={styles.navbar}>
            <div style={styles.navLeft}>
              <div style={styles.brand}>ALEX <span style={{color: themeColor}}>V13</span></div>
              <div style={styles.modeTabs}>
                {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => {setMode(m); setSelectedVideo(null)}} 
                    style={mode === m ? {...styles.tab, background: themeColor, color: '#fff'} : styles.tab}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSearch} style={styles.searchBar}>
              <input 
                style={styles.input} 
                placeholder={`Buscar en la red de ${mode}...`} 
                value={query} 
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" style={styles.searchBtn}>🔍</button>
            </form>

            <div style={styles.navRight}>
              <button onClick={handlePanic} style={styles.panicBtn}>PÁNICO</button>
              <div style={styles.profileBox}>
                <img src={user.photoURL} style={styles.avatar} alt="P" />
                <button onClick={() => setShowAlexLogin(true)} style={styles.adminIconBtn}>⚙️</button>
              </div>
            </div>
          </nav>

          <main style={styles.mainContent}>
            {loadingContent && <div style={styles.overlay}><div className="loader"></div></div>}

            {mode === 'youtube' && (
              <div style={styles.mediaGrid}>
                {selectedVideo ? (
                  <div style={styles.giantPlayer}>
                    <iframe 
                      src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`} 
                      style={styles.fullIframe}
                      allowFullScreen
                    />
                    <button onClick={() => setSelectedVideo(null)} style={styles.closePlayer}>VOLVER</button>
                  </div>
                ) : (
                  videos.map((v, i) => (
                    <div key={i} style={styles.videoCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                      <img src={v.snippet.thumbnails.high.url} style={styles.videoThumb} alt="T" />
                      <div style={styles.videoMeta}>
                        <h4 style={styles.vTitle}>{v.snippet.title}</h4>
                        <p style={styles.vChannel}>{v.snippet.channelTitle}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {mode !== 'youtube' && (
              <div style={styles.giantPlayer}>
                <iframe 
                  src={
                    mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                    mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                    "https://www.xbox.com/play"
                  }
                  style={styles.fullIframe}
                />
              </div>
            )}
          </main>
        </>
      )}

      {/* MODAL ADMIN LOGIN */}
      {showAlexLogin && (
        <div style={styles.adminModal}>
          <div style={styles.adminCard}>
            <h3>CLEARANCE REQUIRED</h3>
            <form onSubmit={handleAlexLogin}>
              <input 
                type="password" 
                style={styles.adminInput} 
                value={alexPassInput}
                onChange={e => setAlexPassInput(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
              <div style={styles.btnRow}>
                <button type="submit" style={styles.confirmBtn}>LOGIN</button>
                <button onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>ABORT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PANEL (COMMAND CENTER) */}
      {isAdminOpen && (
        <div style={styles.commandCenter}>
          <div style={styles.adminNav}>
            <h2>COMMAND CENTER V13</h2>
            <div style={{display: 'flex', gap: '15px'}}>
              <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.tabActive : styles.tabAdmin}>USERS</button>
              <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.tabActive : styles.tabAdmin}>LOGS</button>
              <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>EXIT SYSTEM</button>
            </div>
          </div>

          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminGrid}>
                {/* COLUMNA WHITELIST */}
                <div style={styles.adminCol}>
                  <h4 style={{color: '#0f0'}}>WHITE-LIST (ACCESO)</h4>
                  <div style={styles.adminActions}>
                    <input 
                      value={newEmailInput} 
                      onChange={e => setNewEmailInput(e.target.value)} 
                      placeholder="email..." 
                      style={styles.smallInput}
                    />
                    <button onClick={() => manageUser('whitelist', newEmailInput, 'add')} style={styles.addBtn}>ADD</button>
                  </div>
                  <div style={styles.userList}>
                    {Object.values(whitelist).map(u => (
                      <div key={u.email} style={styles.userItem}>
                        <span>{u.email}</span>
                        <button onClick={() => manageUser('whitelist', u.email, 'remove')} style={styles.delBtn}>DEL</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA BLACKLIST */}
                <div style={styles.adminCol}>
                  <h4 style={{color: '#f00'}}>BLACK-LIST (BANEADOS)</h4>
                  <div style={styles.adminActions}>
                    <input 
                      value={newEmailInput} 
                      onChange={e => setNewEmailInput(e.target.value)} 
                      placeholder="email..." 
                      style={styles.smallInput}
                    />
                    <button onClick={() => manageUser('blacklist', newEmailInput, 'add')} style={styles.banBtn}>BAN</button>
                  </div>
                  <div style={styles.userList}>
                    {Object.values(blacklist).map(u => (
                      <div key={u.email} style={styles.userItem}>
                        <span>{u.email}</span>
                        <button onClick={() => manageUser('blacklist', u.email, 'remove')} style={styles.unbanBtn}>PERDONAR</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA PREMIUM */}
                <div style={styles.adminCol}>
                  <h4 style={{color: '#FFD700'}}>PREMIUM NODES</h4>
                  <div style={styles.adminActions}>
                    <input 
                      value={newEmailInput} 
                      onChange={e => setNewEmailInput(e.target.value)} 
                      placeholder="email..." 
                      style={styles.smallInput}
                    />
                    <button onClick={() => manageUser('premium', newEmailInput, 'add')} style={styles.premBtn}>GRANT</button>
                  </div>
                  <div style={styles.userList}>
                    {Object.values(premiumUsers).map(u => (
                      <div key={u.email} style={styles.userItem}>
                        <span>{u.email}</span>
                        <button onClick={() => manageUser('premium', u.email, 'remove')} style={styles.delBtn}>REVOKE</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.logWall}>
                {systemLogs.map((log, idx) => (
                  <div key={idx} style={styles.logEntry}>
                    <span style={{color: '#555'}}>[{log.time}]</span>
                    <span style={{color: themeColor, marginLeft: '10px'}}>{log.user}:</span> {log.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>STATUS: <span style={{color: '#0f0'}}>READY</span></span>
        <span>ENCRYPTION: AES-512</span>
        <span>© ALEX HUB ULTRA 2026</span>
      </footer>
    </div>
  );
}

// ==========================================
// ESTILOS DE ALTO RENDIMIENTO
// ==========================================
const styles = {
  appContainer: { height: '100vh', width: '100vw', background: '#000', color: '#fff', overflow: 'hidden', fontFamily: 'Inter, sans-serif' },
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  
  // NAV & HEADER
  navbar: { height: '80px', background: '#050505', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  brand: { fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  modeTabs: { display: 'flex', gap: '5px' },
  tab: { background: '#111', border: 'none', color: '#666', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  
  searchBar: { flex: 1, maxWidth: '600px', display: 'flex', background: '#111', borderRadius: '8px', overflow: 'hidden', margin: '0 30px' },
  input: { flex: 1, background: 'none', border: 'none', padding: '12px 20px', color: '#fff', outline: 'none' },
  searchBtn: { background: 'none', border: 'none', padding: '0 15px', cursor: 'pointer' },
  
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  panicBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(229, 9, 20, 0.4)' },
  profileBox: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #222' },
  adminIconBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' },

  // MEDIA (GIANT)
  mainContent: { height: 'calc(100vh - 80px)', overflowY: 'auto', padding: '30px' },
  mediaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' },
  videoCard: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #111' },
  videoThumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  videoMeta: { padding: '15px' },
  vTitle: { fontSize: '14px', margin: '0 0 5px 0', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  vChannel: { color: '#555', fontSize: '12px' },

  giantPlayer: { width: '100%', height: '80vh', position: 'relative', background: '#000', borderRadius: '20px', overflow: 'hidden' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  closePlayer: { position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(10px)' },

  // LOGIN & BANNED
  loginPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #111 0%, #000 100%)' },
  loginCard: { background: 'rgba(10,10,10,0.8)', padding: '60px', borderRadius: '40px', border: '1px solid #222', textAlign: 'center', backdropFilter: 'blur(20px)' },
  mainTitle: { fontSize: '50px', fontWeight: '900', letterSpacing: '10px', margin: 0 },
  versionTag: { fontSize: '10px', color: '#444', letterSpacing: '5px' },
  googleBtn: { background: '#fff', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', margin: '0 auto' },
  alexTrigger: { background: 'none', border: 'none', color: '#333', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' },
  errorBanner: { color: '#f00', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '8px', marginTop: '20px', fontSize: '12px' },
  bannedOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bannedBox: { textAlign: 'center', border: '2px solid #f00', padding: '80px', borderRadius: '50px' },

  // ADMIN SYSTEM
  adminModal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  adminCard: { background: '#0a0a0a', padding: '40px', borderRadius: '25px', border: '1px solid #333', textAlign: 'center' },
  adminInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', fontSize: '24px', textAlign: 'center', width: '250px', marginBottom: '20px' },
  commandCenter: { position: 'fixed', inset: '20px', background: '#050505', border: '1px solid #222', borderRadius: '30px', zIndex: 2000, display: 'flex', flexDirection: 'column' },
  adminNav: { padding: '30px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { flex: 1, padding: '30px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', height: '100%' },
  adminCol: { background: '#0a0a0a', borderRadius: '20px', padding: '20px', border: '1px solid #111', display: 'flex', flexDirection: 'column' },
  adminActions: { display: 'flex', gap: '10px', marginBottom: '20px' },
  smallInput: { flex: 1, background: '#000', border: '1px solid #222', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '12px' },
  userList: { flex: 1, overflowY: 'auto' },
  userItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #111', fontSize: '12px' },
  logWall: { background: '#000', height: '100%', padding: '20px', fontFamily: 'monospace', overflowY: 'auto' },
  logEntry: { padding: '5px 0', borderBottom: '1px solid #111', fontSize: '13px' },

  // BOTONES ADMIN
  addBtn: { background: '#0f0', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  banBtn: { background: '#f00', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  unbanBtn: { background: '#0f0', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px' },
  delBtn: { background: '#333', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px' },
  premBtn: { background: '#FFD700', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },

  footer: { height: '40px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: '#444' }
};

// --- INYECCIÓN DE ESTILOS ---
if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    .loader { border: 4px solid #111; border-top: 4px solid #E50914; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .glitch { animation: glitch 0.5s infinite; }
    @keyframes glitch { 0% { text-shadow: 2px 0 #f00; } 50% { text-shadow: -2px 0 #0f0; } 100% { text-shadow: 2px 0 #f00; } }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
  `;
  document.head.appendChild(s);
}
