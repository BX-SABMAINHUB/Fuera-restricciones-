import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); // 'home' o 'games'
  
  const categories = ["Todo", "Música", "Juegos", "Mixes", "Directo", "Programación", "Coches", "Deportes"];

  // Lista de juegos gratuitos (puedes cambiar los links por otros de sitios como Poki o GamePix)
  const gamesList = [
    { title: "Subway Surfers", thumb: "https://img.poki.com/cdn-cgi/image/quality=78,width=600,height=600,fit=cover,f=auto/9036987c959714856f6f9c2d1521789c.png", url: "https://poki.com/es/g/subway-surfers" },
    { title: "Temple Run 2", thumb: "https://img.poki.com/cdn-cgi/image/quality=78,width=600,height=600,fit=cover,f=auto/5e638290378f4075b9f7a77e0349880d.png", url: "https://poki.com/es/g/temple-run-2" },
    { title: "Moto X3M", thumb: "https://img.poki.com/cdn-cgi/image/quality=78,width=600,height=600,fit=cover,f=auto/46747206.png", url: "https://poki.com/es/g/moto-x3m" },
    { title: "Minecraft (Classic)", thumb: "https://classic.minecraft.net/assets/gui/background.png", url: "https://classic.minecraft.net/" }
  ];

  useEffect(() => { handleSearch("Tendencias"); }, []);

  const handleSearch = async (searchTerm) => {
    setView('home');
    const q = searchTerm || query;
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${q}&type=video&key=${YOUTUBE_API_KEY}`
      );
      const data = await res.json();
      setVideos(data.items || []);
    } catch (error) { console.error(error); }
  };

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: '"Roboto", sans-serif' }}>
      
      {/* NAVBAR */}
      <nav style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f0f0f', height: '56px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>☰</span>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => {setView('home'); setSelectedVideo(null);}}>
             <span style={{ color: '#FF0000', fontSize: '24px' }}>▶️</span>
             <h2 style={{ fontSize: '18px', marginLeft: '4px', letterSpacing: '-1px' }}>YouTube</h2>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, maxWidth: '720px', margin: '0 40px' }}>
          <input 
            style={{ flex: 1, padding: '10px 15px', borderRadius: '40px 0 0 40px', border: '1px solid #333', background: '#121212', color: 'white', outline: 'none' }}
            placeholder="Buscar" 
            value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={() => handleSearch()} style={{ padding: '0 20px', borderRadius: '0 40px 40px 0', border: '1px solid #333', background: '#222', color: 'white', cursor: 'pointer' }}>🔍</button>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button style={{ background: '#333', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>+ Crear</button>
          <button onClick={() => alert("Inicio de sesión deshabilitado por seguridad.")} style={{ background: 'transparent', border: '1px solid #3ea6ff', color: '#3ea6ff', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>👤 Iniciar sesión</button>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR REAL */}
        <aside style={{ width: '240px', padding: '12px', height: 'calc(100vh - 56px)', position: 'sticky', top: '56px' }}>
          <div onClick={() => setView('home')} style={{ padding: '12px', borderRadius: '10px', background: view === 'home' ? '#272727' : 'transparent', cursor: 'pointer' }}>🏠 Inicio</div>
          <div style={{ padding: '12px', cursor: 'pointer' }}>🎞️ Shorts</div>
          <div style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #333' }}>📺 Suscripciones</div>
          <div style={{ padding: '12px', marginTop: '10px', color: '#aaa', fontSize: '14px', fontWeight: 'bold' }}>EXPLORAR</div>
          <div onClick={() => setView('games')} style={{ padding: '12px', borderRadius: '10px', background: view === 'games' ? '#272727' : 'transparent', cursor: 'pointer' }}>🎮 Juegos</div>
          <div style={{ padding: '12px', cursor: 'pointer' }}>🔥 Tendencias</div>
          <div style={{ padding: '12px', cursor: 'pointer' }}>🎵 Música</div>
        </aside>

        {/* CONTENT AREA */}
        <main style={{ flex: 1, padding: '20px' }}>
          
          {view === 'home' ? (
            <>
              {/* CATEGORÍAS */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto' }}>
                {categories.map(c => <button key={c} onClick={() => handleSearch(c)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#272727', color: 'white', cursor: 'pointer' }}>{c}</button>)}
              </div>

              {selectedVideo ? (
                <div style={{ marginBottom: '30px' }}>
                  <iframe width="100%" height="500px" style={{ borderRadius: '12px', border: 'none' }} src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} allowFullScreen></iframe>
                  <h1 style={{ fontSize: '20px', marginTop: '15px' }}>{selectedVideo.snippet.title}</h1>
                </div>
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {videos.map(v => (
                  <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo(0,0);}} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
                    <h4 style={{ margin: '10px 0 5px 0' }}>{v.snippet.title}</h4>
                    <p style={{ color: '#aaa', fontSize: '14px' }}>{v.snippet.channelTitle}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* SECCIÓN DE JUEGOS */
            <div className="fade-in">
              <h1 style={{ marginBottom: '20px' }}>🎮 Zona de Juegos Premium</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {gamesList.map(game => (
                  <div key={game.title} onClick={() => window.open(game.url, '_blank')} style={{ background: '#272727', padding: '10px', borderRadius: '15px', cursor: 'pointer', textAlign: 'center', transition: '0.3s' }}>
                    <img src={game.thumb} style={{ width: '100%', borderRadius: '10px' }} />
                    <h3 style={{ fontSize: '16px', marginTop: '10px' }}>{game.title}</h3>
                    <button style={{ background: '#3ea6ff', border: 'none', color: 'black', padding: '5px 15px', borderRadius: '15px', marginTop: '5px', fontWeight: 'bold' }}>JUGAR</button>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: '30px', color: '#666' }}>Nota: Los juegos se abren en una pestaña nueva para garantizar la compatibilidad con el soporte de I-Support.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
