import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('youtube'); // youtube | twitch
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('search_hist') || '[]'));

  const activatePanic = () => {
    document.title = "ManageBac | Dashboard";
    window.location.href = "managebac://";
    setTimeout(() => { window.location.href = "https://faria.managebac.com/login"; }, 200);
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
        const newHist = [query, ...history.filter(h => h !== query)].slice(0, 5);
        setHistory(newHist);
        localStorage.setItem('search_hist', JSON.stringify(newHist));
      } catch (err) { console.error("Error API"); }
    } else {
      setSelected(`https://player.twitch.tv/?channel=${query.replace(/\s/g, '').toLowerCase()}&parent=${window.location.hostname}`);
    }
    setLoading(false);
  };

  const mainColor = mode === 'youtube' ? '#FF0000' : '#9146FF';

  return (
    <div style={{ background: '#080808', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      
      {/* GLASS NAVBAR */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 30px', height: '75px', position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(12, 12, 12, 0.7)', backdropFilter: 'blur(15px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)' 
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setSelected(null)}>
            <div style={{ width: '40px', height: '40px', background: mainColor, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${mainColor}55` }}>
              <span style={{ fontSize: '20px' }}>{mode === 'youtube' ? '▶' : '👾'}</span>
            </div>
            <span style={{ fontWeight: '800', fontSize: '22px', letterSpacing: '-1px' }}>ALEX <span style={{ color: mainColor }}>HUB</span></span>
          </div>
          
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
            <button onClick={() => setMode('youtube')} style={{ background: mode === 'youtube' ? '#222' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>YouTube</button>
            <button onClick={() => setMode('twitch')} style={{ background: mode === 'twitch' ? '#222' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Twitch</button>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '600px', margin: '0 40px', position: 'relative' }}>
          <input 
            style={{ 
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', padding: '12px 25px', borderRadius: '14px', outline: 'none', fontSize: '15px'
            }}
            placeholder={mode === 'youtube' ? "Busca videos de YouTube..." : "Nombre del canal de Twitch..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" style={{ position: 'absolute', right: '15px', top: '12px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}>🔍</button>
        </form>

        <button 
          onClick={activatePanic}
          style={{ 
            background: '#FF3B30', color: '#fff', border: 'none', borderRadius: '12px', 
            padding: '10px 20px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 59, 48, 0.3)'
          }}
        >
          PANIC MODE
        </button>
      </nav>

      <main style={{ padding: '40px' }}>
        
        {/* CINEMA PLAYER WITH AMBIENT LIGHT */}
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.6s ease' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '1100px' }}>
              {/* Aura effect */}
              <div style={{ position: 'absolute', width: '100%', height: '100%', background: mainColor, filter: 'blur(100px)', opacity: 0.15, zIndex: -1 }}></div>
              
              <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <iframe 
                  src={selected} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  allow="autoplay"
                />
              </div>
              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '24px', margin: 0 }}>Reproduciendo en {mode === 'youtube' ? 'Cinema View' : 'Twitch Live'}</h2>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar</button>
              </div>
            </div>
          </div>
        ) : (
          /* CONTENT GRID */
          <div>
            {history.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '35px' }}>
                {history.map(h => (
                  <button key={h} onClick={() => {setQuery(h); handleSearch();}} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>{h}</button>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px' }}>
              {loading && Array(8).fill(0).map((_, i) => (
                <div key={i} style={{ background: '#111', height: '260px', borderRadius: '20px', animation: 'pulse 1.5s infinite' }}></div>
              ))}
              
              {mode === 'youtube' && videos.map(v => (
                <div 
                  key={v.id.videoId} 
                  onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1&modestbranding=1&rel=0`)}
                  style={{ cursor: 'pointer', transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', aspectRatio: '16/9', objectFit: 'cover' }} />
                  <div style={{ marginTop: '18px', padding: '0 5px' }}>
                    <h4 style={{ fontSize: '16px', margin: '0 0 10px 0', lineHeight: '1.4', color: '#fff' }}>{v.snippet.title}</h4>
                    <p style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>{v.snippet.channelTitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {mode === 'twitch' && !videos.length && (
              <div style={{ textAlign: 'center', marginTop: '15vh' }}>
                <div style={{ fontSize: '80px', marginBottom: '30px' }}>💜</div>
                <h1 style={{ fontSize: '40px', fontWeight: '900' }}>Twitch Bridge</h1>
                <p style={{ opacity: 0.5, fontSize: '18px' }}>Escribe el nombre del canal para inyectar el directo.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 0.6; } 100% { opacity: 0.3; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #222; borderRadius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${mainColor}; }
      `}</style>
    </div>
  );
}
