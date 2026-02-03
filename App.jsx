import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('youtube'); // youtube | twitch | xbox
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('search_hist') || '[]'));

  // SISTEMA DE PÁNICO (MANAGEBAC)
  const activatePanic = () => {
    document.title = "ManageBac | Dashboard";
    // Intenta abrir la app
    window.location.href = "managebac://";
    // Fallback a web
    setTimeout(() => { window.location.href = "https://faria.managebac.com/login"; }, 300);
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
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
        updateHistory(query);
      } catch (err) { console.error("Error API"); }
    } else if (mode === 'twitch') {
      setSelected(`https://player.twitch.tv/?channel=${query.replace(/\s/g, '').toLowerCase()}&parent=${window.location.hostname}`);
      updateHistory(query);
    }
    setLoading(false);
  };

  const updateHistory = (q) => {
    const newHist = [q, ...history.filter(h => h !== q)].slice(0, 5);
    setHistory(newHist);
    localStorage.setItem('search_hist', JSON.stringify(newHist));
  };

  // Lógica de colores dinámicos
  const getThemeColor = () => {
    if (mode === 'youtube') return '#FF0000';
    if (mode === 'twitch') return '#9146FF';
    if (mode === 'xbox') return '#107C10'; // Xbox Green
    return '#fff';
  };
  const mainColor = getThemeColor();

  return (
    <div style={{ background: '#080808', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif', transition: 'background 0.5s' }}>
      
      {/* NAVBAR GLASSMORPHISM */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 30px', height: '80px', position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(12, 12, 12, 0.8)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${mainColor}33`, transition: 'border-color 0.3s'
      }}>
        
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <div onClick={() => {setSelected(null); setQuery('');}} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ 
              width: '45px', height: '45px', background: `linear-gradient(135deg, ${mainColor}, #000)`, 
              borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              boxShadow: `0 0 25px ${mainColor}66`, transition: 'all 0.3s' 
            }}>
              <span style={{ fontSize: '22px' }}>
                {mode === 'youtube' && '▶'}
                {mode === 'twitch' && '👾'}
                {mode === 'xbox' && '🎮'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '-0.5px', lineHeight: '1' }}>ALEX</span>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: mainColor, letterSpacing: '2px' }}>HUB ULTRA</span>
            </div>
          </div>
          
          {/* SELECTOR DE PLATAFORMA */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '5px', gap: '5px' }}>
            {['youtube', 'twitch', 'xbox'].map((m) => (
              <button 
                key={m}
                onClick={() => {setMode(m); setSelected(null);}} 
                style={{ 
                  background: mode === m ? '#222' : 'transparent', 
                  border: 'none', 
                  color: mode === m ? '#fff' : '#888', 
                  padding: '8px 20px', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: '13px',
                  textTransform: 'capitalize',
                  transition: 'all 0.3s'
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* BUSCADOR (Solo visible en YT y Twitch) */}
        {mode !== 'xbox' && (
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '500px', margin: '0 40px', position: 'relative' }}>
            <input 
              style={{ 
                width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`, 
                color: '#fff', padding: '14px 25px', borderRadius: '18px', outline: 'none', fontSize: '14px',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = mainColor}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              placeholder={mode === 'youtube' ? "Buscar video..." : "Canal de Twitch..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        )}

        <button 
          onClick={activatePanic}
          style={{ 
            background: '#FF3B30', color: '#fff', border: 'none', borderRadius: '14px', 
            padding: '10px 24px', fontWeight: '800', fontSize: '11px', cursor: 'pointer',
            boxShadow: '0 5px 20px rgba(255, 59, 48, 0.4)', letterSpacing: '1px'
          }}
        >
          PÁNICO
        </button>
      </nav>

      <main style={{ padding: '30px', height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        
        {/* MODO XBOX (FORTNITE FRAME) */}
        {mode === 'xbox' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.5s' }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h2 style={{ margin: 0, textShadow: `0 0 20px ${mainColor}` }}>Xbox Cloud Gaming</h2>
              <span style={{ background: '#222', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', color: '#aaa' }}>Anti-Lazarus Enabled</span>
            </div>
            
            <div style={{ flex: 1, background: '#101010', borderRadius: '24px', overflow: 'hidden', border: `1px solid ${mainColor}44`, position: 'relative' }}>
              <iframe 
                src="https://www.xbox.com/es-ES/games/store/fortnite/BT5P2X999VH2/0001/9R22LC29Q28T" 
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; gamepad; microphone; camera; fullscreen"
                // Sandbox avanzado para permitir ejecución de scripts de Xbox sin exponer la URL principal
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-pointer-lock allow-presentation"
                title="Xbox Frame"
              />
              
              {/* Overlay de carga por si la web tarda */}
              <div style={{ position: 'absolute', bottom: '20px', right: '20px', pointerEvents: 'none' }}>
                <div style={{ background: 'rgba(0,0,0,0.7)', padding: '10px 20px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid #333' }}>
                  <span style={{fontSize: '12px', color: '#107C10'}}>●</span> Conectado a Microsoft Store
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPRODUCTOR YOUTUBE/TWITCH */}
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '1200px' }}>
              <div style={{ position: 'absolute', width: '100%', height: '100%', background: mainColor, filter: 'blur(120px)', opacity: 0.1, zIndex: -1 }}></div>
              <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <iframe 
                  src={selected} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen allow="autoplay"
                />
              </div>
              <button onClick={() => setSelected(null)} style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '12px 30px', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold', backdropFilter: 'blur(10px)' }}>Cerrar</button>
            </div>
          </div>
        ) : mode !== 'xbox' && (
          /* GRID DE CONTENIDO */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
              {loading && [1,2,3,4].map(n => <div key={n} style={{ height: '220px', background: '#111', borderRadius: '20px', animation: 'pulse 1.5s infinite' }}></div>)}
              
              {mode === 'youtube' && videos.map(v => (
                <div 
                  key={v.id.videoId} 
                  onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1&modestbranding=1&rel=0`)}
                  style={{ cursor: 'pointer', transition: 'transform 0.3s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '20px', boxShadow: '0 15px 30px rgba(0,0,0,0.4)' }} />
                  <h4 style={{ margin: '15px 0 5px', fontSize: '15px', lineHeight: '1.4' }}>{v.snippet.title}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666', fontWeight: 'bold' }}>{v.snippet.channelTitle}</p>
                </div>
              ))}
            </div>

            {mode === 'twitch' && !selected && (
              <div style={{ textAlign: 'center', marginTop: '15vh', opacity: 0.8 }}>
                <div style={{ fontSize: '80px', marginBottom: '20px', filter: 'drop-shadow(0 0 30px #9146FF)' }}>👾</div>
                <h2>Twitch Stream Injector</h2>
                <p style={{ color: '#888' }}>Escribe el canal arriba para inyectar la señal en vivo.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 0.5; } 100% { opacity: 0.3; } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #333; borderRadius: 4px; }
      `}</style>
    </div>
  );
}
