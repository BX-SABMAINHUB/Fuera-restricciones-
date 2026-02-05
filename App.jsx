import React, { useState, useEffect } from 'react';
// IMPORTAMOS FIREBASE DESDE LA RED (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

export default function AlexHubUltra() {
  // --- ESTADOS DE SESIÓN Y SEGURIDAD ---
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  
  // --- ESTADOS DE ADMIN ---
  const [adminMode, setAdminMode] = useState('closed'); // 'closed', 'auth', 'panel'
  const [adminPass, setAdminPass] = useState('');
  const [activeUsers, setActiveUsers] = useState({});
  const [bannedList, setBannedList] = useState({});

  // --- ESTADOS DE LA APP ---
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [modal, setModal] = useState(null);
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [puListVisible, setPuListVisible] = useState(false);

  // 1. GESTIÓN DE ID ÚNICO Y URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (!id) {
      id = 'USER-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + id;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setUserId(id);
  }, []);

  // 2. SISTEMA DE RASTREO Y BANEO (REALTIME)
  useEffect(() => {
    if (!userId) return;

    // A. Comprobar si el usuario actual está baneado
    const banRef = ref(db, `bans/${userId}`);
    onValue(banRef, (snapshot) => {
      if (snapshot.exists()) setIsBanned(true);
      else setIsBanned(false);
    });

    // B. Registrarse como usuario Activo
    const presenceRef = ref(db, `online/${userId}`);
    set(presenceRef, {
      id: userId,
      lastSeen: serverTimestamp(),
      status: 'online'
    });
    onDisconnect(presenceRef).remove(); // Se borra automáticamente al cerrar la web

    // C. Escuchar datos globales (Solo si es Admin o para la lista Premium)
    onValue(ref(db, 'online'), (snap) => setActiveUsers(snap.val() || {}));
    onValue(ref(db, 'bans'), (snap) => setBannedList(snap.val() || {}));
    onValue(ref(db, 'premium_users'), (snap) => setPremiumUsers(snap.val() || []));

  }, [userId]);

  // --- LÓGICA DE LOGIN (TOKEN DINÁMICO) ---
  const generateCurrentToken = () => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    let result = '';
    for (let i = 0; i < 6; i++) {
      hash = (hash * 16807) % 2147483647;
      result += chars.charAt(Math.abs(hash) % chars.length);
    }
    return result;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === generateCurrentToken()) setAuthorized(true);
    else { alert("TOKEN INVÁLIDO"); setPassword(''); }
  };

  // --- FUNCIONES DE ADMINISTRADOR REAL ---
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPass === 'Alex2706') {
      setAdminMode('panel');
      setAdminPass('');
    } else {
      alert("ACCESO DENEGADO");
    }
  };

  const banUser = (id) => {
    if (id === userId) return alert("No puedes banearte a ti mismo");
    set(ref(db, `bans/${id}`), { bannedAt: serverTimestamp() });
  };

  const unbanUser = (id) => {
    remove(ref(db, `bans/${id}`));
  };

  const togglePremium = (name) => {
    const exists = premiumUsers.includes(name);
    let updated;
    if (exists) updated = premiumUsers.filter(n => n !== name);
    else updated = [...premiumUsers, name];
    set(ref(db, 'premium_users'), updated);
  };

  // --- RENDERIZADO ---

  // PANTALLA DE BANEO TOTAL
  if (isBanned) {
    return (
      <div style={styles.bannedOverlay}>
        <h1 style={{fontSize: '50px', color: '#ff0000'}}>SISTEMA BLOQUEADO</h1>
        <p>Tu ID ({userId}) ha sido expulsado permanentemente de la red Alex Hub.</p>
        <div style={{marginTop: '20px', padding: '10px', border: '1px solid red'}}>ERROR_CODE: BANNED_BY_ADMIN</div>
      </div>
    );
  }

  // PANTALLA DE LOGIN
  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <p style={{color: '#444', marginBottom: '15px'}}>LOCAL_ID: {userId}</p>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN DE ACCESO" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>CONECTAR</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* BARRA SUPERIOR NAV */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB V7</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {premiumUsers.length > 0 && (
          <button onClick={() => setPuListVisible(true)} style={styles.premiumBadge}>👑 Premium Users</button>
        )}

        <button onClick={() => setAdminMode('auth')} style={styles.adminTrigger}>ADMIN</button>
        <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
      </nav>

      {/* CONTENIDO PRINCIPAL (SIMPLIFICADO PARA ESTA V7) */}
      <main style={styles.contentArea}>
        <h3 style={{color: '#333'}}>Bienvenido, {userId} | Sesión Segura Active ✅</h3>
        <div style={{marginTop: '20px', border: '1px solid #111', padding: '40px', borderRadius: '20px', textAlign: 'center'}}>
            <h2 style={{color: '#E50914'}}>ESTÁS DENTRO DE LA RED ULTRA</h2>
            <p style={{color: '#666'}}>Modo actual: {mode.toUpperCase()}</p>
        </div>
      </main>

      {/* MODAL DE AUTENTICACIÓN ADMIN */}
      {adminMode === 'auth' && (
        <div style={styles.modalBack} onClick={() => setAdminMode('closed')}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#FFD700', marginBottom: '20px'}}>SISTEMA DE CONTROL</h2>
            <form onSubmit={handleAdminAuth}>
              <input type="password" placeholder="CLAVE MAESTRA" autoFocus value={adminPass} onChange={e => setAdminPass(e.target.value)} style={styles.loginInput} />
              <button type="submit" style={styles.loginButton}>DESBLOQUEAR PANEL</button>
            </form>
          </div>
        </div>
      )}

      {/* PANEL DE ADMINISTRACIÓN REAL (EL FRAME CURRADO) */}
      {adminMode === 'panel' && (
        <div style={styles.modalBack}>
          <div style={styles.adminFrame} onClick={e => e.stopPropagation()}>
            <div style={styles.adminHeader}>
              <h2 style={{margin: 0}}>COMMAND CENTER V7 - BY ALEX</h2>
              <button onClick={() => setAdminMode('closed')} style={styles.closeBtn}>CERRAR</button>
            </div>
            
            <div style={styles.adminBody}>
              {/* SECCIÓN 1: USUARIOS ONLINE */}
              <div style={styles.adminSection}>
                <h3>🌐 USUARIOS ACTIVOS ({Object.keys(activeUsers).length})</h3>
                <div style={styles.scrollArea}>
                  {Object.values(activeUsers).map(u => (
                    <div key={u.id} style={styles.adminRow}>
                      <span style={{color: u.id === userId ? '#00FF41' : '#fff'}}>{u.id} {u.id === userId && "(TÚ)"}</span>
                      <div style={{display: 'flex', gap: '5px'}}>
                        <button onClick={() => togglePremium(u.id)} style={styles.miniPuBtn}>PREMIUM</button>
                        <button onClick={() => banUser(u.id)} style={styles.banBtn}>BANEAR</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 2: LISTA DE BANEOS */}
              <div style={styles.adminSection}>
                <h3>🚫 LISTA NEGRA (BANS)</h3>
                <div style={styles.scrollArea}>
                  {Object.keys(bannedList).length === 0 ? <p style={{color: '#444'}}>No hay baneados.</p> : 
                    Object.keys(bannedList).map(id => (
                      <div key={id} style={styles.adminRow}>
                        <span style={{color: 'red'}}>{id}</span>
                        <button onClick={() => unbanUser(id)} style={styles.unbanBtn}>DESBANEAR</button>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* SECCIÓN 3: ESTADÍSTICAS Y SISTEMA */}
              <div style={styles.adminSection}>
                <h3>⚙️ SISTEMA GLOBAL</h3>
                <div style={styles.statBox}>
                  <p>Database: <span style={{color: '#00FF41'}}>CONNECTED</span></p>
                  <p>Server Time: {new Date().toLocaleTimeString()}</p>
                  <p>Token Actual: <span style={{color: '#FFD700'}}>{generateCurrentToken()}</span></p>
                  <hr style={{borderColor: '#222'}} />
                  <button onClick={() => alert("Comando de autodestrucción no disponible todavía")} style={styles.loginButton}>REINICIAR RED</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DORADO DE PREMIUM USERS */}
      {puListVisible && (
        <div style={styles.modalBack} onClick={() => setPuListVisible(false)}>
          <div style={styles.puModal} onClick={e => e.stopPropagation()}>
            <h1 style={{color: '#FFD700', textAlign: 'center', textShadow: '0 0 10px rgba(255,215,0,0.5)'}}>⚜️ ELITE USERS ⚜️</h1>
            <div style={{marginTop: '20px', borderTop: '1px solid #222'}}>
              {premiumUsers.map((u, i) => (
                <div key={i} style={styles.puName}>{u}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>V7.0 ULTRA ENGINE</span>
        <span>ID_SESSION: {userId}</span>
        <span>SECURITY: AES-256 (FIREBASE)</span>
      </footer>
    </div>
  );
}

const styles = {
  // PANTALLAS BASE
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '50px', borderRadius: '30px', border: '1px solid #E50914', textAlign: 'center' },
  glitchText: { color: '#fff', fontSize: '28px', letterSpacing: '8px', marginBottom: '20px' },
  loginInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '18px', textAlign: 'center', outline: 'none' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  
  bannedOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999, fontFamily: 'monospace' },

  appContainer: { background: '#050505', height: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #111' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  logoBox: { display: 'flex', flexDirection: 'column', borderLeft: '4px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '20px', fontWeight: 'bold' },
  logoSub: { fontSize: '10px', color: '#E50914' },
  tabContainer: { display: 'flex', background: '#111', borderRadius: '15px', padding: '5px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '12px' },
  
  adminTrigger: { background: '#111', color: '#333', border: '1px solid #222', borderRadius: '10px', padding: '5px 15px', cursor: 'pointer', fontSize: '10px' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 25px', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },

  contentArea: { flex: 1, padding: '40px' },

  // MODALES
  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 },
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', border: '1px solid #333', textAlign: 'center' },
  
  // FRAME DE ADMIN (LA PARTE "CURRADA")
  adminFrame: { background: '#080808', width: '90%', height: '85%', borderRadius: '20px', border: '1px solid #FFD700', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 0 50px rgba(255,215,0,0.1)' },
  adminHeader: { padding: '20px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' },
  adminBody: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', background: '#222' },
  adminSection: { background: '#080808', padding: '20px', display: 'flex', flexDirection: 'column' },
  scrollArea: { flex: 1, overflowY: 'auto', marginTop: '10px' },
  adminRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#0c0c0c', marginBottom: '5px', borderRadius: '5px' },
  banBtn: { background: '#ff0000', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
  unbanBtn: { background: '#00FF41', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' },
  miniPuBtn: { background: '#FFD700', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '10px' },
  closeBtn: { background: '#333', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px' },
  statBox: { padding: '20px', background: '#111', borderRadius: '10px', fontSize: '14px' },

  // PU MODAL
  puModal: { background: '#000', border: '2px solid #FFD700', padding: '50px', borderRadius: '40px', minWidth: '350px' },
  puName: { padding: '15px', textAlign: 'center', fontSize: '22px', borderBottom: '1px solid #111', letterSpacing: '2px' },

  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '10px', color: '#333' }
};
