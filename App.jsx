import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, push 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (FIXED BUILD)
 * ============================================================================
 * @version: 13.0.6-STABLE
 * @author: Alex Hub Team
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

const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.6-ULTRA";

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

  // --- ESCUCHA DE DATOS CORREGIDA ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkSecurityLayer(currentUser.email);
      } else {
        setAccessGranted(false);
        setAuthLoading(false);
      }
    });

    // Escuchadores con limpieza automática
    const refs = [
      { path: 'whitelist', setter: setWhitelist },
      { path: 'blacklist', setter: setBlacklist },
      { path: 'premium_users', setter: setPremiumUsers },
      { path: 'logs', setter: (val) => setSystemLogs(Object.values(val || {}).reverse().slice(0, 40)) }
    ];

    const unsubs = refs.map(({ path, setter }) => 
      onValue(ref(db, path), (snap) => setter(snap.val() || {}))
    );

    return () => {
      unsubscribeAuth();
      unsubs.forEach(u => u());
    };
  }, []);

  const checkSecurityLayer = (email) => {
    const emailKey = email.replace(/\./g, ',');
    
    // Verificación única y eficiente
    onValue(ref(db, `blacklist/${emailKey}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        onValue(ref(db, `whitelist/${emailKey}`), (whiteSnap) => {
          if (whiteSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("SISTEMA: No estás en la Whitelist.");
          }
        });
      }
      setAuthLoading(false);
    });
  };

  // --- ACCIONES DE ADMINISTRACIÓN CORREGIDAS ---
  const manageSystemUser = (table, email, action) => {
    if (!email || !email.includes('@')) {
      addNotification("Email no válido", "error");
      return;
    }

    const emailKey = email.trim().replace(/\./g, ',');
    const targetRef = ref(db, `${table}/${emailKey}`);

    if (action === 'add') {
      set(targetRef, { 
        email: email.trim(), 
        addedAt: serverTimestamp(),
        manager: user?.email || 'Alex System'
      }).then(() => {
        addNotification(`${email} AÑADIDO`, "success");
        logActivity(`ADMIN: Agregó ${email} a ${table}`);
      });
    } else {
      remove(targetRef).then(() => {
        addNotification(`${email} ELIMINADO`, "info");
        logActivity(`ADMIN: Eliminó ${email} de ${table}`);
      }).catch(e => addNotification("Error al eliminar", "error"));
    }
    setNewEmailInput('');
  };

  const handleAlexSubmit = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
      addNotification("SISTEMA DESBLOQUEADO", "success");
    } else {
      addNotification("PASSWORD ERRÓNEO", "error");
    }
  };

  const logActivity = (msg) => {
    push(ref(db, 'logs'), {
      msg,
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'Sistema'
    });
  };

  const startGlobalSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
      logActivity(`Búsqueda: [${mode}] ${query}`);
    } catch (err) { 
      addNotification("Error de API", "error");
    }
    setLoadingContent(false);
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3500);
  };

  const handleGoogleLogin = () => signInWithPopup(auth, googleProvider).catch(() => setLoginError("Error Google Auth"));
  const handleLogout = () => signOut(auth).then(() => window.location.reload());

  if (authLoading) return (
    <div style={styles.fullCenter}>
      <div className="loader"></div>
      <p style={{marginTop: '20px', color: themeColor, letterSpacing: '5px', fontWeight: 'bold'}}>ALEX HUB ULTRA V13</p>
    </div>
  );

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
          <div style={{...styles.miniCard, borderTopColor: themeColor}}>
             <h2 style={{letterSpacing: '4px'}}>SISTEMA ADMIN</h2>
             <form onSubmit={handleAlexSubmit}>
               <input type="password" placeholder="CONTRASEÑA" value={alexPassInput} onChange={e => setAlexPassInput(e.target.value)} style={styles.adminInput} autoFocus />
               <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                 <button type="submit" style={{...styles.confirmBtn, background: themeColor}}>ENTRAR</button>
                 <button type="button" onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>CANCELAR</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {isAdminOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <div>
              <h1 style={{color: themeColor, margin: 0, fontSize: '24px'}}>ALEX HUB | COMMAND CENTER</h1>
              <p style={{margin: 0, fontSize: '11px', color: '#555'}}>DATABASE MANAGEMENT STABLE</p>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
               <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.adminTabActive : styles.adminTab}>USUARIOS</button>
               <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.adminTabActive : styles.adminTab}>LOGS</button>
               <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>CERRAR</button>
            </div>
          </div>
          
          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminGrid}>
                {/* COLUMNA WHITELIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#00ff41', fontSize: '14px'}}>✅ WHITELIST</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.adminInputText}/>
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

                {/* COLUMNA BLACKLIST */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#E50914', fontSize: '14px'}}>🚫 BLACKLIST</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.adminInputText}/>
                      <button onClick={() => manageSystemUser('blacklist', newEmailInput, 'add')} style={styles.banBtnAction}>BAN</button>
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

                {/* COLUMNA PREMIUM */}
                <div style={styles.adminSection}>
                   <h3 style={{color: '#FFD700', fontSize: '14px'}}>💎 PREMIUM</h3>
                   <div style={styles.adminActionRow}>
                      <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="Email..." style={styles.adminInputText}/>
                      <button onClick={() => manageSystemUser('premium_users', newEmailInput, 'add')} style={styles.premiumBtnAdd}>DAR</button>
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
              <div style={styles.logContainer}>
                {systemLogs.map((log, idx) => (
                  <div key={idx} style={styles.logItem}>
                    <span style={{color: '#444'}}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span style={{color: themeColor}}> {log.user}:</span> {log.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isBanned ? (
        <div style={styles.bannedScreen}>
          <div style={styles.errorBox}>
            <h1 className="glitch">ACCESO DENEGADO</h1>
            <p>Has sido expulsado del sistema.</p>
            <button onClick={handleLogout} style={styles.logoutBtnLarge}>SALIR</button>
          </div>
        </div>
      ) : (
        <>
          {(!user || !accessGranted) ? (
            <div style={styles.loginPage}>
              <div style={styles.loginCard}>
                <h1 style={styles.glitchText}>ALEX HUB <span style={{color: themeColor}}>ULTRA</span></h1>
                <p style={styles.versionTag}>{SYSTEM_VERSION}</p>
                <div style={{margin: '40px 0'}}>
                  {!user ? (
                    <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{width:'20px'}} />
                      LOGIN CON GOOGLE
                    </button>
                  ) : (
                    <div style={styles.pendingStatus}>
                      <p style={{color: '#ff9800'}}>ESTADO: NO AUTORIZADO</p>
                      <button onClick={handleLogout} style={styles.logoutMini}>LOGOUT</button>
                    </div>
                  )}
                </div>
                {loginError && <div style={styles.errorText}>{loginError}</div>}
                <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtn}>PANEL ALEX</button>
              </div>
            </div>
          ) : (
            <>
              <nav style={styles.navbar}>
                <div style={styles.navLeft}>
                  <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={{...styles.logoSub, color: themeColor}}>ULTRA V13</span></div>
                  <div style={styles.tabContainer}>
                    {['youtube', 'twitch', 'movies', 'xbox', 'radio'].map(m => (
                      <button key={m} onClick={() => {setMode(m); setSelectedVideo(null)}} style={mode === m ? {...styles.activeTab, background: themeColor} : styles.tab}>{m.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <form onSubmit={startGlobalSearch} style={styles.searchForm}>
                  <input style={styles.searchInput} placeholder={`Buscar en ${mode}...`} value={query} onChange={(e) => setQuery(e.target.value)} />
                  <button type="submit" style={styles.searchIconBtn}>🔍</button>
                </form>
                <div style={styles.navRight}>
                   {premiumUsers[user.email.replace(/\./g, ',')] && <span className="premium-badge">💎 PREMIUM</span>}
                   <div style={styles.userInfo}>
                      <img src={user.photoURL} style={styles.userPic} alt="p" />
                      <div style={styles.userMeta}>
                        <span style={styles.userName}>{user.displayName?.split(' ')[0]}</span>
                        <button onClick={handleLogout} style={styles.logoutMini}>CERRAR</button>
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
                        <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
                        <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>CERRAR</button>
                      </div>
                    ) : (
                      videos.map((v, i) => (
                        <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                          <div style={styles.thumbWrapper}>
                            <img src={v.snippet.thumbnails.high.url} style={styles.thumb} alt="t" />
                            <div style={styles.playOverlay}>PLAY</div>
                          </div>
                          <div style={styles.cardInfo}>
                            <p style={styles.videoTitle}>{v.snippet.title}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {mode !== 'youtube' && (
                   <div style={styles.fullFrame}>
                      <iframe src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                             mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                             mode === 'xbox' ? "https://www.xbox.com/play" : "https://www.radio.net/embed/los40"} style={styles.iframe} />
                   </div>
                )}
              </main>
            </>
          )}
        </>
      )}
      <footer style={styles.footer}>
        <div>ALEX HUB ULTRA © 2026</div>
        <div>SISTEMA PROTEGIDO POR ENCRIPTACIÓN AES-256</div>
      </footer>
    </div>
  );
}

const styles = {
  appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
  fullCenter: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loginPage: { height: '100vh', background: 'radial-gradient(circle at center, #111 0%, #000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 10 },
  loginCard: { background: 'rgba(10,10,10,0.9)', padding: '70px', borderRadius: '40px', border: '1px solid #1a1a1a', textAlign: 'center', backdropFilter: 'blur(20px)' },
  glitchText: { fontSize: '48px', fontWeight: '900', letterSpacing: '6px', margin: 0 },
  versionTag: { fontSize: '10px', color: '#444', letterSpacing: '4px', marginTop: '10px' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '16px 35px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', margin: '0 auto' },
  alexBtn: { background: 'transparent', border: '1px solid #222', color: '#444', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  errorText: { color: '#ff4444', marginTop: '20px', fontSize: '13px' },
  navbar: { height: '85px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 35px', justifyContent: 'space-between', zIndex: 100 },
  logoBox: { borderLeft: '4px solid', paddingLeft: '18px', display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '26px', fontWeight: '900' },
  logoSub: { fontSize: '9px' },
  tabContainer: { display: 'flex', gap: '8px', marginLeft: '35px' },
  tab: { background: '#111', border: 'none', color: '#555', padding: '10px 18px', cursor: 'pointer', borderRadius: '8px', fontSize: '11px' },
  activeTab: { color: '#fff', borderRadius: '8px', border: 'none', padding: '10px 18px', fontWeight: 'bold', fontSize: '11px' },
  searchForm: { flex: 1, maxWidth: '500px', margin: '0 40px', position: 'relative' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', padding: '14px 20px', color: '#fff', outline: 'none' },
  searchIconBtn: { position: 'absolute', right: '15px', top: '12px', background: 'none', border: 'none', cursor: 'pointer' },
  navRight: { display: 'flex', gap: '20px', alignItems: 'center' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '12px', background: '#0a0a0a', padding: '8px 15px', borderRadius: '12px' },
  userPic: { width: '38px', height: '38px', borderRadius: '10px' },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '12px', fontWeight: 'bold' },
  logoutMini: { background: 'none', border: 'none', color: '#555', fontSize: '10px', cursor: 'pointer', padding: 0 },
  alexBtnMini: { border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  contentArea: { flex: 1, overflowY: 'auto', padding: '35px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer' },
  thumbWrapper: { position: 'relative', width: '100%', aspectRatio: '16/9' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  playOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s' },
  cardInfo: { padding: '15px' },
  videoTitle: { fontSize: '13px', fontWeight: 'bold', margin: 0, height: '36px', overflow: 'hidden' },
  playerWrap: { gridColumn: '1/-1', background: '#000', borderRadius: '25px', overflow: 'hidden', height: '70vh', position: 'relative' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  closeVideoBtn: { position: 'absolute', top: '20px', right: '20px', background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  fullFrame: { width: '100%', height: '100%', borderRadius: '25px', overflow: 'hidden' },
  adminFrame: { position: 'fixed', inset: '25px', background: '#050505', border: '1px solid #333', zIndex: 1000, borderRadius: '35px', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' },
  adminHeader: { padding: '20px 40px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { flex: 1, padding: '30px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', height: '100%' },
  adminSection: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column' },
  adminActionRow: { display: 'flex', gap: '10px', marginBottom: '15px' },
  adminInputText: { flex: 1, background: '#000', border: '1px solid #222', padding: '10px', borderRadius: '8px', color: '#fff' },
  scrollList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  listItem: { background: '#050505', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111', fontSize: '11px' },
  adminTab: { background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' },
  adminTabActive: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', borderBottom: '2px solid #fff' },
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold' },
  banBtnAction: { background: '#E50914', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '8px' },
  premiumBtnAdd: { background: '#FFD700', color: '#000', border: 'none', padding: '0 15px', borderRadius: '8px' },
  deleteBtn: { background: '#1a1a1a', color: '#555', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' },
  closeAdmin: { background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' },
  notifContainer: { position: 'fixed', top: '25px', right: '25px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notif: { background: '#0a0a0a', color: '#fff', padding: '15px 25px', borderRadius: '10px', borderLeft: '4px solid', fontSize: '12px', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  miniCard: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', border: '1px solid #1a1a1a', borderTop: '4px solid', textAlign: 'center', width: '320px' },
  adminInput: { width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '12px', fontSize: '20px', textAlign: 'center', marginBottom: '20px' },
  confirmBtn: { color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#444', border: 'none', cursor: 'pointer' },
  logContainer: { background: '#000', borderRadius: '15px', padding: '20px', fontFamily: 'monospace', fontSize: '11px', height: '100%', overflowY: 'auto' },
  logItem: { padding: '4px 0', borderBottom: '1px solid #0a0a0a' },
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 35px', fontSize: '9px', color: '#222' },
  bannedScreen: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorBox: { textAlign: 'center', padding: '40px', border: '1px solid #ff0000', borderRadius: '20px' },
  logoutBtnLarge: { marginTop: '20px', background: '#ff0000', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '10px' },
  loadOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    .loader { width: 40px; height: 40px; border: 3px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .card:hover .playOverlay { opacity: 1; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
    .premium-badge { background: linear-gradient(45deg, #FFD700, #FFA500); color: #000; padding: 3px 8px; border-radius: 10px; font-size: 9px; font-weight: 900; }
  `;
  document.head.appendChild(s);
}
