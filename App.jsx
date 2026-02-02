import React, { useState, useEffect } from 'react';

// REEMPLAZA ESTO CON LA CLAVE QUE COPIASTE DE TU IMAGEN
const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function YouTubeReal() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Cargar videos al iniciar la página
  useEffect(() => {
    handleSearch("Tendencias 2026");
  }, []);

  const handleSearch = async (searchTerm) => {
    const q = searchTerm || query;
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${q}&type=video&key=${YOUTUBE_API_KEY}`
      );
      const data = await res.json();
      setVideos(data.items || []);
    } catch (error) {
      console.error("Error cargando YouTube:", error);
    }
  };

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'Roboto, Arial' }}>
      {/* HEADER TIPO YOUTUBE */}
      <nav style={{ padding: '15px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', sticky: 'top', background: '#0f0f0f', zIndex: 100 }}>
        <h1 style={{ color: '#FF0000', cursor: 'pointer' }} onClick={() => window.location.reload()}>YouTube <span style={{color: '#fff', fontSize: '14px'}}>Clone</span></h1>
        
        <div style={{ display: 'flex', width: '50%' }}>
          <input 
            style={{ flex: 1, padding: '12px', borderRadius: '20px 0 0 20px', border: '1px solid #333', background: '#121212', color: 'white', outline: 'none' }}
            placeholder="Buscar en YouTube..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={() => handleSearch()} style={{ padding: '10px 25px', borderRadius: '0 20px 20px 0', border: 'none', background: '#222', color: 'white', cursor: 'pointer' }}>🔍</button>
        </div>
        <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%' }}></div>
      </nav>

      {/* REPRODUCTOR */}
      {selectedVideo && (
        <div style={{ width: '90%', maxWidth: '1000px', margin: '20px auto', animation: 'fadeIn 0.5s' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
              src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
              frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen
            ></iframe>
          </div>
          <h2 style={{ marginTop: '15px' }}>{selectedVideo.snippet.title}</h2>
          <p style={{ color: '#aaa' }}>{selectedVideo.snippet.channelTitle}</p>
        </div>
      )}

      {/* GRID DE VIDEOS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '20px', 
        padding: '30px 5%' 
      }}>
        {videos.map(video => (
          <div key={video.id.videoId} onClick={() => { setSelectedVideo(video); window.scrollTo(0,0); }} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <img 
              src={video.snippet.thumbnails.high.url} 
              style={{ width: '100%', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} 
              alt="thumbnail" 
            />
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {video.snippet.title}
              </div>
              <div style={{ color: '#aaa', fontSize: '13px', marginTop: '5px' }}>{video.snippet.channelTitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
