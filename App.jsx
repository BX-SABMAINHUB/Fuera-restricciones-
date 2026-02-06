import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, push 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (FIXED BUILD)
 * ============================================================================
 * @version: 13.0.6-STABLE
 * @fixes: Auth Persistence, DB Sanitization, Admin Actions
 * ============================================================================
 */

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

const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.6-ULTRA";

// UTILIDAD PARA LIMPIAR EMAILS (Firebase no acepta puntos en las llaves)
const sanitizeKey = (email) => email.toLowerCase().replace(/[.#$[\]]/g, '_');

export default function AlexHubUltraV13() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);

  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);

  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');
  const [notifications, setNotifications] = useState([]);

  const themeColor = '#E50914';

  useEffect(() => {
    // FIX: Forzar persistencia local para evitar errores de sesión
    setPersistence(auth, browserLocalPersistence);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkSecurityLayer(currentUser.email);
      } else {
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || {}));
    onValue(ref(db, 'logs'), (s) => {
      const data = s.val() || {};
      setSystemLogs(Object.values(data).reverse().slice(0, 50));
    });

    return () => unsubscribeAuth();
  }, []);

  const checkSecurityLayer = useCallback((email) => {
    const emailKey = sanitizeKey(email);
    
    // Verificación en tiempo real de baneo y acceso
    onValue(ref(db, `blacklist/${emailKey}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        onValue(ref(db, `whitelist/${emailKey}`), (whiteSnap) => {
          if (whiteSnap.exists() || email === "admin@alexhub.pro") {
            setAccessGranted(true);
            setLoginError(null);
          } else {
            setAccessGranted(false);
            setLoginError("CORREO NO REGISTRADO EN WHITELIST.");
          }
        });
      }
      setAuthLoading(false);
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoginError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
      setLoginError("ERROR DE AUTENTICACIÓN. REINTENTE.");
    }
  };

  const handleLogout = () => signOut(auth).then(() => window.location.reload());

  const handleAlexSubmit = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("MODO DIOS ACTIVADO", "success");
    } else {
      addNotification("CLAVE INCORRECTA", "error");
    }
  };

  const manageSystemUser = async (table, email, action) => {
    if (!email || !email.includes('@')) return addNotification("EMAIL INVÁLIDO", "error");
    const emailKey = sanitizeKey(email);
    
    try {
      if (action === 'add') {
        await set(ref(db, `${table}/${emailKey}`), { 
          email: email.trim(), 
          timestamp: serverTimestamp() 
        });
        addNotification("USUARIO AÑADIDO", "success");
      } else {
        await remove(ref(db, `${table}/${emailKey}`));
        addNotification("USUARIO ELIMINADO", "info");
      }
      setNewEmailInput('');
    } catch (e) {
      addNotification("ERROR EN BASE DE DATOS", "error");
    }
  };

  const startGlobalSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
    } catch (err) {
      addNotification("ERROR API YOUTUBE", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  if (authLoading) return <div style={styles.fullCenter}><div className="loader"></div></div>;

  return (
    <div style={styles.appContainer}>
      <div style={styles.notifContainer}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notif, borderLeftColor: n.type === 'error' ? '#ff0000' : '#00ff41'}}>
            {n.text}
          </div>
        ))}
      </div>

      {showAlexLogin && (
        <div style={styles.modalOverlay}>
          <div style={styles.miniCard}>
             <h3>SYSTEM AUTH</h3>
             <form onSubmit={handleAlexSubmit}>
               <input type="password" value={alexPassInput} onChange={e => setAlexPassInput(e.target.value)} style={styles.adminInput} autoFocus />
               <button type="submit" style={{...styles.confirmBtn, background: themeColor}}>ACCEDER</button>
               <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>SALIR</button>
             </form>
          </div>
        </div>
      )}

      {isAdminOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <h2>ALEX COMMAND CENTER</h2>
            <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>X</button>
          </div>
          <div style={styles.adminBody}>
            <div style={styles.adminActionRow}>
              <input value={newEmailInput} onChange={e => setNewEmailInput(e.target.value)} placeholder="Email del usuario..." style={styles.adminInputText}/>
              <button onClick={() => manageSystemUser('whitelist', newEmailInput, 'add')} style={styles.addBtn}>+ WHITELIST</button>
              <button onClick={() => manageSystemUser('blacklist', newEmailInput, 'add')} style={styles.banBtnAction}>+ BAN</button>
              <button onClick={() => manageSystemUser('premium_users', newEmailInput, 'add')} style={styles.premiumBtnAdd}>+ PREMIUM</button>
            </div>
            <div style={styles.adminGrid}>
              <div style={styles.adminSection}>
                <h4>WHITELIST ACTIVE</h4>
                {Object.values(whitelist).map(u => (
                  <div key={u.email} style={styles.listItem}>
                    {u.email} <button onClick={() => manageSystemUser('whitelist', u.email, 'remove')}>ELIMINAR</button>
                  </div>
                ))}
              </div>
              <div style={styles.adminSection}>
                <h4>BANNED USERS</h4>
                {Object.values(blacklist).map(u => (
                  <div key={u.email} style={styles.listItem}>
                    {u.email} <button onClick={() => manageSystemUser('blacklist', u.email, 'remove')} style={{color:'red'}}>PERDONAR</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isBanned ? (
        <div style={styles.fullCenter}>
          <h1 style={{color:'red'}}>SISTEMA BLOQUEADO</h1>
          <p>Tu acceso ha sido revocado.</p>
          <button onClick={handleLogout}>CERRAR SESIÓN</button>
        </div>
      ) : (
        (!user || !accessGranted) ? (
          <div style={styles.loginPage}>
            <div style={styles.loginCard}>
              <h1>ALEX HUB <span style={{color:themeColor}}>ULTRA</span></h1>
              <p>{SYSTEM_VERSION}</p>
              {!user ? (
                <button onClick={handleGoogleLogin} style={styles.googleBtn}>LOGIN WITH GOOGLE</button>
              ) : (
                <div style={{color:'orange'}}>ACCESO PENDIENTE: {user.email}</div>
              )}
              {loginError && <div style={styles.errorText}>{loginError}</div>}
              <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtn}>ADMIN LOGIN</button>
            </div>
          </div>
        ) : (
          <>
            <nav style={styles.navbar}>
              <div style={styles.logoBox}>ALEX HUB</div>
              <div style={styles.tabContainer}>
                {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
                  <button key={m} onClick={() => setMode(m)} style={mode === m ? {...styles.activeTab, background: themeColor} : styles.tab}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
              <form onSubmit={startGlobalSearch} style={styles.searchForm}>
                <input style={styles.searchInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar..." />
              </form>
              <div style={styles.navRight}>
                <img src={user.photoURL} style={styles.userPic} alt="u" />
                <button onClick={() => setShowAlexLogin(true)} style={{...styles.alexBtnMini, background: themeColor}}>ALEX</button>
                <button onClick={handleLogout} style={styles.logoutMini}>LOGOUT</button>
              </div>
            </nav>
            <main style={styles.contentArea}>
              {mode === 'youtube' && (
                <div style={styles.grid}>
                  {selectedVideo ? (
                    <div style={styles.playerWrap}>
                      <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
                      <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>VOLVER</button>
                    </div>
                  ) : (
                    videos.map((v, i) => (
                      <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                        <img src={v.snippet.thumbnails.high.url} style={styles.thumb} alt="t" />
                        <div style={styles.cardInfo}>{v.snippet.title}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {mode !== 'youtube' && (
                <div style={styles.fullFrame}>
                  <iframe src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` : `https://vidsrc.to/embed/movie/${query || 'tt0111161'}`} style={styles.iframe} />
                </div>
              )}
            </main>
          </>
        )
      )}
    </div>
  );
}

const styles = {
  appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff', fontFamily: 'sans-serif' },
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loginPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loginCard: { background: '#0a0a0a', padding: '50px', borderRadius: '30px', textAlign: 'center', border: '1px solid #222' },
  googleBtn: { background: '#fff', color: '#000', padding: '15px 25px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', margin: '20px 0' },
  alexBtn: { background: 'transparent', color: '#444', border: 'none', cursor: 'pointer', marginTop: '20px' },
  navbar: { height: '70px', display: 'flex', alignItems: 'center', padding: '0 20px', background: '#000', borderBottom: '1px solid #111' },
  logoBox: { fontSize: '20px', fontWeight: 'bold', marginRight: '30px' },
  tabContainer: { display: 'flex', gap: '10px' },
  tab: { background: '#111', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  activeTab: { color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold' },
  searchForm: { flex: 1, margin: '0 20px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #222', padding: '10px', color: '#fff', borderRadius: '8px' },
  navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  userPic: { width: '35px', height: '35px', borderRadius: '50%' },
  alexBtnMini: { border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  logoutMini: { background: 'none', border: 'none', color: '#666', cursor: 'pointer' },
  contentArea: { flex: 1, padding: '20px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  card: { background: '#0a0a0a', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '10px', fontSize: '13px' },
  playerWrap: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  closeVideoBtn: { position: 'absolute', top: '10px', right: '10px', background: 'red', color: '#fff', border: 'none', padding: '10px' },
  fullFrame: { height: '100%', width: '100%' },
  notifContainer: { position: 'fixed', top: '20px', right: '20px', zIndex: 10000 },
  notif: { background: '#0a0a0a', padding: '15px', marginBottom: '10px', borderRadius: '5px', borderLeft: '5px solid' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 },
  miniCard: { background: '#0a0a0a', padding: '40px', borderRadius: '20px', textAlign: 'center' },
  adminInput: { background: '#000', border: '1px solid #222', color: '#fff', padding: '10px', width: '100%', marginBottom: '20px', textAlign: 'center' },
  confirmBtn: { padding: '10px 20px', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#555', border: 'none', cursor: 'pointer', marginLeft: '10px' },
  adminFrame: { position: 'fixed', inset: '20px', background: '#0a0a0a', border: '2px solid #333', zIndex: 6000, borderRadius: '20px', display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' },
  adminBody: { padding: '20px', flex: 1, overflowY: 'auto' },
  adminActionRow: { display: 'flex', gap: '10px', marginBottom: '30px' },
  adminInputText: { flex: 1, background: '#000', border: '1px solid #333', color: '#fff', padding: '10px' },
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '0 15px', fontWeight: 'bold' },
  banBtnAction: { background: 'red', color: '#fff', border: 'none', padding: '0 15px' },
  premiumBtnAdd: { background: 'gold', color: '#000', border: 'none', padding: '0 15px' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  adminSection: { background: '#050505', padding: '15px', borderRadius: '10px' },
  listItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #111', fontSize: '12px' },
  closeAdmin: { background: 'none', color: '#fff', fontSize: '20px', border: 'none', cursor: 'pointer' },
  errorText: { color: 'red', fontSize: '12px', marginTop: '10px' }
};

if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    .loader { border: 4px solid #111; border-top: 4px solid #E50914; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(s);
}
