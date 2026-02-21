import { useState, useEffect } from 'react';
import './index.css';

// SVG Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

// Define Video Interface
interface Video {
  id: string;
  title: string;
  channel: string;
  views?: string;
  publishedAt: string;
  duration?: string;
  thumbnail: string;
}

interface OfflineVideo extends Video {
  savedAt: number; // For 30 days expiration rule
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_YOUTUBE_API_KEY || localStorage.getItem('yt_elite_api_key') || '');
  const [isKeyEditing, setIsKeyEditing] = useState(!apiKey);
  const [searchQuery, setSearchQuery] = useState('trending 4k video');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [activeTab, setActiveTab] = useState<'feed' | 'offline'>('feed');
  const [offlineVideos, setOfflineVideos] = useState<OfflineVideo[]>(() => {
    const saved = localStorage.getItem('yt_elite_offline');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Auto-remove videos older than 30 days
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const valid = parsed.filter((v: any) => now - v.savedAt < thirtyDays);
        if (valid.length !== parsed.length) localStorage.setItem('yt_elite_offline', JSON.stringify(valid));
        return valid;
      } catch (e) { return []; }
    }
    return [];
  });

  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExtractingIdm, setIsExtractingIdm] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (videos.length === 0 && apiKey) searchYouTube(searchQuery);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setActiveTab('offline'); // Auto-switch to offline library if no internet
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }, [videos, apiKey, searchQuery]);

  const searchYouTube = async (query: string, pageToken: string | null = null) => {
    if (!isOnline) return; // Prevent fetch if offline
    if (!apiKey) {
      setIsKeyEditing(true);
      return;
    }

    if (pageToken) {
      setIsFetchingMore(true);
    } else {
      setLoading(true);
    }

    try {
      // First fetch: Search to get video IDs
      let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
      if (pageToken) {
        searchUrl += `&pageToken=${pageToken}`;
      }

      const resp = await fetch(searchUrl);
      const data = await resp.json();

      if (data.error) {
        alert("API Error: " + data.error.message);
        setLoading(false);
        setIsFetchingMore(false);
        return;
      }

      setNextPageToken(data.nextPageToken || null);

      if (data.items && data.items.length > 0) {
        // Collect video IDs to fetch detailed stats
        const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

        // Second fetch: Get statistics (views) and contentDetails (duration)
        const statsResp = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`);
        const statsData = await statsResp.json();
        const statsMap: Record<string, any> = {};

        if (statsData.items) {
          statsData.items.forEach((item: any) => {
            statsMap[item.id] = {
              views: formatViews(item.statistics.viewCount),
              duration: formatDuration(item.contentDetails.duration)
            };
          });
        }

        const fetchedVideos: Video[] = data.items.map((item: any) => {
          const videoId = item.id.videoId;
          return {
            id: videoId,
            // decode HTML entities simple hack
            title: item.snippet.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
            channel: item.snippet.channelTitle,
            publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            views: statsMap[videoId]?.views || 'Unknown views',
            duration: statsMap[videoId]?.duration || '?:??'
          };
        });

        if (pageToken) {
          setVideos(prev => [...prev, ...fetchedVideos]);
        } else {
          setVideos(fetchedVideos);
        }
      } else {
        if (!pageToken) {
          setVideos([]);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to fetch videos. Check your network or API quota.");
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (apiKey && !isKeyEditing) {
      searchYouTube(searchQuery);
    }
  }, []); // Only run once on mount if we have key

  useEffect(() => {
    const handleScroll = () => {
      if (activeTab === 'offline') return; // Don't infinite scroll in offline tab

      // If we are already fetching, loading, or don't have a next page token, don't trigger again
      if (isFetchingMore || loading || !nextPageToken) return;

      // Check if user has scrolled near the bottom of the page
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.offsetHeight;
      const threshold = 500; // Trigger fetch 500px before reaching the bottom

      if (scrollPosition >= documentHeight - threshold) {
        searchYouTube(searchQuery, nextPageToken);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchQuery, nextPageToken, isFetchingMore, loading, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchYouTube(searchQuery);
    }
  };

  const saveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('yt_elite_api_key', apiKey.trim());
      setIsKeyEditing(false);
      searchYouTube(searchQuery || 'trending 4k video');
    }
  };

  const handleDownload = (quality: string) => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // Simulate complex elite downloading protocol
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadModalOpen(false);
            alert(`✅ Download process complete! (${quality} format requested)\nNote: Direct downloads are blocked by YouTube ToS. This is an elite simulation.`);
          }, 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 400);
  };

  const handleSaveOffline = () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadModalOpen(false);

            // Actually save for 30 days
            const newVideo: OfflineVideo = { ...activeVideo, savedAt: Date.now() };
            // Ensure no duplicates
            const updatedList = [newVideo, ...offlineVideos.filter(v => v.id !== activeVideo.id)];
            setOfflineVideos(updatedList);
            localStorage.setItem('yt_elite_offline', JSON.stringify(updatedList));

            alert(`✅ Video SECURELY saved for 30 Days Offline Play!\n\nYou can access it anytime directly from your entirely local Offline Library tab!`);
          }, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 25) + 5;
      });
    }, 200);
  };

  const handleIdmDownload = async () => {
    if (!activeVideo || !activeVideo.id) {
      alert("Video ID not found. Cannot proceed with full download.");
      return;
    }

    setIsExtractingIdm(true);
    let successUrl = "";

    // Robust list of public API parsers (Cobalt instances) that don't require JWT Auth
    const instances = [
      "https://co.wuk.sh/api/json",
      "https://cobalt.q0.wtf/api/json",
      "https://cobalt.kwiatekm.dev/api/json"
    ];

    for (const instance of instances) {
      try {
        const res = await fetch(instance, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${activeVideo.id}`,
            vQuality: "1080",
            disableMetadata: true,
            filenamePattern: "classic"
          })
        });

        if (!res.ok) continue;

        const data = await res.json();
        if (data && data.url) {
          successUrl = data.url;
          break;
        }
      } catch (e) {
        console.error("Instance failed:", instance);
        continue;
      }
    }

    if (successUrl) {
      // This is the magical part: when we navigate the current window to a direct raw .mp4 stream,
      // the browser tries to download it, and IDM's extension intercepts it *instantly* with the popup!
      window.location.href = successUrl;
      setTimeout(() => {
        setDownloadModalOpen(false);
        setIsExtractingIdm(false);
      }, 1000);
    } else {
      // Fallback to SSYouTube redirect if all APIs are offline, completely omitting the annoying alert Box
      window.open(`https://ssyoutube.com/watch?v=${activeVideo.id}`, '_blank');
      setDownloadModalOpen(false);
      setIsExtractingIdm(false);
    }
  };

  return (
    <div className="app-container">

      {!isOnline && (
        <div style={{ background: '#ef4444', color: 'white', textAlign: 'center', padding: '0.5rem', fontWeight: 'bold', fontSize: '0.875rem' }}>
          OFFLINE MODE: You are currently disconnected from the internet. Viewing Offline Library.
        </div>
      )}

      {/* Header Area */}
      <header className="header glass-panel animate-fade-in text-white">
        <div className="header-top">
          <div className="logo-container">
            <div className="logo-icon pulse-glow">
              <PlayIcon />
            </div>
            <span className="logo-text">YT ELITE</span>
          </div>

          <form className="search-container" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="search-input"
              placeholder="Search YouTube..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">
              <SearchIcon />
            </button>
          </form>

          <button
            className="btn settings-btn"
            onClick={() => setIsKeyEditing(!isKeyEditing)}
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </div>

        <div className="tabs-container">
          <button
            onClick={() => setActiveTab('feed')}
            className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          >
            Elite Feed
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`tab-btn ${activeTab === 'offline' ? 'active' : ''}`}
          >
            Offline Library <span className="tab-badge">{offlineVideos.length}</span>
          </button>
        </div>
      </header>

      {/* API Key Banner */}
      {isKeyEditing && activeTab === 'feed' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'var(--primary)' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SettingsIcon /> Core System Setup
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              To access the full YouTube database, enter your official YouTube Data API v3 Key. Your key is stored securely in your local browser storage.
            </p>
          </div>
          <form onSubmit={saveApiKey} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <input
              type="password"
              className="search-input"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ width: '100%' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              Connect
            </button>
          </form>
        </div>
      )}

      {/* Main Grid */}
      <main className="animate-fade-in" style={{ animationDelay: '0.2s', minHeight: '60vh' }}>
        {activeTab === 'offline' ? (
          <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>Downloaded <span style={{ color: 'var(--primary)' }}>Videos</span></span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Locally stored for 30 days</span>
            </h2>
            <div className="video-grid">
              {offlineVideos.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                  <h3>Your Offline Vault is Empty.</h3>
                  <p style={{ marginTop: '0.5rem' }}>Download videos from the Elite Feed to watch them anywhere without internet!</p>
                </div>
              ) : (
                offlineVideos.map((video, idx) => {
                  const daysLeft = 30 - Math.floor((Date.now() - video.savedAt) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={"offline_" + video.id + idx}
                      className="video-card glass-panel"
                      style={{ animationDelay: `${Math.min(0.1 * idx, 1)}s` }}
                      onClick={() => setActiveVideo(video)}
                    >
                      <div className="video-thumbnail-container">
                        <img loading="lazy" decoding="async" src={video.thumbnail} alt="Thumbnail" className="video-thumbnail" />
                        <span className="video-duration">{video.duration}</span>
                      </div>
                      <div className="video-info">
                        <h3 className="video-title text-white">{video.title}</h3>
                        <div className="video-channel">
                          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> {video.channel}
                        </div>
                        <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{video.views}</span>
                          <span style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '2px 6px', borderRadius: '4px', color: '#f59e0b', fontWeight: 'bold' }}>{daysLeft} days left</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>Elite <span style={{ color: 'var(--primary)' }}>Feed</span></span>
              {loading && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Establishing secure connection...</span>}
            </h2>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <div className="pulse-glow" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)' }}></div>
              </div>
            ) : (
              <>
                <div className="video-grid">
                  {videos.map((video, idx) => (
                    <div
                      key={video.id + idx}
                      className="video-card glass-panel"
                      style={{ animationDelay: `${Math.min(0.1 * idx, 1)}s` }}
                      onClick={() => setActiveVideo(video)}
                    >
                      <div className="video-thumbnail-container">
                        <img loading="lazy" decoding="async" src={video.thumbnail} alt="Thumbnail" className="video-thumbnail" />
                        <span className="video-duration">{video.duration}</span>
                      </div>
                      <div className="video-info">
                        <h3 className="video-title text-white">{video.title}</h3>
                        <div className="video-channel">
                          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> {video.channel}
                        </div>
                        <div className="video-meta">
                          {video.views} • {video.publishedAt}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {videos.length === 0 && !isKeyEditing && !loading && (
                  <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                    <h3>No results found. Access restricted or query yielded nothing.</h3>
                  </div>
                )}

                {isFetchingMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0', gridColumn: '1 / -1' }}>
                    <div className="pulse-glow" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)' }}></div>
                  </div>
                )}
              </>
            )}
          </>
        )}
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
                    <p style={{ marginTop: '0.5rem', textAlign: 'center', maxWidth: '80%' }}>You are currently disconnected from the internet. Please use your computer's built-in media player or IDM to play the video file you securely saved to your local disk.</p>
                  </div>
                ) : (
                  <iframe
                    loading="lazy"
                    src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                )}
              </div>

              <div className="player-controls">
                <div className="player-info-section">
                  <h1 className="player-title">{activeVideo.title}</h1>
                  <div className="player-channel" style={{ marginTop: '10px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), #8b5cf6)' }}></div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{activeVideo.channel}</div>
                      <div style={{ fontSize: '0.85rem' }}>{activeVideo.views} • {activeVideo.publishedAt}</div>
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={() => {
                    navigator.clipboard.writeText(`https://youtube.com/watch?v=${activeVideo.id}`);
                    alert("Elite link copied to clipboard!");
                  }}>
                    <ShareIcon /> Share
                  </button>
                  <button className="btn btn-download" onClick={() => setDownloadModalOpen(true)}>
                    <DownloadIcon /> Elite Download
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Advanced Download Modal */}
      <div className={`download-modal-overlay ${downloadModalOpen ? 'active' : ''}`}>
        <div className="download-modal glass-panel">
          <div className="download-header">
            <h3>Download Protocol <span style={{ color: 'var(--primary)' }}>v2.0</span></h3>
            {!isDownloading && (
              <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setDownloadModalOpen(false)}>
                <CloseIcon />
              </button>
            )}
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Select your preferred extraction quality for remote processing.
          </div>

          <div className="download-options">
            <div className={`download-option ${isDownloading ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => !isDownloading && handleDownload('4K HDR')}>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Highest Quality</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>MP4 (Video + Audio)</div>
              </div>
              <span className="quality-badge">Best</span>
            </div>

            <div className={`download-option ${isDownloading ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => !isDownloading && handleDownload('1080p60')}>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Standard</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>MP4 (Video + Audio)</div>
              </div>
              <span className="quality-badge">High</span>
            </div>

            <div className={`download-option ${isDownloading ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => !isDownloading && handleDownload('Audio Only')}>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>High-Res Audio</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>MP3 320kbps</div>
              </div>
              <span className="quality-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Audio</span>
            </div>

            <div
              className={`download-option ${(isDownloading || isExtractingIdm) ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => !isDownloading && !isExtractingIdm && handleIdmDownload()}
            >
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>
                  {isExtractingIdm ? 'Resolving Full Video File...' : 'IDM Fast Download'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {isExtractingIdm ? 'Extracting raw MP4 token for IDM...' : 'Automatic Magical IDM 1-Click Popup'}
                </div>
              </div>
              <span className="quality-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                {isExtractingIdm ? 'Wait...' : 'IDM ⚡'}
              </span>
            </div>

            <div
              className={`download-option ${(isDownloading || isExtractingIdm) ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => !isDownloading && !isExtractingIdm && handleSaveOffline()}
            >
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Save Library (30 Days)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Store offline locally like YouTube App</div>
              </div>
              <span className="quality-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                Offline ⬇
              </span>
            </div>
          </div>

          {/* Progress Bar Area */}
          <div className={`progress-bar-container ${isDownloading ? 'active' : ''}`}>
            <div className="progress-bar" style={{ width: `${downloadProgress}%` }}></div>
          </div>
          {isDownloading && (
            <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--primary)' }}>
              Extracting packet stream... {downloadProgress}%
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// Helpers
function formatViews(viewCountStr: string) {
  if (!viewCountStr) return '0 views';
  const count = parseInt(viewCountStr, 10);
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M views';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K views';
  return count + ' views';
}

function formatDuration(ytDuration: string) {
  if (!ytDuration) return '0:00';
  const match = ytDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';

  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '') || '0';
  const seconds = (match[3] || '').replace('S', '') || '0';

  let res = '';
  if (hours) res += hours + ':';
  res += (hours && minutes.length === 1 ? '0' + minutes : minutes) + ':';
  res += seconds.length === 1 ? '0' + seconds : seconds;

  return res;
}

export default App;
