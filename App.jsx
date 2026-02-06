import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, update, push, get 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - THE GOD MODE RECONSTRUCTION
 * ============================================================================
 * SOFTWARE DE GESTIÓN MULTIMEDIA Y CONTROL DE ACCESO PROFESIONAL
 * VERSIÓN: 13.0.9-REBUILD
 * ============================================================================
 */

// --- CONFIGURACIÓN FIREBASE (PROD) ---
const firebaseConfig = {
  apiKey: "AIzaSyD1zUmhiUVDv-ZYyJF7vTwGaS1AO9t9jiE",
  authDomain: "alexhub-eefdf.firebaseapp.com",
  databaseURL: "https://alexhub-eefdf-default-rtdb.firebaseio.com",
  projectId: "alexhub-eefdf",
  storageBucket: "alexhub-eefdf.firebasestorage.app",
  messagingSenderId: "463204402982",
  appId: "1:463204402982:web:fe740a662fbfd50452a3e7"
};

// --- INICIALIZACIÓN ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- CONSTANTES MAESTRAS ---
const YT_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const MASTER_PASS = "Alex2706";
const SYSTEM_V = "13.0.9-ULTRA-MAX";

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
  const [logs, setLogs] = useState([]);

  // --- NAVEGACIÓN ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // --- PANEL ADMIN (ALEX) ---
  const [showAlexModal, setShowAlexModal] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminMailInput, setAdminMailInput] = useState('');
  const [adminTab, setAdminTab] = useState('users');

  // --- UI ---
  const [notifications, setNotifications] = useState([]);
  const theme = { primary: '#E50914', bg: '#000', card: '#0a0a0a', accent: '#00ff41' };

  // ==========================================
  // 1. NÚCLEO DE SEGURIDAD Y SANITIZACIÓN
  // ==========================================

  // Función Vital: Sanitiza emails para que NO den error en la DB (soporta .eu, .com, etc)
  const sanitizeKey = (email) => {
    if (!email) return "unknown";
    return email.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_');
  };

  useEffect(() => {
    // Configurar persistencia para evitar el error "missing initial state"
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return onAuthStateChanged(auth, (u) => {
          if (u) {
            setUser(u);
            checkUserPermissions(u.email);
            addLog(`Inicio de sesión detectado: ${u.email}`);
          } else {
            setUser(null);
            setAccessGranted(false);
            setAuthLoading(false);
          }
        });
      });

    // Suscripciones en tiempo real
    const unsub = [
      onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {})),
      onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {})),
      onValue(ref(db, 'premium'), (s) => setPremiumUsers(s.val() || {})),
      onValue(ref(db, 'logs'), (s) => {
        const data = s.val() || {};
        setLogs(Object.values(data).reverse().slice(0, 50));
      })
    ];

    return () => unsub.forEach(f => f());
  }, []);

  const checkUserPermissions = useCallback((email) => {
    const key = sanitizeKey(email);
    
    // Verificación secuencial de seguridad
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        onValue(ref(db, `whitelist/${key}`), (whiteSnap) => {
          if (whiteSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("NO TIENES ACCESO: Contacta con Alex para entrar en la Whitelist.");
          }
        });
      }
      setAuthLoading(false);
    });
  }, []);

  // ==========================================
  // 2. SISTEMA DE PÁNICO (MANAGEBAC)
  // ==========================================
  const triggerPanicButton = () => {
    // Intenta abrir la App directamente usando el esquema de URL
    window.location.href = "managebac://";
    
    // Inmediatamente cierra la pestaña actual y redirige a la web por si falla la app
    setTimeout(() => {
      window.open("https://managebac.com", "_blank");
      window.close();
      // Si window.close() es bloqueado por el navegador, forzamos redirección
      window.location.replace("https://managebac.com");
    }, 150);
  };

  // ==========================================
  // 3. COMANDOS ADMINISTRATIVOS (FIXED)
  // ==========================================
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      addNotification("Conectando con Google...", "info");
    } catch (error) {
      setLoginError("ERROR DE AUTENTICACIÓN: El navegador bloqueó el estado inicial.");
    }
  };

  const manageSystemAccess = async (table, email, action) => {
    if (!email.includes('@')) return addNotification("EMAIL NO VÁLIDO", "error");
    const key = sanitizeKey(email);
    
    try {
      if (action === 'add') {
        await set(ref(db, `${table}/${key}`), {
          email: email,
          timestamp: serverTimestamp(),
          authorizedBy: user?.email || 'Alex Master'
        });
        addNotification(`${email} AÑADIDO CON ÉXITO`, "success");
      } else {
        await remove(ref(db, `${table}/${key}`));
        addNotification(`${email} ELIMINADO CON ÉXITO`, "info");
      }
      setAdminMailInput('');
      addLog(`ADMIN ACTION: ${action} on ${email} in ${table}`);
    } catch (e) {
      addNotification("ERROR EN BASE DE DATOS", "error");
    }
  };

  const addLog = (msg) => {
    push(ref(db, 'logs'), {
      msg,
      u: auth.currentUser?.email || 'Visitante',
      t: new Date().toISOString()
    });
  };

  const addNotification = (text, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // 4. MOTOR MULTIMEDIA XL
  // ==========================================
  const runSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${query}&type=video&key=${YT_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
        setSelectedVideo(null);
      }
      addLog(`SEARCH: [${mode}] ${query}`);
    } catch (err) {
      addNotification("ERROR DE API YOUTUBE", "error");
    }
    setLoadingContent(false);
  };

  // --- COMPONENTES DE INTERFAZ ---

  if (authLoading) return (
    <div style={css.fullLoader}>
      <div className="loader"></div>
      <h1 style={{letterSpacing: '10px', color: theme.primary}}>CARGANDO ALEX HUB</h1>
    </div>
  );

  return (
    <div style={css.mainApp}>
      
      {/* BOTÓN DE PÁNICO FLOTANTE */}
      <button onClick={triggerPanicButton} style={css.panicBtn}>BOTÓN PÁNICO</button>

      {/* STACK DE NOTIFICACIONES */}
      <div style={css.notifArea}>
        {notifications.map(n => (
          <div key={n.id} style={{...css.notif, borderLeft: `5px solid ${n.type === 'error' ? '#ff0000' : '#00ff00'}`}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={css.bannedUI}>
          <div style={css.bannedCard}>
            <h1 className="glitch">SISTEMA BLOQUEADO</h1>
            <p>Tu cuenta ha sido expulsada. Consulta con el administrador.</p>
            <button onClick={() => {signOut(auth); window.location.reload();}} style={css.primaryBtn}>VOLVER</button>
          </div>
        </div>
      ) : !accessGranted ? (
        <div style={css.loginView}>
          <div style={css.loginBox}>
            <h1 style={css.title}>ALEX HUB <span style={{color: theme.primary}}>ULTRA</span></h1>
            <p style={css.ver}>VERSION {SYSTEM_V}</p>
            
            <div style={{margin: '40px 0'}}>
              <button onClick={handleGoogleLogin} style={css.googleBtn}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" width="20" alt="G" />
                ACCESO GOOGLE
              </button>
              {loginError && <p style={css.errorLabel}>{loginError}</p>}
            </div>

            <button onClick={() => setShowAlexModal(true)} style={css.alexTrigger}>ADMIN LOGIN (ALEX)</button>
          </div>
        </div>
      ) : (
        <>
          {/* DASHBOARD PRINCIPAL */}
          <nav style={css.nav}>
            <div style={css.navLeft}>
              <div style={css.logo}>
                ALEX <span style={{color: theme.primary, fontSize: '12px'}}>V13</span>
              </div>
              <div style={css.tabs}>
                {['youtube', 'twitch', 'movies', 'radio'].map(m => (
                  <button key={m} onClick={() => {setMode(m); setSelectedVideo(null);}} 
                    style={mode === m ? css.activeTab : css.tab}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={runSearch} style={css.searchWrap}>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Buscar en ${mode}...`} style={css.searchInp} />
              <button type="submit" style={css.searchBtn}>🔍</button>
            </form>

            <div style={css.navRight}>
              <div style={css.userBox}>
                <img src={user.photoURL} style={css.avatar} alt="u" />
                <div style={css.userMeta}>
                  <span style={css.uName}>{user.displayName}</span>
                  <button onClick={() => signOut(auth)} style={css.logoutLink}>SALIR</button>
                </div>
              </div>
              <button onClick={() => setShowAlexModal(true)} style={css.adminActionBtn}>ALEX</button>
            </div>
          </nav>

          <main style={css.viewport}>
            {loadingContent && <div style={css.loadingScreen}><div className="loader"></div></div>}

            {mode === 'youtube' && (
              <div style={css.mediaContainer}>
                {selectedVideo ? (
                  <div style={css.xlPlayer}>
                    <iframe 
                      src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0&showinfo=0`} 
                      style={css.iframeXL} 
                      allowFullScreen 
                    />
                    <button onClick={() => setSelectedVideo(null)} style={css.closeMedia}>CERRAR REPRODUCTOR</button>
                  </div>
                ) : (
                  <div style={css.grid}>
                    {videos.map((v, i) => (
                      <div key={i} style={css.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                        <img src={v.snippet.thumbnails.high.url} style={css.thumb} alt="t" />
                        <div style={css.cardBody}>
                          <h4 style={css.vTitle}>{v.snippet.title}</h4>
                          <span style={css.vAuthor}>{v.snippet.channelTitle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode !== 'youtube' && (
              <div style={css.xlPlayer}>
                <iframe 
                  src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                       "https://www.radio.net/embed/los40"} 
                  style={css.iframeXL} 
                />
              </div>
            )}
          </main>
        </>
      )}

      {/* PANEL COMMAND CENTER (ALEX) */}
      {isAdminOpen && (
        <div style={css.adminOverlay}>
          <div style={css.adminPanel}>
            <div style={css.adminHeader}>
              <h2>ALEX COMMAND CENTER | NIVEL 1</h2>
              <div style={css.adminNav}>
                <button onClick={() => setAdminTab('users')} style={adminTab === 'users' ? css.aNavActive : css.aNav}>USUARIOS</button>
                <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? css.aNavActive : css.aNav}>LOGS</button>
                <button onClick={() => setIsAdminOpen(false)} style={css.closeAdmin}>X</button>
              </div>
            </div>

            <div style={css.adminContent}>
              {adminTab === 'users' ? (
                <div style={css.adminGrid}>
                  {/* WHITELIST CONTROL */}
                  <div style={css.adminSec}>
                    <h3 style={{color: '#00ff00'}}>✓ LISTA DE ACCESO (WHITELIST)</h3>
                    <div style={css.inpRow}>
                      <input value={adminMailInput} onChange={e=>setAdminMailInput(e.target.value)} placeholder="correo@gmail.eu" style={css.adminInp} />
                      <button onClick={() => manageSystemAccess('whitelist', adminMailInput, 'add')} style={css.addBtn}>AÑADIR</button>
                    </div>
                    <div style={css.listScroll}>
                      {Object.values(whitelist).map(u => (
                        <div key={u.email} style={css.listItem}>
                          <span>{u.email}</span>
                          <button onClick={() => manageSystemAccess('whitelist', u.email, 'remove')} style={css.delBtn}>QUITAR</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BLACKLIST CONTROL */}
                  <div style={css.adminSec}>
                    <h3 style={{color: '#ff0000'}}>🚫 BANEADOS (BLACKLIST)</h3>
                    <div style={css.inpRow}>
                      <input value={adminMailInput} onChange={e=>setAdminMailInput(e.target.value)} placeholder="correo@gmail.com" style={css.adminInp} />
                      <button onClick={() => manageSystemAccess('blacklist', adminMailInput, 'add')} style={css.banActionBtn}>BANEAR</button>
                    </div>
                    <div style={css.listScroll}>
                      {Object.values(blacklist).map(u => (
                        <div key={u.email} style={css.listItem}>
                          <span>{u.email}</span>
                          <button onClick={() => manageSystemAccess('blacklist', u.email, 'remove')} style={css.unbanBtn}>PERDONAR BAN</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={css.logBox}>
                  {logs.map((l, i) => (
                    <div key={i} style={css.logLine}>
                      <span style={{color: '#555'}}>[{l.t}]</span> <b style={{color: theme.primary}}>{l.u}:</b> {l.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONTRASEÑA OBLIGATORIA */}
      {showAlexModal && (
        <div style={css.passModal}>
          <div style={css.passCard}>
            <h3>SISTEMA PROTEGIDO</h3>
            <p style={{fontSize: '11px', color: '#666'}}>INGRESE LA CLAVE MAESTRA</p>
            <input 
              type="password" 
              autoFocus
              value={alexPassInput} 
              onChange={e=>setAlexPassInput(e.target.value)} 
              style={css.masterInp}
              onKeyPress={e => e.key === 'Enter' && (alexPassInput === MASTER_PASS ? (setIsAdminOpen(true), setShowAlexModal(false), setAlexPassInput('')) : addNotification("PASS ERRÓNEA", "error"))}
            />
            <div style={css.passBtns}>
              <button onClick={() => {
                if(alexPassInput === MASTER_PASS) {
                  setIsAdminOpen(true);
                  setShowAlexModal(false);
                  setAlexPassInput('');
                  addNotification("ACCESO CONCEDIDO", "success");
                } else {
                  addNotification("CLAVE INCORRECTA", "error");
                }
              }} style={css.confirmBtn}>ENTRAR</button>
              <button onClick={() => setShowAlexModal(false)} style={css.cancelBtn}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE ESTILOS CSS-IN-JS
// ==========================================
const css = {
  mainApp: { height: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  fullLoader: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  panicBtn: { position: 'fixed', bottom: '30px', right: '30px', background: '#ff0000', color: '#fff', border: '2px solid #fff', padding: '20px 40px', borderRadius: '50px', fontWeight: '900', zIndex: 999999, cursor: 'pointer', boxShadow: '0 0 20px rgba(255,0,0,0.5)' },
  
  // LOGIN UI
  loginView: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #111 0%, #000 100%)' },
  loginBox: { background: 'rgba(10,10,10,0.8)', padding: '60px', borderRadius: '40px', border: '1px solid #222', textAlign: 'center', backdropFilter: 'blur(15px)' },
  title: { fontSize: '45px', fontWeight: '900', letterSpacing: '8px', margin: 0 },
  ver: { color: '#444', fontSize: '10px', marginTop: '10px' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', margin: '0 auto' },
  alexTrigger: { background: 'none', border: 'none', color: '#333', cursor: 'pointer', marginTop: '20px' },
  errorLabel: { color: '#ff0000', marginTop: '15px', fontWeight: 'bold' },

  // NAV
  nav: { height: '80px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
  logo: { fontWeight: '900', fontSize: '24px', letterSpacing: '2px' },
  tabs: { display: 'flex', gap: '8px' },
  tab: { background: '#111', border: 'none', color: '#555', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold' },
  searchWrap: { flex: 1, maxWidth: '500px', display: 'flex', background: '#0a0a0a', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' },
  searchInp: { flex: 1, background: 'none', border: 'none', padding: '12px 20px', color: '#fff', outline: 'none' },
  searchBtn: { background: 'none', border: 'none', padding: '0 15px', cursor: 'pointer' },
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  userBox: { display: 'flex', alignItems: 'center', gap: '12px', background: '#0a0a0a', padding: '8px 15px', borderRadius: '30px' },
  avatar: { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' },
  uName: { fontSize: '12px', fontWeight: 'bold' },
  logoutLink: { background: 'none', border: 'none', color: '#ff0000', fontSize: '9px', padding: 0, cursor: 'pointer', textAlign: 'left' },
  adminActionBtn: { background: '#E50914', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  // CONTENT
  viewport: { flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.3s' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardBody: { padding: '15px' },
  vTitle: { fontSize: '14px', margin: '0 0 5px 0', height: '40px', overflow: 'hidden' },
  vAuthor: { color: '#555', fontSize: '11px' },
  xlPlayer: { width: '100%', height: '85vh', background: '#000', borderRadius: '25px', overflow: 'hidden', position: 'relative' },
  iframeXL: { width: '100%', height: '100%', border: 'none' },
  closeMedia: { position: 'absolute', top: '20px', right: '20px', background: '#E50914', color: '#fff', border: 'none', padding: '15px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  // ADMIN UI
  adminOverlay: { position: 'fixed', inset: '20px', background: '#000', border: '1px solid #333', borderRadius: '30px', zIndex: 10000, display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '20px 40px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminNav: { display: 'flex', gap: '15px' },
  aNav: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontWeight: 'bold' },
  aNavActive: { background: 'none', border: 'none', color: '#fff', borderBottom: '2px solid #E50914', cursor: 'pointer', fontWeight: 'bold' },
  closeAdmin: { background: '#333', color: '#fff', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' },
  adminContent: { flex: 1, padding: '40px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  adminSec: { background: '#0a0a0a', padding: '30px', borderRadius: '20px', border: '1px solid #1a1a1a' },
  inpRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  adminInp: { flex: 1, background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff' },
  listScroll: { height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  listItem: { background: '#050505', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  banActionBtn: { background: '#ff0000', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  delBtn: { background: '#222', color: '#ff4444', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer' },

  // NOTIFS & MODALS
  notifArea: { position: 'fixed', top: '20px', right: '20px', zIndex: 1000000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notif: { background: '#0a0a0a', color: '#fff', padding: '18px 30px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  passModal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50000, backdropFilter: 'blur(10px)' },
  passCard: { background: '#0a0a0a', padding: '50px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', width: '400px' },
  masterInp: { width: '100%', background: '#000', border: '1px solid #E50914', padding: '20px', borderRadius: '15px', color: '#fff', fontSize: '28px', textAlign: 'center', margin: '20px 0', outline: 'none' },
  passBtns: { display: 'flex', gap: '15px', justifyContent: 'center' },
  confirmBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '15px 35px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer' },
  
  logBox: { background: '#000', padding: '25px', borderRadius: '15px', fontFamily: 'monospace', border: '1px solid #111' },
  logLine: { padding: '6px 0', borderBottom: '1px solid #0a0a0a' },
  loadingScreen: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// --- INYECCIÓN DE CSS GLOBAL ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .loader { width: 50px; height: 50px; border: 4px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .card:hover { transform: translateY(-10px); border-color: #333; }
    .glitch { animation: pulse 1s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
  `;
  document.head.appendChild(style);
}
