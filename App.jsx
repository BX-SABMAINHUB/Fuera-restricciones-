import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);

  // --- LÓGICA DE VALIDACIÓN IGUAL A GITHUB ---
  const getCorrectPass = () => {
    const now = new Date();
    const seed = now.getFullYear().toString() + now.getMonth().toString() + now.getDate().toString() + now.getHours().toString();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let result = '';
    let seedNum = 0;
    for (let i = 0; i < seed.length; i++) {
      seedNum = ((seedNum << 5) - seedNum) + seed.charCodeAt(i);
      seedNum |= 0;
    }
    for (let i = 0; i < 6; i++) {
      seedNum = (seedNum * 16807) % 2147483647;
      result += chars.charAt(seedNum % chars.length);
    }
    return result;
  };

  const checkPass = (e) => {
    e.preventDefault();
    if (password === getCorrectPass()) {
      setAuthorized(true);
    } else {
      alert("Clave incorrecta. Mírala en tu web de GitHub.");
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
    } else if (mode === 'twitch') {
      setSelected(`https://player.twitch.tv/?channel=${query.toLowerCase()}&parent=${window.location.hostname}`);
    }
  };

  if (!authorized) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <form onSubmit={checkPass} style={{ textAlign: 'center', border: '1px solid #333', padding: '50px', borderRadius: '20px' }}>
          <h2 style={{ color: '#0dff00' }}>SISTEMA BLOQUEADO</h2>
          <input 
            type="text" 
            placeholder="Introduce 6 dígitos"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #0dff00', background: '#000', color: '#0dff00', fontSize: '20px', textAlign: 'center', outline: 'none' }}
          />
          <button type="submit" style={{ display: 'block', margin: '20px auto', padding: '10px 40px', background: '#0dff00', fontWeight: 'bold', cursor: 'pointer' }}>ACCEDER</button>
          <p style={{color: '#444', fontSize: '10px'}}>La clave cambia cada hora</p>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '65px', background: '#0a0a0a', borderBottom: '2px solid #107C10' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setMode('youtube')} style={{ background: mode === 'youtube' ? '#333' : 'none', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px' }}>YouTube</button>
          <button onClick={() => setMode('twitch')} style={{ background: mode === 'twitch' ? '#9146FF' : 'none', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px' }}>Twitch</button>
          <button onClick={() => setMode('xbox')} style={{ background: mode === 'xbox' ? '#107C10' : 'none', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold' }}>Xbox Store</button>
        </div>
        {mode !== 'xbox' && (
          <form onSubmit={handleSearch}><input style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '8px', borderRadius: '5px' }} placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} /></form>
        )}
        <button onClick={activatePanic} style={{ background: '#E00', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold' }}>PÁNICO</button>
      </nav>

      <main style={{ height: 'calc(100vh - 65px)' }}>
        {mode === 'xbox' ? (
          <iframe 
            src="https://www.bing.com/search?q=site:xbox.com+fortnite+BT5P2X999VH2" 
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-modals"
          />
        ) : (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {selected ? (
              <div style={{ gridColumn: '1/-1' }}>
                <iframe src={selected} style={{ width: '100%', aspectRatio: '16/9', border: 'none' }} allowFullScreen />
                <button onClick={() => setSelected(null)} style={{ background: '#333', color: '#fff', padding: '10px', marginTop: '10px', border: 'none' }}>Cerrar</button>
              </div>
            ) : (
              videos.map(v => (
                <div key={v.id.videoId} onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)}>
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '10px' }} />
                  <p style={{ fontSize: '13px' }}>{v.snippet.title}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
