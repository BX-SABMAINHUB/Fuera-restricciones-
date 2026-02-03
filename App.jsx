import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [movieUrl, setMovieUrl] = useState('');

  // LÓGICA DE CONTRASEÑA (Sincronizada con tu GitHub/Google Script)
  const getCorrectPass = () => {
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

  const checkPass = (e) => {
    e.preventDefault();
    if (password === getCorrectPass()) setAuthorized(true);
    else { alert("Clave Incorrecta"); setPassword(''); }
  };

  const activatePanic = () => { window.location.href = "https://faria.managebac.com/login"; };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (mode === 'youtube') {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
      setSelected(null);
    } else if (mode === 'movies') {
      // Cargamos la película usando el nombre directamente en un servidor con bypass
      setMovieUrl(`https://vidsrc.to/v2/embed/movie/${encodeURIComponent(query)}`);
    } else if (mode === 'twitch') {
      setSelected(`https://player.twitch.tv/?channel=${query.toLowerCase()}&parent=${window.location.hostname}`);
    }
  };

  if (!authorized) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <form onSubmit={checkPass} style={{ textAlign: 'center', border: '1px solid #333', padding: '40px', borderRadius: '20px', background: '#0a0a0a' }}>
          <h2 style={{ color: '#0dff00' }}>SECURITY CHECK</h2>
          <input 
            type="text" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '15px', background: '#000', color: '#0dff00', border: '1px solid #0dff00', textAlign: 'center', fontSize: '20px', outline: 'none' }}
            placeholder="Introduce Clave"
          />
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* NAVBAR COMPLETA */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '65px', background: '#000', borderBottom: '2px solid #E50914' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setMode('youtube')} style={{ background: mode === 'youtube' ? '#E50914' : '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>YouTube</button>
          <button onClick={() => setMode('movies')} style={{ background: mode === 'movies' ? '#E50914' : '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Películas</button>
          <button onClick={() => setMode('twitch')} style={{ background: mode === 'twitch' ? '#6441a5' : '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Twitch</button>
        </div>

        {/* BARRA DE BÚSQUEDA RESTAURADA */}
        <form onSubmit={handleSearch} style={{ flex: 1, margin: '0 20px', maxWidth: '400px' }}>
          <input 
            style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 15px', borderRadius: '20px', outline: 'none' }} 
            placeholder={mode === 'movies' ? "Nombre de película..." : "Buscar..."} 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </form>

        <button onClick={activatePanic} style={{ background: '#E00', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>PÁNICO</button>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ height: 'calc(100vh - 65px)', overflowY: 'auto' }}>
        {mode === 'movies' ? (
          <div style={{ width: '100%', height: '100%', background: '#000' }}>
            <iframe 
              src={movieUrl} 
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock"
            />
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            {selected ? (
              <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <iframe src={selected} style={{ width: '100%', aspectRatio: '16/9', borderRadius: '15px', border: 'none' }} allowFullScreen />
                <button onClick={() => setSelected(null)} style={{ marginTop: '15px', background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px' }}>Volver</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {mode === 'youtube' && videos.map(v => (
                  <div key={v.id.videoId} onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>{v.snippet.title}</p>
                  </div>
                ))}
                {mode === 'twitch' && query && (
                   <p>Presiona ENTER para cargar el canal: {query}</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
