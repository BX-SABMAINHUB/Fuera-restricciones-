import React, { useState, useEffect, useCallback, useRef } from 'react';
// IMPORTAMOS FIREBASE DESDE LA RED (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- TU CONFIGURACIÓN REAL DE FIREBASE ---
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

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// CONFIGURACIÓN MAESTRA
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";
const ADMIN_PASS = "Alex2706";

export default function AlexHubUltraV12() {
  // --- ESTADOS DE IDENTIDAD Y SEGURIDAD ---
  const [userId, setUserId] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteTimeRemaining, setMuteTimeRemaining] = useState('');
  
  // --- ESTADOS DE NAVEGACIÓN ---
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // --- ESTADOS DE ADMIN ---
  const [adminMode, setAdminMode] = useState('closed'); // 'closed', 'auth', 'panel'
  const [adminInput, setAdminInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({});
  const [bannedUsers, setBannedUsers] = useState({});
  const [mutedUsers, setMutedUsers] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [newPuName, setNewPuName] = useState('');
  const [viewingPuList, setViewingPuList] = useState(false);

  // ==========================================
  // 1. SISTEMA DE ID EN EL ENLACE (URL PERSISTENCE)
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    
    if (!id) {
      id = 'ALEX-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + id;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setUserId(id);

    // Registro de presencia en Firebase
    const userRef = ref(db, `online/${id}`);
    set(userRef, { id: id, lastSeen: serverTimestamp(), agent: navigator.userAgent.slice(0, 50) });
    onDisconnect(userRef).remove();

    // Listeners de Seguridad
    onValue(ref(db, `bans/${id}`), (snap) => { if (snap.exists()) setIsBanned(true); });
    
    onValue(ref(db, `mutes/${id}`), (snap) => {
      if (snap.exists()) {
        const expiry = snap.val().expiresAt;
        const interval = setInterval(() => {
          const now = Date.now();
          const diff = expiry - now;
          if (diff <= 0) {
            remove(ref(db, `mutes/${id}`));
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

    // Sincronización de Datos para Admin
    onValue(ref(db, 'online'), (s) => setOnlineUsers(s.val() || {}));
    onValue(ref(db, 'bans'), (s) => setBannedUsers(s.val() || {}));
    onValue(ref(db, 'mutes'), (s) => setMutedUsers(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));
  }, []);

  // ==========================================
  // 2. SEGURIDAD Y TOKEN
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
    if (password === generateCurrentToken() || password === ADMIN_PASS) setAuthorized(true);
    else { alert("TOKEN INVÁLIDO"); setPassword(''); }
  };

  // ==========================================
  // 3. ACCIONES DE ADMIN (REALES)
  // ==========================================
  const banUser = (id) => { if(confirm(`Banear a ${id}?`)) set(ref(db, `bans/${id}`), {ts: serverTimestamp()}); };
  const unbanUser = (id) => remove(ref(db, `bans/${id}`));
  
  const muteUser = (id) => {
    const mins = prompt("Minutos de mute:", "5");
    if (mins) set(ref(db, `mutes/${id}`), { expiresAt: Date.now() + (parseInt(mins) * 60000) });
  };
  const unmuteUser = (id) => remove(ref(db, `mutes/${id}`));

  const addPremium = (e) => {
    e.preventDefault();
    if (newPuName.trim()) {
      const updated = [...premiumUsers, newPuName];
      set(ref(db, 'premium_users'), updated);
      setNewPuName('');
    }
  };
  const removePremium = (idx) => {
    const updated = premiumUsers.filter((_, i) => i !== idx);
    set(ref(db, 'premium_users'), updated);
  };

  // ==========================================
  // 4. BÚSQUEDA Y RENDER
  // ==========================================
  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (isMuted || !query || mode !== 'youtube') return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (err) { alert("Error API"); }
    setLoading(false);
  };

  // --- RENDERS DE SEGURIDAD ---
  if (isBanned) return <div style={styles.fullscreenBlack}><h1 style={styles.errorText}>ACCESO DENEGADO (BAN)</h1><p>Tu ID {userId} está en la lista negra.</p></div>;

  if (isMuted) return (
    <div style={styles.muteOverlay}>
      <div style={styles.muteBox}>
        <h1 style={{fontSize: '60px', color: '#E50914'}}>🔇 MUTEADO</h1>
        <p style={{fontSize: '20px', letterSpacing: '3px'}}>TIEMPO RESTANTE PARA EL DESBLOQUEO:</p>
        <div style={styles.timer}>{muteTimeRemaining}</div>
      </div>
    </div>
  );

  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitchTitle}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
        <p style={{fontSize: '10px', color: '#333'}}>USUARIO_ID: {userId}</p>
        <form onSubmit={handleLogin} style={{marginTop: '20px'}}>
          <input type="text" placeholder="TOKEN" value={password} onChange={e=>setPassword(e.target.value)} style={styles.loginInput} />
          <button type="submit" style={styles.loginBtn}>CONECTAR</button>
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
              <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {premiumUsers.length > 0 && <button onClick={() => setViewingPuList(true)} style={styles.premiumBadge}>👑 Premium Users</button>}

        <form onSubmit={performSearch} style={styles.searchForm}>
          <input style={styles.searchInput} placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
        
        <div style={{display:'flex', gap: '10px'}}>
           <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
           <button onClick={() => setAdminMode('auth')} style={styles.adminButton}>ADMIN</button>
        </div>
      </nav>

      <main style={styles.contentArea}>
        {mode === 'youtube' && (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.playerWrapper}>
                <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
                <button onClick={() => setSelectedVideo(null)} style={styles.closeBtnVideo}>VOLVER</button>
              </div>
            ) : (
              videos.map((v, i) => (
                <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                  <img src={v.snippet.thumbnails.high.url} style={styles.thumbnail} />
                  <div style={styles.cardInfo}><p style={styles.videoTitle}>{v.snippet.title}</p></div>
                </div>
              ))
            )}
          </div>
        )}
        {mode !== 'youtube' && (
            <div style={styles.fullView}>
                <iframe src={mode === 'twitch' ? `https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}` : mode === 'movies' ? `https://www.google.com/search?q=${query}+watch+online+free&igu=1` : "https://www.bing.com/search?q=fortnite+xbox+cloud&igu=1"} style={styles.fullIframe} />
            </div>
        )}
      </main>

      {/* --- MODAL ADMIN PANEL --- */}
      {adminMode === 'auth' && (
        <div style={styles.modalBack} onClick={()=>setAdminMode('closed')}>
          <div style={styles.modalContentSmall} onClick={e=>e.stopPropagation()}>
            <h2 style={{color: '#E50914'}}>ADMIN ACCESS</h2>
            <form onSubmit={(e)=>{e.preventDefault(); if(adminInput===ADMIN_PASS){setAdminMode('panel');setAdminInput('')}else{alert('Mal')}}}>
              <input type="password" value={adminInput} onChange={e=>setAdminInput(e.target.value)} style={styles.loginInput} placeholder="PASSWORD" />
              <button style={styles.loginBtn}>ENTRAR</button>
            </form>
          </div>
        </div>
      )}

      {adminMode === 'panel' && (
        <div style={styles.modalBack}>
          <div style={styles.adminPanelLarge}>
            <div style={styles.adminHeader}>
              <h2 style={{margin:0}}>ALEX COMMAND CENTER</h2>
              <button onClick={()=>setAdminMode('closed')} style={styles.closeBtnSmall}>X</button>
            </div>
            <div style={styles.adminBody}>
              <div style={styles.adminCol}>
                <h3 style={{color: '#00ff41'}}>🟢 ONLINE</h3>
                <div style={styles.adminScroll}>
                  {Object.values(onlineUsers).map(u => (
                    <div key={u.id} style={styles.userItem}>
                      <span style={{color: u.id === userId ? '#E50914' : '#fff'}}>{u.id}</span>
                      <div style={{display:'flex', gap:'5px'}}>
                        <button onClick={()=>muteUser(u.id)} style={styles.btnMute}>MUTE</button>
                        <button onClick={()=>banUser(u.id)} style={styles.btnBan}>BAN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.adminCol}>
                <h3 style={{color: '#E50914'}}>🚫 CONTROL</h3>
                <div style={styles.adminScroll}>
                   <p style={{fontSize:'10px'}}>MUTES ACTIVOS:</p>
                   {Object.keys(mutedUsers).map(id => (
                     <div key={id} style={styles.userItem}><span>{id}</span><button onClick={()=>unmuteUser(id)} style={styles.btnUnban}>QUITAR MUTE</button></div>
                   ))}
                   <p style={{fontSize:'10px', marginTop:'10px'}}>BANS:</p>
                   {Object.keys(bannedUsers).map(id => (
                     <div key={id} style={styles.userItem}><span>{id}</span><button onClick={()=>unbanUser(id)} style={styles.btnUnban}>DESBAN</button></div>
                   ))}
                </div>
                <div style={{marginTop:'10px', borderTop:'1px solid #222', paddingTop:'10px'}}>
                   <h4 style={{color:'#FFD700'}}>PREMIUM MGMT</h4>
                   <form onSubmit={addPremium} style={{display:'flex', gap:'5px'}}>
                     <input value={newPuName} onChange={e=>setNewPuName(e.target.value)} placeholder="Nombre..." style={styles.adminInput} />
                     <button style={styles.addBtn}>+</button>
                   </form>
                   <div style={{maxHeight:'100px', overflowY:'auto', marginTop:'10px'}}>
                      {premiumUsers.map((p, i) => (
                        <div key={i} style={styles.userItem}><span>{p}</span><button onClick={()=>removePremium(i)} style={styles.btnBan}>X</button></div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL LISTA PREMIUM --- */}
      {viewingPuList && (
        <div style={styles.modalBack} onClick={()=>setViewingPuList(false)}>
           <div style={styles.puListCard} onClick={e=>e.stopPropagation()}>
              <h1 style={{color: '#FFD700', textAlign: 'center', letterSpacing:'5px'}}>👑 PREMIUM ELITE</h1>
              <div style={styles.puGrid}>
                 {premiumUsers.map((name, i) => <div key={i} style={styles.puNameItem}>{name}</div>)}
              </div>
              <button onClick={()=>setViewingPuList(false)} style={styles.puClose}>CERRAR</button>
           </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>STATUS: <span style={{color: '#00ff41'}}>ONLINE</span> | ID: {userId}</span>
        <span>TOKEN ACTUAL: {generateCurrentToken()}</span>
      </footer>
    </div>
  );
}

// ==========================================
// ESTILOS DE ALTA GAMA
// ==========================================
const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#080808', padding: '50px', borderRadius: '30px', border: '1px solid #E50914', textAlign: 'center' },
  glitchTitle: { color: '#fff', fontSize: '30px', letterSpacing: '10px' },
  loginInput: { background: '#000', border: '1px solid #222', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '20px', textAlign: 'center', marginBottom: '10px' },
  loginBtn: { width: '100%', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },

  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '70px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #111' },
  logoBox: { borderLeft: '3px solid #E50914', paddingLeft: '10px' },
  logoMain: { fontSize: '20px', fontWeight: 'bold' },
  logoSub: { fontSize: '9px', color: '#E50914', display: 'block' },
  tabContainer: { display: 'flex', background: '#0a0a0a', padding: '5px', borderRadius: '10px', marginLeft: '20px' },
  tab: { background: 'none', border: 'none', color: '#444', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '8px 15px', borderRadius: '8px', border: 'none' },
  searchForm: { flex: 1, maxWidth: '400px', margin: '0 20px' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '10px 20px', borderRadius: '20px', color: '#fff', outline: 'none' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  adminButton: { background: '#E50914', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', border: 'none', padding: '8px 15px', borderRadius: '20px', color: '#000', fontWeight: 'bold', cursor: 'pointer' },

  contentArea: { flex: 1, overflowY: 'auto', padding: '20px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#080808', borderRadius: '15px', overflow: 'hidden', border: '1px solid #111', cursor: 'pointer' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px' },
  videoTitle: { fontSize: '13px', fontWeight: 'bold', margin: 0 },

  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 },
  modalContentSmall: { background: '#080808', padding: '30px', borderRadius: '20px', border: '1px solid #E50914', textAlign: 'center' },
  adminPanelLarge: { background: '#050505', width: '80%', height: '80%', borderRadius: '20px', border: '2px solid #E50914', display: 'flex', flexDirection: 'column' },
  adminHeader: { background: '#111', padding: '20px', display: 'flex', justifyContent: 'space-between' },
  adminBody: { display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, padding: '20px', gap: '20px' },
  adminCol: { background: '#0a0a0a', borderRadius: '15px', padding: '15px', display: 'flex', flexDirection: 'column' },
  adminScroll: { flex: 1, overflowY: 'auto' },
  userItem: { background: '#000', padding: '10px', borderRadius: '8px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' },
  btnBan: { background: '#E50914', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
  btnMute: { background: '#FFD700', border: 'none', color: '#000', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
  btnUnban: { background: '#00ff41', border: 'none', color: '#000', padding: '4px 8px', borderRadius: '4px' },
  adminInput: { background: '#000', border: '1px solid #222', color: '#fff', padding: '8px', borderRadius: '5px', flex: 1 },
  addBtn: { background: '#FFD700', border: 'none', width: '30px', borderRadius: '5px' },
  closeBtnSmall: { background: '#E50914', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: '5px' },

  muteOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  muteBox: { textAlign: 'center', border: '4px solid #E50914', padding: '60px', borderRadius: '40px' },
  timer: { fontSize: '100px', fontWeight: 'bold', color: '#fff', textShadow: '0 0 20px #E50914' },
  
  puListCard: { background: '#000', border: '2px solid #FFD700', padding: '40px', borderRadius: '30px', width: '400px' },
  puGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '20px' },
  puNameItem: { background: '#0a0a0a', padding: '15px', borderRadius: '10px', textAlign: 'center', color: '#FFD700', border: '1px solid #222' },
  puClose: { width: '100%', marginTop: '20px', background: 'none', border: '1px solid #FFD700', color: '#FFD700', padding: '10px', borderRadius: '10px' },

  fullscreenBlack: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: '40px', color: '#E50914' },
  footer: { height: '30px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: '10px', color: '#333' },
  playerWrapper: { gridColumn: '1/-1', height: '70vh', position: 'relative' },
  fullIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '20px' },
  closeBtnVideo: { position: 'absolute', top: '-40px', right: 0, background: '#E50914', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: '5px' },
  fullView: { height: '100%', background: '#000', borderRadius: '20px', overflow: 'hidden' }
};
