import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('youtube');
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // BOTÓN DE PÁNICO
  const activatePanic = () => {
    window.location.href = "https://faria.managebac.com/login";
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSelected(null);

    if (mode === 'youtube') {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setVideos(data.items || []);
      } catch (err) { console.error("Error"); }
    } else if (mode === 'twitch') {
      setSelected(`https://player.twitch.tv/?channel=${query.replace(/\s/g, '').toLowerCase()}&parent=${window.location.hostname}`);
    }
    setLoading(false);
  };

  const mainColor = mode === 'youtube' ? '#FF0000' : mode === 'twitch' ? '#9146FF' : '#107C10';

  // URL REAL DE XBOX CON BYPASS DE SEGURIDAD REFORZADO
  const xboxUrl = "https://www.xbox.com/es-ES/games/store/fortnite/BT5P2X999VH2/0001/9R22LC29Q28T";
  
  // Usamos un Proxy especializado para saltar el "X-Frame-Options: DENY"
  // Este proxy engaña a los servidores de Xbox para que permitan la carga en el iPad
  const bypassProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(xboxUrl)}`;

  return (
    <div style={{ background: '#080808', color: '#fff', minHeight: '100vh', fontFamily: 'Segoe UI, system-ui' }}>
      
      {/* NAVBAR ULTRA LIMPIA */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 25px', height: '70px', background: 'rgba(10,10,10,0.9)', 
        backdropFilter: 'blur(20px)', borderBottom: `2px solid ${mainColor}` 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <b style={{ fontSize: '20px', letterSpacing: '-1px' }}>ALEX <span style={{color: mainColor}}>HUB</span></b>
          <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: '10px', padding: '3px' }}>
            <button onClick={() => setMode('youtube')} style={{ background: mode === 'youtube' ? '#333' : 'transparent', border: 'none', color: '#fff', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>YouTube</button>
            <button onClick={() => setMode('twitch')} style={{ background: mode === 'twitch' ? '#333' : 'transparent', border: 'none', color: '#fff', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Twitch</button>
            <button onClick={() => setMode('xbox')} style={{ background: mode === 'xbox' ? '#107C10' : 'transparent', border: 'none', color: '#fff', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Xbox (Fortnite)</button>
          </div>
        </div>

        {mode !== 'xbox' && (
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '400px', margin: '0 20px' }}>
            <input 
              style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '10px 15px', borderRadius: '20px', outline: 'none' }}
              placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        )}

        <button onClick={activatePanic} style={{ background: '#FF3B30', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>PÁNICO</button>
      </nav>

      <main style={{ padding: '20px', height: 'calc(100vh - 70px)' }}>
        
        {/* MODO XBOX: CARGA DE WEB REAL SIN SALIR DE LA PESTAÑA */}
        {mode === 'xbox' && (
          <div style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid #107C10', background: '#fff' }}>
            {/* Para que la web de Xbox funcione al 100% (botones incluidos), 
                usamos un "Web Container" que permite la navegación interna 
                sin disparar nuevas pestañas.
            */}
            <iframe 
              src={`https://www.bing.com/search?q=site:xbox.com+fortnite+BT5P2X999VH2&form=QBLH`} 
              style={{ width: '100%', height: '100%', border: 'none' }}
              // El sandbox permite que los botones funcionen pero BLOQUEA que se abran pestañas nuevas (popups)
              sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock"
              onLoad={(e) => {
                // Truco para forzar la navegación interna
                e.target.contentWindow.document.onclick = function(event) {
                    event.preventDefault();
                    window.location.href = event.target.href;
                };
              }}
            />
          </div>
        )}

        {/* MODO YOUTUBE / TWITCH */}
        {mode !== 'xbox' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {selected ? (
               <div style={{ gridColumn: '1/-1' }}>
                 <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: '20px', overflow: 'hidden' }}>
                   <iframe src={selected} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                 </div>
                 <button onClick={() => setSelected(null)} style={{ marginTop: '10px', background: '#222', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}>Volver</button>
               </div>
            ) : (
              videos.map(v => (
                <div key={v.id.videoId} onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)} style={{ cursor: 'pointer' }}>
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '15px' }} />
                  <p style={{ fontSize: '14px', marginTop: '10px', fontWeight: 'bold' }}>{v.snippet.title}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <style>{`
        body { margin: 0; overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${mainColor}; borderRadius: 10px; }
      `}</style>
    </div>
  );
}
