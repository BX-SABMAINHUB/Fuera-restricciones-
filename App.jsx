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
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (RECONSTRUCTED)
 * ============================================================================
 * @version: 13.0.9-FIXED
 * @build: 2026-STABLE
 * @author: Alex System
 * ============================================================================
 */

// --- CONFIGURACIÓN DE FIREBASE ---
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

// --- INICIALIZACIÓN DE SERVICIOS CRÍTICOS ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configuración de redundancia para Google Auth (Fix para "missing initial state")
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- CONSTANTES MAESTRAS ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-ULTRA-PRO";

export default function AlexHubUltraV13() {
  // ==========================================
  // ESTADOS DEL SISTEMA
  // ==========================================
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Estados de Datos Realtime
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);

  // Estados de Interfaz
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  
  // Admin UI
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');
  const [notifications, setNotifications] = useState([]);

  // ==========================================
  // UTILIDADES DE SEGURIDAD (FIX CLAVES FIREBASE)
  // ==========================================
  
  // Convierte correos como alex@gmail.eu en alex_at_gmail_dot_eu para Firebase
  const formatEmailToKey = (email) => {
    if (!email) return "";
    return email.toLowerCase()
      .replace(/\./g, '_dot_')
      .replace(/@/g, '_at_')
      .replace(/#/g, '_hash_')
      .replace(/\$/g, '_dollar_')
      .replace(/\[/g, '_open_')
      .replace(/\]/g, '_close_');
  };

  const addNotification = (text, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const logActivity = (msg) => {
    const logRef = push(ref(db, 'system_logs'));
    set(logRef, {
      msg,
      timestamp: serverTimestamp(),
      user: auth.currentUser?.email || 'Sistema',
      meta: navigator.userAgent
    });
  };

  // ==========================================
  // LÓGICA DE BOTÓN PÁNICO
  // ==========================================
  const executePanicProtocol = () => {
    addNotification("PROTOCOL PÁNICO ACTIVADO", "error");
    logActivity("ALERTA: Botón de Pánico presionado.");
    
    // Intenta abrir la aplicación ManageBac (Deep Link)
    window.location.href = "managebac://";
    
    // Fallback si la app no abre y cierre de pestaña
    setTimeout(() => {
        // Abre ManageBac web en pestaña nueva por seguridad
        window.open("https://managebac.com", "_blank");
        // Intenta cerrar la pestaña actual
        window.open('', '_self', '');
        window.close();
        // Redirigir la actual si el navegador bloquea window.close()
        window.location.href = "https://www.managebac.com";
    }, 300);
  };

  // ==========================================
  // NÚCLEO DE AUTENTICACIÓN (FIXED)
  // ==========================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Fix para "missing initial state": Forzar persistencia local
        await setPersistence(auth, browserLocalPersistence);
        
        onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            runSecurityCheck(currentUser.email);
          } else {
            setUser(null);
            setAccessGranted(false);
            setAuthLoading(false);
          }
        });
      } catch (err) {
        console.error("Auth Init Error", err);
      }
    };

    initAuth();

    // Sincronización Realtime
    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'system_logs'), (s) => {
      const data = s.val() || {};
      setSystemLogs(Object.values(data).reverse().slice(0, 100));
    });

    return () => { unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs(); };
  }, []);

  const runSecurityCheck = (email) => {
    const key = formatEmailToKey(email);
    
    // 1. Check Blacklist (BAN)
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        // 2. Check Whitelist
        onValue(ref(db, `whitelist/${key}`), (wSnap) => {
          if (wSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("USUARIO NO AUTORIZADO");
          }
        });
      }
      setAuthLoading(false);
    });
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      // Usar Popup con persistencia forzada
      await signInWithPopup(auth, googleProvider);
      addNotification("Sesión iniciada correctamente", "success");
    } catch (error) {
      console.error(error);
      setLoginError(`ERROR AUTH: ${error.code}`);
      addNotification("Error en Google Auth. Revisa la consola.", "error");
    }
  };

  // ==========================================
  // COMANDOS ADMINISTRATIVOS (ARREGLADOS)
  // ==========================================
  const manageUser = async (targetTable, email, action) => {
    if (!email || !email.includes('@')) {
      addNotification("Formato de email inválido", "error");
      return;
    }

    const key = formatEmailToKey(email);
    const dbRef = ref(db, `${targetTable}/${key}`);

    try {
      if (action === 'add') {
        await set(dbRef, {
          email: email,
          key: key,
          timestamp: serverTimestamp(),
          grantedBy: user?.email
        });
        addNotification(`${email} añadido a ${targetTable}`, "success");
        logActivity(`ADMIN: Añadió ${email} a ${targetTable}`);
      } else {
        await remove(dbRef);
        addNotification(`${email} removido de ${targetTable}`, "info");
        logActivity(`ADMIN: Eliminó ${email} de ${targetTable}`);
      }
      setNewEmailInput('');
    } catch (err) {
      addNotification("Error de Base de Datos", "error");
    }
  };

  // ==========================================
  // MOTOR MULTIMEDIA XL
  // ==========================================
  const runSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    
    try {
      if (mode === 'youtube') {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
      logActivity(`Búsqueda: [${mode}] ${query}`);
    } catch (err) {
      addNotification("Error conectando con API", "error");
    }
    setLoadingContent(false);
  };

  // ==========================================
  // COMPONENTES DE INTERFAZ
  // ==========================================
  
  if (authLoading) return (
    <div style={styles.loaderPage}>
      <div className="loader-ring"></div>
      <h1 className="shimmer">CARGANDO ALEX HUB ULTRA...</h1>
    </div>
  );

  return (
    <div style={styles.appFrame}>
      
      {/* Botón de Pánico Permanente */}
      <button 
        id="panic-button"
        onClick={executePanicProtocol}
        style={styles.panicButtonFixed}
      >
        PÁNICO
      </button>

      {/* Área de Notificaciones */}
      <div style={styles.notificationZone}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notifItem, borderRight: `5px solid ${n.type === 'error' ? '#ff0000' : '#00ff41'}`}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={styles.bannedOverlay}>
          <div style={styles.bannedCard}>
            <h1 style={styles.glitch}>SISTEMA BLOQUEADO</h1>
            <p>Tu acceso ha sido revocado permanentemente.</p>
            <button onClick={() => signOut(auth)} style={styles.btnDanger}>SALIR DEL SISTEMA</button>
          </div>
        </div>
      ) : !accessGranted ? (
        <div style={styles.loginGate}>
          <div style={styles.loginCard}>
            <h1 style={styles.logoText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
            <p style={styles.subtext}>ACCESO RESTRINGIDO - V13</p>
            
            {!user ? (
              <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" width="20" alt="" />
                ENTRAR CON GOOGLE
              </button>
            ) : (
              <div style={styles.statusBox}>
                <p>CORREO: {user.email}</p>
                <p style={{color: '#ff9800', fontWeight: 'bold'}}>ESTADO: PENDIENTE DE WHITELIST</p>
                <button onClick={() => signOut(auth)} style={styles.logoutLink}>USAR OTRA CUENTA</button>
              </div>
            )}
            
            {loginError && <div style={styles.errorBanner}>{loginError}</div>}
            
            <button onClick={() => setShowAlexLogin(true)} style={styles.adminKeyBtn}>SISTEMA ADMINISTRATIVO</button>
          </div>
        </div>
      ) : (
        /* SISTEMA OPERATIVO COMPLETO */
        <>
          <header style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.branding}>
                <span style={styles.brandMain}>ALEX HUB</span>
                <span style={styles.brandVer}>ULTRA V13.0.9</span>
              </div>
              <div style={styles.modeTabs}>
                {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => {setMode(m); setSelectedVideo(null)}} 
                    style={mode === m ? styles.tabActive : styles.tab}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={runSearch} style={styles.searchBox}>
              <input 
                style={styles.mainInput} 
                placeholder={`Buscar contenido en ${mode.toUpperCase()}...`} 
                value={query} 
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" style={styles.searchBtn}>BUSCAR</button>
            </form>

            <div style={styles.headerRight}>
              {premiumUsers[formatEmailToKey(user.email)] && <span className="badge-premium">💎 PREMIUM</span>}
              <div style={styles.userProfile}>
                <img src={user.photoURL} style={styles.avatar} alt="p" />
                <button onClick={() => signOut(auth)} style={styles.exitBtn}>SALIR</button>
              </div>
              <button onClick={() => setIsAdminOpen(true)} style={styles.adminPanelBtn}>ADMIN</button>
            </div>
          </header>

          <main style={styles.contentContainer}>
            {loadingContent && <div style={styles.loadingSpinner}>Cargando...</div>}
            
            {mode === 'youtube' && !selectedVideo && (
              <div style={styles.videoGridXL}>
                {videos.map((vid, idx) => (
                  <div key={idx} style={styles.vidCard} onClick={() => setSelectedVideo(vid.id.videoId)}>
                    <div style={styles.vidThumbWrap}>
                      <img src={vid.snippet.thumbnails.high.url} style={styles.vidImg} alt="t" />
                      <div style={styles.playHover}>REPRODUCIR</div>
                    </div>
                    <div style={styles.vidMeta}>
                      <h3 style={styles.vidTitle}>{vid.snippet.title}</h3>
                      <p style={styles.vidChan}>{vid.snippet.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(selectedVideo || mode !== 'youtube') && (
              <div style={styles.fullscreenPlayer}>
                <iframe 
                  src={selectedVideo ? `https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0` : 
                       mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` : ""}
                  style={styles.massiveIframe}
                  allowFullScreen
                />
                {selectedVideo && (
                  <button onClick={() => setSelectedVideo(null)} style={styles.closePlayerBtn}>
                    CERRAR REPRODUCTOR X
                  </button>
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* MODAL CONTROL CENTER (ADMIN) */}
      {isAdminOpen && (
        <div style={styles.adminOverlay}>
          <div style={styles.adminWindow}>
            <div style={styles.adminHeader}>
              <h2>ALEX COMMAND CENTER v13</h2>
              <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdminX}>X</button>
            </div>
            
            <div style={styles.adminBody}>
              <div style={styles.adminNav}>
                <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.aNavActive : styles.aNav}>USUARIOS</button>
                <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.aNavActive : styles.aNav}>AUDITORÍA</button>
              </div>

              <div style={styles.adminContentArea}>
                {adminTab === 'users' ? (
                  <div style={styles.userManagementGrid}>
                    {/* Whitelist Section */}
                    <div style={styles.mgmtCard}>
                      <h4 style={{color: '#00ff41'}}>WHITELIST (ACCESO)</h4>
                      <div style={styles.actionRow}>
                        <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@gmail..." style={styles.adminInp} />
                        <button onClick={() => manageUser('whitelist', newEmailInput, 'add')} style={styles.btnAdd}>+</button>
                      </div>
                      <div style={styles.scrollList}>
                        {Object.values(whitelist).map(u => (
                          <div key={u.key} style={styles.listItem}>
                            <span>{u.email}</span>
                            <button onClick={() => manageUser('whitelist', u.email, 'remove')} style={styles.btnDel}>ELIMINAR</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Blacklist Section */}
                    <div style={styles.mgmtCard}>
                      <h4 style={{color: '#ff0000'}}>BLACKLIST (BAN)</h4>
                      <div style={styles.actionRow}>
                        <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@gmail..." style={styles.adminInp} />
                        <button onClick={() => manageUser('blacklist', newEmailInput, 'add')} style={styles.btnBan}>BANEAR</button>
                      </div>
                      <div style={styles.scrollList}>
                        {Object.values(blacklist).map(u => (
                          <div key={u.key} style={styles.listItem}>
                            <span>{u.email}</span>
                            <button onClick={() => manageUser('blacklist', u.email, 'remove')} style={styles.btnSafe}>PERDONAR</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.logViewer}>
                    {systemLogs.map((log, i) => (
                      <div key={i} style={styles.logRow}>
                        <span style={{color: '#555'}}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span style={{color: '#E50914', fontWeight: 'bold'}}> {log.user}: </span>
                        <span>{log.msg}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASSWORD ADMIN */}
      {showAlexLogin && (
        <div style={styles.passOverlay}>
          <div style={styles.passCard}>
            <h3>PASSCODE REQUERIDO</h3>
            <input 
              type="password" 
              value={alexPassInput} 
              onChange={e=>setAlexPassInput(e.target.value)} 
              style={styles.passInput}
              autoFocus
            />
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={() => {
                if(alexPassInput === ADMIN_PASS) {
                   setIsAdminOpen(true);
                   setShowAlexLogin(false);
                   setAlexPassInput('');
                   addNotification("ACCESO NIVEL 1", "success");
                } else {
                   addNotification("PASS INCORRECTA", "error");
                }
              }} style={styles.btnOk}>ACCEDER</button>
              <button onClick={() => setShowAlexLogin(false)} style={styles.btnCancel}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// ARQUITECTURA DE ESTILOS (SISTEMA DE DISEÑO)
// ==========================================
const styles = {
  appFrame: { height: '100vh', width: '100vw', background: '#000', color: '#fff', fontFamily: '"Inter", sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  
  // Loader
  loaderPage: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  
  // Panic Button
  panicButtonFixed: { position: 'fixed', bottom: '30px', right: '30px', background: '#ff0000', color: '#fff', border: 'none', padding: '20px 40px', borderRadius: '50px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', zIndex: 99999, boxShadow: '0 0 30px rgba(255,0,0,0.6)', transition: '0.2s active' },
  
  // Login
  loginGate: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #1a1a1a 0%, #000 100%)' },
  loginCard: { background: 'rgba(10,10,10,0.8)', padding: '60px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', width: '450px', backdropFilter: 'blur(10px)' },
  logoText: { fontSize: '42px', fontWeight: '900', letterSpacing: '2px', marginBottom: '10px' },
  googleBtn: { background: '#fff', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: '30px auto', cursor: 'pointer' },
  adminKeyBtn: { background: 'none', border: 'none', color: '#444', fontSize: '12px', cursor: 'pointer', marginTop: '20px' },
  
  // Header
  header: { height: '80px', background: '#050505', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' },
  branding: { display: 'flex', flexDirection: 'column' },
  brandMain: { fontSize: '22px', fontWeight: '900' },
  brandVer: { fontSize: '9px', color: '#E50914', fontWeight: 'bold' },
  modeTabs: { display: 'flex', gap: '10px', marginLeft: '40px' },
  tab: { background: '#111', border: 'none', color: '#666', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  tabActive: { background: '#E50914', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  
  searchBox: { flex: 1, maxWidth: '600px', margin: '0 40px', display: 'flex', gap: '10px' },
  mainInput: { flex: 1, background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '12px 20px', color: '#fff', outline: 'none' },
  searchBtn: { background: '#fff', color: '#000', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  
  headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', background: '#111', padding: '6px 15px', borderRadius: '50px' },
  avatar: { width: '30px', height: '30px', borderRadius: '50%' },
  exitBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px' },
  adminPanelBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  
  // Content
  contentContainer: { flex: 1, overflowY: 'auto', padding: '40px', position: 'relative' },
  videoGridXL: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' },
  vidCard: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #111', transition: '0.3s' },
  vidThumbWrap: { position: 'relative', aspectRatio: '16/9' },
  vidImg: { width: '100%', height: '100%', objectFit: 'cover' },
  playHover: { position: 'absolute', inset: 0, background: 'rgba(229, 9, 20, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', fontWeight: 'bold' },
  vidMeta: { padding: '20px' },
  vidTitle: { fontSize: '15px', margin: '0 0 10px 0', height: '40px', overflow: 'hidden' },
  vidChan: { fontSize: '12px', color: '#555' },
  
  fullscreenPlayer: { width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', position: 'relative', background: '#000' },
  massiveIframe: { width: '100%', height: '100%', border: 'none' },
  closePlayerBtn: { position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.8)', color: '#fff', border: 'none', padding: '15px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  
  // Admin Window
  adminOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIindex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  adminWindow: { width: '100%', maxWidth: '1200px', height: '100%', background: '#050505', border: '1px solid #222', borderRadius: '25px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminHeader: { padding: '30px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' },
  adminBody: { flex: 1, display: 'flex' },
  adminNav: { width: '200px', borderRight: '1px solid #111', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  aNav: { background: 'none', border: 'none', color: '#444', textAlign: 'left', padding: '15px', cursor: 'pointer', fontWeight: 'bold' },
  aNavActive: { background: '#111', border: 'none', color: '#E50914', textAlign: 'left', padding: '15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  adminContentArea: { flex: 1, padding: '40px', overflowY: 'auto' },
  userManagementGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  mgmtCard: { background: '#0a0a0a', padding: '25px', borderRadius: '20px', border: '1px solid #111' },
  actionRow: { display: 'flex', gap: '10px', margin: '20px 0' },
  adminInp: { flex: 1, background: '#000', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '8px' },
  scrollList: { height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  listItem: { background: '#050505', padding: '12px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' },
  
  // Buttons
  btnAdd: { background: '#00ff41', border: 'none', color: '#000', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold' },
  btnBan: { background: '#ff0000', border: 'none', color: '#fff', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold' },
  btnDel: { background: '#1a1a1a', border: 'none', color: '#ff4444', padding: '5px 12px', borderRadius: '5px', fontSize: '11px' },
  btnSafe: { background: '#00ff41', border: 'none', color: '#000', padding: '5px 12px', borderRadius: '5px', fontSize: '11px' },
  
  // Logs
  logViewer: { background: '#000', borderRadius: '15px', padding: '20px', fontFamily: 'monospace', fontSize: '12px' },
  logRow: { padding: '8px 0', borderBottom: '1px solid #0a0a0a' },

  // Notification
  notificationZone: { position: 'fixed', top: '30px', right: '30px', zIndex: 100000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notifItem: { background: '#111', color: '#fff', padding: '20px 30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontWeight: 'bold' }
};

// Inyectar animaciones globales
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
    .shimmer { animation: shimmer 2s infinite; }
    .loader-ring { width: 50px; height: 50px; border: 4px solid #111; border-top: 4px solid #E50914; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .vidCard:hover { transform: scale(1.02); border-color: #E50914; }
    .vidCard:hover .playHover { opacity: 1; }
    .badge-premium { background: linear-gradient(45deg, #FFD700, #FFA500); color: #000; padding: 4px 10px; borderRadius: 20px; font-size: 10px; font-weight: 900; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
  `;
  document.head.appendChild(styleSheet);
}
