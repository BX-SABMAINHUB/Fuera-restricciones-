import React, { useState, useEffect } from 'react';

const YOUTUBE_API_KEY = "AIzaSyB95ykqE8irTAT1CFMdevMlpKG64a7Q_Gw";

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube');
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);

  // URL OFICIAL DE XBOX QUE ME PEDISTE
  const xboxUrl = "https://www.xbox.com/es-ES/games/store/fortnite/BT5P2X999VH2/0001/9R22LC29Q28T";
  
  // Usamos un motor de renderizado que actúa como "espejo" para saltar el bloqueo de Microsoft
  // Esto permite que la web sea interactiva y los botones funcionen.
  const bypassUrl = `https://p7.itv.re/index.php?q=${btoa(xboxUrl)}`;

  const checkPass = (e) => {
    e.preventDefault();
    if (password.toUpperCase() === 'YT') setAuthorized(true);
    else { alert("Incorrecto"); setPassword(''); }
  };

  const activatePanic = () => { window.location.href = "https://faria.managebac.com/login"; };

  // PANTALLA DE CONTRASEÑA
  if (!authorized) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={checkPass} style={{ background: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
          <h3 style={{ color: '#fff', fontFamily: 'sans-serif' }}>ACCESO PRIVADO</h3>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: 'none' }} placeholder="Contraseña..." />
          <button type="submit" style={{ display: 'block', width: '100%', marginTop: '10px', padding: '10px', background: '#107C10', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>ENTRAR</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '60px', background: '#111', borderBottom: '2px solid #107C10' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setMode('youtube')} style={{ background: mode === 'youtube' ? '#333' : 'none', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>YouTube</button>
          <button onClick={() => setMode('xbox')} style={{ background: mode === 'xbox' ? '#107C10' : 'none', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🎮 XBOX STORE</button>
        </div>
        <button onClick={activatePanic} style={{ background: '#E00', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '5px', fontWeight: 'bold' }}>PÁNICO</button>
      </nav>

      <main style={{ height: 'calc(100vh - 60px)' }}>
        {mode === 'xbox' ? (
          <div style={{ width: '100%', height: '100%', background: '#fff' }}>
            <iframe 
              src={bypassUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              // Permite scripts y formularios (para comprar/obtener) pero BLOQUEA pestañas nuevas
              sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-modals"
              allow="autoplay; fullscreen; gamepad"
            />
          </div>
        ) : (
          /* MODO YOUTUBE (Simple para no ocupar código) */
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <input 
              placeholder="Busca videos..." 
              style={{ width: '80%', padding: '10px', borderRadius: '10px', border: '1px solid #333', background: '#111', color: '#fff' }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${e.target.value}&type=video&key=${YOUTUBE_API_KEY}`);
                  const data = await res.json();
                  setVideos(data.items || []);
                }
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {videos.map(v => (
                <div key={v.id.videoId} onClick={() => setSelected(`https://www.youtube-nocookie.com/embed/${v.id.videoId}?autoplay=1`)}>
                  <img src={v.snippet.thumbnails.high.url} style={{ width: '100%', borderRadius: '10px' }} />
                  <p style={{ fontSize: '12px' }}>{v.snippet.title}</p>
                </div>
              ))}
            </div>
            {selected && (
              <div style={{ position: 'fixed', top: 60, left: 0, width: '100%', height: 'calc(100vh - 60px)', background: '#000', zIndex: 1000 }}>
                <iframe src={selected} style={{ width: '100%', height: '90%', border: 'none' }} allowFullScreen />
                <button onClick={() => setSelected(null)} style={{ background: '#333', color: '#fff', border: 'none', padding: '10px 40px', borderRadius: '10px' }}>CERRAR</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
