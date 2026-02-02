import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('safari');
  const [activeEmbed, setActiveEmbed] = useState(null);
  const [ytResults, setYtResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // BOTÓN DE PÁNICO A MANAGEBAC
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
    setLoading(true);
    setYtResults([]);

    const q = encodeURIComponent(query);

    if (platform === 'youtube') {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setYtResults(data.items || []);
        setActiveEmbed(null);
      } catch (err) { alert("Error API YouTube"); }
    } else {
      // CAMBIO GRANDE: MOTORES DE INYECCIÓN DE ALTA COMPATIBILIDAD
      const sources = {
        safari: `https://duckduckgo.com/?q=${q}&kp=-1&kl=es-es`, // Safari puro
        tiktok: `https://urlebird.com/search/?q=${q}`, // TikTok Mirror Real
        discord: `https://discord.com/login`, 
        instagram: `https://imginn.com/search/?q=${q}`, 
        twitch: `https://player.twitch.tv/?channel=${query.replace(/\s/g, '')}&parent=${window.location.hostname}`,
        movies: `https://vidsrc.to/embed/movie/${query.toLowerCase().replace(/\s/g, '-')}`,
        reddit: `https://libredd.it/search?q=${q}`,
        pinterest: `https://www.pinterest.es/search/pins/?q=${q}`,
        spotify: `https://open.spotify.com/embed/search/${q}`,
        games: `https://repelz.github.io/` // Repositorio de juegos desbloqueados
      };
      setActiveEmbed(sources[platform]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, system-ui' }}>
      
      {/* BARRA DE DIRECCIONES SAFARI PRO */}
      <header style={{ background: '#1c1c1e', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #38383a' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div onClick={() => setActiveEmbed(null)} style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', cursor: 'pointer' }}></div>
          <div onClick={activatePanic} style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', cursor: 'pointer' }}></div>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', background: '#2c2c2e', borderRadius: '10px', padding: '4px 10px', alignItems: 'center' }}>
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            style={{ background: 'transparent', color: '#0a84ff', border: 'none', outline: 'none', marginRight: '10px', fontSize: '12px', fontWeight: 'bold' }}
          >
            <option value="safari">Safari</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="discord">Discord</option>
            <option value="twitch">Twitch</option>
            <option value="movies">Cine</option>
            <option value="spotify">Spotify</option>
            <option value="reddit">Reddit</option>
            <option value="games">Juegos</option>
          </select>
          <input 
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '14px', textAlign: 'center' }}
            placeholder="Buscar o introducir sitio web"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0a84ff' }}>🔍</button>
        </form>

        <button 
          onClick={activatePanic} 
          style={{ background: '#ff3b30', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 'bold', fontSize: '11px' }}
        >
          PÁNICO
        </button>
      </header>

      {/* CONTENEDOR DE PANTALLA COMPLETA */}
      <main style={{ flex: 1, background: '#000', position: 'relative' }}>
        {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>Cargando Safari...</div>}
        
        {activeEmbed ? (
          <iframe 
            src={activeEmbed} 
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            allow="autoplay; fullscreen; microphone; camera"
            // Sandbox optimizado para permitir login de Discord y videos de TikTok
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-storage-access-by-user-activation"
          ></iframe>
        ) : ytResults.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '20px', overflowY: 'auto', height: '100%' }}>
            {ytResults.map(v => (
              <div key={v.id.videoId} onClick={() => setActiveEmbed(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)} style={{ cursor: 'pointer' }}>
                <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
                <h4 style={{ fontSize: '14px', marginTop: '10px', color: '#fff' }}>{v.snippet.title}</h4>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
            <h1 style={{ fontSize: '4rem', margin: 0 }}></h1>
            <p>Safari Hub Pro - Alexgaming</p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
               <div onClick={() => {setPlatform('youtube'); setQuery('MrBeast');}} style={{ cursor: 'pointer', textAlign: 'center' }}><div style={{ fontSize: '24px' }}>▶</div><small>YT</small></div>
               <div onClick={() => {setPlatform('safari'); setQuery('Apple');}} style={{ cursor: 'pointer', textAlign: 'center' }}><div style={{ fontSize: '24px' }}>🧭</div><small>Safari</small></div>
               <div onClick={() => setPlatform('discord')} style={{ cursor: 'pointer', textAlign: 'center' }}><div style={{ fontSize: '24px' }}>💬</div><small>Discord</small></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
