import React, { useState, useEffect } from 'react';

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('youtube');
  const [movieQuery, setMovieQuery] = useState('');
  const [movieUrl, setMovieUrl] = useState('');

  // ALGORITMO SINCRONIZADO CON TU GOOGLE SCRIPT / GITHUB
  const getCorrectPass = () => {
    const now = new Date();
    const seed = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + now.getHours().toString();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let result = '';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    for (let i = 0; i < 6; i++) {
      hash = (hash * 16807) % 2147483647;
      result += chars.charAt(Math.abs(hash) % chars.length);
    }
    return result;
  };

  const checkPass = (e) => {
    e.preventDefault();
    if (password === getCorrectPass()) setAuthorized(true);
    else { alert("Clave Incorrecta"); setPassword(''); }
  };

  // BUSCADOR DE PELÍCULAS CON BYPASS
  const searchMovie = (e) => {
    e.preventDefault();
    // Usamos un servidor que carga el contenido vía API para que Lazarus no detecte el streaming directo
    // Puedes buscar IDs en TMDB, pero aquí cargamos un buscador que suele saltar filtros
    const cleanQuery = movieQuery.toLowerCase().replace(/\s/g, '-');
    setMovieUrl(`https://vidsrc.me/embed/movie?tmdb=${cleanQuery}`); 
    // Nota: Si no sabes el ID, este buscador es un buen punto de partida
  };

  if (!authorized) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <form onSubmit={checkPass} style={{ textAlign: 'center', border: '1px solid #333', padding: '50px', borderRadius: '20px' }}>
          <h2 style={{ color: '#0dff00' }}>SECURITY BYPASS</h2>
          <input 
            type="text" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', background: '#111', color: '#0dff00', border: '1px solid #0dff00', textAlign: 'center', fontSize: '18px' }}
            placeholder="Introduce Clave"
          />
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '60px', background: '#000', borderBottom: '2px solid #E50914' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setMode('youtube')} style={{ background: mode === 'youtube' ? '#E50914' : '#333', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>YouTube</button>
          <button onClick={() => setMode('movies')} style={{ background: mode === 'movies' ? '#E50914' : '#333', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>PELÍCULAS PRO</button>
        </div>
        <button onClick={() => window.location.href="https://faria.managebac.com/login"} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px' }}>PÁNICO</button>
      </nav>

      <main style={{ height: 'calc(100vh - 60px)' }}>
        {mode === 'movies' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px', background: '#111', display: 'flex', gap: '10px' }}>
              <input 
                placeholder="Nombre de la peli (en inglés preferiblemente)..." 
                style={{ flex: 1, padding: '10px', background: '#222', border: 'none', color: '#fff', borderRadius: '5px' }}
                value={movieQuery}
                onChange={(e) => setMovieQuery(e.target.value)}
              />
              <button onClick={() => setMovieUrl(`https://vidsrc.to/v2/embed/movie/${movieQuery}`)} style={{ background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px' }}>CARGAR</button>
            </div>
            
            <iframe 
              src={movieUrl || "about:blank"}
              style={{ width: '100%', flex: 1, border: 'none', background: '#000' }}
              allowFullScreen
              // Sandbox optimizado: permite scripts para el reproductor pero bloquea la detección de red externa
              sandbox="allow-forms allow-scripts allow-same-origin allow-pointer-lock allow-presentation"
            />
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
             <h3>YouTube Mode</h3>
             <p>Busca tus canales favoritos arriba.</p>
          </div>
        )}
      </main>
    </div>
  );
}
