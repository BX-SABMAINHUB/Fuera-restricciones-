import React, { useState, useEffect } from 'react';

// CONFIGURACIÓN MAESTRA
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";

export default function AlexHubUltra() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube'); 
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [modal, setModal] = useState(null);

  // --- 1. INTELIGENCIA DE RUTA (DEEP LINKING) ---
  useEffect(() => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    const validModes = ['youtube', 'twitch', 'movies', 'xbox'];
    if (validModes.includes(path)) {
      setMode(path);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      window.history.pushState(null, '', `/${mode}`);
    }
  }, [mode, authorized]);

  // --- 2. LÓGICA DE SEGURIDAD ---
  const generateCurrentToken = () => {
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
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === generateCurrentToken()) setAuthorized(true);
    else { alert("TOKEN INVÁLIDO"); setPassword(''); }
  };

  // --- 3. CAMBIO DE SECCIÓN CON CARGA DE 4 SEG ---
  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setTransitioning(false);
    }, 4000);
  };

  // --- 4. BUSCADOR YOUTUBE ---
  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query || mode !== 'youtube') return;
    setLoading(true);
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) {
        setVideos(data.items.filter(v => v.id?.videoId));
        setSelectedVideo(null);
      }
    } catch (err) { alert("Error de conexión"); }
    setLoading(false);
  };

  // --- MODALES (ABOUT, TERMS, ETC) ---
  const openModal = (type) => setModal(type);
  const renderModal = () => {
    if (!modal) return null;
    const info = {
      bx: { t: "About Bx Hub", c: "Sincronización total con redes de bypass escolar. Bx es el núcleo de la red Alex Hub." },
      creator: { t: "About Creator", c: "System Architect: Alex / Alexgaming. Especialista en seguridad y desarrollo de sistemas Ultra." },
      terms: { t: "Terms & Conditions", c: "Al acceder a esta plataforma, el usuario acepta que: 1. No revelará la URL a personal docente. 2. Alexgaming no se hace responsable de las notas bajas por viciar demasiado. 3. Este software utiliza túneles de encriptación para YouTube y Xbox. 4. Queda prohibido el uso de la plataforma sin el token de 6 dígitos generado por el algoritmo de Alex. 5. Las sesiones se cierran automáticamente al detectar actividad de red sospechosa. 6. Disfruta del cine y los juegos sin límites." },
      news: { t: "Latest News", c: "V6.0 activa: Añadida carga de 4 segundos, ruteo por URL y sistema de búsqueda en Google para cine." },
      help: { t: "Get Help", c: "Si el token no funciona, contacta con Alex o revisa el repositorio de GitHub Pages." }
    };
    return (
      <div style={styles.modalBack} onClick={() => setModal(null)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{color: '#E50914', borderBottom: '1px solid #333', paddingBottom: '10px'}}>{info[modal].t}</h2>
          <p style={{fontSize: '14px', lineHeight: '1.8', color: '#ccc'}}>{info[modal].c}</p>
          <button onClick={() => setModal(null)} style={styles.loginButton}>ENTENDIDO</button>
        </div>
      </div>
    );
  };

  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <button onClick={() => openModal('creator')} style={{...styles.miniBtn, top: 20, left: 20}}>ABOUT CREATOR</button>
        <button onClick={() => openModal('terms')} style={{...styles.miniBtn, top: 20, right: 20}}>TERMS</button>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN DE 6 DÍGITOS" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ENTRAR</button>
          </form>
        </div>
        {renderModal()}
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* 5. OVERLAY DE CARGA DE 4 SEG */}
      {transitioning && (
        <div style={styles.loaderWrap}>
          <div style={styles.spinner}></div>
          <p style={{marginTop: '20px', letterSpacing: '5px', color: '#E50914', fontWeight: 'bold'}}>CARGANDO {mode.toUpperCase()}...</p>
        </div>
      )}

      {/* 5 BOTONES EN LAS ESQUINAS/FOOTER */}
      <button onClick={() => openModal('bx')} style={{...styles.miniBtn, bottom: 80, left: 20}}>About Bx</button>
      <button onClick={() => openModal('news')} style={{...styles.miniBtn, bottom: 80, right: 20}}>News</button>
      <button onClick={() => openModal('help')} style={{...styles.miniBtn, top: 90, right: 20}}>Help</button>

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB ULTRA</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(m => (
              <button key={m} onClick={() => handleModeChange(m)} style={mode === m ? styles.activeTab : styles.tab}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <form onSubmit={performSearch} style={styles.searchForm}>
          <input 
            style={styles.searchInput} 
            placeholder={mode === 'movies' ? "Nombre de la peli..." : "Buscar..."} 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </form>
        <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
      </nav>

      <main style={styles.contentArea}>
        {mode === 'youtube' && (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.playerWrapper}>
                <iframe src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} style={styles.fullIframe} allowFullScreen />
                <button onClick={() => setSelectedVideo(null)} style={styles.closeButton}>VOLVER</button>
              </div>
            ) : (
              videos.map((v, i) => (
                <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                  <img src={v.snippet.thumbnails.high.url} style={styles.thumbnail} alt="thumb" />
                  <div style={styles.cardInfo}><p style={styles.videoTitle}>{v.snippet.title}</p></div>
                </div>
              ))
            )}
          </div>
        )}

        {mode === 'movies' && (
          <div style={styles.fullView}>
            <iframe src={`https://www.google.com/search?q=${encodeURIComponent(query)}+watch+online+free&igu=1`} style={styles.fullIframe} allowFullScreen sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock" />
          </div>
        )}

        {mode === 'twitch' && (
          <div style={styles.fullView}>
            <iframe src={`https://player.twitch.tv/?channel=${query.toLowerCase() || 'rivers_gg'}&parent=${window.location.hostname}&autoplay=true`} style={styles.fullIframe} allowFullScreen />
          </div>
        )}

        {mode === 'xbox' && (
          <div style={styles.fullView}>
            <iframe src="https://www.bing.com/search?q=site:xbox.com+fortnite+play+now&igu=1" style={styles.fullIframe} sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-modals" />
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <span>SISTEMA: V6.0 - BY ALEX</span>
        <span>URL: /{mode}</span>
        <span>TOKEN ACTIVO: {generateCurrentToken()}</span>
      </footer>
      {renderModal()}
    </div>
  );
}

const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', border: '1px solid #E50914', textAlign: 'center', boxShadow: '0 0 30px rgba(229,9,20,0.2)' },
  glitchText: { color: '#fff', fontSize: '28px', letterSpacing: '8px', marginBottom: '30px' },
  loginInput: { background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '20px', textAlign: 'center', outline: 'none' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', position: 'relative' },
  loaderWrap: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '60px', height: '60px', border: '4px solid #111', borderTop: '4px solid #E50914', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #222' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  logoBox: { display: 'flex', flexDirection: 'column', borderLeft: '4px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '20px', fontWeight: 'bold' },
  logoSub: { fontSize: '10px', color: '#E50914' },
  
  tabContainer: { display: 'flex', background: '#111', borderRadius: '15px', padding: '5px' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' },
  
  searchForm: { flex: 1, maxWidth: '450px', margin: '0 30px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '12px 20px', borderRadius: '30px', outline: 'none' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' },
  
  contentArea: { flex: 1, overflowY: 'auto', padding: '25px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.3s' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px' },
  videoTitle: { fontSize: '14px', fontWeight: 'bold' },
  
  fullView: { height: '100%', background: '#000', borderRadius: '20px', overflow: 'hidden' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  playerWrapper: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  closeButton: { position: 'absolute', top: '-40px', right: 0, background: '#E50914', color: '#fff', border: 'none', padding: '5px 20px', borderRadius: '5px' },
  
  miniBtn: { position: 'absolute', background: 'transparent', border: '1px solid #222', color: '#333', padding: '5px 12px', borderRadius: '20px', fontSize: '10px', cursor: 'pointer', zIndex: 100 },
  modalBack: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 },
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', maxWidth: '500px', border: '1px solid #333' },
  
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '11px', color: '#333', borderTop: '1px solid #111' }
};

// Inyectar animación
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
