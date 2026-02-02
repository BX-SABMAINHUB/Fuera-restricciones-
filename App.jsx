import React, { useState, useEffect } from 'react';

// API KEY PARA YOUTUBE
const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw"; 

export default function App() {
  const [platform, setPlatform] = useState('youtube'); // youtube, tiktok, twitch, reddit, movies
  const [query, setQuery] = useState('');
  const [content, setContent] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [view, setView] = useState('home'); 
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(false);

  const activatePanic = () => {
    window.location.href = "managebac://";
    setTimeout(() => { window.location.href = "https://faria.managebac.com/login"; }, 400);
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') activatePanic(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // MOTOR DE BÚSQUEDA MULTI-PLATAFORMA
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true); setView('home'); setSelectedItem(null);
    
    try {
      if (platform === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setContent(data.items || []);
      } else if (platform === 'tiktok') {
        // Proxy para TikTok (Simulado para evitar bloqueos directos)
        alert("Buscando en servidor espejo de TikTok...");
        setSelectedItem({ type: 'tiktok', id: query });
      } else if (platform === 'twitch') {
        setSelectedItem({ type: 'twitch', id: query });
      }
    } catch (err) { console.error("Error de conexión"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER DINÁMICO */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '60px', background: '#000', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div onClick={() => setView('home')} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#3ea6ff' }}>ALEX HUB</div>
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '5px', padding: '5px' }}
          >
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok (Espejo)</option>
            <option value="twitch">Twitch</option>
            <option value="reddit">Reddit Media</option>
            <option value="movies">Cine Gratis</option>
          </select>
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '500px' }}>
          <input 
            style={{ width: '100%', background: '#121212', border: '1px solid #333', color: '#fff', padding: '8px 15px', borderRadius: '20px 0 0 20px', outline: 'none' }}
            placeholder={`Buscar en ${platform}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" style={{ background: '#333', border: '1px solid #333', padding: '0 15px', borderRadius: '0 20px 20px 0', cursor: 'pointer' }}>🔍</button>
        </form>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={activatePanic} style={{ background: '#f00', border: 'none', color: '#fff', borderRadius: '5px', padding: '5px 10px', fontSize: '10px', fontWeight: 'bold' }}>PÁNICO</button>
          <button onClick={() => setView('games')} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px' }}>📁</button>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>
        <main style={{ flex: 1, padding: '20px' }}>
          
          {/* REPRODUCTOR MULTI-PLATAFORMA */}
          {selectedItem && (
            <div style={{ marginBottom: '30px', background: '#111', padding: '10px', borderRadius: '15px' }}>
              {platform === 'youtube' && (
                <iframe width="100%" height="500px" src={`https://www.youtube-nocookie.com/embed/${selectedItem.id.videoId}?autoplay=1`} frameBorder="0" allowFullScreen style={{borderRadius: '10px'}}></iframe>
              )}
              {platform === 'tiktok' && (
                <iframe width="100%" height="600px" src={`https://www.urlebird.com/search/?q=${query}`} frameBorder="0" style={{background: '#fff', borderRadius: '10px'}}></iframe>
              )}
              {platform === 'twitch' && (
                <iframe src={`https://player.twitch.tv/?channel=${query}&parent=${window.location.hostname}`} height="500px" width="100%" allowFullScreen></iframe>
              )}
              {platform === 'movies' && (
                <iframe src={`https://vidsrc.to/embed/movie/${query}`} width="100%" height="500px" allowFullScreen></iframe>
              )}
            </div>
          )}

          {/* VISTA DE INICIO (YOUTUBE POR DEFECTO) */}
          {view === 'home' && platform === 'youtube' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {content.map(v => (
                <div key={v.id.videoId} onClick={() => setSelectedItem(v)} style={{ cursor: 'pointer' }}>
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '10px' }} />
                  <h4 style={{ fontSize: '14px', marginTop: '10px' }}>{v.snippet.title}</h4>
                </div>
              ))}
            </div>
          )}

          {/* MENÚ DE JUEGOS (PROTEGIDOS) */}
          {view === 'games' && (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                <p style={{gridColumn: '1/-1'}}>Recursos Educativos (Documentos PDF)</p>
                {/* Aquí puedes meter tus 40 juegos con el mismo estilo de antes */}
                <div onClick={() => window.open('https://daisygames.github.io/subway-surfers/', '_blank')} style={{background:'#1a1a1a', padding:'20px', borderRadius:'10px', textAlign:'center', cursor:'pointer'}}>📄 Subway_Notes</div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}
