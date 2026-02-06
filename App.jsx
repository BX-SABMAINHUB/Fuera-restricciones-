/**
 * ============================================================================
 * ALEX HUB ULTRA V13 - RECONSTRUCCIÓN TOTAL
 * ============================================================================
 * @version: 13.0.9-FINAL-FIXED
 * @auth: ALEX
 * @status: FULLY OPERATIONAL
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update, push 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, 
  setPersistence, browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURACIÓN DE FIREBASE (Verificada) ---
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

// --- CONSTANTES MAESTRAS ---
const YT_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4"; // API CORREGIDA
const ADMIN_PASS = "Alex2706";
const SYSTEM_NAME = "ALEX HUB ULTRA V13";

export default function AlexHubUltraV13() {
  // --- ESTADOS DE SISTEMA ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState('pending'); // pending, granted, denied, banned
  const [loginError, setLoginError] = useState(null);

  // --- ESTADOS DE DATOS (FIREBASE) ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premium, setPremium] = useState({});
  const [logs, setLogs] = useState([]);

  // --- UI & CONTENIDO ---
  const [activeTab, setActiveTab] = useState('youtube');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [playerVideo, setPlayerVideo] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // --- ADMIN PANEL ---
  const [alexLoginVisible, setAlexLoginVisible] = useState(false);
  const [alexPass, setAlexPass] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminMailInput, setAdminMailInput] = useState('');
  const [adminTab, setAdminTab] = useState('access');
  const [notifications, setNotifications] = useState([]);

  // ==========================================
  // 1. UTILIDADES DE SEGURIDAD (CORRECCIÓN DE ERRORES)
  // ==========================================

  // Función crítica: Limpia el email para que sea una ruta válida en Firebase (Soporta .eu, .com, etc)
  const sanitizeKey = (email) => {
    if (!email) return '';
    return email.toLowerCase()
      .replace(/\./g, '_dot_')
      .replace(/@/g, '_at_')
      .replace(/#/g, '_hash_')
      .replace(/\$/g, '_ds_')
      .replace(/\[/g, '_lb_')
      .replace(/\]/g, '_rb_');
  };

  const notify = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4500);
  }, []);

  const addLog = useCallback((action) => {
    const logRef = push(ref(db, 'system_logs'));
    set(logRef, {
      user: auth.currentUser?.email || 'Guest',
      action,
      time: new Date().toISOString()
    });
  }, []);

  // ==========================================
  // 2. BOTÓN DE PÁNICO (LÓGICA SOLICITADA)
  // ==========================================
  const triggerPanic = () => {
    // 1. Intentar abrir la App ManageBac usando el esquema de URI
    window.location.href = "managebac://"; 
    
    // 2. Fallback por si no tiene la app instalada
    setTimeout(() => {
        window.open("https://managebac.com", "_blank");
        // 3. Eliminar rastro: Redirigir la pestaña actual a Google y luego intentar cerrarla
        window.location.replace("https://www.google.com");
        window.close();
    }, 300);
  };

  // ==========================================
  // 3. NÚCLEO DE AUTENTICACIÓN Y SEGURIDAD
  // ==========================================
  useEffect(() => {
    // Corregir error de "Missing initial state" forzando persistencia
    setPersistence(auth, browserLocalPersistence);

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        checkDatabaseSecurity(u.email);
        addLog(`Login detectado: ${u.email}`);
      } else {
        setUser(null);
        setAccessStatus('denied');
        setAuthLoading(false);
      }
    });

    // Escucha en tiempo real de DB
    const unsubWhite = onValue(ref(db, 'whitelist'), s => setWhitelist(s.val() || {}));
    const unsubBlack = onValue(ref(db, 'blacklist'), s => setBlacklist(s.val() || {}));
    const unsubPrem = onValue(ref(db, 'premium'), s => setPremium(s.val() || {}));
    const unsubLogs = onValue(ref(db, 'system_logs'), s => {
      const data = s.val() || {};
      setLogs(Object.values(data).reverse().slice(0, 60));
    });

    return () => { unsubAuth(); unsubWhite(); unsubBlack(); unsubPrem(); unsubLogs(); };
  }, []);

  const checkDatabaseSecurity = (email) => {
    const key = sanitizeKey(email);
    
    // Verificar Baneo Primero
    onValue(ref(db, `blacklist/${key}`), (snap) => {
      if (snap.exists()) {
        setAccessStatus('banned');
        setAuthLoading(false);
      } else {
        // Verificar Whitelist
        onValue(ref(db, `whitelist/${key}`), (wSnap) => {
          if (wSnap.exists() || email === "alex.admin@pro.com") {
            setAccessStatus('granted');
          } else {
            setAccessStatus('denied');
            setLoginError("TU CORREO NO ESTÁ EN LA WHITELIST");
          }
          setAuthLoading(false);
        });
      }
    });
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setLoginError(`ERROR AUTH: ${e.message}`);
      notify("Error al conectar con Google", "error");
    }
  };

  // ==========================================
  // 4. COMANDOS DE ADMINISTRADOR (BAN/UNBAN)
  // ==========================================
  const manageUser = async (targetTable, targetEmail, mode) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      return notify("Correo inválido para procesar", "error");
    }

    const key = sanitizeKey(targetEmail);
    const dbPath = ref(db, `${targetTable}/${key}`);

    try {
      if (mode === 'add') {
        await set(dbPath, {
          email: targetEmail,
          added_by: user?.email,
          timestamp: serverTimestamp()
        });
        notify(`${targetEmail} agregado a ${targetTable}`, "success");
      } else {
        await remove(dbPath);
        notify(`${targetEmail} removido de ${targetTable}`, "info");
      }
      setAdminMailInput('');
      addLog(`ADMIN_ACTION: ${mode} ${targetEmail} en ${targetTable}`);
    } catch (err) {
      notify("ERROR DB: " + err.message, "error");
    }
  };

  // ==========================================
  // 5. MOTOR DE BÚSQUEDA Y VÍDEO
  // ==========================================
  const executeSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    
    try {
      if (activeTab === 'youtube') {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=40&q=${searchQuery}&type=video&key=${YT_KEY}`);
        const data = await response.json();
        setSearchResults(data.items || []);
        setPlayerVideo(null);
      }
      addLog(`Search: [${activeTab}] ${searchQuery}`);
    } catch (err) {
      notify("Error API YouTube", "error");
    }
    setIsSearching(false);
  };

  // --- INTERFAZ ---

  if (authLoading) return (
    <div style={styles.loadingContainer}>
      <div className="spinner"></div>
      <h2 style={styles.glitch}>ALEX HUB ULTRA</h2>
      <p style={{fontSize: '10px', color: '#333'}}>VERIFICANDO INTEGRIDAD DEL SISTEMA...</p>
    </div>
  );

  return (
    <div style={styles.appFrame}>
      
      {/* CAPA DE NOTIFICACIONES */}
      <div style={styles.notificationShelf}>
        {notifications.map(n => (
          <div key={n.id} style={{...styles.toast, borderColor: n.type === 'error' ? '#ff0000' : '#00ff41'}}>
            {n.msg}
          </div>
        ))}
      </div>

      {/* BOTÓN PÁNICO FLOTANTE */}
      <button onClick={triggerPanic} style={styles.panicButton}>PÁNICO</button>

      {accessStatus === 'banned' ? (
        <div style={styles.bannedOverlay}>
          <div style={styles.errorBox}>
            <h1 style={{color: '#ff0000', fontSize: '60px'}}>BANEO TOTAL</h1>
            <p>Tu acceso ha sido revocado por Alex. Contacta con soporte si es un error.</p>
            <button onClick={() => signOut(auth)} style={styles.logoutLarge}>SALIR</button>
          </div>
        </div>
      ) : accessStatus === 'denied' ? (
        <div style={styles.loginBg}>
          <div style={styles.loginCard}>
             <h1 style={styles.loginTitle}>ALEX <span style={{color: '#E50914'}}>HUB</span></h1>
             <p style={styles.loginSubtitle}>SYSTEM ACCESS CONTROL V13</p>
             
             {!user ? (
               <button onClick={handleLogin} style={styles.googleButton}>
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width="20"/>
                 ENTRAR CON GOOGLE
               </button>
             ) : (
               <div style={{color: '#ff9800', fontWeight: 'bold'}}>
                 ACCESO PENDIENTE DE WHITELIST
                 <p style={{fontSize: '12px', color: '#555'}}>{user.email}</p>
                 <button onClick={() => signOut(auth)} style={styles.logoutBtnSmall}>CAMBIAR CUENTA</button>
               </div>
             )}

             {loginError && <p style={styles.errorText}>{loginError}</p>}

             <div style={{marginTop: '50px'}}>
                <button onClick={() => setAlexLoginVisible(true)} style={styles.alexAdminTrigger}>ADMIN PANEL</button>
             </div>
          </div>
        </div>
      ) : (
        /* SISTEMA COMPLETO OPERATIVO */
        <>
          <nav style={styles.topNav}>
             <div style={styles.navLeft}>
                <div style={styles.brandBox}>
                   <span style={{fontWeight: '900', fontSize: '24px'}}>ALEX</span>
                   <span style={{color: '#E50914', fontSize: '10px', fontWeight: 'bold'}}>ULTRA V13</span>
                </div>
                <div style={styles.tabBar}>
                  {['youtube', 'twitch', 'movies', 'xbox'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => {setActiveTab(t); setPlayerVideo(null)}} 
                      style={activeTab === t ? styles.tabActive : styles.tab}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
             </div>

             <form onSubmit={executeSearch} style={styles.searchWrapper}>
                <input 
                  style={styles.mainSearch} 
                  placeholder={`Buscar contenido en ${activeTab}...`} 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button type="submit" style={styles.searchBtn}>🔍</button>
             </form>

             <div style={styles.navRight}>
                {premium[sanitizeKey(user.email)] && <span style={styles.premiumTag}>💎 PREMIUM</span>}
                <div style={styles.userSection}>
                   <img src={user.photoURL} style={styles.userImg} alt="user" />
                   <div style={styles.userMeta}>
                      <span style={{fontSize: '12px', fontWeight: 'bold'}}>{user.displayName}</span>
                      <button onClick={() => signOut(auth)} style={styles.logoutLink}>CERRAR SESIÓN</button>
                   </div>
                </div>
                <button onClick={() => setAdminOpen(true)} style={styles.alexBtn}>ADMIN</button>
             </div>
          </nav>

          <main style={styles.contentWindow}>
             {isSearching && <div style={styles.loaderArea}><div className="loader"></div></div>}

             {activeTab === 'youtube' && (
               <div style={styles.youtubeContainer}>
                  {playerVideo ? (
                    <div style={styles.cinemaMode}>
                       <iframe 
                         src={`https://www.youtube.com/embed/${playerVideo}?autoplay=1&rel=0`} 
                         style={styles.mainIframe} 
                         allowFullScreen 
                       />
                       <button onClick={() => setPlayerVideo(null)} style={styles.closeCinema}>SALIR DE CINE</button>
                    </div>
                  ) : (
                    <div style={styles.mediaGrid}>
                       {searchResults.map((v, i) => (
                         <div key={i} style={styles.mediaCard} onClick={() => setPlayerVideo(v.id.videoId)}>
                            <div style={styles.thumbBox}>
                               <img src={v.snippet.thumbnails.high.url} style={styles.thumbImg} alt="v" />
                               <div style={styles.playOverlay}>REPRODUCIR</div>
                            </div>
                            <div style={styles.mediaInfo}>
                               <h4 style={styles.vTitle}>{v.snippet.title}</h4>
                               <p style={styles.vChannel}>{v.snippet.channelTitle}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
             )}

             {activeTab !== 'youtube' && (
               <div style={styles.fullEmbed}>
                  <iframe 
                    src={activeTab === 'twitch' ? `https://player.twitch.tv/?channel=${searchQuery || 'ibai'}&parent=${window.location.hostname}` :
                         activeTab === 'movies' ? `https://vidsrc.to/embed/movie/${searchQuery || 'tt0111161'}` :
                         "https://www.xbox.com/play"} 
                    style={styles.mainIframe} 
                  />
               </div>
             )}
          </main>
        </>
      )}

      {/* MODAL ADMIN PANEL (CENTRO DE MANDO) */}
      {adminOpen && (
        <div style={styles.adminOverlay}>
          <div style={styles.adminPanel}>
             <div style={styles.adminHeader}>
                <div>
                   <h2 style={{margin: 0, color: '#ff0000'}}>ALEX COMMAND CENTER</h2>
                   <p style={{fontSize: '10px', color: '#555'}}>CONTROL DE ACCESO NIVEL 1</p>
                </div>
                <div style={styles.adminNav}>
                   <button onClick={() => setAdminTab('access')} style={adminTab === 'access' ? styles.adTabOn : styles.adTab}>USUARIOS</button>
                   <button onClick={() => setAdminTab('logs')} style={adminTab === 'logs' ? styles.adTabOn : styles.adTab}>LOGS</button>
                   <button onClick={() => setAdminOpen(false)} style={styles.closeAdmin}>X</button>
                </div>
             </div>

             <div style={styles.adminBody}>
                {adminTab === 'access' ? (
                  <div style={styles.accessGrid}>
                    {/* WHITELIST */}
                    <div style={styles.controlSection}>
                       <h4 style={{color: '#00ff41'}}>✅ WHITELIST (ACCESO)</h4>
                       <div style={styles.actionRow}>
                          <input 
                            style={styles.adminInput} 
                            placeholder="correo@gmail.com" 
                            value={adminMailInput}
                            onChange={e => setAdminMailInput(e.target.value)}
                          />
                          <button onClick={() => manageUser('whitelist', adminMailInput, 'add')} style={styles.addBtn}>AÑADIR</button>
                       </div>
                       <div style={styles.scrollBox}>
                          {Object.values(whitelist).map(u => (
                            <div key={u.email} style={styles.userRow}>
                               <span>{u.email}</span>
                               <button onClick={() => manageUser('whitelist', u.email, 'remove')} style={styles.delBtn}>QUITAR</button>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* BLACKLIST */}
                    <div style={styles.controlSection}>
                       <h4 style={{color: '#ff0000'}}>🚫 BLACKLIST (BAN)</h4>
                       <div style={styles.actionRow}>
                          <input 
                             style={styles.adminInput} 
                             placeholder="correo@gmail.com" 
                             value={adminMailInput}
                             onChange={e => setAdminMailInput(e.target.value)}
                          />
                          <button onClick={() => manageUser('blacklist', adminMailInput, 'add')} style={styles.banBtn}>BANEAR</button>
                       </div>
                       <div style={styles.scrollBox}>
                          {Object.values(blacklist).map(u => (
                            <div key={u.email} style={styles.userRow}>
                               <span>{u.email}</span>
                               <button onClick={() => manageUser('blacklist', u.email, 'remove')} style={styles.unbanBtn}>PERDONAR</button>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* PREMIUM */}
                    <div style={styles.controlSection}>
                       <h4 style={{color: '#FFD700'}}>💎 PREMIUM USERS</h4>
                       <div style={styles.actionRow}>
                          <input 
                            style={styles.adminInput} 
                            placeholder="correo@gmail.com" 
                            value={adminMailInput}
                            onChange={e => setAdminMailInput(e.target.value)}
                          />
                          <button onClick={() => manageUser('premium', adminMailInput, 'add')} style={styles.premBtn}>DAR</button>
                       </div>
                       <div style={styles.scrollBox}>
                          {Object.values(premium).map(u => (
                            <div key={u.email} style={styles.userRow}>
                               <span>{u.email}</span>
                               <button onClick={() => manageUser('premium', u.email, 'remove')} style={styles.delBtn}>QUITAR</button>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.logWrap}>
                     <div style={styles.logConsole}>
                        {logs.map((l, i) => (
                          <div key={i} style={styles.logEntry}>
                             <span style={{color: '#444'}}>[{new Date(l.time).toLocaleTimeString()}]</span>
                             <span style={{color: '#ff0000', marginLeft: '10px'}}>{l.user}:</span> {l.action}
                          </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* LOGIN DE PROTECCIÓN ALEX */}
      {alexLoginVisible && (
        <div style={styles.modalOverlay}>
           <div style={styles.miniCard}>
              <h3 style={{letterSpacing: '3px'}}>ALEX ADMIN</h3>
              <input 
                type="password" 
                style={styles.passInput} 
                placeholder="CONTRASEÑA" 
                value={alexPass}
                onChange={e => setAlexPass(e.target.value)}
              />
              <div style={styles.btnGroup}>
                 <button onClick={() => {
                   if (alexPass === ADMIN_PASS) {
                     setAdminOpen(true);
                     setAlexLoginVisible(false);
                     setAlexPass('');
                   } else {
                     notify("CONTRASEÑA INCORRECTA", "error");
                   }
                 }} style={styles.confirmBtn}>ENTRAR</button>
                 <button onClick={() => setAlexLoginVisible(false)} style={styles.cancelBtn}>CANCELAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ARQUITECTURA DE DISEÑO ULTRA (CSS IN JS)
// ==========================================
const styles = {
  appFrame: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
  loadingContainer: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  panicButton: { position: 'fixed', bottom: '25px', right: '25px', background: '#ff0000', color: '#fff', border: 'none', padding: '18px 30px', borderRadius: '50px', fontWeight: '900', zIndex: 9999, cursor: 'pointer', boxShadow: '0 0 30px rgba(255,0,0,0.6)', fontSize: '14px' },
  
  // LOGIN UI
  loginBg: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #111 0%, #000 100%)' },
  loginCard: { background: 'rgba(10,10,10,0.8)', padding: '60px', borderRadius: '40px', border: '1px solid #1a1a1a', textAlign: 'center', backdropFilter: 'blur(10px)', width: '400px' },
  loginTitle: { fontSize: '50px', fontWeight: '900', margin: '0', letterSpacing: '8px' },
  loginSubtitle: { fontSize: '10px', color: '#444', letterSpacing: '4px', marginBottom: '40px' },
  googleButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '15px', borderRadius: '12px', width: '100%', fontWeight: 'bold', cursor: 'pointer' },
  alexAdminTrigger: { background: 'none', border: 'none', color: '#222', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  errorText: { color: '#ff4444', marginTop: '20px', fontSize: '12px', fontWeight: 'bold' },

  // NAV UI
  topNav: { height: '80px', background: '#050505', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', zIndex: 100 },
  brandBox: { borderLeft: '3px solid #ff0000', paddingLeft: '15px', display: 'flex', flexDirection: 'column' },
  tabBar: { display: 'flex', gap: '10px', marginLeft: '40px' },
  tab: { background: 'transparent', border: 'none', color: '#444', padding: '10px 15px', cursor: 'pointer', fontWeight: 'bold' },
  tabActive: { background: '#111', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: '900' },
  searchWrapper: { flex: 1, maxWidth: '500px', position: 'relative', margin: '0 40px' },
  mainSearch: { width: '100%', background: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', padding: '12px 20px', color: '#fff', outline: 'none' },
  searchBtn: { position: 'absolute', right: '15px', top: '10px', background: 'none', border: 'none', cursor: 'pointer' },
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  userSection: { display: 'flex', alignItems: 'center', gap: '12px', background: '#0a0a0a', padding: '6px 15px', borderRadius: '12px' },
  userImg: { width: '32px', height: '32px', borderRadius: '8px' },
  logoutLink: { background: 'none', border: 'none', color: '#444', fontSize: '10px', cursor: 'pointer', padding: 0 },
  alexBtn: { background: '#ff0000', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

  // CONTENT
  contentWindow: { flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' },
  mediaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  mediaCard: { background: '#080808', borderRadius: '15px', overflow: 'hidden', border: '1px solid #111', cursor: 'pointer', transition: '0.3s' },
  thumbBox: { position: 'relative', aspectRatio: '16/9' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  playOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s', fontWeight: 'bold' },
  mediaInfo: { padding: '15px' },
  vTitle: { margin: '0 0 5px 0', fontSize: '14px', height: '34px', overflow: 'hidden' },
  vChannel: { color: '#444', fontSize: '11px' },
  cinemaMode: { height: '80vh', position: 'relative' },
  mainIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '20px' },
  closeCinema: { position: 'absolute', top: '-40px', right: '0', background: '#ff0000', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' },

  // ADMIN PANEL UI
  adminOverlay: { position: 'fixed', inset: '30px', background: '#050505', border: '1px solid #222', borderRadius: '30px', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '0 50px 100px rgba(0,0,0,1)' },
  adminHeader: { padding: '25px 40px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { flex: 1, padding: '30px', overflowY: 'auto' },
  accessGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  controlSection: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '20px' },
  actionRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  adminInput: { flex: 1, background: '#000', border: '1px solid #222', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px' },
  scrollBox: { height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' },
  userRow: { background: '#050505', padding: '10px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', border: '1px solid #111' },
  
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  banBtn: { background: '#ff0000', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  premBtn: { background: '#FFD700', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  delBtn: { background: '#111', color: '#444', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  closeAdmin: { background: '#fff', color: '#000', border: 'none', width: '30px', height: '30px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer' },

  // NOTIFS
  notificationShelf: { position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px' },
  toast: { background: '#0a0a0a', padding: '15px 25px', borderRadius: '10px', borderLeft: '5px solid', fontSize: '12px', fontWeight: 'bold', minWidth: '200px', animation: 'slideIn 0.3s ease' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  miniCard: { background: '#0a0a0a', padding: '40px', borderRadius: '25px', border: '1px solid #222', textAlign: 'center' },
  passInput: { width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', fontSize: '20px', textAlign: 'center', marginBottom: '20px' },
  confirmBtn: { background: '#ff0000', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#444', border: 'none', padding: '12px', cursor: 'pointer' },

  logConsole: { background: '#000', padding: '20px', borderRadius: '15px', fontFamily: 'monospace', fontSize: '12px', height: '500px', overflowY: 'auto', border: '1px solid #111' },
  logEntry: { padding: '5px 0', borderBottom: '1px solid #080808' }
};

// --- INYECCIÓN DE ESTILOS GLOBALES ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body { margin: 0; background: #000; color: #fff; }
    .spinner { width: 40px; height: 40px; border: 4px solid #111; border-top-color: #ff0000; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .mediaCard:hover { transform: translateY(-10px); border-color: #ff0000; }
    .mediaCard:hover .playOverlay { opacity: 1; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
  `;
  document.head.appendChild(style);
}
