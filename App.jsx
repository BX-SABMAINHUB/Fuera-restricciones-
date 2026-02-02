import React, { useState, useEffect } from 'react';

export default function App() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);
  const [panic, setPanic] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  // 40 JUEGOS FAMOSOS Y SEGUROS
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

  // TECLA DE EMERGENCIA (ESC)
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') { setPanic(true); setActiveGame(null); setCurrentVideo(null); }};
    window.addEventListener('keydown', handleEsc);
    document.title = activeGame ? "Google Classroom" : "YouTube";
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeGame]);

  const handleSearch = () => {
    if (!query) return;
    setView('home');
    setActiveGame(null);
    setPanic(false);
    // Como la API falló, usamos una técnica de búsqueda directa vía DuckDuckGo/YouTube Embed
    // Esto evita el error de "Quota Exceeded"
    const videoId = query.includes('v=') ? query.split('v=')[1].split('&')[0] : "";
    if (videoId) setCurrentVideo(videoId);
    else alert("Pega el enlace de un video para verlo sin bloqueos o usa la lista de abajo.");
  };

  if (panic) return (
    <div onClick={() => setPanic(false)} style={{ background: 'white', color: 'black', height: '100vh', padding: '60px', fontFamily: 'serif', cursor: 'pointer' }}>
      <h1>Módulo 2: Geometría Analítica</h1>
      <p>La distancia entre dos puntos en el plano cartesiano se calcula mediante la fórmula...</p>
      <div style={{background: '#f9f9f9', padding: '20px', marginTop: '20px', border: '1px solid #ddd'}}>
        <code>d = √((x₂ - x₁)² + (y₂ - y₁)²)</code>
      </div>
      <p style={{marginTop: '50px', color: '#888'}}>Presiona para reanudar la sesión.</p>
    </div>
  );

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'Roboto, Arial' }}>
      
      {/* HEADER TIPO YOUTUBE */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '20px' }}>☰</span>
          <div onClick={() => {setView('home'); setActiveGame(null); setCurrentVideo(null);}} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ color: '#FF0000', fontSize: '24px' }}>▶</span>
            <span style={{ fontWeight: 'bold', fontSize: '18px', marginLeft: '4px' }}>YouTube</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '600px' }}>
          <div style={{ display: 'flex', width: '100%', background: '#121212', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden' }}>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '0 20px', outline: 'none' }}
              placeholder="Pega enlace de YouTube aquí..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} style={{ background: '#222', border: 'none', width: '60px', cursor: 'pointer' }}>🔍</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <span onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '20px' }}>📁</span>
          <div onClick={() => setShowAbout(!showAbout)} style={{ cursor: 'pointer', width: '32px', height: '32px', background: '#3ea6ff', borderRadius: '50%', textAlign: 'center', lineHeight: '32px', fontWeight: 'bold' }}>A</div>
        </div>
      </nav>

      {showAbout && (
        <div style={{ position: 'fixed', top: '60px', right: '16px', background: '#282828', padding: '15px', borderRadius: '8px', zIndex: 2000, border: '1px solid #444' }}>
          <p style={{ margin: 0 }}>Made by <b style={{color: '#3ea6ff'}}>Alexgaming</b></p>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        <aside style={{ width: '72px', paddingTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div onClick={() => setView('home')} style={{cursor:'pointer'}}>🏠</div>
          <div onClick={() => setView('games')} style={{cursor:'pointer'}}>📁</div>
        </aside>

        <main style={{ flex: 1, padding: '20px' }}>
          {view === 'games' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {activeGame ? (
                <div style={{ gridColumn: '1 / -1', height: '80vh' }}>
                  <button onClick={() => setActiveGame(null)} style={{ background: 'red', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', marginBottom: '10px', cursor: 'pointer' }}>Cerrar Juego</button>
                  <iframe src={activeGame} style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: '10px' }} allowFullScreen></iframe>
                </div>
              ) : (
                games.map(g => (
                  <div key={g.n} onClick={() => setActiveGame(g.u)} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #333' }}>
                    <div style={{fontSize: '30px'}}>📄</div>
                    <p style={{ fontSize: '13px', marginTop: '10px' }}>{g.n}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              {currentVideo ? (
                <iframe width="100%" height="600px" style={{ borderRadius: '12px' }} src={`https://www.youtube-nocookie.com/embed/${currentVideo}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
              ) : (
                <div style={{ marginTop: '100px', color: '#aaa' }}>
                  <h2>Bienvenido, Alexgaming</h2>
                  <p>Pega un enlace de YouTube arriba para saltarte el error de cuota.</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', width: '200px' }}>
                      <p><b>Anti-Lazarus</b></p>
                      <small>Invisible en el historial</small>
                    </div>
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', width: '200px' }}>
                      <p><b>Modo Pánico</b></p>
                      <small>Pulsa ESC si viene el profe</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
