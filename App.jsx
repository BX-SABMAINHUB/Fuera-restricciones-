import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const categories = ["Todo", "Música", "Videojuegos", "Mixes", "En directo", "Programación", "Coches", "Deportes"];

  useEffect(() => { handleSearch("Tendencias"); }, []);

  const handleSearch = async (searchTerm) => {
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
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: '"Roboto", Arial, sans-serif' }}>
      
      {/* HEADER SUPERIOR */}
      <nav style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f0f0f', height: '56px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '24px', cursor: 'pointer' }}>☰</span>
          <h2 style={{ color: '#fff', letterSpacing: '-1px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => window.location.reload()}>
            <span style={{ background: 'red', color: 'white', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>▶</span> YouTube
          </h2>
        </div>

        <div style={{ display: 'flex', flex: 1, maxWidth: '720px', marginLeft: '40px' }}>
          <input 
            style={{ flex: 1, padding: '10px 15px', borderRadius: '40px 0 0 40px', border: '1px solid #333', background: '#121212', color: 'white', fontSize: '16px', outline: 'none' }}
            placeholder="Buscar" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={() => handleSearch()} style={{ padding: '0 20px', borderRadius: '0 40px 40px 0', border: '1px solid #333', borderLeft: 'none', background: '#222', color: 'white', cursor: 'pointer' }}>🔍</button>
        </div>

        <div style={{ display: 'flex', gap: '20px', fontSize: '20px' }}>
          <span>📹</span> <span>🔔</span> <div style={{ width: '32px', height: '32px', background: '#6366f1', borderRadius: '50%' }}></div>
        </div>
      </nav>

      {/* CATEGORÍAS */}
      <div style={{ padding: '10px 20px', display: 'flex', gap: '12px', overflowX: 'auto', background: '#0f0f0f', position: 'sticky', top: '56px', zIndex: 90 }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => handleSearch(cat)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#272727', color: 'white', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '500' }}>{cat}</button>
        ))}
      </div>

      <div style={{ display: 'flex' }}>
        {/* BARRA LATERAL (Solo decorativa) */}
        <aside style={{ width: '240px', padding: '10px', display: window.innerWidth < 800 ? 'none' : 'block' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: '#272727' }}>🏠 Inicio</div>
          <div style={{ padding: '10px' }}>🎞️ Shorts</div>
          <div style={{ padding: '10px', borderBottom: '1px solid #333' }}>📺 Suscripciones</div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main style={{ flex: 1, padding: '20px' }}>
          {selectedVideo && (
            <div style={{ marginBottom: '40px', animation: 'fadeIn 0.4s' }}>
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                <iframe 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1&rel=0`}
                  frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen
                ></iframe>
              </div>
              <h1 style={{ fontSize: '20px', marginTop: '15px' }}>{selectedVideo.snippet.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%' }}></div>
                <p style={{ fontWeight: 'bold' }}>{selectedVideo.snippet.channelTitle} ✅</p>
                <button style={{ background: 'white', color: 'black', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', marginLeft: 'auto' }}>Suscribirse</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {videos.map(video => (
              <div key={video.id.videoId} onClick={() => { setSelectedVideo(video); window.scrollTo({top: 0, behavior: 'smooth'}); }} style={{ cursor: 'pointer' }}>
                <img src={video.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px', transition: '0.3s' }} onMouseOver={e => e.target.style.borderRadius='0px'} onMouseOut={e => e.target.style.borderRadius='12px'} />
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <div style={{ minWidth: '36px', height: '36px', background: '#333', borderRadius: '50%' }}></div>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '16px', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.snippet.title}</p>
                    <p style={{ color: '#aaa', fontSize: '14px', margin: '4px 0' }}>{video.snippet.channelTitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
