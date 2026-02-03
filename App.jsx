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
  const [modal, setModal] = useState(null); // 'about', 'creator', 'terms', 'bx', 'news'

  // --- SISTEMA DE URLS DINÁMICAS ---
  useEffect(() => {
    if (authorized) {
      window.history.pushState(null, "", `/${mode}`);
    }
  }, [mode, authorized]);

  // --- LÓGICA DE SEGURIDAD ---
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

  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    if (mode === 'youtube') {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) alert("Error: " + data.error.message);
        else { setVideos(data.items.filter(i => i.id.videoId)); setSelectedVideo(null); }
      } catch (err) { alert("Error de conexión"); }
    }
    setLoading(false);
  };

  const movieServers = [
    { name: "Alpha", url: (q) => `https://vidsrc.to/v2/embed/movie/${encodeURIComponent(q)}` },
    { name: "Beta", url: (q) => `https://vidsrc.me/embed/movie?tmdb=${encodeURIComponent(q)}` },
    { name: "Gamma", url: (q) => `https://embed.su/embed/movie/${encodeURIComponent(q)}` },
    { name: "Bypass", url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}+watch+online+free&igu=1` }
  ];

  // --- COMPONENTES DE TEXTO ---
  const ModalContent = () => {
    const contents = {
      about: { t: "About Bx Project", c: "Bx es una infraestructura de acceso privado diseñada para el bypass de firewalls educativos. Utiliza protocolos de encapsulamiento para permitir streaming de alta fidelidad en entornos restringidos." },
      creator: { t: "Developer", c: "ALEX HUB ULTRA was made by Alex (Alexgaming). Senior Architect of Bx Systems. Código optimizado para rendimiento extremo en iPad." },
      terms: { t: "Terms & Conditions", c: "1. El usuario acepta que este sistema es de uso personal. 2. No se permite la redistribución del TOKEN de acceso fuera del círculo Alex-Codes. 3. El sistema utiliza cookies de sesión volátiles que se destruyen cada 60 minutos. 4. BX no se hace responsable de las notas escolares si te pillan. 5. El botón de pánico debe ser usado con un tiempo de reacción inferior a 0.5 segundos ante la presencia de un tutor." },
      bx: { t: "Bx Network", c: "Estado: Operativo. Latencia: 14ms. Servidores: Vercel Cloud Nodes. Cifrado: AES-256 Sincronizado por hora." },
      news: { t: "Changelog 4.0", c: "Agregado soporte para Twitch sin bloqueos, enrutamiento dinámico de URL y sistema de modales de esquina." }
    };
    const active = contents[modal];
    return (
      <div style={styles.modalOverlay} onClick={() => setModal(null)}>
        <div style={styles.modalBody} onClick={e => e.stopPropagation()}>
          <h2 style={{color: '#E50914'}}>{active.t}</h2>
          <p style={{lineHeight: '1.6', color: '#ccc'}}>{active.c}</p>
          <button onClick={() => setModal(null)} style={styles.loginButton}>ENTENDIDO</button>
        </div>
      </div>
    );
  };

  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.stars}></div>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#ff0000'}}>ULTRA</span></h1>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN" value={password} onChange={e => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ACCESS SYSTEM</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {modal && <ModalContent />}
      
      {/* BOTONES DE ESQUINA */}
      <button style={{...styles.cornerBtn, top: 10, left: 10}} onClick={() => setModal('about')}>ABOUT BX</button>
      <button style={{...styles.cornerBtn, top: 10, right: 10}} onClick={() => setModal('creator')}>CREATOR</button>
      <button style={{...styles.cornerBtn, bottom: 40, left: 10}} onClick={() => setModal('terms')}>TERMS</button>
      <button style={{...styles.cornerBtn, bottom: 40, right: 10}} onClick={() => setModal('bx')}>SYSTEM</button>
      <button style={{...styles.cornerBtn, bottom: 70, right: 10}} onClick={() => setModal('news')}>NEWS</button>

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB ULTRA</span></div>
          <div style={styles.tabContainer}>
            {['youtube', 'twitch', 'movies', 'xbox'].map(t => (
              <button key={t} onClick={() => setMode(t)} style={mode === t ? styles.activeTab : styles.tab}>{t.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <form onSubmit={performSearch} style={styles.searchForm}>
          <input 
            style={styles.searchInput} 
            placeholder={`Search on ${mode.toUpperCase()}...`} 
            value={query} onChange={e => setQuery(e.target.value)} 
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
                <button onClick={() => setSelectedVideo(null)} style={styles.closeButton}>BACK TO GRID</button>
              </div>
            ) : videos.map((v, i) => (
              <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                <img src={v.snippet.thumbnails.high.url} style={styles.thumbnail} />
                <div style={styles.cardInfo}><p style={styles.videoTitle}>{v.snippet.title}</p></div>
              </div>
            ))}
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
            ) : <div style={styles.emptyState}>🎬 Search for a movie title...</div>}
          </div>
        )}

        {mode === 'twitch' && query && (
          <div style={styles.fullView}>
            <iframe 
              src={`https://player.twitch.tv/?channel=${query.toLowerCase()}&parent=${window.location.hostname}`} 
              style={styles.fullIframe} allowFullScreen 
            />
          </div>
        )}

        {mode === 'xbox' && (
          <div style={styles.fullView}>
            <iframe src="https://www.bing.com/search?q=xbox+cloud+gaming+fortnite&igu=1" style={styles.fullIframe} />
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <span>PATH: /{mode}</span>
        <span>ENCRYPTION: AES-256-HUB</span>
        <span>TOKEN: {generateCurrentToken()}</span>
      </footer>
    </div>
  );
}

const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  stars: { position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle at center, #111 0%, #000 100%)', zIndex: 0 },
  loginCard: { background: 'rgba(10,10,10,0.9)', padding: '60px', borderRadius: '40px', border: '2px solid #222', textAlign: 'center', zIndex: 1, boxShadow: '0 0 50px rgba(255,0,0,0.1)' },
  glitchText: { color: '#fff', fontSize: '32px', letterSpacing: '8px', marginBottom: '40px', fontWeight: '900' },
  loginInput: { background: '#000', border: '1px solid #E50914', color: '#fff', padding: '15px', borderRadius: '12px', width: '250px', fontSize: '20px', textAlign: 'center', outline: 'none', boxShadow: '0 0 15px rgba(229,9,20,0.2)' },
  loginButton: { display: 'block', width: '100%', marginTop: '25px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', position: 'relative' },
  navbar: { height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '2px solid #111', zIndex: 10 },
  navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
  logoBox: { display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '22px', fontWeight: '900', letterSpacing: '1px' },
  logoSub: { fontSize: '10px', color: '#107C10', fontWeight: 'bold', textAlign: 'right' },
  tabContainer: { display: 'flex', background: '#0a0a0a', borderRadius: '15px', padding: '5px', border: '1px solid #222' },
  tab: { background: 'none', border: 'none', color: '#555', padding: '10px 20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  activeTab: { background: '#E50914', color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '900', fontSize: '12px' },
  
  searchForm: { flex: 1, maxWidth: '600px', margin: '0 40px' },
  searchInput: { width: '100%', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '12px 25px', borderRadius: '30px', outline: 'none', transition: '0.3s' },
  panicButton: { background: 'linear-gradient(45deg, #f00, #900)', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  
  contentArea: { flex: 1, overflowY: 'auto', padding: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' },
  card: { background: '#0a0a0a', borderRadius: '20px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.4s' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '20px' },
  videoTitle: { fontSize: '14px', fontWeight: 'bold', color: '#eee' },
  
  cornerBtn: { position: 'fixed', background: 'rgba(20,20,20,0.8)', color: '#444', border: '1px solid #222', padding: '4px 8px', fontSize: '9px', borderRadius: '4px', cursor: 'pointer', zIndex: 100, transition: '0.3s' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', border: '1px solid #333', maxWidth: '500px', textAlign: 'center' },
  
  playerWrapper: { gridColumn: '1/-1', height: '80vh', position: 'relative', background: '#000', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  fullIframe: { width: '100%', height: '100%', border: 'none' },
  closeButton: { position: 'absolute', top: '20px', right: '20px', background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' },
  
  movieContainer: { height: '100%', display: 'flex', flexDirection: 'column' },
  serverBar: { display: 'flex', gap: '10px', marginBottom: '20px' },
  serverBtn: { background: '#0a0a0a', color: '#555', border: '1px solid #222', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer' },
  serverBtnActive: { background: '#fff', color: '#000', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: 'bold' },
  
  fullView: { height: '100%', borderRadius: '30px', overflow: 'hidden' },
  emptyState: { display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#222', fontSize: '24px', fontWeight: 'bold' },
  footer: { height: '35px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', fontSize: '11px', color: '#222', borderTop: '1px solid #111' }
};
