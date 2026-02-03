import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('youtube'); // youtube | twitch | safari
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("https://www.xbox.com/es-ES/games/store/fortnite/BT5P2X999VH2/0001/9R22LC29Q28T");

  const activatePanic = () => {
    window.location.href = "https://faria.managebac.com/login";
  };

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && activatePanic();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSelected(null);
    if (mode === 'youtube') {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
      } catch (err) { console.error(err); }
    } else if (mode === 'twitch') {
      setSelected(`https://player.twitch.tv/?channel=${query.replace(/\s/g, '').toLowerCase()}&parent=${window.location.hostname}`);
    }
    setLoading(false);
  };

  const mainColor = mode === 'youtube' ? '#FF0000' : mode === 'twitch' ? '#9146FF' : '#007AFF';

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* NAVBAR SUPERIOR */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 20px', height: '65px', background: 'rgba(20,20,20,0.8)', 
        backdropFilter: 'blur(15px)', borderBottom: `1px solid ${mainColor}66` 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <b style={{ fontSize: '18px', fontWeight: '900' }}>ALEX <span style={{color: mainColor}}>HUB</span></b>
          <div style={{ display: 'flex', background: '#1c1c1e', borderRadius: '10px', padding: '2px' }}>
            <button onClick={() => setMode('youtube')} style={{ background: mode === 'youtube' ? '#3a3a3c' : 'transparent', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>YouTube</button>
            <button onClick={() => setMode('twitch')} style={{ background: mode === 'twitch' ? '#3a3a3c' : 'transparent', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Twitch</button>
            <button onClick={() => setMode('safari')} style={{ background: mode === 'safari' ? '#007AFF' : 'transparent', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Safari</button>
          </div>
        </div>

        {mode !== 'safari' && (
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '400px', margin: '0 20px' }}>
            <input 
              style={{ width: '100%', background: '#1c1c1e', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '12px', outline: 'none' }}
              placeholder="Buscar contenido..." value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        )}

        <button onClick={activatePanic} style={{ background: '#ff3b30', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>PÁNICO</button>
      </nav>

      <main style={{ padding: mode === 'safari' ? '0' : '20px', height: 'calc(100vh - 65px)' }}>
        
        {/* MODULO SAFARI BROWSER */}
        {mode === 'safari' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f2f2f7' }}>
            {/* BARRA DE DIRECCIONES SAFARI */}
            <div style={{ 
              background: '#f2f2f7', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '15px',
              borderBottom: '1px solid #d1d1d6'
            }}>
              <div style={{ display: 'flex', gap: '20px', color: '#007AFF', fontSize: '20px' }}>
                <span style={{cursor: 'pointer'}}>‹</span>
                <span style={{cursor: 'pointer'}}>›</span>
              </div>
              <div style={{ 
                flex: 1, background: '#e3e3e8', borderRadius: '10px', padding: '8px 15px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}>
                <span style={{color: '#8e8e93', fontSize: '12px'}}>🔒</span>
                <span style={{color: '#000', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>xbox.com — Fortnite</span>
                <span style={{color: '#8e8e93', fontSize: '12px'}}>↻</span>
              </div>
              <div style={{ color: '#007AFF', fontSize: '18px' }}>⎙</div>
            </div>

            {/* CONTENEDOR DEL IFRAME */}
            <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
              <iframe 
                src={`https://www.bing.com/search?q=site:xbox.com+fortnite+BT5P2X999VH2&cc=es`} 
                title="Safari Frame"
                style={{ width: '100%', height: '100%', border: 'none' }}
                // SANDBOX PARA BLOQUEAR PESTAÑAS NUEVAS
                sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock"
              />
              
              {/* Overlay de protección Anti-Lazarus */}
              <div style={{ 
                position: 'absolute', bottom: '15px', left: '15px', 
                background: 'rgba(255,255,255,0.9)', padding: '5px 12px', 
                borderRadius: '20px', color: '#000', fontSize: '11px', fontWeight: 'bold',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '1px solid #d1d1d6'
              }}>
                <span style={{color: '#34c759'}}>●</span> Safari Engine: Secure Mode Active
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO YOUTUBE / TWITCH */}
        {mode !== 'safari' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {selected ? (
               <div style={{ gridColumn: '1/-1', animation: 'fadeIn 0.3s' }}>
                 <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                   <iframe src={selected} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                 </div>
                 <button onClick={() => setSelected(null)} style={{ marginTop: '15px', background: '#1c1c1e', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>← Volver</button>
               </div>
            ) : (
              videos.map(v => (
                <div key={v.id.videoId} onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }} />
                  <p style={{ fontSize: '14px', marginTop: '10px', fontWeight: '600', color: '#efeff4' }}>{v.snippet.title}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        body { margin: 0; background: #000; overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #333; borderRadius: 10px; }
      `}</style>
    </div>
  );
}
