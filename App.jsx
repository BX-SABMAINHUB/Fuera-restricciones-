import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import jwt_decode from "jwt-decode";

/**
 * ALEX HUB ULTRA V13 - SUPREME EDITION
 * DOMAIN: Alexhub.vercel.app
 * AUTH: Google Official OAuth + Firebase Realtime Admin Control
 */

// --- CONFIGURACIÓN FIREBASE (Mantengo tu DB original) ---
const firebaseConfig = {
  apiKey: "AIzaSyD1zUmhiUVDv-ZYyJF7vTwGaS1AO9t9jiE",
  authDomain: "alexhub-eefdf.firebaseapp.com",
  databaseURL: "https://alexhub-eefdf-default-rtdb.firebaseio.com",
  projectId: "alexhub-eefdf",
  storageBucket: "alexhub-eefdf.firebasestorage.app",
  messagingSenderId: "463204402982",
  appId: "1:463204402982:web:fe740a662fbfd50452a3e7",
  measurementId: "G-M8KSWX9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// CONFIGURACIÓN MAESTRA
const GOOGLE_CLIENT_ID = "62163541365-qkfhuda81uev9b2poehqd7hic08oism6.apps.googleusercontent.com";
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const ADMIN_PASS = "Alex2706";
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltraV13() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [user, setUser] = useState(null); // Datos de Google
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  
  // --- ESTADOS DE ADMIN (EL FRAME GIGANTE) ---
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [userToManage, setUserToManage] = useState(''); // Email para ban/unban

  // --- LISTAS DE CONTROL (Desde Firebase) ---
  const [whitelist, setWhitelist] = useState([]); // Correos permitidos
  const [blacklist, setBlacklist] = useState([]); // Correos baneados
  const [premiumUsers, setPremiumUsers] = useState([]);

  // --- UI Y NAVEGACIÓN ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // 1. CARGA DE DATOS Y SEGURIDAD
  // ==========================================
  useEffect(() => {
    // Escuchar cambios en la base de datos de control
    const whitelistRef = ref(db, 'authorized_emails');
    const blacklistRef = ref(db, 'banned_emails');
    const premiumRef = ref(db, 'premium_users');

    onValue(whitelistRef, (s) => setWhitelist(Object.values(s.val() || {})));
    onValue(blacklistRef, (s) => setBlacklist(Object.values(s.val() || {})));
    onValue(premiumRef, (s) => setPremiumUsers(Object.values(s.val() || {})));

    // Persistencia de sesión local
    const savedUser = localStorage.getItem('_alex_hub_session');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      checkUserAccess(parsedUser);
    } else {
      setAuthChecking(false);
    }
  }, []);

  const checkUserAccess = (userData) => {
    // 1. Verificar si está baneado
    if (blacklist.includes(userData.email)) {
      alert("TU CUENTA HA SIDO BANEADA PERMANENTEMENTE");
      handleLogout();
      return;
    }
    // 2. Verificar si está en la whitelist (o si tú quieres acceso libre excepto baneados)
    // Aquí implemento que solo los de la whitelist entran si así lo decides
    if (whitelist.length > 0 && !whitelist.includes(userData.email)) {
      alert("ACCESO RESTRINGIDO. CONTACTA CON ALEX.");
      handleLogout();
      return;
    }

    setUser(userData);
    setIsAuthorized(true);
    setAuthChecking(false);
    localStorage.setItem('_alex_hub_session', JSON.stringify(userData));
  };

  // ==========================================
  // 2. GOOGLE LOGIN HANDLERS
  // ==========================================
  const onGoogleSuccess = (credentialResponse) => {
    const decoded = jwt_decode(credentialResponse.credential);
    const userData = {
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture
    };
    checkUserAccess(userData);
  };

  const onGoogleError = () => {
    alert("Error conectando con Google. Revisa tu conexión o configuración de consola.");
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    setIsAuthorized(false);
    localStorage.removeItem('_alex_hub_session');
  };

  // ==========================================
  // 3. SISTEMA DE ADMINISTRACIÓN (EL NÚCLEO)
  // ==========================================
  const verifyAdmin = (e) => {
    e.preventDefault();
    if (adminPassInput === ADMIN_PASS) {
      setAdminAuthenticated(true);
      setAdminPassInput('');
    } else {
      alert("CONTRASEÑA INCORRECTA");
    }
  };

  const addToWhitelist = () => {
    if (!userToManage) return;
    const id = btoa(userToManage).replace(/=/g, '');
    set(ref(db, `authorized_emails/${id}`), userToManage);
    setUserToManage('');
  };

  const addToBlacklist = () => {
    if (!userToManage) return;
    const id = btoa(userToManage).replace(/=/g, '');
    set(ref(db, `banned_emails/${id}`), userToManage);
    // Si el usuario está online, lo echamos (opcional mediante trigger)
    setUserToManage('');
  };

  const togglePremium = (email) => {
    const id = btoa(email).replace(/=/g, '');
    if (premiumUsers.includes(email)) {
      remove(ref(db, `premium_users/${id}`));
    } else {
      set(ref(db, `premium_users/${id}`), email);
    }
  };

  const removeFromList = (listPath, email) => {
    const id = btoa(email).replace(/=/g, '');
    remove(ref(db, `${listPath}/${id}`));
  };

  // ==========================================
  // 4. LÓGICA DE CONTENIDO (YOUTUBE, ETC)
  // ==========================================
  const searchContent = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${query}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
      setSelectedVideo(null);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // ==========================================
  // 5. RENDERIZADO
  // ==========================================

  if (authChecking) return <div style={styles.loadingFull}><div className="loader"></div><h1>CARGANDO ALEX HUB...</h1></div>;

  // --- PANTALLA DE LOGIN ---
  if (!isAuthorized) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div style={styles.loginPage}>
          <div style={styles.loginCard}>
            <h1 style={styles.mainTitle}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
            <p style={styles.loginSub}>SISTEMA DE ACCESO SEGURO V13</p>
            
            <div style={styles.googleBtnWrapper}>
              <GoogleLogin 
                onSuccess={onGoogleSuccess}
                onError={onGoogleError}
                useOneTap
                theme="filled_blue"
                shape="pill"
                text="signin_with"
                width="300"
              />
            </div>

            <button onClick={() => setShowAdminLogin(true)} style={styles.adminEntryBtn}>ALEX</button>
          </div>

          {/* MODAL LOGIN ADMIN */}
          {showAdminLogin && (
            <div style={styles.modalOverlay}>
              <div style={styles.adminAuthBox}>
                <h2>ACCESO RESTRINGIDO</h2>
                <form onSubmit={verifyAdmin}>
                  <input 
                    type="password" 
                    placeholder="CONTRASEÑA MAESTRA" 
                    value={adminPassInput} 
                    onChange={e => setAdminPassInput(e.target.value)} 
                    style={styles.adminInput}
                    autoFocus
                  />
                  <div style={{display:'flex', gap:'10px'}}>
                    <button type="submit" style={styles.confirmBtn}>ENTRAR</button>
                    <button type="button" onClick={() => setShowAdminLogin(false)} style={styles.cancelBtn}>SALIR</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* FRAME GIGANTE DE ADMIN (Solo si está autenticado) */}
          {adminAuthenticated && (
            <div style={styles.giantAdminFrame}>
              <div style={styles.adminHeader}>
                <h1>ALEX HUB COMMAND CENTER</h1>
                <button onClick={() => setAdminAuthenticated(false)} style={styles.closeAdmin}>CERRAR PANEL DE CONTROL</button>
              </div>
              
              <div style={styles.adminGrid}>
                {/* COLUMNA 1: GESTIÓN */}
                <div style={styles.adminCol}>
                  <h3>AÑADIR / BANEAR USUARIO</h3>
                  <input 
                    type="email" 
                    placeholder="correo@gmail.com" 
                    value={userToManage} 
                    onChange={e => setUserToManage(e.target.value)} 
                    style={styles.inputHero}
                  />
                  <div style={styles.btnRow}>
                    <button onClick={addToWhitelist} style={styles.addBtn}>PERMITIR ACCESO</button>
                    <button onClick={addToBlacklist} style={styles.banBtn}>BANEAR CORREO</button>
                  </div>
                </div>

                {/* COLUMNA 2: LISTA BLANCA */}
                <div style={styles.adminCol}>
                  <h3>✅ PERMITIDOS ({whitelist.length})</h3>
                  <div style={styles.listContainer}>
                    {whitelist.map(email => (
                      <div key={email} style={styles.listItem}>
                        <span>{email}</span>
                        <div style={{display:'flex', gap:'5px'}}>
                           <button onClick={() => togglePremium(email)} style={premiumUsers.includes(email) ? styles.isPremium : styles.notPremium}>👑</button>
                           <button onClick={() => removeFromList('authorized_emails', email)} style={styles.deleteBtn}>X</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA 3: BANEADOS */}
                <div style={styles.adminCol}>
                  <h3>🚫 BANEADOS ({blacklist.length})</h3>
                  <div style={styles.listContainer}>
                    {blacklist.map(email => (
                      <div key={email} style={styles.listItem}>
                        <span style={{color: '#E50914'}}>{email}</span>
                        <button onClick={() => removeFromList('banned_emails', email)} style={styles.unbanBtn}>DESBANEAR</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </GoogleOAuthProvider>
    );
  }

  // --- DASHBOARD PRINCIPAL (DESPUÉS DEL LOGIN EXITOSO) ---
  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.logo}>ALEX<span>HUB</span></div>
          <div style={styles.menu}>
             {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
               <button 
                 key={m} 
                 onClick={() => setMode(m)} 
                 style={mode === m ? styles.menuActive : styles.menuBtn}
               >
                 {m.toUpperCase()}
               </button>
             ))}
          </div>
        </div>

        <form onSubmit={searchContent} style={styles.searchBar}>
          <input 
            placeholder="¿Qué quieres ver hoy?" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
          />
        </form>

        <div style={styles.navRight}>
           {premiumUsers.includes(user.email) && <span style={styles.premiumTag}>👑 PREMIUM</span>}
           <img src={user.picture} style={styles.userPic} alt="profile" />
           <button onClick={() => window.location.href = PANIC_URL} style={styles.panicBtn}>PÁNICO</button>
           <button onClick={handleLogout} style={styles.logoutBtn}>SALIR</button>
        </div>
      </nav>

      <main style={styles.main}>
        {mode === 'youtube' && (
          <div style={styles.youtubeGrid}>
            {selectedVideo ? (
              <div style={styles.playerContainer}>
                <button onClick={() => setSelectedVideo(null)} style={styles.backBtn}>← VOLVER</button>
                <iframe 
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} 
                  style={styles.fullIframe} 
                  allowFullScreen
                />
              </div>
            ) : (
              videos.map(v => (
                <div key={v.id.videoId} style={styles.videoCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                  <img src={v.snippet.thumbnails.high.url} alt="thumb" />
                  <div style={styles.videoInfo}>
                    <h4>{v.snippet.title}</h4>
                    <p>{v.snippet.channelTitle}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {mode !== 'youtube' && (
          <div style={styles.fullFrameContainer}>
            <iframe 
               src={
                 mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=alexhub.vercel.app` :
                 mode === 'movies' ? `https://vidsrc.to/embed/movie/${query || 'tt0111161'}` :
                 "https://www.xbox.com/play"
               }
               style={styles.fullIframe}
            />
          </div>
        )}
      </main>
      
      <footer style={styles.footer}>
        <span>CONECTADO COMO: {user.email}</span>
        <span>DOMAIN: Alexhub.vercel.app</span>
        <span style={{color: '#00ff41'}}>ESTADO: ONLINE</span>
      </footer>
    </div>
  );
}

// ==========================================
// ESTILOS DE ALTA FIDELIDAD
// ==========================================
const styles = {
  loadingFull: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' },
  loginPage: { height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  loginCard: { background: 'rgba(15,15,15,0.95)', padding: '60px', borderRadius: '40px', border: '1px solid #333', textAlign: 'center', boxShadow: '0 0 50px rgba(0,0,0,0.5)', zIndex: 10 },
  mainTitle: { fontSize: '48px', fontWeight: '900', letterSpacing: '5px', marginBottom: '10px' },
  loginSub: { color: '#666', letterSpacing: '2px', marginBottom: '40px' },
  googleBtnWrapper: { display: 'flex', justifyContent: 'center', marginBottom: '30px' },
  adminEntryBtn: { background: 'none', border: 'none', color: '#222', cursor: 'pointer', transition: '0.3s' },
  
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  adminAuthBox: { background: '#111', padding: '40px', borderRadius: '20px', border: '1px solid #E50914', textAlign: 'center' },
  adminInput: { background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '10px', color: '#fff', fontSize: '18px', width: '300px', marginBottom: '20px', textAlign: 'center' },
  confirmBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: '#333', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

  giantAdminFrame: { position: 'fixed', inset: '20px', background: '#080808', border: '2px solid #E50914', borderRadius: '30px', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '30px' },
  adminHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #222', paddingBottom: '20px' },
  closeAdmin: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', flex: 1, overflow: 'hidden' },
  adminCol: { background: '#0f0f0f', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', border: '1px solid #1a1a1a' },
  inputHero: { background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '10px', color: '#fff', marginBottom: '15px' },
  btnRow: { display: 'flex', gap: '10px' },
  addBtn: { flex: 1, background: '#00ff41', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold' },
  banBtn: { flex: 1, background: '#E50914', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold' },
  listContainer: { flex: 1, overflowY: 'auto', marginTop: '20px' },
  listItem: { background: '#050505', padding: '12px', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  deleteBtn: { background: '#333', color: '#fff', border: 'none', width: '30px', height: '30px', borderRadius: '5px' },
  unbanBtn: { background: '#fff', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' },
  isPremium: { background: '#FFD700', border: 'none', borderRadius: '5px', padding: '5px' },
  notPremium: { background: '#222', border: 'none', borderRadius: '5px', padding: '5px' },

  app: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff' },
  nav: { height: '70px', background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
  logo: { fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  menu: { display: 'flex', gap: '10px' },
  menuBtn: { background: 'none', border: 'none', color: '#666', fontWeight: 'bold', cursor: 'pointer' },
  menuActive: { background: '#E50914', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold' },
  searchBar: { flex: 1, maxWidth: '500px', margin: '0 40px' },
  userPic: { width: '35px', height: '35px', borderRadius: '50%', border: '2px solid #E50914' },
  premiumTag: { color: '#FFD700', fontSize: '12px', fontWeight: 'bold' },
  logoutBtn: { background: 'none', border: '1px solid #333', color: '#fff', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  panicBtn: { background: '#fff', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold' },

  main: { flex: 1, overflowY: 'auto', padding: '20px' },
  youtubeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  videoCard: { cursor: 'pointer', transition: '0.3s' },
  videoInfo: { padding: '10px 0' },
  fullFrameContainer: { height: '100%', borderRadius: '20px', overflow: 'hidden' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  playerContainer: { gridColumn: '1/-1', height: '80vh' },
  backBtn: { marginBottom: '20px', background: '#222', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px' },
  footer: { height: '30px', background: '#000', display: 'flex', justifyContent: 'space-between', padding: '0 20px', alignItems: 'center', fontSize: '10px', color: '#333' }
};

// Inyectar estilos CSS para animaciones
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .loader { border: 4px solid #111; border-top: 4px solid #E50914; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .videoCard img { width: 100%; border-radius: 12px; transition: 0.3s; }
    .videoCard:hover img { transform: scale(1.05); }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #E50914; }
  `;
  document.head.appendChild(style);
}
