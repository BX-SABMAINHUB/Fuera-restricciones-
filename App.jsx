import React, { useState, useEffect } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

export default function AlexHubUltra() {
  // --- ESTADOS DE SEGURIDAD Y SESIÓN ---
  const [userId, setUserId] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  
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
  const [transitioning, setTransitioning] = useState(false);
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [showPuList, setShowPuList] = useState(false);
  const [modal, setModal] = useState(null);

  // 1. GESTIÓN DE IDENTIDAD (ID en URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    
    if (!id) {
      id = 'USER-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + id;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setUserId(id);
  }, []);

  // 2. RASTREO EN TIEMPO REAL Y VERIFICACIÓN DE BANEO
  useEffect(() => {
    if (!userId) return;

    // A. Verificar si estoy baneado
    const banRef = ref(db, `bans/${userId}`);
    onValue(banRef, (snapshot) => {
      if (snapshot.exists()) setIsBanned(true);
      else setIsBanned(false);
    });

    // B. Marcar presencia (Online)
    const presenceRef = ref(db, `online/${userId}`);
    set(presenceRef, {
      id: userId,
      lastSeen: serverTimestamp(),
      device: navigator.userAgent.slice(0, 20)
    });
    onDisconnect(presenceRef).remove(); // Borrar al cerrar pestaña

    // C. Escuchar lista de Premium
    onValue(ref(db, 'premium_users'), (snap) => setPremiumUsers(snap.val() || []));

    // D. Escuchar Usuarios Online (Solo para el Admin)
    onValue(ref(db, 'online'), (snap) => setActiveUsers(snap.val() || {}));
    
    // E. Escuchar Lista de Baneados
    onValue(ref(db, 'bans'), (snap) => setBannedList(snap.val() || {}));

  }, [userId]);

  // --- FUNCIONES DE ADMINISTRACIÓN REAL ---
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPass === 'Alex2706') {
      setAdminMode('panel');
      setAdminPass('');
    } else {
      alert("ACCESO DENEGADO");
    }
  };

  const banUser = (targetId) => {
    if (targetId === userId) return alert("No puedes banearte a ti mismo");
    set(ref(db, `bans/${targetId}`), {
      reason: "Baneo por Administrador",
      date: new Date().toLocaleString()
    });
  };

  const unbanUser = (targetId) => {
    remove(ref(db, `bans/${targetId}`));
  };

  const addPremium = (name) => {
    const updated = [...premiumUsers, name];
    set(ref(db, 'premium_users'), updated);
  };

  const removePremium = (index) => {
    const updated = premiumUsers.filter((_, i) => i !== index);
    set(ref(db, 'premium_users'), updated);
  };

  // --- LÓGICA DE LOGIN ESTÁNDAR ---
  const handleLogin = (e) => {
    e.preventDefault();
    const token = generateToken();
    if (password === token) setAuthorized(true);
    else alert("TOKEN INVÁLIDO");
  };

  const generateToken = () => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    return Math.abs(hash).toString(36).substr(0, 6).toUpperCase();
  };

  // --- RENDERIZADO DE INTERFAZ ---

  // PANTALLA DE BANEO
  if (isBanned) {
    return (
      <div style={styles.banScreen}>
        <h1 style={{fontSize: '50px'}}>⚠️ ACCESO RESTRINGIDO ⚠️</h1>
        <p>Tu ID ({userId}) ha sido bloqueado permanentemente de Alex Hub.</p>
        <p style={{color: '#555'}}>Contacta con el administrador si crees que es un error.</p>
      </div>
    );
  }

  // PANTALLA DE LOGIN
  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <p style={{color: '#444', marginBottom: '20px'}}>ID: {userId}</p>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN" value={password} onChange={(e)=>setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ACCEDER AL SISTEMA</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* BOTONES FLOTANTES */}
      <div style={styles.floatBar}>
        <button onClick={() => setAdminMode('auth')} style={styles.adminFloatBtn}>ADMIN</button>
        {premiumUsers.length > 0 && (
          <button onClick={() => setShowPuList(true)} style={styles.premiumBadge}>👑 Premium Users</button>
        )}
      </div>

      <nav style={styles.navbar}>
        <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB V7</span></div>
        <div style={styles.tabContainer}>
          {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
          ))}
        </div>
        <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
      </nav>

      <main style={styles.contentArea}>
        <h2 style={{textAlign: 'center', color: '#222'}}>SISTEMA ACTIVO PARA: {userId}</h2>
        {/* Contenido de YouTube/Xbox igual que el anterior... */}
        <p style={{textAlign: 'center', marginTop: '50px', color: '#555'}}>Explora el contenido con encriptación Google Firebase.</p>
      </main>

      {/* PANEL DE ADMINISTRACIÓN REAL */}
      {adminMode === 'auth' && (
        <div style={styles.modalBack} onClick={() => setAdminMode('closed')}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#FFD700'}}>CONTROL MAESTRO</h2>
            <form onSubmit={handleAdminAuth}>
              <input type="password" placeholder="PASSWORD" autoFocus onChange={(e)=>setAdminPass(e.target.value)} style={styles.loginInput}/>
              <button type="submit" style={styles.loginButton}>LOG IN</button>
            </form>
          </div>
        </div>
      )}

      {adminMode === 'panel' && (
        <div style={styles.modalBack}>
          <div style={styles.adminPanel}>
            <div style={styles.adminHeader}>
              <h2>SISTEMA DE CONTROL ULTRA V7</h2>
              <button onClick={() => setAdminMode('closed')} style={styles.closeAdmin}>X</button>
            </div>
            
            <div style={styles.adminGrid}>
              {/* Columna 1: Usuarios Online */}
              <div style={styles.adminCard}>
                <h3>🌐 USUARIOS ACTIVOS ({Object.keys(activeUsers).length})</h3>
                <div style={styles.scrollList}>
                  {Object.values(activeUsers).map(u => (
                    <div key={u.id} style={styles.adminItem}>
                      <span>{u.id} {u.id === userId && "(TÚ)"}</span>
                      <button onClick={() => banUser(u.id)} style={styles.banBtn}>BANEAR</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna 2: Lista de Bans */}
              <div style={styles.adminCard}>
                <h3>🚫 LISTA NEGRA ({Object.keys(bannedList).length})</h3>
                <div style={styles.scrollList}>
                  {Object.entries(bannedList).map(([id, data]) => (
                    <div key={id} style={styles.adminItem}>
                      <span style={{color: '#E50914'}}>{id}</span>
                      <button onClick={() => unbanUser(id)} style={styles.unbanBtn}>DESBANEAR</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna 3: Gestión Premium */}
              <div style={styles.adminCard}>
                <h3>💎 GESTIÓN PREMIUM</h3>
                <div style={styles.scrollList}>
                  {premiumUsers.map((name, i) => (
                    <div key={i} style={styles.adminItem}>
                      <span>{name}</span>
                      <button onClick={() => removePremium(i)} style={styles.banBtn}>QUITAR</button>
                    </div>
                  ))}
                </div>
                <input type="text" placeholder="Nuevo Premium..." onKeyDown={(e) => {
                  if(e.key === 'Enter') { addPremium(e.target.value); e.target.value = ''; }
                }} style={styles.adminInput} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE PREMIUM USERS (PÚBLICA) */}
      {showPuList && (
        <div style={styles.modalBack} onClick={() => setShowPuList(false)}>
           <div style={styles.puModal} onClick={e => e.stopPropagation()}>
              <h1 style={{color: '#FFD700', textAlign: 'center'}}>⚜️ PREMIUM USERS ⚜️</h1>
              <div style={styles.puScroll}>
                {premiumUsers.map((user, idx) => (
                  <div key={idx} style={styles.puRow}>{user}</div>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center', boxShadow: '0 0 30px rgba(229,9,20,0.2)' },
  glitchText: { color: '#fff', fontSize: '28px', letterSpacing: '8px', marginBottom: '10px' },
  loginInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '20px', textAlign: 'center', outline: 'none' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  appContainer: { background: '#050505', height: '100vh', color: '#fff', position: 'relative' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #222' },
  logoBox: { display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '24px', fontWeight: 'bold', color: '#fff' },
  logoSub: { fontSize: '10px', color: '#E50914' },
  tabContainer: { display: 'flex', background: '#111', borderRadius: '15px', padding: '5px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '12px' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold' },
  contentArea: { padding: '40px' },
  floatBar: { position: 'fixed', bottom: '20px', left: '20px', display: 'flex', gap: '10px', zIndex: 100 },
  adminFloatBtn: { background: '#111', color: '#444', border: '1px solid #222', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px' },
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '20px', fontWeight: 'bold' },
  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center' },
  adminPanel: { background: '#0a0a0a', width: '90%', height: '80%', borderRadius: '20px', border: '2px solid #FFD700', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminHeader: { background: '#111', padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', padding: '20px', flex: 1 },
  adminCard: { background: '#000', border: '1px solid #222', borderRadius: '10px', padding: '15px', display: 'flex', flexDirection: 'column' },
  scrollList: { flex: 1, overflowY: 'auto', margin: '10px 0' },
  adminItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#0a0a0a', marginBottom: '5px', border: '1px solid #111' },
  banBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px' },
  unbanBtn: { background: '#00FF41', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '5px' },
  adminInput: { background: '#111', border: '1px solid #333', color: '#fff', padding: '10px', width: '90%' },
  closeAdmin: { background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' },
  puModal: { background: '#000', border: '2px solid #FFD700', padding: '40px', borderRadius: '30px', minWidth: '300px' },
  puScroll: { maxHeight: '400px', overflowY: 'auto' },
  puRow: { padding: '15px', textAlign: 'center', fontSize: '20px', borderBottom: '1px solid #111' },
  banScreen: { height: '100vh', background: '#000', color: '#E50914', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'monospace' }
};
