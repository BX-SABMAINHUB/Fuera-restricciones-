import React, { useState, useEffect, useRef } from 'react';
// IMPORTAMOS FIREBASE AUTH Y DATABASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// INICIALIZAMOS TODO
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// CLAVES MAESTRAS
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";
const ADMIN_PASS = "Alex2706";

export default function AlexHubFinalV13() {
  // --- ESTADOS DE USUARIO ---
  const [user, setUser] = useState(null); // Objeto usuario de Google
  const [authorized, setAuthorized] = useState(false);
  const [statusMsg, setStatusMsg] = useState(''); // Mensajes de error/exito

  // --- DATOS DE LA BASE DE DATOS (ADMIN CONTROLS) ---
  const [allowedEmails, setAllowedEmails] = useState({}); // Whitelist
  const [bannedEmails, setBannedEmails] = useState({}); // Blacklist
  const [premiumUsers, setPremiumUsers] = useState([]); // Premium list
  const [onlineUsers, setOnlineUsers] = useState({});

  // --- NAVEGACIÓN Y APPS ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // --- ADMIN PANEL STATES ---
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  
  // Inputs del Admin Panel
  const [inputWhitelist, setInputWhitelist] = useState('');
  const [inputBanlist, setInputBanlist] = useState('');
  const [inputPremium, setInputPremium] = useState('');
  const [adminTab, setAdminTab] = useState('whitelist'); // whitelist | bans | premium

  // ==========================================
  // 1. SINCRONIZACIÓN EN TIEMPO REAL
  // ==========================================
  useEffect(() => {
    // Escuchar configuración de seguridad
    onValue(ref(db, 'config/allowed_emails'), (s) => setAllowedEmails(s.val() || {}));
    onValue(ref(db, 'config/banned_emails'), (s) => setBannedEmails(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));
    onValue(ref(db, 'online'), (s) => setOnlineUsers(s.val() || {}));
  }, []);

  // ==========================================
  // 2. SISTEMA DE LOGIN GOOGLE (OFICIAL)
  // ==========================================
  const handleGoogleLogin = async () => {
    setStatusMsg("Conectando con Google...");
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email; // El correo real de Google
      
      checkAccess(result.user);
    } catch (error) {
      console.error(error);
      setStatusMsg("Error: Cancelado por el usuario.");
    }
  };

  const checkAccess = (googleUser) => {
    const emailKey = googleUser.email.replace(/\./g, ','); // Firebase no acepta puntos en claves

    // 1. REVISAR SI ESTÁ BANEADO
    let isBanned = false;
    if (bannedEmails) {
      Object.values(bannedEmails).forEach(bannedEmail => {
        if (bannedEmail === googleUser.email) isBanned = true;
      });
    }

    if (isBanned) {
      setStatusMsg("⛔ TU CUENTA HA SIDO BANEADA PERMANENTEMENTE.");
      signOut(auth);
      return;
    }

    // 2. REVISAR SI ESTÁ EN LA LISTA PERMITIDA (WHITELIST)
    let isAllowed = false;
    if (allowedEmails) {
      Object.values(allowedEmails).forEach(allowed => {
        if (allowed === googleUser.email) isAllowed = true;
      });
    }

    if (isAllowed) {
      // ÉXITO TOTAL
      setUser(googleUser);
      setAuthorized(true);
      setStatusMsg("");
      
      // Registrar online
      const userRef = ref(db, `online/${googleUser.uid}`);
      set(userRef, {
        name: googleUser.displayName,
        email: googleUser.email,
        photo: googleUser.photoURL,
        lastSeen: serverTimestamp()
      });
      onDisconnect(userRef).remove();

    } else {
      // NO ESTÁ EN LA LISTA
      setStatusMsg("🔒 ACCESO DENEGADO. TU CORREO NO ESTÁ EN LA LISTA DE INVITADOS.");
      signOut(auth);
    }
  };

  const handleLogout = () => {
    if (user) remove(ref(db, `online/${user.uid}`));
    signOut(auth);
    setAuthorized(false);
    setUser(null);
    setMode('youtube');
  };

  // ==========================================
  // 3. LOGICA DEL ADMIN PANEL (GIGANTE)
  // ==========================================
  const tryAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassInput === ADMIN_PASS) {
      setAdminPanelOpen(true);
      setShowAdminLogin(false);
      setAdminPassInput('');
    } else {
      alert("CONTRASEÑA INCORRECTA");
    }
  };

  // --- FUNCIONES DE BASE DE DATOS ADMIN ---
  
  // A. GESTIÓN DE ACCESO (WHITELIST)
  const addToWhitelist = () => {
    if (!inputWhitelist.includes('@')) return alert("Introduce un correo válido");
    const newRef = ref(db, `config/allowed_emails/${Date.now()}`);
    set(newRef, inputWhitelist);
    setInputWhitelist('');
  };
  const removeFromWhitelist = (key) => {
    remove(ref(db, `config/allowed_emails/${key}`));
  };

  // B. GESTIÓN DE BANS
  const addToBanlist = () => {
    if (!inputBanlist.includes('@')) return alert("Introduce un correo válido");
    const newRef = ref(db, `config/banned_emails/${Date.now()}`);
    set(newRef, inputBanlist);
    setInputBanlist('');
  };
  const removeFromBanlist = (key) => {
    remove(ref(db, `config/banned_emails/${key}`));
  };

  // C. GESTIÓN PREMIUM
  const addToPremium = () => {
    if (!inputPremium) return;
    const updated = [...premiumUsers, inputPremium];
    set(ref(db, 'premium_users'), updated);
    setInputPremium('');
  };
  const removeFromPremium = (idx) => {
    const updated = premiumUsers.filter((_, i) => i !== idx);
    set(ref(db, 'premium_users'), updated);
  };

  // ==========================================
  // 4. LÓGICA DE APPS (YouTube, etc)
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
  // 5. RENDERIZADO
  // ==========================================

  // --- PANTALLA DE LOGIN ---
  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <div style={styles.logoContainer}>
            <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>V13</span></h1>
            <p style={{color: '#666', letterSpacing: '2px', marginBottom: '30px'}}>SECURE GOOGLE GATEWAY</p>
          </div>

          {statusMsg && <div style={styles.alertBox}>{statusMsg}</div>}

          {/* BOTÓN OFICIAL DE GOOGLE */}
          <button onClick={handleGoogleLogin} style={styles.googleBtn}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{width: '24px', marginRight: '15px'}}/>
            Log in with Google
          </button>

          {/* BOTÓN SECRETO "ALEX" */}
          <div style={{marginTop: '40px', display: 'flex', justifyContent: 'center'}}>
            <button onClick={() => setShowAdminLogin(true)} style={styles.secretAlexBtn}>ALEX</button>
          </div>
        </div>

        {/* MODAL PASSWORD ADMIN */}
        {showAdminLogin && (
          <div style={styles.modalOverlay} onClick={() => setShowAdminLogin(false)}>
            <div style={styles.passModal} onClick={e => e.stopPropagation()}>
              <h2 style={{color: '#E50914', marginBottom: '15px'}}>IDENTIFICACIÓN ADMIN</h2>
              <form onSubmit={tryAdminLogin}>
                <input 
                  type="password" 
                  autoFocus
                  placeholder="CONTRASEÑA MAESTRA" 
                  value={adminPassInput} 
                  onChange={e => setAdminPassInput(e.target.value)} 
                  style={styles.passInput}
                />
                <button type="submit" style={styles.passBtn}>ACCEDER AL NÚCLEO</button>
              </form>
            </div>
          </div>
        )}

        {/* --- MEGA ADMIN FRAME (GIGANTE) --- */}
        {adminPanelOpen && (
          <div style={styles.megaAdminFrame}>
            <div style={styles.megaHeader}>
              <h1 style={{fontSize: '24px', letterSpacing: '4px'}}>🛠️ ALEX HUB ADMIN CONTROL</h1>
              <button onClick={() => setAdminPanelOpen(false)} style={styles.closeMegaBtn}>CERRAR SISTEMA</button>
            </div>
            
            <div style={styles.megaBody}>
              {/* MENU LATERAL */}
              <div style={styles.megaSidebar}>
                <button onClick={() => setAdminTab('whitelist')} style={adminTab === 'whitelist' ? styles.megaTabActive : styles.megaTab}>✅ ACCESO PERMITIDO</button>
                <button onClick={() => setAdminTab('bans')} style={adminTab === 'bans' ? styles.megaTabActive : styles.megaTab}>🚫 BANEOS (BAN HAMMER)</button>
                <button onClick={() => setAdminTab('premium')} style={adminTab === 'premium' ? styles.megaTabActive : styles.megaTab}>👑 PREMIUM USERS</button>
                <div style={{marginTop: 'auto', padding: '20px', color: '#555', fontSize: '12px'}}>
                  Users Online: {Object.keys(onlineUsers).length}
                </div>
              </div>

              {/* CONTENIDO PRINCIPAL */}
              <div style={styles.megaContent}>
                {adminTab === 'whitelist' && (
                  <div>
                    <h2 style={{color: '#00ff41', borderBottom: '1px solid #333', paddingBottom: '10px'}}>LISTA BLANCA (ACCESO PERMITIDO)</h2>
                    <p style={{color: '#888', fontSize: '14px', marginBottom: '20px'}}>Solo los correos en esta lista pueden hacer Login con Google.</p>
                    <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                      <input placeholder="ejemplo@gmail.com" value={inputWhitelist} onChange={e=>setInputWhitelist(e.target.value)} style={styles.megaInput} />
                      <button onClick={addToWhitelist} style={styles.megaAddBtn}>AUTORIZAR</button>
                    </div>
                    <div style={styles.megaList}>
                      {Object.entries(allowedEmails).map(([key, email]) => (
                        <div key={key} style={styles.megaListItem}>
                          <span style={{color: '#fff'}}>{email}</span>
                          <button onClick={() => removeFromWhitelist(key)} style={styles.megaDeleteBtn}>REVOCAR</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'bans' && (
                  <div>
                    <h2 style={{color: '#E50914', borderBottom: '1px solid #333', paddingBottom: '10px'}}>LISTA NEGRA (BANEADOS)</h2>
                    <p style={{color: '#888', fontSize: '14px', marginBottom: '20px'}}>Estos correos recibirán un error crítico al intentar entrar.</p>
                    <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                      <input placeholder="banned@gmail.com" value={inputBanlist} onChange={e=>setInputBanlist(e.target.value)} style={styles.megaInput} />
                      <button onClick={addToBanlist} style={{...styles.megaAddBtn, background: '#E50914', color: 'white'}}>BANEAR</button>
                    </div>
                    <div style={styles.megaList}>
                      {Object.entries(bannedEmails).map(([key, email]) => (
                        <div key={key} style={styles.megaListItem}>
                          <span style={{color: '#E50914', fontWeight: 'bold'}}>{email}</span>
                          <button onClick={() => removeFromBanlist(key)} style={styles.megaDeleteBtn}>DESBANEAR</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'premium' && (
                  <div>
                    <h2 style={{color: '#FFD700', borderBottom: '1px solid #333', paddingBottom: '10px'}}>USUARIOS PREMIUM</h2>
                    <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                      <input placeholder="Nombre del usuario..." value={inputPremium} onChange={e=>setInputPremium(e.target.value)} style={styles.megaInput} />
                      <button onClick={addToPremium} style={{...styles.megaAddBtn, background: '#FFD700', color: 'black'}}>AÑADIR</button>
                    </div>
                    <div style={styles.megaList}>
                      {premiumUsers.map((name, idx) => (
                        <div key={idx} style={styles.megaListItem}>
                          <span style={{color: '#FFD700'}}>{name}</span>
                          <button onClick={() => removeFromPremium(idx)} style={styles.megaDeleteBtn}>ELIMINAR</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- APP PRINCIPAL (SOLO SI ESTÁ AUTORIZADO) ---
  return (
    <div style={styles.appContainer}>
      {transitioning && <div style={styles.loadOverlay}><div className="spin"></div></div>}

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB V13</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => handleModeChange(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          {premiumUsers.length > 0 && <span style={styles.premiumBadge}>👑</span>}
          <div style={styles.userInfo}>
            <img src={user.photoURL} style={styles.userAvatar} alt="user" />
            <div style={{fontSize: '12px', textAlign: 'right'}}>
              <div style={{fontWeight: 'bold'}}>{user.displayName}</div>
              <div style={{color: '#666', fontSize: '10px'}}>ONLINE</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>SALIR</button>
        </div>
      </nav>

      {/* BARRA DE BÚSQUEDA FLOTANTE */}
      <div style={styles.searchBarContainer}>
        <form onSubmit={performSearch} style={{width: '100%', maxWidth: '600px', display: 'flex'}}>
          <input style={styles.searchInput} placeholder={`Buscar en ${mode.toUpperCase()}...`} value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={() => window.location.href = PANIC_URL} style={styles.panicBtn}>EXIT</button>
        </form>
      </div>

      <main style={styles.contentArea}>
        {mode === 'youtube' && (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.playerWrap}>
                <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
                <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>VOLVER A LISTA</button>
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

      <footer style={styles.footer}>
        <span>ALEX HUB V13 [SECURE CONNECTION]</span>
        <span>USER: {user.email}</span>
      </footer>
    </div>
  );
}

// ==========================================
// ESTILOS (MODERNOS Y "CURRADOS")
// ==========================================
const styles = {
  // LOGIN STYLES
  loginPage: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' },
  loginCard: { background: '#0a0a0a', padding: '60px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', boxShadow: '0 0 50px rgba(0,0,0,0.8)', width: '400px' },
  glitchText: { fontSize: '32px', color: '#fff', fontWeight: '900', margin: '0 0 10px 0' },
  googleBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '15px', background: '#fff', color: '#333', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
  secretAlexBtn: { background: 'transparent', border: '1px solid #333', color: '#333', fontSize: '10px', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', opacity: 0.5 },
  alertBox: { background: 'rgba(229, 9, 20, 0.2)', border: '1px solid #E50914', color: '#E50914', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' },
  
  // PASSWORD MODAL
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  passModal: { background: '#111', padding: '40px', borderRadius: '20px', border: '1px solid #E50914', textAlign: 'center' },
  passInput: { padding: '10px', borderRadius: '5px', border: '1px solid #333', background: '#000', color: '#fff', textAlign: 'center', fontSize: '18px', marginBottom: '15px' },
  passBtn: { padding: '10px 20px', background: '#E50914', border: 'none', borderRadius: '5px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },

  // MEGA ADMIN FRAME
  megaAdminFrame: { position: 'fixed', top: '2%', left: '2%', right: '2%', bottom: '2%', background: '#080808', zIndex: 5000, border: '2px solid #333', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 0 100px rgba(0,0,0,1)' },
  megaHeader: { height: '60px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #222', color: '#fff' },
  closeMegaBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  megaBody: { flex: 1, display: 'flex' },
  megaSidebar: { width: '250px', background: '#0e0e0e', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', padding: '20px' },
  megaContent: { flex: 1, padding: '40px', overflowY: 'auto', color: '#fff' },
  megaTab: { background: 'transparent', border: 'none', color: '#666', padding: '15px', textAlign: 'left', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #1a1a1a', transition: '0.2s' },
  megaTabActive: { background: '#1a1a1a', border: 'none', color: '#fff', padding: '15px', textAlign: 'left', cursor: 'pointer', fontSize: '14px', borderLeft: '3px solid #E50914', fontWeight: 'bold' },
  
  // ADMIN LIST STYLES
  megaInput: { flex: 1, background: '#111', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', outline: 'none' },
  megaAddBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '0 30px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  megaList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
  megaListItem: { background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  megaDeleteBtn: { background: '#333', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px' },

  // APP STYLES
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '70px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', borderBottom: '1px solid #111' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '20px', fontWeight: '900', letterSpacing: '2px' },
  logoSub: { color: '#E50914', fontSize: '10px', display: 'block' },
  tabContainer: { display: 'flex', gap: '10px', marginLeft: '30px' },
  tab: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  activeTab: { background: 'none', border: 'none', color: '#E50914', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', textDecoration: 'underline' },
  
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: { width: '35px', height: '35px', borderRadius: '50%', border: '2px solid #333' },
  logoutBtn: { background: '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '10px', cursor: 'pointer', marginLeft: '10px' },
  premiumBadge: { fontSize: '20px' },

  searchBarContainer: { padding: '20px', display: 'flex', justifyContent: 'center' },
  searchInput: { flex: 1, background: '#0a0a0a', border: '1px solid #222', borderRadius: '30px', padding: '15px 25px', color: '#fff', outline: 'none', fontSize: '16px' },
  panicBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '0 25px', borderRadius: '30px', marginLeft: '10px', fontWeight: 'bold', cursor: 'pointer' },

  contentArea: { flex: 1, padding: '0 30px 30px 30px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: '#080808', borderRadius: '15px', overflow: 'hidden', border: '1px solid #111', cursor: 'pointer', transition: '0.3s' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px', fontSize: '14px', fontWeight: 'bold', color: '#ddd' },
  fullFrame: { height: '100%', background: '#000', borderRadius: '20px', overflow: 'hidden', border: '1px solid #222' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  playerWrap: { gridColumn: '1/-1', height: '70vh', position: 'relative' },
  closeVideoBtn: { position: 'absolute', top: '-40px', right: 0, background: '#333', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' },
  
  loadOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  footer: { padding: '10px 30px', background: '#000', fontSize: '10px', color: '#333', display: 'flex', justifyContent: 'space-between' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .spin { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #E50914; border-radius: 50%; animation: s 1s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
    .card:hover { transform: translateY(-5px); border-color: #E50914; }
  `;
  document.head.appendChild(style);
}
