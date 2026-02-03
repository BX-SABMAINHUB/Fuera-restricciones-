import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [mode, setMode] = useState('youtube');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // BOTÓN DE PÁNICO INSTANTÁNEO
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
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=18&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (err) { console.error("API Error"); }
    setLoading(false);
  };

  const mainColor = mode === 'youtube' ? '#FF0000' : mode === 'twitch' ? '#9146FF' : '#00A4EF';

  return (
    <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, system-ui, -apple-system' }}>
      
      {/* NAVBAR DE ALTO NIVEL */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 25px', height: '70px', background: 'rgba(10,10,10,0.95)', 
        backdropFilter: 'blur(20px)', borderBottom: `2px solid ${mainColor}`, position: 'sticky', top: 0, zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '-1px' }}>ALEX<span style={{color: mainColor}}>HUB</span></div>
          <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: '12px', padding: '4px', gap: '4px' }}>
            {['youtube', 'twitch', 'bing'].map(m => (
              <button 
                key={m} 
                onClick={() => {setMode(m); setSelected(null);}}
                style={{ 
                  background: mode === m ? (m === 'bing' ? '#00A4EF' : '#333') : 'transparent', 
                  border: 'none', color: '#fff', padding: '7px 15px', borderRadius: '8px', 
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase'
                }}
              >
                {m === 'bing' ? 'Xbox Browser' : m}
              </button>
            ))}
          </div>
        </div>

        {mode !== 'bing' && (
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '450px', margin: '0 20px' }}>
            <input 
              style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '12px 20px', borderRadius: '15px', outline: 'none' }}
              placeholder={mode === 'youtube' ? "Buscar en YouTube..." : "Canal de Twitch..."}
              value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        )}

        <button onClick={activatePanic} style={{ background: '#FF3B30', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>PÁNICO (ESC)</button>
      </nav>

      <main style={{ height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
        
        {/* MODO BING / XBOX BROWSER PRO */}
        {mode === 'bing' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#f3f3f3', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '15px', color: '#666' }}>
              <div style={{ display: 'flex', gap: '15px', fontSize: '18px' }}><span>←</span><span>→</span><span onClick={() => window.location.reload()}>↻</span></div>
              <div style={{ flex: 1, background: '#fff', borderRadius: '20px', padding: '5px 20px', fontSize: '13px', border: '1px solid #ddd', color: '#000', display: 'flex', justifyContent: 'center' }}>
                <span style={{opacity: 0.5, marginRight: '8px'}}>🔒</span> https://www.xbox.com/es-ES/fortnite-store
              </div>
            </div>
            
            <iframe 
              // Usamos el buscador como gateway para inyectar la web de Xbox sin bloqueos de Lazarus
              src="https://www.bing.com/search?q=site:xbox.com+fortnite+BT5P2X999VH2" 
              style={{ width: '100%', flex: 1, border: 'none' }}
              // PERMISOS TOTALES DE PANTALLA COMPLETA Y BLOQUEO DE PESTAÑAS
              allow="autoplay; fullscreen; gamepad; microphone"
              allowFullScreen
              sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-modals"
            />
          </div>
        )}

        {/* MODO YOUTUBE / TWITCH */}
        {mode !== 'bing' && (
          <div style={{ padding: '30px', height: '100%', overflowY: 'auto' }}>
            {selected ? (
              <div style={{ maxWidth: '1100px', margin: '0 auto', animation: 'fadeIn 0.4s' }}>
                <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
                  <iframe 
                    src={selected} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
                    allowFullScreen 
                    allow="autoplay; fullscreen"
                  />
                </div>
                <button onClick={() => setSelected(null)} style={{ marginTop: '20px', background: '#333', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar Reproductor</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                {loading && Array(6).fill(0).map((_, i) => <div key={i} style={{ height: '200px', background: '#111', borderRadius: '15px', animation: 'pulse 1s infinite' }} />)}
                
                {mode === 'youtube' && videos.map(v => (
                  <div key={v.id.videoId} onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1&modestbranding=1`)} style={{ cursor: 'pointer' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '18px', boxShadow: '0 10px 20px rgba(0,0,0,0.4)' }} />
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '5px', fontSize: '11px' }}>HD</div>
                    </div>
                    <h4 style={{ margin: '15px 0 5px', fontSize: '15px', color: '#fff' }}>{v.snippet.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', fontWeight: 'bold' }}>{v.snippet.channelTitle}</p>
                  </div>
                ))}

                {mode === 'twitch' && !selected && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', marginTop: '100px', opacity: 0.4 }}>
                    <div style={{ fontSize: '60px' }}>👾</div>
                    <p>Escribe el nombre del canal arriba para conectar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 0.5; } 100% { opacity: 0.3; } }
        body { margin: 0; overflow: hidden; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #333; borderRadius: 10px; }
      `}</style>
    </div>
  );
}
