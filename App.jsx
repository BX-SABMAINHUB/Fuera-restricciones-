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
 * ALEX HUB ULTRA V13 - RECONSTRUCCIÓN TOTAL DE SISTEMAS
 * ============================================================================
 * SOLUCIÓN: AUTH PERSISTENCE + DATABASE SANITIZATION + PANIC PROTOCOL
 * STATUS: 100% OPERATIVO
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

// NUEVA API KEY DE YOUTUBE PROPORCIONADA
const YT_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4";
const MASTER_KEY = "Alex2706";

export default function AlexHubUltraV13() {
  // --- SEGURIDAD Y SESIÓN ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // --- BASE DE DATOS REALTIME ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [logs, setLogs] = useState([]);

  // --- UI Y NAVEGACIÓN ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  
  // --- PANEL ADMIN ---
  const [showAlexModal, setShowAlexModal] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminMailInput, setAdminMailInput] = useState('');
  const [currentTab, setCurrentTab] = useState('users');
  const [notifs, setNotifs] = useState([]);

  // ==========================================
  // LÓGICA DE PERSISTENCIA Y CORRECCIÓN DE AUTH
  // ==========================================
  
  // Función crítica: Sanitiza el email para evitar errores de base de datos (.com, .eu, etc)
  const formatKey = (email) => {
    if (!email) return "anonymous";
    return email.toLowerCase().replace(/\./g, '_dot_').replace(/@/g, '_at_');
  };

  useEffect(() => {
    // FIX: Asegura que la sesión persista y no de error de 'missing initial state'
    setPersistence(auth, browserLocalPersistence).then(() => {
      return onAuthStateChanged(auth, (u) => {
        if (u) {
          setUser(u);
          validatePermissions(u.email);
        } else {
          setUser(null);
          setAccessGranted(false);
          setAuthLoading(false);
        }
      });
    });

    // Escuchadores de DB con corrección de carga
    const refs = {
      white: ref(db, 'whitelist'),
      black: ref(db, 'blacklist'),
      prem: ref(db, 'premium'),
      logs: ref(db, 'logs')
    };

    const unsubscribes = [
      onValue(refs.white, s => setWhitelist(s.val() || {})),
      onValue(refs.black, s => setBlacklist(s.val() || {})),
      onValue(refs.prem, s => setPremiumUsers(s.val() || {})),
      onValue(refs.logs, s => {
        const data = s.val() || {};
        setLogs(Object.values(data).reverse().slice(0, 60));
      })
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const validatePermissions = (email) => {
    const key = formatKey(email);
    // Verificar Ban primero
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
            setLoginError("TU CORREO NO TIENE PERMISO DE ACCESO (WHITELIST)");
          }
        });
      }
      setAuthLoading(false);
    });
  };

  // ==========================================
  // PROTOCOLO DE PÁNICO
  // ==========================================
  const executePanic = () => {
    // Intento de abrir la App ManageBac directamente (Deep Link)
    window.location.href = "managebac://";
    
    // Inmediatamente después, redirigir y tratar de cerrar la pestaña
    setTimeout(() => {
      // Si el deep link falla, abrir la web en una nueva y cerrar esta
      const win = window.open("https://managebac.com", "_blank");
      if (win) {
        window.opener = null;
        window.open("", "_self");
        window.close();
      }
    }, 200);
  };

  // ==========================================
  // COMANDOS DE CONTROL (FIXED)
  // ==========================================
  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setLoginError("ERROR DE SESIÓN: Prueba a usar ventana de incógnito o limpiar caché.");
    }
  };

  const manageUser = async (targetPath, targetEmail, action) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      return pushNotif("EMAIL INVÁLIDO", "error");
    }
    
    const key = formatKey(targetEmail);
    const dbRef = ref(db, `${targetPath}/${key}`);

    try {
      if (action === 'add') {
        await set(dbRef, {
          email: targetEmail,
          addedBy: user?.email,
          timestamp: serverTimestamp()
        });
        pushNotif(`SISTEMA: ${targetEmail} AÑADIDO`, "success");
      } else {
        await remove(dbRef);
        pushNotif(`SISTEMA: ${targetEmail} ELIMINADO`, "info");
      }
      setAdminMailInput('');
      addLog(`ADMIN ACTION: ${action} on ${targetEmail} in ${targetPath}`);
    } catch (error) {
      pushNotif("ERROR DE BASE DE DATOS", "error");
    }
  };

  const addLog = (msg) => {
    push(ref(db, 'logs'), {
      msg,
      u: user?.email || 'System',
      t: new Date().toISOString()
    });
  };

  const pushNotif = (text, type) => {
    const id = Date.now();
    setNotifs(p => [...p, { id, text, type }]);
    setTimeout(() => setNotifs(p => p.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // MOTOR MULTIMEDIA XL
  // ==========================================
  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&q=${query}&type=video&key=${YT_KEY}`);
        const d = await r.json();
        setVideos(d.items || []);
        setSelectedVideo(null);
      }
      addLog(`SEARCH: [${mode}] ${query}`);
    } catch (err) {
      pushNotif("ERROR API YOUTUBE", "error");
    }
    setLoadingContent(false);
  };

  // --- COMPONENTES DE RENDER ---

  if (authLoading) return (
    <div style={css.loaderCont}>
      <div className="spinner"></div>
      <h2 style={{color: '#ff0000', letterSpacing: '10px'}}>ALEX HUB</h2>
    </div>
  );

  return (
    <div style={css.app}>
      
      {/* BOTÓN PÁNICO - SIEMPRE VISIBLE */}
      <button onClick={executePanic} style={css.panicButton}>PÁNICO</button>

      {/* SISTEMA DE NOTIFICACIONES */}
      <div style={css.notifStack}>
        {notifs.map(n => (
          <div key={n.id} style={{...css.notif, borderLeftColor: n.type === 'error' ? '#ff0000' : '#00ff00'}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={css.banScreen}>
          <div style={css.banBox}>
            <h1 style={css.glitch}>ACCESO DENEGADO</h1>
            <p>Tu cuenta ha sido bloqueada permanentemente por un administrador.</p>
            <button onClick={() => { signOut(auth); window.location.reload(); }} style={css.primaryBtn}>SALIR</button>
          </div>
        </div>
      ) : !accessGranted ? (
        <div style={css.loginPage}>
          <div style={css.loginCard}>
            <h1 style={css.mainTitle}>ALEX HUB <span style={{color: '#ff0000'}}>ULTRA</span></h1>
            <p style={css.subTitle}>SISTEMA DE GESTIÓN V13.0.9</p>
            
            <div style={{margin: '50px 0'}}>
              <button onClick={handleGoogleLogin} style={css.googleBtn}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" />
                INGRESAR CON GOOGLE
              </button>
              {loginError && <p style={css.err}>{loginError}</p>}
            </div>

            <button onClick={() => setShowAlexModal(true)} style={css.adminTrigger}>ACCESO ALEX (CONTRASEÑA)</button>
          </div>
        </div>
      ) : (
        <>
          {/* INTERFAZ PRINCIPAL */}
          <nav style={css.navbar}>
            <div style={css.navSection}>
              <div style={css.brandBox}>
                <span style={{fontWeight: 900}}>ALEX</span>
                <span style={{color: '#ff0000', fontSize: '10px'}}>ULTRA V13</span>
              </div>
              <div style={css.tabList}>
                {['youtube', 'twitch', 'movies', 'radio'].map(t => (
                  <button key={t} onClick={() => {setMode(t); setSelectedVideo(null);}} 
                    style={mode === t ? css.activeTab : css.tab}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={performSearch} style={css.searchForm}>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Buscar en ${mode}...`} style={css.searchInp} />
            </form>

            <div style={css.navSection}>
              <div style={css.userProfile}>
                <img src={user.photoURL} style={css.userImg} />
                <div style={css.userMeta}>
                  <span style={{fontSize: '11px', fontWeight: 'bold'}}>{user.displayName}</span>
                  <button onClick={() => signOut(auth)} style={css.logoutBtn}>CERRAR SESIÓN</button>
                </div>
              </div>
              <button onClick={() => setShowAlexModal(true)} style={css.alexBtn}>ALEX</button>
            </div>
          </nav>

          <main style={css.content}>
            {loadingContent && <div style={css.loadingOverlay}><div className="spinner"></div></div>}

            {mode === 'youtube' && !selectedVideo && (
              <div style={css.grid}>
                {videos.map((v, i) => (
                  <div key={i} style={css.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                    <img src={v.snippet.thumbnails.high.url} style={css.thumb} />
                    <div style={css.cardInfo}>
                      <p style={css.vTitle}>{v.snippet.title}</p>
                      <p style={css.vChan}>{v.snippet.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(selectedVideo || mode !== 'youtube') && (
              <div style={css.xlPlayer}>
                <iframe 
                  src={selectedVideo ? `https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0` : 
                       mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` : ""}
                  style={css.fullIframe}
                  allowFullScreen
                />
                {selectedVideo && <button onClick={() => setSelectedVideo(null)} style={css.closeXl}>SALIR DEL MODO CINE</button>}
              </div>
            )}
          </main>
        </>
      )}

      {/* PANEL DE CONTROL ADMINISTRATIVO (ALEX COMMAND CENTER) */}
      {isAdminOpen && (
        <div style={css.adminModal}>
          <div style={css.adminBar}>
            <h2>COMMAND CENTER | ADMIN: {user?.email}</h2>
            <div style={css.adminTabs}>
              <button onClick={() => setCurrentTab('users')} style={currentTab === 'users' ? css.aTabAct : css.aTab}>USUARIOS</button>
              <button onClick={() => setCurrentTab('logs')} style={currentTab === 'logs' ? css.aTabAct : css.aTab}>REGISTROS</button>
              <button onClick={() => setIsAdminOpen(false)} style={css.closeAdminBtn}>CERRAR PANEL</button>
            </div>
          </div>

          <div style={css.adminBody}>
            {currentTab === 'users' ? (
              <div style={css.adminGrid}>
                {/* COLUMNA WHITELIST */}
                <div style={css.adminCol}>
                  <h3 style={{color: '#00ff00'}}>✓ CORREOS VERIFICADOS (WHITELIST)</h3>
                  <div style={css.inputRow}>
                    <input value={adminMailInput} onChange={e=>setAdminMailInput(e.target.value)} placeholder="ejemplo@gmail.eu" style={css.adminInp} />
                    <button onClick={() => manageUser('whitelist', adminMailInput, 'add')} style={css.addBtn}>AÑADIR</button>
                  </div>
                  <div style={css.scrollList}>
                    {Object.values(whitelist).map(u => (
                      <div key={u.email} style={css.listItem}>
                        <span>{u.email}</span>
                        <button onClick={() => manageUser('whitelist', u.email, 'remove')} style={css.delBtn}>QUITAR</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA BLACKLIST */}
                <div style={css.adminCol}>
                  <h3 style={{color: '#ff0000'}}>⚠ CORREOS BANEADOS (BLACKLIST)</h3>
                  <div style={css.inputRow}>
                    <input value={adminMailInput} onChange={e=>setAdminMailInput(e.target.value)} placeholder="ejemplo@gmail.com" style={css.adminInp} />
                    <button onClick={() => manageUser('blacklist', adminMailInput, 'add')} style={css.banBtnAction}>BANEAR</button>
                  </div>
                  <div style={css.scrollList}>
                    {Object.values(blacklist).map(u => (
                      <div key={u.email} style={css.listItem}>
                        <span>{u.email}</span>
                        <button onClick={() => manageUser('blacklist', u.email, 'remove')} style={css.unbanBtn}>PERDONAR BAN</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={css.logBox}>
                {logs.map((l, i) => (
                  <div key={i} style={css.logLine}>
                    <span style={{color: '#555'}}>[{l.t}]</span> <b style={{color: '#ff0000'}}>{l.u}:</b> {l.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONTRASEÑA OBLIGATORIA */}
      {showAlexModal && (
        <div style={css.overlay}>
          <div style={css.passCard}>
            <h3>PROTECCIÓN NIVEL 1</h3>
            <p style={{fontSize: '10px', color: '#666'}}>INGRESE CONTRASEÑA DE ADMINISTRADOR</p>
            <input 
              type="password" 
              autoFocus
              value={passInput} 
              onChange={e=>setPassInput(e.target.value)} 
              style={css.passwordInp}
              onKeyPress={e => e.key === 'Enter' && (passInput === MASTER_KEY ? (setIsAdminOpen(true), setShowAlexModal(false), setPassInput('')) : pushNotif("CLAVE INCORRECTA", "error"))}
            />
            <div style={css.passActions}>
              <button onClick={() => {
                if(passInput === MASTER_KEY) {
                  setIsAdminOpen(true);
                  setShowAlexModal(false);
                  setPassInput('');
                  pushNotif("ACCESO CONCEDIDO", "success");
                } else {
                  pushNotif("CLAVE INCORRECTA", "error");
                }
              }} style={css.confirmBtn}>ACCEDER</button>
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
  app: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', fontFamily: 'system-ui' },
  loaderCont: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  panicButton: { position: 'fixed', bottom: '25px', right: '25px', background: '#ff0000', color: '#fff', border: 'none', padding: '20px 40px', borderRadius: '50px', fontWeight: '900', zIndex: 99999, cursor: 'pointer', boxShadow: '0 0 30px rgba(255,0,0,0.6)', border: '2px solid #fff' },
  
  // LOGIN
  loginPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #111, #000)' },
  loginCard: { background: 'rgba(10,10,10,0.8)', padding: '60px', borderRadius: '40px', border: '1px solid #222', textAlign: 'center', backdropFilter: 'blur(10px)' },
  mainTitle: { fontSize: '50px', fontWeight: '900', letterSpacing: '8px', margin: 0 },
  subTitle: { color: '#444', fontSize: '10px', letterSpacing: '4px' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', margin: '0 auto' },
  err: { color: '#ff0000', marginTop: '15px', fontSize: '12px' },
  adminTrigger: { background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '12px' },

  // NAV
  navbar: { height: '80px', background: '#050505', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' },
  navSection: { display: 'flex', alignItems: 'center', gap: '20px' },
  brandBox: { display: 'flex', flexDirection: 'column', lineHeight: '1' },
  tabList: { display: 'flex', gap: '5px' },
  tab: { background: '#111', border: 'none', color: '#555', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  activeTab: { background: '#ff0000', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px' },
  searchForm: { flex: 1, maxWidth: '500px' },
  searchInp: { width: '100%', background: '#111', border: '1px solid #222', padding: '12px', borderRadius: '10px', color: '#fff' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '10px', background: '#111', padding: '5px 15px', borderRadius: '30px' },
  userImg: { width: '35px', height: '35px', borderRadius: '50%' },
  userMeta: { display: 'flex', flexDirection: 'column' },
  logoutBtn: { background: 'none', border: 'none', color: '#ff0000', fontSize: '9px', cursor: 'pointer', textAlign: 'left', padding: 0 },
  alexBtn: { background: '#ff0000', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  // CONTENT
  content: { flex: 1, padding: '30px', overflowY: 'auto', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px' },
  vTitle: { fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px 0' },
  vChan: { color: '#555', fontSize: '12px' },
  xlPlayer: { width: '100%', height: '85vh', position: 'relative', background: '#000', borderRadius: '20px', overflow: 'hidden' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  closeXl: { position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' },

  // ADMIN PANEL
  adminModal: { position: 'fixed', inset: '30px', background: '#050505', border: '1px solid #333', borderRadius: '30px', zIndex: 10000, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminBar: { padding: '20px 40px', background: '#000', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminTabs: { display: 'flex', gap: '15px' },
  aTab: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontWeight: 'bold' },
  aTabAct: { background: 'none', border: 'none', color: '#fff', borderBottom: '2px solid #ff0000', cursor: 'pointer', fontWeight: 'bold' },
  adminBody: { flex: 1, padding: '40px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  adminCol: { background: '#0a0a0a', padding: '25px', borderRadius: '20px', border: '1px solid #1a1a1a' },
  inputRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  adminInp: { flex: 1, background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff' },
  scrollList: { height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  listItem: { background: '#050505', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { background: '#00ff00', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  banBtnAction: { background: '#ff0000', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  delBtn: { background: '#1a1a1a', color: '#ff0000', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff00', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  closeAdminBtn: { background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  
  // LOGS
  logBox: { background: '#000', padding: '30px', borderRadius: '20px', fontFamily: 'monospace', fontSize: '12px' },
  logLine: { padding: '5px 0', borderBottom: '1px solid #111' },

  // NOTIFS & OVERLAYS
  notifStack: { position: 'fixed', top: '25px', right: '25px', zIndex: 100000, display: 'flex', flexDirection: 'column', gap: '10px' },
  notif: { background: '#0a0a0a', color: '#fff', padding: '15px 30px', borderRadius: '10px', borderLeft: '5px solid', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, backdropFilter: 'blur(10px)' },
  passCard: { background: '#0a0a0a', padding: '50px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', width: '400px' },
  passwordInp: { width: '100%', background: '#000', border: '1px solid #ff0000', padding: '20px', borderRadius: '15px', color: '#fff', fontSize: '24px', textAlign: 'center', margin: '20px 0', outline: 'none' },
  confirmBtn: { background: '#ff0000', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: 'none', border: 'none', color: '#444', padding: '15px', cursor: 'pointer' },
  banScreen: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  banBox: { textAlign: 'center', padding: '60px', border: '2px solid #ff0000', borderRadius: '40px' }
};

// --- INYECCIÓN DE ANIMACIONES ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .spinner { width: 50px; height: 50px; border: 5px solid #111; border-top-color: #ff0000; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .card:hover { transform: scale(1.02); border-color: #ff0000; transition: 0.3s; }
  `;
  document.head.appendChild(style);
}
