import React, { useState, useEffect } from 'react';

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);
  const [panic, setPanic] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(false);

  // LISTA DE 40 JUEGOS (CAMUFLADOS COMO DOCS)
  const games = [
    { n: "Subway Surfers", u: "https://daisygames.github.io/subway-surfers/" },
    { n: "Minecraft Classic", u: "https://classic.minecraft.net/" },
    { n: "Geometry Dash", u: "https://scratch.mit.edu/projects/105500895/embed" },
    { n: "Slope 3D", u: "https://math-study.github.io/slope/" },
    { n: "1v1.LOL", u: "https://1v1.lol/" },
    { n: "Retro Bowl", u: "https://game316043.konggames.com/gamez/0031/6043/live/index.html" },
    { n: "BitLife Online", u: "https://bitlife-online.github.io/" },
    { n: "Paper.io 2", u: "https://paper-io.com/" },
    { n: "Moto X3M", u: "https://moto-x3m.github.io/" },
    { n: "Among Us", u: "https://among-us.github.io/" },
    { n: "Drive Mad", u: "https://drive-mad.github.io/" },
    { n: "Stickman Hook", u: "https://stickman-hook.github.io/" },
    { n: "Drift Hunters", u: "https://drift-hunters.github.io/" },
    { n: "Crossy Road", u: "https://crossy-road.github.io/" },
    { n: "Vex 4", u: "https://vex-4.github.io/" },
    { n: "Pacman", u: "https://pacman.github.io/" },
    { n: "2048 Game", u: "https://play2048.co/" },
    { n: "Cookie Clicker", u: "https://ozh.github.io/cookieclicker/" },
    { n: "Eaglercraft 1.8", u: "https://eaglercraft-1-8.vercel.app/" },
    { n: "Google Snake", u: "https://www.google.com/logos/2010/pacman10-i.html" },
    { n: "Tetris JS", u: "https://chvin.github.io/react-tetris/" },
    { n: "Snow Rider 3D", u: "https://racer8.github.io/sr3d/" },
    { n: "Cut the Rope", u: "https://cuttherope.github.io/" },
    { n: "Angry Birds", u: "https://angry-birds.github.io/" },
    { n: "Mario Kart GBA", u: "https://gba.js.org/mario_kart_super_circuit/" },
    { n: "Sonic Classic", u: "https://sonic.github.io/" },
    { n: "Jetpack Joyride", u: "https://jetpack-joyride.github.io/" },
    { n: "Flappy Bird", u: "https://flappy-bird.github.io/" },
    { n: "Agar.io", u: "https://agar.io/" },
    { n: "Slither.io", u: "https://slither.io/" },
    { n: "Zombs Royale", u: "https://zombsroyale.io/" },
    { n: "Burrito Bison", u: "https://burrito-bison.github.io/" },
    { n: "Bottle Flip 3D", u: "https://bottle-flip-3d.github.io/" },
    { n: "Chrome Dino", u: "https://wayou.github.io/t-rex-runner/" },
    { n: "Friday Night Funkin", u: "https://fnf.github.io/" },
    { n: "Penalty Shoot", u: "https://penalty-shooters-2.github.io/" },
    { n: "Hardest Game", u: "https://worlds-hardest-game.github.io/" },
    { n: "Tomb of Mask", u: "https://tomb-of-the-mask.github.io/" },
    { n: "Basket Random", u: "https://basketball-random.github.io/" },
    { n: "Temple Run 2", u: "https://temple-run-2.github.io/" }
  ];

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setPanic(true); };
    window.addEventListener('keydown', handleEsc);
    document.title = (activeGame || selectedVideo) ? "Google Classroom" : "YouTube";
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeGame, selectedVideo]);

  // Buscador sin API (Usa un servidor proxy público para evitar bloqueos)
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true); setView('home'); setActiveGame(null); setPanic(false);
    
    try {
      const res = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (err) {
      alert("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (panic) return (
    <div onClick={() => setPanic(false)} style={{ background: '#fff', color: '#000', height: '100vh', padding: '50px', fontFamily: 'serif', cursor: 'pointer' }}>
      <h1>Apuntes: Historia Contemporánea</h1>
      <hr />
      <p>La Revolución Industrial supuso un cambio radical en las estructuras económicas...</p>
      <p style={{marginTop: '30px', color: '#888'}}>Click para volver.</p>
    </div>
  );

  return (
    <div style={{ background: '#0f0f0f', color: '#fff', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif' }}>
      
      {/* HEADER YOUTUBE STYLE */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>☰</span>
          <div onClick={() => {setView('home'); setSelectedVideo(null); setActiveGame(null);}} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ color: '#ff0000', fontSize: '24px' }}>▶</span>
            <span style={{ fontWeight: 'bold', fontSize: '20px', marginLeft: '4px', letterSpacing: '-1.2px' }}>YouTube</span>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '720px' }}>
          <div style={{ display: 'flex', width: '90%', background: '#121212', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden' }}>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '0 20px', height: '40px', outline: 'none' }}
              placeholder="Buscar"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" style={{ background: '#222', border: 'none', width: '64px', cursor: 'pointer', borderLeft: '1px solid #333' }}>🔍</button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '22px' }}>📁</span>
          <div onClick={() => setShowAbout(!showAbout)} style={{ cursor: 'pointer', opacity: 0.5, fontSize: '12px' }}>About Me</div>
        </div>
      </nav>

      {/* ABOUT ME POPUP */}
      {showAbout && (
        <div style={{ position: 'fixed', top: '60px', right: '20px', background: '#282828', padding: '15px', borderRadius: '8px', zIndex: 2000, border: '1px solid #444' }}>
          <p style={{ margin: 0 }}>Made by <b style={{color: '#3ea6ff'}}>Alexgaming</b></p>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR */}
        <aside style={{ width: '72px', paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div onClick={() => setView('home')} style={{cursor:'pointer', fontSize: '10px', textAlign:'center'}}>🏠<br/>Inicio</div>
          <div onClick={() => setView('games')} style={{cursor:'pointer', fontSize: '10px', textAlign:'center'}}>📁<br/>Juegos</div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: '24px' }}>
          {view === 'games' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '15px' }}>
              {activeGame ? (
                <div style={{ gridColumn: '1 / -1', height: '82vh' }}>
                  <button onClick={() => setActiveGame(null)} style={{ background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', marginBottom: '10px', cursor: 'pointer' }}>Volver al material</button>
                  <iframe src={activeGame} style={{ width: '100%', height: '100%', border: 'none', background: '#fff', borderRadius: '12px' }}></iframe>
                </div>
              ) : (
                games.map(g => (
                  <div key={g.n} onClick={() => setActiveGame(g.u)} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #333' }}>
                    <div style={{fontSize: '30px'}}>📄</div>
                    <p style={{ fontSize: '12px', marginTop: '10px' }}>{g.n}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {selectedVideo && (
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                      src={`https://www.youtube-nocookie.com/embed/${selectedVideo.url.split('=')[1] || selectedVideo.url.split('/').pop()}?autoplay=1`}
                      frameBorder="0" allowFullScreen
                    ></iframe>
                  </div>
                  <h1 style={{ fontSize: '20px', marginTop: '15px' }}>{selectedVideo.title}</h1>
                  <p style={{color: '#aaa'}}>{selectedVideo.uploaderName}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {loading && <p>Buscando videos...</p>}
                {videos.map(v => (
                  <div key={v.url} onClick={() => {setSelectedVideo(v); window.scrollTo({top:0, behavior:'smooth'});}} style={{ cursor: 'pointer' }}>
                    <img src={v.thumbnail} style={{ width: '100%', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} />
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <div style={{ minWidth: '36px', height: '36px', borderRadius: '50%', background: '#333' }}></div>
                      <div>
                        <h4 style={{ fontSize: '14px', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</h4>
                        <p style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>{v.uploaderName} • {v.uploadedDate}</p>
                      </div>
                    </div>
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
