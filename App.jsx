import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURACIÓN FIREBASE ---
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

// CONFIGURACIÓN MAESTRA
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";
const ADMIN_PASS = "Alex2706";

export default function AlexHubUltraV12() {
  // --- IDENTIDAD SECRETA (No visible en URL) ---
  const [myId, setMyId] = useState('');
  
  // --- SEGURIDAD ---
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteTimeRemaining, setMuteTimeRemaining] = useState('');

  // --- NAVEGACIÓN ---
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // --- SISTEMA DE ADMIN ---
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({});
  const [bannedList, setBannedList] = useState({});
  const [mutedList, setMutedList] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [newPuName, setNewPuName] = useState('');
  const [viewPuModal, setViewPuModal] = useState(false);

  // ==========================================
  // 1. SISTEMA DE IDENTIDAD PROTEGIDA
  // ==========================================
  useEffect(() => {
    // Generamos un ID persistente en el navegador que no depende de la URL
    let storedId = localStorage.getItem('_alex_hub_id');
    if (!storedId) {
      storedId = 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem('_alex_hub_id', storedId);
    }
    setMyId(storedId);

    // Registro en Firebase Online
    const myRef = ref(db, `online/${storedId}`);
    set(myRef, {
      id: storedId,
      lastSeen: serverTimestamp(),
      device: navigator.platform
    });
    onDisconnect(myRef).remove();

    // ESCUCHA DE BANEOS (Si el admin te banea, te echa al instante)
    onValue(ref(db, `bans/${storedId}`), (snapshot) => {
      if (snapshot.exists()) setIsBanned(true);
    });

    // ESCUCHA DE MUTES (Cronómetro en tiempo real)
    onValue(ref(db, `mutes/${storedId}`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const interval = setInterval(() => {
          const now = Date.now();
          const diff = data.expiresAt - now;
          if (diff <= 0) {
            remove(ref(db, `mutes/${storedId}`));
            setIsMuted(false);
            clearInterval(interval);
          } else {
            setIsMuted(true);
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setMuteTimeRemaining(`${m}m ${s}s`);
          }
        }, 1000);
        return () => clearInterval(interval);
      } else {
        setIsMuted(false);
      }
    });

    // LISTENERS PARA EL ADMIN (Carga de datos)
    onValue(ref(db, 'online'), (s) => setOnlineUsers(s.val() || {}));
    onValue(ref(db, 'bans'), (s) => setBannedList(s.val() || {}));
    onValue(ref(db, 'mutes'), (s) => setMutedList(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));
  }, []);

  // ==========================================
  // 2. SEGURIDAD DE TOKEN (ALGORITMO ORIGINAL)
  // ==========================================
  const generateCurrentToken = useCallback(() => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let result = ''; let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    for (let i = 0; i < 6; i++) {
      hash = (hash * 16807) % 2147483647;
      result += chars.charAt(Math.abs(hash) % chars.length);
    }
    return result;
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (tokenInput === generateCurrentToken() || tokenInput === ADMIN_PASS) {
      setAuthorized(true);
    } else {
      alert("TOKEN INVÁLIDO");
      setTokenInput('');
    }
  };

  // ==========================================
  // 3. ACCIONES DE ADMIN (POWERFUL)
  // ==========================================
  const verifyAdmin = (e) => {
    e.preventDefault();
    if (adminPassInput === ADMIN_PASS) {
      setAdminPanelOpen(true);
      setAdminAuthOpen(false);
      setAdminPassInput('');
    } else {
      alert("ACCESO DENEGADO");
    }
  };

  const toggleBan = (id) => {
    if (bannedList[id]) {
      remove(ref(db, `bans/${id}`));
    } else {
      if(confirm(`¿Bloquear permanentemente a ${id}?`)) {
        set(ref(db, `bans/${id}`), { bannedAt: serverTimestamp() });
      }
    }
  };

  const setMute = (id) => {
    const mins = prompt("Minutos de silencio:", "10");
    if (mins) {
      const expiresAt = Date.now() + (parseInt(mins) * 60000);
      set(ref(db, `mutes/${id}`), { expiresAt });
    }
  };

  const cancelMute = (id) => {
    remove(ref(db, `mutes/${id}`));
  };

  const addPremium = (e) => {
    e.preventDefault();
    if (newPuName.trim()) {
      const updated = [...premiumUsers, newPuName];
      set(ref(db, 'premium_users'), updated);
      setNewPuName('');
    }
  };

  const removePremium = (index) => {
    const updated = premiumUsers.filter((_, i) => i !== index);
    set(ref(db, 'premium_users'), updated);
  };

  // ==========================================
  // 4. LÓGICA DE BÚSQUEDA
  // ==========================================
  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setTransitioning(true);
    setTimeout(() => { setMode(newMode); setTransitioning(false); }, 1500);
  };

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (isMuted || !query || mode !== 'youtube') return;
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

  // --- PANTALLA DE BANEO ---
  if (isBanned) return (
    <div style={styles.errorScreen}>
      <h1 style={styles.glitchTextLarge}>SISTEMA BLOQUEADO</h1>
      <p style={{color: '#666', marginTop: '20px'}}>Tu dispositivo ha sido vetado de Alex Hub Ultra.</p>
      <p style={{fontSize: '10px', color: '#333'}}>ID_REF: {myId}</p>
    </div>
  );

  // --- PANTALLA DE MUTE ---
  if (isMuted) return (
    <div style={styles.muteOverlay}>
      <div style={styles.muteCard}>
        <h1 style={{fontSize: '60px', color: '#E50914'}}>🔇 MUTEADO</h1>
        <p style={{letterSpacing: '5px', color: '#888'}}>ESTADO DE SILENCIO ACTIVO</p>
        <div style={styles.muteTimer}>{muteTimeRemaining}</div>
        <p style={{fontSize: '12px', color: '#444', marginTop: '30px'}}>Espera a que el administrador retire la sanción.</p>
      </div>
    </div>
  );

  // --- PANTALLA DE LOGIN ---
  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="TOKEN DE ACCESO" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} style={styles.loginInput} />
          <button type="submit" style={styles.loginBtn}>CONECTAR AL SERVIDOR</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB V12</span></div>
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
          <input style={styles.searchInput} placeholder="Buscar en la red..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>

        <div style={{display: 'flex', gap: '10px'}}>
           <button onClick={() => window.location.href = PANIC_URL} style={styles.panicBtn}>PÁNICO</button>
           <button onClick={() => setAdminAuthOpen(true)} style={styles.adminEntryBtn}>ADMIN</button>
        </div>
      </nav>

      <main style={styles.contentArea}>
        {transitioning && <div style={styles.loadOverlay}><div className="spin"></div></div>}

        {mode === 'youtube' && (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.playerWrap}>
                <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.iframe} allowFullScreen />
                <button onClick={() => setSelectedVideo(null)} style={styles.closeVideoBtn}>CERRAR</button>
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

      {/* --- MODAL LOGIN ADMIN --- */}
      {adminAuthOpen && (
        <div style={styles.modalOverlay} onClick={()=>setAdminAuthOpen(false)}>
          <div style={styles.adminLoginBox} onClick={e=>e.stopPropagation()}>
             <h2 style={{color: '#E50914', marginBottom: '20px'}}>SYSTEM OVERRIDE</h2>
             <form onSubmit={verifyAdmin}>
                <input type="password" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)} style={styles.loginInput} placeholder="CLAVE MAESTRA" autoFocus />
                <button style={styles.loginBtn}>ENTRAR AL NÚCLEO</button>
             </form>
          </div>
        </div>
      )}

      {/* --- PANEL DE CONTROL REAL (FRAME ADMIN) --- */}
      {adminPanelOpen && (
        <div style={styles.adminFrame}>
          <div style={styles.adminHeader}>
            <h1 style={{fontSize: '18px'}}>ALEX HUB COMMAND CENTER V12</h1>
            <button onClick={()=>setAdminPanelOpen(false)} style={styles.closeAdmin}>CERRAR PANEL</button>
          </div>
          
          <div style={styles.adminBody}>
            {/* USUARIOS ONLINE */}
            <div style={styles.adminSection}>
               <h3 style={{color: '#00ff41'}}>🟢 USUARIOS ACTIVOS ({Object.keys(onlineUsers).length})</h3>
               <div style={styles.scrollList}>
                  {Object.values(onlineUsers).map(u => (
                    <div key={u.id} style={styles.adminUserItem}>
                       <span style={{color: u.id === myId ? '#E50914' : '#fff'}}>{u.id}</span>
                       <div style={{display: 'flex', gap: '5px'}}>
                          <button onClick={()=>setMute(u.id)} style={styles.smallMuteBtn}>MUTE</button>
                          <button onClick={()=>toggleBan(u.id)} style={styles.smallBanBtn}>BAN</button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* CONTROL DE SANCIONES */}
            <div style={styles.adminSection}>
               <h3 style={{color: '#E50914'}}>🚫 GESTIÓN DE SANCIONES</h3>
               <div style={styles.scrollList}>
                  <p style={{fontSize: '11px', color: '#555'}}>BANEADOS:</p>
                  {Object.keys(bannedList).map(id => (
                    <div key={id} style={styles.adminUserItem}>
                       <span style={{fontSize: '12px'}}>{id}</span>
                       <button onClick={()=>toggleBan(id)} style={styles.unbanBtn}>DESBANEAR</button>
                    </div>
                  ))}
                  <p style={{fontSize: '11px', color: '#555', marginTop: '10px'}}>MUTEADOS ACTUALES:</p>
                  {Object.keys(mutedList).map(id => (
                    <div key={id} style={styles.adminUserItem}>
                       <span style={{fontSize: '12px'}}>{id}</span>
                       <button onClick={()=>cancelMute(id)} style={styles.unmuteBtn}>QUITAR MUTE</button>
                    </div>
                  ))}
               </div>
            </div>

            {/* GESTIÓN PREMIUM */}
            <div style={styles.adminSection}>
               <h3 style={{color: '#FFD700'}}>👑 PREMIUM MANAGMENT</h3>
               <form onSubmit={addPremium} style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
                  <input value={newPuName} onChange={e=>setNewPuName(e.target.value)} style={styles.adminInput} placeholder="Nombre Usuario..." />
                  <button style={styles.adminAddBtn}>+</button>
               </form>
               <div style={styles.scrollList}>
                  {premiumUsers.map((name, i) => (
                    <div key={i} style={styles.adminUserItem}>
                       <span>{name}</span>
                       <button onClick={()=>removePremium(i)} style={styles.smallBanBtn}>X</button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREMIUM PÚBLICO */}
      {viewPuModal && (
        <div style={styles.modalOverlay} onClick={()=>setViewPuModal(false)}>
           <div style={styles.puCard} onClick={e=>e.stopPropagation()}>
              <h1 style={styles.puTitle}>👑 ELITE USERS</h1>
              <div style={styles.puGrid}>
                 {premiumUsers.map((name, i) => (
                   <div key={i} style={styles.puItem}>{name}</div>
                 ))}
              </div>
              <button onClick={()=>setViewPuModal(false)} style={styles.puCloseBtn}>ENTENDIDO</button>
           </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>SERVIDOR: <span style={{color: '#00ff41'}}>ESTABLE</span></span>
        <span>ID_DISPOSITIVO: {myId}</span>
        <span>TOKEN: {generateCurrentToken()}</span>
      </footer>
    </div>
  );
}

// ==========================================
// ESTILOS MASIVOS (ALTA CALIDAD)
// ==========================================
const styles = {
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #111' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '24px', fontWeight: '900', letterSpacing: '2px' },
  logoSub: { color: '#E50914', fontSize: '10px', display: 'block' },
  tabContainer: { display: 'flex', gap: '5px', background: '#0a0a0a', padding: '5px', borderRadius: '15px' },
  tab: { background: 'none', border: 'none', color: '#444', padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', borderRadius: '10px', padding: '10px 18px', border: 'none', fontWeight: 'bold' },
  searchForm: { flex: 1, maxWidth: '450px', margin: '0 30px' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '30px', padding: '12px 25px', color: '#fff', outline: 'none' },
  panicBtn: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' },
  adminEntryBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '25px', fontWeight: '900', cursor: 'pointer' },

  contentArea: { flex: 1, padding: '30px', overflowY: 'auto', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: '#080808', borderRadius: '15px', overflow: 'hidden', border: '1px solid #111', cursor: 'pointer', transition: '0.3s' },
  thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px', fontSize: '14px', fontWeight: 'bold' },

  loginPage: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginCard: { background: '#080808', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center' },
  glitchText: { fontSize: '30px', letterSpacing: '8px', marginBottom: '30px' },
  loginInput: { background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '12px', width: '280px', textAlign: 'center', color: '#fff', fontSize: '20px', marginBottom: '20px' },
  loginBtn: { width: '100%', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },

  adminFrame: { position: 'fixed', top: '5%', left: '5%', width: '90%', height: '90%', background: '#050505', border: '2px solid #E50914', zIndex: 1000, borderRadius: '30px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminHeader: { background: '#111', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' },
  adminBody: { flex: 1, padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px' },
  adminSection: { background: '#0a0a0a', borderRadius: '20px', padding: '20px', border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column' },
  scrollList: { flex: 1, overflowY: 'auto', marginTop: '15px' },
  adminUserItem: { background: '#050505', padding: '12px', borderRadius: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111' },
  smallMuteBtn: { background: '#FFD700', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' },
  smallBanBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px' },
  unbanBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' },
  unmuteBtn: { background: '#fff', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' },
  closeAdmin: { background: '#E50914', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px' },
  adminInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px', flex: 1 },
  adminAddBtn: { background: '#FFD700', border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold' },

  muteOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  muteCard: { textAlign: 'center', border: '3px solid #E50914', padding: '60px', borderRadius: '40px', background: '#080808' },
  muteTimer: { fontSize: '100px', fontWeight: '900', color: '#fff', textShadow: '0 0 30px #E50914' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  adminLoginBox: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', border: '1px solid #E50914', textAlign: 'center' },

  puCard: { background: '#000', border: '2px solid #FFD700', padding: '50px', borderRadius: '40px', width: '500px' },
  puTitle: { textAlign: 'center', color: '#FFD700', letterSpacing: '8px', marginBottom: '30px' },
  puGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  puItem: { background: '#0a0a0a', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid #222', color: '#FFD700' },
  puCloseBtn: { width: '100%', background: 'none', border: '1px solid #FFD700', color: '#FFD700', padding: '15px', borderRadius: '15px', marginTop: '30px', cursor: 'pointer' },

  errorScreen: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  glitchTextLarge: { fontSize: '50px', color: '#E50914', letterSpacing: '10px' },
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '10px', color: '#333' },
  fullFrame: { height: '100%', background: '#000', borderRadius: '20px', overflow: 'hidden' },
  iframe: { width: '100%', height: '100%', border: 'none' },
  playerWrap: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  closeVideoBtn: { position: 'absolute', top: '-50px', right: 0, background: '#E50914', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '10px' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .spin { width: 50px; height: 50px; border: 4px solid #111; border-top-color: #E50914; border-radius: 50%; animation: s 1s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
    .card:hover { transform: translateY(-10px); border-color: #E50914; box-shadow: 0 15px 30px rgba(229,9,20,0.2); }
  `;
  document.head.appendChild(style);
}
