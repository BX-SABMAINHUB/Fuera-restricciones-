import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CORE CONFIGURATION ---
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

const TOKEN_SOURCE = "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjR-SeywMdcLkMW5_bzihToX9WNzyNyK7SQJCQhqS89g_KO5tiyQiKd_iZaO-V5DQuf0-TyXP9JVsn10q9ob87hmTOXwucU0zhFh9HNZMKYLuve8gpdEXQtVaW5u94H9oquoelINeqc8siVX-H537LvGvk2sBjWUz416XgXYnkB47cvO_q1dtycnVMG9fumc-uEfrGQLtsQkUbtAavz2KX9Ou5qux3ZGUTY6pgBUuDG2LSf-hjb23nMtSAi5g2fqMlNHdcKE7Vz6TyGjRoAli2j577bsw&lib=Mho2v4Pq3qduztqlJtfUfKp2DlgL227C5";
const YOUTUBE_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_REDIRECT = "https://faria.managebac.com/login";

export default function AlexHubMegaSystem() {
  // --- AUTH STATES ---
  const [isAuth, setIsAuth] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [realToken, setRealToken] = useState('LOADING...');
  const [userId, setUserId] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  
  // --- UI STATES ---
  const [view, setView] = useState('youtube');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [activePlayer, setActivePlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- ADMIN MASTER STATES ---
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [isGodMode, setIsGodMode] = useState(false);
  const [onlineList, setOnlineList] = useState({});
  const [banList, setBanList] = useState({});
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [terminalLogs, setTerminalLogs] = useState(["[SYSTEM]: Kernel Initialized...", "[SYSTEM]: Waiting for auth..."]);

  // --- 1. TOKEN FETCHING ENGINE ---
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(TOKEN_SOURCE);
        const text = await response.text();
        // Limpiamos posibles comillas o espacios del script de Google
        const clean = text.trim().replace(/"/g, '');
        setRealToken(clean);
        addLog(`[SECURITY]: Remote Token Sync: ${clean.substring(0, 3)}***`);
      } catch (e) {
        addLog("[ERROR]: Failed to fetch remote token");
      }
    };
    fetchToken();
    const interval = setInterval(fetchToken, 300000); // Re-sync cada 5 min
    return () => clearInterval(interval);
  }, []);

  // --- 2. IDENTITY & REALTIME SYNC ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (!id) {
      id = 'ALEX-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const newUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
      window.history.replaceState(null, '', newUrl);
    }
    setUserId(id);

    // Conectar Presencia
    const myRef = ref(db, `online/${id}`);
    set(myRef, { id, status: 'browsing', lastSeen: serverTimestamp(), agent: navigator.userAgent });
    onDisconnect(myRef).remove();

    // Listeners Globales
    onValue(ref(db, `bans/${id}`), (s) => setIsBanned(s.exists()));
    onValue(ref(db, 'online'), (s) => setOnlineList(s.val() || {}));
    onValue(ref(db, 'bans'), (s) => setBanList(s.val() || {}));
    onValue(ref(db, 'premium_users'), (s) => setPremiumUsers(s.val() || []));
  }, []);

  // --- 3. HELPER FUNCTIONS ---
  const addLog = (msg) => setTerminalLogs(prev => [msg, ...prev].slice(0, 10));

  const handleLogin = (e) => {
    e.preventDefault();
    if (tokenInput === realToken) {
      setIsAuth(true);
      addLog(`[AUTH]: User ${userId} granted access.`);
    } else {
      alert("TOKEN INCORRECTO. REVISA LA FUENTE.");
      addLog(`[SECURITY]: Failed login attempt on ${userId}`);
    }
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPass === 'Alex2706') {
      setIsGodMode(true);
      setAdminPass('');
      addLog("[ADMIN]: God Mode Enabled.");
    } else {
      alert("ACCESO DENEGADO");
    }
  };

  const execSearch = async (e) => {
    if (e) e.preventDefault();
    if (!search) return;
    setLoading(true);
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(search)}&type=video&key=${YOUTUBE_KEY}`);
      const d = await r.json();
      setResults(d.items || []);
      setActivePlayer(null);
    } catch (err) { addLog("[API]: YouTube Fetch Error"); }
    setLoading(false);
  };

  // --- ADMIN ACTIONS ---
  const banUser = (id) => {
    if (id === userId) return;
    set(ref(db, `bans/${id}`), { reason: 'Admin Action', timestamp: serverTimestamp() });
    addLog(`[ACTION]: Banned ${id}`);
  };

  const unbanUser = (id) => {
    remove(ref(db, `bans/${id}`));
    addLog(`[ACTION]: Unbanned ${id}`);
  };

  // --- RENDER LOGIC ---
  if (isBanned) return (
    <div style={styles.banOverlay}>
      <div style={styles.banBox}>
        <h1 style={{fontSize: '80px', margin: 0}}>🚫</h1>
        <h2>TU ID HA SIDO BANEADO</h2>
        <p style={{color: '#666'}}>ID: {userId}</p>
        <div style={styles.glitchBar}></div>
      </div>
    </div>
  );

  if (!isAuth) return (
    <div style={styles.loginPage}>
      <div style={styles.vignette}></div>
      <div style={styles.loginCard}>
        <div style={styles.hubBadge}>ULTRA V9.0</div>
        <h1 style={styles.mainTitle}>ALEX<span style={{color:'#E50914'}}>HUB</span></h1>
        <p style={styles.idDisplay}>SESSION_IDENTIFIER: {userId}</p>
        
        <form onSubmit={handleLogin} style={styles.loginForm}>
          <div style={styles.inputWrapper}>
            <input 
              type="text" 
              placeholder="ENTER REMOTE TOKEN" 
              value={tokenInput} 
              onChange={e => setTokenInput(e.target.value)}
              style={styles.bigInput}
            />
            <div style={styles.inputLine}></div>
          </div>
          <button type="submit" style={styles.glowButton}>INITIALIZE SYSTEM</button>
        </form>
        
        <div style={styles.tokenStatus}>
          SERVER_STATUS: <span style={{color: '#00ff41'}}>ONLINE</span> | DATA_SYNC: <span style={{color: '#00ff41'}}>OK</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.mainApp}>
      {/* NAVBAR SUPERIOR */}
      <nav style={styles.navbar}>
        <div style={styles.navGroup}>
          <div style={styles.logoFrame} onClick={() => setAdminOpen(true)}>
            <span style={styles.logoA}>A</span><span style={styles.logoL}>L</span>
          </div>
          <div style={styles.menuTabs}>
            {['youtube', 'movies', 'twitch', 'xbox'].map(m => (
              <button 
                key={m} 
                onClick={() => setView(m)} 
                style={view === m ? styles.activeTab : styles.tab}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={execSearch} style={styles.searchContainer}>
          <input 
            style={styles.topSearch} 
            placeholder={`Search in ${view.toUpperCase()}...`} 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" style={styles.searchIcon}>🔍</button>
        </form>

        <div style={styles.navGroup}>
          {premiumUsers.length > 0 && <div style={styles.premiumIndicator}>⚜️ PREMIUM ACTIVE</div>}
          <button onClick={() => window.location.href = PANIC_REDIRECT} style={styles.panicBtn}>PÁNICO</button>
        </div>
      </nav>

      {/* CUERPO PRINCIPAL */}
      <div style={styles.content}>
        {loading ? (
          <div style={styles.loaderContainer}><div style={styles.megaSpinner}></div></div>
        ) : (
          <div style={styles.scrollArea}>
            {activePlayer ? (
              <div style={styles.playerContainer}>
                <iframe 
                  src={`https://www.youtube-nocookie.com/embed/${activePlayer}?autoplay=1`} 
                  style={styles.mainIframe} 
                  allowFullScreen 
                />
                <button onClick={() => setActivePlayer(null)} style={styles.closePlayer}>CLOSE PLAYER</button>
              </div>
            ) : (
              <div style={styles.videoGrid}>
                {results.map((v, i) => (
                  <div key={i} style={styles.vCard} onClick={() => setActivePlayer(v.id.videoId)}>
                    <div style={styles.thumbWrap}>
                      <img src={v.snippet.thumbnails.high.url} style={styles.thumbImg} alt="thumb"/>
                      <div style={styles.playOverlay}>▶</div>
                    </div>
                    <div style={styles.vInfo}>
                      <h4 style={styles.vTitle}>{v.snippet.title}</h4>
                      <p style={styles.vChannel}>{v.snippet.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER TÉCNICO */}
      <footer style={styles.footer}>
        <div style={styles.consoleLogs}>
          {terminalLogs.map((log, i) => <div key={i} style={{opacity: 1 - (i*0.2)}}>{log}</div>)}
        </div>
        <div style={styles.systemMeta}>
          ID: {userId} | MODE: {view.toUpperCase()} | SOCKET: ESTABLISHED
        </div>
      </footer>

      {/* MODAL DE ADMIN (MODO DIOS) */}
      {adminOpen && (
        <div style={styles.adminModalBack} onClick={() => setAdminOpen(false)}>
          <div style={styles.adminContainer} onClick={e => e.stopPropagation()}>
            {!isGodMode ? (
              <div style={styles.adminAuth}>
                <h2 style={{color: '#ff0000'}}>RESTRICTED AREA</h2>
                <form onSubmit={handleAdminAuth}>
                  <input 
                    type="password" 
                    placeholder="ADMIN_KEY" 
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    style={styles.bigInput}
                    autoFocus
                  />
                  <button type="submit" style={styles.glowButton}>UNLOCK</button>
                </form>
              </div>
            ) : (
              <div style={styles.godPanel}>
                <div style={styles.panelHeader}>
                  <h3>ALEX HUB MASTER CONTROL</h3>
                  <button onClick={() => setIsGodMode(false)} style={styles.logoutBtn}>LOGOUT</button>
                </div>
                <div style={styles.panelGrid}>
                  <div style={styles.panelSection}>
                    <h4>🌐 ACTIVE SESSIONS ({Object.keys(onlineList).length})</h4>
                    <div style={styles.userList}>
                      {Object.values(onlineList).map(u => (
                        <div key={u.id} style={styles.userRow}>
                          <span style={{fontSize: '12px'}}>{u.id} {u.id === userId && "(YOU)"}</span>
                          <button onClick={() => banUser(u.id)} style={styles.miniBanBtn}>BAN</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={styles.panelSection}>
                    <h4>🚫 BLACKLIST ({Object.keys(banList).length})</h4>
                    <div style={styles.userList}>
                      {Object.keys(banList).map(id => (
                        <div key={id} style={styles.userRow}>
                          <span style={{color: '#ff4444'}}>{id}</span>
                          <button onClick={() => unbanUser(id)} style={styles.miniUnbanBtn}>REVOKE</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={styles.panelSection}>
                    <h4>💎 PREMIUM DATABASE</h4>
                    <div style={styles.premiumBox}>
                      {premiumUsers.map((u, i) => <div key={i} style={styles.puTag}>{u}</div>)}
                    </div>
                    <button 
                      style={styles.addPuBtn}
                      onClick={() => {
                        const n = prompt("Premium Name:");
                        if(n) set(ref(db, 'premium_users'), [...premiumUsers, n]);
                      }}
                    >+ ADD USER</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- ESTILOS ULTRA CURRADOS (CSS-IN-JS) ---
const styles = {
  loginPage: {
    height: '100vh',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#fff',
    overflow: 'hidden',
    position: 'relative'
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle, transparent 20%, #000 100%)',
    pointerEvents: 'none'
  },
  loginCard: {
    width: '450px',
    padding: '60px',
    background: 'rgba(10,10,10,0.8)',
    borderRadius: '40px',
    border: '1px solid #1a1a1a',
    textAlign: 'center',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    zIndex: 10
  },
  hubBadge: {
    display: 'inline-block',
    padding: '5px 15px',
    background: '#E50914',
    fontSize: '10px',
    fontWeight: 'bold',
    borderRadius: '20px',
    marginBottom: '20px'
  },
  mainTitle: {
    fontSize: '50px',
    letterSpacing: '15px',
    margin: '0 0 10px 0',
    fontWeight: '900'
  },
  idDisplay: {
    fontSize: '10px',
    color: '#444',
    marginBottom: '40px',
    letterSpacing: '2px'
  },
  bigInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid #333',
    color: '#fff',
    fontSize: '18px',
    padding: '10px 0',
    textAlign: 'center',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  glowButton: {
    width: '100%',
    padding: '15px',
    marginTop: '30px',
    background: '#E50914',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(229,9,20,0.4)',
    transition: 'transform 0.2s'
  },
  tokenStatus: {
    marginTop: '30px',
    fontSize: '9px',
    color: '#333',
    letterSpacing: '1px'
  },
  
  // NAVBAR
  navbar: {
    height: '70px',
    background: '#000',
    borderBottom: '1px solid #111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 25px',
    zIndex: 100
  },
  navGroup: { display: 'flex', alignItems: 'center', gap: '20px' },
  logoFrame: {
    width: '40px',
    height: '40px',
    background: '#E50914',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  menuTabs: { display: 'flex', gap: '5px', background: '#111', padding: '5px', borderRadius: '12px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '8px 15px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' },
  activeTab: { background: '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px' },
  
  searchContainer: { flex: 1, maxWidth: '500px', margin: '0 40px', position: 'relative' },
  topSearch: { width: '100%', background: '#111', border: '1px solid #222', padding: '10px 45px 10px 20px', borderRadius: '25px', color: '#fff', outline: 'none' },
  searchIcon: { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' },
  
  panicBtn: { background: '#fff', color: '#000', padding: '8px 20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  premiumIndicator: { color: '#FFD700', fontSize: '11px', fontWeight: 'bold', border: '1px solid #FFD700', padding: '5px 10px', borderRadius: '5px' },

  // CONTENT
  content: { flex: 1, overflow: 'hidden', background: '#050505' },
  scrollArea: { height: '100%', overflowY: 'auto', padding: '30px' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  vCard: { background: '#0a0a0a', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' },
  thumbWrap: { position: 'relative', aspectRatio: '16/9' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  playOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, transition: '0.3s', fontSize: '40px' },
  vInfo: { padding: '15px' },
  vTitle: { fontSize: '14px', margin: '0 0 5px 0', height: '40px', overflow: 'hidden' },
  vChannel: { fontSize: '12px', color: '#666' },

  playerContainer: { width: '100%', height: '75vh', position: 'relative', background: '#000', borderRadius: '20px', overflow: 'hidden' },
  mainIframe: { width: '100%', height: '100%', border: 'none' },
  closePlayer: { position: 'absolute', top: '20px', right: '20px', background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },

  // FOOTER
  footer: { height: '80px', background: '#000', borderTop: '1px solid #111', display: 'flex', padding: '10px 25px', alignItems: 'center', justifyContent: 'space-between' },
  consoleLogs: { fontSize: '10px', fontFamily: 'monospace', color: '#00ff41' },
  systemMeta: { fontSize: '11px', color: '#333', fontWeight: 'bold' },

  // ADMIN
  adminModalBack: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  adminContainer: { width: '800px', background: '#080808', border: '1px solid #333', borderRadius: '20px', padding: '40px' },
  godPanel: { width: '100%' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '20px' },
  panelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  panelSection: { background: '#111', padding: '15px', borderRadius: '12px', maxHeight: '400px', overflowY: 'auto' },
  userRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#050505', marginBottom: '5px', borderRadius: '5px' },
  miniBanBtn: { background: '#ff0000', border: 'none', color: '#fff', fontSize: '9px', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer' },
  miniUnbanBtn: { background: '#00ff41', border: 'none', color: '#000', fontSize: '9px', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer' },
  premiumBox: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
  puTag: { background: '#FFD700', color: '#000', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' },
  addPuBtn: { width: '100%', marginTop: '15px', padding: '8px', background: 'transparent', border: '1px solid #FFD700', color: '#FFD700', borderRadius: '5px', cursor: 'pointer' },

  banOverlay: { height: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  banBox: { padding: '50px', border: '2px solid #ff0000', borderRadius: '20px' }
};

// Global CSS for Spinners
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .mega-spinner { width: 50px; height: 50px; border: 5px solid #111; border-top-color: #E50914; border-radius: 50%; animation: spin 1s linear infinite; }
  `;
  document.head.appendChild(style);
}
