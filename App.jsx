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
    const qSlug = query.toLowerCase().replace(/\s/g, '-');

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
      } catch (err) { alert("Error en YouTube API"); }
    } else {
      // MOTORES DE INYECCIÓN DIRECTA (Bypass de bloqueo de Iframe)
      const engines = {
        tiktok: `https://urlebird.com/search/?q=${q}`,
        instagram: `https://dumpoir.com/search?query=${q}`, // Alternativa a Imginn más estable
        twitch: `https://player.twitch.tv/?channel=${query.replace(/\s/g, '')}&parent=${window.location.hostname || 'localhost'}`,
        reddit: `https://www.redditmedia.com/search?q=${q}&include_over_18=on`,
        pinterest: `https://www.pinterest.com/search/pins/?q=${q}`,
        soundcloud: `https://soundcloud.com/search?q=${q}`,
        movies: `https://vidsrc.me/embed/movie?search=${q}`, // Nuevo motor de cine
        anime: `https://www.animeshot.org/?search=${q}`,
        twitter: `https://nitter.net/search?q=${q}`, // Espejo de X/Twitter sin login
        dailymotion: `https://www.dailymotion.com/search/${q}`
      };
      setActiveEmbed(engines[platform]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#0f0f0f', borderBottom: '1px solid #333', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.location.reload()}>
          <span style={{ color: '#f00', fontSize: '24px' }}>▶</span>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>ALEX HUB</span>
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '700px', margin: '0 15px' }}>
          <select 
            value={platform} 
            onChange={(e) => { setPlatform(e.target.value); setActiveEmbed(null); setResults([]); }}
            style={{ background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '20px 0 0 20px', padding: '0 10px', outline: 'none', fontSize: '12px' }}
          >
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="twitch">Twitch</option>
            <option value="movies">Cine</option>
            <option value="anime">Anime</option>
            <option value="twitter">X / Twitter</option>
            <option value="reddit">Reddit</option>
            <option value="soundcloud">SoundCloud</option>
            <option value="pinterest">Pinterest</option>
          </select>
          <input 
            style={{ flex: 1, background: '#121212', border: '1px solid #333', color: '#fff', padding: '0 15px', height: '36px', outline: 'none' }}
            placeholder={`Buscar en ${platform}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" style={{ background: '#333', border: '1px solid #333', width: '50px', borderRadius: '0 20px 20px 0', cursor: 'pointer' }}>🔍</button>
        </form>

        <button onClick={activatePanic} style={{ background: '#f00', color: '#fff', border: 'none', borderRadius: '5px', padding: '6px 12px', fontWeight: 'bold', fontSize: '11px' }}>PÁNICO</button>
      </nav>

      <div style={{ display: 'flex' }}>
        <main style={{ flex: 1, padding: '15px' }}>
          
          {loading && <div style={{textAlign: 'center', marginTop: '50px'}}>Abriendo {platform}...</div>}
          
          {activeEmbed ? (
            <div style={{ width: '100%', height: '88vh', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
              <iframe 
                src={activeEmbed} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                allow="autoplay; fullscreen; encrypted-media"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              ></iframe>
            </div>
          ) : results.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {results.map(item => (
                <div key={item.id} onClick={() => setActiveEmbed(item.embed)} style={{ cursor: 'pointer' }}>
                  <img src={item.thumb} style={{ width: '100%', borderRadius: '12px', border: '1px solid #222' }} />
                  <h4 style={{ fontSize: '13px', marginTop: '8px' }}>{item.title}</h4>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20vh', opacity: 0.4 }}>
              <h1 style={{fontSize: '50px'}}>🚀</h1>
              <h3>Alex Hub Multi-Plataforma</h3>
              <p>Busca un canal, película o usuario arriba.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
