import React, { useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// CONFIGURACIÓN MAESTRA (CRÍTICA)
// ==========================================
const GOOGLE_CLIENT_ID = "62163541365-qkfhuda81uev9b2poehqd7hic08oism6.apps.googleusercontent.com";
const ADMIN_PASS = "Alex2706";
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";

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

export default function AlexHubUltraV13() {
  // --- ESTADOS DE AUTH Y USUARIO ---
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE UI ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  // --- ESTADOS DE BASE DE DATOS (ADMIN) ---
  const [whiteList, setWhiteList] = useState([]); // Correos permitidos
  const [blackList, setBlackList] = useState([]); // Correos baneados
  const [premiumList, setPremiumList] = useState([]); // Usuarios VIP
  const [newEmailInput, setNewEmailInput] = useState('');

  // ==========================================
  // 1. CARGA DE DATOS Y SEGURIDAD (FIREBASE)
  // ==========================================
  useEffect(() => {
    // Escuchar Whitelist (Correos que SI pueden entrar)
    onValue(ref(db, 'whitelist'), (s) => setWhiteList(Object.values(s.val() || {})));
    // Escuchar Blacklist (Baneados)
    onValue(ref(db, 'blacklist'), (s) => setBlackList(Object.values(s.val() || {})));
    // Escuchar Premium
    onValue(ref(db, 'premium'), (s) => setPremiumList(Object.values(s.val() || {})));

    // Persistencia de sesión local
    const savedUser = localStorage.getItem('_alexhub_session');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      checkUserAccess(parsed);
    } else {
      setLoading(false);
    }
  }, []);

  const checkUserAccess = (userData) => {
    // 1. Verificar si está baneado
    onValue(ref(db, 'blacklist'), (snapshot) => {
      const bans = Object.values(snapshot.val() || {});
      if (bans.includes(userData.email)) {
        setIsBanned(true);
        setIsAuthorized(false);
      } else {
        // 2. Verificar si está en la whitelist
        onValue(ref(db, 'whitelist'), (whiteSnapshot) => {
          const allowed = Object.values(whiteSnapshot.val() || {});
          if (allowed.includes(userData.email)) {
            setUser(userData);
            setIsAuthorized(true);
            localStorage.setItem('_alexhub_session', JSON.stringify(userData));
          } else {
            alert("ACCESO DENEGADO: Tu correo no está en la lista de permitidos.");
            handleLogout();
          }
          setLoading(false);
        });
      }
    });
  };

  // ==========================================
  // 2. LÓGICA DE GOOGLE LOGIN
  // ==========================================
  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const userData = {
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
      id: decoded.sub
    };
    checkUserAccess(userData);
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    setIsAuthorized(false);
    localStorage.removeItem('_alexhub_session');
  };

  // ==========================================
  // 3. FUNCIONES DE ADMINISTRADOR (EL "FRAME")
  // ==========================================
  const openAdminWithAuth = () => {
    const pass = prompt("INTRODUCE LA CLAVE MAESTRA (ALEX):");
    if (pass === ADMIN_PASS) {
      setAdminPanelOpen(true);
    } else {
      alert("CLAVE INCORRECTA");
    }
  };

  const addToDB = (table) => {
    if (!newEmailInput.includes('@')) return alert("Email inválido");
    const newRef = ref(db, `${table}/${newEmailInput.replace(/\./g, '_')}`);
    set(newRef, newEmailInput);
    setNewEmailInput('');
  };

  const removeFromDB = (table, email) => {
    remove(ref(db, `${table}/${email.replace(/\./g, '_')}`));
  };

  // ==========================================
  // 4. BÚSQUEDA Y CONTENIDO
  // ==========================================
  const searchContent = async (e) => {
    if (e) e.preventDefault();
    if (!query || mode !== 'youtube') return;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${query}&type=video&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    setVideos(data.items || []);
  };

  // ==========================================
  // VISTAS (RENDER)
  // ==========================================

  if (isBanned) return (
    <div style={styles.errorFull}>
      <h1 style={styles.glitch}>ACCESO BLOQUEADO</h1>
      <p>Has sido baneado permanentemente de Alex Hub.</p>
    </div>
  );

  if (!isAuthorized) return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.logoText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <p style={styles.loginSub}>Inicia sesión con tu cuenta oficial para acceder</p>
          
          <div style={styles.googleBtnWrapper}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert("Error conectando con Google")}
              useOneTap
              theme="filled_blue"
              shape="pill"
              size="large"
              text="continue_with"
            />
          </div>

          <button onClick={openAdminWithAuth} style={styles.hiddenAdminBtn}>ALEX</button>
        </div>
      </div>
    </GoogleOAuthProvider>
  );

  return (
    <div style={styles.appWrapper}>
      {/* NAVBAR */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.brand}>ALEX<span>HUB</span></div>
          <div style={styles.menu}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={searchContent} style={styles.searchBar}>
          <input 
            placeholder="¿Qué quieres ver hoy?" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            style={styles.input}
          />
        </form>

        <div style={styles.navRight}>
          {premiumList.includes(user.email) && <span style={styles.premiumTag}>👑 VIP</span>}
          <img src={user.picture} style={styles.avatar} alt="profile" />
          <button onClick={handleLogout} style={styles.logoutBtn}>SALIR</button>
          <button onClick={openAdminWithAuth} style={styles.adminCircleBtn}>A</button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main style={styles.main}>
        {mode === 'youtube' ? (
          <div style={styles.videoGrid}>
            {selectedVideo ? (
              <div style={styles.player}>
                <iframe 
                  src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} 
                  style={styles.iframe} 
                  allowFullScreen 
                />
                <button onClick={() => setSelectedVideo(null)} style={styles.closeBtn}>CERRAR REPRODUCTOR</button>
              </div>
            ) : (
              videos.map(v => (
                <div key={v.id.videoId} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                  <img src={v.snippet.thumbnails.high.url} style={styles.thumb} />
                  <div style={styles.cardInfo}>{v.snippet.title}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={styles.fullFrame}>
            <iframe 
              src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=alexhub.vercel.app` :
                   mode === 'movies' ? `https://www.google.com/search?q=${query}+pelicula+completa+igu=1` :
                   "https://www.xbox.com/play"} 
              style={styles.iframe}
            />
          </div>
        )}
      </main>

      {/* --- FRAME GIGANTE DE ADMIN (EL PANEL DE ALEX) --- */}
      {adminPanelOpen && (
        <div style={styles.adminOverlay}>
          <div style={styles.adminModal}>
            <div style={styles.adminHeader}>
              <h2>CONTROL MAESTRO DE ALEX HUB</h2>
              <button onClick={() => setAdminPanelOpen(false)} style={styles.closeAdmin}>×</button>
            </div>
            
            <div style={styles.adminContent}>
              <div style={styles.adminInputs}>
                <input 
                  value={newEmailInput} 
                  onChange={(e) => setNewEmailInput(e.target.value)} 
                  placeholder="Introduce correo electrónico..." 
                  style={styles.inputAdmin}
                />
                <div style={styles.btnGroup}>
                  <button onClick={() => addToDB('whitelist')} style={styles.btnAllow}>PERMITIR ACCESO</button>
                  <button onClick={() => addToDB('blacklist')} style={styles.btnBan}>BANEAR CORREO</button>
                  <button onClick={() => addToDB('premium')} style={styles.btnVip}>HACER PREMIUM</button>
                </div>
              </div>

              <div style={styles.listsContainer}>
                {/* LISTA DE ACCESO */}
                <div style={styles.listSection}>
                  <h3>✅ PERMITIDOS (WHITELIST)</h3>
                  <div style={styles.scrollList}>
                    {whiteList.map(email => (
                      <div key={email} style={styles.listItem}>
                        {email} <button onClick={() => removeFromDB('whitelist', email)}>Quitar</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LISTA DE BAN */}
                <div style={styles.listSection}>
                  <h3>🚫 BANEADOS (BLACKLIST)</h3>
                  <div style={styles.scrollList}>
                    {blackList.map(email => (
                      <div key={email} style={styles.listItem}>
                        {email} <button onClick={() => removeFromDB('blacklist', email)}>Desbanear</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LISTA PREMIUM */}
                <div style={styles.listSection}>
                  <h3>👑 PREMIUM USERS</h3>
                  <div style={styles.scrollList}>
                    {premiumList.map(email => (
                      <div key={email} style={styles.listItem}>
                        {email} <button onClick={() => removeFromDB('premium', email)}>Quitar VIP</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ESTILOS DE ALTA CALIDAD (CSS-IN-JS)
// ==========================================
const styles = {
  loginContainer: { height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' },
  loginBox: { background: '#0f0f0f', padding: '50px', borderRadius: '30px', border: '1px solid #333', textAlign: 'center', boxShadow: '0 0 50px rgba(229,9,20,0.2)' },
  logoText: { fontSize: '40px', fontWeight: '900', color: '#fff', letterSpacing: '2px', marginBottom: '10px' },
  loginSub: { color: '#888', marginBottom: '30px' },
  googleBtnWrapper: { display: 'flex', justifyContent: 'center', marginBottom: '40px' },
  hiddenAdminBtn: { background: 'none', border: 'none', color: '#222', cursor: 'pointer', fontSize: '12px' },

  appWrapper: { height: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' },
  nav: { height: '70px', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #222' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  brand: { fontSize: '24px', fontWeight: '900', color: '#fff' },
  menu: { display: 'flex', gap: '10px' },
  tab: { background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold' },
  searchBar: { flex: 1, maxWidth: '500px', margin: '0 20px' },
  input: { width: '100%', background: '#1a1a1a', border: '1px solid #333', padding: '10px 20px', borderRadius: '20px', color: '#fff' },
  navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '35px', height: '35px', borderRadius: '50%' },
  premiumTag: { color: '#FFD700', fontWeight: 'bold', fontSize: '12px' },
  logoutBtn: { background: 'none', border: '1px solid #444', color: '#fff', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  adminCircleBtn: { width: '30px', height: '30px', borderRadius: '50%', background: '#333', border: 'none', color: '#fff', cursor: 'pointer' },

  main: { flex: 1, padding: '20px', overflowY: 'auto' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#111', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '10px', fontSize: '14px', fontWeight: 'bold', color: '#ddd' },
  
  player: { gridColumn: '1 / -1', height: '70vh' },
  fullFrame: { height: '100%', width: '100%' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  closeBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px', width: '100%', cursor: 'pointer' },

  adminOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  adminModal: { background: '#111', width: '90%', height: '90%', borderRadius: '20px', border: '2px solid #E50914', display: 'flex', flexDirection: 'column' },
  adminHeader: { padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' },
  adminContent: { padding: '30px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  adminInputs: { display: 'flex', flexDirection: 'column', gap: '10px' },
  inputAdmin: { padding: '15px', borderRadius: '10px', background: '#000', border: '1px solid #444', color: '#fff', fontSize: '18px' },
  btnGroup: { display: 'flex', gap: '10px' },
  btnAllow: { flex: 1, background: '#28c76f', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold' },
  btnBan: { flex: 1, background: '#E50914', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold' },
  btnVip: { flex: 1, background: '#FFD700', color: '#000', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold' },
  listsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', flex: 1, minHeight: 0 },
  listSection: { background: '#0a0a0a', padding: '15px', borderRadius: '10px', display: 'flex', flexDirection: 'column' },
  scrollList: { flex: 1, overflowY: 'auto', marginTop: '10px' },
  listItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222', fontSize: '12px' },
  closeAdmin: { background: 'none', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer' },

  errorFull: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  glitch: { fontSize: '50px', color: '#E50914' }
};
