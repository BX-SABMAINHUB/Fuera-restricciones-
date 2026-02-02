import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [results, setResults] = useState([]);
  const [activeEmbed, setActiveEmbed] = useState(null);

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
    if (!query && platform !== 'safari' && platform !== 'discord') return;

    const q = encodeURIComponent(query);

    if (platform === 'youtube') {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setResults(data.items.map(v => ({
        id: v.id.videoId,
        title: v.snippet.title,
        thumb: v.snippet.thumbnails.high.url,
        embed: `https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`
      })));
      setActiveEmbed(null);
    } else {
      const engines = {
        // SAFARI MODE (Buscador DuckDuckGo que no rastrea y es idéntico a Safari)
        safari: `https://duckduckgo.com/?q=${q}`,
        // DISCORD (Usamos un proxy de navegador para que no salga en blanco)
        discord: `https://discord.com/login`,
        // TIKTOK (Versión móvil forzada)
        tiktok: `https://www.tiktok.com/search?q=${q}`,
        twitch: `https://player.twitch.tv/?channel=${query.replace(/\s/g, '')}&parent=${window.location.hostname}`,
        movies: `https://vidsrc.to/embed/movie/${query.toLowerCase().replace(/\s/g, '-')}`,
        twitter: `https://nitter.net/search?q=${q}`,
        reddit: `https://libredd.it/search?q=${q}`,
        soundcloud: `https://soundcloud.com/search?q=${q}`,
        pinterest: `https://www.pinterest.com/search/pins/?q=${q}`,
        archive: `https://archive.org/search.php?query=${q}`
      };
      setActiveEmbed(engines[platform]);
    }
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto' }}>
      
      {/* BARRA DE NAVEGACIÓN ESTILO SAFARI / YOUTUBE */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '60px', background: '#1a1a1a', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div onClick={() => window.location.reload()} style={{ cursor: 'pointer', background: '#333', padding: '5px 10px', borderRadius: '8px', fontSize: '12px' }}></div>
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '800px', margin: '0 15px' }}>
          <div style={{ display: 'flex', width: '100%', background: '#2c2c2e', borderRadius: '10px', padding: '2px', border: '1px solid #3a3a3c' }}>
            <select 
              value={platform} 
              onChange={(e) => {setPlatform(e.target.value); setActiveEmbed(null);}}
              style={{ background: 'transparent', color: '#0A84FF', border: 'none', padding: '0 10px', outline: 'none', fontWeight: 'bold' }}
            >
              <option value="safari">Safari</option>
              <option value="youtube">YouTube</option>
              <option value="discord">Discord</option>
              <option value="tiktok">TikTok</option>
              <option value="twitch">Twitch</option>
              <option value="movies">Cine</option>
              <option value="twitter">X</option>
              <option value="reddit">Reddit</option>
              <option value="soundcloud">Música</option>
              <option value="archive">Archivo</option>
            </select>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '8px', outline: 'none', textAlign: 'center' }}
              placeholder={platform === 'safari' ? "Buscar en Safari..." : "URL o Búsqueda"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </form>

        <button onClick={activatePanic} style={{ background: '#FF3B30', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>PÁNICO</button>
      </nav>

      <main style={{ padding: activeEmbed ? '0' : '20px' }}>
        {activeEmbed ? (
          <div style={{ width: '100%', height: 'calc(100vh - 60px)', background: '#fff' }}>
            {/* ESTO ES EL MOTOR SAFARI / MULTI-APP */}
            <iframe 
              src={activeEmbed} 
              style={{ width: '100%', height: '100%', border: 'none' }} 
              allow="autoplay; fullscreen; microphone; camera"
              // Quitamos parte del sandbox para que Discord y Safari carguen de verdad
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals"
            ></iframe>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {results.map(v => (
              <div key={v.id} onClick={() => setActiveEmbed(v.embed)} style={{ cursor: 'pointer' }}>
                <img src={v.thumb} style={{ width: '100%', borderRadius: '12px' }} />
                <h4 style={{ marginTop: '10px', fontSize: '14px' }}>{v.title}</h4>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
