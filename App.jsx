import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [panicMode, setPanicMode] = useState(false);

  // 🛡️ ESTRATEGIA: Usamos un HUB de juegos que se actualiza solo y usa proxies.
  // Estos enlaces son "unblocked" y suelen durar mucho más.
  const proxyGameHub = "https://ubg77.github.io/"; 

  useEffect(() => {
    if (view === 'games') {
      document.title = "Google Docs"; // Camuflaje total
    } else {
      document.title = "YouTube";
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') setPanicMode(true);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [view]);

  useEffect(() => { handleSearch("Tendencias"); }, []);

  const handleSearch = async (searchTerm) => {
    setView('home');
    setPanicMode(false);
    const q = searchTerm || query;
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (e) { console.error(e); }
  };

  if (panicMode) {
    return (
      <div onClick={() => setPanicMode(false)} style={{ background: 'white', padding: '50px', color: 'black', fontFamily: 'serif', height: '100vh' }}>
        <h1>Tarea: Análisis de Funciones Lineales</h1>
        <p>Enviado el: 2 feb. 2026 19:15</p>
        <hr />
        <p>Una función lineal es una función polinómica de primer grado, es decir, una función cuya representación en el plano cartesiano es una línea recta...</p>
        <p style={{color: '#ccc'}}>(Toca para volver)</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* NAVBAR SIMPLIFICADA */}
      <nav style={{ padding: '0 20px', display: 'flex', alignItems: 'center', height: '56px', background: '#0f0f0f', borderBottom: '1px solid #222' }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setView('home')}>
          <span style={{ color: 'red', fontSize: '24px' }}>▶</span>
          <b style={{ marginLeft: '5px' }}>YouTube</b>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <input 
            style={{ width: '40%', padding: '8px 15px', borderRadius: '20px', border: '1px solid #333', background: '#121212', color: 'white', outline: 'none' }}
            placeholder="Buscar..." 
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
            <span onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '22px' }} title="Recursos">📁</span>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR */}
        <aside style={{ width: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px', paddingTop: '20px' }}>
          <div onClick={() => setView('home')} style={{ cursor: 'pointer', fontSize: '20px' }}>🏠</div>
          <div onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '20px' }}>🎮</div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, padding: '20px' }}>
          
          {view === 'games' ? (
            <div style={{ width: '100%', height: '85vh', borderRadius: '15px', overflow: 'hidden', border: '2px solid #333' }}>
              <iframe 
                src={proxyGameHub} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                title="Google Docs Frame"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <>
              {selectedVideo && (
                <div style={{ marginBottom: '30px' }}>
                  <iframe width="100%" height="450px" style={{ borderRadius: '12px' }} src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {videos.map(v => (
                  <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo(0,0);}} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} alt="thumb" />
                    <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '10px' }}>{v.snippet.title}</p>
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
