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

    try {
      if (platform === 'youtube') {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        setResults(data.items.map(v => ({
          id: v.id.videoId,
          title: v.snippet.title,
          thumb: v.snippet.thumbnails.high.url,
          embed: `https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`
        })));
      } 
      else {
        // MOTORES DE BÚSQUEDA ESPEJO (Invidious, Bibliogram, etc. que no se bloquean)
        const engines = {
          tiktok: `https://urlebird.com/search/?q=${encodeURIComponent(query)}`,
          twitch: `https://player.twitch.tv/?channel=${query.toLowerCase().replace(/\s/g, '')}&parent=${window.location.hostname}`,
          instagram: `https://imginn.com/search/?q=${encodeURIComponent(query)}`,
          reddit: `https://www.redditmedia.com/search?q=${encodeURIComponent(query)}&include_over_18=on`,
          pinterest: `https://www.pinterest.es/search/pins/?q=${encodeURIComponent(query)}`,
          soundcloud: `https://w.soundcloud.com/player/?url=https://soundcloud.com/search?q=${encodeURIComponent(query)}`,
          vimeo: `https://vimeo.com/search?q=${encodeURIComponent(query)}`,
          dailymotion: `https://www.dailymotion.com/embed/video/search?query=${encodeURIComponent(query)}`,
          movies: `https://vidsrc.to/embed/movie/${query.toLowerCase().replace(/\s/g, '-')}`,
          anime: `https://animekisa.tv/search?q=${encodeURIComponent(query)}`
        };
        setActiveEmbed(engines[platform]);
      }
    } catch (err) {
      alert("Error al conectar con la plataforma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER TIPO YOUTUBE */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div onClick={() => window.location.reload()} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ff0000', fontWeight: 'bold' }}>
            ▶ <span style={{color: '#fff', marginLeft: '5px'}}>ALEX HUB</span>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '700px' }}>
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            style={{ background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '20px 0 0 20px', padding: '0 10px', outline: 'none' }}
          >
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="twitch">Twitch</option>
            <option value="instagram">Instagram</option>
            <option value="reddit">Reddit</option>
            <option value="movies">Películas</option>
            <option value="anime">Anime</option>
            <option value="soundcloud">Música</option>
            <option value="pinterest">Fotos</option>
            <option value="dailymotion">Dailymotion</option>
          </select>
          <input 
            style={{ flex: 1, background: '#121212', border: '1px solid #333', color: '#fff', padding: '0 15px', height: '36px', outline: 'none' }}
            placeholder={`Buscar en ${platform}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" style={{ background: '#222', border: '1px solid #333', width: '60px', borderRadius: '0 20px 20px 0', cursor: 'pointer' }}>🔍</button>
        </form>

        <button onClick={activatePanic} style={{ background: '#f00', color: '#fff', border: 'none', borderRadius: '5px', padding: '8px 15px', fontWeight: 'bold', cursor: 'pointer' }}>PÁNICO</button>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR */}
        <aside style={{ width: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px', paddingTop: '20px' }}>
          <div onClick={() => window.location.reload()} style={{cursor:'pointer'}}>🏠</div>
          <div style={{cursor:'pointer', opacity: 0.5}}>📁</div>
        </aside>

        {/* ÁREA DE CONTENIDO */}
        <main style={{ flex: 1, padding: '20px' }}>
          {loading && <div style={{textAlign: 'center', marginTop: '50px'}}>Cargando {platform}...</div>}
          
          {/* SI ES YOUTUBE MUESTRA GRILLA, SI ES OTRO MUESTRA EMBED DIRECTO */}
          {activeEmbed ? (
            <div style={{ width: '100%', height: '85vh', borderRadius: '15px', overflow: 'hidden', background: '#fff' }}>
              <iframe src={activeEmbed} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen"></iframe>
            </div>
          ) : results.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {results.map(item => (
                <div key={item.id} onClick={() => setActiveEmbed(item.embed)} style={{ cursor: 'pointer' }}>
                  <img src={item.thumb} style={{ width: '100%', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} />
                  <h4 style={{ fontSize: '14px', marginTop: '10px' }}>{item.title}</h4>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.5 }}>
                <h2>Selecciona plataforma y busca</h2>
                <p>TikTok, IG y Twitch requieren el nombre exacto del canal/usuario.</p>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
