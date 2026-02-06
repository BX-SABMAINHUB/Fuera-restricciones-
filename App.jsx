import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ==========================================
// 1. CONFIGURACIÓN DEL NÚCLEO (FIREBASE)
// ==========================================
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

export default function AlexHubUltraV13() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // --- ESTADOS DE SEGURIDAD Y LISTAS ---
  const [whitelist, setWhitelist] = useState({});
  const [blacklist, setBlacklist] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [isBanned, setIsBanned] = useState(false);

  // --- NAVEGACIÓN Y CONTENIDO ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // --- PANEL ADMINISTRADOR (ALEX) ---
  const [showAlexLogin, setShowAlexLogin] = useState(false);
  const [alexPassInput, setAlexPassInput] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');

  // ==========================================
  // 2. LÓGICA DE AUTENTICACIÓN OFICIAL GOOGLE
  // ==========================================

  useEffect(() => {
    // Escuchar cambios en el estado de la sesión
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkUserAccess(currentUser.email);
      } else {
        setAccessGranted(false);
      }
      setAuthLoading(false);
    });

    // Cargar listas de control desde DB
    onValue(ref(db, 'whitelist'), (s) => setWhitelist(s.val() || {}));
    onValue(ref(db, 'blacklist'), (s) => setBlacklist(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      // ESTE ES EL POPUP OFICIAL DE GOOGLE
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      checkUserAccess(userEmail);
    } catch (error) {
      console.error("Error en Login:", error);
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        setLoginError("Login cancelado por el usuario.");
      } else {
        setLoginError("Error conectando con Google. Reintente.");
      }
    }
  };

  const checkUserAccess = (email) => {
    // Formatear email para Firebase (reemplazar puntos por comas)
    const emailKey = email.replace(/\./g, ',');
    
    // 1. Ver baneo
    onValue(ref(db, `blacklist/${emailKey}`), (snapshot) => {
      if (snapshot.exists()) {
        setIsBanned(true);
        setAccessGranted(false);
      } else {
        setIsBanned(false);
        // 2. Ver si está en la lista blanca
        onValue(ref(db, `whitelist/${emailKey}`), (whiteSnap) => {
          if (whiteSnap.exists()) {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setLoginError("Tu correo no tiene permiso de acceso. Contacta al Admin.");
          }
        });
      }
    });
  };

  const handleLogout = () => {
    signOut(auth);
    window.location.reload();
  };

  // ==========================================
  // 3. SISTEMA ADMINISTRADOR "ALEX"
  // ==========================================

  const handleAlexSubmit = (e) => {
    e.preventDefault();
    if (alexPassInput === ADMIN_PASS) {
      setIsAdminOpen(true);
      setShowAlexLogin(false);
      setAlexPassInput('');
    } else {
      alert("CONTRASEÑA INCORRECTA");
    }
  };

  const manageUser = (type, email, action) => {
    const emailKey = email.replace(/\./g, ',');
    if (action === 'add') {
      set(ref(db, `${type}/${emailKey}`), { 
        email: email, 
        addedAt: serverTimestamp() 
      });
    } else {
      remove(ref(db, `${type}/${emailKey}`));
    }
  };

  const addPremium = (email) => {
    if (!premiumUsers.includes(email)) {
      const updated = [...premiumUsers, email];
      set(ref(db, 'premium_users'), updated);
    }
  };

  const removePremium = (email) => {
    const updated = premiumUsers.filter(e => e !== email);
    set(ref(db, 'premium_users'), updated);
  };

  // ==========================================
  // 4. BÚSQUEDA Y CONTENIDO
  // ==========================================

  const performSearch = async (e) => {
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
    } catch (err) { console.error(err); }
    setLoadingContent(false);
  };

  // ==========================================
  // 5. RENDERIZADO DE INTERFAZ
  // ==========================================

  // --- PANTALLA CARGANDO ---
  if (authLoading) return <div style={styles.fullCenter}><div className="loader"></div></div>;

  // --- PANTALLA BANEO ---
  if (isBanned) return (
    <div style={styles.bannedScreen}>
      <h1 className="glitch">ACCESO DENEGADO</h1>
      <p>Tu correo ha sido bloqueado permanentemente del servidor.</p>
      <button onClick={handleLogout} style={styles.loginBtn}>VOLVER</button>
    </div>
  );

  // --- PANTALLA LOGIN (GOOGLE) ---
  if (!user || !accessGranted) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
        <p style={{color: '#888', marginBottom: '30px'}}>SISTEMA DE ACCESO OFICIAL</p>
        
        {/* BOTÓN OFICIAL DE GOOGLE */}
        <button onClick={handleGoogleLogin} style={styles.googleBtn}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{width:'20px'}} />
          Log in with Google
        </button>

        {loginError && <p style={styles.errorText}>{loginError}</p>}

        <div style={{marginTop: '40px'}}>
           <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtn}>ALEX</button>
        </div>
      </div>

      {/* MODAL PASSWORD ALEX */}
      {showAlexLogin && (
        <div style={styles.modalOverlay}>
          <div style={styles.miniCard}>
             <h3>SYSTEM ADMIN</h3>
             <form onSubmit={handleAlexSubmit}>
               <input 
                 type="password" 
                 placeholder="Contraseña" 
                 value={alexPassInput} 
                 onChange={e => setAlexPassInput(e.target.value)} 
                 style={styles.adminInput}
                 autoFocus
               />
               <div style={{display:'flex', gap:'10px'}}>
                 <button type="submit" style={styles.confirmBtn}>ENTRAR</button>
                 <button onClick={() => setShowAlexLogin(false)} style={styles.cancelBtn}>CERRAR</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );

  // --- DASHBOARD PRINCIPAL (TODO EL CONTENIDO) ---
  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>ULTRA V13</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <form onSubmit={performSearch} style={styles.searchForm}>
          <input style={styles.searchInput} placeholder={`Buscar en ${mode}...`} value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>

        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
           {premiumUsers.includes(user.email) && <span style={styles.premiumLabel}>👑 PREMIUM</span>}
           <div style={styles.userInfo}>
              <img src={user.photoURL} style={styles.userPic} alt="profile" />
              <button onClick={handleLogout} style={styles.logoutMini}>SALIR</button>
           </div>
           <button onClick={() => setShowAlexLogin(true)} style={styles.alexBtnMini}>ALEX</button>
        </div>
      </nav>

      <main style={styles.contentArea}>
        {loadingContent && <div style={styles.loadOverlay}><div className="loader"></div></div>}
        
        {mode === 'youtube' && (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.playerWrap}>
                <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
                <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>VOLVER A LA LISTA</button>
              </div>
            ) : (
              videos.map((v, i) => (
                <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                  <img src={v.snippet.thumbnails.high.url} style={styles.thumb} alt="thumb" />
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
                     mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                     "https://www.xbox.com/play"} 
                style={styles.iframe} 
              />
           </div>
        )}
      </main>

      {/* --- FRAME GIGANTE ADMINISTRADOR --- */}
      {isAdminOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <h1>ALEX HUB COMMAND CENTER - CONTROL TOTAL</h1>
            <button onClick={() => setIsAdminOpen(false)} style={styles.closeAdmin}>CERRAR SISTEMA</button>
          </div>
          
          <div style={styles.adminBody}>
            {/* GESTIÓN DE CORREOS (WHITELIST) */}
            <div style={styles.adminSection}>
               <h3 style={{color: '#00ff41'}}>✅ ACCESO PERMITIDO (WHITELIST)</h3>
               <div style={styles.adminActionRow}>
                  <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="nuevo@gmail.com" style={styles.adminInputText}/>
                  <button onClick={() => {manageUser('whitelist', newEmailInput, 'add'); setNewEmailInput('')}} style={styles.addBtn}>PERMITIR</button>
               </div>
               <div style={styles.scrollList}>
                  {Object.values(whitelist).map(u => (
                    <div key={u.email} style={styles.listItem}>
                       <span>{u.email}</span>
                       <button onClick={() => manageUser('whitelist', u.email, 'remove')} style={styles.deleteBtn}>QUITAR</button>
                    </div>
                  ))}
               </div>
            </div>

            {/* GESTIÓN DE BANEOS */}
            <div style={styles.adminSection}>
               <h3 style={{color: '#E50914'}}>🚫 CORREOS BANEADOS (BAN)</h3>
               <div style={styles.adminActionRow}>
                  <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="baneo@gmail.com" style={styles.adminInputText}/>
                  <button onClick={() => {manageUser('blacklist', newEmailInput, 'add'); setNewEmailInput('')}} style={styles.banBtnAction}>BANEAR</button>
               </div>
               <div style={styles.scrollList}>
                  {Object.values(blacklist).map(u => (
                    <div key={u.email} style={styles.listItem}>
                       <span>{u.email}</span>
                       <button onClick={() => manageUser('blacklist', u.email, 'remove')} style={styles.unbanBtn}>DESBANEAR</button>
                    </div>
                  ))}
               </div>
            </div>

            {/* GESTIÓN PREMIUM */}
            <div style={styles.adminSection}>
               <h3 style={{color: '#FFD700'}}>💎 USUARIOS PREMIUM</h3>
               <div style={styles.adminActionRow}>
                  <input value={newEmailInput} onChange={e=>setNewEmailInput(e.target.value)} placeholder="premium@gmail.com" style={styles.adminInputText}/>
                  <button onClick={() => {addPremium(newEmailInput); setNewEmailInput('')}} style={styles.premiumBtnAdd}>DAR PREMIUM</button>
               </div>
               <div style={styles.scrollList}>
                  {premiumUsers.map(email => (
                    <div key={email} style={styles.listItem}>
                       <span>{email}</span>
                       <button onClick={() => removePremium(email)} style={styles.deleteBtn}>QUITAR</button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>SISTEMA: <span style={{color: '#00ff41'}}>ACTIVO</span></span>
        <span>GOOGLE_AUTH: <span style={{color: '#00ff41'}}>VERIFICADO</span></span>
        <span>V13.0.0</span>
      </footer>
    </div>
  );
}

// ==========================================
// ESTILOS DE ALTA CALIDAD (UX/UI)
// ==========================================
const styles = {
  fullCenter: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loginPage: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  loginCard: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center', boxShadow: '0 0 50px rgba(229,9,20,0.2)' },
  glitchText: { fontSize: '40px', fontWeight: '900', letterSpacing: '5px', color: '#fff' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '50px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', margin: '0 auto' },
  alexBtn: { background: 'transparent', border: '1px solid #333', color: '#333', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  errorText: { color: '#E50914', marginTop: '20px', fontWeight: 'bold' },
  
  appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff' },
  navbar: { height: '80px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '24px', fontWeight: '900' },
  logoSub: { fontSize: '10px', color: '#E50914', display: 'block' },
  
  tabContainer: { display: 'flex', gap: '5px', marginLeft: '30px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 15px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', borderRadius: '8px', border: 'none', padding: '10px 15px', fontWeight: 'bold' },
  
  searchForm: { flex: 1, maxWidth: '500px', margin: '0 40px' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #222', borderRadius: '50px', padding: '12px 25px', color: '#fff', outline: 'none' },
  
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px', background: '#111', padding: '5px 15px', borderRadius: '50px' },
  userPic: { width: '35px', height: '35px', borderRadius: '50%' },
  logoutMini: { background: 'none', border: 'none', color: '#666', fontSize: '11px', cursor: 'pointer' },
  alexBtnMini: { background: '#E50914', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  premiumLabel: { color: '#FFD700', fontWeight: 'bold', fontSize: '12px' },

  contentArea: { flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.3s' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px', fontSize: '14px', fontWeight: 'bold' },

  fullFrame: { width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  playerWrap: { gridColumn: '1/-1', height: '75vh', position: 'relative' },
  closeVideoBtn: { position: 'absolute', top: '-50px', right: '0', background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },

  adminFrame: { position: 'fixed', inset: '30px', background: '#050505', border: '2px solid #E50914', zIndex: 10000, borderRadius: '30px', display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '20px 40px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminBody: { flex: 1, padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', overflowY: 'auto' },
  adminSection: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '25px', display: 'flex', flexDirection: 'column' },
  adminActionRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  adminInputText: { flex: 1, background: '#000', border: '1px solid #333', padding: '10px', borderRadius: '8px', color: '#fff' },
  scrollList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  listItem: { background: '#050505', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  
  addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold' },
  banBtnAction: { background: '#E50914', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold' },
  premiumBtnAdd: { background: '#FFD700', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold' },
  deleteBtn: { background: '#333', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px' },
  closeAdmin: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  miniCard: { background: '#0a0a0a', padding: '40px', borderRadius: '25px', border: '1px solid #E50914', textAlign: 'center' },
  adminInput: { width: '100%', padding: '15px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '10px', fontSize: '20px', textAlign: 'center', marginBottom: '20px' },
  confirmBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#555', border: 'none', padding: '12px 25px', cursor: 'pointer' },
  
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '10px', color: '#444', borderTop: '1px solid #111' },
  bannedScreen: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  loadOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// --- ANIMACIONES CSS ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .loader { width: 50px; height: 50px; border: 5px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .glitch { font-size: 50px; color: #E50914; letter-spacing: 10px; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    .card:hover { transform: scale(1.05); border-color: #E50914; box-shadow: 0 10px 20px rgba(229,9,20,0.3); }
    button:active { transform: scale(0.95); }
  `;
  document.head.appendChild(style);
}
