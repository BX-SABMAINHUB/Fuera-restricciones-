import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('youtube'); // youtube | twitch | xbox
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('search_hist') || '[]'));

  // --- SISTEMA DE PÁNICO (MANAGEBAC) ---
  const activatePanic = () => {
    document.title = "ManageBac | Dashboard";
    window.location.href = "managebac://"; // Intento app nativa
    setTimeout(() => { window.location.href = "https://faria.managebac.com/login"; }, 200); // Fallback web
  };

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && activatePanic();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- BUSCADOR ---
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

  // --- COLORES DINÁMICOS ---
  const mainColor = mode === 'youtube' ? '#FF0000' : mode === 'twitch' ? '#9146FF' : '#107C10';

  return (
    <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'Segoe UI, Inter, -apple-system, sans-serif', transition: 'background 0.5s', overflowX: 'hidden' }}>
      
      {/* NAVBAR */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 25px', height: '75px', position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(15, 15, 15, 0.9)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${mainColor}44`
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* LOGO */}
          <div onClick={() => {setSelected(null); setQuery('');}} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ 
              width: '42px', height: '42px', background: `linear-gradient(135deg, ${mainColor}, #000)`, 
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              boxShadow: `0 0 20px ${mainColor}55`
            }}>
              <span style={{ fontSize: '20px' }}>
                {mode === 'youtube' && '▶'}
                {mode === 'twitch' && '👾'}
                {mode === 'xbox' && '🎮'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '900', fontSize: '18px', letterSpacing: '-0.5px' }}>ALEX</span>
              <span style={{ fontWeight: 'bold', fontSize: '12px', color: mainColor, letterSpacing: '2px' }}>ULTRA HUB</span>
            </div>
          </div>
          
          {/* TABS */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '4px', gap: '4px' }}>
            {['youtube', 'twitch', 'xbox'].map((m) => (
              <button 
                key={m}
                onClick={() => {setMode(m); setSelected(null);}} 
                style={{ 
                  background: mode === m ? '#222' : 'transparent', 
                  border: 'none', 
                  color: mode === m ? '#fff' : '#888', 
                  padding: '8px 16px', 
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  fontWeight: '700', 
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* BUSCADOR (Oculto en Xbox) */}
        {mode !== 'xbox' && (
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '500px', margin: '0 30px' }}>
            <input 
              style={{ 
                width: '100%', background: '#1a1a1a', border: `1px solid #333`, 
                color: '#fff', padding: '12px 20px', borderRadius: '20px', outline: 'none', fontSize: '14px'
              }}
              onFocus={(e) => e.target.style.borderColor = mainColor}
              onBlur={(e) => e.target.style.borderColor = '#333'}
              placeholder={mode === 'youtube' ? "Buscar video..." : "Canal de Twitch..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        )}

        <button onClick={activatePanic} style={{ background: '#E00', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>PÁNICO</button>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ padding: '30px', height: 'calc(100vh - 75px)', overflowY: 'auto' }}>
        
        {/* --- MODO XBOX (NATIVE STORE CLONE) --- */}
        {/* RECREACIÓN VISUAL EXACTA PARA EVITAR BLOQUEO DE IFRAME */}
        {mode === 'xbox' && (
          <div style={{ 
            maxWidth: '1200px', margin: '0 auto', background: '#111', borderRadius: '20px', 
            overflow: 'hidden', boxShadow: '0 0 50px rgba(16, 124, 16, 0.2)', border: '1px solid #333',
            animation: 'fadeIn 0.5s'
          }}>
            {/* HERO IMAGE BACKGROUND */}
            <div style={{ 
              height: '400px', 
              background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, #111 100%), url('https://store-images.s-microsoft.com/image/apps.58752.70702278257972015.655e2d67-546b-4e4f-9e7c-244249a88880.82563816-724d-4c3e-9568-12c5b9662c16?q=90&w=1600&h=900')`,
              backgroundSize: 'cover', backgroundPosition: 'center top'
            }}></div>

            {/* STORE CONTENT */}
            <div style={{ padding: '40px', marginTop: '-100px', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                
                {/* CARATULA */}
                <img 
                  src="https://store-images.s-microsoft.com/image/apps.58752.70702278257972015.655e2d67-546b-4e4f-9e7c-244249a88880.82563816-724d-4c3e-9568-12c5b9662c16?q=90&w=480&h=270" 
                  style={{ width: '300px', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                />

                {/* INFO DEL JUEGO */}
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: '48px', margin: '0 0 10px 0', fontWeight: '800' }}>Fortnite</h1>
                  <p style={{ color: '#aaa', fontSize: '16px', margin: '0 0 20px 0' }}>Epic Games Inc. • Shooter • Battle Royale</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <span style={{ background: '#333', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>X|S</span>
                    <span style={{ background: '#333', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Xbox One</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ color: '#FCD116' }}>★★★★☆</span>
                      <span style={{ color: '#888', fontSize: '12px' }}>(98K)</span>
                    </div>
                  </div>

                  <p style={{ lineHeight: '1.6', color: '#ddd', maxWidth: '600px', marginBottom: '30px' }}>
                    Crea, juega y combate con amigos de forma gratuita en Fortnite. Sé el último jugador en pie en Battle Royale y Cero construcción, disfruta de conciertos o vive aventuras en islas creadas por jugadores.
                  </p>

                  {/* BOTONES DE ACCIÓN SIMULADOS */}
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button style={{ 
                      background: '#107C10', color: '#fff', border: 'none', padding: '15px 40px', 
                      fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(16, 124, 16, 0.4)', textTransform: 'uppercase'
                    }}>
                      OBTENER (Gratis)
                    </button>
                    <button style={{ 
                      background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '15px 20px', 
                      fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer'
                    }}>
                      + LISTA DE DESEOS
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>Ofrece compras dentro de la aplicación.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODOS YOUTUBE / TWITCH --- */}
        {selected && mode !== 'xbox' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'scaleIn 0.4s' }}>
            <div style={{ width: '100%', maxWidth: '1100px', position: 'relative' }}>
              <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.8)', border: '1px solid #333' }}>
                <iframe 
                  src={selected} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen allow="autoplay"
                />
              </div>
              <button onClick={() => setSelected(null)} style={{ marginTop: '20px', background: '#222', border: '1px solid #333', color: '#fff', padding: '10px 30px', borderRadius: '10px', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        ) : mode !== 'xbox' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
            {loading && [1,2,3,4].map(n => <div key={n} style={{ height: '220px', background: '#111', borderRadius: '15px', animation: 'pulse 1s infinite' }}></div>)}
            
            {mode === 'youtube' && videos.map(v => (
              <div 
                key={v.id.videoId} 
                onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1&modestbranding=1&rel=0`)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '15px', objectFit: 'cover' }} />
                <h4 style={{ margin: '12px 0 5px', fontSize: '15px' }}>{v.snippet.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#777' }}>{v.snippet.channelTitle}</p>
              </div>
            ))}
            
            {mode === 'twitch' && !selected && (
               <div style={{ textAlign: 'center', gridColumn: '1/-1', marginTop: '100px', opacity: 0.5 }}>
                 <h1>👾</h1>
                 <p>Introduce un canal para conectar</p>
               </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 0.5; } 100% { opacity: 0.3; } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #333; borderRadius: 4px; }
      `}</style>
    </div>
  );
}
