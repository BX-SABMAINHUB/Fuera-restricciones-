import React, { useState, useEffect } from 'react';

// TU API KEY INTEGRADA
const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);
  const [panic, setPanic] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // LISTA DE 40 JUEGOS (ACTUALIZADOS Y VERIFICADOS)
  const games = [
    { n: "Subway Surfers", u: "https://daisygames.github.io/subway-surfers/" },
    { n: "Minecraft Classic", u: "https://classic.minecraft.net/" },
    { n: "Geometry Dash", u: "https://scratch.mit.edu/projects/105500895/embed" },
    { n: "Slope 3D", u: "https://math-study.github.io/slope/" },
    { n: "Retro Bowl", u: "https://game316043.konggames.com/gamez/0031/6043/live/index.html" },
    { n: "1v1.LOL", u: "https://1v1.lol/" },
    { n: "Paper.io 2", u: "https://paper-io.com/" },
    { n: "BitLife Online", u: "https://bitlife-online.github.io/" },
    { n: "Moto X3M", u: "https://moto-x3m.github.io/" },
    { n: "Basket Random", u: "https://basketball-random.github.io/" },
    { n: "Among Us", u: "https://among-us.github.io/" },
    { n: "Drive Mad", u: "https://drive-mad.github.io/" },
    { n: "Stickman Hook", u: "https://stickman-hook.github.io/" },
    { n: "Drift Hunters", u: "https://drift-hunters.github.io/" },
    { n: "Crossy Road", u: "https://crossy-road.github.io/" },
    { n: "Vex 4", u: "https://vex-4.github.io/" },
    { n: "Temple Run 2", u: "https://temple-run-2.github.io/" },
    { n: "Pacman Classic", u: "https://pacman.github.io/" },
    { n: "2048 Game", u: "https://play2048.co/" },
    { n: "Cookie Clicker", u: "https://ozh.github.io/cookieclicker/" },
    { n: "Eaglercraft 1.8", u: "https://eaglercraft-1-8.vercel.app/" },
    { n: "Google Snake", u: "https://www.google.com/logos/2010/pacman10-i.html" },
    { n: "Tetris JS", u: "https://chvin.github.io/react-tetris/" },
    { n: "Snow Rider 3D", u: "https://racer8.github.io/sr3d/" },
    { n: "Tomb of Mask", u: "https://tomb-of-the-mask.github.io/" },
    { n: "Cut the Rope", u: "https://cuttherope.github.io/" },
    { n: "Angry Birds Online", u: "https://angry-birds.github.io/" },
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
    { n: "Hardest Game", u: "https://worlds-hardest-game.github.io/" }
  ];

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') { setPanic(true); setActiveGame(null); }};
    window.addEventListener('keydown', handleEsc);
    document.title = activeGame ? "Google Classroom" : "YouTube";
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeGame]);

  useEffect(() => { 
    handleSearch("Top Music 2026"); 
  }, []);

  const handleSearch = async (searchTerm) => {
    const s = searchTerm || query || "Tendencias";
    setVideos([]); setView('home'); setPanic(false);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(s)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      if (data.items) {
        setVideos(data.items);
      } else if (data.error) {
        alert("Error de YouTube: " + data.error.message);
      }
    } catch (e) { console.error("Error conexión:", e); }
  };

  if (panic) return (
    <div onClick={() => setPanic(false)} style={{ background: 'white', color: 'black', height: '100vh', padding: '60px', fontFamily: 'serif', cursor: 'pointer' }}>
      <h1 style={{borderBottom: '2px solid #333'}}>Álgebra Lineal: Vectores</h1>
      <p>Un vector es un segmento de recta orientado que depende de un sistema de coordenadas...</p>
      <div style={{background: '#f9f9f9', padding: '20px', marginTop: '20px', border: '1px solid #ddd'}}>
        <code>V = (x, y, z)</code>
      </div>
      <p style={{marginTop: '50px', color: '#888'}}>Presiona en cualquier lugar para reanudar.</p>
    </div>
  );

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif' }}>
      
      {/* HEADER REALISTA */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>☰</span>
          <div onClick={() => {setView('home'); setActiveGame(null);}} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ color: '#FF0000', fontSize: '24px' }}>▶</span>
            <span style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '-1.2px', marginLeft: '4px' }}>YouTube</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '720px' }}>
          <div style={{ display: 'flex', width: '90%', background: '#121212', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden' }}>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '0 20px', height: '40px', outline: 'none' }}
              placeholder="Buscar"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={() => handleSearch()} style={{ background: '#222', border: 'none', width: '64px', cursor: 'pointer', borderLeft: '1px solid #333' }}>🔍</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '22px' }}>📁</span>
          <div onClick={() => setShowAbout(!showAbout)} style={{ cursor: 'pointer', width: '32px', height: '32px', background: '#3ea6ff', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>👤</div>
        </div>
      </nav>

      {/* ABOUT ME BOX */}
      {showAbout && (
        <div style={{ position: 'fixed', top: '60px', right: '16px', background: '#282828', padding: '20px', borderRadius: '12px', zIndex: 2000, border: '1px solid #444', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>About me</h4>
          <p style={{ margin: 0, color: '#aaa' }}>Made by <b style={{ color: '#3ea6ff' }}>Alexgaming</b></p>
          <button onClick={() => setShowAbout(false)} style={{ marginTop: '10px', background: '#444', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Cerrar</button>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        {/* BARRA LATERAL */}
        <aside style={{ width: '72px', paddingTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px', position: 'sticky', top: '56px', height: '90vh' }}>
          <div onClick={() => setView('home')} style={{ cursor: 'pointer', textAlign: 'center', fontSize: '10px' }}>🏠<br/>Inicio</div>
          <div onClick={() => setView('games')} style={{ cursor: 'pointer', textAlign: 'center', fontSize: '10px' }}>📁<br/>Juegos</div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main style={{ flex: 1, padding: '24px' }}>
          {view === 'games' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {activeGame ? (
                <div style={{ gridColumn: '1 / -1', height: '82vh' }}>
                  <div style={{ background: '#333', padding: '10px', display: 'flex', justifyContent: 'space-between', borderRadius: '10px 10px 0 0' }}>
                    <span style={{fontSize: '12px'}}>Documento Educativo.pdf</span>
                    <button onClick={() => setActiveGame(null)} style={{ background: 'red', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>Cerrar</button>
                  </div>
                  <iframe src={activeGame} style={{ width: '100%', height: '100%', border: 'none', background: 'white' }} allowFullScreen></iframe>
                </div>
              ) : (
                games.map(g => (
                  <div key={g.n} onClick={() => setActiveGame(g.u)} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #333' }}>
                    <div style={{fontSize: '30px'}}>📄</div>
                    <p style={{ fontSize: '13px', margin: '10px 0 0' }}>{g.n}</p>
                    <small style={{color: '#444'}}>v.1.0</small>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {selectedVideo && (
                <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
                  <iframe width="100%" height="500px" style={{ borderRadius: '12px' }} src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
                  <h2 style={{ marginTop: '10px' }}>{selectedVideo.snippet.title}</h2>
                </div>
              )}
              {videos.length === 0 && <p>Escribe algo en el buscador y pulsa Enter...</p>}
              {videos.map(v => (
                <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo({top:0, behavior:'smooth'});}} style={{ cursor: 'pointer' }}>
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <div style={{ minWidth: '36px', height: '36px', borderRadius: '50%', background: '#333' }}></div>
                    <div>
                      <h4 style={{ fontSize: '14px', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.snippet.title}</h4>
                      <p style={{ fontSize: '12px', color: '#aaa', margin: '5px 0' }}>{v.snippet.channelTitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
