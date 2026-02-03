import React, { useState, useEffect, useRef } from 'react';

// CONFIGURACIÓN MAESTRA
const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";
const PANIC_URL = "https://faria.managebac.com/login";

/**
 * ALEX HUB ULTRA - VERSIÓN DEFENSIVA V4.0
 * Bloqueo de Lazarus / Sincronización de Clave / Multi-Streaming
 */

export default function AlexHubUltra() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube'); // youtube, twitch, movies, xbox, settings
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [movieSource, setMovieSource] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // --- LÓGICA DE SEGURIDAD (SINCRONIZADA CON GITHUB) ---
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
      saveLog("Acceso concedido");
    } else {
      alert("TOKEN INVÁLIDO. Revisa bx-sabmainhub.github.io/alex-codes/");
      setPassword('');
    }
  };

  // --- SISTEMA DE PELÍCULAS (ANTI-404) ---
  const movieServers = [
    { name: "Server Alpha (VidSrc)", url: (q) => `https://vidsrc.to/v2/embed/movie/${encodeURIComponent(q)}` },
    { name: "Server Beta (Vidsrc.me)", url: (q) => `https://vidsrc.me/embed/movie?tmdb=${encodeURIComponent(q)}` },
    { name: "Server Gamma (Embed.su)", url: (q) => `https://embed.su/embed/movie/${encodeURIComponent(q)}` },
    { name: "Explorador Libre", url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}+watch+online+free&igu=1` }
  ];

  // --- BUSCADORES ---
  const performSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    saveLog(`Búsqueda en ${mode}: ${query}`);

    if (mode === 'youtube') {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
      } catch (err) { alert("Error en API de YouTube"); }
    } 
    setLoading(false);
  };

  const saveLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setHistory(prev => [`[${time}] ${msg}`, ...prev].slice(0, 5));
  };

  // --- COMPONENTES DE INTERFAZ ---
  if (!authorized) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h1 style={styles.glitchText}>ALEX HUB <span style={{color: '#E50914'}}>ULTRA</span></h1>
          <p style={{color: '#666', marginBottom: '20px'}}>Sistema de Encriptación de Sesión Activo</p>
          <form onSubmit={handleLogin}>
            <input 
              type="text" 
              placeholder="ENTER 6-DIGIT TOKEN" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.loginInput}
            />
            <button type="submit" style={styles.loginButton}>DESBLOQUEAR NÚCLEO</button>
          </form>
          <div style={{marginTop: '20px', fontSize: '10px', color: '#333'}}>
            Sincronizado con: bx-sabmainhub.github.io
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* HEADER DINÁMICO */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}>
            <span style={styles.logoMain}>ALEX</span>
            <span style={styles.logoSub}>HUB ULTRA</span>
          </div>
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
            placeholder={mode === 'movies' ? "Nombre de película..." : "Buscar contenido..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <button onClick={() => window.location.href = PANIC_URL} style={styles.panicButton}>PÁNICO</button>
      </nav>

      {/* ÁREA DE CONTENIDO */}
      <main style={styles.contentArea}>
        {mode === 'youtube' && (
          <div style={styles.grid}>
            {selectedVideo ? (
              <div style={styles.playerWrapper}>
                <iframe 
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`} 
                  style={styles.fullIframe} 
                  allowFullScreen 
                />
                <button onClick={() => setSelectedVideo(null)} style={styles.closeButton}>VOLVER AL GRID</button>
              </div>
            ) : (
              videos.map((v, i) => (
                <div key={i} style={styles.card} onClick={() => setSelectedVideo(v.id.videoId)}>
                  <img src={v.snippet.thumbnails.high.url} style={styles.thumbnail} alt="thumb" />
                  <div style={styles.cardInfo}>
                    <p style={styles.videoTitle}>{v.snippet.title}</p>
                    <p style={styles.channelName}>{v.snippet.channelTitle}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {mode === 'movies' && (
          <div style={styles.movieContainer}>
            <div style={styles.serverBar}>
              {movieServers.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => setMovieSource(i)} 
                  style={movieSource === i ? styles.serverBtnActive : styles.serverBtn}
                >
                  {s.name}
                </button>
              ))}
            </div>
            {query ? (
              <iframe 
                src={movieServers[movieSource].url(query)} 
                style={styles.fullIframe} 
                allowFullScreen 
                sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock"
              />
            ) : (
              <div style={styles.emptyState}>
                <h2>🎬 Buscador de Cine Pro</h2>
                <p>Escribe el nombre de una película en la barra superior para empezar.</p>
                <div style={styles.movieHint}>Tip: Si un servidor da 404, cambia al siguiente en la barra superior.</div>
              </div>
            )}
          </div>
        )}

        {mode === 'twitch' && (
          <div style={styles.twitchContainer}>
             {query ? (
               <iframe 
                src={`https://player.twitch.tv/?channel=${query.toLowerCase()}&parent=${window.location.hostname}`}
                style={styles.fullIframe}
                allowFullScreen
               />
             ) : (
               <div style={styles.emptyState}>Escribe el nombre de un Streamer para conectar.</div>
             )}
          </div>
        )}

        {mode === 'xbox' && (
          <div style={styles.xboxContainer}>
            <div style={styles.xboxHeader}>
              <span style={styles.xboxBadge}>Anti-Lazarus Tunnel Active</span>
              <p>Microsoft Cloud Gaming (Sandboxed)</p>
            </div>
            <iframe 
              src="https://www.bing.com/search?q=site:xbox.com+fortnite+play+now&igu=1" 
              style={styles.fullIframe}
              sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-modals"
            />
          </div>
        )}
      </main>

      {/* BARRA DE ESTADO INFERIOR */}
      <footer style={styles.footer}>
        <div style={styles.logTerminal}>
          {history.map((log, i) => <div key={i}>{log}</div>)}
        </div>
        <div style={styles.statusInfo}>
          🟢 Conectado a Mainframe | Clave Activa: {generateCurrentToken()}
        </div>
      </footer>
    </div>
  );
}

// --- SISTEMA DE ESTILOS (PRO) ---
const styles = {
  loginPage: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  loginCard: { background: '#0a0a0a', padding: '50px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', width: '400px' },
  glitchText: { color: '#fff', fontSize: '28px', letterSpacing: '5px', marginBottom: '10px' },
  loginInput: { background: '#000', border: '1px solid #E50914', color: '#fff', padding: '15px', borderRadius: '10px', width: '100%', fontSize: '20px', textAlign: 'center', marginBottom: '20px', outline: 'none' },
  loginButton: { width: '100%', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  
  appContainer: { background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'sans-serif' },
  navbar: { height: '70px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid #1a1a1a' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '40px' },
  logoBox: { display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px' },
  logoSub: { fontSize: '10px', color: '#107C10', fontWeight: 'bold' },
  
  tabContainer: { display: 'flex', background: '#111', borderRadius: '12px', padding: '4px' },
  tab: { background: 'none', border: 'none', color: '#888', padding: '8px 20px', cursor: 'pointer', borderRadius: '8px', transition: '0.3s' },
  activeTab: { background: '#222', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold' },
  
  searchForm: { flex: 1, maxWidth: '500px', margin: '0 40px' },
  searchInput: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '10px 20px', borderRadius: '25px', outline: 'none' },
  
  panicButton: { background: 'linear-gradient(45deg, #ff0000, #b30000)', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(255,0,0,0.3)' },
  
  contentArea: { flex: 1, overflowY: 'auto', padding: '20px', position: 'relative' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: '#0a0a0a', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #1a1a1a', transition: '0.3s' },
  thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' },
  cardInfo: { padding: '15px' },
  videoTitle: { fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' },
  channelName: { fontSize: '12px', color: '#666' },
  
  playerWrapper: { gridColumn: '1/-1', position: 'relative', width: '100%', height: '80vh' },
  fullIframe: { width: '100%', height: '100%', border: 'none', borderRadius: '20px' },
  closeButton: { position: 'absolute', bottom: '-50px', left: '0', background: '#222', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '10px', cursor: 'pointer' },
  
  movieContainer: { height: '100%', display: 'flex', flexDirection: 'column' },
  serverBar: { display: 'flex', gap: '10px', marginBottom: '20px' },
  serverBtn: { background: '#111', color: '#888', border: '1px solid #333', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  serverBtnActive: { background: '#E50914', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold' },
  
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444' },
  movieHint: { marginTop: '20px', fontStyle: 'italic', fontSize: '13px' },
  
  xboxContainer: { height: '100%', display: 'flex', flexDirection: 'column' },
  xboxHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px', background: '#107C10', borderRadius: '10px' },
  xboxBadge: { background: '#000', padding: '4px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' },
  
  footer: { height: '40px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: '11px' },
  logTerminal: { color: '#0dff00', fontFamily: 'monospace' },
  statusInfo: { color: '#444' }
};
