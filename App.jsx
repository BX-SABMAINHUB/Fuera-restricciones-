import React, { useState, useEffect } from 'react';

// ⚠️ SUSTITUYE ESTO POR TU CLAVE REAL DE GOOGLE CLOUD CONSOLE
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

  // LISTA DE 40 JUEGOS (SECCIÓN SECRETA)
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
    { n: "Pacman", u: "https://pacman.github.io/" },
    { n: "2048", u: "https://play2048.co/" },
    { n: "FNF Music", u: "https://fnf.github.io/" },
    { n: "Cookie Clicker", u: "https://ozh.github.io/cookieclicker/" },
    { n: "Minecraft 1.8", u: "https://eaglercraft-1-8.vercel.app/" },
    { n: "Snake", u: "https://www.google.com/logos/2010/pacman10-i.html" },
    { n: "Dino Run", u: "https://wayou.github.io/t-rex-runner/" },
    { n: "Tetris", u: "https://chvin.github.io/react-tetris/" },
    { n: "Tomb Mask", u: "https://tomb-of-the-mask.github.io/" },
    { n: "Cut the Rope", u: "https://cuttherope.github.io/" },
    { n: "Angry Birds", u: "https://angry-birds.github.io/" },
    { n: "Mario Kart", u: "https://gba.js.org/mario_kart_super_circuit/" },
    { n: "Sonic", u: "https://sonic.github.io/" },
    { n: "Jetpack Joyride", u: "https://jetpack-joyride.github.io/" },
    { n: "Flappy Bird", u: "https://flappy-bird.github.io/" },
    { n: "Agar.io", u: "https://agar.io/" },
    { n: "Slither.io", u: "https://slither.io/" },
    { n: "Zombs Royale", u: "https://zombsroyale.io/" },
    { n: "Burrito Bison", u: "https://burrito-bison.github.io/" },
    { n: "World Hardest Game", u: "https://worlds-hardest-game.github.io/" }
  ];

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') { setPanic(true); setActiveGame(null); }};
    window.addEventListener('keydown', handleEsc);
    document.title = activeGame ? "Google Classroom" : "YouTube";
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeGame]);

  useEffect(() => { handleSearch("Tendencias"); }, []);

  const handleSearch = async (searchTerm) => {
    const q = searchTerm || query || "Tendencias";
    setLoading(true); setView('home'); setActiveGame(null); setPanic(false);
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await response.json();
      if (data.items) {
        setVideos(data.items);
      } else {
        console.error("No data items", data);
      }
    } catch (error) {
      console.error("Error fetching YouTube:", error);
    } finally {
      setLoading(false);
    }
  };

  if (panic) return (
    <div onClick={() => setPanic(false)} style={{ background: 'white', color: 'black', height: '100vh', padding: '60px', fontFamily: 'serif' }}>
      <h1>1.3 La derivada como razón de cambio</h1>
      <p>En cálculo diferencial y análisis matemático, la derivada de una función es la razón de cambio instantánea...</p>
      <div style={{background: '#f0f0f0', padding: '20px', marginTop: '20px', borderLeft: '5px solid #ccc'}}>
        <i>f'(x) = [f(x+h) - f(x)] / h</i>
      </div>
      <p style={{marginTop: '40px', color: '#999'}}>Toca para volver.</p>
    </div>
  );

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: '"Roboto", Arial, sans-serif' }}>
      
      {/* HEADER YOUTUBE ESTILO REAL */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>☰</span>
          <div onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
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
          <div onClick={() => setShowAbout(!showAbout)} style={{ cursor: 'pointer', width: '32px', height: '32px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', border: '1px solid #555' }}>i</div>
        </div>
      </nav>

      {/* ABOUT ME MODAL */}
      {showAbout && (
        <div style={{ position: 'fixed', top: '60px', right: '16px', background: '#282828', padding: '16px', borderRadius: '12px', zIndex: 2000, minWidth: '180px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Información</h4>
          <p style={{ margin: 0, color: '#aaa' }}>Made by <b style={{ color: '#3ea6ff' }}>Alexgaming</b></p>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR MINI */}
        <aside style={{ width: '72px', paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div onClick={() => setView('home')} style={{ cursor: 'pointer', textAlign: 'center', fontSize: '10px' }}><div style={{fontSize: '20px'}}>🏠</div>Inicio</div>
          <div style={{ cursor: 'pointer', textAlign: 'center', fontSize: '10px' }}><div style={{fontSize: '20px'}}>🎞️</div>Shorts</div>
          <div onClick={() => setView('games')} style={{ cursor: 'pointer', textAlign: 'center', fontSize: '10px' }}><div style={{fontSize: '20px'}}>📁</div>Juegos</div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main style={{ flex: 1, padding: '20px' }}>
          
          {view === 'games' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
              {activeGame ? (
                <div style={{ gridColumn: '1 / -1', height: '80vh', position: 'relative' }}>
                  <div style={{ background: '#333', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', borderRadius: '8px 8px 0 0' }}>
                    <span style={{ fontSize: '12px' }}>Documento de lectura (Solo vista)</span>
                    <button onClick={() => setActiveGame(null)} style={{ background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
                  </div>
                  <iframe src={activeGame} style={{ width: '100%', height: '100%', border: 'none', background: 'white' }} allowFullScreen></iframe>
                </div>
              ) : (
                games.map(g => (
                  <div key={g.n} onClick={() => setActiveGame(g.u)} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #333' }}>
                    <div style={{fontSize: '32px'}}>📄</div>
                    <p style={{ fontSize: '13px', margin: '10px 0 0' }}>{g.n}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {selectedVideo && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                      src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
                      frameBorder="0" allowFullScreen
                    ></iframe>
                  </div>
                  <h1 style={{ fontSize: '20px', marginTop: '12px' }}>{selectedVideo.snippet.title}</h1>
                </div>
              )}
              
              {loading ? <p>Cargando contenido...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {videos.length === 0 && <p style={{color: 'red'}}>Error: No se cargaron videos. Revisa tu API Key de YouTube.</p>}
                  {videos.map(v => (
                    <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo({top:0, behavior:'smooth'});}} style={{ cursor: 'pointer' }}>
                      <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} alt="thumbnail" />
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <div style={{ minWidth: '36px', height: '36px', background: '#333', borderRadius: '50%' }}></div>
                        <div>
                          <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.snippet.title}</p>
                          <p style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{v.snippet.channelTitle}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
