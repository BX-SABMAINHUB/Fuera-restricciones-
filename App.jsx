import React, { useState, useEffect } from 'react';

// ⚠️ IMPORTANTE: PEGA TU CLAVE DE API AQUÍ
const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);
  const [panic, setPanic] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // LISTA DE 40 JUEGOS (ANTI-LAZARUS / GITHUB LINKS)
  const games = [
    { n: "Minecraft Classic", u: "https://classic.minecraft.net/" },
    { n: "Subway Surfers", u: "https://daisygames.github.io/subway-surfers/" },
    { n: "Geometry Dash", u: "https://scratch.mit.edu/projects/105500895/embed" },
    { n: "Slope", u: "https://math-study.github.io/slope/" },
    { n: "Retro Bowl", u: "https://game316043.konggames.com/gamez/0031/6043/live/index.html" },
    { n: "1v1.LOL", u: "https://1v1.lol/" },
    { n: "Snow Rider 3D", u: "https://racer8.github.io/sr3d/" },
    { n: "BitLife", u: "https://bitlife-online.github.io/" },
    { n: "Paper.io 2", u: "https://paper-io.com/" },
    { n: "Moto X3M", u: "https://moto-x3m.github.io/" },
    { n: "Among Us Online", u: "https://among-us.github.io/" },
    { n: "Basket Random", u: "https://basketball-random.github.io/" },
    { n: "Drive Mad", u: "https://drive-mad.github.io/" },
    { n: "Stickman Hook", u: "https://stickman-hook.github.io/" },
    { n: "Drift Hunters", u: "https://drift-hunters.github.io/" },
    { n: "Temple Run 2", u: "https://temple-run-2.github.io/" },
    { n: "Crossy Road", u: "https://crossy-road.github.io/" },
    { n: "Penalty Shooters 2", u: "https://penalty-shooters-2.github.io/" },
    { n: "Vex 4", u: "https://vex-4.github.io/" },
    { n: "Bottle Flip 3D", u: "https://bottle-flip-3d.github.io/" },
    { n: "Pacman", u: "https://pacman.github.io/" },
    { n: "2048", u: "https://play2048.co/" },
    { n: "Friday Night Funkin", u: "https://fnf.github.io/" },
    { n: "Cookie Clicker", u: "https://ozh.github.io/cookieclicker/" },
    { n: "Eaglercraft 1.8", u: "https://eaglercraft-1-8.vercel.app/" },
    { n: "Google Snake", u: "https://www.google.com/logos/2010/pacman10-i.html" },
    { n: "Dino Run", u: "https://wayou.github.io/t-rex-runner/" },
    { n: "Tetris", u: "https://chvin.github.io/react-tetris/" },
    { n: "Tomb Mask", u: "https://tomb-of-the-mask.github.io/" },
    { n: "Cut the Rope", u: "https://cuttherope.github.io/" },
    { n: "Angry Birds", u: "https://angry-birds.github.io/" },
    { n: "Mario GBA", u: "https://gba.js.org/mario_kart_super_circuit/" },
    { n: "Sonic Classic", u: "https://sonic.github.io/" },
    { n: "Jetpack Joyride", u: "https://jetpack-joyride.github.io/" },
    { n: "Flappy Bird", u: "https://flappy-bird.github.io/" },
    { n: "Agar.io", u: "https://agar.io/" },
    { n: "Slither.io", u: "https://slither.io/" },
    { n: "Zombs Royale", u: "https://zombsroyale.io/" },
    { n: "Burrito Bison", u: "https://burrito-bison.github.io/" },
    { n: "Worlds Hardest Game", u: "https://worlds-hardest-game.github.io/" }
  ];

  // Configuración de tecla ESC (Pánico) y Títulos Camuflados
  useEffect(() => {
    const handleEsc = (e) => { 
      if (e.key === 'Escape') {
        setPanic(true);
        setActiveGame(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    // Camuflaje de Pestaña
    if (activeGame) document.title = "Google Classroom";
    else document.title = "YouTube";

    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeGame]);

  // Cargar videos al inicio
  useEffect(() => { handleSearch("Tendencias Gaming"); }, []);

  const handleSearch = async (s) => {
    // Reseteamos vistas al buscar
    setView('home'); 
    setActiveGame(null); 
    setPanic(false);
    setShowAbout(false);

    try {
      const q = s || query;
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
      const d = await r.json();
      setVideos(d.items || []);
    } catch (e) {
      console.error("Error API", e);
    }
  };

  // PANTALLA DE PÁNICO (MATEMÁTICAS)
  if (panic) return (
    <div onClick={() => setPanic(false)} style={{ background: 'white', color: 'black', height: '100vh', padding: '50px', fontFamily: 'serif', cursor: 'pointer' }}>
      <h1>Conceptos de Cálculo: Derivadas</h1>
      <p>La derivada de una función matemática es la razón o velocidad de cambio de una función en un determinado punto...</p>
      <div style={{border: '1px solid #ccc', padding: '20px', margin: '20px 0', background: '#f9f9f9'}}>
        <i>f'(x) = lim <sub>h→0</sub> [f(x+h) - f(x)] / h</i>
      </div>
      <p style={{color: '#999', fontSize: '12px'}}>Haga clic en cualquier lugar para reanudar el estudio.</p>
    </div>
  );

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', overflowX: 'hidden' }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: '60px', background: '#0f0f0f', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 100 }}>
        
        {/* LOGO (Click para resetear) */}
        <div onClick={() => {setView('home'); setActiveGame(null); setShowAbout(false);}} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <span style={{ color: 'red', fontSize: '28px' }}>▶</span> <b style={{ marginLeft: '5px', letterSpacing: '-1px', fontSize: '20px' }}>YouTube</b>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div style={{ flex: 1, textAlign: 'center', margin: '0 20px' }}>
          <input 
            style={{ width: '100%', maxWidth: '500px', padding: '10px 20px', borderRadius: '40px', border: '1px solid #333', background: '#121212', color: 'white', outline: 'none' }} 
            placeholder="Buscar..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.target.value)} 
          />
        </div>

        {/* ICONOS DERECHA */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
           {/* Botón de Juegos */}
           <span onClick={() => {setView('games'); setShowAbout(false);}} style={{ cursor: 'pointer', fontSize: '24px' }} title="Recursos">📁</span>
           
           {/* BOTÓN CAMUFLADO ABOUT ME */}
           <div 
             onClick={() => setShowAbout(!showAbout)} 
             style={{ cursor: 'pointer', opacity: 0.4, fontSize: '16px', border: '1px solid #555', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
             title="Info"
           >
             ℹ
           </div>
        </div>
      </nav>

      {/* POPUP: ABOUT ME (Camuflado) */}
      {showAbout && (
        <div style={{ position: 'fixed', top: '65px', right: '20px', background: '#222', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 200, border: '1px solid #333', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>About Me</h3>
          <p style={{ color: '#aaa', margin: '0 0 15px 0' }}>Made by <span style={{ color: '#3ea6ff', fontWeight: 'bold' }}>Alexgaming</span></p>
          <button onClick={() => setShowAbout(false)} style={{ background: '#333', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>Cerrar</button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ padding: '20px' }}>
        
        {view === 'games' ? (
          // VISTA DE JUEGOS
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
            {activeGame ? (
              <div style={{ gridColumn: '1 / -1', height: '85vh', position: 'relative' }}>
                {/* Header falso para despistar dentro del juego */}
                <div style={{ background: '#ddd', color: '#333', padding: '5px 10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '10px 10px 0 0' }}>
                  <span><b>Google Docs</b> - Sin título.pdf</span>
                  <button onClick={() => setActiveGame(null)} style={{ background: '#d93025', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>✖ Cerrar Recurso</button>
                </div>
                <iframe src={activeGame} style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: '0 0 10px 10px' }} allowFullScreen></iframe>
              </div>
            ) : (
              games.map(g => (
                <div key={g.n} onClick={() => setActiveGame(g.u)} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #333', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#252525'} onMouseOut={(e) => e.currentTarget.style.background = '#1a1a1a'}>
                  <div style={{ fontSize: '28px', marginBottom: '5px' }}>📄</div>
                  <p style={{ fontSize: '12px', margin: 0, color: '#ddd' }}>{g.n}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          // VISTA DE YOUTUBE
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {selectedVideo && (
              <div style={{ gridColumn: '1 / -1', marginBottom: '30px' }}>
                 <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} 
                      src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} 
                      frameBorder="0" allowFullScreen
                    ></iframe>
                 </div>
                 <h2 style={{ marginTop: '15px' }}>{selectedVideo.snippet.title}</h2>
              </div>
            )}
            
            {videos.map(v => (
              <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo(0,0);}} style={{ cursor: 'pointer' }}>
                <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} />
                <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.snippet.title}</p>
                <p style={{ fontSize: '12px', color: '#aaa' }}>{v.snippet.channelTitle}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
