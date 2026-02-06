/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - THE ULTIMATE CONTROL SYSTEM (FIXED & EXPANDED)
 * ============================================================================
 * @version: 13.0.9-SUPREME
 * @status: OPERATIONAL
 * @author: ALEX ADMIN
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update, push 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURACIÓN FIREBASE (VERIFICADA) ---
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

// Configuración de Google Auth para evitar errores de estado inicial
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- VARIABLES MAESTRAS ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const ADMIN_PASS = "Alex2706";
const SYSTEM_VERSION = "13.0.9-ULTRA-FIX";

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

  // --- PANEL ALEX ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');
  const [notifications, setNotifications] = useState([]);

  // ==========================================
  // FUNCIÓN DE PÁNICO (REQUERIDA)
  // ==========================================
  const executePanicProtocol = useCallback(() => {
    // 1. Intenta abrir la App de ManageBac (Deep Link)
    window.location.href = "managebac://";
    
    // 2. Redirección de respaldo a la web y cierre de pestaña
    setTimeout(() => {
      const newWin = window.open("https://managebac.com", "_blank");
      if (newWin) {
        window.opener = null;
        window.open("", "_self");
        window.close();
      } else {
        window.location.href = "https://managebac.com";
      }
    }, 100);
  }, []);

  // ==========================================
  // MANEJO DE BASE DE DATOS (FIX GMAIL.EU)
  // ==========================================
  const formatKey = (email) => {
    if (!email) return "";
    // Reemplaza puntos por guiones bajos para evitar errores de estructura en Firebase
    return email.toLowerCase().trim().replace(/\./g, '_dot_').replace(/@/g, '_at_');
  };

  // ==========================================
  // SISTEMA DE AUTENTICACIÓN CORREGIDO
  // ==========================================
  useEffect(() => {
    // Forzamos persistencia local para evitar "missing initial state"
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            validateAccess(currentUser.email);
            logActivity(`Usuario autenticado: ${currentUser.email}`);
          } else {
            setUser(null);
            setAccessGranted(false);
            setAuthLoading(false);
          }
        });
      })
      .catch((error) => {
        console.error("Auth Persistence Error:", error);
      });

    // Suscripción Realtime
    const unsubWhite = onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium'), (s) => setPremiumUsers(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'logs'), (s) => {
      const logs = s.val() ? Object.values(s.val()).reverse().slice(0, 100) : [];
      setSystemLogs(logs);
    });

    return () => { unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs(); };
  }, []);

  const validateAccess = (email) => {
    const key = formatKey(email);
    // Verificar baneo
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        // Verificar Whitelist
        onValue(ref(db, `whitelist/${key}`), (wSnap) => {
          if (wSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("TU CORREO NO ESTÁ EN LA WHITELIST.");
          }
        });
      }
      setAuthLoading(false);
    });
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      addNotification("Conectando con Google...", "info");
    } catch (error) {
      console.error(error);
      setLoginError(`ERROR DE AUTH: ${error.code}`);
      addNotification("Fallo al iniciar sesión", "error");
    }
  };

  // ==========================================
  // COMANDOS DE ADMINISTRACIÓN (FIXED)
  // ==========================================
  const modifyUser = async (table, email, action) => {
    if (!email || !email.includes('@')) {
      return addNotification("E-mail inválido", "error");
    }
    const key = formatKey(email);
    const dbRef = ref(db, `${table}/${key}`);

    try {
      if (action === 'add') {
        await set(dbRef, {
          email: email.toLowerCase().trim(),
          addedBy: user?.email,
          timestamp: serverTimestamp()
        });
        addNotification(`Añadido a ${table}`, "success");
        logActivity(`ADMIN: Añadió ${email} a ${table}`);
      } else {
        await remove(dbRef);
        addNotification(`Eliminado de ${table}`, "info");
        logActivity(`ADMIN: Eliminó ${email} de ${table}`);
      }
      setNewEmailInput('');
    } catch (err) {
      addNotification("Error en DB: Acceso denegado", "error");
    }
  };

  // ==========================================
  // MOTOR MULTIMEDIA XL
  // ==========================================
  const searchMedia = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${query}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
      logActivity(`Búsqueda en ${mode}: ${query}`);
    } catch (err) {
      addNotification("Error en API YouTube", "error");
    }
    setLoadingContent(false);
  };

  const logActivity = (msg) => {
    const lRef = push(ref(db, 'logs'));
    set(lRef, { msg, user: user?.email || 'Anon', time: new Date().toISOString() });
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // RENDERIZADO DE INTERFAZ
  // ==========================================

  if (authLoading) return (
    <div style={styles.loaderPage}>
      <div className="spinner"></div>
      <h1 style={styles.loadText}>ALEX HUB ULTRA V13</h1>
    </div>
  );

  return (
    <div style={styles.app}>
      
      {/* Botón de Pánico - Flotante y Prioritario */}
      <button onClick={executePanicProtocol} style={styles.panicBtn}>PÁNICO</button>

      {/* Sistema de Notificaciones */}
      <div style={styles.notifWrapper}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.notifItem, borderLeftColor: n.type === 'error' ? '#ff0000' : '#00ff00'}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={styles.bannedOverlay}>
          <div style={styles.bannedCard}>
            <h1 style={{fontSize: '60px', color: '#ff0000'}}>SISTEMA BLOQUEADO</h1>
            <p>Tu acceso ha sido revocado por la administración.</p>
            <button onClick={() => signOut(auth)} style={styles.logoutLarge}>SALIR DEL SISTEMA</button>
          </div>
        </div>
      ) : (
        <>
          {(!user || !accessGranted) ? (
            <div style={styles.loginFrame}>
              <div style={styles.loginBox}>
                <h1 style={styles.mainTitle}>ALEX HUB <span style={{color: '#ff0000'}}>ULTRA</span></h1>
                <p style={styles.subTitle}>SISTEMA DE CONTROL DE ACCESO v13.0.9</p>
                
                <div style={styles.loginActionArea}>
                  {!user ? (
                    <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" width="20" alt="G" />
                      ENTRAR CON GOOGLE
                    </button>
                  ) : (
                    <div style={styles.pendingAuth}>
                      <p>AUTENTICADO COMO: {user.email}</p>
                      <p style={{color: '#ff0000', fontWeight: 'bold'}}>ESPERANDO AUTORIZACIÓN EN WHITELIST...</p>
                      <button onClick={() => signOut(auth)} style={styles.cancelBtn}>CAMBIAR CUENTA</button>
                    </div>
                  )}
                  {loginError && <p style={styles.errTxt}>{loginError}</p>}
                </div>

                <button onClick={() => setShowAlexLogin(true)} style={styles.alexTrigger}>ACCESO ADMINISTRADOR</button>
              </div>
            </div>
          ) : (
            <>
              {/* DASHBOARD PRINCIPAL OPERATIVO */}
              <nav style={styles.nav}>
                <div style={styles.navContainer}>
                  <div style={styles.navBrand}>
                    <span style={styles.brandAlex}>ALEX</span>
                    <span style={styles.brandUltra}>ULTRA</span>
                  </div>

                  <div style={styles.navTabs}>
                    {['youtube', 'twitch', 'movies', 'xbox', 'radio'].map(m => (
                      <button key={m} onClick={() => {setMode(m); setSelectedVideo(null)}} style={mode === m ? styles.tabActive : styles.tab}>
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={searchMedia} style={styles.searchContainer}>
                    <input 
                      style={styles.searchInp} 
                      placeholder={`Buscar en ${mode.toUpperCase()}...`} 
                      value={query} 
                      onChange={e => setQuery(e.target.value)}
                    />
                  </form>

                  <div style={styles.userProfile}>
                    <img src={user.photoURL} style={styles.avatar} alt="avatar" />
                    <button onClick={() => setIsAdminOpen(true)} style={styles.adminEntryBtn}>ALEX CC</button>
                    <button onClick={() => signOut(auth)} style={styles.exitBtn}>SALIR</button>
                  </div>
                </div>
              </nav>

              <main style={styles.mainContent}>
                {loadingContent && <div style={styles.loadingOverlay}><div className="spinner"></div></div>}
                
                {mode === 'youtube' && (
                  <div style={styles.youtubeGrid}>
                    {selectedVideo ? (
                      <div style={styles.videoPlayerXL}>
                        <iframe 
                          src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`}
                          style={styles.fullIframe}
                          allowFullScreen
                        />
                        <button onClick={() => setSelectedVideo(null)} style={styles.closePlayerBtn}>CERRAR VIDEO</button>
                      </div>
                    ) : (
                      videos.map((vid, idx) => (
                        <div key={idx} style={styles.videoCard} onClick={() => setSelectedVideo(vid.id.videoId)}>
                          <img src={vid.snippet.thumbnails.high.url} style={styles.cardImg} alt="thumb" />
                          <div style={styles.cardData}>
                            <h3 style={styles.cardTitle}>{vid.snippet.title}</h3>
                            <p style={styles.cardChan}>{vid.snippet.channelTitle}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {mode !== 'youtube' && (
                  <div style={styles.externalFrame}>
                    <iframe 
                      src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                           mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                           mode === 'xbox' ? "https://www.xbox.com/play" : "https://www.radio.net/"}
                      style={styles.fullIframe}
                    />
                  </div>
                )}
              </main>
            </>
          )}
        </>
      )}

      {/* MODAL DE LOGIN ADMIN (PROTEGIDO) */}
      {showAlexLogin && (
        <div style={styles.modalBackdrop}>
          <div style={styles.adminLoginCard}>
            <h2>CONTROL CRÍTICO</h2>
            <input 
              type="password" 
              placeholder="PASSCODE" 
              style={styles.passInput} 
              value={alexPassInput} 
              onChange={e => setAlexPassInput(e.target.value)}
              autoFocus
            />
            <div style={styles.modalBtns}>
              <button onClick={() => {
                if (alexPassInput === ADMIN_PASS) { setIsAdminOpen(true); setShowAlexLogin(false); setAlexPassInput(''); }
                else { addNotification("ACCESO DENEGADO", "error"); }
              }} style={styles.modalBtnEnter}>CONFIRMAR</button>
              <button onClick={() => setShowAlexLogin(false)} style={styles.modalBtnClose}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* FRAME ADMINISTRADOR (COMMAND CENTER) */}
      {isAdminOpen && (
        <div style={styles.fullAdminFrame}>
          <header style={styles.adminHeader}>
            <h1>ALEX HUB COMMAND CENTER <span style={{fontSize: '10px'}}>v13.0.9</span></h1>
            <div style={styles.adminNav}>
              <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? styles.aTabOn : styles.aTab}>USUARIOS</button>
              <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.aTabOn : styles.aTab}>AUDITORÍA</button>
              <button onClick={() => setIsAdminOpen(false)} style={styles.exitAdmin}>CERRAR CONSOLA</button>
            </div>
          </header>

          <div style={styles.adminBody}>
            {adminTab === 'users' ? (
              <div style={styles.adminGrid}>
                {/* COLUMNA WHITELIST */}
                <div style={styles.adminCol}>
                  <h3 style={{color: '#00ff00'}}>ACCESO (WHITELIST)</h3>
                  <div style={styles.adminInpRow}>
                    <input 
                      value={newEmailInput} 
                      onChange={e => setNewEmailInput(e.target.value)} 
                      placeholder="correo@gmail.com / .eu" 
                      style={styles.adminInp}
                    />
                    <button onClick={() => modifyUser('whitelist', newEmailInput, 'add')} style={styles.adminBtnAdd}>+</button>
                  </div>
                  <div style={styles.adminList}>
                    {Object.values(whitelist).map(u => (
                      <div key={u.email} style={styles.adminItem}>
                        <span>{u.email}</span>
                        <button onClick={() => modifyUser('whitelist', u.email, 'remove')} style={styles.adminBtnRem}>QUITAR</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA BLACKLIST */}
                <div style={styles.adminCol}>
                  <h3 style={{color: '#ff0000'}}>BLOQUEO (BAN)</h3>
                  <div style={styles.adminInpRow}>
                    <input 
                      value={newEmailInput} 
                      onChange={e => setNewEmailInput(e.target.value)} 
                      placeholder="correo@gmail.com" 
                      style={styles.adminInp}
                    />
                    <button onClick={() => modifyUser('blacklist', newEmailInput, 'add')} style={styles.adminBtnBan}>BAN</button>
                  </div>
                  <div style={styles.adminList}>
                    {Object.values(blacklist).map(u => (
                      <div key={u.email} style={styles.adminItem}>
                        <span>{u.email}</span>
                        <button onClick={() => modifyUser('blacklist', u.email, 'remove')} style={styles.adminBtnUnban}>PERDONAR</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.logView}>
                {systemLogs.map((l, i) => (
                  <div key={i} style={styles.logLine}>
                    <span style={{color: '#555'}}>[{l.time}]</span> <b>{l.user}:</b> {l.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>SISTEMA FIREBASE: CONECTADO</span>
        <span>MODO: SUPREME V13</span>
        <span>© ALEX HUB 2026</span>
      </footer>
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE ESTILOS (PRO)
// ==========================================
const styles = {
  app: { height: '100vh', width: '100vw', background: '#000', color: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' },
  panicBtn: { position: 'fixed', bottom: '40px', right: '40px', background: '#ff0000', color: '#fff', border: 'none', padding: '20px 40px', borderRadius: '15px', fontWeight: '900', fontSize: '18px', zIndex: 99999, cursor: 'pointer', boxShadow: '0 0 30px rgba(255,0,0,0.6)', transition: '0.2s' },
  loaderPage: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  loadText: { letterSpacing: '8px', color: '#ff0000', marginTop: '20px' },
  
  // NAV
  nav: { height: '80px', background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', zIndex: 1000 },
  navContainer: { height: '100%', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' },
  navBrand: { display: 'flex', flexDirection: 'column' },
  brandAlex: { fontSize: '24px', fontWeight: '900' },
  brandUltra: { fontSize: '10px', color: '#ff0000', fontWeight: 'bold' },
  navTabs: { display: 'flex', gap: '10px' },
  tab: { background: '#111', border: 'none', color: '#555', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  tabActive: { background: '#ff0000', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  searchContainer: { flex: 1, maxWidth: '500px', margin: '0 30px' },
  searchInp: { width: '100%', background: '#000', border: '1px solid #222', padding: '12px 20px', borderRadius: '30px', color: '#fff' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #ff0000' },
  adminEntryBtn: { background: '#ff0000', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  exitBtn: { background: 'transparent', border: 'none', color: '#555', cursor: 'pointer' },

  // MAIN
  mainContent: { flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' },
  youtubeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' },
  videoCard: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #111' },
  cardImg: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardData: { padding: '15px' },
  cardTitle: { fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', height: '40px', overflow: 'hidden' },
  cardChan: { fontSize: '12px', color: '#555' },
  
  // PLAYER XL
  videoPlayerXL: { gridColumn: '1/-1', height: '80vh', position: 'relative', background: '#000', borderRadius: '20px', overflow: 'hidden' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  closePlayerBtn: { position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', padding: '15px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  externalFrame: { width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden' },

  // ADMIN FRAME
  fullAdminFrame: { position: 'fixed', inset: '20px', background: '#050505', zIndex: 10000, borderRadius: '25px', border: '1px solid #333', display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '25px 40px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminNav: { display: 'flex', gap: '15px' },
  aTab: { background: 'transparent', border: 'none', color: '#444', fontWeight: 'bold', cursor: 'pointer' },
  aTabOn: { background: 'transparent', border: 'none', color: '#00ff00', fontWeight: 'bold', borderBottom: '2px solid #00ff00' },
  adminBody: { flex: 1, padding: '40px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  adminCol: { background: '#0a0a0a', padding: '25px', borderRadius: '20px' },
  adminInpRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  adminInp: { flex: 1, background: '#000', border: '1px solid #222', padding: '12px', color: '#fff', borderRadius: '8px' },
  adminBtnAdd: { background: '#00ff00', color: '#000', border: 'none', width: '50px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' },
  adminBtnBan: { background: '#ff0000', color: '#fff', border: 'none', width: '60px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  adminList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  adminItem: { background: '#000', padding: '12px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  adminBtnRem: { background: '#111', color: '#ff0000', border: 'none', cursor: 'pointer' },
  adminBtnUnban: { background: '#00ff00', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' },
  exitAdmin: { background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

  // LOGIN PAGE
  loginFrame: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #111 0%, #000 100%)' },
  loginBox: { background: 'rgba(10,10,10,0.8)', padding: '60px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', backdropFilter: 'blur(20px)' },
  mainTitle: { fontSize: '45px', fontWeight: '900', letterSpacing: '10px' },
  subTitle: { color: '#444', fontSize: '12px', marginTop: '10px', letterSpacing: '3px' },
  loginActionArea: { margin: '50px 0' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '18px 40px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', margin: '0 auto' },
  alexTrigger: { background: 'none', border: 'none', color: '#222', fontSize: '11px', cursor: 'pointer', marginTop: '30px' },

  // MODALS
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  adminLoginCard: { background: '#0a0a0a', padding: '40px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center', width: '350px' },
  passInput: { width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '10px', textAlign: 'center', fontSize: '24px', marginBottom: '20px' },
  modalBtns: { display: 'flex', gap: '10px' },
  modalBtnEnter: { flex: 1, background: '#ff0000', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold' },
  modalBtnClose: { flex: 1, background: '#222', color: '#555', border: 'none', padding: '12px', borderRadius: '8px' },

  // NOTIFS
  notifWrapper: { position: 'fixed', top: '25px', right: '25px', zIndex: 100000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notifItem: { background: '#111', color: '#fff', padding: '15px 30px', borderRadius: '10px', borderLeft: '5px solid', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  
  footer: { height: '50px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', fontSize: '10px', color: '#333' }
};

// --- INYECCIÓN CSS DINÁMICO ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body { margin: 0; background: #000; overflow: hidden; }
    .spinner { width: 50px; height: 50px; border: 3px solid #111; border-top-color: #ff0000; border-radius: 50%; animation: rot 0.8s linear infinite; }
    @keyframes rot { to { transform: rotate(360deg); } }
    .videoCard:hover { transform: translateY(-10px); border-color: #ff0000; transition: 0.3s; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
  `;
  document.head.appendChild(style);
}
