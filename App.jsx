import React, { useState, useEffect } from 'react';

export default function App() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);
  const [panic, setPanic] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  // LISTA DE 40 JUEGOS
  const games = [
    { n: "Subway Surfers", u: "https://daisygames.github.io/subway-surfers/" },
    { n: "Minecraft Classic", u: "https://classic.minecraft.net/" },
    { n: "Geometry Dash", u: "https://scratch.mit.edu/projects/105500895/embed" },
    { n: "Slope 3D", u: "https://math-study.github.io/slope/" },
    { n: "1v1.LOL", u: "https://1v1.lol/" },
    { n: "Paper.io 2", u: "https://paper-io.com/" },
    { n: "BitLife Online", u: "https://bitlife-online.github.io/" },
    { n: "Moto X3M", u: "https://moto-x3m.github.io/" },
    { n: "Among Us", u: "https://among-us.github.io/" },
    { n: "Drive Mad", u: "https://drive-mad.github.io/" },
    { n: "Stickman Hook", u: "https://stickman-hook.github.io/" },
    { n: "Drift Hunters", u: "https://drift-hunters.github.io/" },
    { n: "Retro Bowl", u: "https://game316043.konggames.com/gamez/0031/6043/live/index.html" },
    { n: "Crossy Road", u: "https://crossy-road.github.io/" },
    { n: "Vex 4", u: "https://vex-4.github.io/" },
    { n: "Pacman", u: "https://pacman.github.io/" },
    { n: "Cookie Clicker", u: "https://ozh.github.io/cookieclicker/" },
    { n: "Eaglercraft 1.8", u: "https://eaglercraft-1-8.vercel.app/" },
    { n: "Snake", u: "https://www.google.com/logos/2010/pacman10-i.html" },
    { n: "Tetris", u: "https://chvin.github.io/react-tetris/" },
    { n: "Snow Rider 3D", u: "https://racer8.github.io/sr3d/" },
    { n: "Angry Birds", u: "https://angry-birds.github.io/" },
    { n: "Mario Kart GBA", u: "https://gba.js.org/mario_kart_super_circuit/" },
    { n: "Sonic Classic", u: "https://sonic.github.io/" },
    { n: "Jetpack Joyride", u: "https://jetpack-joyride.github.io/" },
    { n: "Flappy Bird", u: "https://flappy-bird.github.io/" },
    { n: "Slither.io", u: "https://slither.io/" },
    { n: "Zombs Royale", u: "https://zombsroyale.io/" },
    { n: "Friday Night Funkin", u: "https://fnf.github.io/" },
    { n: "Temple Run 2", u: "https://temple-run-2.github.io/" },
    { n: "Penalty Shoot", u: "https://penalty-shooters-2.github.io/" },
    { n: "Bottle Flip 3D", u: "https://bottle-flip-3d.github.io/" },
    { n: "Chrome Dino", u: "https://wayou.github.io/t-rex-runner/" },
    { n: "2048 Game", u: "https://play2048.co/" },
    { n: "Agar.io", u: "https://agar.io/" },
    { n: "Tomb of Mask", u: "https://tomb-of-the-mask.github.io/" },
    { n: "Cut the Rope", u: "https://cuttherope.github.io/" },
    { n: "Basket Random", u: "https://basketball-random.github.io/" },
    { n: "Burrito Bison", u: "https://burrito-bison.github.io/" },
    { n: "Hardest Game", u: "https://worlds-hardest-game.github.io/" }
  ];

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setPanic(true); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSearch = () => {
    if (!query) return;
    setPanic(false); setView('home'); setActiveGame(null);
    // Extraer ID si es un link, o buscar directamente
    let id = query;
    if (query.includes('v=')) id = query.split('v=')[1].split('&')[0];
    else if (query.includes('youtu.be/')) id = query.split('youtu.be/')[1].split('?')[0];
    
    setVideoUrl(id);
  };

  if (panic) return (
    <div onClick={() => setPanic(false)} style={{ background: '#fff', color: '#000', height: '100vh', padding: '50px', fontFamily: 'serif', cursor: 'pointer' }}>
      <h1 style={{borderBottom: '1px solid #000'}}>Análisis de Funciones Cuadráticas</h1>
      <p>Una función cuadrática es aquella que puede escribirse de la forma f(x) = ax² + bx + c...</p>
      <div style={{background: '#f5f5f5', padding: '20px', marginTop: '20px', border: '1px solid #ccc'}}>
        <code>Δ = b² - 4ac</code>
      </div>
      <p style={{marginTop: '40px', color: '#666'}}>Haz clic para reanudar el documento.</p>
    </div>
  );

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#000', borderBottom: '1px solid #333', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '20px' }}>☰</span>
          <div onClick={() => {setView('home'); setVideoUrl(null); setActiveGame(null);}} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#f00', fontSize: '24px' }}>▶</span>
            <span style={{ fontWeight: 'bold', fontSize: '18px', marginLeft: '4px' }}>YouTube</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '600px', margin: '0 10px' }}>
          <div style={{ display: 'flex', width: '100%', background: '#121212', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden' }}>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '0 15px', height: '36px', outline: 'none' }}
              placeholder="Pega el link de YouTube aquí..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} style={{ background: '#222', border: 'none', width: '50px', cursor: 'pointer' }}>🔍</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '20px' }}>📁</span>
          <div onClick={() => setShowAbout(!showAbout)} style={{ cursor: 'pointer', width: '30px', height: '30px', background: '#3ea6ff', borderRadius: '50%', textAlign: 'center', lineHeight: '30px', fontWeight: 'bold', fontSize: '12px' }}>A</div>
        </div>
      </nav>

      {showAbout && (
        <div style={{ position: 'fixed', top: '60px', right: '16px', background: '#222', padding: '15px', borderRadius: '10px', zIndex: 2000, border: '1px solid #444' }}>
          <p style={{ margin: 0 }}>Made by <b style={{color: '#3ea6ff'}}>Alexgaming</b></p>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        <aside style={{ width: '70px', paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
          <div onClick={() => setView('home')} style={{cursor:'pointer', fontSize: '10px', textAlign:'center'}}>🏠<br/>Inicio</div>
          <div onClick={() => setView('games')} style={{cursor:'pointer', fontSize: '10px', textAlign:'center'}}>📁<br/>Juegos</div>
        </aside>

        <main style={{ flex: 1, padding: '20px' }}>
          {view === 'games' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
              {activeGame ? (
                <div style={{ gridColumn: '1 / -1', height: '85vh' }}>
                  <button onClick={() => setActiveGame(null)} style={{ background: '#f00', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', marginBottom: '10px', cursor: 'pointer' }}>Cerrar Recurso</button>
                  <iframe src={activeGame} style={{ width: '100%', height: '100%', border: 'none', background: '#fff', borderRadius: '10px' }}></iframe>
                </div>
              ) : (
                games.map(g => (
                  <div key={g.n} onClick={() => setActiveGame(g.u)} style={{ background: '#111', padding: '20px', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', border: '1px solid #222' }}>
                    <div style={{fontSize: '30px'}}>📄</div>
                    <p style={{ fontSize: '12px', marginTop: '10px' }}>{g.n}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              {videoUrl ? (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }} 
                      src={`https://www.youtube-nocookie.com/embed/${videoUrl}?autoplay=1`} 
                      frameBorder="0" allowFullScreen
                    ></iframe>
                  </div>
                  <h3 style={{ marginTop: '15px', textAlign: 'left' }}>Video en Reproducción</h3>
                </div>
              ) : (
                <div style={{ marginTop: '100px', opacity: 0.6 }}>
                  <span style={{ fontSize: '50px' }}>📺</span>
                  <h2>YouTube Desbloqueado</h2>
                  <p>Para ver un video, pega el link de YouTube en la barra de arriba.</p>
                  <div style={{ marginTop: '30px', fontSize: '12px', color: '#3ea6ff' }}>
                    Soporta: youtube.com/watch?v=... y youtu.be/...
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
