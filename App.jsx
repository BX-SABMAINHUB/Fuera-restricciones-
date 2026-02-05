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

const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltra() {
  // --- SEGURIDAD ---
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [currentToken, setCurrentToken] = useState('');

  // --- ADMIN ---
  const [adminMode, setAdminMode] = useState('closed'); // 'closed', 'auth', 'panel'
  const [adminPass, setAdminPass] = useState('');
  const [activeUsers, setActiveUsers] = useState({});
  const [bannedList, setBannedList] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);

  // --- APP ---
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPuList, setShowPuList] = useState(false);

  // 1. GENERADOR DE TOKEN CORREGIDO (CAMBIA CADA HORA)
  useEffect(() => {
    const generateToken = () => {
      const now = new Date();
      // Semilla basada en Año + Mes + Día + Hora
      const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      const final = Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
      setCurrentToken(final);
    };
    generateToken();
    const interval = setInterval(generateToken, 60000); // Re-check cada minuto
    return () => clearInterval(interval);
  }, []);

  // 2. IDENTIDAD Y REALTIME
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (!id) {
      id = 'ALEX-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + id;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setUserId(id);

    // BAN CHECK
    onValue(ref(db, `bans/${id}`), (snap) => {
      if (snap.exists()) setIsBanned(true);
      else setIsBanned(false);
    });

    // PRESENCE
    const presenceRef = ref(db, `online/${id}`);
    set(presenceRef, { id, lastSeen: serverTimestamp() });
    onDisconnect(presenceRef).remove();

    // LISTENER GLOBAL
    onValue(ref(db, 'online'), (snap) => setActiveUsers(snap.val() || {}));
    onValue(ref(db, 'bans'), (snap) => setBannedList(snap.val() || {}));
    onValue(ref(db, 'premium_users'), (snap) => setPremiumUsers(snap.val() || []));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password.toUpperCase() === currentToken) setAuthorized(true);
    else { alert("TOKEN INCORRECTO: " + currentToken); setPassword(''); }
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPass === 'Alex2706') { setAdminMode('panel'); setAdminPass(''); }
    else alert("CLAVE INCORRECTA");
  };

  // --- ACCIONES ADMIN ---
  const actionBan = (id) => { if(id !== userId) set(ref(db, `bans/${id}`), { date: new Date().toLocaleString() }); };
  const actionUnban = (id) => remove(ref(db, `bans/${id}`));
  const actionAddPremium = (name) => set(ref(db, 'premium_users'), [...premiumUsers, name]);
  const actionRemovePremium = (idx) => set(ref(db, 'premium_users'), premiumUsers.filter((_, i) => i !== idx));

  if (isBanned) return (
    <div style={styles.banPage}>
      <h1 style={{fontSize: '60px', color: '#ff0000'}}>ACCESS DENIED</h1>
      <p>ID: {userId} ha sido bloqueado por el Administrador.</p>
    </div>
  );

  if (!authorized) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
        <p style={{color: '#333', fontSize: '12px'}}>ID: {userId}</p>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="INTRODUCE TOKEN" value={password} onChange={(e)=>setPassword(e.target.value)} style={styles.loginInput} />
          <button type="submit" style={styles.loginButton}>ACCEDER</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
           <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>ULTRA</span></div>
           <button onClick={() => setAdminMode('auth')} style={styles.adminTrigger}>ADMIN</button>
        </div>

        <div style={styles.tabContainer}>
          {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
          ))}
        </div>

        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          {premiumUsers.length > 0 && <button onClick={() => setShowPuList(true)} style={styles.premiumBadge}>👑 Premium Users</button>}
          <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
        </div>
      </nav>

      <main style={styles.contentArea}>
        <h1 style={{textAlign: 'center', color: '#111'}}>ESTÁS EN MODO {mode.toUpperCase()}</h1>
        <p style={{textAlign: 'center', color: '#444'}}>Tu ID de sesión {userId} es rastreada por Firebase.</p>
      </main>

      {/* --- FRAME DE ADMIN (CURRADO) --- */}
      {adminMode === 'auth' && (
        <div style={styles.modalBack} onClick={() => setAdminMode('closed')}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#FFD700'}}>CONTROL MAESTRO</h2>
            <form onSubmit={handleAdminAuth}>
              <input type="password" placeholder="CONTRASEÑA" autoFocus value={adminPass} onChange={e=>setAdminPass(e.target.value)} style={styles.loginInput}/>
              <button type="submit" style={styles.loginButton}>ENTRAR AL PANEL</button>
            </form>
          </div>
        </div>
      )}

      {adminMode === 'panel' && (
        <div style={styles.modalBack}>
          <div style={styles.adminFrame}>
            <div style={styles.adminHeader}>
              <h2 style={{margin: 0}}>ALEX HUB COMMAND CENTER V7.1</h2>
              <button onClick={() => setAdminMode('closed')} style={styles.closeBtn}>CERRAR</button>
            </div>
            <div style={styles.adminGrid}>
              <div style={styles.adminSection}>
                <h3>🌐 ONLINE ({Object.keys(activeUsers).length})</h3>
                {Object.values(activeUsers).map(u => (
                  <div key={u.id} style={styles.row}>
                    <span>{u.id}</span>
                    <button onClick={() => actionBan(u.id)} style={styles.banBtn}>BAN</button>
                  </div>
                ))}
              </div>
              <div style={styles.adminSection}>
                <h3>🚫 BANEADOS ({Object.keys(bannedList).length})</h3>
                {Object.keys(bannedList).map(id => (
                  <div key={id} style={styles.row}>
                    <span>{id}</span>
                    <button onClick={() => actionUnban(id)} style={styles.unbanBtn}>REMITIR</button>
                  </div>
                ))}
              </div>
              <div style={styles.adminSection}>
                <h3>💎 PREMIUM</h3>
                {premiumUsers.map((u, i) => (
                  <div key={i} style={styles.row}>
                    <span>{u}</span>
                    <button onClick={() => actionRemovePremium(i)} style={styles.banBtn}>X</button>
                  </div>
                ))}
                <input type="text" placeholder="Nuevo Premium..." onKeyDown={(e) => {
                  if(e.key === 'Enter'){ actionAddPremium(e.target.value); e.target.value=''; }
                }} style={{...styles.loginInput, width: '90%', fontSize: '14px', marginTop: '10px'}} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DORADO --- */}
      {showPuList && (
        <div style={styles.modalBack} onClick={() => setShowPuList(false)}>
           <div style={styles.puModal}>
              <h1 style={{color: '#FFD700', textAlign: 'center'}}>⚜️ ELITE USERS ⚜️</h1>
              <div style={{marginTop: '30px'}}>
                {premiumUsers.map((u, i) => <div key={i} style={styles.puRow}>{u}</div>)}
              </div>
           </div>
        </div>
      )}

      <footer style={styles.footer}>
        <span>SISTEMA V7.1 | TOKEN: {currentToken}</span>
        <span>ID ACTUAL: {userId}</span>
      </footer>
    </div>
  );
}

const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '50px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center', boxShadow: '0 0 40px rgba(229,9,20,0.3)' },
  glitchText: { color: '#fff', fontSize: '32px', letterSpacing: '10px', marginBottom: '20px' },
  loginInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '20px', textAlign: 'center', outline: 'none' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #111' },
  logoBox: { borderLeft: '4px solid #E50914', paddingLeft: '15px', display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '20px', fontWeight: 'bold' },
  logoSub: { fontSize: '10px', color: '#E50914' },
  adminTrigger: { background: 'transparent', border: '1px solid #111', color: '#111', fontSize: '9px', cursor: 'pointer' },
  
  tabContainer: { display: 'flex', background: '#111', borderRadius: '15px', padding: '5px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '12px' },
  
  premiumBadge: { background: 'linear-gradient(45deg, #FFD700, #DAA520)', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' },
  
  contentArea: { flex: 1, padding: '50px' },
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: '#333' },
  
  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', border: '1px solid #333' },
  
  adminFrame: { background: '#080808', width: '90%', height: '80%', border: '2px solid #FFD700', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminHeader: { padding: '20px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, gap: '1px', background: '#222' },
  adminSection: { background: '#080808', padding: '20px', overflowY: 'auto' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#0c0c0c', marginBottom: '5px' },
  banBtn: { background: '#E50914', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  unbanBtn: { background: '#00FF41', border: 'none', color: '#000', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  closeBtn: { background: '#333', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' },

  puModal: { background: '#000', border: '2px solid #FFD700', padding: '50px', borderRadius: '40px', minWidth: '300px' },
  puRow: { padding: '15px', textAlign: 'center', fontSize: '20px', borderBottom: '1px solid #111', letterSpacing: '2px' },
  banPage: { height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', textAlign: 'center' }
};
