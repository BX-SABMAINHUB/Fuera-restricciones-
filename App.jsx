import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube'); // youtube | twitch | xbox
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);

  // --- SISTEMA DE CONTRASEÑA ---
  const checkPass = (e) => {
    e.preventDefault();
    if (password.toUpperCase() === 'YT') {
      setAuthorized(true);
    } else {
      alert("Contraseña Incorrecta");
      setPassword('');
    }
  };

  const activatePanic = () => {
    window.location.href = "https://faria.managebac.com/login";
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (mode === 'youtube') {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
      } catch (err) { console.error("Error API"); }
    } else if (mode === 'twitch') {
      setSelected(`https://player.twitch.tv/?channel=${query.replace(/\s/g, '').toLowerCase()}&parent=${window.location.hostname}`);
    }
  };

  if (!authorized) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <form onSubmit={checkPass} style={{ textAlign: 'center', background: '#111', padding: '40px', borderRadius: '20px', border: '1px solid #333' }}>
          <h2 style={{ color: '#fff', marginBottom: '20px' }}>ACCESO RESTRINGIDO</h2>
          <input 
            type="password" 
            placeholder="Introduce Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', width: '200px', textAlign: 'center', fontSize: '16px' }}
          />
          <button type="submit" style={{ display: 'block', margin: '20px auto 0', padding: '10px 30px', background: '#107C10', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ENTRAR</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui', overflow: 'hidden' }}>
      
      {/* NAVBAR */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 20px', height: '65px', background: '#0a0a0a', borderBottom: '2px solid #107C10' 
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <b style={{ fontSize: '18px' }}>ALEX <span style={{color: '#107C10'}}>HUB</span></b>
          <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: '10px', padding: '3px', gap: '5px' }}>
            <button onClick={() => {setMode('youtube'); setSelected(null);}} style={{ background: mode === 'youtube' ? '#333' : 'transparent', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>YouTube</button>
            <button onClick={() => {setMode('twitch'); setSelected(null);}} style={{ background: mode === 'twitch' ? '#9146FF' : 'transparent', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Twitch</button>
            <button onClick={() => {setMode('xbox'); setSelected(null);}} style={{ background: mode === 'xbox' ? '#107C10' : 'transparent', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Xbox</button>
          </div>
        </div>

        {mode !== 'xbox' && (
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '350px', margin: '0 20px' }}>
            <input 
              style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 15px', borderRadius: '10px', outline: 'none' }}
              placeholder={mode === 'youtube' ? "Buscar video..." : "Nombre del canal..."} 
              value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        )}

        <button onClick={activatePanic} style={{ background: '#E00', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>PÁNICO</button>
      </nav>

      <main style={{ height: 'calc(100vh - 65px)', overflowY: mode === 'xbox' ? 'hidden' : 'auto' }}>
        
        {/* MODO XBOX REAL (Anti-Pestañas) */}
        {mode === 'xbox' && (
          <div style={{ width: '100%', height: '100%', background: '#fff' }}>
            <iframe 
              src="https://www.xbox.com/es-ES/games/store/fortnite/BT5P2X999VH2/0001/9R22LC29Q28T" 
              style={{ width: '100%', height: '100%', border: 'none' }}
              // sandbox: permite que la web funcione (scripts) pero bloquea abrir pestañas nuevas (popups)
              sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-modals"
              allow="autoplay; fullscreen; gamepad"
            />
          </div>
        )}

        {/* MODOS YOUTUBE / TWITCH */}
        {mode !== 'xbox' && (
          <div style={{ padding: '20px' }}>
            {selected ? (
              <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '15px', overflow: 'hidden', background: '#000' }}>
                  <iframe src={selected} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                </div>
                <button onClick={() => setSelected(null)} style={{ marginTop: '15px', background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}>Volver</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {mode === 'youtube' && videos.map(v => (
                  <div key={v.id.videoId} onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
                    <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '10px' }}>{v.snippet.title}</p>
                  </div>
                ))}
                {mode === 'twitch' && !selected && (
                   <div style={{ gridColumn: '1/-1', textAlign: 'center', marginTop: '50px', color: '#9146FF' }}>
                     <h2>Twitch Mode</h2>
                     <p>Escribe el nombre de un streamer arriba para cargar su directo.</p>
                   </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        body { margin: 0; overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #107C10; borderRadius: 10px; }
      `}</style>
    </div>
  );
}
