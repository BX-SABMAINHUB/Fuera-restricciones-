import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);

  // --- ALGORITMO SINCRONIZADO CON GITHUB ---
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
    const correct = getCorrectPass();
    if (password === correct) {
      setAuthorized(true);
    } else {
      alert(`Error. La clave de tu GitHub no coincide. Asegúrate de respetar mayúsculas y símbolos.`);
      setPassword('');
    }
  };

  const activatePanic = () => { window.location.href = "https://faria.managebac.com/login"; };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (mode === 'youtube') {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    }
  };

  if (!authorized) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <form onSubmit={checkPass} style={{ textAlign: 'center', border: '2px solid #333', padding: '40px', borderRadius: '20px', background: '#0a0a0a' }}>
          <h2 style={{ color: '#0dff00' }}>SISTEMA DE SEGURIDAD</h2>
          <p style={{ color: '#555' }}>Copia el código de tu GitHub</p>
          <input 
            type="text" 
            placeholder="6 dígitos"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #0dff00', background: '#000', color: '#fff', fontSize: '24px', textAlign: 'center', width: '200px', outline: 'none' }}
          />
          <button type="submit" style={{ display: 'block', margin: '20px auto', padding: '12px 40px', background: '#0dff00', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>ENTRAR</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '65px', background: '#000', borderBottom: '2px solid #E50914' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => {setMode('youtube'); setSelected(null);}} style={{ background: mode === 'youtube' ? '#E50914' : '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>YouTube</button>
          <button onClick={() => {setMode('movies'); setSelected(null);}} style={{ background: mode === 'movies' ? '#E50914' : '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>PELÍCULAS</button>
          <button onClick={() => {setMode('twitch'); setSelected(null);}} style={{ background: mode === 'twitch' ? '#6441a5' : '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Twitch</button>
        </div>
        
        {mode === 'youtube' && (
          <form onSubmit={handleSearch}><input style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 15px', borderRadius: '20px' }} placeholder="Buscar video..." value={query} onChange={(e) => setQuery(e.target.value)} /></form>
        )}

        <button onClick={activatePanic} style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>SALIR</button>
      </nav>

      <main style={{ height: 'calc(100vh - 65px)', overflowY: 'auto' }}>
        {mode === 'movies' ? (
          <div style={{ width: '100%', height: '100%', background: '#000' }}>
            {/* Sistema de Películas Gratis (CUEVANA / PELISPLUS EMBED) */}
            <iframe 
              src="https://www.lookmovie2.to/" 
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            {selected ? (
              <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <iframe src={selected} style={{ width: '100%', aspectRatio: '16/9', borderRadius: '15px', border: 'none' }} allowFullScreen />
                <button onClick={() => setSelected(null)} style={{ marginTop: '15px', background: '#E50914', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '8px' }}>Cerrar</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {mode === 'youtube' && videos.map(v => (
                  <div key={v.id.videoId} onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
                    <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '10px' }}>{v.snippet.title}</p>
                  </div>
                ))}
                {mode === 'twitch' && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', marginTop: '50px' }}>
                    <input placeholder="Nombre del canal..." onChange={(e) => setQuery(e.target.value)} style={{ padding: '10px', width: '250px' }} />
                    <button onClick={() => setSelected(`https://player.twitch.tv/?channel=${query}&parent=${window.location.hostname}`)} style={{ padding: '10px', background: '#6441a5', color: '#fff', border: 'none', marginLeft: '10px' }}>Ver Directo</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
