import { useState, useEffect } from 'react';
import StudyMode from './StudyMode';
import './index.css';

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeVideo, setActiveVideo] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto landscape when video goes fullscreen (like YouTube on mobile)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement;

      if (fsEl) {
        // Entered fullscreen → lock to landscape
        try {
          const orientation = screen.orientation as any;
          if (orientation?.lock) {
            orientation.lock('landscape').catch(() => { });
          } else if ((screen as any).lockOrientation) {
            (screen as any).lockOrientation('landscape');
          } else if ((screen as any).mozLockOrientation) {
            (screen as any).mozLockOrientation('landscape');
          } else if ((screen as any).msLockOrientation) {
            (screen as any).msLockOrientation('landscape');
          }
        } catch (e) { /* orientation lock not supported */ }
      } else {
        // Exited fullscreen → unlock orientation
        try {
          const orientation = screen.orientation as any;
          if (orientation?.unlock) {
            orientation.unlock();
          } else if ((screen as any).unlockOrientation) {
            (screen as any).unlockOrientation();
          } else if ((screen as any).mozUnlockOrientation) {
            (screen as any).mozUnlockOrientation();
          } else if ((screen as any).msUnlockOrientation) {
            (screen as any).msUnlockOrientation();
          }
        } catch (e) { /* orientation unlock not supported */ }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="app-container">
      {!isOnline && (
        <div style={{ background: '#ef4444', color: 'white', textAlign: 'center', padding: '0.5rem', fontWeight: 'bold', fontSize: '0.875rem', borderRadius: '8px', marginBottom: '1rem' }}>
          OFFLINE MODE: You are currently disconnected from the internet.
        </div>
      )}

      {/* Header Area */}
      <header className="header glass-panel animate-fade-in text-white" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div className="header-top" style={{ justifyContent: 'center' }}>
          <div className="logo-container">
            <div className="logo-icon pulse-glow">
              <PlayIcon />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{
                fontFamily: "'Hind Siliguri', sans-serif",
                fontSize: '1.4rem',
                fontWeight: 700,
                background: 'linear-gradient(to right, #fff, #93c5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>তালুকদার পাঠশালা</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
                Talukdar Pathshala
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="animate-fade-in" style={{ animationDelay: '0.1s', minHeight: '60vh' }}>
        <StudyMode setActiveVideo={setActiveVideo} />
      </main>

      {/* Custom Video Player Overlay */}
      <div className={`player-overlay ${activeVideo ? 'active' : ''}`}>
        {activeVideo && (
          <>
            <button className="close-player" onClick={() => setActiveVideo(null)}>
              <CloseIcon />
            </button>

            <div className="player-container">
              <div className="video-wrapper">
                {!isOnline ? (
                  <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <PlayIcon />
                    <h2 style={{ color: 'white', marginTop: '1rem', textAlign: 'center' }}>Offline Playback</h2>
                    <p style={{ marginTop: '0.5rem', textAlign: 'center', maxWidth: '80%' }}>Connect to the internet to watch this class.</p>
                  </div>
                ) : (
                  <iframe
                    loading="lazy"
                    src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&fs=1&enablejsapi=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    webkit-playsinline="true"
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%', height: '100%',
                      border: 'none',
                    }}
                  ></iframe>
                )}
              </div>

              <div className="player-controls">
                <div className="player-info-section">
                  <h1 className="player-title">{activeVideo.title}</h1>
                  <div className="player-channel" style={{ marginTop: '10px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), #8b5cf6)', flexShrink: 0 }}></div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{activeVideo.channel}</div>
                      <div style={{ fontSize: '0.85rem' }}>{activeVideo.views} • {activeVideo.publishedAt}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
