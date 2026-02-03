import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube');
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
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (err) { console.error("Error"); }
  };

  // --- PANTALLA DE BLOQUEO ---
  if (!authorized) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <form onSubmit={checkPass} style={{ textAlign: 'center', background: '#111', padding: '40px', borderRadius: '20px', border: '1px solid #333' }}>
          <h2 style={{ color: '#fff', marginBottom: '20px' }}>SISTEMA RESTRINGIDO</h2>
          <input 
            type="password" 
            placeholder="Introduce Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', width: '200px', textAlign: 'center', fontSize: '16px' }}
          />
          <button type="submit" style={{ display: 'block', margin: '20px auto 0', padding: '10px 30px', background: '#E00', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ENTRAR</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui' }}>
      
      {/* NAVBAR */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 20px', height: '65px', background: '#0a0a0a', borderBottom: '2px solid #107C10' 
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <b style={{ fontSize: '18px' }}>ALEX <span style={{color: '#107C10'}}>HUB</span></b>
          <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: '10px', padding: '3px' }}>
            <button onClick={() => setMode('youtube')} style={{ background: mode === 'youtube' ? '#333' : 'transparent', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>YouTube</button>
            <button onClick={() => setMode('twitch')} style={{ background: mode === 'twitch' ? '#333' : 'transparent', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Twitch</button>
            <button onClick={() => setMode('bing')} style={{ background: mode === 'bing' ? '#107C10' : 'transparent', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Xbox Engine</button>
          </div>
        </div>

        {mode !== 'bing' && (
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '350px' }}>
            <input 
              style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 15px', borderRadius: '10px', outline: 'none' }}
              placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        )}

        <button onClick={activatePanic} style={{ background: '#E00', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>PÁNICO</button>
      </nav>

      <main style={{ height: 'calc(100vh - 65px)' }}>
        {mode === 'bing' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            {/* BARRA DE DIRECCIONES OPERATIVA */}
            <div style={{ background: '#f1f1f1', padding: '8px', display: 'flex', gap: '10px', borderBottom: '1px solid #ccc' }}>
              <div style={{ background: '#fff', flex: 1, padding: '5px 15px', borderRadius: '5px', color: '#666', fontSize: '13px', border: '1px solid #ddd' }}>
                🔍 Buscando: Store Fortnite Xbox...
              </div>
            </div>
            
            <iframe 
              // Usamos un motor de búsqueda que SI permite navegación interna en iframes
              src="https://www.bing.com/search?q=site%3Axbox.com+fortnite+BT5P2X999VH2&form=QBLH" 
              style={{ width: '100%', height: '100%', border: 'none' }}
              // CONFIGURACIÓN MAESTRA: Permite todo excepto abrir pestañas nuevas
              sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-modals"
              allow="autoplay; fullscreen; gamepad"
            />
          </div>
        ) : (
          /* GRID DE YOUTUBE / TWITCH */
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', overflowY: 'auto', height: '100%' }}>
            {selected ? (
              <div style={{ gridColumn: '1/-1' }}>
                <iframe src={selected} style={{ width: '100%', aspectRatio: '16/9', borderRadius: '15px', border: 'none' }} allowFullScreen />
                <button onClick={() => setSelected(null)} style={{ background: '#333', color: '#fff', border: 'none', padding: '10px 20px', marginTop: '10px', borderRadius: '10px' }}>Volver</button>
              </div>
            ) : (
              videos.map(v => (
                <div key={v.id.videoId} onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)} style={{ cursor: 'pointer' }}>
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '10px' }}>{v.snippet.title}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <style>{`
        body { margin: 0; overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #107C10; }
      `}</style>
    </div>
  );
}
