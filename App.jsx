import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [results, setResults] = useState([]);
  const [activeUrl, setActiveUrl] = useState(null);
  const [view, setView] = useState('home');

  // LAS 10 PLATAFORMAS REALES
  const platforms = {
    youtube: { n: "YouTube", icon: "▶", color: "#FF0000" },
    tiktok: { n: "TikTok", icon: "📱", color: "#00f2ea" },
    twitch: { n: "Twitch", icon: "👾", color: "#9146FF" },
    instagram: { n: "Instagram", icon: "📸", color: "#E1306C" },
    reddit: { n: "Reddit", icon: "🤖", color: "#FF4500" },
    pinterest: { n: "Pinterest", icon: "📌", color: "#E60023" },
    soundcloud: { n: "SoundCloud", icon: "☁", color: "#FF3300" },
    vimeo: { n: "Vimeo", icon: "Ⓜ", color: "#1AB7EA" },
    dailymotion: { n: "Dailymotion", icon: "📺", color: "#0062FF" },
    movies: { n: "CineLibre", icon: "🎬", color: "#FFD700" }
  };

  const activatePanic = () => {
    window.location.href = "managebac://";
    setTimeout(() => { window.location.href = "https://faria.managebac.com/login"; }, 300);
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') activatePanic(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setActiveUrl(null);

    // Lógica de búsqueda real por plataforma
    if (platform === 'youtube') {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setResults(data.items || []);
    } else {
      // Para el resto, generamos el acceso directo al contenido real sin login
      const directLinks = {
        tiktok: `https://urlebird.com/search/?q=${query}`,
        twitch: `https://www.twitch.tv/search?term=${query}`,
        instagram: `https://imginn.com/search/?q=${query}`, // Viewer real de IG sin login
        reddit: `https://www.reddit.com/search/?q=${query}`,
        pinterest: `https://www.pinterest.es/search/pins/?q=${query}`,
        soundcloud: `https://soundcloud.com/search?q=${query}`,
        vimeo: `https://vimeo.com/search?q=${query}`,
        dailymotion: `https://www.dailymotion.com/search/${query}`,
        movies: `https://vidsrc.to/embed/movie/${query.replace(/ /g, '-')}`
      };
      setActiveUrl(directLinks[platform]);
    }
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Roboto, Arial' }}>
      
      {/* NAVBAR ESTILO YOUTUBE */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div onClick={() => {setView('home'); setActiveUrl(null);}} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: platforms[platform].color, fontSize: '24px' }}>{platforms[platform].icon}</span>
            <span style={{ fontWeight: 'bold', fontSize: '18px', marginLeft: '8px' }}>{platforms[platform].n} Hub</span>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '600px' }}>
          <select 
            value={platform} 
            onChange={(e) => {setPlatform(e.target.value); setResults([]); setActiveUrl(null);}}
            style={{ background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '20px 0 0 20px', padding: '0 10px', outline: 'none' }}
          >
            {Object.keys(platforms).map(p => <option key={p} value={p}>{platforms[p].n}</option>)}
          </select>
          <input 
            style={{ flex: 1, background: '#121212', border: '1px solid #333', color: '#fff', padding: '0 15px', height: '36px', outline: 'none' }}
            placeholder={`Buscar en ${platforms[platform].n}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" style={{ background: '#222', border: '1px solid #333', width: '60px', borderRadius: '0 20px 20px 0', cursor: 'pointer' }}>🔍</button>
        </form>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={activatePanic} style={{ background: '#f00', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontWeight: 'bold', fontSize: '10px' }}>PÁNICO</button>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>Alexgaming</div>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR MINI */}
        <aside style={{ width: '72px', background: '#0f0f0f', height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingTop: '20px', position: 'sticky', top: '56px' }}>
          <div onClick={() => setView('home')} style={{cursor:'pointer', fontSize: '20px'}}>🏠</div>
          <div onClick={() => setView('games')} style={{cursor:'pointer', fontSize: '20px'}}>📁</div>
          <div onClick={activatePanic} style={{cursor:'pointer', fontSize: '20px'}}>🎓</div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main style={{ flex: 1, padding: '20px' }}>
          
          {/* Si hay un URL activo (TikTok, IG, Twitch, etc.) */}
          {activeUrl ? (
            <div style={{ width: '100%', height: '85vh', borderRadius: '15px', overflow: 'hidden', background: '#fff' }}>
              <iframe src={activeUrl} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen></iframe>
            </div>
          ) : platform === 'youtube' && results.length > 0 ? (
            /* Layout especial para YouTube */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {results.map(v => (
                <div key={v.id.videoId} onClick={() => setActiveUrl(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)} style={{ cursor: 'pointer' }}>
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
                  <h4 style={{ fontSize: '14px', marginTop: '10px', color: '#fff' }}>{v.snippet.title}</h4>
                </div>
              ))}
            </div>
          ) : (
            /* Pantalla de bienvenida */
            <div style={{ textAlign: 'center', marginTop: '15%' }}>
              <h1 style={{ fontSize: '3rem', color: platforms[platform].color }}>{platforms[platform].icon}</h1>
              <h2>Bienvenido a {platforms[platform].n} Desbloqueado</h2>
              <p style={{ opacity: 0.6 }}>Busca un usuario o tema arriba para empezar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
