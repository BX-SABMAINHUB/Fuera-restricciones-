import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);

  const categories = ["Todo", "Mixes", "Directo", "Coches", "Deportes"];

  // Juegos en servidores "Mirror" que suelen saltar Lazarus/I-Support
  const gamesList = [
    { title: "Retro Racing", thumb: "https://v6p9d9t4.ssl.hwcdn.net/html/1453245/thumbnail.png", url: "https://g.vseigru.net/11/moto-ks3m-4-zimnyaya-vspyshka/" },
    { title: "Geometry Jump", thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6-Y-7Nf-WlVAnQ", url: "https://scratch.mit.edu/projects/105500895/embed" },
    { title: "Minecraft Stealth", thumb: "https://i.ytimg.com/vi/SInZ_7V2-C4/maxresdefault.jpg", url: "https://precision-client.vercel.app/" },
    { title: "Eaglercraft (MC)", thumb: "https://eaglercraft.com/favicon.png", url: "https://eaglercraft.net/mc/1.8.8/" }
  ];

  useEffect(() => { handleSearch("Tendencias"); }, []);

  const handleSearch = async (searchTerm) => {
    setView('home');
    setActiveGame(null);
    const q = searchTerm || query;
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (e) { console.error("Error bypass:", e); }
  };

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
            placeholder="Buscar contenido libre..." 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div style={{ fontSize: '20px', cursor: 'pointer' }} onClick={() => setView('games')}>🎮</div>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR MINI */}
        <aside style={{ width: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px', paddingTop: '20px' }}>
          <div onClick={() => setView('home')} style={{ cursor: 'pointer' }}>🏠</div>
          <div onClick={() => setView('games')} style={{ cursor: 'pointer' }}>🎮</div>
          <div style={{ cursor: 'pointer' }}>🔥</div>
        </aside>

        {/* MAIN AREA */}
        <main style={{ flex: 1, padding: '20px' }}>
          
          {activeGame ? (
            <div style={{ width: '100%', height: '80vh', background: '#000', borderRadius: '15px', overflow: 'hidden' }}>
              <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Jugando: {activeGame.title}</span>
                <button onClick={() => setActiveGame(null)} style={{ background: 'red', border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>Cerrar Juego</button>
              </div>
              <iframe src={activeGame.url} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen></iframe>
            </div>
          ) : view === 'home' ? (
            <>
              {selectedVideo && (
                <div style={{ marginBottom: '30px' }}>
                  <iframe width="100%" height="450px" style={{ borderRadius: '12px' }} src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {videos.map(v => (
                  <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo(0,0);}} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '10px' }} />
                    <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '8px' }}>{v.snippet.title}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {gamesList.map(game => (
                <div key={game.title} onClick={() => setActiveGame(game)} style={{ background: '#222', padding: '10px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center' }}>
                  <img src={game.thumb} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                  <p style={{ marginTop: '10px', fontSize: '14px' }}>{game.title}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
