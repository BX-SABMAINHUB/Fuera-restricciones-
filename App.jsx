import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// CONFIG MAESTRA
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltra() {
  // Estados de Usuario e Identidad
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [muteUntil, setMuteUntil] = useState(0);
  
  // Estados de App
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [modal, setModal] = useState(null);

  // Estados Admin y Premium
  const [puMode, setPuMode] = useState('closed'); // 'closed', 'auth', 'admin', 'list'
  const [puCode, setPuCode] = useState('');
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [activeSessions, setActiveSessions] = useState({});
  const [newPuName, setNewPuName] = useState('');
  const [globalAlert, setGlobalAlert] = useState('');

  // --- 1. GESTIÓN DE IDENTIDAD (ID en URL) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let uid = params.get('uid');
    let name = params.get('user') || 'Invitado';

    if (!uid) {
      uid = 'USER-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const newUrl = `${window.location.pathname}?uid=${uid}&user=${name}`;
      window.history.replaceState({}, '', newUrl);
    }
    
    setUserId(uid);
    setUserName(name);

    // RASTREO DE ACTIVIDAD REALTIME
    const userRef = ref(db, `sessions/${uid}`);
    set(userRef, {
      name: name,
      id: uid,
      status: 'online',
      lastSeen: serverTimestamp(),
      banned: false,
      muteUntil: 0
    });

    // Si se desconecta, borrar de activos
    onDisconnect(userRef).remove();

    // ESCUCHAR MI PROPIO ESTADO (Baneo/Mute)
    return onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.banned) setIsBanned(true);
        if (data.muteUntil > Date.now()) setMuteUntil(data.muteUntil);
        else setMuteUntil(0);
      }
    });
  }, []);

  // --- 2. SINCRONIZACIÓN GLOBAL ---
  useEffect(() => {
    // Escuchar Premium Users
    onValue(ref(db, 'premium_users'), (snap) => setPremiumUsers(snap.val() || []));
    
    // Escuchar todas las sesiones activas (Para el Admin)
    onValue(ref(db, 'sessions'), (snap) => setActiveSessions(snap.val() || {}));

    // Escuchar Alerta Global
    onValue(ref(db, 'global_alert'), (snap) => {
      if (snap.val()) {
        setGlobalAlert(snap.val());
        setTimeout(() => setGlobalAlert(''), 10000);
      }
    });
  }, []);

  // --- 3. LÓGICA DE SEGURIDAD ---
  const generateCurrentToken = () => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let result = ''; let hash = 0;
    for (let i = 0; i < seed.length; i++) { hash = ((hash << 5) - hash) + seed.charCodeAt(i); hash |= 0; }
    for (let i = 0; i < 6; i++) { hash = (hash * 16807) % 2147483647; result += chars.charAt(Math.abs(hash) % chars.length); }
    return result;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === generateCurrentToken()) setAuthorized(true);
    else { alert("TOKEN INVÁLIDO"); setPassword(''); }
  };

  // --- 4. FUNCIONES DE ADMIN (REALES) ---
  const handlePuAuth = (e) => {
    e.preventDefault();
    if (puCode === 'Alex2706') { setPuMode('admin'); setPuCode(''); }
    else { alert("ACCESO DENEGADO"); }
  };

  const banUser = (targetUid) => {
    update(ref(db, `sessions/${targetUid}`), { banned: true });
  };

  const unbanUser = (targetUid) => {
    update(ref(db, `sessions/${targetUid}`), { banned: false });
  };

  const muteUser = (targetUid, minutes) => {
    const until = Date.now() + (minutes * 60000);
    update(ref(db, `sessions/${targetUid}`), { muteUntil: until });
  };

  const sendGlobalAlert = () => {
    const msg = prompt("Mensaje para todos los usuarios:");
    if (msg) set(ref(db, 'global_alert'), `⚠️ AVISO DE ALEX: ${msg}`);
  };

  const forceRefreshAll = () => {
    if(confirm("¿Forzar reinicio a todos?")) {
        set(ref(db, 'global_alert'), "RELOAD_SYSTEM");
    }
  };

  // Bloqueo por Baneo
  if (isBanned) {
    return (
      <div style={styles.bannedOverlay}>
        <h1 style={{fontSize: '50px'}}>🚫 ACCESO BLOQUEADO</h1>
        <p>Tu ID ({userId}) ha sido baneado permanentemente por Alex.</p>
        <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>SALIR</button>
      </div>
    );
  }

  // Renderizado del Sistema Admin
  const renderPuSystem = () => {
    if (puMode === 'closed') return null;
    
    if (puMode === 'auth') {
      return (
        <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#FFD700'}}>CONTROL MAESTRO</h2>
            <form onSubmit={handlePuAuth}>
              <input type="password" value={puCode} onChange={e => setPuCode(e.target.value)} style={styles.loginInput} placeholder="CLAVE ADMIN" />
              <button type="submit" style={styles.loginButton}>ACCEDER</button>
            </form>
          </div>
        </div>
      );
    }

    if (puMode === 'admin') {
      return (
        <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
          <div style={{...styles.modalContent, maxWidth: '800px', width: '95%', height: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h2 style={{color: '#FFD700', margin: 0}}>SISTEMA CENTRAL ALEXHUB</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                    <button onClick={sendGlobalAlert} style={styles.adminActionBtn}>📢 ALERTA</button>
                    <button onClick={forceRefreshAll} style={{...styles.adminActionBtn, background: '#E50914'}}>🔄 REBOOT</button>
                </div>
            </div>

            <div style={styles.adminGrid}>
                {/* Columna Usuarios Activos */}
                <div style={styles.adminCol}>
                    <h3 style={styles.colTitle}>PERSONAS ACTIVAS ({Object.keys(activeSessions).length})</h3>
                    <div style={styles.scrollArea}>
                        {Object.values(activeSessions).map(user => (
                            <div key={user.id} style={styles.userRow}>
                                <div>
                                    <div style={{fontSize: '14px', fontWeight: 'bold'}}>{user.name} {user.id === userId && "(Tú)"}</div>
                                    <div style={{fontSize: '10px', color: '#666'}}>{user.id}</div>
                                    {user.banned && <span style={{color: '#E50914', fontSize: '10px'}}> [BANEADO]</span>}
                                    {user.muteUntil > Date.now() && <span style={{color: '#FFD700', fontSize: '10px'}}> [MUTED]</span>}
                                </div>
                                <div style={{display: 'flex', gap: '5px'}}>
                                    <button onClick={() => muteUser(user.id, 10)} style={styles.miniAdminBtn}>MUTE</button>
                                    {user.banned ? 
                                        <button onClick={() => unbanUser(user.id)} style={{...styles.miniAdminBtn, background: 'green'}}>UNBAN</button> :
                                        <button onClick={() => banUser(user.id)} style={{...styles.miniAdminBtn, background: '#E50914'}}>BAN</button>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Columna Premium */}
                <div style={styles.adminCol}>
                    <h3 style={styles.colTitle}>PREMIUM USERS</h3>
                    <div style={styles.scrollArea}>
                        {premiumUsers.map((u, i) => (
                            <div key={i} style={styles.userRow}>
                                <span>{u}</span>
                                <button onClick={() => {
                                    const nl = premiumUsers.filter((_, idx) => idx !== i);
                                    set(ref(db, 'premium_users'), nl);
                                }} style={styles.miniAdminBtn}>BORRAR</button>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if(newPuName) {
                            set(ref(db, 'premium_users'), [...premiumUsers, newPuName]);
                            setNewPuName('');
                        }
                    }} style={{display: 'flex', marginTop: '10px'}}>
                        <input value={newPuName} onChange={e => setNewPuName(e.target.value)} placeholder="Nuevo Premium..." style={styles.adminInput} />
                        <button type="submit" style={styles.addBtn}>+</button>
                    </form>
                </div>
            </div>
            
            <button onClick={() => setPuMode('closed')} style={{...styles.loginButton, marginTop: '20px'}}>SALIR DEL SISTEMA</button>
          </div>
        </div>
      );
    }
  };

  // Pantalla de Login
  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <p style={{color: '#444', marginBottom: '20px', fontSize: '12px'}}>SESSION ID: {userId}</p>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ENTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {globalAlert && (
        <div style={styles.globalAlertBar}>
            {globalAlert === "RELOAD_SYSTEM" ? (window.location.reload()) : globalAlert}
        </div>
      )}
      
      {transitioning && <div style={styles.loaderWrap}><div style={styles.spinner}></div></div>}

      {/* BOTONES SECRETOS */}
      <div style={{position: 'absolute', bottom: 20, left: 20, display: 'flex', gap: '10px', zIndex: 100}}>
          <button onClick={() => setPuMode('auth')} style={styles.adminTrigger}>ADMIN</button>
          <button onClick={() => setModal('bx')} style={styles.miniBtn}>ABOUT</button>
      </div>

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>V7.0 ULTRA</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {premiumUsers.length > 0 && (
          <button onClick={() => setPuMode('list')} style={styles.premiumBadge}>👑 Premium Users</button>
        )}

        <form onSubmit={(e) => {
            e.preventDefault();
            if(muteUntil > Date.now()) { alert("ESTÁS MUTED. Espera a que termine tu sanción."); return; }
            performSearch();
        }} style={styles.searchForm}>
          <input style={styles.searchInput} placeholder={muteUntil > Date.now() ? "ESTÁS MUTEADO" : "Buscar..."} value={query} onChange={(e) => setQuery(e.target.value)} disabled={muteUntil > Date.now()} />
        </form>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span style={{fontSize: '10px', color: '#555'}}>{userName}</span>
            <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
        </div>
      </nav>

      <main style={styles.contentArea}>
          {/* LÓGICA DE CONTENIDO IGUAL AL ANTERIOR */}
          {mode === 'youtube' && (
             <div style={styles.grid}>
             {selectedVideo ? (
               <div style={styles.playerWrapper}>
                 <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
                 <button onClick={() => setSelectedVideo(null)} style={styles.closeButton}>CERRAR</button>
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
          {mode !== 'youtube' && <div style={styles.fullView}><iframe src={`https://www.google.com/search?q=${mode}+${query}&igu=1`} style={styles.fullIframe} /></div>}
      </main>

      {renderPuSystem()}
      
      {/* Lista Premium Pública */}
      {puMode === 'list' && (
          <div style={styles.modalBack} onClick={() => setPuMode('closed')}>
             <div style={{...styles.modalContent, border: '2px solid #FFD700', background: 'black'}} onClick={e => e.stopPropagation()}>
                <h1 style={{color: '#FFD700', textAlign: 'center'}}>⚜️ MIEMBROS ELITE ⚜️</h1>
                <div style={styles.scrollArea}>
                    {premiumUsers.map((u, i) => <div key={i} style={{padding: '10px', textAlign: 'center', borderBottom: '1px solid #222'}}>{u}</div>)}
                </div>
                <button onClick={() => setPuMode('closed')} style={styles.loginButton}>CERRAR</button>
             </div>
          </div>
      )}
    </div>
  );
}

const styles = {
  // ESTILOS NUEVOS ADMIN
  bannedOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', color: '#E50914', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999, textAlign: 'center', fontFamily: 'monospace' },
  globalAlertBar: { position: 'fixed', top: 0, left: 0, width: '100%', background: '#FFD700', color: '#000', textAlign: 'center', padding: '10px', fontWeight: 'bold', zIndex: 10000, animation: 'slideDown 0.5s' },
  adminTrigger: { background: 'transparent', border: '1px solid #222', color: '#222', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, marginTop: '20px', minHeight: 0 },
  adminCol: { background: '#111', borderRadius: '15px', padding: '15px', display: 'flex', flexDirection: 'column' },
  colTitle: { fontSize: '12px', color: '#555', marginBottom: '10px', borderBottom: '1px solid #222', paddingBottom: '5px' },
  scrollArea: { flex: 1, overflowY: 'auto' },
  userRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #222', fontSize: '13px' },
  miniAdminBtn: { padding: '4px 8px', fontSize: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: '#333', color: '#fff' },
  adminActionBtn: { padding: '8px 15px', borderRadius: '5px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', background: '#FFD700' },
  adminInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '8px', flex: 1, borderRadius: '5px 0 0 5px' },
  addBtn: { background: '#FFD700', border: 'none', padding: '0 15px', borderRadius: '0 5px 5px 0', cursor: 'pointer' },

  // ESTILOS BASE (MANTENIDOS)
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center' },
  glitchText: { color: '#fff', fontSize: '28px', letterSpacing: '8px' },
  loginInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '20px', textAlign: 'center' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #222' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '20px', fontWeight: 'bold' },
  logoSub: { fontSize: '10px', color: '#E50914' },
  tabContainer: { display: 'flex', background: '#111', borderRadius: '15px', padding: '5px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '12px' },
  searchForm: { flex: 1, maxWidth: '450px', margin: '0 30px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '12px 20px', borderRadius: '30px' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold' },
  contentArea: { flex: 1, overflowY: 'auto', padding: '25px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px' },
  videoTitle: { fontSize: '14px', fontWeight: 'bold' },
  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#0a0a0a', padding: '30px', borderRadius: '25px', border: '1px solid #333' },
  fullView: { height: '100%' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  playerWrapper: { gridColumn: '1/-1', height: '70vh', position: 'relative' },
  closeButton: { position: 'absolute', top: '-40px', right: 0, background: '#E50914', color: '#fff', border: 'none', padding: '5px 15px' }
};
