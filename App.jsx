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
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (2026 REBUILD)
 * ============================================================================
 * @version: 13.0.8-SUPER-STABLE
 * @author: Alex Admin
 * @status: ARREGLADO - TODOS LOS SISTEMAS OPERATIVOS
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
  appId: "1:463204402982:web:fe740a662fbfd50452a3e7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
// Configuración para evitar errores de estado perdido
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- CONSTANTES DE PODER ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4"; 
const ADMIN_PASS = "Alex2706";
const MANAGEBAC_URL = "managebac://"; // Protocolo para abrir la APP directamente

export default function AlexHubUltraV13() {
  // --- ESTADOS CRÍTICOS ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // --- DATOS REALTIME ---
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

  // --- ADMIN PANEL ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');
  const [notifications, setNotifications] = useState([]);

  const themeColor = '#E50914';

  // ==========================================
  // 1. GESTIÓN DE SEGURIDAD Y AUTENTICACIÓN
  // ==========================================

  useEffect(() => {
    // Persistencia local para evitar errores de sesión
    setPersistence(auth, browserLocalPersistence);

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkPermissions(currentUser.email);
      } else {
        setUser(null);
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Suscripciones Realtime masivas
    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const data = s.val() || {};
      setSystemLogs(Object.values(data).reverse().slice(0, 50));
    });

    return () => {
      unsubscribeAuth(); unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs();
    };
  }, []);

  const checkPermissions = async (email) => {
    // Sanitización de email para Firebase (soporta .com, .eu, etc)
    const emailKey = email.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_');
    
    // Verificación de Ban
    const banRef = ref(db, `blacklist/${emailKey}`);
    const banSnap = await get(banRef);
    
    if (banSnap.exists()) {
      setIsBanned(true);
      setAccessGranted(false);
    } else {
      setIsBanned(false);
      // Verificación de acceso
      const whiteRef = ref(db, `whitelist/${emailKey}`);
      const whiteSnap = await get(whiteRef);
      if (whiteSnap.exists() || email === "alex.admin@pro.com") {
        setAccessGranted(true);
      } else {
        setAccessGranted(false);
        setLoginError("SISTEMA: No tienes permiso de entrada.");
      }
    }
    setAuthLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginError(null);
      await signInWithPopup(auth, googleProvider);
      addNotification("Conexión segura establecida", "success");
    } catch (error) {
      console.error(error);
      setLoginError("ERROR DE SESIÓN: Reintenta o usa una ventana normal.");
    }
  };

  // ==========================================
  // 2. COMANDOS DE ADMINISTRACIÓN (CORREGIDOS)
  // ==========================================

  const manageSystemUser = async (table, targetEmail, action) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      return addNotification("E-mail inválido", "error");
    }

    const emailKey = targetEmail.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_');
    const targetRef = ref(db, `${table}/${emailKey}`);

    try {
      if (action === 'add') {
        await set(targetRef, {
          email: targetEmail,
          date: new Date().toISOString(),
          admin: user?.email
        });
        addNotification(`${targetEmail} agregado correctamente`, "success");
      } else {
        await remove(targetRef);
        addNotification(`${targetEmail} eliminado/perdonado`, "info");
      }
      setNewEmailInput('');
      logActivity(`ADMIN: ${action} en ${table} para ${targetEmail}`);
    } catch (e) {
      addNotification("Error en Base de Datos", "error");
    }
  };

  const logActivity = (msg) => {
    push(ref(db, 'logs'), {
      msg,
      timestamp: serverTimestamp(),
      user: user?.email || 'Sistema'
    });
  };

  // ==========================================
  // 3. FUNCIONES ESPECIALES (BOTÓN PÁNICO)
  // ==========================================

  const activatePanicButton = () => {
    // 1. Intenta abrir la App de ManageBac
    window.location.href = MANAGEBAC_URL;
    
    // 2. Pequeño delay para asegurar que el SO reciba la orden
    setTimeout(() => {
      // 3. Elimina el rastro cerrando la pestaña (funciona si fue abierta por script o tras interacción)
      window.open("about:blank", "_self");
      window.close();
    }, 300);
  };

  const startGlobalSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
    } catch (err) {
      addNotification("Error en API YouTube", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(p => [...p, { id, text, type }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // 4. RENDERIZADO DE INTERFAZ GIGANTE
  // ==========================================

  if (authLoading) return (
    <div style={styles.fullCenter}>
      <div className="loader"></div>
      <h1 style={{color: themeColor, letterSpacing: '10px'}}>ALEX HUB</h1>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      
      {/* BOTÓN DE PÁNICO FLOTANTE (ESTRATÉGICO) */}
      <button onClick={activatePanicButton} style={styles.panicButton}>PÁNICO</button>

      {/* NOTIFICACIONES */}
      <div style={styles.notifContainer}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notif, borderLeftColor: n.type === 'error' ? '#f00' : '#0f0'}}>
            {n.text}
          </div>
        ))}
      </div>

      {/* LOGIN DE ADMIN */}
      {showAlexLogin && (
        <div style={styles.modalOverlay}>
          <div style={styles.miniCard}>
             <h2>ADMIN ACCESS</h2>
             <input 
               type="password" 
               placeholder="ACCESS KEY" 
               value={alexPassInput} 
               onChange={e => setAlexPassInput(e.target.value)} 
               style={styles.adminInput}
             />
             <div style={{display:'flex', gap:'10px'}}>
                <button onClick={() => {
                  if (alexPassInput === ADMIN_PASS) { setIsAdminOpen(true); setShowAlexLogin(false); }
                  else addNotification("CLAVE ERRÓNEA", "error");
                }} style={styles.confirmBtn}>CONECTAR</button>
                <button onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>CANCELAR</button>
             </div>
          </div>
        </div>
      )}

      {/* COMMAND CENTER (ADMIN FRAME) */}
      {isAdminOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <h1>ALEX HUB | COMMAND CENTER v13</h1>
            <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>CERRAR SISTEMA</button>
          </div>
          <div style={styles.adminBody}>
            <div style={styles.adminGrid}>
              {/* WHITELIST */}
              <div style={styles.adminSection}>
                <h3>✅ WHITELIST (ACCESO)</h3>
                <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@gmail.com/eu" style={styles.adminInputText}/>
                <button onClick={() => manageSystemUser('whitelist', newEmailInput, 'add')} style={styles.addBtn}>AUTORIZAR</button>
                <div style={styles.scrollList}>
                  {Object.values(whitelist).map(u => (
                    <div key={u.email} style={styles.listItem}>
                      {u.email} <button onClick={() => manageSystemUser('whitelist', u.email, 'remove')}>X</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* BLACKLIST */}
              <div style={styles.adminSection}>
                <h3 style={{color: '#f00'}}>🚫 BAN SYSTEM</h3>
                <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email a banear" style={styles.adminInputText}/>
                <button onClick={() => manageSystemUser('blacklist', newEmailInput, 'add')} style={styles.banBtnAction}>EJECUTAR BAN</button>
                <div style={styles.scrollList}>
                  {Object.values(blacklist).map(u => (
                    <div key={u.email} style={styles.listItem}>
                      {u.email} <button onClick={() => manageSystemUser('blacklist', u.email, 'remove')}>PERDONAR</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* LOGS */}
              <div style={styles.adminSection}>
                <h3>📋 SYSTEM LOGS</h3>
                <div style={styles.logContainer}>
                  {systemLogs.map((l, i) => (
                    <div key={i} style={{fontSize:'9px', borderBottom:'1px solid #111'}}>{l.user}: {l.msg}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA PRINCIPAL */}
      {isBanned ? (
        <div style={styles.bannedScreen}>
          <h1 className="glitch">SISTEMA BLOQUEADO</h1>
          <p>Tu cuenta ha sido expulsada por la administración.</p>
        </div>
      ) : (!user || !accessGranted) ? (
        <div style={styles.loginPage}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
          {user ? (
            <div style={{textAlign:'center'}}>
              <p>Esperando aprobación para: {user.email}</p>
              <button onClick={() => signOut(auth)} style={styles.logoutMini}>Cerrar Sesión</button>
            </div>
          ) : (
            <button onClick={handleGoogleLogin} style={styles.googleBtn}>ENTRAR CON GOOGLE</button>
          )}
          <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtn}>ADMIN LOGIN</button>
          {loginError && <p style={{color:'red'}}>{loginError}</p>}
        </div>
      ) : (
        <>
          <nav style={styles.navbar}>
            <div style={styles.logoBox}>
              <span style={styles.logoMain}>ALEX</span>
              <span style={{color: themeColor, fontWeight:'bold'}}>ULTRA V13</span>
            </div>
            <div style={styles.tabContainer}>
              {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={mode === m ? {...styles.activeTab, background: themeColor} : styles.tab}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            <form onSubmit={startGlobalSearch} style={styles.searchForm}>
              <input style={styles.searchInput} placeholder="Buscar contenido..." value={query} onChange={e=>setQuery(e.target.value)} />
            </form>
            <div style={styles.navRight}>
              <img src={user.photoURL} style={styles.userPic} />
              <button onClick={() => signOut(auth)} style={styles.logoutMini}>SALIR</button>
              <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtnMini}>ALEX</button>
            </div>
          </nav>

          <main style={styles.contentArea}>
            {mode === 'youtube' ? (
              selectedVideo ? (
                <div style={styles.playerWrap}>
                  <iframe src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
                  <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>VOLVER</button>
                </div>
              ) : (
                <div style={styles.grid}>
                  {videos.map((v, i) => (
                    <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                      <img src={v.snippet.thumbnails.high.url} style={styles.thumb} />
                      <div style={styles.cardInfo}>
                        <p>{v.snippet.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div style={styles.fullFrame}>
                <iframe 
                  src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                       "https://www.xbox.com/play"} 
                  style={styles.iframe} 
                  allowFullScreen
                />
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

const styles = {
  appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', overflow: 'hidden', fontFamily: 'sans-serif' },
  panicButton: { position: 'fixed', bottom: '20px', right: '20px', padding: '15px 25px', background: '#f00', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: '900', zIndex: 9999, cursor: 'pointer', boxShadow: '0 0 20px #f00' },
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loginPage: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' },
  glitchText: { fontSize: '60px', fontWeight: '900', letterSpacing: '10px' },
  googleBtn: { padding: '15px 40px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  alexBtn: { background: 'none', border: '1px solid #333', color: '#555', padding: '10px 20px', cursor: 'pointer', marginTop: '50px' },
  navbar: { height: '80px', display: 'flex', alignItems: 'center', padding: '0 30px', borderBottom: '1px solid #111', background: '#050505', justifyContent: 'space-between' },
  logoBox: { display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '24px', fontWeight: '900' },
  tabContainer: { display: 'flex', gap: '10px' },
  tab: { background: '#111', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
  activeTab: { color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold' },
  searchForm: { flex: 1, margin: '0 50px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff' },
  navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  userPic: { width: '40px', height: '40px', borderRadius: '50%' },
  logoutMini: { background: 'none', color: '#555', border: 'none', cursor: 'pointer', fontSize: '10px' },
  alexBtnMini: { background: '#E50914', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  contentArea: { flex: 1, overflowY: 'auto', padding: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { background: '#0a0a0a', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px', fontSize: '14px' },
  playerWrap: { width: '100%', height: '85vh', position: 'relative' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  closeVideoBtn: { position: 'absolute', top: '-50px', right: '0', background: '#f00', color: '#fff', border: 'none', padding: '10px' },
  fullFrame: { width: '100%', height: '100%' },
  adminFrame: { position: 'fixed', inset: '20px', background: '#050505', border: '2px solid #333', zIndex: 10000, borderRadius: '20px', display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' },
  adminBody: { flex: 1, padding: '20px' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', height: '100%' },
  adminSection: { background: '#0a0a0a', padding: '20px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
  adminInputText: { background: '#000', border: '1px solid #333', padding: '10px', color: '#fff' },
  addBtn: { background: '#0f0', color: '#000', fontWeight: 'bold', padding: '10px' },
  banBtnAction: { background: '#f00', color: '#fff', fontWeight: 'bold', padding: '10px' },
  scrollList: { flex: 1, overflowY: 'auto', marginTop: '10px' },
  listItem: { padding: '8px', background: '#111', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' },
  logContainer: { background: '#000', height: '100%', overflowY: 'auto', fontFamily: 'monospace', padding: '10px' },
  notifContainer: { position: 'fixed', top: '20px', right: '20px', zIndex: 11000 },
  notif: { background: '#111', color: '#fff', padding: '15px 25px', borderRadius: '5px', marginBottom: '10px', borderLeft: '5px solid' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 },
  miniCard: { background: '#111', padding: '40px', borderRadius: '20px', textAlign: 'center' },
  adminInput: { width: '100%', padding: '15px', background: '#000', color: '#fff', fontSize: '24px', textAlign: 'center', marginBottom: '20px' },
  confirmBtn: { background: '#E50914', color: '#fff', padding: '10px 30px', border: 'none', cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#555', border: 'none', cursor: 'pointer' },
  bannedScreen: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f00' }
};
