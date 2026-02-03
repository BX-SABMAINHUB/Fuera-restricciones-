import React, { useState, useEffect } from 'react';

// CONFIGURACIÓN MAESTRA
const YOUTUBE_API_KEY = "AIzaSyDHJQh5IKV5a_F4Y5xmj4yswLDns5cmpWA";
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

  // --- ARREGLO DEL BUSCADOR DE YOUTUBE ---
  const performSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    if (mode === 'youtube') {
      try {
        // Añadimos parámetros de seguridad y limpiamos la query
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
          console.error("Error de YouTube:", data.error.message);
          alert("Error de YouTube: " + data.error.message);
        } else {
          // Solo guardamos videos que tengan ID válido
          const filteredVideos = data.items.filter(item => item.id && item.id.videoId);
          setVideos(filteredVideos);
          setSelectedVideo(null);
        }
      } catch (err) {
        alert("Error de conexión con YouTube");
      }
    }
    setLoading(false);
  };

  // --- SISTEMA DE PELÍCULAS ---
  const movieServers = [
    { name: "Server Alpha", url: (q) => `https://vidsrc.to/v2/embed/movie/${encodeURIComponent(q)}` },
    { name: "Server Beta", url: (q) => `https://vidsrc.me/embed/movie?tmdb=${encodeURIComponent(q)}` },
    { name: "Server Gamma", url: (q) => `https://embed.su/embed/movie/${encodeURIComponent(q)}` },
    { name: "Buscador Directo", url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}+pelicula+completa+online&igu=1` }
  ];

  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="TOKEN DE 6 DÍGITOS" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.loginInput} />
            <button type="submit" style={styles.loginButton}>ENTRAR AL NÚCLEO</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}><span style={styles.logoMain}>ALEX</span><span style={styles.logoSub}>HUB ULTRA</span></div>
          <div style={styles.tabContainer}>
            <button onClick={() => setMode('youtube')} style={mode === 'youtube' ? styles.activeTab : styles.tab}>YouTube</button>
            <button onClick={() => setMode('twitch')} style={mode === 'twitch' ? styles.activeTab : styles.tab}>Twitch</button>
            <button onClick={() => setMode('movies')} style={mode === 'movies' ? styles.activeTab : styles.tab}>Películas</button>
            <button onClick={() => setMode('xbox')} style={mode === 'xbox' ? styles.activeTab : styles.tab}>Xbox</button>
          </div>
        </div>
        <form onSubmit={performSearch} style={styles.searchForm}>
          <input 
            style={styles.searchInput} 
            placeholder={mode === 'movies' ? "Escribe el nombre de la peli..." : "Buscar contenido..."} 
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
          <div style={styles.movieContainer}>
            <div style={styles.serverBar}>
              {movieServers.map((s, i) => (
                <button key={i} onClick={() => setMovieSource(i)} style={movieSource === i ? styles.serverBtnActive : styles.serverBtn}>{s.name}</button>
              ))}
            </div>
            {query ? (
              <iframe src={movieServers[movieSource].url(query)} style={styles.fullIframe} allowFullScreen sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock" />
            ) : (
              <div style={styles.emptyState}>🎬 Escribe el nombre de la película arriba y pulsa Enter.</div>
            )}
          </div>
        )}

        {mode === 'twitch' && query && (
          <div style={styles.fullView}>
            <iframe src={`https://player.twitch.tv/?channel=${query.toLowerCase()}&parent=${window.location.hostname}`} style={styles.fullIframe} allowFullScreen />
          </div>
        )}

        {mode === 'xbox' && (
          <div style={styles.fullView}>
            <iframe src="https://www.bing.com/search?q=site:xbox.com+fortnite+play+now&igu=1" style={styles.fullIframe} sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-modals" />
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <span>MODO: {mode.toUpperCase()}</span>
        <span>TOKEN ACTIVO: {generateCurrentToken()}</span>
      </footer>
    </div>
  );
}

const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '50px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center' },
  glitchText: { color: '#fff', fontSize: '24px', letterSpacing: '5px', marginBottom: '30px' },
  loginInput: { background: '#000', border: '1px solid #E50914', color: '#fff', padding: '15px', borderRadius: '10px', width: '250px', fontSize: '20px', textAlign: 'center', outline: 'none' },
  loginButton: { display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff' },
  navbar: { height: '70px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #1a1a1a' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
  logoBox: { display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '18px', fontWeight: 'bold' },
  logoSub: { fontSize: '9px', color: '#107C10' },
  tabContainer: { display: 'flex', background: '#111', borderRadius: '10px', padding: '3px' },
  tab: { background: 'none', border: 'none', color: '#666', padding: '8px 15px', cursor: 'pointer' },
  activeTab: { background: '#222', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold' },
  searchForm: { flex: 1, maxWidth: '400px', margin: '0 20px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '10px 20px', borderRadius: '20px', outline: 'none' },
  panicButton: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  contentArea: { flex: 1, overflowY: 'auto', padding: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#0a0a0a', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '12px' },
  videoTitle: { fontSize: '13px', fontWeight: 'bold' },
  playerWrapper: { gridColumn: '1/-1', height: '75vh', position: 'relative' },
  fullIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '15px' },
  closeButton: { position: 'absolute', top: '-40px', right: 0, background: '#E50914', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px' },
  movieContainer: { height: '100%', display: 'flex', flexDirection: 'column' },
  serverBar: { display: 'flex', gap: '8px', marginBottom: '15px' },
  serverBtn: { background: '#111', color: '#555', border: '1px solid #222', padding: '6px 12px', borderRadius: '5px', fontSize: '12px' },
  serverBtnActive: { background: '#E50914', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '5px' },
  fullView: { height: '100%' },
  emptyState: { display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#333' },
  footer: { height: '30px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: '10px', color: '#333' }
};
