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
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (FIXED BUILD)
 * ============================================================================
 * @version: 13.0.9-SUPREME
 * @author: ALEX ADMIN
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

// NUEVA API KEY DE YOUTUBE PROPORCIONADA
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-ULTRA";

export default function AlexHubUltraV13() {
  // --- NÚCLEO DE ESTADOS ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);

  // --- DATOS REALTIME (SINCRONIZADOS) ---
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

  // --- PANEL ALEX COMMAND ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');

  // --- UI ---
  const [notifications, setNotifications] = useState([]);
  const themeColor = '#E50914';

  // ==========================================
  // FUNCIÓN PÁNICO (REDIRECCIÓN Y CIERRE)
  // ==========================================
  const handlePanic = useCallback(() => {
    // Abrir app nativa si está instalada
    window.location.href = "managebac://";
    
    // Fallback a web y cierre de pestaña
    setTimeout(() => {
      window.open("https://managebac.com", "_blank");
      window.close();
      // Si window.close falla (por seguridad del navegador), redirigimos la pestaña actual
      window.location.replace("https://managebac.com");
    }, 200);
  }, []);

  // Sanitización de Email para Firebase (Soluciona error de .eu / .com)
  const sanitizeEmail = (email) => email.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_');

  // ==========================================
  // 1. GESTIÓN DE SEGURIDAD Y AUTH
  // ==========================================

  useEffect(() => {
    // Forzar persistencia para evitar "missing initial state"
    setPersistence(auth, browserLocalPersistence);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        verifyAccess(currentUser.email);
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

  const verifyAccess = (email) => {
    const key = sanitizeEmail(email);
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        onValue(ref(db, `whitelist/${key}`), (wSnap) => {
          if (wSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setLoginError("ACCESO DENEGADO: NO ESTÁS EN WHITELIST");
          }
          setAuthLoading(false);
        });
      }
    });
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setLoginError("Error Google: " + e.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    window.location.reload();
  };

  // ==========================================
  // 2. COMANDOS ADMIN (ARREGLADOS)
  // ==========================================

  const modifyUserStatus = async (table, targetEmail, action) => {
    if (!targetEmail.includes('@')) return addNotification("Email inválido", "error");
    const key = sanitizeEmail(targetEmail);
    
    try {
      if (action === 'add') {
        await set(ref(db, `${table}/${key}`), {
          email: targetEmail,
          timestamp: serverTimestamp(),
          admin: user?.email
        });
        addNotification(`${targetEmail} añadido con éxito`, "success");
      } else {
        await remove(ref(db, `${table}/${key}`));
        addNotification(`${targetEmail} eliminado con éxito`, "info");
      }
      setNewEmailInput('');
      logActivity(`ADMIN ${action.toUpperCase()}: ${targetEmail} en ${table}`);
    } catch (error) {
      addNotification("Error en base de datos", "error");
    }
  };

  const logActivity = (msg) => {
    push(ref(db, 'logs'), {
      msg,
      user: user?.email || 'System',
      timestamp: new Date().toISOString()
    });
  };

  // ==========================================
  // 3. MOTOR MULTIMEDIA (EXTRA LARGE)
  // ==========================================

  const searchContent = async (e) => {
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
      logActivity(`Búsqueda: ${query}`);
    } catch (err) {
      addNotification("Error de conexión API", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(p => [...p, { id, text, type }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // 4. INTERFAZ Y RENDER
  // ==========================================

  if (authLoading) return <div style={styles.loading}>CARGANDO SISTEMA ULTRA V13...</div>;

  return (
    <div style={styles.app}>
      
      {/* BOTÓN PÁNICO - SIEMPRE VISIBLE */}
      <button onClick={handlePanic} style={styles.panicButton}>PÁNICO</button>

      {/* NOTIFICACIONES */}
      <div style={styles.notifGroup}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notif, borderLeft: `5px solid ${n.type === 'error' ? 'red' : 'green'}`}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={styles.banScreen}>
          <h1 style={styles.glitch}>SISTEMA BLOQUEADO</h1>
          <p>Tu acceso ha sido revocado permanentemente.</p>
          <button onClick={handleLogout} style={styles.loginBtn}>VOLVER</button>
        </div>
      ) : !accessGranted ? (
        /* PANTALLA LOGIN */
        <div style={styles.loginContainer}>
          <div style={styles.loginCard}>
            <h1 style={styles.title}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
            <p style={styles.subtitle}>VERSIÓN {SYSTEM_VERSION}</p>
            <button onClick={handleGoogleLogin} style={styles.googleBtn}>ENTRAR CON GOOGLE</button>
            {loginError && <p style={styles.err}>{loginError}</p>}
            <button onClick={() => setShowAlexLogin(true)} style={styles.alexTrigger}>ADMIN LOGIN</button>
          </div>
        </div>
      ) : (
        /* DASHBOARD PRINCIPAL */
        <>
          <nav style={styles.nav}>
            <div style={styles.navLeft}>
              <div style={styles.brandBox}>
                <span style={styles.b1}>ALEX</span><span style={styles.b2}>HUB</span>
              </div>
              <div style={styles.menu}>
                {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
                  <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.menuBtnActive : styles.menuBtn}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={searchContent} style={styles.search}>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Buscar en ${mode}...`} style={styles.searchInput} />
            </form>

            <div style={styles.navRight}>
               <img src={user.photoURL} style={styles.pfp} />
               <button onClick={() => setIsAdminOpen(true)} style={styles.adminEntry}>COMANDOS</button>
            </div>
          </nav>

          <main style={styles.main}>
            {loadingContent && <div style={styles.loader}>Cargando...</div>}
            
            {mode === 'youtube' && (
              <div style={styles.contentGrid}>
                {selectedVideo ? (
                  <div style={styles.playerWrap}>
                    <iframe src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
                    <button onClick={() => setSelectedVideo(null)} style={styles.closeVid}>CERRAR VÍDEO</button>
                  </div>
                ) : (
                  videos.map((v, i) => (
                    <div key={i} style={styles.vCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                      <img src={v.snippet.thumbnails.high.url} style={styles.vImg} />
                      <div style={styles.vData}>
                        <h4 style={styles.vTitle}>{v.snippet.title}</h4>
                        <p style={styles.vAuthor}>{v.snippet.channelTitle}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {mode !== 'youtube' && (
              <div style={styles.theaterMode}>
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

      {/* PANEL ADMIN (MODAL) */}
      {isAdminOpen && (
        <div style={styles.adminModal}>
          <div style={styles.adminInner}>
            <div style={styles.adminHead}>
              <h2>ALEX COMMAND CENTER</h2>
              <button onClick={() => setIsAdminOpen(false)} style={styles.closeBtn}>X</button>
            </div>
            
            <div style={styles.adminTabs}>
              <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.tabA : styles.tabI}>USUARIOS</button>
              <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.tabA : styles.tabI}>REGISTROS</button>
            </div>

            <div style={styles.adminBody}>
              {adminTab === 'users' ? (
                <div style={styles.adminUserGrid}>
                  {/* WHITELIST */}
                  <div style={styles.adminCard}>
                    <h3>WHITELIST (ACCESO)</h3>
                    <div style={styles.adminRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@gmail.com" style={styles.adminInp} />
                      <button onClick={() => modifyUserStatus('whitelist', newEmailInput, 'add')} style={styles.btnG}>AÑADIR</button>
                    </div>
                    <div style={styles.userList}>
                      {Object.values(whitelist).map(u => (
                        <div key={u.email} style={styles.uItem}>
                          {u.email} <button onClick={() => modifyUserStatus('whitelist', u.email, 'remove')} style={styles.btnR}>BORRAR</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* BLACKLIST */}
                  <div style={styles.adminCard}>
                    <h3 style={{color: 'red'}}>BLACKLIST (BANEO)</h3>
                    <div style={styles.adminRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="email@gmail.com" style={styles.adminInp} />
                      <button onClick={() => modifyUserStatus('blacklist', newEmailInput, 'add')} style={styles.btnR}>BANEAR</button>
                    </div>
                    <div style={styles.userList}>
                      {Object.values(blacklist).map(u => (
                        <div key={u.email} style={styles.uItem}>
                          {u.email} <button onClick={() => modifyUserStatus('blacklist', u.email, 'remove')} style={styles.btnG}>PERDONAR</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.logBox}>
                   {systemLogs.map((l, i) => (
                     <div key={i} style={styles.logRow}>
                        <span style={{color: '#555'}}>[{l.timestamp}]</span> <b>{l.user}:</b> {l.msg}
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL PARA ADMIN */}
      {showAlexLogin && (
        <div style={styles.overlay}>
           <div style={styles.miniLogin}>
              <h3>PASS DE ACCESO</h3>
              <input type="password" value={alexPassInput} onChange={e=>setAlexPassInput(e.target.value)} style={styles.adminInp} />
              <button onClick={() => { if(alexPassInput === ADMIN_PASS) { setIsAdminOpen(true); setShowAlexLogin(false); setAlexPassInput(''); } }} style={styles.btnG}>VALIDAR</button>
              <button onClick={() => setShowAlexLogin(false)} style={styles.btnR}>CANCELAR</button>
           </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ESTILOS ULTRA (PROFESIONAL)
// ==========================================
const styles = {
  app: { height: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  panicButton: { position: 'fixed', bottom: '30px', right: '30px', padding: '20px 40px', background: '#ff0000', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '20px', cursor: 'pointer', zIndex: 99999, boxShadow: '0 0 30px rgba(255,0,0,0.6)' },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', letterSpacing: '5px' },
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #111 0%, #000 100%)' },
  loginCard: { textAlign: 'center', padding: '60px', borderRadius: '30px', border: '1px solid #222', background: '#0a0a0a' },
  title: { fontSize: '50px', margin: 0 },
  subtitle: { color: '#444', fontSize: '12px', marginBottom: '40px' },
  googleBtn: { background: '#fff', color: '#000', padding: '15px 40px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  alexTrigger: { display: 'block', margin: '30px auto 0', background: 'none', border: 'none', color: '#222', cursor: 'pointer' },
  nav: { height: '80px', background: '#0a0a0a', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', borderBottom: '1px solid #111' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
  brandBox: { fontSize: '24px', fontWeight: '900' },
  b2: { color: '#E50914' },
  menu: { display: 'flex', gap: '10px' },
  menuBtn: { background: '#111', color: '#666', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  menuBtnActive: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  search: { flex: 1, maxWidth: '600px', margin: '0 40px' },
  searchInput: { width: '100%', background: '#000', border: '1px solid #222', padding: '12px 20px', borderRadius: '10px', color: '#fff' },
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  pfp: { width: '40px', height: '40px', borderRadius: '50%' },
  adminEntry: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  main: { flex: 1, overflowY: 'auto', padding: '30px' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  vCard: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #111' },
  vImg: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  vData: { padding: '15px' },
  vTitle: { margin: '0 0 10px 0', fontSize: '14px', height: '40px', overflow: 'hidden' },
  vAuthor: { color: '#444', fontSize: '12px' },
  playerWrap: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  theaterMode: { width: '100%', height: '85vh' },
  fullIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '20px' },
  closeVid: { position: 'absolute', top: '20px', right: '20px', background: '#E50914', color: '#fff', border: 'none', padding: '15px 25px', borderRadius: '10px', cursor: 'pointer' },
  adminModal: { position: 'fixed', inset: '40px', background: '#0a0a0a', border: '1px solid #333', zIndex: 10000, borderRadius: '25px', display: 'flex' },
  adminInner: { flex: 1, display: 'flex', flexDirection: 'column' },
  adminHead: { padding: '25px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' },
  adminTabs: { display: 'flex', padding: '10px 25px', gap: '20px' },
  tabA: { background: 'none', border: 'none', color: '#fff', borderBottom: '2px solid red', padding: '10px', cursor: 'pointer' },
  tabI: { background: 'none', border: 'none', color: '#444', padding: '10px', cursor: 'pointer' },
  adminBody: { flex: 1, padding: '25px', overflowY: 'auto' },
  adminUserGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  adminCard: { background: '#111', padding: '25px', borderRadius: '20px' },
  adminRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  adminInp: { flex: 1, background: '#000', border: '1px solid #222', color: '#fff', padding: '10px' },
  btnG: { background: '#00ff41', color: '#000', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' },
  btnR: { background: '#ff0000', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' },
  userList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  uItem: { background: '#050505', padding: '10px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' },
  logBox: { background: '#000', padding: '20px', borderRadius: '15px', fontFamily: 'monospace' },
  logRow: { padding: '5px 0', borderBottom: '1px solid #111', fontSize: '12px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  miniLogin: { background: '#0a0a0a', padding: '40px', borderRadius: '20px', textAlign: 'center' },
  notifGroup: { position: 'fixed', top: '20px', right: '20px', zIndex: 30000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notif: { background: '#111', color: '#fff', padding: '15px 25px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' }
};

// --- AUTO-INYECCIÓN CSS ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    body { margin: 0; background: #000; overflow: hidden; }
    * { box-sizing: border-box; transition: all 0.2s ease-in-out; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
    .vCard:hover { transform: scale(1.05); border-color: red; }
    iframe { border: none; }
  `;
  document.head.appendChild(style);
}
