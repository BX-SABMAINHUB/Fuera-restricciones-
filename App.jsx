import React, { useState, useEffect } from 'react';

// Nueva API Key activa
const YOUTUBE_API_KEY = "AIzaSyAZnI_FZ78Wi-9Qw95AcggMoqJg_6pQpXE"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);
  const [panic, setPanic] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // LISTA DE 40 JUEGOS VERIFICADOS (ANTI-BLOQUEO)
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
    { n: "Hardest Game", u: "https://worlds-hardest-game.github.io/" }
  ];

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setPanic(true); };
    window.addEventListener('keydown', handleEsc);
    document.title = (activeGame || selectedVideo) ? "Google Classroom" : "YouTube";
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeGame, selectedVideo]);

  // Carga inicial (Solo 12 resultados para ahorrar cuota)
  useEffect(() => { handleSearch("MrBeast"); }, []);

  const handleSearch = async (s) => {
    const term = s || query || "Tendencias";
    setView('home'); setPanic(false); setActiveGame(null);
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(term)}&type=video&key=${YOUTUBE_API_KEY}`);
      const d = await r.json();
      if (d.items) setVideos(d.items);
      else if (d.error) console.error("Quota agotada o error:", d.error.message);
    } catch (e) { console.error("Error de red"); }
  };

  if (panic) return (
    <div onClick={() => setPanic(false)} style={{ background: 'white', color: 'black', height: '100vh', padding: '50px', fontFamily: 'serif', cursor: 'pointer' }}>
      <h1>Módulo de Matemáticas Avanzadas</h1>
      <p>Estudio de la parábola y sus aplicaciones en la física moderna...</p>
      <div style={{background: '#f0f0f0', padding: '20px', borderLeft: '5px solid #2196F3', marginTop: '20px'}}>
        <code>y = ax² + bx + c</code>
      </div>
      <p style={{marginTop: '30px', color: '#999'}}>Toca para volver a la sesión de estudio.</p>
    </div>
  );

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'Roboto, Arial' }}>
      
      {/* NAVBAR REALISTA */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>☰</span>
          <div onClick={() => {setView('home'); setSelectedVideo(null); setActiveGame(null);}} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ color: '#FF0000', fontSize: '24px' }}>▶</span>
            <span style={{ fontWeight: 'bold', fontSize: '18px', marginLeft: '4px', letterSpacing: '-1px' }}>YouTube</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '600px' }}>
          <div style={{ display: 'flex', width: '100%', background: '#121212', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden' }}>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '0 20px', outline: 'none', height: '40px' }}
              placeholder="Buscar" 
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={() => handleSearch()} style={{ background: '#222', border: 'none', width: '60px', cursor: 'pointer', borderLeft: '1px solid #333' }}>🔍</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '22px' }} title="Material">📁</span>
          <div onClick={() => setShowAbout(!showAbout)} style={{ cursor: 'pointer', width: '32px', height: '32px', background: '#3ea6ff', borderRadius: '50%', textAlign: 'center', lineHeight: '32px', fontSize: '12px', fontWeight: 'bold' }}>👤</div>
        </div>
      </nav>

      {/* ABOUT ME BOX */}
      {showAbout && (
        <div style={{ position: 'fixed', top: '60px', right: '16px', background: '#282828', padding: '15px', borderRadius: '12px', zIndex: 2000, border: '1px solid #444', minWidth: '150px' }}>
          <h4 style={{ margin: '0 0 5px 0' }}>Perfil</h4>
          <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>Made by <b style={{color: '#3ea6ff'}}>Alexgaming</b></p>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR MINI */}
        <aside style={{ width: '72px', paddingTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px', position: 'sticky', top: '56px', height: 'calc(100vh - 56px)' }}>
          <div onClick={() => setView('home')} style={{cursor:'pointer', fontSize: '10px', textAlign:'center'}}>🏠<br/>Inicio</div>
          <div onClick={() => setView('games')} style={{cursor:'pointer', fontSize: '10px', textAlign:'center'}}>📁<br/>Juegos</div>
        </aside>

        <main style={{ flex: 1, padding: '24px' }}>
          {view === 'games' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {activeGame ? (
                <div style={{ gridColumn: '1 / -1', height: '80vh' }}>
                  <div style={{ background: '#222', padding: '10px', display: 'flex', justifyContent: 'space-between', borderRadius: '8px 8px 0 0' }}>
                    <span style={{fontSize:'12px'}}>Vista previa de archivo</span>
                    <button onClick={() => setActiveGame(null)} style={{ background: 'red', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
                  </div>
                  <iframe src={activeGame} style={{ width: '100%', height: '100%', border: 'none', background: 'white' }} allowFullScreen></iframe>
                </div>
              ) : (
                games.map(g => (
                  <div key={g.n} onClick={() => setActiveGame(g.u)} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #333' }}>
                    <div style={{fontSize: '32px', marginBottom: '8px'}}>📄</div>
                    <p style={{ fontSize: '13px', margin: 0 }}>{g.n}</p>
                    <small style={{color: '#3ea6ff', fontSize: '10px'}}>PDF Educativo</small>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px 16px' }}>
              {selectedVideo && (
                <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }} src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
                  </div>
                  <h2 style={{ fontSize: '18px', marginTop: '12px' }}>{selectedVideo.snippet.title}</h2>
                </div>
              )}
              {videos.map(v => (
                <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo({top:0, behavior:'smooth'});}} style={{ cursor: 'pointer' }}>
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <div style={{ minWidth: '36px', height: '36px', borderRadius: '50%', background: '#333' }}></div>
                    <div>
                      <h4 style={{ fontSize: '14px', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '20px' }}>{v.snippet.title}</h4>
                      <p style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{v.snippet.channelTitle}</p>
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
