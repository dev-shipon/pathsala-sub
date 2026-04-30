import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface StudyModeProps {
    setActiveVideo: (video: any, playlist?: any[]) => void;
}

const StudyMode: React.FC<StudyModeProps> = ({ setActiveVideo }) => {
    const [allData, setAllData] = useState<any[]>([]);
    const [allBooks, setAllBooks] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [mainTab, setMainTab] = useState<'classes' | 'books'>('classes');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, 'pathshala_data'), orderBy('updatedAt', 'desc')), (snap) => {
            setAllData(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
            setLoading(false);
        });
        const unsubBooks = onSnapshot(collection(db, 'books'), (snap) => {
            setAllBooks(snap.docs.map(d => d.data()));
        });
        return () => { unsub(); unsubBooks(); };
    }, []);

    const departments = useMemo(() => Array.from(new Set(allData.map(d => d.department))), [allData]);
    const filteredCourses = useMemo(() => selectedDept ? allData.filter(d => d.department === selectedDept) : [], [allData, selectedDept]);
    const activeCourse = useMemo(() => allData.find(d => d.firestoreId === selectedCourse), [allData, selectedCourse]);

    const parsedCourseData = useMemo(() => {
        if (!activeCourse) return { subjects: [], standalonePdfs: [] };
        const subjects: { id: string; title: string; classes: any[] }[] = [];
        const standalonePdfs: { title: string; url: string; sectionTitle: string; date?: string }[] = [];

        if (activeCourse.fullData?.sections) {
            activeCourse.fullData.sections.forEach((s: any) => {
                const classes: any[] = [];
                const sectionName = s.title || 'General';

                // Filter out Orientation and Rules sections (Robustly)
                const lowerTitle = sectionName.toLowerCase();
                const blacklistedKeywords = ['orientation', 'নিয়ম', 'নিয়ম', 'niyon', 'rules', 'instruction', 'কিভাবে ক্লাস করবেন'];
                if (blacklistedKeywords.some(keyword => lowerTitle.includes(keyword))) {
                    return;
                }

                if (s.contents) {
                    s.contents.forEach((c: any) => {
                        if (c.type === 'video' || c.type === 'live') {
                            const reg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                            const link = c.resource?.resourceable?.link || '';
                            const match = link.match(reg);
                            const id = (match && match[2].length === 11) ? match[2] : null;
                            if (id) classes.push({ title: c.title, id, type: c.type, date: c.available_from, notes: [] });
                        } else if (c.type === 'pdf') {
                            const pdfLink = c.resource?.resourceable?.link || c.resource?.resourceable?.file_url || c.resource?.resourceable?.url || c.resource?.link || '';
                            if (pdfLink) {
                                if (classes.length > 0) {
                                    classes[classes.length - 1].notes.push({ title: c.title, url: pdfLink, date: c.available_from });
                                } else {
                                    standalonePdfs.push({ title: c.title, url: pdfLink, sectionTitle: sectionName, date: c.available_from });
                                }
                            }
                        }
                    });
                }
                if (classes.length > 0) subjects.push({ id: s.slug || s.id?.toString() || sectionName, title: sectionName, classes });
            });
        }
        return { subjects, standalonePdfs };
    }, [activeCourse]);

    const parsedSubjects = parsedCourseData.subjects;

    const filteredSections = useMemo(() => {
        let result = parsedSubjects;
        if (activeFilter !== 'all') {
            result = result.filter(s => s.id === activeFilter);
        }
        if (searchQuery) {
            result = result.map(s => ({
                ...s,
                classes: s.classes.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
            })).filter(s => s.classes.length > 0);
        }
        return result;
    }, [parsedSubjects, activeFilter, searchQuery]);

    if (loading) return null;

    const deptIcons: Record<string, string> = {
        'Computer': '💻',
        'Civil': '🏗️',
        'Electrical': '⚡',
        'Mechanical': '⚙️',
        'Electronics': '📡',
        'Textile': '🧶'
    };

    const deptColors: Record<string, string> = {
        'Computer': 'from-blue-600/20 to-indigo-600/20 border-blue-500/30 text-blue-400',
        'Civil': 'from-amber-600/20 to-orange-600/20 border-amber-500/30 text-amber-400',
        'Electrical': 'from-yellow-600/20 to-orange-600/20 border-yellow-500/30 text-yellow-400',
        'Mechanical': 'from-slate-600/20 to-gray-600/20 border-slate-500/30 text-slate-400',
        'Electronics': 'from-cyan-600/20 to-blue-600/20 border-cyan-500/30 text-cyan-400',
        'Textile': 'from-pink-600/20 to-rose-600/20 border-pink-500/30 text-pink-400'
    };

    if (!selectedDept) {
        return (
            <div className="py-20 animate-fade-in max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-20 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
                    <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-6 inline-block backdrop-blur-md">
                        Welcome to Talukdar Pathshala
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 font-siliguri tracking-tight drop-shadow-2xl">
                        আপনার <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">ডিপার্টমেন্ট</span> বেছে নিন
                    </h2>
                    <p className="text-slate-400 max-w-xl mx-auto font-medium text-sm leading-relaxed">
                        প্রিমিয়াম কোয়ালিটির ভিডিও ক্লাস, হ্যান্ড-নোটস এবং ডিজিটাল লাইব্রেরি এক্সেস পেতে আপনার ডিপার্টমেন্ট সিলেক্ট করে শুরু করুন।
                    </p>
                </div>

                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {departments.map((dept, idx) => (
                        <motion.button 
                            key={dept} 
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            onClick={() => setSelectedDept(dept)} 
                            className={`relative group p-10 rounded-[2.5rem] bg-gradient-to-br ${deptColors[dept] || 'from-white/[0.05] to-transparent border-white/10 text-white'} border backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] text-left overflow-hidden`}
                        >
                            <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute top-0 right-0 p-12 bg-white/10 blur-[50px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform group-hover:scale-150"></div>
                            
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500 shadow-xl">
                                    <span className="text-3xl drop-shadow-md">
                                        {deptIcons[dept] || '🎓'}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 tracking-tight group-hover:text-white transition-colors">{dept}</h3>
                                <div className="flex items-center gap-2 mt-6">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity text-white">Explore Department</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0 text-white">→</span>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            </div>
        );
    }

    if (!selectedCourse) {
        return (
            <div className="animate-fade-in max-w-6xl mx-auto py-10 relative z-10">
                <button onClick={() => setSelectedDept(null)} className="mb-12 group flex items-center gap-3 text-slate-500 hover:text-white transition-all w-fit">
                    <span className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full group-hover:bg-white/10 transition-colors shadow-lg">←</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Back to Departments</span>
                </button>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 relative">
                    <div className="absolute -top-10 left-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">{deptIcons[selectedDept]}</span>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-widest text-slate-300">
                                {filteredCourses.length} Courses Available
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 font-siliguri tracking-tight">{selectedDept}</h2>
                        <p className="text-slate-400 text-sm">নিচের লিস্ট থেকে আপনার বর্তমান সেমিস্টার বা কোর্সটি সিলেক্ট করুন।</p>
                    </div>
                </div>

                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {filteredCourses.map((course) => (
                        <motion.button 
                            key={course.firestoreId} 
                            variants={{
                                hidden: { opacity: 0, x: -20 },
                                visible: { opacity: 1, x: 0 }
                            }}
                            onClick={() => setSelectedCourse(course.firestoreId)} 
                            className="relative group p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-300 text-left overflow-hidden shadow-lg hover:shadow-blue-500/5"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors mb-3 tracking-tight">{course.semesterName}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                            Updated: {new Date(course.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300 text-white shadow-xl transform group-hover:translate-x-2 group-hover:scale-110">
                                    →
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-7xl mx-auto">
            {/* Ultra-Modern Floating Command Center */}
            <div className="relative mb-12 z-20 animate-fade-in">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-blue-600/10 blur-2xl rounded-[3rem] pointer-events-none"></div>
                
                {/* Main Bar */}
                <div className="relative bg-[#0a0f1c]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 flex flex-col md:flex-row items-center gap-4 shadow-2xl">
                    
                    {/* Left: Back & Search */}
                    <div className="flex items-center gap-3 w-full md:w-auto md:flex-1">
                        <button 
                            onClick={() => setSelectedCourse(null)} 
                            className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 hover:shadow-lg border border-white/10 rounded-full text-slate-300 hover:text-white transition-all active:scale-95"
                        >
                            <span className="text-xl">←</span>
                        </button>
                        <div className="relative w-full max-w-sm">
                            <input 
                                type="text" 
                                placeholder="Search classes, topics..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-3.5 bg-black/40 border border-white/5 focus:border-blue-500/50 rounded-full text-sm text-white outline-none transition-all shadow-inner placeholder:text-slate-600"
                            />
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔍</span>
                        </div>
                    </div>

                    {/* Center: Main Tabs (Segmented Control) */}
                    <div className="flex items-center p-1.5 bg-black/50 border border-white/5 rounded-full w-full sm:w-auto shadow-inner flex-shrink-0">
                        <button 
                            onClick={() => setMainTab('classes')} 
                            className={`flex-1 sm:w-40 py-2.5 rounded-full font-bold text-[10px] sm:text-xs transition-all duration-500 uppercase tracking-widest flex items-center justify-center gap-2 ${mainTab === 'classes' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-100' : 'text-slate-400 hover:text-white hover:bg-white/5 scale-95'}`}
                        >
                            <span className="text-base">🎬</span> Classes
                        </button>
                        <button 
                            onClick={() => setMainTab('books')} 
                            className={`flex-1 sm:w-40 py-2.5 rounded-full font-bold text-[10px] sm:text-xs transition-all duration-500 uppercase tracking-widest flex items-center justify-center gap-2 ${mainTab === 'books' ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-100' : 'text-slate-400 hover:text-white hover:bg-white/5 scale-95'}`}
                        >
                            <span className="text-base">📚</span> Library
                        </button>
                    </div>

                    {/* Right: Info Area (Hidden on small screens) */}
                    <div className="hidden lg:flex flex-1 justify-end items-center pr-4">
                        <div className="text-right">
                            <h3 className="text-sm font-bold text-white tracking-tight leading-none mb-1.5">{activeCourse?.semesterName}</h3>
                            <div className="flex items-center justify-end gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.2em]">
                                    {mainTab === 'classes' ? `${filteredSections.reduce((acc, s) => acc + s.classes.length, 0)} Total Classes` : 'Digital Resources'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Bottom: Subject Filter Pills (Futuristic Slider) */}
                {mainTab === 'classes' && (
                    <div className="mt-8 relative group/slider">
                        {/* Navigation Arrows for PC */}
                        <button 
                            onClick={() => {
                                const el = document.getElementById('subject-slider');
                                if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 rounded-full items-center justify-center text-white hidden md:flex opacity-0 group-hover/slider:opacity-100 transition-all hover:bg-blue-600 hover:border-blue-500 shadow-2xl"
                        >
                            ←
                        </button>
                        <button 
                            onClick={() => {
                                const el = document.getElementById('subject-slider');
                                if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 rounded-full items-center justify-center text-white hidden md:flex opacity-0 group-hover/slider:opacity-100 transition-all hover:bg-blue-600 hover:border-blue-500 shadow-2xl"
                        >
                            →
                        </button>

                        {/* Futuristic Edge Masking */}
                        <div id="subject-slider" className="mask-edge-fade overflow-x-auto no-scrollbar pb-4 px-4 flex items-center gap-4 scroll-smooth">
                            <button 
                                onClick={() => setActiveFilter('all')}
                                className={`flex-shrink-0 px-7 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 border ${activeFilter === 'all' ? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.4)] scale-105' : 'bg-white/[0.03] text-slate-400 border-white/10 hover:border-white/30 hover:text-white hover:bg-white/10'}`}
                            >
                                All Subjects
                            </button>
                            {parsedSubjects.map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => setActiveFilter(s.id)}
                                    className={`flex-shrink-0 flex items-center gap-3 px-7 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 border ${activeFilter === s.id ? 'bg-blue-500/20 text-blue-300 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.3)] scale-105' : 'bg-white/[0.03] text-slate-400 border-white/10 hover:border-white/30 hover:text-white hover:bg-white/10'}`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${activeFilter === s.id ? 'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)]' : 'bg-slate-700'}`}></div>
                                    {s.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {mainTab === 'books' ? (
                <div className="animate-fade-in">
                    {/* Aggregated Global Library from allData + allBooks */}
                    {(() => {
                        const allParsedPdfs: any[] = [];
                        
                        // Scan through all courses in allData to find standalone PDFs
                        allData.forEach(course => {
                            if (course.fullData?.sections) {
                                course.fullData.sections.forEach((s: any) => {
                                    const sectionName = s.title || 'General';
                                    if (s.contents) {
                                        s.contents.forEach((c: any) => {
                                            if (c.type === 'pdf') {
                                                const pdfLink = c.resource?.resourceable?.link || c.resource?.resourceable?.file_url || c.resource?.resourceable?.url || c.resource?.link || '';
                                                if (pdfLink) {
                                                    // Check if it's already in classes to avoid duplicates, but usually standalone are better for books
                                                    allParsedPdfs.push({
                                                        title: c.title,
                                                        url: pdfLink,
                                                        category: sectionName || course.semesterName || 'Course Material',
                                                        dept: course.department
                                                    });
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        });

                        const combinedBooks = [
                            ...allBooks.map(b => ({ ...b, isMaster: b.title.toLowerCase().includes('master') })), 
                            ...allParsedPdfs.map(p => ({
                                ...p,
                                isMaster: p.title.toLowerCase().includes('master') || p.category.toLowerCase().includes('master')
                            }))
                        ];

                        // Deduplicate by URL
                        const uniqueBooks = Array.from(new Map(combinedBooks.map(item => [item.url, item])).values());
                        
                        // Sort: Masters first, then by department matching, then others
                        const sortedBooks = uniqueBooks.sort((a: any, b: any) => {
                            if (a.isMaster && !b.isMaster) return -1;
                            if (!a.isMaster && b.isMaster) return 1;
                            if (a.dept === selectedDept && b.dept !== selectedDept) return -1;
                            if (a.dept !== selectedDept && b.dept === selectedDept) return 1;
                            return 0;
                        });

                        return sortedBooks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {sortedBooks.map((book: any, i: number) => (
                                    <motion.a 
                                        key={i} 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        href={book.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={`relative p-8 bg-white/[0.03] border ${book.isMaster ? 'border-blue-500/40 shadow-blue-500/10' : 'border-white/10'} rounded-[2.5rem] hover:bg-white/[0.06] transition-all group cursor-pointer overflow-hidden shadow-xl`}
                                    >
                                        <div className={`absolute top-0 right-0 p-8 ${book.isMaster ? 'bg-blue-500/20' : 'bg-amber-500/10'} blur-[30px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                        
                                        {book.isMaster && (
                                            <div className="absolute top-6 right-6 px-4 py-1.5 bg-blue-600 text-[9px] font-bold uppercase tracking-widest rounded-full text-white shadow-xl animate-pulse">
                                                Master Book
                                            </div>
                                        )}

                                        <div className={`w-14 h-14 ${book.isMaster ? 'bg-blue-500/10' : 'bg-amber-500/10'} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                                            {book.isMaster ? '👑' : '📚'}
                                        </div>
                                        <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-3 tracking-tight">{book.title}</h4>
                                        <div className="flex flex-wrap gap-2 mb-8">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{book.category}</span>
                                            {book.dept && <span className="text-[10px] text-blue-500/60 font-bold uppercase tracking-widest">• {book.dept}</span>}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className={`px-5 py-2.5 ${book.isMaster ? 'bg-blue-600' : 'bg-amber-500'} text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all`}>
                                                View / Download
                                            </div>
                                            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Premium Access</span>
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center flex flex-col items-center gap-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
                                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-4xl animate-pulse">📖</div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">ডিজিটাল লাইব্রেরি</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto">বর্তমানে কোনো বই বা পিডিএফ আপলোড করা হয়নি। খুব শীঘ্রই এখানে আপনার প্রয়োজনীয় বইগুলো যুক্ত করা হবে।</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ) : (
                <div className="flex flex-col gap-16">
                    {filteredSections.map((section, sIdx) => (
                        <motion.div 
                            key={section.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sIdx * 0.1 }}
                            className="flex flex-col gap-8"
                        >
                            {/* Section Header */}
                            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{section.title}</h3>
                                </div>
                                <span className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    {section.classes.length} Classes
                                </span>
                            </div>

                            {/* Classes Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {section.classes.map((v, idx) => (
                                    <div key={idx} className="group flex flex-col">
                                        <div 
                                            onClick={() => setActiveVideo(v, section.classes)}
                                            className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-all cursor-pointer shadow-2xl"
                                        >
                                            <img src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors"></div>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transform scale-75 group-hover:scale-100 transition-transform shadow-2xl">
                                                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                                </div>
                                            </div>
                                            
                                            {v.notes && v.notes.length > 0 && (
                                              <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center gap-2 shadow-xl">
                                                <span className="text-xs">📄</span>
                                                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Notes</span>
                                              </div>
                                            )}
                                        </div>
                                        <div className="py-6 px-1">
                                            <h3 className="text-sm font-bold text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors cursor-pointer leading-relaxed" onClick={() => setActiveVideo(v, section.classes)}>
                                                {v.title}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{section.title}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudyMode;
