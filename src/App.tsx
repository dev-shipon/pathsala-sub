import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import StudyMode from './StudyMode';
import Login from './components/Auth/Login';
import PendingApproval from './components/Auth/PendingApproval';
import Subscription from './components/Auth/Subscription';
import AdminPanel from './components/Admin/AdminPanel';
import Logo from './components/UI/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

function AppContent() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<any[]>([]);
  const [activeMobileTab, setActiveMobileTab] = useState<'notes' | 'playlist'>('notes');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  const handlePlanSelect = async (plan: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const updateData = {
      subscription: plan,
      status: plan === 'basic' ? 'approved' : 'pending',
      updatedAt: new Date().toISOString()
    };
    await updateDoc(userDocRef, updateData);
    setUserData({ ...userData, ...updateData });
  };

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          const newUserData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            status: 'new',
            subscription: null,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newUserData);
          setUserData(newUserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="flex flex-col items-center gap-6">
          <Logo className="h-16" />
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-full h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      <Route path="/" element={
        !user ? <Navigate to="/login" /> :
        (userData?.status === 'new' || !userData?.subscription) ? <Subscription onComplete={handlePlanSelect} /> :
        (userData?.status === 'pending') ? <PendingApproval /> :
        (
          <div className="relative min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30 overflow-x-hidden">
            {!isOnline && (
              <motion.div 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 z-[100] bg-red-500/20 backdrop-blur-md border-b border-red-500/30 text-red-400 text-center py-2 text-[10px] font-bold uppercase tracking-[0.3em]"
              >
                Offline Connection Detected
              </motion.div>
            )}

            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/[0.05] rounded-full blur-[140px]"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/[0.05] rounded-full blur-[140px]"></div>
            </div>

            <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
              <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
                <div className="cursor-pointer" onClick={() => navigate('/')}>
                  <Logo className="h-8" />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-4 py-1.5 px-4 bg-white/[0.03] border border-white/5 rounded-full backdrop-blur-md">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-[10px] border border-blue-500/20">
                      {user.displayName?.[0] || 'U'}
                    </div>
                    <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{user.displayName}</span>
                  </div>
                  <button 
                    onClick={() => auth.signOut()}
                    className="px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-xl text-[9px] font-bold text-slate-400 hover:text-red-400 transition-all active:scale-95 uppercase tracking-widest"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in">
              <StudyMode setActiveVideo={(v, playlist) => {
                setActiveVideo(v);
                setCurrentPlaylist(playlist || []);
                setActiveMobileTab('notes');
              }} />
            </main>

            {/* ULTRA-MODERN PLAYER OVERLAY */}
            <AnimatePresence>
              {activeVideo && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-[#020617] flex flex-col overflow-hidden"
                >
                  {/* Ambient Background Effect */}
                  <div className="absolute inset-0 pointer-events-none z-0">
                    <img 
                      src={`https://img.youtube.com/vi/${activeVideo.id}/maxresdefault.jpg`} 
                      className="w-full h-full object-cover opacity-20 blur-[100px] scale-150"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/80"></div>
                  </div>

                  {/* Header */}
                  <div className="relative z-10 h-16 border-b border-white/5 px-4 md:px-8 flex items-center justify-between backdrop-blur-xl bg-black/20">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-600 rounded text-[8px] font-bold text-white uppercase tracking-widest">Playing Now</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{activeVideo.subTitle}</span>
                      </div>
                      <h2 className="text-base md:text-lg font-bold text-white truncate max-w-sm md:max-w-2xl">{activeVideo.title}</h2>
                    </div>
                    <button 
                      onClick={() => setActiveVideo(null)} 
                      className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group"
                    >
                      <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white">Exit Cinema</span>
                      <CloseIcon />
                    </button>
                  </div>

                  {/* Main Content View */}
                  <div className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Side: Video Player & Tabs */}
                    <div className="flex-[1.5] flex flex-col overflow-hidden">
                      {/* Video Container - Fixed Height on Large Screens to prevent pushing notes off-screen */}
                      <div className="relative w-full bg-black lg:bg-transparent lg:p-8 lg:pb-0">
                        <div className="w-full max-w-5xl mx-auto aspect-video lg:rounded-[2.5rem] overflow-hidden border border-white/10 relative bg-black shadow-2xl">
                          <iframe 
                            src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&color=white`} 
                            title={activeVideo.title} 
                            className="absolute inset-0 w-full h-full border-0" 
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>

                      {/* Mobile Tabs */}
                      <div className="lg:hidden flex border-b border-white/5 px-4 bg-black/20 backdrop-blur-md mt-4">
                        <button 
                          onClick={() => setActiveMobileTab('notes')}
                          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest relative ${activeMobileTab === 'notes' ? 'text-white' : 'text-slate-500'}`}
                        >
                          Resource Center
                          {activeMobileTab === 'notes' && <motion.div layoutId="m-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />}
                        </button>
                        <button 
                          onClick={() => setActiveMobileTab('playlist')}
                          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest relative ${activeMobileTab === 'playlist' ? 'text-white' : 'text-slate-500'}`}
                        >
                          Playlist
                          {activeMobileTab === 'playlist' && <motion.div layoutId="m-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />}
                        </button>
                      </div>

                      {/* Bottom Scroll Area */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 lg:pt-8">
                        {(activeMobileTab === 'notes' || window.innerWidth >= 1024) && (
                          <div className="max-w-5xl mx-auto w-full animate-fade-in">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
                              <h3 className="text-lg font-bold text-white tracking-tight">Study Materials</h3>
                            </div>
                            
                            {activeVideo.notes && activeVideo.notes.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeVideo.notes.map((note: any, ni: number) => (
                                  <a 
                                    key={ni} 
                                    href={note.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between p-5 bg-white/[0.03] hover:bg-blue-600 border border-white/5 hover:border-blue-500 rounded-3xl transition-all duration-500 shadow-xl"
                                  >
                                    <div className="flex items-center gap-5">
                                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-white/20 transition-all">
                                        {note.isLink ? '🔗' : '📄'}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-white truncate group-hover:text-blue-50 transition-colors leading-tight">{note.title}</span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 group-hover:text-blue-100 transition-colors">{note.isLink ? 'Web Resource' : 'Hand-Note PDF'}</span>
                                      </div>
                                    </div>
                                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                      →
                                    </div>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div className="p-16 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
                                <div className="text-4xl mb-4 opacity-30">📚</div>
                                <p className="text-slate-500 text-sm italic">No specific materials for this class yet.</p>
                              </div>
                            )}
                          </div>
                        )}

                        {activeMobileTab === 'playlist' && (
                          <div className="lg:hidden flex flex-col gap-3 animate-fade-in">
                            {currentPlaylist.map((v, idx) => (
                              <button 
                                key={idx}
                                onClick={() => { setActiveVideo(v); setActiveMobileTab('notes'); }}
                                className={`p-4 rounded-3xl border transition-all text-left flex items-center gap-4 ${v.id === activeVideo.id ? 'bg-blue-600 border-blue-500 shadow-[0_10px_30px_rgba(59,130,246,0.3)]' : 'bg-white/[0.02] border-white/5'}`}
                              >
                                <div className="relative w-24 aspect-video rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                                    <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} className="w-full h-full object-cover opacity-60" />
                                    {v.id === activeVideo.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-blue-600/40 backdrop-blur-[2px]">
                                            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-xs font-bold truncate text-white mb-1">{v.title}</h5>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest block">Class {idx + 1}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Desktop Playlist Sidebar */}
                    <div className="hidden lg:flex w-[380px] border-l border-white/5 flex-col bg-black/40 backdrop-blur-3xl shadow-2xl">
                      <div className="p-8 border-b border-white/5 bg-black/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Course Playlist</h4>
                        </div>
                        <p className="text-sm font-bold text-white truncate opacity-90">{activeVideo.subTitle}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-3">
                        {currentPlaylist.map((v, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setActiveVideo(v)}
                            className={`p-4 rounded-[2rem] border transition-all duration-500 text-left group flex items-center gap-4 ${v.id === activeVideo.id ? 'bg-blue-600 border-blue-500 shadow-2xl scale-[1.02]' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10'}`}
                          >
                            <div className="relative w-24 aspect-video rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                                <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                {v.id === activeVideo.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-blue-600/30 backdrop-blur-[2px]">
                                        <PlayIcon />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className={`text-[11px] font-bold leading-tight mb-2 line-clamp-2 ${v.id === activeVideo.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{v.title}</h5>
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${v.id === activeVideo.id ? 'text-blue-100' : 'text-slate-500'}`}>Part {idx + 1}</span>
                                {v.id === activeVideo.id && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      } />

      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
