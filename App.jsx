import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyAA8GuDX88IVFctcYzULKeJQ-sp4GjWU_A"; 

export default function App() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState('home'); 
  const [activeGame, setActiveGame] = useState(null);
  const [panicMode, setPanicMode] = useState(false); // Modo pánico para "Aula"

  // LISTA DE JUEGOS ALOJADOS EN GITHUB/VERCEL (Indetectables como "Juegos")
  // Usamos dominios educativos o de desarrollo que Lazarus suele respetar.
  const gamesList = [
    { title: "Minecraft (Eagler Vercel)", url: "https://eaglercraft-1-8.vercel.app/" },
    { title: "Subway Surfers (GitHub)", url: "https://stacktris.github.io/" }, 
    { title: "Geometry Dash", url: "https://cdn.githubraw.com/mobile-apps-box/geometry-dash-lite/main/index.html" },
    { title: "Slope (Math Project)", url: "https://math-study.github.io/slope/" },
    { title: "1v1 LOL (Unblocked)", url: "https://unblock-1v1.github.io/" },
    { title: "Retro Bowl", url: "https://retro-bowl.github.io/" },
    { title: "Basket Random", url: "https://basketball-random.github.io/" },
    { title: "Paper.io 2", url: "https://paperio2.github.io/" },
    { title: "Mario Kart (GBA)", url: "https://gba.js.org/mario_kart_super_circuit/" },
    { title: "Tetris (Code)", url: "https://chvin.github.io/react-tetris/" },
    { title: "2048", url: "https://play2048.co/" },
    { title: "Chrome Dino", url: "https://wayou.github.io/t-rex-runner/" },
    { title: "Pacman (Code)", url: "https://pacman-e281c.firebaseapp.com/" },
    { title: "Cookie Clicker", url: "https://ozh.github.io/cookieclicker/" },
    { title: "Drive Mad", url: "https://drive-mad.github.io/" },
    { title: "FIFA (Penalty)", url: "https://penalty-shooters-2.github.io/" },
    { title: "Temple Run 2", url: "https://temple-run-2.github.io/" },
    { title: "Stickman Hook", url: "https://stickman-hook.github.io/" },
    { title: "Drift Hunters", url: "https://drift-hunters.github.io/" },
    { title: "Crossy Road", url: "https://crossy-road.github.io/" }
  ];

  // 🛡️ SISTEMA ANTI-AULA Y CAMUFLAJE
  useEffect(() => {
    // Cambiar título de pestaña
    if (activeGame) {
      document.title = "Mi Unidad - Google Drive";
      const link = document.querySelector("link[rel~='icon']");
      if (link) link.href = "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png";
    } else {
      document.title = "YouTube Secure";
    }

    // Escuchar tecla ESCAPE para el MODO PÁNICO
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setPanicMode(true);
        setActiveGame(null);
        document.title = "Matemáticas: Álgebra - Wikipedia";
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeGame]);

  useEffect(() => { handleSearch("Tendencias Música"); }, []);

  const handleSearch = async (searchTerm) => {
    setView('home');
    setActiveGame(null);
    setPanicMode(false);
    const q = searchTerm || query;
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${q}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (e) { console.error(e); }
  };

  // Si el MODO PÁNICO está activado, mostramos una web falsa de estudios
  if (panicMode) {
    return (
      <div onClick={() => setPanicMode(false)} style={{ background: 'white', color: 'black', height: '100vh', padding: '40px', fontFamily: 'serif' }}>
        <h1 style={{ borderBottom: '1px solid #ccc' }}>Álgebra lineal</h1>
        <p style={{ fontSize: '14px', color: '#555' }}>De Wikipedia, la enciclopedia libre</p>
        <br/>
        <p>El álgebra lineal es una rama de las matemáticas que estudia conceptos tales como vectores, matrices, espacio dual, sistemas de ecuaciones lineales y en su enfoque de manera más formal, espacios vectoriales y sus transformaciones lineales.</p>
        <p>Es un área activa que tiene conexiones con muchas áreas dentro y fuera de las matemáticas, como el análisis funcional, las ecuaciones diferenciales, la investigación de operaciones, las gráficas por computadora, la ingeniería, etc.</p>
        <div style={{ background: '#f0f0f0', padding: '20px', marginTop: '20px', border: '1px solid #ccc' }}>
          <h3>Ecuación característica</h3>
          <p>det(A - λI) = 0</p>
        </div>
        <p style={{ marginTop: '50px', color: '#aaa', fontSize: '12px' }}>(Haz clic en cualquier lugar para volver al modo normal)</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <nav style={{ padding: '0 20px', display: 'flex', alignItems: 'center', height: '60px', background: '#0f0f0f', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => {setView('home'); setActiveGame(null);}}>
          <span style={{ color: 'red', fontSize: '28px' }}>▶</span>
          <b style={{ marginLeft: '5px', fontSize: '20px', letterSpacing: '-1px' }}>YouTube</b>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <input 
            style={{ width: '40%', padding: '10px 15px', borderRadius: '40px', border: '1px solid #333', background: '#121212', color: 'white', outline: 'none' }}
            placeholder="Buscar..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* BOTÓN SECRETO DE JUEGOS (Icono de carpeta para despistar) */}
            <span onClick={() => setView('games')} style={{ cursor: 'pointer', fontSize: '20px' }} title="Recursos">📁</span>
            <div style={{ width: '32px', height: '32px', background: '#555', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* BARRA LATERAL */}
        <aside style={{ width: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', paddingTop: '20px', height: '90vh' }}>
          <div onClick={() => setView('home')} style={{ cursor: 'pointer' }}>🏠</div>
          <div onClick={() => setView('games')} style={{ cursor: 'pointer' }}>📁</div>
          <div style={{ cursor: 'pointer' }}>📚</div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main style={{ flex: 1, padding: '20px' }}>
          
          {activeGame ? (
            // ZONA DE JUEGO ACTIVO
            <div style={{ width: '100%', height: '85vh', background: '#000', borderRadius: '15px', overflow: 'hidden', position: 'relative' }}>
               {/* Header falso de Google Classroom dentro del juego para despistar */}
               <div style={{ background: 'white', color: '#5f6368', padding: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="https://ssl.gstatic.com/classroom/favicon.png" width="20" />
                  <b>Google Classroom</b> | Tarea pendiente: Historia del Arte
                  <button onClick={() => setActiveGame(null)} style={{ marginLeft: 'auto', background: '#d93025', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Tarea</button>
               </div>
              <iframe src={activeGame.url} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen></iframe>
            </div>

          ) : view === 'home' ? (
            // ZONA YOUTUBE
            <>
              {selectedVideo && (
                <div style={{ marginBottom: '30px' }}>
                  <iframe width="100%" height="500px" style={{ borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id.videoId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
                  <h2 style={{ marginTop: '15px' }}>{selectedVideo.snippet.title}</h2>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {videos.map(v => (
                  <div key={v.id.videoId} onClick={() => {setSelectedVideo(v); window.scrollTo(0,0);}} style={{ cursor: 'pointer' }}>
                    <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} />
                    <h4 style={{ fontSize: '14px', marginTop: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.snippet.title}</h4>
                    <p style={{ color: '#aaa', fontSize: '12px' }}>{v.snippet.channelTitle}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // ZONA DE SELECCIÓN DE JUEGOS (Disimulada)
            <div>
              <h2 style={{ marginBottom: '20px' }}>Recursos de Estudio (V. 2.0)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                {gamesList.map(game => (
                  <div key={game.title} onClick={() => setActiveGame(game)} style={{ background: '#1e1e1e', padding: '20px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #333', textAlign: 'center', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#aaa'} onMouseOut={e => e.currentTarget.style.borderColor = '#333'}>
                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>📄</div> 
                    <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{game.title}</p>
                    <span style={{ fontSize: '10px', color: '#888' }}>Documento PDF</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: '30px', color: '#444', fontSize: '12px' }}>Presiona ESC para volver a Wikipedia inmediatamente.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
