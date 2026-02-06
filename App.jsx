import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, ref, onValue, set, remove, serverTimestamp, onDisconnect, update 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURACIÓN FIREBASE (OFICIAL DE ALEXHUB) ---
const firebaseConfig = {
  apiKey: "AIzaSyD1zUmhiUVDv-ZYyJF7vTwGaS1AO9t9jiE",
  authDomain: "alexhub-eefdf.firebaseapp.com",
  databaseURL: "https://alexhub-eefdf-default-rtdb.firebaseio.com",
  projectId: "alexhub-eefdf",
  storageBucket: "alexhub-eefdf.firebasestorage.app",
  messagingSenderId: "463204402982",
  appId: "1:463204402982:web:fe740a662fbfd50452a3e7",
  measurementId: "G-M8KSGN3WX9"
};

// Inicialización de servicios
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configuración Maestra
const YOUTUBE_API_KEY = "AIzaSyCCw9ZJj79A-eCb92vtampviKGrZhwpjtk";
const PANIC_URL = "https://faria.managebac.com/login";
const ADMIN_PASS = "Alex2706";

export default function AlexHubUltraV13() {
    // --- ESTADOS DE AUTENTICACIÓN Y SEGURIDAD ---
    const [user, setUser] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isBanned, setIsBanned] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // --- ESTADOS DE BASE DE DATOS ---
    const [whitelist, setWhitelist] = useState([]);
    const [blacklist, setBlacklist] = useState([]);
    const [premiumUsers, setPremiumUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});

    // --- UI Y NAVEGACIÓN ---
    const [mode, setMode] = useState('youtube');
    const [query, setQuery] = useState('');
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [transitioning, setTransitioning] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- ADMIN PANEL STATES ---
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassInput, setAdminPassInput] = useState('');
    const [megaFrameOpen, setMegaFrameOpen] = useState(false);
    const [adminTab, setAdminTab] = useState('access'); // access, ban, premium
    const [newInput, setNewInput] = useState('');

    // ==========================================
    // 1. LÓGICA DE SEGURIDAD Y FIREBASE
    // ==========================================

    useEffect(() => {
        // Escuchar cambios de Auth de Google
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                checkUserPermissions(currentUser);
            } else {
                setUser(null);
                setIsAuthorized(false);
                setAuthLoading(false);
            }
        });

        // Cargar Listas de Control (Whitelist, Blacklist, Premium)
        onValue(ref(db, 'security/whitelist'), (snapshot) => {
            const data = snapshot.val();
            setWhitelist(data ? Object.values(data) : []);
        });

        onValue(ref(db, 'security/blacklist'), (snapshot) => {
            const data = snapshot.val();
            setBlacklist(data ? Object.values(data) : []);
        });

        onValue(ref(db, 'premium_users'), (snapshot) => {
            const data = snapshot.val();
            setPremiumUsers(data ? Object.values(data) : []);
        });

        // Usuarios Online
        onValue(ref(db, 'online'), (snapshot) => {
            setOnlineUsers(snapshot.val() || {});
        });

        return () => unsubscribeAuth();
    }, []);

    const checkUserPermissions = (currentUser) => {
        const email = currentUser.email.toLowerCase();
        
        // 1. Ver Blacklist
        onValue(ref(db, `security/blacklist`), (snapshot) => {
            const bans = snapshot.val() ? Object.values(snapshot.val()) : [];
            if (bans.includes(email)) {
                setIsBanned(true);
                setIsAuthorized(false);
                setAuthLoading(false);
                return;
            }

            // 2. Ver Whitelist
            onValue(ref(db, `security/whitelist`), (whiteSnap) => {
                const white = whiteSnap.val() ? Object.values(whiteSnap.val()) : [];
                
                // Si la whitelist está vacía, permitimos entrar para no quedar bloqueados fuera la primera vez
                // Pero si hay correos, solo esos entran.
                if (white.length === 0 || white.includes(email)) {
                    setUser(currentUser);
                    setIsAuthorized(true);
                    
                    // Registro Online
                    const myOnlineRef = ref(db, `online/${currentUser.uid}`);
                    set(myOnlineRef, {
                        name: currentUser.displayName,
                        email: currentUser.email,
                        photo: currentUser.photoURL,
                        lastSeen: serverTimestamp()
                    });
                    onDisconnect(myOnlineRef).remove();
                } else {
                    setAuthError("No tienes permiso de acceso. Contacta con Alex.");
                    signOut(auth);
                }
                setAuthLoading(false);
            });
        });
    };

    // --- ACCIÓN DE LOGIN GOOGLE ---
    const handleGoogleLogin = async () => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            // Esto abre el popup oficial de Google
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error en Login:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                setAuthError("Has cerrado la ventana de Google antes de terminar.");
            } else {
                setAuthError("Error conectando con Google. Revisa tu conexión.");
            }
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        signOut(auth);
    };

    // ==========================================
    // 2. SISTEMA ADMINISTRATIVO (MEGA FRAME)
    // ==========================================

    const verifyAdmin = (e) => {
        e.preventDefault();
        if (adminPassInput === ADMIN_PASS) {
            setMegaFrameOpen(true);
            setShowAdminLogin(false);
            setAdminPassInput('');
        } else {
            alert("CONTRASEÑA INCORRECTA - ACCESO DENEGADO");
        }
    };

    const handleAdminAction = (actionType) => {
        if (!newInput) return;
        const cleanInput = newInput.trim().toLowerCase();
        let path = '';

        switch (actionType) {
            case 'ADD_WHITE': path = 'security/whitelist'; break;
            case 'ADD_BAN': path = 'security/blacklist'; break;
            case 'ADD_PREMIUM': path = 'premium_users'; break;
        }

        const newRef = ref(db, `${path}/${Date.now()}`);
        set(newRef, cleanInput);
        setNewInput('');
    };

    const removeAdminItem = (listPath, value) => {
        onValue(ref(db, listPath), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const keyToDelete = Object.keys(data).find(key => data[key] === value);
                if (keyToDelete) {
                    remove(ref(db, `${listPath}/${keyToDelete}`));
                }
            }
        }, { onlyOnce: true });
    };

    // ==========================================
    // 3. FUNCIONES DE CONTENIDO (YOUTUBE, ETC)
    // ==========================================

    const performSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query || mode !== 'youtube') return;
        setLoading(true);
        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            setVideos(data.items || []);
            setSelectedVideo(null);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const changeMode = (newMode) => {
        setTransitioning(true);
        setTimeout(() => {
            setMode(newMode);
            setTransitioning(false);
        }, 800);
    };

    // ==========================================
    // 4. RENDERS
    // ==========================================

    if (isBanned) return (
        <div style={styles.fullCenter}>
            <div style={styles.errorCard}>
                <h1 style={styles.glitch}>BANNED</h1>
                <p>Tu correo electrónico ha sido vetado del sistema.</p>
                <button onClick={() => window.location.reload()} style={styles.loginBtn}>REINTENTAR</button>
            </div>
        </div>
    );

    if (!isAuthorized) return (
        <div style={styles.loginPage}>
            <div style={styles.loginCard}>
                <h1 style={styles.glitch}>ALEX HUB <span style={{color: '#E50914'}}>V13</span></h1>
                <p style={styles.loginSubtitle}>SISTEMA DE ACCESO ULTRA SEGURO</p>
                
                {authError && <div style={styles.errorMsg}>{authError}</div>}
                
                <button 
                    onClick={handleGoogleLogin} 
                    style={styles.googleBtn}
                    disabled={authLoading}
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" style={{width: 20}} />
                    {authLoading ? 'CONECTANDO...' : 'Log in with Google'}
                </button>

                <div style={{marginTop: '30px'}}>
                    <button onClick={() => setShowAdminLogin(true)} style={styles.alexSecretBtn}>ALEX</button>
                </div>
            </div>

            {/* MODAL PASSWORD ADMIN */}
            {showAdminLogin && (
                <div style={styles.modalOverlay}>
                    <div style={styles.adminPassCard}>
                        <h2>SISTEMA DE CONTROL</h2>
                        <form onSubmit={verifyAdmin}>
                            <input 
                                type="password" 
                                placeholder="CONTRASEÑA MAESTRA" 
                                value={adminPassInput}
                                onChange={e => setAdminPassInput(e.target.value)}
                                style={styles.adminInput}
                                autoFocus
                            />
                            <div style={{display: 'flex', gap: 10}}>
                                <button type="submit" style={styles.confirmBtn}>ENTRAR</button>
                                <button type="button" onClick={() => setShowAdminLogin(false)} style={styles.cancelBtn}>CANCELAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MEGA FRAME ADMIN (GIGANTE) */}
            {megaFrameOpen && (
                <div style={styles.megaFrame}>
                    <div style={styles.megaHeader}>
                        <h1>ALEX HUB COMMAND CENTER</h1>
                        <button onClick={() => setMegaFrameOpen(false)} style={styles.closeMegaBtn}>CERRAR SISTEMA</button>
                    </div>
                    <div style={styles.megaBody}>
                        <div style={styles.megaSidebar}>
                            <button onClick={() => setAdminTab('access')} style={adminTab === 'access' ? styles.tabActive : styles.tab}>ACCESO (WHITE)</button>
                            <button onClick={() => setAdminTab('ban')} style={adminTab === 'ban' ? styles.tabActive : styles.tab}>BLOQUEO (BAN)</button>
                            <button onClick={() => setAdminTab('premium')} style={adminTab === 'premium' ? styles.tabActive : styles.tab}>PREMIUM</button>
                            <button onClick={() => setAdminTab('online')} style={adminTab === 'online' ? styles.tabActive : styles.tab}>ONLINE</button>
                        </div>
                        <div style={styles.megaContent}>
                            <div style={styles.actionRow}>
                                <input 
                                    placeholder={adminTab === 'premium' ? "Nombre de usuario..." : "Correo electrónico..."}
                                    value={newInput}
                                    onChange={e => setNewInput(e.target.value)}
                                    style={styles.megaInput}
                                />
                                <button 
                                    onClick={() => handleAdminAction(adminTab === 'access' ? 'ADD_WHITE' : adminTab === 'ban' ? 'ADD_BAN' : 'ADD_PREMIUM')}
                                    style={styles.addBtn}
                                >
                                    AGREGAR A LA LISTA
                                </button>
                            </div>

                            <div style={styles.dataGrid}>
                                {adminTab === 'access' && whitelist.map(email => (
                                    <div key={email} style={styles.dataItem}>
                                        <span>{email}</span>
                                        <button onClick={() => removeAdminItem('security/whitelist', email)}>ELIMINAR</button>
                                    </div>
                                ))}
                                {adminTab === 'ban' && blacklist.map(email => (
                                    <div key={email} style={styles.dataItemBan}>
                                        <span>{email}</span>
                                        <button onClick={() => removeAdminItem('security/blacklist', email)}>DESBANEAR</button>
                                    </div>
                                ))}
                                {adminTab === 'premium' && premiumUsers.map(name => (
                                    <div key={name} style={styles.dataItemPremium}>
                                        <span>👑 {name}</span>
                                        <button onClick={() => removeAdminItem('premium_users', name)}>QUITAR</button>
                                    </div>
                                ))}
                                {adminTab === 'online' && Object.values(onlineUsers).map(u => (
                                    <div key={u.email} style={styles.dataItemOnline}>
                                        <img src={u.photo} style={{width: 30, borderRadius: '50%'}} />
                                        <span>{u.name} ({u.email})</span>
                                        <span style={{color: '#00ff00'}}>● ONLINE</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div style={styles.appContainer}>
            {transitioning && <div style={styles.transitionOverlay}><div className="loader"></div></div>}
            
            <nav style={styles.navbar}>
                <div style={styles.navLeft}>
                    <div style={styles.logo}>ALEX<span>HUB</span></div>
                    <div style={styles.navTabs}>
                        {['youtube', 'twitch', 'movies', 'xbox'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => changeMode(t)}
                                style={mode === t ? styles.navTabActive : styles.navTab}
                            >
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.navRight}>
                    <form onSubmit={performSearch} style={styles.searchBox}>
                        <input 
                            placeholder="Buscar contenido..." 
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </form>
                    <div style={styles.userProfile}>
                        <img src={user.photoURL} style={styles.avatar} />
                        <button onClick={handleLogout} style={styles.logoutBtn}>SALIR</button>
                    </div>
                    <button onClick={() => window.location.href = PANIC_URL} style={styles.panicBtn}>PANIC</button>
                </div>
            </nav>

            <main style={styles.content}>
                {mode === 'youtube' && (
                    <div style={styles.youtubeGrid}>
                        {selectedVideo ? (
                            <div style={styles.videoPlayer}>
                                <iframe 
                                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`}
                                    allowFullScreen
                                />
                                <button onClick={() => setSelectedVideo(null)} style={styles.closeVideo}>X CERRAR REPRODUCTOR</button>
                            </div>
                        ) : (
                            videos.map(v => (
                                <div key={v.id.videoId} style={styles.videoCard} onClick={() => setSelectedVideo(v.id.videoId)}>
                                    <img src={v.snippet.thumbnails.high.url} />
                                    <h3>{v.snippet.title}</h3>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {mode === 'twitch' && (
                    <iframe src={`https://player.twitch.tv/?channel=${query || 'ibai'}&parent=${window.location.hostname}`} style={styles.fullIframe} />
                )}

                {mode === 'movies' && (
                    <iframe src={`https://www.google.com/search?q=${query}+pelicula+online+gratis&igu=1`} style={styles.fullIframe} />
                )}

                {mode === 'xbox' && (
                    <iframe src="https://www.xbox.com/play" style={styles.fullIframe} />
                )}
            </main>

            {premiumUsers.length > 0 && (
                <div style={styles.premiumTicker}>
                    <span>USUARIOS PREMIUM: </span>
                    {premiumUsers.join(' • ')}
                </div>
            )}
        </div>
    );
}

// ==========================================
// ESTILOS MASIVOS (CSS-IN-JS)
// ==========================================
const styles = {
    fullCenter: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' },
    loginPage: { height: '100vh', background: 'radial-gradient(circle, #1a1a1a 0%, #000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    loginCard: { background: 'rgba(255,255,255,0.05)', padding: '50px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center', backdropFilter: 'blur(10px)', width: '400px' },
    glitch: { fontSize: '40px', fontWeight: '900', letterSpacing: '5px', marginBottom: '10px' },
    loginSubtitle: { color: '#666', fontSize: '12px', letterSpacing: '2px', marginBottom: '40px' },
    googleBtn: { width: '100%', padding: '15px', background: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
    alexSecretBtn: { background: 'transparent', border: 'none', color: '#222', fontSize: '10px', cursor: 'pointer' },
    errorMsg: { background: 'rgba(229, 9, 20, 0.2)', color: '#E50914', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontSize: '13px' },
    
    // Admin Styles
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    adminPassCard: { background: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #E50914', width: '300px' },
    adminInput: { width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', marginBottom: '20px', borderRadius: '5px' },
    confirmBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
    cancelBtn: { background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },

    megaFrame: { position: 'fixed', inset: '20px', background: '#0a0a0a', zIndex: 200, borderRadius: '20px', border: '2px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    megaHeader: { padding: '20px 40px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' },
    closeMegaBtn: { background: '#E50914', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    megaBody: { flex: 1, display: 'flex' },
    megaSidebar: { width: '250px', background: '#080808', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', padding: '20px' },
    tab: { padding: '15px', textAlign: 'left', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontWeight: 'bold' },
    tabActive: { padding: '15px', textAlign: 'left', background: '#1a1a1a', border: 'none', color: '#E50914', cursor: 'pointer', fontWeight: 'bold', borderLeft: '4px solid #E50914' },
    megaContent: { flex: 1, padding: '40px', overflowY: 'auto' },
    actionRow: { display: 'flex', gap: '15px', marginBottom: '30px' },
    megaInput: { flex: 1, background: '#000', border: '1px solid #333', padding: '15px', color: '#fff', borderRadius: '8px' },
    addBtn: { background: '#00ff41', color: '#000', border: 'none', padding: '0 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    dataGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
    dataItem: { background: '#111', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid #222' },
    dataItemBan: { background: 'rgba(229,9,20,0.1)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid #E50914' },
    dataItemPremium: { background: 'rgba(255,215,0,0.1)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid #FFD700' },
    dataItemOnline: { background: '#111', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' },

    // App Styles
    appContainer: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff' },
    navbar: { height: '70px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #1a1a1a' },
    logo: { fontSize: '24px', fontWeight: 'bold' },
    navTabs: { display: 'flex', gap: '20px', marginLeft: '40px' },
    navTab: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontWeight: 'bold' },
    navTabActive: { background: 'none', border: 'none', color: '#E50914', cursor: 'pointer', fontWeight: 'bold' },
    searchBox: { background: '#111', borderRadius: '20px', padding: '8px 20px', width: '300px' },
    avatar: { width: '35px', height: '35px', borderRadius: '50%', border: '2px solid #E50914' },
    logoutBtn: { background: 'none', border: 'none', color: '#E50914', fontSize: '10px', cursor: 'pointer' },
    panicBtn: { background: '#fff', color: '#000', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },

    content: { flex: 1, overflow: 'hidden', padding: '20px' },
    youtubeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', height: '100%', overflowY: 'auto' },
    videoCard: { background: '#111', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', transition: '0.3s' },
    videoPlayer: { gridColumn: '1 / -1', height: '80vh', position: 'relative' },
    fullIframe: { width: '100%', height: '100%', border: 'none' },
    closeVideo: { position: 'absolute', top: '-40px', right: 0, background: '#E50914', border: 'none', color: '#fff', padding: '10px', borderRadius: '5px', cursor: 'pointer' },
    transitionOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    premiumTicker: { background: 'linear-gradient(90deg, #FFD700, #DAA520)', color: '#000', padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }
};

// Loader CSS
if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        .loader { border: 4px solid #111; border-top: 4px solid #E50914; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        * { box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #E50914; }
    `;
    document.head.appendChild(styleTag);
}
