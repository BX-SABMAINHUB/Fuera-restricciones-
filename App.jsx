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
  const [movieSource, setMovieSource] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // --- LÓGICA DE RUTAS (Sincronización de URL) ---
  useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    if (['youtube', 'twitch', 'movies', 'xbox'].includes(path)) {
      setMode(path);
    }
  }, []);

  const changeMode = (newMode) => {
    setMode(newMode);
    window.history.pushState(null, '', `/${newMode}`);
    setSelectedVideo(null);
  };

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
      window.history.pushState(null, '', '/youtube');
    } else {
      alert("TOKEN INVÁLIDO");
      setPassword('');
    }
  };

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    if (mode === 'youtube') {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) alert("Error: " + data.error.message);
        else {
          setVideos(data.items.filter(item => item.id?.videoId));
          setSelectedVideo(null);
        }
      } catch (err) { alert("Error de conexión"); }
    }
    setLoading(false);
  };

  const movieServers = [
    { name: "Server Alpha", url: (q) => `https://vidsrc.to/v2/embed/movie/${encodeURIComponent(q)}` },
    { name: "Server Beta", url: (q) => `https://vidsrc.me/embed/movie?tmdb=${encodeURIComponent(q)}` },
    { name: "Server Gamma", url: (q) => `https://embed.su/embed/movie/${encodeURIComponent(q)}` },
    { name: "Proxy Search", url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}+online+free&igu=1` }
  ];

  // --- CONTENIDO DE BOTONES EXTRA ---
  const openInfo = (type) => {
    const content = {
      creator: { title: "About Creator", text: "Este sistema ha sido diseñado y codificado íntegramente por Alex (Alexgaming). Especialista en bypass de seguridad y optimización de entornos web educativos." },
      bx: { title: "About Bx Project", text: "Bx es una iniciativa de desarrollo privado para la centralización de contenido multimedia sin restricciones. El motor utiliza encriptación de sesión horaria sincronizada." },
      terms: { title: "Terms and Conditions", text: "Al usar Alex Hub Ultra, el usuario acepta que: 1. El uso del 'Botón de Pánico' es responsabilidad del operador. 2. No se almacenan credenciales de terceros. 3. El bypass de filtros educativos se realiza mediante técnicas de encapsulamiento iFrame. 4. Queda prohibida la redistribución del código fuente fuera del repositorio alex-codes. 5. El sistema se actualiza automáticamente cada 60 minutos para invalidar rastreos de IP estática. El desarrollador no se hace responsable del uso indebido durante horas lectivas." },
      privacy: { title: "Privacy Policy", text: "Alex Hub no utiliza cookies de rastreo ni almacena el historial de búsqueda en servidores externos. Todo el procesamiento de la API se realiza en el lado del cliente (Client-Side Rendering)." },
      v4: { title: "Version 4.0 Notes", text: "Añadido: Soporte de rutas dinámicas /path, Fix de Twitch API, Mejoras en el Sandbox de Xbox y optimización de carga de miniaturas 4K." }
    };
    setModalContent(content[type]);
  };

  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN DE 6 DÍGITOS" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ACCEDER AL NÚCLEO</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* BOTONES PEQUEÑOS EN ESQUINAS */}
      <button onClick={() => openInfo('creator')} style={{...styles.cornerBtn, top: 10, left: 10}}>About Creator</button>
      <button onClick={() => openInfo('bx')} style={{...styles.cornerBtn, top: 10, left: 110}}>About Bx</button>
      <button onClick={() => openInfo('terms')} style={{...styles.cornerBtn, bottom: 40, left: 10}}>Terms & Conditions</button>
      <button onClick={() => openInfo('privacy')} style={{...styles.cornerBtn, bottom: 40, left: 145}}>Privacy</button>
      <button onClick={() => openInfo('v4')} style={{...styles.cornerBtn, bottom: 40, right: 10}}>v4.0.2</button>

      {/* MODAL DE INFORMACIÓN */}
      {modalContent && (
        <div style={styles.modalOverlay} onClick={() => setModalContent(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#E50914'}}>{modalContent.title}</h2>
            <p style={{lineHeight: '1.6', color: '#ccc'}}>{modalContent.text}</p>
            <button onClick={() => setModalContent(null)} style={styles.closeModal}>CERRAR</button>
          </div>
        </div>
      )}

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB ULTRA</span></div>
          <div style={styles.tabContainer}>
            <button onClick={() => changeMode('youtube')} style={mode === 'youtube' ? styles.activeTab : styles.tab}>YouTube</button>
            <button onClick={() => changeMode('twitch')} style={mode === 'twitch' ? styles.activeTab : styles.tab}>Twitch</button>
            <button onClick={() => changeMode('movies')} style={mode === 'movies' ? styles.activeTab : styles.tab}>Películas</button>
            <button onClick={() => changeMode('xbox')} style={mode === 'xbox' ? styles.activeTab : styles.tab}>Xbox</button>
          </div>
        </div>
        <form onSubmit={performSearch} style={styles.searchForm}>
          <input 
            style={styles.searchInput} 
            placeholder={mode === 'movies' ? "Nombre de película..." : mode === 'twitch' ? "Canal de Twitch..." : "Buscar..."} 
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
          <div style={styles.movieContainer}>
            <div style={styles.serverBar}>
              {movieServers.map((s, i) => (
                <button key={i} onClick={() => setMovieSource(i)} style={movieSource === i ? styles.serverBtnActive : styles.serverBtn}>{s.name}</button>
              ))}
            </div>
            {query ? (
              <iframe src={movieServers[movieSource].url(query)} style={styles.fullIframe} allowFullScreen sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock" />
            ) : (
              <div style={styles.emptyState}>🎬 Escribe una película y pulsa ENTER.</div>
            )}
          </div>
        )}

        {mode === 'twitch' && query && (
          <div style={styles.fullView}>
            <iframe 
                src={`https://player.twitch.tv/?channel=${query.toLowerCase()}&parent=${window.location.hostname}&muted=false`} 
                style={styles.fullIframe} 
                allowFullScreen 
                frameBorder="0"
                scrolling="no"
            />
          </div>
        )}

        {mode === 'xbox' && (
          <div style={styles.fullView}>
            <iframe src="https://www.bing.com/search?q=site:xbox.com+play+fortnite&igu=1" style={styles.fullIframe} sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-modals" />
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <span>ROUTE: /{mode}</span>
        <span>TOKEN: {generateCurrentToken()}</span>
      </footer>
    </div>
  );
}

const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '60px', borderRadius: '40px', border: '2px solid #1a1a1a', textAlign: 'center', boxShadow: '0 0 50px rgba(229, 9, 20, 0.1)' },
  glitchText: { color: '#fff', fontSize: '28px', letterSpacing: '7px', marginBottom: '40px' },
  loginInput: { background: '#000', border: '1px solid #E50914', color: '#fff', padding: '18px', borderRadius: '15px', width: '280px', fontSize: '22px', textAlign: 'center', outline: 'none', boxShadow: 'inset 0 0 10px rgba(229, 9, 20, 0.2)' },
  loginButton: { display: 'block', width: '100%', marginTop: '30px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', position: 'relative', overflow: 'hidden' },
  cornerBtn: { position: 'absolute', background: 'rgba(255,255,255,0.05)', color: '#444', border: 'none', padding: '4px 8px', fontSize: '9px', borderRadius: '4px', cursor: 'pointer', zIndex: 100, transition: '0.3s' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' },
  modal: { background: '#0f0f0f', padding: '40px', borderRadius: '25px', maxWidth: '500px', border: '1px solid #333', textAlign: 'left' },
  closeModal: { marginTop: '20px', background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' },

  navbar: { height: '80px', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid #1a1a1a', backdropFilter: 'blur(10px)' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
  logoBox: { display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '22px', fontWeight: 'bold', color: '#fff' },
  logoSub: { fontSize: '10px', color: '#107C10', fontWeight: 'bold', letterSpacing: '1px' },
  
  tabContainer: { display: 'flex', background: '#0f0f0f', borderRadius: '15px', padding: '5px', border: '1px solid #222' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', borderRadius: '10px', transition: '0.3s' },
  activeTab: { background: '#E50914', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', boxShadow: '0 0 15px rgba(229, 9, 20, 0.4)' },
  
  searchForm: { flex: 1, maxWidth: '450px', margin: '0 30px' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #222', color: '#fff', padding: '12px 25px', borderRadius: '25px', outline: 'none', transition: '0.3s' },
  panicButton: { background: 'linear-gradient(45deg, #ff0000, #990000)', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(255,0,0,0.2)' },
  
  contentArea: { flex: 1, overflowY: 'auto', padding: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' },
  card: { background: '#0a0a0a', borderRadius: '20px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.3s' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '20px' },
  videoTitle: { fontSize: '14px', fontWeight: 'bold', color: '#efefef' },
  
  playerWrapper: { gridColumn: '1/-1', height: '80vh', position: 'relative' },
  fullIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '25px', background: '#000' },
  closeButton: { position: 'absolute', top: '-50px', right: 0, background: '#E50914', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: 'bold' },
  
  movieContainer: { height: '100%', display: 'flex', flexDirection: 'column' },
  serverBar: { display: 'flex', gap: '10px', marginBottom: '20px' },
  serverBtn: { background: '#111', color: '#666', border: '1px solid #222', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' },
  serverBtnActive: { background: '#fff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold' },
  
  fullView: { height: '100%', background: '#000', borderRadius: '25px', overflow: 'hidden' },
  emptyState: { display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '18px' },
  footer: { height: '35px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', fontSize: '11px', color: '#333' }
};
