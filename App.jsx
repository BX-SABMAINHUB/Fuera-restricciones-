import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    handleSearch("Tendencias");
  }, []);

  const handleSearch = async (searchTerm) => {
    const q = searchTerm || query;
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${q}&type=video&key=${YOUTUBE_API_KEY}`
      );
      const data = await res.json();
      setVideos(data.items || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ padding: '15px 5%', display: 'flex', alignItems: 'center', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 10 }}>
        <h2 style={{ color: '#FF0000', marginRight: '20px', cursor: 'pointer' }} onClick={() => window.location.reload()}>YouTube</h2>
        <div style={{ display: 'flex', flex: 1, maxWidth: '600px' }}>
          <input 
            style={{ flex: 1, padding: '10px', borderRadius: '20px 0 0 20px', border: '1px solid #333', background: '#121212', color: 'white', outline: 'none' }}
            placeholder="Buscar..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={() => handleSearch()} style={{ padding: '10px 20px', borderRadius: '0 20px 20px 0', border: 'none', background: '#333', color: 'white', cursor: 'pointer' }}>🔍</button>
        </div>
      </nav>

      {selectedVideo && (
        <div style={{ padding: '20px 5%', background: '#000' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
              src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
              frameBorder="0" allowFullScreen
            ></iframe>
          </div>
          <h2 style={{ marginTop: '15px' }}>{selectedVideo.snippet.title}</h2>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '20px 5%' }}>
        {videos.map(video => (
          <div key={video.id.videoId} onClick={() => { setSelectedVideo(video); window.scrollTo(0,0); }} style={{ cursor: 'pointer' }}>
            <img src={video.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px' }} />
            <p style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '10px' }}>{video.snippet.title}</p>
            <p style={{ color: '#aaa', fontSize: '12px' }}>{video.snippet.channelTitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
