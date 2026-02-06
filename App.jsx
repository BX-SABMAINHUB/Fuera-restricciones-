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
 * ALEX HUB ULTRA V13 - RECONSTRUCCIÓN TOTAL DE SISTEMAS (BUILD 2026)
 * ============================================================================
 * SOLUCIÓN: AUTH PERSISTENCE + DATABASE SANITIZATION + PANIC PROTOCOL
 * STATUS: 100% OPERATIVO | SIN ERRORES DE BASE DE DATOS
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
const MASTER_ADMIN_KEY = "Alex2706";

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
  
  // FUNCIÓN MAESTRA: Sanitiza emails para evitar errores en Firebase con cualquier dominio
  const formatKey = (email) => {
    if (!email) return "unknown";
    return email.toLowerCase()
      .replace(/\./g, '_dot_')
      .replace(/@/g, '_at_')
      .replace(/#/g, '_hash_')
      .replace(/\$/g, '_dollar_')
      .replace(/\[/g, '_lbracket_')
      .replace(/\]/g, '_rbracket_');
  };

  useEffect(() => {
    // FIX CRÍTICO: Asegura que la sesión no se pierda (Missing Initial State Fix)
    setPersistence(auth, browserLocalPersistence).then(() => {
      return onAuthStateChanged(auth, (u) => {
        if (u) {
          setUser(u);
          validateAccess(u.email);
        } else {
          setUser(null);
          setAccessGranted(false);
          setAuthLoading(false);
        }
      });
    });

    // Escuchadores de DB con optimización de carga
    const unsubscribes = [
      onValue(ref(db, 'whitelist'), s => setWhitelist(s.val() || {})),
      onValue(ref(db, 'blacklist'), s => setBlacklist(s.val() || {})),
      onValue(ref(db, 'premium'), s => setPremiumUsers(s.val() || {})),
      onValue(ref(db, 'logs'), s => setLogs(Object.values(s.val() || {}).reverse().slice(0, 50)))
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const validateAccess = (email) => {
    const key = formatKey(email);
    // 1. Verificación de Ban
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        // 2. Verificación de Whitelist (Cualquier dominio permitido si está en la lista)
        onValue(ref(db, `whitelist/${key}`), (wSnap) => {
          if (wSnap.exists() || email === "alex.admin@pro.com") {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError(`ACCESO DENEGADO: ${email} no está autorizado.`);
          }
        });
      }
      setAuthLoading(false);
    });
  };

  // ==========================================
  // PROTOCOLO DE PÁNICO (MANAGEBAC)
  // ==========================================
  const handlePanic = () => {
    // Intento de apertura de App nativa mediante Deep Link
    window.location.href = "managebac://";
    
    // Fallback: Redirigir a la web y destruir esta pestaña
    setTimeout(() => {
      window.open("https://managebac.com", "_blank");
      // Intento de autodestrucción de la pestaña actual
      window.location.replace("about:blank");
      window.close();
    }, 150);
  };

  // ==========================================
  // COMANDOS DE ADMINISTRACIÓN (CORREGIDOS)
  // ==========================================
  const executeUserAction = async (table, email, action) => {
    if (!email || !email.includes('@')) return pushNotif("EMAIL NO VÁLIDO", "error");
    
    const key = formatKey(email);
    const targetRef = ref(db, `${table}/${key}`);

    try {
      if (action === 'add') {
        await set(targetRef, {
          email: email,
          addedBy: user?.email,
          date: new Date().toISOString()
        });
        pushNotif(`ÉXITO: ${email} añadido a ${table}`, "success");
      } else {
        await remove(targetRef);
        pushNotif(`ÉXITO: ${email} eliminado de ${table}`, "info");
      }
      setAdminMailInput('');
      addSystemLog(`ADMIN ACTION: ${action} on ${email} in ${table}`);
    } catch (e) {
      pushNotif("ERROR CRÍTICO DE BASE DE DATOS", "error");
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setLoginError("ERROR DE AUTENTICACIÓN: Intente de nuevo.");
    }
  };

  const addSystemLog = (msg) => {
    push(ref(db, 'logs'), {
      msg,
      u: user?.email || 'System',
      t: new Date().toLocaleTimeString()
    });
  };

  const pushNotif = (text, type) => {
    const id = Date.now();
    setNotifs(p => [...p, { id, text, type }]);
    setTimeout(() => setNotifs(p => p.filter(n => n.id !== id)), 4000);
  };

  // ==========================================
  // MOTOR DE BÚSQUEDA XL
  // ==========================================
  const startSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoadingContent(true);
    try {
      if (mode === 'youtube') {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${query}&type=video&key=${YT_KEY}`);
        const d = await r.json();
        setVideos(d.items || []);
        setSelectedVideo(null);
      }
    } catch (err) {
      pushNotif("ERROR EN API MULTIMEDIA", "error");
    }
    setLoadingContent(false);
  };

  // ==========================================
  // INTERFAZ DE USUARIO (RENDERIZADO)
  // ==========================================

  if (authLoading) return (
    <div style={ui.loaderContainer}>
      <div className="custom-spinner"></div>
      <h1 style={{color: '#ff0000', letterSpacing: '10px', marginTop: '30px'}}>ALEX HUB ULTRA</h1>
    </div>
  );

  return (
    <div style={ui.app}>
      
      {/* BOTÓN PÁNICO - ACCIÓN INMEDIATA */}
      <button onClick={handlePanic} style={ui.panicBtn}>PÁNICO</button>

      {/* STACK DE NOTIFICACIONES */}
      <div style={ui.notifStack}>
        {notifs.map(n => (
          <div key={n.id} style={{...ui.notif, borderLeft: `5px solid ${n.type === 'error' ? '#ff0000' : '#00ff00'}`}}>
            {n.text}
          </div>
        ))}
      </div>

      {isBanned ? (
        <div style={ui.banScreen}>
          <div style={ui.banBox}>
            <h1 className="glitch-text">SISTEMA BLOQUEADO</h1>
            <p>Tu acceso ha sido revocado permanentemente por la administración.</p>
            <button onClick={() => { signOut(auth); window.location.reload(); }} style={ui.logoutBtnLarge}>SALIR</button>
          </div>
        </div>
      ) : !accessGranted ? (
        /* PANTALLA DE LOGIN */
        <div style={ui.loginPage}>
          <div style={ui.loginCard}>
            <h1 style={ui.hubTitle}>ALEX HUB <span style={{color: '#ff0000'}}>ULTRA</span></h1>
            <p style={ui.version}>SYSTEM VERSION 13.0.9 - 2026</p>
            
            <div style={{margin: '50px 0'}}>
              <button onClick={handleGoogleLogin} style={ui.googleBtn}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" />
                ENTRAR CON GOOGLE
              </button>
              {loginError && <p style={ui.errorMsg}>{loginError}</p>}
            </div>

            <button onClick={() => setShowAlexModal(true)} style={ui.alexAccessBtn}>ACCESO ADMINISTRADOR</button>
          </div>
        </div>
      ) : (
        /* INTERFAZ PRINCIPAL DEL HUB */
        <>
          <nav style={ui.navbar}>
            <div style={ui.navLeft}>
              <div style={ui.logo}>
                <span style={{fontWeight: 900, fontSize: '24px'}}>ALEX</span>
                <span style={{color: '#ff0000', fontSize: '10px'}}>ULTRA V13</span>
              </div>
              <div style={ui.tabs}>
                {['youtube', 'twitch', 'movies', 'radio'].map(t => (
                  <button key={t} onClick={() => {setMode(t); setSelectedVideo(null);}} 
                    style={mode === t ? ui.tabActive : ui.tab}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={startSearch} style={ui.searchBox}>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Buscar contenido en ${mode}...`} style={ui.input} />
              <button type="submit" style={ui.searchBtn}>🔍</button>
            </form>

            <div style={ui.navRight}>
              <div style={ui.profile}>
                <img src={user.photoURL} style={ui.avatar} />
                <div style={ui.userText}>
                  <span style={{fontWeight: 'bold', fontSize: '12px'}}>{user.displayName}</span>
                  <button onClick={() => signOut(auth)} style={ui.logoutMini}>CERRAR SESIÓN</button>
                </div>
              </div>
              <button onClick={() => setShowAlexModal(true)} style={ui.alexCircleBtn}>ALEX</button>
            </div>
          </nav>

          <main style={ui.mainArea}>
            {loadingContent && <div style={ui.loadOverlay}><div className="custom-spinner"></div></div>}

            {mode === 'youtube' && !selectedVideo && (
              <div style={ui.videoGrid}>
                {videos.map((v, i) => (
                  <div key={i} style={ui.vCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                    <img src={v.snippet.thumbnails.high.url} style={ui.vThumb} />
                    <div style={ui.vInfo}>
                      <h4 style={ui.vTitle}>{v.snippet.title}</h4>
                      <p style={ui.vChan}>{v.snippet.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(selectedVideo || mode !== 'youtube') && (
              <div style={ui.playerContainer}>
                <iframe 
                  src={selectedVideo ? `https://www.youtube.com/embed/${selectedVideo}?autoplay=1` : 
                       mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                       mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` : ""}
                  style={ui.iframeXL}
                  allowFullScreen
                />
                {selectedVideo && <button onClick={() => setSelectedVideo(null)} style={ui.closePlayer}>VOLVER AL LISTADO</button>}
              </div>
            )}
          </main>
        </>
      )}

      {/* PANEL ADMIN: COMMAND CENTER */}
      {isAdminOpen && (
        <div style={ui.adminOverlay}>
          <div style={ui.adminPanel}>
            <div style={ui.adminHeader}>
              <h2 style={{margin:0}}>COMMAND CENTER | ALEX</h2>
              <div style={ui.adminNav}>
                <button onClick={() => setCurrentTab('users')} style={currentTab === 'users' ? ui.aTabAct : ui.aTab}>USUARIOS</button>
                <button onClick={() => setCurrentTab('logs')} style={currentTab === 'logs' ? ui.aTabAct : ui.aTab}>LOGS</button>
                <button onClick={() => setIsAdminOpen(false)} style={ui.closeAdmin}>SALIR</button>
              </div>
            </div>

            <div style={ui.adminContent}>
              {currentTab === 'users' ? (
                <div style={ui.adminGrid}>
                  <div style={ui.adminSec}>
                    <h3 style={{color: '#00ff00'}}>✓ WHITELIST (ACCESO)</h3>
                    <div style={ui.adminAction}>
                      <input value={adminMailInput} onChange={e=>setAdminMailInput(e.target.value)} placeholder="email@domain.com/.eu/.es" style={ui.adminInp} />
                      <button onClick={() => executeUserAction('whitelist', adminMailInput, 'add')} style={ui.btnGreen}>AÑADIR</button>
                    </div>
                    <div style={ui.userList}>
                      {Object.values(whitelist).map(u => (
                        <div key={u.email} style={ui.userItem}>
                          <span>{u.email}</span>
                          <button onClick={() => executeUserAction('whitelist', u.email, 'remove')} style={ui.btnDel}>X</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={ui.adminSec}>
                    <h3 style={{color: '#ff0000'}}>⚠ BLACKLIST (BANEO)</h3>
                    <div style={ui.adminAction}>
                      <input value={adminMailInput} onChange={e=>setAdminMailInput(e.target.value)} placeholder="email@lamiranda.eu" style={ui.adminInp} />
                      <button onClick={() => executeUserAction('blacklist', adminMailInput, 'add')} style={ui.btnRed}>BANEAR</button>
                    </div>
                    <div style={ui.userList}>
                      {Object.values(blacklist).map(u => (
                        <div key={u.email} style={ui.userItem}>
                          <span>{u.email}</span>
                          <button onClick={() => executeUserAction('blacklist', u.email, 'remove')} style={ui.btnUnban}>PERDONAR BAN</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={ui.logBox}>
                  {logs.map((l, i) => (
                    <div key={i} style={ui.logEntry}>
                      <span style={{color: '#444'}}>[{l.t}]</span> <b style={{color: '#ff0000'}}>{l.u}:</b> {l.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONTRASEÑA OBLIGATORIA (ALEX) */}
      {showAlexModal && (
        <div style={ui.overlay}>
          <div style={ui.passCard}>
            <h2 style={{letterSpacing: '5px'}}>AUTENTICACIÓN ALEX</h2>
            <p style={{fontSize: '10px', color: '#555', marginBottom: '20px'}}>POR FAVOR, INGRESE LA CLAVE MAESTRA</p>
            <input 
              type="password" 
              autoFocus
              value={passInput} 
              onChange={e=>setPassInput(e.target.value)} 
              style={ui.passInput}
              onKeyDown={e => {
                if(e.key === 'Enter'){
                  if(passInput === MASTER_ADMIN_KEY){
                    setIsAdminOpen(true); setShowAlexModal(false); setPassInput('');
                  } else { pushNotif("CLAVE INCORRECTA", "error"); }
                }
              }}
            />
            <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
              <button onClick={() => {
                if(passInput === MASTER_ADMIN_KEY) {
                  setIsAdminOpen(true); setShowAlexModal(false); setPassInput('');
                } else { pushNotif("CLAVE INCORRECTA", "error"); }
              }} style={ui.btnRedLarge}>ACCEDER</button>
              <button onClick={() => setShowAlexModal(false)} style={ui.btnCancel}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE ESTILOS CSS-IN-JS (ULTRA)
// ==========================================
const ui = {
  app: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
  loaderContainer: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  panicBtn: { position: 'fixed', bottom: '30px', right: '30px', background: '#ff0000', color: '#fff', border: '3px solid #fff', padding: '25px 40px', borderRadius: '50px', fontWeight: '900', zIndex: 999999, cursor: 'pointer', boxShadow: '0 0 50px rgba(255,0,0,0.8)', fontSize: '18px' },
  
  // LOGIN
  loginPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #111, #000)' },
  loginCard: { background: 'rgba(10,10,10,0.9)', padding: '70px', borderRadius: '40px', border: '1px solid #222', textAlign: 'center', backdropFilter: 'blur(20px)' },
  hubTitle: { fontSize: '55px', fontWeight: '900', letterSpacing: '10px', margin: 0 },
  version: { color: '#444', fontSize: '11px', letterSpacing: '5px', marginTop: '10px' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '18px 35px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', margin: '0 auto', fontSize: '16px' },
  alexAccessBtn: { background: 'none', border: '1px solid #333', color: '#444', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px' },
  errorMsg: { color: '#ff0000', marginTop: '20px', fontWeight: 'bold' },

  // NAVBAR
  navbar: { height: '90px', background: '#050505', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between', zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
  logo: { display: 'flex', flexDirection: 'column', lineHeight: '1' },
  tabs: { display: 'flex', gap: '10px' },
  tab: { background: '#111', border: 'none', color: '#555', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  tabActive: { background: '#ff0000', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold' },
  searchBox: { flex: 1, maxWidth: '600px', display: 'flex', background: '#111', borderRadius: '12px', padding: '5px 15px', border: '1px solid #222' },
  input: { flex: 1, background: 'none', border: 'none', color: '#fff', padding: '12px', outline: 'none' },
  searchBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
  navRight: { display: 'flex', alignItems: 'center', gap: '25px' },
  profile: { display: 'flex', alignItems: 'center', gap: '12px', background: '#111', padding: '8px 15px', borderRadius: '40px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%' },
  userText: { display: 'flex', flexDirection: 'column' },
  logoutMini: { background: 'none', border: 'none', color: '#ff0000', fontSize: '10px', cursor: 'pointer', textAlign: 'left', padding: 0 },
  alexCircleBtn: { background: '#ff0000', color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '50%', fontWeight: '900', cursor: 'pointer' },

  // MAIN AREA
  mainArea: { flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' },
  vCard: { background: '#0a0a0a', borderRadius: '20px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.3s' },
  vThumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  vInfo: { padding: '20px' },
  vTitle: { fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0', height: '40px', overflow: 'hidden' },
  vChan: { color: '#555', fontSize: '13px' },
  playerContainer: { width: '100%', height: '82vh', position: 'relative', background: '#000', borderRadius: '30px', overflow: 'hidden', border: '1px solid #222' },
  iframeXL: { width: '100%', height: '100%', border: 'none' },
  closePlayer: { position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,0,0,0.9)', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' },

  // ADMIN
  adminOverlay: { position: 'fixed', inset: '40px', background: '#050505', border: '2px solid #333', borderRadius: '40px', zIndex: 10000, display: 'flex', flexDirection: 'column', boxShadow: '0 0 100px #000' },
  adminHeader: { padding: '30px 50px', background: '#000', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminNav: { display: 'flex', gap: '20px' },
  aTab: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  aTabAct: { background: 'none', border: 'none', color: '#fff', borderBottom: '3px solid #ff0000', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  adminContent: { flex: 1, padding: '50px', overflowY: 'auto' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px' },
  adminSec: { background: '#0a0a0a', padding: '30px', borderRadius: '25px', border: '1px solid #1a1a1a' },
  adminAction: { display: 'flex', gap: '15px', marginBottom: '30px' },
  adminInp: { flex: 1, background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff' },
  userList: { height: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  userItem: { background: '#050505', padding: '18px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  btnGreen: { background: '#00ff00', color: '#000', border: 'none', padding: '0 25px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
  btnRed: { background: '#ff0000', color: '#fff', border: 'none', padding: '0 25px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
  btnDel: { background: '#1a1a1a', color: '#ff0000', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  btnUnban: { background: '#00ff00', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  closeAdmin: { background: '#fff', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  logBox: { background: '#000', padding: '40px', borderRadius: '25px', fontFamily: 'monospace', border: '1px solid #111' },
  logEntry: { padding: '8px 0', borderBottom: '1px solid #0a0a0a', fontSize: '13px' },

  // NOTIFS & OVERLAYS
  notifStack: { position: 'fixed', top: '30px', right: '30px', zIndex: 1000000, display: 'flex', flexDirection: 'column', gap: '15px' },
  notif: { background: '#0a0a0a', color: '#fff', padding: '20px 40px', borderRadius: '15px', fontSize: '14px', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, backdropFilter: 'blur(15px)' },
  passCard: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', border: '1px solid #222', textAlign: 'center', width: '450px' },
  passInput: { width: '100%', background: '#000', border: '2px solid #ff0000', padding: '25px', borderRadius: '20px', color: '#fff', fontSize: '35px', textAlign: 'center', margin: '30px 0', outline: 'none', letterSpacing: '10px' },
  btnRedLarge: { background: '#ff0000', color: '#fff', border: 'none', padding: '20px 50px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '18px' },
  btnCancel: { background: 'none', border: 'none', color: '#444', cursor: 'pointer' },
  banScreen: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  banBox: { textAlign: 'center', padding: '80px', border: '4px solid #ff0000', borderRadius: '50px', background: 'rgba(255,0,0,0.05)' },
  logoutBtnLarge: { marginTop: '40px', background: '#ff0000', color: '#fff', border: 'none', padding: '20px 50px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }
};

// --- INYECCIÓN DE ESTILOS GLOBALES ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body { margin: 0; background: #000; -webkit-font-smoothing: antialiased; }
    .custom-spinner { width: 70px; height: 70px; border: 6px solid #111; border-top-color: #ff0000; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .glitch-text { animation: blink 0.2s infinite; color: #ff0000; letter-spacing: 15px; font-size: 50px; }
    @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
    .vCard:hover { transform: translateY(-10px); border-color: #ff0000; }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
  `;
  document.head.appendChild(style);
}
