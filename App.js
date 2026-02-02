import React, { useState } from 'react';

const YOUTUBE_API_KEY = "TU_API_KEY_AQUÍ"; // Debes obtenerla en Google Cloud Console

export default function YouTubeClone() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const searchVideos = async () => {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${query}&type=video&key=${YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    setVideos(data.items || []);
  };

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'Arial' }}>
      {/* Barra de Búsqueda */}
      <nav style={{ padding: '20px', display: 'flex', justifyContent: 'center', background: '#0f0f0f', borderBottom: '1px solid #333' }}>
        <input 
          style={{ padding: '10px', width: '40%', borderRadius: '20px 0 0 20px', border: '1px solid #333', background: '#121212', color: 'white' }}
          placeholder="Buscar videos..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button 
          onClick={searchVideos}
          style={{ padding: '10px 20px', borderRadius: '0 20px 20px 0', border: 'none', background: '#333', color: 'white', cursor: 'pointer' }}
        >🔍</button>
      </nav>

      {/* Reproductor Principal */}
      {selectedVideo && (
        <div style={{ width: '80%', margin: '20px auto' }}>
          <iframe 
            width="100%" height="500px" 
            src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
            frameBorder="0" allowFullScreen
          ></iframe>
          <h2>{selectedVideo.snippet.title}</h2>
        </div>
      )}

      {/* Rejilla de Videos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', padding: '40px' }}>
        {videos.map(video => (
          <div key={video.id.videoId} onClick={() => setSelectedVideo(video)} style={{ cursor: 'pointer' }}>
            <img src={video.snippet.thumbnails.medium.url} style={{ width: '100%', borderRadius: '12px' }} alt="thumb" />
            <p style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '10px' }}>{video.snippet.title}</p>
            <p style={{ color: '#aaa', fontSize: '12px' }}>{video.snippet.channelTitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
