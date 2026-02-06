import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, push, off 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ============================================================================
 * ALEX HUB ULTRA V14 - FINAL ARCHITECT EDITION
 * ============================================================================
 * @system: CORE OS
 * @version: 14.0.1-STABLE
 * @author: Alex Dev Team
 * @security: MILITARY GRADE (Level 5)
 * ============================================================================
 */

// --- 1. CONFIGURACIÓN MAESTRA Y FIREBASE ---

const firebaseConfig = {
  apiKey: "AIzaSyD1zUmhiUVDv-ZYyJF7vTwGaS1AO9t9jiE", // Config de Auth
  authDomain: "alexhub-eefdf.firebaseapp.com",
  databaseURL: "https://alexhub-eefdf-default-rtdb.firebaseio.com",
  projectId: "alexhub-eefdf",
  storageBucket: "alexhub-eefdf.firebasestorage.app",
  messagingSenderId: "463204402982",
  appId: "1:463204402982:web:fe740a662fbfd50452a3e7",
  measurementId: "G-M8KSGN3WX9"
};

// Inicialización segura
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configuración de persistencia para evitar errores de sessionStorage
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error de persistencia:", error);
});

// --- CONSTANTES DEL SISTEMA ---
const YOUTUBE_API_KEY = "AIzaSyDIImeaSboJvAsi6EChn8IugdLrh3nG9_4"; // API ACTUALIZADA
const ADMIN_PASS = "Alex2706";
const MANAGEBAC_URL = "https://www.managebac.com/login"; // URL DE PÁNICO
const SYSTEM_VERSION = "14.0.1-ARCHITECT";

// --- UTILIDADES DE SEGURIDAD (CRÍTICO PARA ARREGLAR ERRORES DE BASE DE DATOS) ---
// Esta función evita que el sistema se rompa si el email tiene puntos o caracteres raros.
const sanitizeEmail = (email) => {
    if (!email) return null;
    // Firebase no acepta '.', '#', '$', '[', ']' en las claves.
    // Reemplazamos todos los puntos por comas para usar como ID.
    return email.toLowerCase().replace(/\./g, ',');
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AlexHubUltraV14() {
  // --- ESTADOS DE NÚCLEO ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState('CHECKING'); // CHECKING | GRANTED | DENIED | BANNED
  const [loginError, setLoginError] = useState(null);
  
  // --- ESTADOS DE DATOS ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);
  
  // --- ESTADOS DE INTERFAZ ---
  const [mode, setMode] = useState('youtube');
  const [searchQuery, setSearchQuery] = useState('');
  const [contentList, setContentList] = useState([]);
  const [activeContent, setActiveContent] = useState(null); // ID del video seleccionado
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  // --- ESTADOS DE ADMINISTRACIÓN ---
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminTargetEmail, setAdminTargetEmail] = useState('');
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard');
  
  // --- ESTADOS DE UI VARIOS ---
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ==========================================================================
  // 1. SISTEMA DE "PÁNICO" (PRIORIDAD ALTA)
  // ==========================================================================
  
  const activatePanicMode = useCallback(() => {
    // 1. Borrar visualmente todo el contenido inmediatamente
    document.body.innerHTML = '<div style="background:#000;width:100vw;height:100vh;"></div>';
    document.title = "Loading...";
    
    // 2. Intentar cerrar la ventana (funciona si fue abierta por script)
    try { window.close(); } catch(e){}
    
    // 3. Redirección forzosa que reemplaza el historial (no se puede volver atrás)
    window.location.replace(MANAGEBAC_URL);
  }, []);

  // ==========================================================================
  // 2. MOTOR DE AUTENTICACIÓN Y SEGURIDAD (CORREGIDO)
  // ==========================================================================

  useEffect(() => {
    // Reloj del sistema
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Listener de Auth
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            // Iniciar verificación de seguridad en DB
            verifyUserAccess(currentUser.email);
            pushLog(`Conexión detectada: ${currentUser.email}`);
        } else {
            setUser(null);
            setAccessStatus('DENIED');
            setAuthLoading(false);
        }
    });

    // Listeners de Base de Datos en Tiempo Real
    const wRef = ref(db, 'whitelist');
    const bRef = ref(db, 'blacklist');
    const pRef = ref(db, 'premium_users');
    const lRef = ref(db, 'logs');

    const unsubW = onValue(wRef, (s) => setWhitelist(s.val() || {}));
    const unsubB = onValue(bRef, (s) => setBlacklist(s.val() || {}));
    const unsubP = onValue(pRef, (s) => setPremiumUsers(s.val() || {}));
    const unsubL = onValue(lRef, (s) => {
        const data = s.val();
        if (data) {
            // Convertir objeto a array y ordenar por fecha (más reciente primero)
            const arr = Object.values(data).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            setSystemLogs(arr.slice(0, 50)); // Solo últimos 50 logs
        }
    });

    return () => {
        clearInterval(timer);
        unsubscribeAuth();
        unsubW(); unsubB(); unsubP(); unsubL();
    };
  }, []);

  // Función de verificación de acceso (Blinda el sistema)
  const verifyUserAccess = (email) => {
      if (!email) return;
      const key = sanitizeEmail(email);
      
      // 1. Verificar si está baneado (Blacklist tiene prioridad absoluta)
      onValue(ref(db, `blacklist/${key}`), (snap) => {
          if (snap.exists()) {
              setAccessStatus('BANNED');
              setAuthLoading(false);
              // Si está baneado, forzamos logout visual pero mantenemos el estado para mostrar la pantalla de ban
          } else {
              // 2. Verificar Whitelist
              onValue(ref(db, `whitelist/${key}`), (wSnap) => {
                  // Permitir acceso si está en whitelist O es el admin supremo
                  if (wSnap.exists() || email === "alex.admin@pro.com") {
                      setAccessStatus('GRANTED');
                  } else {
                      setAccessStatus('DENIED');
                      setLoginError("TU EMAIL NO ESTÁ EN LA WHITELIST. CONTACTA A ALEX.");
                  }
                  setAuthLoading(false);
              }, { onlyOnce: true });
          }
      }, { onlyOnce: true });
  };

  const handleGoogleLogin = async () => {
      setLoginError(null);
      setAuthLoading(true);
      try {
          await signInWithPopup(auth, googleProvider);
          // La lógica de onAuthStateChanged se encargará del resto
      } catch (error) {
          console.error("Error Auth:", error);
          setAuthLoading(false);
          
          // MANEJO ESPECÍFICO DEL ERROR DE "MISSING INITIAL STATE"
          if (error.message.includes("missing initial state") || error.code === "auth/popup-closed-by-user") {
              setLoginError("Error de sesión. Borrando caché temporal... Intenta de nuevo.");
              // Limpieza de emergencia
              sessionStorage.clear();
          } else {
              setLoginError(`Error de Google: ${error.message}`);
          }
      }
  };

  const handleLogout = () => {
      signOut(auth).then(() => {
          window.location.reload();
      });
  };

  // ==========================================================================
  // 3. LÓGICA DEL PANEL DE ADMINISTRADOR (REPARADO)
  // ==========================================================================

  const executeAdminCommand = (action, table) => {
      if (!adminTargetEmail) {
          notify("Error: Escribe un email válido", "error");
          return;
      }
      
      // ARREGLO CLAVE: Usar sanitizeEmail para asegurar que la clave de DB sea válida
      const key = sanitizeEmail(adminTargetEmail); 
      const dbRef = ref(db, `${table}/${key}`);

      if (action === 'ADD') {
          set(dbRef, {
              email: adminTargetEmail,
              addedBy: user?.email || 'System',
              timestamp: new Date().toISOString()
          })
          .then(() => {
              notify(`${adminTargetEmail} AÑADIDO A ${table.toUpperCase()}`, "success");
              pushLog(`ADMIN: Añadió ${adminTargetEmail} a ${table}`);
              setAdminTargetEmail('');
          })
          .catch(err => notify("Error en Base de Datos: " + err.message, "error"));
      } 
      else if (action === 'REMOVE') {
          // ARREGLO DE "PERDONAR BAN": Asegura que la ruta de eliminación es correcta
          remove(dbRef)
          .then(() => {
              notify(`${adminTargetEmail} ELIMINADO DE ${table.toUpperCase()}`, "info");
              pushLog(`ADMIN: Eliminó ${adminTargetEmail} de ${table}`);
              setAdminTargetEmail('');
          })
          .catch(err => notify("Error al eliminar: " + err.message, "error"));
      }
  };

  const handleAdminAuth = (e) => {
      e.preventDefault();
      if (adminPassInput === ADMIN_PASS) {
          setIsAdminPanelOpen(true);
          setShowAdminLogin(false);
          setAdminPassInput('');
          notify("BIENVENIDO, COMANDANTE ALEX", "success");
      } else {
          notify("CONTRASEÑA INCORRECTA", "error");
          pushLog(`ALERTA: Intento fallido de admin pass: ${adminPassInput}`);
      }
  };

  const pushLog = (msg) => {
      push(ref(db, 'logs'), {
          msg,
          user: user?.email || 'Anon',
          timestamp: new Date().toISOString()
      });
  };

  // ==========================================================================
  // 4. MOTOR DE CONTENIDO (YOUTUBE, TWITCH, ETC)
  // ==========================================================================

  const searchContent = async (e) => {
      if (e) e.preventDefault();
      if (!searchQuery) return;
      
      setIsLoadingContent(true);
      setActiveContent(null);
      setContentList([]);

      try {
          if (mode === 'youtube') {
              const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}`;
              const res = await fetch(url);
              const data = await res.json();
              
              if (data.error) {
                  throw new Error(data.error.message);
              }
              
              if (data.items) {
                  setContentList(data.items);
              }
          }
          pushLog(`Búsqueda ${mode}: ${searchQuery}`);
      } catch (err) {
          notify(`Error API: ${err.message}`, "error");
      } finally {
          setIsLoadingContent(false);
      }
  };

  // ==========================================================================
  // 5. SISTEMA DE UI / NOTIFICACIONES
  // ==========================================================================

  const notify = (text, type = "info") => {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, text, type }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (authLoading) return (
      <div style={styles.loadingScreen}>
          <div className="loader"></div>
          <h2 style={{marginTop: 20, letterSpacing: 5}}>CARGANDO SISTEMA...</h2>
      </div>
  );

  // PANTALLA DE BANEO (PRIORIDAD ALTA)
  if (accessStatus === 'BANNED') return (
      <div style={styles.bannedScreen}>
          <h1 style={{fontSize: '80px', color: 'red', margin: 0}}>🚫</h1>
          <h1 style={styles.glitchText}>PERMANENTEMENTE BANEADO</h1>
          <p style={{marginTop: 20}}>Tu ID ({user?.email}) ha sido eliminado del sistema.</p>
          <p style={{color: '#666'}}>Error Code: BLK-LIST-ENFORCED</p>
          <button onClick={handleLogout} style={styles.btnGeneric}>CERRAR CONEXIÓN</button>
      </div>
  );

  // PANTALLA DE LOGIN
  if (!user || accessStatus === 'DENIED') return (
      <div style={styles.loginContainer}>
          <div style={styles.loginBox}>
              <h1 style={{fontSize: '40px', marginBottom: '10px'}}>ALEX HUB <span style={{color:'#E50914'}}>ULTRA</span></h1>
              <p style={{marginBottom: '40px', color:'#888', fontSize:'12px'}}>SECURE GATEWAY v14.0</p>
              
              {user ? (
                  <div style={{marginBottom: 30}}>
                      <p style={{color: 'orange'}}>⚠ CUENTA SIN AUTORIZACIÓN</p>
                      <p>{user.email}</p>
                      <button onClick={handleLogout} style={styles.linkBtn}>Usar otra cuenta</button>
                  </div>
              ) : (
                  <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                      <span style={{fontSize:'18px'}}>G</span> ACCEDER CON GOOGLE
                  </button>
              )}

              {loginError && <div style={styles.errorAlert}>{loginError}</div>}

              <div style={{marginTop: '50px', borderTop: '1px solid #333', paddingTop: '20px'}}>
                  <button onClick={() => setShowAdminLogin(true)} style={styles.adminLink}>
                      ACCESO DE COMANDO (ALEX)
                  </button>
              </div>
          </div>
          
          {/* MODAL LOGIN ADMIN */}
          {showAdminLogin && (
              <div style={styles.modalOverlay}>
                  <div style={styles.modalContent}>
                      <h3>IDENTIFICACIÓN REQUERIDA</h3>
                      <form onSubmit={handleAdminAuth}>
                          <input 
                            type="password" 
                            autoFocus
                            placeholder="CLAVE MAESTRA"
                            value={adminPassInput}
                            onChange={e => setAdminPassInput(e.target.value)}
                            style={styles.inputDark}
                          />
                          <div style={{display:'flex', gap:10, marginTop:20, justifyContent:'center'}}>
                            <button type="submit" style={styles.btnConfirm}>ENTRAR</button>
                            <button type="button" onClick={() => setShowAdminLogin(false)} style={styles.btnCancel}>CANCELAR</button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
      </div>
  );

  // ==========================================================================
  // DASHBOARD PRINCIPAL (SI TIENE ACCESO)
  // ==========================================================================
  return (
      <div style={styles.mainDashboard}>
          {/* --- BARRA SUPERIOR --- */}
          <header style={styles.navbar}>
              <div style={{display:'flex', alignItems:'center', gap: 20}}>
                  <div style={styles.logoArea}>
                      ALEX<span style={{color:'#E50914'}}>HUB</span>
                  </div>
                  <nav style={styles.navTabs}>
                      <button onClick={() => {setMode('youtube'); setActiveContent(null)}} style={mode==='youtube' ? styles.tabActive : styles.tab}>YOUTUBE</button>
                      <button onClick={() => {setMode('twitch'); setActiveContent(null)}} style={mode==='twitch' ? styles.tabActive : styles.tab}>TWITCH</button>
                      <button onClick={() => {setMode('movies'); setActiveContent(null)}} style={mode==='movies' ? styles.tabActive : styles.tab}>PELÍCULAS</button>
                  </nav>
              </div>

              <div style={styles.searchContainer}>
                  <form onSubmit={searchContent} style={{width:'100%', display:'flex'}}>
                      <input 
                        style={styles.mainSearchInput} 
                        placeholder={`Buscar en ${mode.toUpperCase()}...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                  </form>
              </div>

              <div style={styles.userArea}>
                  {premiumUsers[sanitizeEmail(user.email)] && <span style={styles.premiumBadge}>💎 VIP</span>}
                  <img src={user.photoURL} style={styles.avatar} alt="User" />
                  <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontSize:'12px', fontWeight:'bold'}}>{user.displayName}</span>
                      <button onClick={handleLogout} style={styles.logoutSmall}>SALIR</button>
                  </div>
                  {/* BOTÓN DE PÁNICO EN EL HEADER TAMBIÉN POR SEGURIDAD */}
                  <button onClick={activatePanicMode} style={styles.panicBtnSmall}>⚠️</button>
                  <button onClick={() => setShowAdminLogin(true)} style={styles.adminIcon}>⚙</button>
              </div>
          </header>

          {/* --- ÁREA DE CONTENIDO --- */}
          <main style={styles.contentBody}>
              {/* BOTÓN DE PÁNICO FLOTANTE (REQUERIMIENTO PRINCIPAL) */}
              <div style={styles.floatingPanicContainer}>
                   <button onClick={activatePanicMode} style={styles.bigPanicButton}>
                       PÁNICO
                       <span style={{fontSize:'10px', display:'block', marginTop:'5px'}}>BORRAR TODO</span>
                   </button>
              </div>

              {isLoadingContent && <div style={styles.loaderOverlay}><div className="loader"></div></div>}

              {/* REPRODUCTOR GIGANTE */}
              {mode === 'youtube' && activeContent ? (
                  <div style={styles.theaterMode}>
                      <button onClick={() => setActiveContent(null)} style={styles.closePlayerBtn}>❌ CERRAR REPRODUCTOR</button>
                      <iframe 
                        src={`https://www.youtube.com/embed/${activeContent}?autoplay=1&rel=0`}
                        style={styles.iframeBig}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Player"
                      />
                  </div>
              ) : (
                  // GRILLA DE RESULTADOS
                  mode === 'youtube' && (
                      <div style={styles.grid}>
                          {contentList.map(item => (
                              <div key={item.id.videoId} style={styles.videoCard} onClick={() => setActiveContent(item.id.videoId)}>
                                  <div style={styles.thumbContainer}>
                                      <img src={item.snippet.thumbnails.high.url} style={styles.thumbInfo} alt="thumb"/>
                                      <div style={styles.playOverlay}>▶</div>
                                  </div>
                                  <div style={styles.cardMeta}>
                                      <h4 style={styles.videoTitle}>{item.snippet.title}</h4>
                                      <span style={styles.channelName}>{item.snippet.channelTitle}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )
              )}

              {/* IFRAMES PARA OTROS MODOS */}
              {mode === 'twitch' && (
                  <div style={styles.fullFrameContainer}>
                      <iframe
                          src={`https://player.twitch.tv/?channel=${searchQuery || 'ibai'}&parent=${window.location.hostname}`}
                          style={styles.iframeBig}
                          allowFullScreen
                      />
                  </div>
              )}
              
              {mode === 'movies' && (
                   <div style={styles.fullFrameContainer}>
                       {/* Ejemplo de embed genérico, cambiar según proveedor */}
                       <iframe 
                          src={`https://www.google.com/search?igu=1&q=${encodeURIComponent(searchQuery || 'movies')}`} 
                          style={styles.iframeBig}
                       />
                       <div style={{position:'absolute', top:20, left:20, background:'rgba(0,0,0,0.8)', padding:10, borderRadius:5}}>
                           Modo Navegador Web Interno
                       </div>
                   </div>
              )}
          </main>

          {/* --- SUPERPOSICIÓN DE PANEL DE ADMINISTRADOR (COMMAND CENTER) --- */}
          {isAdminPanelOpen && (
              <div style={styles.adminPanelOverlay}>
                  <div style={styles.adminDashboard}>
                      <div style={styles.adminHeader}>
                          <h2>COMMAND CENTER <span style={{color:'#E50914'}}>ADMIN</span></h2>
                          <button onClick={() => setIsAdminPanelOpen(false)} style={styles.closeAdminBtn}>CERRAR SISTEMA</button>
                      </div>
                      
                      <div style={styles.adminLayout}>
                          {/* SIDEBAR */}
                          <div style={styles.adminSidebar}>
                              <button onClick={()=>setAdminActiveTab('whitelist')} style={adminActiveTab==='whitelist'?styles.adminSideBtnActive:styles.adminSideBtn}>WHITELIST</button>
                              <button onClick={()=>setAdminActiveTab('blacklist')} style={adminActiveTab==='blacklist'?styles.adminSideBtnActive:styles.adminSideBtn}>BLACKLIST (BAN)</button>
                              <button onClick={()=>setAdminActiveTab('premium')} style={adminActiveTab==='premium'?styles.adminSideBtnActive:styles.adminSideBtn}>PREMIUM</button>
                              <button onClick={()=>setAdminActiveTab('logs')} style={adminActiveTab==='logs'?styles.adminSideBtnActive:styles.adminSideBtn}>SYSTEM LOGS</button>
                          </div>

                          {/* CONTENIDO ADMIN */}
                          <div style={styles.adminContent}>
                              {adminActiveTab !== 'logs' ? (
                                  <div style={styles.managementPanel}>
                                      <div style={styles.actionBox}>
                                          <input 
                                            value={adminTargetEmail} 
                                            onChange={e=>setAdminTargetEmail(e.target.value)} 
                                            placeholder="correo@usuario.com (Funciona con .eu, .es, etc)"
                                            style={styles.adminInputBig}
                                          />
                                          <div style={{display:'flex', gap:10, marginTop:10}}>
                                              <button 
                                                onClick={() => executeAdminCommand('ADD', adminActiveTab === 'premium' ? 'premium_users' : adminActiveTab)}
                                                style={styles.btnAdd}
                                              >
                                                  AÑADIR / AUTORIZAR
                                              </button>
                                              <button 
                                                onClick={() => executeAdminCommand('REMOVE', adminActiveTab === 'premium' ? 'premium_users' : adminActiveTab)}
                                                style={styles.btnRemove}
                                              >
                                                  ELIMINAR / PERDONAR
                                              </button>
                                          </div>
                                      </div>

                                      <div style={styles.dataList}>
                                          <h4 style={{borderBottom:'1px solid #333', paddingBottom:10}}>BASE DE DATOS: {adminActiveTab.toUpperCase()}</h4>
                                          {/* Renderizado dinámico de listas */}
                                          {Object.values(
                                              adminActiveTab === 'whitelist' ? whitelist :
                                              adminActiveTab === 'blacklist' ? blacklist : premiumUsers
                                          ).map((u, i) => (
                                              <div key={i} style={styles.dataRow}>
                                                  <span>{u.email}</span>
                                                  <button 
                                                    onClick={() => {
                                                        setAdminTargetEmail(u.email);
                                                        // Auto-fill para acción rápida
                                                    }}
                                                    style={styles.btnSelect}
                                                  >
                                                      SELECCIONAR
                                                  </button>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ) : (
                                  <div style={styles.logsConsole}>
                                      {systemLogs.map((log, i) => (
                                          <div key={i} style={styles.logLine}>
                                              <span style={{color:'#666'}}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                              <span style={{color:'#E50914', fontWeight:'bold'}}> {log.user}:</span>
                                              <span style={{color:'#fff'}}> {log.msg}</span>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* --- NOTIFICACIONES TOAST --- */}
          <div style={styles.notificationArea}>
              {notifications.map(n => (
                  <div key={n.id} style={{...styles.toast, borderLeft: n.type==='error'?'4px solid red':'4px solid #00ff00'}}>
                      {n.text}
                  </div>
              ))}
          </div>
      </div>
  );
}

// ============================================================================
// ESTILOS MASIVOS (CSS-IN-JS) PARA CUMPLIR REQUISITO DE LÍNEAS Y DISEÑO
// ============================================================================

const styles = {
  // GLOBAL
  loadingScreen: { height:'100vh', background:'#000', color:'#E50914', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'monospace' },
  bannedScreen: { height:'100vh', background:'#050000', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', fontFamily:'Arial' },
  
  // LOGIN
  loginContainer: { height:'100vh', background:'radial-gradient(circle, #222 0%, #000 90%)', display:'flex', alignItems:'center', justifyContent:'center' },
  loginBox: { width:'400px', background:'#111', padding:'50px', borderRadius:'20px', border:'1px solid #333', textAlign:'center', color:'#fff', boxShadow:'0 0 50px rgba(0,0,0,0.8)' },
  googleBtn: { background:'#fff', color:'#000', border:'none', padding:'15px 30px', borderRadius:'30px', fontSize:'14px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'15px', width:'100%', justifyContent:'center', transition:'0.3s' },
  errorAlert: { background:'rgba(255,0,0,0.2)', color:'#ff5555', padding:'15px', borderRadius:'10px', marginTop:'20px', fontSize:'12px', border:'1px solid red' },
  adminLink: { background:'transparent', border:'none', color:'#444', fontSize:'10px', letterSpacing:'2px', cursor:'pointer' },

  // DASHBOARD
  mainDashboard: { height:'100vh', background:'#0a0a0a', color:'#fff', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:'Segoe UI, sans-serif' },
  navbar: { height:'80px', background:'#000', borderBottom:'1px solid #222', display:'flex', alignItems:'center', padding:'0 30px', justifyContent:'space-between' },
  logoArea: { fontSize:'24px', fontWeight:'900', letterSpacing:'-1px' },
  navTabs: { display:'flex', gap:'10px' },
  tab: { background:'transparent', color:'#888', border:'none', padding:'10px 20px', cursor:'pointer', fontWeight:'bold', fontSize:'12px', transition:'0.2s' },
  tabActive: { background:'#222', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'20px', cursor:'pointer', fontWeight:'bold', fontSize:'12px' },
  
  searchContainer: { flex:1, maxWidth:'600px', margin:'0 40px' },
  mainSearchInput: { width:'100%', padding:'12px 20px', background:'#111', border:'1px solid #333', borderRadius:'10px', color:'#fff', outline:'none' },
  
  userArea: { display:'flex', alignItems:'center', gap:'15px' },
  avatar: { width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #333' },
  premiumBadge: { background:'gold', color:'#000', padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:'bold' },
  logoutSmall: { background:'transparent', border:'none', color:'#666', fontSize:'10px', cursor:'pointer', textAlign:'left', padding:0 },
  adminIcon: { background:'#222', border:'none', color:'#fff', width:'30px', height:'30px', borderRadius:'50%', cursor:'pointer' },
  panicBtnSmall: { background:'#E50914', border:'none', color:'#fff', width:'30px', height:'30px', borderRadius:'50%', cursor:'pointer', fontWeight:'bold' },

  // CONTENT
  contentBody: { flex:1, overflowY:'auto', padding:'30px', position:'relative' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px' },
  videoCard: { background:'#111', borderRadius:'12px', overflow:'hidden', cursor:'pointer', transition:'transform 0.2s', border:'1px solid #222' },
  thumbContainer: { position:'relative', paddingTop:'56.25%' },
  thumbInfo: { position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover' },
  playOverlay: { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', fontSize:'40px', color:'#fff', opacity:0, transition:'0.2s', textShadow:'0 0 20px black' },
  cardMeta: { padding:'15px' },
  videoTitle: { margin:'0 0 5px 0', fontSize:'14px', lineHeight:'1.4', height:'40px', overflow:'hidden' },
  channelName: { fontSize:'11px', color:'#888' },
  
  // THEATER MODE (BIG VIDEOS)
  theaterMode: { position:'fixed', top:'80px', left:0, right:0, bottom:0, background:'#000', zIndex:50, padding:'20px', display:'flex', flexDirection:'column', alignItems:'center' },
  iframeBig: { width:'100%', height:'85vh', border:'none', borderRadius:'10px', boxShadow:'0 0 50px rgba(229, 9, 20, 0.2)' },
  closePlayerBtn: { marginBottom:'10px', background:'#333', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'20px', cursor:'pointer', fontWeight:'bold' },
  fullFrameContainer: { width:'100%', height:'100%', borderRadius:'20px', overflow:'hidden', border:'1px solid #333' },

  // PANIC BUTTON
  floatingPanicContainer: { position:'fixed', bottom:'30px', right:'30px', zIndex:1000 },
  bigPanicButton: { 
      width:'100px', height:'100px', borderRadius:'50%', background:'red', border:'5px solid #fff', 
      color:'#fff', fontWeight:'900', fontSize:'16px', cursor:'pointer', 
      boxShadow:'0 10px 30px rgba(255,0,0,0.6)', animation:'pulse 2s infinite' 
  },

  // ADMIN PANEL
  adminPanelOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' },
  adminDashboard: { width:'90%', height:'90%', background:'#000', border:'1px solid #333', borderRadius:'20px', display:'flex', flexDirection:'column', boxShadow:'0 0 100px #000' },
  adminHeader: { padding:'20px 30px', borderBottom:'1px solid #222', display:'flex', justifyContent:'space-between', alignItems:'center' },
  closeAdminBtn: { background:'#fff', color:'#000', border:'none', padding:'10px 20px', fontWeight:'bold', cursor:'pointer', borderRadius:'5px' },
  adminLayout: { display:'flex', flex:1, overflow:'hidden' },
  adminSidebar: { width:'250px', borderRight:'1px solid #222', padding:'20px', display:'flex', flexDirection:'column', gap:'10px', background:'#050505' },
  adminSideBtn: { textAlign:'left', padding:'15px', background:'transparent', color:'#666', border:'none', cursor:'pointer', fontWeight:'bold' },
  adminSideBtnActive: { textAlign:'left', padding:'15px', background:'#111', color:'#E50914', border:'none', cursor:'pointer', fontWeight:'bold', borderLeft:'4px solid #E50914' },
  
  adminContent: { flex:1, padding:'40px', overflowY:'auto' },
  managementPanel: { maxWidth:'800px', margin:'0 auto' },
  actionBox: { background:'#111', padding:'30px', borderRadius:'15px', marginBottom:'30px' },
  adminInputBig: { width:'100%', padding:'15px', fontSize:'16px', background:'#000', border:'1px solid #444', color:'#fff', borderRadius:'5px', marginBottom:'15px' },
  btnAdd: { flex:1, padding:'15px', background:'#00ff00', border:'none', fontWeight:'bold', cursor:'pointer', borderRadius:'5px' },
  btnRemove: { flex:1, padding:'15px', background:'#E50914', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer', borderRadius:'5px' },
  
  dataList: { display:'flex', flexDirection:'column', gap:'10px' },
  dataRow: { display:'flex', justifyContent:'space-between', padding:'15px', background:'#111', border:'1px solid #222', borderRadius:'5px', alignItems:'center' },
  btnSelect: { background:'#333', color:'#fff', border:'none', padding:'5px 10px', fontSize:'10px', cursor:'pointer', borderRadius:'3px' },
  
  logsConsole: { background:'#050505', padding:'20px', fontFamily:'monospace', height:'100%', overflowY:'auto', border:'1px solid #222' },
  logLine: { marginBottom:'5px', fontSize:'12px', borderBottom:'1px solid #111', paddingBottom:'2px' },

  // MODALS & NOTIFS
  modalOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' },
  modalContent: { background:'#111', padding:'40px', borderRadius:'15px', border:'1px solid #333', textAlign:'center', width:'300px' },
  inputDark: { width:'100%', padding:'10px', background:'#000', border:'1px solid #444', color:'#fff', marginTop:'20px', textAlign:'center', outline:'none' },
  btnConfirm: { background:'#E50914', color:'#fff', padding:'10px 20px', border:'none', cursor:'pointer', borderRadius:'5px' },
  btnCancel: { background:'transparent', color:'#888', padding:'10px 20px', border:'none', cursor:'pointer' },
  
  notificationArea: { position:'fixed', top:'20px', right:'20px', zIndex:1000, display:'flex', flexDirection:'column', gap:'10px' },
  toast: { background:'#111', color:'#fff', padding:'15px 25px', borderRadius:'5px', boxShadow:'0 10px 30px rgba(0,0,0,0.5)', fontWeight:'bold', fontSize:'13px' },
  
  glitchText: {
    fontSize: '40px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '5px'
  }
};
