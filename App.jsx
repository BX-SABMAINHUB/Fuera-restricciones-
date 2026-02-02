import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGameUrl, setActiveGameUrl] = useState(null);
  const [panicMode, setPanicMode] = useState(false);

  // LISTA DE JUEGOS FILTRADOS QUE NO DAN ERROR DE FRAME
  const secureGames = [
    { title: "Minecraft Classic", url: "https://classic.minecraft.net/" },
    { title: "Subway Surfers", url: "https://daisygames.github.io/subway-surfers/" },
    { title: "Geometry Dash", url: "https://scratch.mit.edu/projects/105500895/embed" },
    { title: "Slope 3D", url: "https://math-study.github.io/slope/" },
    { title: "Retro Bowl", url: "https://rb.vseigru.net/" },
    { title: "1v1.LOL", url: "https://1v1.lol/" },
    { title: "Snow Rider 3D", url: "https://racer8.github.io/sr3d/" },
    { title: "BitLife Clone", url: "https://bitlife-online.github.io/" },
    { title: "A Small World Cup", url: "https://asmallworldcup.github.io/" },
    { title: "Eaglercraft 1.5.2", url: "https://g.eaglercraft.com/1.5.2/" }
  ];

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setPanicMode(true); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => { handleSearch("Top Hits 2026"); }, []);

  const handleSearch = async (searchTerm) => {
    setView('home'); setActiveGameUrl(null); setPanicMode(false);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${searchTerm || query}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (e) { console.error(e); }
  };

  if (panicMode) {
    return (
      <div onClick={() => setPanicMode(false)} style={{ background: 'white', padding: '50px', color: '#333', fontFamily: 'serif', height: '100vh', cursor: 'pointer' }}>
        <h1 style={{ borderBottom: '2px solid #eee' }}>Sistemas de Ecuaciones Lineales</h1>
        <p>Un sistema de ecuaciones es un conjunto de dos o más ecuaciones con varias incógnitas en la que deseamos encontrar una solución común.</p>
        <div style={{ background: '#f9f9f9', border: '1px solid #ddd', padding: '15px', marginTop: '20px' }}>
          <code>2x + 3y = 8<br/>x - y = 1</code>
        </div>
        <p style={{ marginTop: '30px', color: '#999' }}>Presiona en cualquier lugar para reanudar la sesión.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'Roboto, Arial' }}>
      {/* NAVBAR */}
      <nav style={{ padding: '0 20px', display: 'flex', alignItems: 'center', height: '56px', background: '#0f0f0f', borderBottom: '1px solid #333', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => {setView('home'); setActiveGameUrl(null);}}>
          <span style={{ color: 'red', fontSize: '24px' }}>▶</span>
          <b style={{ marginLeft: '8px' }}>YouTube</b>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <input 
            style={{ width: '50%', padding: '10px 20px', borderRadius: '20px', border: '1px solid #333', background: '#121212', color: 'white', outline: 'none' }}
            placeholder="Buscar..." 
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '22px' }}>
          <span onClick={() => setView('games')} style={{ cursor: 'pointer' }}>🎮</span>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>
        <main style={{ flex: 1, padding: '20px' }}>
          {view === 'games' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {activeGameUrl ? (
                <div style={{ gridColumn: '1 / -1', height: '80vh', position: 'relative' }}>
                  <button onClick={() => setActiveGameUrl(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'red', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Cerrar juego</button>
                  <iframe src={activeGameUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '15px', background: 'white' }} allowFullScreen></iframe>
                </div>
              ) : (
                secureGames.map(game => (
                  <div key={game.title} onClick={() => setActiveGameUrl(game.url)} style={{ background: '#222', padding: '20px', borderRadius: '15px', cursor: 'pointer', textAlign: 'center', border: '1px solid #444' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
                    <p style={{ fontWeight: 'bold' }}>{game.title}</p>
                    <small style={{ color: '#3ea6ff' }}>Abrir recurso</small>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {selectedVideo && (
                <div style={{ marginBottom: '30px' }}>
                  <iframe width="100%" height="500px" style={{ borderRadius: '12px' }} src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {videos.map(v => (
                  <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo(0,0);}} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} alt="thumb" />
                    <h4 style={{ fontSize: '15px', marginTop: '10px' }}>{v.snippet.title}</h4>
                    <p style={{ color: '#aaa', fontSize: '13px' }}>{v.snippet.channelTitle}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
