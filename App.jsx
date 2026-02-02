import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);

  // Cambia el nombre de la pestaña para ocultar actividad
  useEffect(() => {
    if (activeGame) {
      document.title = "Google Classroom";
      const link = document.querySelector("link[rel~='icon']");
      if (link) link.href = "https://ssl.gstatic.com/classroom/favicon.png";
    } else {
      document.title = "YouTube";
    }
  }, [activeGame]);

  useEffect(() => { handleSearch("Tendencias"); }, []);

  const handleSearch = async (searchTerm) => {
    setView('home');
    setActiveGame(null);
    const q = searchTerm || query;
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (e) { console.error(e); }
  };

  const gamesList = [
    { title: "Subway Surfers", url: "https://vseigru.net/igry-subway-surfers/igra-subway-surfers-stambul.html" },
    { title: "Minecraft 1.8", url: "https://gentle-dodger-336714.netlify.app/" },
    { title: "Geometry Dash", url: "https://scratch.mit.edu/projects/105500895/embed" },
    { title: "Slope (3D)", url: "https://kdata1.com/2020/05/slope/" },
    { title: "Tunnel Rush", url: "https://vseigru.net/igry-dlya-malchikov/igra-bezumnyj-tonnel.html" },
    { title: "Retro Bowl", url: "https://game316043.konggames.com/gamez/0031/6043/live/index.html" },
    { title: "Among Us (Clone)", url: "https://vseigru.net/igry-among-as/igra-among-as-u-nas-na-baze.html" },
    { title: "1v1.LOL (Build)", url: "https://1v1.lol/" },
    { title: "BitLife", url: "https://vseigru.net/igry-simulyatory/igra-bitlajf.html" },
    { title: "Paper.io 2", url: "https://paper-io.com/" },
    { title: "Crossy Road", url: "https://vseigru.net/igry-krossi-roud/igra-krossi-roud.html" },
    { title: "Temple Run 2", url: "https://vseigru.net/igry-temple-run/igra-temple-run-2.html" },
    { title: "Drift Hunters", url: "https://vseigru.net/igry-gonki/igra-drift-khantery.html" },
    { title: "Happy Wheels", url: "https://vseigru.net/igry-kheppi-vils/igra-kheppi-vils.html" },
    { title: "Angry Birds", url: "https://vseigru.net/igry-engri-berds/igra-engri-berds.html" },
    { title: "Friday Night Funkin", url: "https://vseigru.net/igry-fnf/igra-fnf-protiv-uitti.html" },
    { title: "Bottle Flip 3D", url: "https://vseigru.net/igry-na-lovkost/igra-perevorot-butylki-3d.html" },
    { title: "Moto X3M Pool", url: "https://vseigru.net/igry-moto/igra-moto-ks3m-5-pustynya.html" },
    { title: "Basketball Stars", url: "https://vseigru.net/igry-basketbol/igra-basketbolnye-zvezdy.html" },
    { title: "Vex 4", url: "https://vseigru.net/igry-veks/igra-veks-4.html" },
    { title: "Pac-Man Classic", url: "https://vseigru.net/igry-pakman/igra-pakman.html" },
    { title: "Cut the Rope", url: "https://vseigru.net/igry-razrezh-verevku/igra-razrezh-verevku.html" }
  ];

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* NAVBAR */}
      <nav style={{ padding: '0 20px', display: 'flex', alignItems: 'center', height: '56px', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => {setView('home'); setActiveGame(null);}}>
          <span style={{ color: 'red', fontSize: '24px' }}>▶</span>
          <b style={{ marginLeft: '5px' }}>YouTube</b>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <input 
            style={{ width: '50%', padding: '8px 15px', borderRadius: '20px', border: '1px solid #333', background: '#121212', color: 'white', outline: 'none' }}
            placeholder="Buscar..." 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
            <span onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '22px' }}>🎮</span>
            <button onClick={() => alert("Restringido por administrador")} style={{ background: 'transparent', border: '1px solid #3ea6ff', color: '#3ea6ff', padding: '5px 10px', borderRadius: '15px', fontSize: '12px' }}>Iniciar sesión</button>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* MAIN AREA */}
        <main style={{ flex: 1, padding: '20px' }}>
          
          {activeGame ? (
            <div style={{ width: '100%', height: '85vh', background: '#000', borderRadius: '15px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-40px', right: 0 }}>
                <button onClick={() => setActiveGame(null)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>Cerrar y ocultar</button>
              </div>
              <iframe src={activeGame.url} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen></iframe>
            </div>
          ) : view === 'home' ? (
            <>
              {selectedVideo && (
                <div style={{ marginBottom: '30px' }}>
                  <iframe width="100%" height="480px" style={{ borderRadius: '12px' }} src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {videos.map(v => (
                  <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo(0,0);}} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
                    <h4 style={{ fontSize: '15px', marginTop: '10px' }}>{v.snippet.title}</h4>
                    <p style={{ color: '#aaa', fontSize: '13px' }}>{v.snippet.channelTitle}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {gamesList.map(game => (
                <div key={game.title} onClick={() => setActiveGame(game)} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '15px', cursor: 'pointer', textAlign: 'center', border: '1px solid #333' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>🕹️</div>
                  <p style={{ fontWeight: 'bold' }}>{game.title}</p>
                  <span style={{ fontSize: '10px', color: '#3ea6ff' }}>DESBLOQUEADO</span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
