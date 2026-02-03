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
  const [isChanging, setIsChanging] = useState(false);
  const [showModal, setShowModal] = useState(null); // 'terms', 'creator', 'bx', 'news', 'help'

  // --- LÓGICA DE ROUTING (MANEJO DE URLS /twitch, /movies...) ---
  useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    const validModes = ['youtube', 'twitch', 'movies', 'xbox'];
    if (validModes.includes(path)) {
      setMode(path);
    }
    // Sincronizar URL cuando cambia el modo
    window.history.pushState(null, '', `/${mode}`);
  }, [mode]);

  // --- LÓGICA DE SEGURIDAD ---
  const generateCurrentToken = () => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let result = '';
    let hash = 0;
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
    if (password === generateCurrentToken()) {
      setAuthorized(true);
    } else {
      alert("TOKEN INVÁLIDO");
      setPassword('');
    }
  };

  const changeSection = (newMode) => {
    if (newMode === mode) return;
    setIsChanging(true);
    setTimeout(() => {
      setMode(newMode);
      setIsChanging(false);
    }, 4000); // 4 SEGUNDOS DE CARGA CURRADA
  };

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    if (mode === 'youtube') {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.error) {
          setVideos(data.items.filter(item => item.id?.videoId));
          setSelectedVideo(null);
        }
      } catch (err) { alert("Error de conexión con YouTube"); }
    }
  };

  if (!authorized) {
    return (
      <div style={styles.loginPage}>
         {/* BOTONES DE ESQUINA EN LOGIN */}
         <button onClick={() => setShowModal('creator')} style={{...styles.cornerBtn, top: 20, left: 20}}>ABOUT CREATOR</button>
         <button onClick={() => setShowModal('terms')} style={{...styles.cornerBtn, top: 20, right: 20}}>TERMS</button>

        <div style={styles.loginCard}>
          <div style={styles.neonOrbit}></div>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN DE 6 DÍGITOS" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ENTRAR AL NÚCLEO</button>
          </form>
        </div>
        {renderModal()}
      </div>
    );
  }

  function renderModal() {
    if (!showModal) return null;
    const content = {
      creator: { t: "About Creator", c: "Made by Alex (Alexgaming). Desarrollador experto en bypass de seguridad y diseño de interfaces Ultra-Premium." },
      terms: { t: "Terms & Conditions", c: "1. Este HUB es para uso privado. 2. No compartir la URL de GitHub con profesores. 3. El uso de YouTube y Twitch está sujeto a las leyes de entretenimiento digital de Alex. 4. Si el botón de pánico falla (cosa imposible), cierre la pestaña manualmente. 5. Al entrar, aceptas que Alexgaming es el jefe absoluto de esta red." },
      bx: { t: "About Bx", c: "Bx-SabMainHub es la infraestructura central que alimenta este ecosistema de entretenimiento." }
    };
    return (
      <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{color: '#E50914'}}>{content[showModal]?.t}</h2>
          <p style={{lineHeight: '1.6'}}>{content[showModal]?.c}</p>
          <button onClick={() => setShowModal(null)} style={styles.loginButton}>CERRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* OVERLAY DE CARGA */}
      {isChanging && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
          <h2 style={{marginTop: 20, letterSpacing: 4}}>RECALIBRANDO SISTEMA...</h2>
          <div style={styles.progressBar}><div style={styles.progressFill}></div></div>
        </div>
      )}

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB ULTRA</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map((t) => (
              <button key={t} onClick={() => changeSection(t)} style={mode === t ? styles.activeTab : styles.tab}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={performSearch} style={styles.searchForm}>
          <input 
            style={styles.searchInput} 
            placeholder={`Buscar en ${mode}...`} 
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
                  <img src={v.snippet.thumbnails.high.url} style={styles.thumbnail} />
                  <div style={styles.cardInfo}><p style={styles.videoTitle}>{v.snippet.title}</p></div>
                </div>
              ))
            )}
          </div>
        )}

        {mode === 'movies' && (
          <div style={styles.fullView}>
            <iframe 
              src={`https://www.google.com/search?q=${encodeURIComponent(query)}+pelicula+completa+online&igu=1`} 
              style={styles.fullIframe} 
              allowFullScreen 
              sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock" 
            />
          </div>
        )}

        {mode === 'twitch' && (
          <div style={styles.fullView}>
            <iframe 
              src={`https://player.twitch.tv/?channel=${query.toLowerCase() || 'rivers_gg'}&parent=${window.location.hostname}&autoplay=true`} 
              style={styles.fullIframe} 
              allowFullScreen 
            />
          </div>
        )}

        {mode === 'xbox' && (
          <div style={styles.fullView}>
            <iframe src="https://www.bing.com/search?q=xbox+cloud+gaming+fortnite&igu=1" style={styles.fullIframe} />
          </div>
        )}
      </main>

      {/* BOTONES DE INFO EN FOOTER */}
      <div style={styles.footerInfo}>
          <button onClick={() => setShowModal('bx')} style={styles.footerBtn}>About Bx</button>
          <button onClick={() => setShowModal('creator')} style={styles.footerBtn}>Creator</button>
          <button onClick={() => setShowModal('terms')} style={styles.footerBtn}>T&C</button>
      </div>

      <footer style={styles.footer}>
        <span>SISTEMA OPERATIVO ALEX HUB V5.0</span>
        <span>TOKEN: {generateCurrentToken()}</span>
      </footer>
      {renderModal()}
    </div>
  );
}

// --- ESTILOS MEJORADOS (MEGA CURRADOS) ---
const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  loginCard: { background: 'rgba(10,10,10,0.9)', padding: '60px', borderRadius: '40px', border: '1px solid #333', textAlign: 'center', zIndex: 10, position: 'relative', boxShadow: '0 0 50px rgba(229, 9, 20, 0.2)' },
  neonOrbit: { position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', border: '2px solid #E50914', borderRadius: '50%', opacity: 0.1, animation: 'spin 10s linear infinite' },
  glitchText: { color: '#fff', fontSize: '32px', letterSpacing: '8px', marginBottom: '40px', fontFamily: 'Impact' },
  loginInput: { background: '#000', border: '2px solid #333', color: '#fff', padding: '18px', borderRadius: '15px', width: '280px', fontSize: '22px', textAlign: 'center', outline: 'none', transition: '0.3s' },
  loginButton: { display: 'block', width: '100%', marginTop: '25px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },
  
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'Segoe UI, Roboto' },
  loadingOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '80px', height: '80px', border: '5px solid #222', borderTop: '5px solid #E50914', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  progressBar: { width: '300px', height: '4px', background: '#111', marginTop: '30px', borderRadius: '10px', overflow: 'hidden' },
  progressFill: { width: '100%', height: '100%', background: '#E50914', animation: 'load 4s linear' },

  navbar: { height: '80px', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid #1a1a1a', backdropFilter: 'blur(10px)' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
  logoBox: { display: 'flex', flexDirection: 'column', borderLeft: '3px solid #E50914', paddingLeft: '15px' },
  logoMain: { fontSize: '22px', fontWeight: '900', color: '#fff' },
  logoSub: { fontSize: '10px', color: '#E50914', letterSpacing: '2px' },
  
  tabContainer: { display: 'flex', gap: '10px' },
  tab: { background: 'transparent', border: 'none', color: '#666', padding: '10px 18px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(229,9,20,0.4)' },
  
  searchForm: { flex: 1, maxWidth: '500px', margin: '0 40px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '12px 25px', borderRadius: '30px', outline: 'none', fontSize: '14px' },
  panicButton: { background: '#fff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '30px', fontWeight: '900', cursor: 'pointer', transition: '0.3s' },
  
  contentArea: { flex: 1, overflowY: 'auto', padding: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' },
  card: { background: '#0a0a0a', borderRadius: '20px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: 'transform 0.3s' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '20px' },
  videoTitle: { fontSize: '14px', fontWeight: '600', color: '#eee' },
  
  fullView: { height: '100%', borderRadius: '20px', overflow: 'hidden', background: '#000' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  
  footerInfo: { position: 'fixed', bottom: 50, right: 30, display: 'flex', gap: '10px' },
  footerBtn: { background: '#111', border: '1px solid #222', color: '#444', padding: '5px 12px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer' },
  cornerBtn: { position: 'absolute', background: 'transparent', border: '1px solid #222', color: '#333', padding: '8px 15px', borderRadius: '30px', fontSize: '10px', cursor: 'pointer', zIndex: 100 },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', maxWidth: '500px', border: '1px solid #333' },
  
  footer: { height: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontSize: '10px', color: '#333', borderTop: '1px solid #111' }
};

// AGREGAR ANIMACIONES AL CSS GLOBAL
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin { 100% { transform: rotate(360deg); } }
  @keyframes load { 0% { width: 0%; } 100% { width: 100%; } }
  body { margin: 0; background: black; }
`;
document.head.appendChild(styleSheet);
