import React, { useState, useEffect } from 'react';

// API Key integrada directamente
const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);
  const [panic, setPanic] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(false);

  // LISTA DE 40 JUEGOS FAMOSOS (ANTI-LAZARUS / ANTI-AULA)
  const games = [
    { n: "Minecraft Classic", u: "https://classic.minecraft.net/" },
    { n: "Subway Surfers", u: "https://daisygames.github.io/subway-surfers/" },
    { n: "Geometry Dash", u: "https://scratch.mit.edu/projects/105500895/embed" },
    { n: "Slope 3D", u: "https://math-study.github.io/slope/" },
    { n: "1v1.LOL", u: "https://1v1.lol/" },
    { n: "Retro Bowl", u: "https://game316043.konggames.com/gamez/0031/6043/live/index.html" },
    { n: "Snow Rider 3D", u: "https://racer8.github.io/sr3d/" },
    { n: "BitLife Online", u: "https://bitlife-online.github.io/" },
    { n: "Paper.io 2", u: "https://paper-io.com/" },
    { n: "Moto X3M", u: "https://moto-x3m.github.io/" },
    { n: "Among Us", u: "https://among-us.github.io/" },
    { n: "Basket Random", u: "https://basketball-random.github.io/" },
    { n: "Drive Mad", u: "https://drive-mad.github.io/" },
    { n: "Stickman Hook", u: "https://stickman-hook.github.io/" },
    { n: "Drift Hunters", u: "https://drift-hunters.github.io/" },
    { n: "Temple Run 2", u: "https://temple-run-2.github.io/" },
    { n: "Crossy Road", u: "https://crossy-road.github.io/" },
    { n: "Penalty Shooters 2", u: "https://penalty-shooters-2.github.io/" },
    { n: "Vex 4", u: "https://vex-4.github.io/" },
    { n: "Bottle Flip 3D", u: "https://bottle-flip-3d.github.io/" },
    { n: "Pacman Classic", u: "https://pacman.github.io/" },
    { n: "2048", u: "https://play2048.co/" },
    { n: "Friday Night Funkin", u: "https://fnf.github.io/" },
    { n: "Cookie Clicker", u: "https://ozh.github.io/cookieclicker/" },
    { n: "Minecraft 1.8 (Eagler)", u: "https://eaglercraft-1-8.vercel.app/" },
    { n: "Google Snake", u: "https://www.google.com/logos/2010/pacman10-i.html" },
    { n: "Dino Run (T-Rex)", u: "https://wayou.github.io/t-rex-runner/" },
    { n: "Tetris JS", u: "https://chvin.github.io/react-tetris/" },
    { n: "Tomb of the Mask", u: "https://tomb-of-the-mask.github.io/" },
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
    { n: "World Hardest Game", u: "https://worlds-hardest-game.github.io/" }
  ];

  useEffect(() => {
    const handleEsc = (e) => { 
      if (e.key === 'Escape') { 
        setPanic(true); 
        setActiveGame(null); 
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.title = activeGame ? "Google Classroom" : "YouTube";
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeGame]);

  useEffect(() => { handleSearch("Tendencias Gaming"); }, []);

  const handleSearch = async (searchTerm) => {
    const q = searchTerm || query || "Tendencias";
    setLoading(true); setView('home'); setActiveGame(null); setPanic(false);
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await response.json();
      if (data.items) setVideos(data.items);
    } catch (error) {
      console.error("Error YouTube:", error);
    } finally {
      setLoading(false);
    }
  };

  if (panic) return (
    <div onClick={() => setPanic(false)} style={{ background: 'white', color: 'black', height: '100vh', padding: '60px', fontFamily: 'serif', cursor: 'pointer' }}>
      <h1>Unidad 4: Cálculo Diferencial</h1>
      <p>La derivada representa la pendiente de la recta tangente a la gráfica de la función en un punto dado...</p>
      <div style={{background: '#f4f4f4', padding: '20px', borderLeft: '5px solid #007bff', marginTop: '20px'}}>
        <code>f'(x) = lim(h->0) [f(x+h) - f(x)] / h</code>
      </div>
      <p style={{marginTop: '40px', color: '#666'}}>Haz clic para continuar con la "clase".</p>
    </div>
  );

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: '"Roboto", Arial, sans-serif' }}>
      
      {/* NAVBAR ESTILO YOUTUBE */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>☰</span>
          <div onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ color: '#FF0000', fontSize: '24px' }}>▶</span>
            <span style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '-1.2px', marginLeft: '4px' }}>YouTube</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '720px' }}>
          <div style={{ display: 'flex', width: '100%', background: '#121212', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden' }}>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '0 20px', height: '40px', outline: 'none', fontSize: '16px' }}
              placeholder="Buscar"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={() => handleSearch()} style={{ background: '#222', border: 'none', borderLeft: '1px solid #333', color: 'white', width: '64px', cursor: 'pointer' }}>🔍</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '22px' }} title="Juegos">📁</span>
          <div onClick={() => setShowAbout(!showAbout)} style={{ cursor: 'pointer', width: '32px', height: '32px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', border: '1px solid #555' }}>A</div>
        </div>
      </nav>

      {/* ABOUT ME MODAL */}
      {showAbout && (
        <div style={{ position: 'fixed', top: '60px', right: '16px', background: '#282828', padding: '16px', borderRadius: '12px', zIndex: 2000, minWidth: '200px', border: '1px solid #444' }}>
          <h4 style={{ margin: '0 0 5px 0' }}>About me</h4>
          <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>Made by <b style={{ color: '#3ea6ff' }}>Alexgaming</b></p>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR */}
        <aside style={{ width: '72px', paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', position: 'sticky', top: '56px', height: 'calc(100vh - 56px)' }}>
          <div onClick={() => setView('home')} style={{ cursor: 'pointer', textAlign: 'center', fontSize: '10px' }}><div style={{fontSize: '20px'}}>🏠</div>Inicio</div>
          <div style={{ cursor: 'pointer', textAlign: 'center', fontSize: '10px' }}><div style={{fontSize: '20px'}}>🎞️</div>Shorts</div>
          <div onClick={() => setView('games')} style={{ cursor: 'pointer', textAlign: 'center', fontSize: '10px' }}><div style={{fontSize: '20px'}}>📁</div>Juegos</div>
        </aside>

        {/* CONTENIDO */}
        <main style={{ flex: 1, padding: '24px' }}>
          {view === 'games' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {activeGame ? (
                <div style={{ gridColumn: '1 / -1', height: '82vh', position: 'relative' }}>
                  <div style={{ background: '#222', padding: '10px', display: 'flex', justifyContent: 'space-between', borderRadius: '12px 12px 0 0' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>Vista previa de documento educativo</span>
                    <button onClick={() => setActiveGame(null)} style={{ background: '#cc0000', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer' }}>Cerrar</button>
                  </div>
                  <iframe src={activeGame} style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: '0 0 12px 12px' }} allowFullScreen></iframe>
                </div>
              ) : (
                games.map(g => (
                  <div key={g.n} onClick={() => setActiveGame(g.u)} style={{ background: '#1a1a1a', padding: '25px 15px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #333', transition: '0.2s' }}>
                    <div style={{fontSize: '32px', marginBottom: '10px'}}>📄</div>
                    <p style={{ fontSize: '13px', margin: 0, fontWeight: '500' }}>{g.n}</p>
                    <small style={{ color: '#3ea6ff', fontSize: '10px' }}>PDF Educativo</small>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {selectedVideo && (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                      src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
                      frameBorder="0" allowFullScreen
                    ></iframe>
                  </div>
                  <h1 style={{ fontSize: '20px', marginTop: '16px' }}>{selectedVideo.snippet.title}</h1>
                  <p style={{ color: '#aaa', fontSize: '14px' }}>{selectedVideo.snippet.channelTitle}</p>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px 16px' }}>
                {loading && <p>Cargando YouTube...</p>}
                {videos.map(v => (
                  <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo({top:0, behavior:'smooth'});}} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} alt="thumb" />
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <div style={{ minWidth: '36px', height: '36px', background: '#333', borderRadius: '50%' }}></div>
                      <div>
                        <p style={{ fontWeight: '500', fontSize: '16px', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '20px' }}>{v.snippet.title}</p>
                        <p style={{ fontSize: '14px', color: '#aaa', marginTop: '6px' }}>{v.snippet.channelTitle}</p>
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
