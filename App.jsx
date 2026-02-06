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
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (CORE REBUILT)
 * ============================================================================
 * @version: 13.0.9-FINAL-ULTRA
 * @status: ALL SYSTEMS OPERATIONAL
 * @fix: Google Auth Initial State Error Resolved
 * @fix: Database Email Key Validation (.eu, .com, .org)
 * ============================================================================
 */

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-CORRECTED";

// ==========================================
// UTILIDADES DE SISTEMA
// ==========================================
const sanitizeKey = (email) => {
  if (!email) return "";
  return email.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_');
};

export default function AlexHubUltraV13() {
  // --- ESTADOS DE SEGURIDAD ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loginError, setLoginError] = useState(null);

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
  // NÚCLEO DE AUTENTICACIÓN Y SEGURIDAD
  // ==========================================

  useEffect(() => {
    // FIX: Forzar persistencia para evitar pérdida de estado inicial
    setPersistence(auth, browserLocalPersistence);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        verifySecurity(currentUser.email);
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
      const logs = s.val() ? Object.values(s.val()).reverse().slice(0, 50) : [];
      setSystemLogs(logs);
    });

    return () => {
      unsubscribeAuth(); unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs();
    };
  }, []);

  const verifySecurity = useCallback((email) => {
    const key = sanitizeKey(email);
    
    // Verificación en cascada
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
        setAuthLoading(false);
      } else {
        setIsBanned(false);
        onValue(ref(db, `whitelist/${key}`), (wSnap) => {
          if (wSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
            logActivity(`Acceso concedido a: ${email}`);
          } else {
            setAccessGranted(false);
            setLoginError("No estás en la Whitelist oficial.");
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
    } catch (error) {
      setLoginError(`Error: ${error.code}. Intenta abrir en una pestaña normal (No Incógnito).`);
    }
  };

  const panicAction = () => {
    // Intenta abrir la APP ManageBac
    window.location.href = "managebac://";
    // Fallback por si no tiene la app instalada
    setTimeout(() => {
      window.open("https://managebac.com", "_blank");
      window.close(); // Intento de cerrar pestaña
      window.location.href = "about:blank"; // Limpieza inmediata
    }, 200);
  };

  // ==========================================
  // COMANDOS ADMINISTRATIVOS (ALEX)
  // ==========================================

  const modifyUser = async (table, targetEmail, action) => {
    if (!targetEmail.includes('@')) {
      return addNotification("E-mail inválido", "error");
    }
    const key = sanitizeKey(targetEmail);
    const targetRef = ref(db, `${table}/${key}`);

    try {
      if (action === 'add') {
        await set(targetRef, {
          email: targetEmail,
          addedBy: user?.email,
          timestamp: serverTimestamp()
        });
        addNotification(`Añadido a ${table}: ${targetEmail}`, "success");
      } else {
        await remove(targetRef);
        addNotification(`Eliminado de ${table}: ${targetEmail}`, "info");
      }
      setNewEmailInput('');
      logActivity(`COMANDO: ${action} en ${table} para ${targetEmail}`);
    } catch (e) {
      addNotification("Error en BD: Revisa permisos", "error");
    }
  };

  const logActivity = (msg) => {
    push(ref(db, 'logs'), {
      msg,
      user: auth.currentUser?.email || 'Guest',
      time: new Date().toISOString()
    });
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // MOTOR MULTIMEDIA
  // ==========================================

  const searchYoutube = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await response.json();
      setVideos(data.items || []);
      setSelectedVideo(null);
    } catch (error) {
      addNotification("Error en API de YouTube", "error");
    }
    setLoadingContent(false);
  };

  // ==========================================
  // INTERFAZ DE USUARIO (JSX)
  // ==========================================

  if (authLoading) return (
    <div style={styles.loadingFull}>
      <div className="system-loader"></div>
      <h1 style={{color: '#ff0000', letterSpacing: '10px'}}>BOOTING ALEX HUB</h1>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      {/* BOTÓN PÁNICO - SIEMPRE VISIBLE SI HAY LOGIN */}
      {accessGranted && (
        <button onClick={panicAction} style={styles.panicBtn}>PÁNICO</button>
      )}

      {/* NOTIFICACIONES */}
      <div style={styles.notifStack}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notifBox, borderLeft: `5px solid ${n.type === 'error' ? '#ff0000' : '#00ff00'}`}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={styles.banScreen}>
          <h1 className="glitch-text" style={{fontSize: '70px'}}>SISTEMA BLOQUEADO</h1>
          <p style={{color: '#666'}}>Tu correo {user?.email} ha sido baneado permanentemente.</p>
          <button onClick={() => signOut(auth)} style={styles.exitBtn}>SOLICITAR ACCESO</button>
        </div>
      ) : !accessGranted ? (
        <div style={styles.loginPage}>
          <div style={styles.loginCard}>
            <h1 style={styles.mainTitle}>ALEX HUB <span style={{color: '#ff0000'}}>ULTRA</span></h1>
            <p style={styles.subTitle}>SISTEMA DE GESTIÓN V13.0.9</p>
            
            <div style={{margin: '50px 0'}}>
               <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" style={{width:'20px'}} />
                  CONECTAR CON GOOGLE
               </button>
            </div>

            {loginError && <div style={styles.errorBanner}>{loginError}</div>}
            
            <button onClick={() => setShowAlexLogin(true)} style={styles.alexAdminBtn}>LOGIN DE ADMINISTRADOR</button>
          </div>
        </div>
      ) : (
        /* VISTA PRINCIPAL DEL HUB */
        <>
          <nav style={styles.navBar}>
            <div style={styles.navBrand}>
              <span style={{fontWeight: 900, color: '#ff0000'}}>ALEX</span> HUB
              <div style={styles.tabBar}>
                {['youtube', 'twitch', 'movies', 'xbox'].map(t => (
                  <button 
                    key={t} 
                    onClick={() => setMode(t)} 
                    style={mode === t ? styles.tabActive : styles.tab}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={searchYoutube} style={styles.searchBox}>
              <input 
                style={styles.searchInp} 
                placeholder={`Buscar en ${mode}...`}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </form>

            <div style={styles.navRight}>
              <div style={styles.userBadge}>
                <img src={user.photoURL} style={styles.userImg} />
                <span style={{fontSize: '12px'}}>{user.displayName}</span>
              </div>
              <button onClick={() => setIsAdminOpen(true)} style={styles.adminKeyBtn}>A</button>
            </div>
          </nav>

          <main style={styles.mainContent}>
            {loadingContent && <div style={styles.loaderSmall}>Cargando...</div>}

            {mode === 'youtube' && !selectedVideo && (
              <div style={styles.mediaGrid}>
                {videos.map((v, i) => (
                  <div key={i} style={styles.mediaCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                    <img src={v.snippet.thumbnails.high.url} style={styles.cardImg} />
                    <div style={styles.cardData}>
                      <h4 style={styles.cardTitle}>{v.snippet.title}</h4>
                      <p style={styles.cardSub}>{v.snippet.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(selectedVideo || mode !== 'youtube') && (
              <div style={styles.theaterMode}>
                <iframe 
                  src={selectedVideo ? `https://www.youtube.com/embed/${selectedVideo}?autoplay=1` : 
                       mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` : ""}
                  style={styles.bigIframe}
                  allowFullScreen
                />
                {selectedVideo && <button onClick={() => setSelectedVideo(null)} style={styles.closePlayer}>VOLVER AL HUB</button>}
              </div>
            )}
          </main>
        </>
      )}

      {/* PANEL DE CONTROL CENTRAL (ALEX) */}
      {isAdminOpen && (
        <div style={styles.adminOverlay}>
          <div style={styles.adminPanel}>
            <div style={styles.adminNav}>
              <h2>COMMAND CENTER V13</h2>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={() => setAdminTab('users')} style={styles.adminTabBtn}>GESTIÓN</button>
                <button onClick={() => setAdminTab('logs')} style={styles.adminTabBtn}>LOGS</button>
                <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>X</button>
              </div>
            </div>

            <div style={styles.adminBody}>
              {adminTab === 'users' ? (
                <div style={styles.managementGrid}>
                  <div style={styles.manageBox}>
                    <h3 style={{color: '#00ff00'}}>WHITELIST (CORREO .EU/.COM)</h3>
                    <div style={styles.inpRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} style={styles.adminInp} placeholder="correo@gmail.eu" />
                      <button onClick={() => modifyUser('whitelist', newEmailInput, 'add')} style={styles.addBtn}>AUTORIZAR</button>
                    </div>
                    <div style={styles.scrollList}>
                      {Object.values(whitelist).map(u => (
                        <div key={u.email} style={styles.listItem}>
                          <span>{u.email}</span>
                          <button onClick={() => modifyUser('whitelist', u.email, 'remove')} style={styles.delBtn}>REMOVER</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.manageBox}>
                    <h3 style={{color: '#ff0000'}}>SISTEMA DE BANEO (BLACKLIST)</h3>
                    <div style={styles.inpRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} style={styles.adminInp} placeholder="correo@gmail.eu" />
                      <button onClick={() => modifyUser('blacklist', newEmailInput, 'add')} style={styles.banBtn}>BANEAR</button>
                    </div>
                    <div style={styles.scrollList}>
                      {Object.values(blacklist).map(u => (
                        <div key={u.email} style={styles.listItem}>
                          <span>{u.email}</span>
                          <button onClick={() => modifyUser('blacklist', u.email, 'remove')} style={styles.unbanBtn}>PERDONAR</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.logsArea}>
                  {systemLogs.map((l, i) => (
                    <div key={i} style={styles.logLine}>
                      <span style={{color: '#444'}}>[{l.time}]</span> <b>{l.user}:</b> {l.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTRASEÑA ALEX */}
      {showAlexLogin && (
        <div style={styles.alexLoginOverlay}>
          <div style={styles.alexLoginCard}>
            <h3>PASSCODE REQUERIDO</h3>
            <input 
              type="password" 
              value={alexPassInput} 
              onChange={e=>setAlexPassInput(e.target.value)} 
              style={styles.adminPassInp}
              autoFocus
            />
            <button onClick={() => {
              if (alexPassInput === ADMIN_PASS) { setIsAdminOpen(true); setShowAlexLogin(false); setAlexPassInput(''); }
              else { addNotification("ACCESO DENEGADO", "error"); }
            }} style={styles.confirmBtn}>DESBLOQUEAR</button>
            <button onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>CANCELAR</button>
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
  appWrap: { height: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden', position: 'relative' },
  loadingFull: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  
  // PANIC
  panicBtn: { position: 'fixed', bottom: '30px', left: '30px', background: '#ff0000', color: '#fff', border: 'none', padding: '20px 40px', borderRadius: '15px', fontWeight: '900', zIndex: 99999, cursor: 'pointer', boxShadow: '0 0 30px rgba(255,0,0,0.5)', transition: '0.2s active' },

  // LOGIN
  loginPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #1a1a1a 0%, #000 100%)' },
  loginCard: { textAlign: 'center', padding: '80px', background: 'rgba(10,10,10,0.9)', borderRadius: '50px', border: '1px solid #222', backdropFilter: 'blur(20px)' },
  mainTitle: { fontSize: '60px', fontWeight: 900, letterSpacing: '8px', margin: 0 },
  subTitle: { fontSize: '12px', color: '#555', letterSpacing: '5px', marginTop: '10px' },
  googleBtn: { background: '#fff', color: '#000', border: 'none', padding: '18px 40px', borderRadius: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', margin: '0 auto' },
  alexAdminBtn: { background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },

  // NAV
  navBar: { height: '80px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between', background: '#050505' },
  navBrand: { display: 'flex', alignItems: 'center', gap: '40px', fontSize: '22px' },
  tabBar: { display: 'flex', gap: '10px' },
  tab: { background: '#111', border: 'none', color: '#555', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  tabActive: { background: '#ff0000', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  searchBox: { flex: 1, maxWidth: '500px', margin: '0 40px' },
  searchInp: { width: '100%', background: '#000', border: '1px solid #222', padding: '15px 25px', borderRadius: '15px', color: '#fff' },
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '10px', background: '#111', padding: '8px 15px', borderRadius: '12px' },
  userImg: { width: '30px', height: '30px', borderRadius: '50%' },
  adminKeyBtn: { background: '#ff0000', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  // MAIN
  mainContent: { height: 'calc(100vh - 80px)', overflowY: 'auto', padding: '40px' },
  mediaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' },
  mediaCard: { background: '#0a0a0a', borderRadius: '20px', overflow: 'hidden', border: '1px solid #111', cursor: 'pointer', transition: '0.3s' },
  cardImg: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardData: { padding: '20px' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '16px', height: '40px', overflow: 'hidden' },
  cardSub: { color: '#444', fontSize: '12px' },

  // THEATER
  theaterMode: { width: '100%', height: '85vh', background: '#000', borderRadius: '30px', overflow: 'hidden', position: 'relative', border: '1px solid #222' },
  bigIframe: { width: '100%', height: '100%', border: 'none' },
  closePlayer: { position: 'absolute', top: '20px', right: '20px', background: '#ff0000', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },

  // ADMIN PANEL
  adminOverlay: { position: 'fixed', inset: '30px', background: '#050505', borderRadius: '40px', zIndex: 1000, border: '1px solid #222', display: 'flex', flexDirection: 'column', boxShadow: '0 0 100px #000' },
  adminNav: { padding: '30px 50px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { flex: 1, padding: '40px', overflow: 'hidden' },
  managementGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', height: '100%' },
  manageBox: { background: '#0a0a0a', border: '1px solid #111', borderRadius: '25px', padding: '30px', display: 'flex', flexDirection: 'column' },
  inpRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  adminInp: { flex: 1, background: '#000', border: '1px solid #222', padding: '15px', color: '#fff', borderRadius: '12px' },
  addBtn: { background: '#00ff00', color: '#000', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  banBtn: { background: '#ff0000', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  scrollList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  listItem: { background: '#050505', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  delBtn: { background: '#111', color: '#555', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff00', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  closeAdmin: { background: '#fff', color: '#000', border: 'none', width: '40px', height: '40px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  // LOGS
  logsArea: { background: '#000', height: '100%', borderRadius: '20px', padding: '30px', fontFamily: 'monospace', overflowY: 'auto', border: '1px solid #111' },
  logLine: { padding: '8px 0', borderBottom: '1px solid #0a0a0a', fontSize: '12px' },

  // MODALS
  alexLoginOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  alexLoginCard: { background: '#0a0a0a', padding: '50px', borderRadius: '30px', textAlign: 'center', border: '1px solid #222', width: '400px' },
  adminPassInp: { width: '100%', background: '#000', border: '1px solid #222', padding: '20px', color: '#fff', borderRadius: '15px', textAlign: 'center', fontSize: '24px', marginBottom: '20px' },
  confirmBtn: { width: '100%', background: '#ff0000', color: '#fff', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' },
  cancelBtn: { color: '#444', background: 'none', border: 'none', cursor: 'pointer' },

  notifStack: { position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notifBox: { background: '#0a0a0a', color: '#fff', padding: '20px 30px', borderRadius: '12px', boxShadow: '0 10px 30px #000', minWidth: '250px', fontWeight: 'bold' }
};

// --- GLOBAL STYLES ---
if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    .system-loader { width: 60px; height: 60px; border: 4px solid #111; border-top-color: #ff0000; border-radius: 50%; animation: rot 1s infinite linear; }
    @keyframes rot { to { transform: rotate(360deg); } }
    .mediaCard:hover { transform: scale(1.02); border-color: #ff0000; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
  `;
  document.head.appendChild(s);
}
