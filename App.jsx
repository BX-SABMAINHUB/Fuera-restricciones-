import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [results, setResults] = useState([]);
  const [activeEmbed, setActiveEmbed] = useState(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setActiveEmbed(null);
    setResults([]);

    const q = encodeURIComponent(query);

    if (platform === 'youtube') {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setResults(data.items.map(v => ({
          id: v.id.videoId,
          title: v.snippet.title,
          thumb: v.snippet.thumbnails.high.url,
          embed: `https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`
        })));
      } catch (err) { alert("YouTube agotado"); }
    } else {
      // MOTORES SELECCIONADOS POR BAJO CSP (FUNCIONAN EN IFRAME)
      const engines = {
        tiktok: `https://urlebird.com/search/?q=${q}`,
        twitch: `https://player.twitch.tv/?channel=${query.replace(/\s/g, '')}&parent=${window.location.hostname || 'localhost'}`,
        twitter: `https://nitter.net/search?q=${q}`,
        reddit: `https://libredd.it/search?q=${q}`,
        movies: `https://vidsrc.to/embed/movie/${query.toLowerCase().replace(/\s/g, '-')}`,
        soundcloud: `https://soundcloud.com/search?q=${q}`,
        dailymotion: `https://www.dailymotion.com/search/${q}`,
        vimeo: `https://vimeo.com/search?q=${q}`,
        archive: `https://archive.org/search.php?query=${q}`,
        chess: `https://www.chess.com/play/online`
      };
      setActiveEmbed(engines[platform]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, -apple-system' }}>
      
      {/* HEADER */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '60px', background: '#0f0f0f', borderBottom: '1px solid #333', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => window.location.reload()}>
          <div style={{ background: '#f00', width: '30px', height: '22px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>
          <span style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '-1px' }}>ALEX HUB</span>
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '650px', margin: '0 15px' }}>
          <select 
            value={platform} 
            onChange={(e) => { setPlatform(e.target.value); setActiveEmbed(null); setResults([]); }}
            style={{ background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '20px 0 0 20px', padding: '0 10px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="twitch">Twitch</option>
            <option value="movies">Cine</option>
            <option value="twitter">X / Twitter</option>
            <option value="reddit">Reddit</option>
            <option value="soundcloud">Música</option>
            <option value="vimeo">Vimeo</option>
            <option value="archive">Archivo</option>
            <option value="chess">Ajedrez</option>
          </select>
          <input 
            style={{ flex: 1, background: '#121212', border: '1px solid #333', color: '#fff', padding: '0 15px', height: '38px', outline: 'none' }}
            placeholder={`Buscar en ${platform}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" style={{ background: '#333', border: '1px solid #333', width: '60px', borderRadius: '0 20px 20px 0', cursor: 'pointer' }}>🔍</button>
        </form>

        <button onClick={activatePanic} style={{ background: '#f00', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>PÁNICO</button>
      </nav>

      {/* CUERPO PRINCIPAL */}
      <div style={{ display: 'flex' }}>
        <main style={{ flex: 1, padding: '20px' }}>
          
          {activeEmbed ? (
            <div style={{ width: '100%', height: '85vh', background: '#fff', borderRadius: '15px', overflow: 'hidden' }}>
              <iframe 
                src={activeEmbed} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                allow="autoplay; fullscreen; encrypted-media"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
              ></iframe>
            </div>
          ) : results.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {results.map(item => (
                <div key={item.id} onClick={() => setActiveEmbed(item.embed)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                  <img src={item.thumb} style={{ width: '100%', borderRadius: '12px', border: '1px solid #222' }} />
                  <h4 style={{ fontSize: '14px', marginTop: '10px', fontWeight: '500' }}>{item.title}</h4>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20vh', opacity: 0.3 }}>
              <h1 style={{fontSize: '60px'}}>📺</h1>
              <h2>Selecciona y busca contenido real</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
