import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);
  const [panic, setPanic] = useState(false);

  // LISTA DE 40 JUEGOS SELECCIONADOS POR ESTABILIDAD Y ANTI-BLOQUEO
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

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setPanic(true); };
    window.addEventListener('keydown', handleEsc);
    if (activeGame) document.title = "Google Classroom";
    else document.title = "YouTube";
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeGame]);

  useEffect(() => { handleSearch("Tendencias"); }, []);

  const handleSearch = async (s) => {
    setView('home'); setActiveGame(null); setPanic(false);
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${s || query}&type=video&key=${YOUTUBE_API_KEY}`);
      const d = await r.json();
      setVideos(d.items || []);
    } catch (e) {}
  };

  if (panic) return (
    <div onClick={() => setPanic(false)} style={{ background: 'white', color: 'black', height: '100vh', padding: '50px', fontFamily: 'serif' }}>
      <h1>Conceptos de Cálculo: Derivadas</h1>
      <p>La derivada de una función matemática es la razón o velocidad de cambio de una función en un determinado punto...</p>
      <div style={{border: '1px solid #ccc', padding: '20px', margin: '20px 0'}}>f'(x) = lim h->0 [f(x+h) - f(x)] / h</div>
      <p style={{color: '#999'}}>Haga clic para reanudar el estudio.</p>
    </div>
  );

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: '56px', background: '#0f0f0f', borderBottom: '1px solid #333', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => {setView('home'); setActiveGame(null);}} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <span style={{ color: 'red', fontSize: '24px' }}>▶</span> <b style={{ marginLeft: '5px' }}>YouTube</b>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <input style={{ width: '50%', padding: '8px 15px', borderRadius: '20px', border: '1px solid #333', background: '#121212', color: 'white' }} placeholder="Buscar..." onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.target.value)} />
        </div>
        <div onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '22px' }}>📁</div>
      </nav>

      <main style={{ padding: '20px' }}>
        {view === 'games' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
            {activeGame ? (
              <div style={{ gridColumn: '1 / -1', height: '85vh', position: 'relative' }}>
                <button onClick={() => setActiveGame(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'red', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>Cerrar</button>
                <iframe src={activeGame} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '10px', background: 'white' }} allowFullScreen></iframe>
              </div>
            ) : (
              games.map(g => (
                <div key={g.n} onClick={() => setActiveGame(g.u)} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #333' }}>
                  <div style={{ fontSize: '30px' }}>📄</div>
                  <p style={{ fontSize: '12px', margin: '10px 0 0' }}>{g.n}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {selectedVideo && <iframe width="100%" height="400px" style={{ gridColumn: '1 / -1', borderRadius: '12px' }} src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} allowFullScreen></iframe>}
            {videos.map(v => (
              <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo(0,0);}} style={{ cursor: 'pointer' }}>
                <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
                <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '10px' }}>{v.snippet.title}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
