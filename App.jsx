import React, { useState, useEffect, useRef } from 'react';
// IMPORTAMOS AUTH DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURACIÓN FIREBASE (NO TOCAR) ---
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

// Inicialización
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// CLAVES MAESTRAS
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";
const ADMIN_PASS = "Alex2706";

export default function AlexHubEliteV13() {
  // --- ESTADOS DE USUARIO ---
  const [user, setUser] = useState(null); // Usuario de Google
  const [accessStatus, setAccessStatus] = useState('checking'); // 'checking', 'allowed', 'denied', 'banned'
  const [myId, setMyId] = useState('');

  // --- NAVEGACIÓN Y CONTENIDO ---
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // --- ADMIN SYSTEM ---
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // --- DATOS DEL ADMIN (Listas) ---
  const [allowedEmails, setAllowedEmails] = useState({});
  const [bannedEmails, setBannedEmails] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  
  // Inputs del Admin
  const [inputAllow, setInputAllow] = useState('');
  const [inputBan, setInputBan] = useState('');
  const [inputPremium, setInputPremium] = useState('');
  const [viewPuModal, setViewPuModal] = useState(false);

  // ==========================================
  // 1. INICIALIZACIÓN Y SEGURIDAD
  // ==========================================
  useEffect(() => {
    // Generar ID único de dispositivo (Hardware ID simulado)
    let storedId = localStorage.getItem('_ah_hwid');
    if (!storedId) {
      storedId = 'DEV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('_ah_hwid', storedId);
    }
    setMyId(storedId);

    // Cargar listas de Firebase en tiempo real
    onValue(ref(db, 'access_control/allowed'), s => setAllowedEmails(s.val() || {}));
    onValue(ref(db, 'access_control/banned'), s => setBannedEmails(s.val() || {}));
    onValue(ref(db, 'premium_users'), s => setPremiumUsers(s.val() || []));
    onValue(ref(db, 'online'), s => setOnlineUsers(s.val() || {}));

    // Monitorizar autenticación de Google
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAccessStatus('guest');
      }
    });
    return () => unsubscribe();
  }, []);

  // ==========================================
  // 2. LÓGICA DE CONTROL DE ACCESO (EL CEREBRO)
  // ==========================================
  useEffect(() => {
    if (!user) return;

    // Convertir email a formato seguro para Firebase (sin puntos)
    const emailKey = user.email.replace(/\./g, ',');

    // 1. Revisar si está BANEADO
    if (bannedEmails[emailKey]) {
      setAccessStatus('banned');
      return;
    }

    // 2. Revisar si está PERMITIDO (Whitelist)
    // NOTA: Si quieres que entre CUALQUIERA con Google, quita este if. 
    // Pero pediste que "puedas poner el correo que SI pueda acceder".
    if (allowedEmails[emailKey]) {
      setAccessStatus('allowed');
      
      // Registrar online status
      const presenceRef = ref(db, `online/${myId}`);
      set(presenceRef, {
        email: user.email,
        name: user.displayName,
        lastSeen: serverTimestamp()
      });
      onDisconnect(presenceRef).remove();

    } else {
      setAccessStatus('denied');
    }
  }, [user, allowedEmails, bannedEmails, myId]);

  // ==========================================
  // 3. FUNCIONES DE GOOGLE
  // ==========================================
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      alert("Error conectando con Google.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setAccessStatus('guest');
  };

  // ==========================================
  // 4. FUNCIONES DE ADMIN
  // ==========================================
  const verifyAdmin = (e) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAdminLogin(false);
      setAdminPass('');
    } else {
      alert("CLAVE INCORRECTA");
    }
  };

  // --- GESTIÓN DE CORREOS ---
  const addToAllow = (e) => {
    e.preventDefault();
    if(!inputAllow) return;
    const key = inputAllow.replace(/\./g, ',');
    set(ref(db, `access_control/allowed/${key}`), { email: inputAllow, date: Date.now() });
    setInputAllow('');
  };

  const removeFromAllow = (key) => {
    remove(ref(db, `access_control/allowed/${key}`));
  };

  const addToBan = (e) => {
    e.preventDefault();
    if(!inputBan) return;
    const key = inputBan.replace(/\./g, ',');
    // Añadir a bans y quitar de allowed si estaba
    set(ref(db, `access_control/banned/${key}`), { email: inputBan, reason: 'Admin Ban', date: Date.now() });
    remove(ref(db, `access_control/allowed/${key}`)); 
    setInputBan('');
  };

  const removeFromBan = (key) => {
    remove(ref(db, `access_control/banned/${key}`));
  };

  // --- PREMIUM ---
  const addPremium = (e) => {
    e.preventDefault();
    if(!inputPremium) return;
    const updated = [...premiumUsers, inputPremium];
    set(ref(db, 'premium_users'), updated);
    setInputPremium('');
  };

  const removePremium = (idx) => {
    const updated = premiumUsers.filter((_, i) => i !== idx);
    set(ref(db, 'premium_users'), updated);
  };

  // ==========================================
  // 5. FUNCIONALIDAD DE LA APP (Youtube, etc)
  // ==========================================
  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setTransitioning(true);
    setTimeout(() => { setMode(newMode); setTransitioning(false); }, 1500);
  };

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query || mode !== 'youtube') return;
    setLoading(true);
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      setVideos(data.items || []);
      setSelectedVideo(null);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // ==========================================
  // 6. RENDERIZADO
  // ==========================================

  // --- PANTALLA DE CARGA INICIAL ---
  if (accessStatus === 'checking' && user) return <div style={styles.centerScreen}><div className="spin"></div></div>;

  // --- LOGIN SCREEN (Si no estás autorizado) ---
  if (accessStatus !== 'allowed') {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginContainer}>
          <h1 style={styles.title}>ALEX HUB <span style={{color:'#E50914'}}>V13</span></h1>
          
          {accessStatus === 'banned' && (
            <div style={styles.alertBox}>🚫 TU CUENTA HA SIDO BANEADA PERMANENTEMENTE</div>
          )}
          
          {accessStatus === 'denied' && (
            <div style={styles.warningBox}>⚠️ EMAIL NO AUTORIZADO. CONTACTA CON ALEX.</div>
          )}

          {accessStatus !== 'banned' && (
            <button onClick={handleGoogleLogin} style={styles.googleBtn}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" style={{marginRight:'10px'}}/>
              Log in with Google
            </button>
          )}

          <div style={{marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center'}}>
            <span style={{color: '#444', fontSize: '12px'}}>ADMIN ACCESS:</span>
            <button onClick={() => setShowAdminLogin(true)} style={styles.secretBtn}>ALEX</button>
          </div>
        </div>

        {/* MODAL PASSWORD ADMIN */}
        {showAdminLogin && (
          <div style={styles.modalBack} onClick={() => setShowAdminLogin(false)}>
            <div style={styles.modalSmall} onClick={e => e.stopPropagation()}>
              <h3 style={{color: '#E50914'}}>SEGURIDAD DE NIVEL 5</h3>
              <form onSubmit={verifyAdmin}>
                <input 
                  type="password" 
                  value={adminPass} 
                  onChange={e => setAdminPass(e.target.value)} 
                  placeholder="CONTRASEÑA" 
                  style={styles.inputPass} 
                  autoFocus
                />
                <button type="submit" style={styles.confirmBtn}>ACCEDER</button>
              </form>
            </div>
          </div>
        )}

        {/* --- EL FRAME GIGANTE DEL ADMIN --- */}
        {isAdminOpen && (
          <div style={styles.giantFrame}>
            <div style={styles.gfHeader}>
              <h2>🛠️ PANEL DE CONTROL MAESTRO</h2>
              <button onClick={() => setIsAdminOpen(false)} style={styles.gfClose}>CERRAR SISTEMA</button>
            </div>
            
            <div style={styles.gfBody}>
              {/* COLUMNA 1: WHITELIST (Permitir) */}
              <div style={styles.gfCol}>
                <h3 style={{color: '#00ff41'}}>✅ PERMITIR ACCESO</h3>
                <p style={styles.subtext}>Correos que PUEDEN loguearse.</p>
                <form onSubmit={addToAllow} style={styles.gfForm}>
                  <input value={inputAllow} onChange={e=>setInputAllow(e.target.value)} placeholder="email@ejemplo.com" style={styles.gfInput}/>
                  <button style={{...styles.gfBtn, background: '#00ff41', color: '#000'}}>AÑADIR</button>
                </form>
                <div style={styles.listContainer}>
                  {Object.values(allowedEmails).map((item, i) => (
                    <div key={i} style={styles.listItem}>
                      <span>{item.email}</span>
                      <button onClick={() => removeFromAllow(item.email.replace(/\./g, ','))} style={styles.delBtn}>✖</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA 2: BLACKLIST (Banear) */}
              <div style={styles.gfCol}>
                <h3 style={{color: '#E50914'}}>🚫 BANEAR (BLACKLIST)</h3>
                <p style={styles.subtext}>Correos BLOQUEADOS permanentemente.</p>
                <form onSubmit={addToBan} style={styles.gfForm}>
                  <input value={inputBan} onChange={e=>setInputBan(e.target.value)} placeholder="banned@user.com" style={styles.gfInput}/>
                  <button style={{...styles.gfBtn, background: '#E50914'}}>BANEAR</button>
                </form>
                <div style={styles.listContainer}>
                  {Object.values(bannedEmails).map((item, i) => (
                    <div key={i} style={styles.listItem}>
                      <span style={{color: '#ff6b6b'}}>{item.email}</span>
                      <button onClick={() => removeFromBan(item.email.replace(/\./g, ','))} style={styles.delBtn}>DESBANEAR</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA 3: PREMIUM & USUARIOS ONLINE */}
              <div style={styles.gfCol}>
                <h3 style={{color: '#FFD700'}}>👑 PREMIUM & ONLINE</h3>
                <form onSubmit={addPremium} style={styles.gfForm}>
                  <input value={inputPremium} onChange={e=>setInputPremium(e.target.value)} placeholder="Nombre Premium..." style={styles.gfInput}/>
                  <button style={{...styles.gfBtn, background: '#FFD700', color: '#000'}}>+</button>
                </form>
                <div style={{...styles.listContainer, height: '150px'}}>
                  {premiumUsers.map((name, i) => (
                    <div key={i} style={styles.listItem}>
                      <span>{name}</span>
                      <button onClick={() => removePremium(i)} style={styles.delBtn}>✖</button>
                    </div>
                  ))}
                </div>
                
                <h4 style={{marginTop: '20px', color: '#00d2ff'}}>📡 CONECTADOS AHORA:</h4>
                <div style={styles.onlineList}>
                  {Object.values(onlineUsers).map((u, i) => (
                    <div key={i} style={{fontSize: '11px', color: '#888'}}>
                      {u.email} ({u.name})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- APP PRINCIPAL (SOLO SI ESTÁ PERMITIDO) ---
  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB V13</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => handleModeChange(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {premiumUsers.length > 0 && (
          <button onClick={() => setViewPuModal(true)} style={styles.premiumBadge}>👑 Premium Users</button>
        )}

        <form onSubmit={performSearch} style={styles.searchForm}>
          <input style={styles.searchInput} placeholder="Buscar contenido..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>

        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={{textAlign: 'right', fontSize: '10px', color: '#aaa'}}>
             <div>{user.displayName}</div>
             <div onClick={handleLogout} style={{color: '#E50914', cursor: 'pointer', fontWeight: 'bold'}}>CERRAR SESIÓN</div>
          </div>
          <img src={user.photoURL} style={{width: '35px', borderRadius: '50%', border: '2px solid #333'}} />
          <button onClick={() => window.location.href = PANIC_URL} style={styles.panicBtn}>PÁNICO</button>
        </div>
      </nav>

      <main style={styles.contentArea}>
        {transitioning && <div style={styles.loadOverlay}><div className="spin"></div></div>}

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
                  <img src={v.snippet.thumbnails.high.url} style={styles.thumb} />
                  <div style={styles.cardInfo}><p>{v.snippet.title}</p></div>
                </div>
              ))
            )}
          </div>
        )}

        {mode !== 'youtube' && (
           <div style={styles.fullFrame}>
              <iframe 
                src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` :
                     mode === 'movies' ? `https://www.google.com/search?q=${query}+watch+online+free&igu=1` :
                     "https://www.bing.com/search?q=xbox+cloud+gaming+fortnite&igu=1"} 
                style={styles.iframe} 
              />
           </div>
        )}
      </main>

      {/* MODAL PREMIUM PÚBLICO */}
      {viewPuModal && (
        <div style={styles.modalBack} onClick={()=>setViewPuModal(false)}>
           <div style={styles.puCard} onClick={e=>e.stopPropagation()}>
              <h1 style={styles.puTitle}>👑 ELITE USERS</h1>
              <div style={styles.puGrid}>
                 {premiumUsers.map((name, i) => (
                   <div key={i} style={styles.puItem}>{name}</div>
                 ))}
              </div>
              <button onClick={()=>setViewPuModal(false)} style={styles.puCloseBtn}>CERRAR</button>
           </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ESTILOS ULTRA-MODERNOS
// ==========================================
const styles = {
  // PANTALLA LOGIN
  loginPage: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' },
  loginContainer: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', border: '1px solid #222', textAlign: 'center', boxShadow: '0 0 50px rgba(0,0,0,0.8)' },
  title: { fontSize: '40px', letterSpacing: '5px', color: '#fff', marginBottom: '40px' },
  googleBtn: { background: '#fff', color: '#333', border: 'none', padding: '15px 30px', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', margin: '0 auto', boxShadow: '0 5px 15px rgba(255,255,255,0.1)' },
  secretBtn: { background: 'transparent', border: '1px solid #333', color: '#333', fontSize: '10px', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  alertBox: { background: 'rgba(229, 9, 20, 0.2)', color: '#E50914', padding: '15px', borderRadius: '10px', border: '1px solid #E50914', marginBottom: '20px' },
  warningBox: { background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700', padding: '15px', borderRadius: '10px', border: '1px solid #FFD700', marginBottom: '20px' },
  
  // MODALES
  modalBack: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modalSmall: { background: '#111', padding: '30px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center' },
  inputPass: { background: '#000', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '5px', marginTop: '10px', textAlign: 'center' },
  confirmBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', marginTop: '15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },

  // FRAME GIGANTE DEL ADMIN
  giantFrame: { position: 'fixed', top: '2%', left: '2%', width: '96%', height: '96%', background: '#050505', border: '2px solid #333', borderRadius: '25px', zIndex: 10000, display: 'flex', flexDirection: 'column', boxShadow: '0 0 100px rgba(0,0,0,1)' },
  gfHeader: { height: '60px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', background: '#0a0a0a' },
  gfClose: { background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
  gfBody: { flex: 1, padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px' },
  gfCol: { background: '#0a0a0a', border: '1px solid #222', borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column' },
  subtext: { fontSize: '12px', color: '#666', marginBottom: '15px' },
  gfForm: { display: 'flex', gap: '10px', marginBottom: '15px' },
  gfInput: { flex: 1, background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px' },
  gfBtn: { border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold', color: '#fff', cursor: 'pointer' },
  listContainer: { flex: 1, overflowY: 'auto', background: '#000', borderRadius: '10px', padding: '10px', border: '1px solid #1a1a1a' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #111', fontSize: '13px' },
  delBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontWeight: 'bold' },
  onlineList: { marginTop: '10px', maxHeight: '100px', overflowY: 'auto' },

  // APP PRINCIPAL
  appContainer: { background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '80px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '24px', fontWeight: '900' },
  logoSub: { fontSize: '10px', color: '#E50914', display: 'block' },
  tabContainer: { display: 'flex', gap: '5px', background: '#111', padding: '5px', borderRadius: '15px', marginLeft: '30px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', borderRadius: '10px', padding: '10px 20px', border: 'none', fontWeight: 'bold' },
  searchForm: { flex: 1, maxWidth: '400px', margin: '0 30px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #222', borderRadius: '30px', padding: '12px 20px', color: '#fff', outline: 'none' },
  panicBtn: { background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
  
  contentArea: { flex: 1, padding: '30px', overflowY: 'auto', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px', fontSize: '14px', fontWeight: 'bold' },
  playerWrap: { gridColumn: '1/-1', height: '75vh', position: 'relative' },
  closeVideoBtn: { position: 'absolute', top: '-40px', right: 0, background: '#E50914', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px' },
  fullFrame: { height: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid #222' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  
  // PREMIUM MODAL
  puCard: { background: '#000', border: '2px solid #FFD700', padding: '40px', borderRadius: '30px', maxWidth: '500px', width: '90%' },
  puTitle: { textAlign: 'center', color: '#FFD700', letterSpacing: '5px', marginBottom: '30px' },
  puGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  puItem: { background: '#111', padding: '10px', textAlign: 'center', borderRadius: '10px', border: '1px solid #333', color: '#FFD700' },
  puCloseBtn: { width: '100%', marginTop: '20px', padding: '15px', background: 'none', border: '1px solid #FFD700', color: '#FFD700', borderRadius: '10px', cursor: 'pointer' },
  
  centerScreen: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }
};

// CSS ANIMACIÓN
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .spin { width: 40px; height: 40px; border: 4px solid #111; border-top-color: #E50914; border-radius: 50%; animation: s 1s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
    .card:hover { transform: translateY(-5px); border-color: #333; transition: 0.3s; }
  `;
  document.head.appendChild(style);
}
