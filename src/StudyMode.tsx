import React, { useState, useEffect, useMemo } from 'react';

interface StudyModeProps {
    setActiveVideo: (video: any) => void;
}

// ─── Book Categories ────────────────────────────────────────────
const BOOK_CATEGORIES = ['Master Book', 'Others Book', 'Reference', 'Question Bank'];

const StudyMode: React.FC<StudyModeProps> = ({ setActiveVideo }) => {
    const [allData, setAllData] = useState<any[]>([]);
    const [allBooks, setAllBooks] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [localSearch, setLocalSearch] = useState('');
    const [pdfPreview, setPdfPreview] = useState<{ url: string; title: string } | null>(null);
    const [mainTab, setMainTab] = useState<'classes' | 'books'>('classes');
    const [bookCatFilter, setBookCatFilter] = useState<string>('all');
    const [bookSearch, setBookSearch] = useState('');

    // Admin state
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const [adminPassOpen, setAdminPassOpen] = useState(false);
    const [adminPass, setAdminPass] = useState('');
    const [adminDept, setAdminDept] = useState('Computer');
    const [adminSemName, setAdminSemName] = useState('');
    const [adminSemSlug, setAdminSemSlug] = useState('');
    const [adminJson, setAdminJson] = useState('');

    // Book admin state
    const [adminTab, setAdminTab] = useState<'syllabus' | 'books' | 'security'>('syllabus');
    const [bookTitle, setBookTitle] = useState('');
    const [bookCategory, setBookCategory] = useState('Master Book');
    const [bookUrl, setBookUrl] = useState('');
    const [bookCover, setBookCover] = useState('');
    const [bookDept, setBookDept] = useState('Computer');
    const [editBookIdx, setEditBookIdx] = useState<number | null>(null);

    // Password change state
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    useEffect(() => {
        const data = localStorage.getItem('pathshala_data');
        if (data) setAllData(JSON.parse(data));
        const books = localStorage.getItem('pathshala_books');
        if (books) setAllBooks(JSON.parse(books));
    }, []);

    // Get stored password (default '1122')
    const getStoredPassword = () => localStorage.getItem('pathshala_admin_pass') || '1122';

    const departments = useMemo(() => Array.from(new Set(allData.map(d => d.department))), [allData]);
    const semesters = useMemo(() => (!selectedDept ? [] : allData.filter(d => d.department === selectedDept)), [selectedDept, allData]);
    const activeCourse = useMemo(() => (!selectedSemester ? null : allData.find(d => d.slug === selectedSemester) || null), [selectedSemester, allData]);

    // Collect ALL standalone PDFs from the course JSON (type='pdf' items with no parent video)
    const parsedCourseData = useMemo(() => {
        if (!activeCourse) return { subjects: [], standalonePdfs: [] };
        const subjects: { id: string; title: string; classes: any[] }[] = [];
        const standalonePdfs: { title: string; url: string; sectionTitle: string; date?: string }[] = [];

        if (activeCourse.fullData?.sections) {
            activeCourse.fullData.sections.forEach((s: any) => {
                const classes: any[] = [];
                const sectionName = s.title || 'General';

                if (s.contents) {
                    s.contents.forEach((c: any) => {
                        if (c.type === 'video' || c.type === 'live') {
                            // Video/Live class
                            const reg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                            const link = c.resource?.resourceable?.link || '';
                            const match = link.match(reg);
                            const id = (match && match[2].length === 11) ? match[2] : null;
                            if (id) classes.push({ title: c.title, id, type: c.type, date: c.available_from, notes: [] });
                        } else if (c.type === 'pdf') {
                            // PDF — attach to last video if exists, otherwise standalone
                            const pdfLink = c.resource?.resourceable?.link || c.resource?.resourceable?.file_url || c.resource?.resourceable?.url || c.resource?.link || '';
                            if (pdfLink) {
                                if (classes.length > 0) {
                                    // Attach as note to last video
                                    classes[classes.length - 1].notes.push({ title: c.title, url: pdfLink, date: c.available_from });
                                } else {
                                    // Standalone PDF (appears before any video in section)
                                    standalonePdfs.push({ title: c.title, url: pdfLink, sectionTitle: sectionName, date: c.available_from });
                                }
                            }
                        } else if (c.type === 'link') {
                            // External link — attach to last video as a link note
                            const extLink = c.resource?.resourceable?.link || c.resource?.link || '';
                            if (extLink && classes.length > 0) {
                                classes[classes.length - 1].notes.push({ title: c.title, url: extLink, isLink: true, date: c.available_from });
                            }
                        }
                        // Ignore other unknown types silently
                    });
                }
                if (classes.length > 0) subjects.push({ id: s.slug || s.id?.toString() || sectionName, title: sectionName, classes });
            });
        }
        return { subjects, standalonePdfs };
    }, [activeCourse]);

    const parsedSubjects = parsedCourseData.subjects;
    const standalonePdfs = parsedCourseData.standalonePdfs;


    const timeAgo = (d: string) => {
        if (!d) return 'Just Now';
        const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
        if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    const verifyAdmin = () => {
        if (adminPass === getStoredPassword()) { setAdminPassOpen(false); setAdminModalOpen(true); setAdminPass(''); }
        else { alert('Incorrect Password!'); setAdminPass(''); }
    };

    const saveAdminData = () => {
        if (!adminSemName || !adminSemSlug || !adminJson) return alert('Fill all fields!');
        try {
            const item = { department: adminDept, semesterName: adminSemName, slug: adminSemSlug, fullData: JSON.parse(adminJson), updatedAt: new Date().toISOString() };
            let newData = [...allData];
            const idx = newData.findIndex(d => d.slug === adminSemSlug);
            if (idx !== -1) newData[idx] = item; else newData.push(item);
            setAllData(newData);
            localStorage.setItem('pathshala_data', JSON.stringify(newData));
            alert('Saved!'); setAdminSemName(''); setAdminSemSlug(''); setAdminJson('');
        } catch { alert('Invalid JSON!'); }
    };

    const deleteAdminData = () => {
        if (!adminSemSlug || !window.confirm('Delete?')) return;
        const newData = allData.filter(d => d.slug !== adminSemSlug);
        setAllData(newData); localStorage.setItem('pathshala_data', JSON.stringify(newData));
        alert('Deleted.'); setAdminSemName(''); setAdminSemSlug(''); setAdminJson('');
    };

    const saveBook = () => {
        if (!bookTitle || !bookUrl) return alert('Title and URL are required!');
        const book = { title: bookTitle, category: bookCategory, url: bookUrl, cover: bookCover, department: bookDept, addedAt: new Date().toISOString() };
        let newBooks = [...allBooks];
        if (editBookIdx !== null) { newBooks[editBookIdx] = book; setEditBookIdx(null); }
        else newBooks.push(book);
        setAllBooks(newBooks); localStorage.setItem('pathshala_books', JSON.stringify(newBooks));
        alert('Book saved!'); setBookTitle(''); setBookUrl(''); setBookCover(''); setBookCategory('Master Book');
    };

    const deleteBook = (idx: number) => {
        if (!window.confirm('Delete this book?')) return;
        const newBooks = allBooks.filter((_, i) => i !== idx);
        setAllBooks(newBooks); localStorage.setItem('pathshala_books', JSON.stringify(newBooks));
    };

    const editBook = (idx: number) => {
        const b = allBooks[idx];
        setBookTitle(b.title); setBookUrl(b.url); setBookCover(b.cover || '');
        setBookCategory(b.category); setBookDept(b.department || 'Computer');
        setEditBookIdx(idx); setAdminTab('books');
    };

    const handleVideoClick = (v: any, sub: any) => {
        setActiveVideo({ id: v.id, title: v.title, channel: `${activeCourse?.semesterName} • ${sub.title}`, views: v.type.toUpperCase() + ' CLASS', publishedAt: timeAgo(v.date), thumbnail: `https://img.youtube.com/vi/${v.id}/maxresdefault.jpg` });
    };

    // ─── PDF Preview ──────────────────────────────────────────────
    if (pdfPreview) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setPdfPreview(null)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>{pdfPreview.title}</h2>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PDF Preview</div>
                    </div>
                    <a href={pdfPreview.url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '0.875rem', textDecoration: 'none' }}>↗ Open Full</a>
                </div>
                <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
                    <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfPreview.url)}&embedded=true`} style={{ width: '100%', height: '100%', border: 'none' }} title={pdfPreview.title} />
                </div>
            </div>
        );
    }

    // ─── Department Selection ─────────────────────────────────────
    if (!selectedDept) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '2rem' }}>
                {/* Top tab: Classes or Books */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                        <button onClick={() => setMainTab('classes')} style={{ padding: '0.5rem 1.25rem', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem', background: mainTab === 'classes' ? 'var(--primary)' : 'transparent', color: mainTab === 'classes' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>🎬 Classes</button>
                        <button onClick={() => setMainTab('books')} style={{ padding: '0.5rem 1.25rem', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem', background: mainTab === 'books' ? '#f59e0b' : 'transparent', color: mainTab === 'books' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>📚 Books</button>
                    </div>
                    <button onClick={() => setAdminPassOpen(true)} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontWeight: 'bold' }}>Admin Control</button>
                </div>

                {/* ─── BOOKS VIEW ─── */}
                {mainTab === 'books' && (
                    <div>
                        {/* Search + filters */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <input type="text" placeholder="🔍 Search books..." value={bookSearch} onChange={e => setBookSearch(e.target.value)}
                                style={{ flex: 1, minWidth: '180px', padding: '0.5rem 1rem', borderRadius: '999px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', outline: 'none', fontSize: '0.875rem' }} />
                        </div>
                        <div className="tabs-container" style={{ marginBottom: '2rem', paddingBottom: '0.5rem' }}>
                            <button className={`tab-btn ${bookCatFilter === 'all' ? 'active' : ''}`} onClick={() => setBookCatFilter('all')}>All</button>
                            {BOOK_CATEGORIES.map(c => (
                                <button key={c} className={`tab-btn ${bookCatFilter === c ? 'active' : ''}`} onClick={() => setBookCatFilter(c)}>{c}</button>
                            ))}
                        </div>

                        {/* Books Grid */}
                        {['Master Book', 'Others Book', 'Reference', 'Question Bank'].map(cat => {
                            const booksInCat = allBooks.filter(b => b.category === cat && (bookCatFilter === 'all' || bookCatFilter === cat) && (!bookSearch || b.title.toLowerCase().includes(bookSearch.toLowerCase())));
                            if (booksInCat.length === 0) return null;
                            return (
                                <div key={cat} style={{ marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ width: 4, height: 24, background: cat === 'Master Book' ? '#f59e0b' : cat === 'Others Book' ? '#3b82f6' : cat === 'Reference' ? '#10b981' : '#8b5cf6', borderRadius: '2px' }} />
                                        <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 'bold' }}>{cat}</h3>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', borderRadius: '999px', padding: '2px 10px', fontSize: '0.75rem' }}>{booksInCat.length}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                                        {booksInCat.map((book, bi) => (
                                            <div key={bi} style={{ borderRadius: '14px', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}
                                                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                                                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                                                {/* Book Cover */}
                                                <div onClick={() => setPdfPreview({ url: book.url, title: book.title })} style={{ aspectRatio: '3/4', background: book.cover ? `url(${book.cover}) center/cover` : `linear-gradient(135deg, ${cat === 'Master Book' ? '#92400e,#f59e0b' : cat === 'Others Book' ? '#1e3a8a,#3b82f6' : cat === 'Reference' ? '#064e3b,#10b981' : '#3b0764,#8b5cf6'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                    {!book.cover && <div style={{ textAlign: 'center', padding: '1rem' }}>
                                                        <div style={{ fontSize: '2.5rem' }}>📖</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', fontWeight: 'bold', marginTop: '0.5rem', lineHeight: 1.3 }}>{book.title.substring(0, 40)}</div>
                                                    </div>}
                                                    <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: cat === 'Master Book' ? '#f59e0b' : cat === 'Others Book' ? '#3b82f6' : cat === 'Reference' ? '#10b981' : '#8b5cf6', color: 'white', fontSize: '0.6rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                                                        {cat === 'Master Book' ? '⭐ MASTER' : cat === 'Others Book' ? '📘 BOOK' : cat === 'Reference' ? '🔖 REF' : '❓ QB'}
                                                    </div>
                                                </div>
                                                {/* Book Info */}
                                                <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <div style={{ color: 'white', fontWeight: '600', fontSize: '0.8rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{book.department}</div>
                                                    <button onClick={() => setPdfPreview({ url: book.url, title: book.title })}
                                                        style={{ marginTop: 'auto', padding: '0.4rem', borderRadius: '6px', background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                                        👁 Preview
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {allBooks.filter(b => (bookCatFilter === 'all' || bookCatFilter === b.category) && (!bookSearch || b.title.toLowerCase().includes(bookSearch.toLowerCase()))).length === 0 && (
                            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '4rem' }}>📚</div>
                                <h3 style={{ marginTop: '1rem' }}>No Books Added Yet</h3>
                                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Admin can add books from the Admin Control panel.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── CLASSES VIEW (Department Grid) ─── */}
                {mainTab === 'classes' && (
                    departments.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '4rem' }}>📚</div>
                            <h3>No Course Data Available</h3>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Login as Admin to upload syllabus JSON files.</p>
                        </div>
                    ) : (
                        <div className="video-grid">
                            {departments.map(d => (
                                <div key={d} className="video-card glass-panel" style={{ padding: '2rem', textAlign: 'center' }} onClick={() => setSelectedDept(d)}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white' }}>{d} Department</h3>
                                    <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>EXPLORE SEMESTERS</div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* ─── Admin Password Modal ─── */}
                {adminPassOpen && (
                    <div className="download-modal-overlay active" style={{ zIndex: 3000 }}>
                        <div className="download-modal glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Admin Access</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Enter Control Password</p>
                            <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyAdmin()}
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--primary)', color: 'white', textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem', outline: 'none', marginBottom: '1.5rem' }}
                                placeholder="****" maxLength={4} />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setAdminPassOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={verifyAdmin}>Login</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Admin Panel Modal ─── */}
                {adminModalOpen && (
                    <div className="download-modal-overlay active" style={{ zIndex: 3000 }}>
                        <div className="download-modal glass-panel" style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '1.3rem' }}>Study Control Center</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Admin Panel</p>
                                </div>
                                <button className="btn" style={{ background: 'transparent', color: 'white' }} onClick={() => setAdminModalOpen(false)}>✕ Close</button>
                            </div>

                            {/* Admin Sub-tabs */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
                                <button onClick={() => setAdminTab('syllabus')} style={{ padding: '0.4rem 1rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', background: adminTab === 'syllabus' ? 'var(--primary)' : 'transparent', color: adminTab === 'syllabus' ? 'white' : 'var(--text-muted)' }}>📋 Syllabus</button>
                                <button onClick={() => setAdminTab('books')} style={{ padding: '0.4rem 1rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', background: adminTab === 'books' ? '#f59e0b' : 'transparent', color: adminTab === 'books' ? 'white' : 'var(--text-muted)' }}>📚 Books</button>
                                <button onClick={() => setAdminTab('security')} style={{ padding: '0.4rem 1rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', background: adminTab === 'security' ? '#ef4444' : 'transparent', color: adminTab === 'security' ? 'white' : 'var(--text-muted)' }}>🔒 Security</button>
                            </div>

                            {/* Syllabus Admin */}
                            {adminTab === 'syllabus' && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', overflow: 'hidden', flex: 1 }}>
                                    <div style={{ flex: '1 1 200px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1rem', overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Saved</h3>
                                            <button className="btn" style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => { setAdminSemName(''); setAdminSemSlug(''); setAdminJson(''); }}>+ New</button>
                                        </div>
                                        {allData.map(d => (
                                            <div key={d.slug} onClick={() => { setAdminSemName(d.semesterName); setAdminSemSlug(d.slug); setAdminDept(d.department); setAdminJson(JSON.stringify(d.fullData, null, 2)); }}
                                                style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', cursor: 'pointer', marginBottom: '0.4rem', border: '1px solid transparent', transition: 'all 0.2s' }}
                                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>{d.semesterName}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>{d.department}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ flex: '2 1 360px', overflowY: 'auto' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem' }}>Department</label>
                                                <select value={adminDept} onChange={e => setAdminDept(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                                                    <option>Computer</option><option>Civil</option><option>Electrical</option><option>Electronics</option><option>Mechanical</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem' }}>Semester Name</label>
                                                <input type="text" value={adminSemName} onChange={e => setAdminSemName(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} placeholder="e.g. 2nd Semester" />
                                            </div>
                                            <div style={{ gridColumn: '1/-1' }}>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem' }}>Unique Slug</label>
                                                <input type="text" value={adminSemSlug} onChange={e => setAdminSemSlug(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} placeholder="e.g. computer-2nd" />
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem' }}>API JSON DATA</label>
                                            <textarea value={adminJson} onChange={e => setAdminJson(e.target.value)} style={{ width: '100%', height: '220px', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#34d399', outline: 'none', fontFamily: 'monospace', fontSize: '0.72rem' }} placeholder="Paste Pathshala JSON here..." />
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            {adminSemSlug && <button className="btn" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444', flex: 1, minWidth: '120px' }} onClick={deleteAdminData}>Delete</button>}
                                            <button className="btn btn-primary" style={{ flex: 1, minWidth: '120px' }} onClick={saveAdminData}>Publish & Save</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Books Admin */}
                            {adminTab === 'books' && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', flex: 1, overflow: 'hidden' }}>
                                    {/* Saved books list */}
                                    <div style={{ flex: '1 1 200px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1rem', overflowY: 'auto' }}>
                                        <h3 style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Saved Books ({allBooks.length})</h3>
                                        {allBooks.map((b, i) => (
                                            <div key={i} style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '0.4rem', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                                                    <div style={{ color: '#f59e0b', fontSize: '0.62rem', fontWeight: 'bold' }}>{b.category}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                                                    <button onClick={() => editBook(i)} style={{ padding: '0.2rem 0.4rem', borderRadius: '5px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>✎</button>
                                                    <button onClick={() => deleteBook(i)} style={{ padding: '0.2rem 0.4rem', borderRadius: '5px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add/Edit Book Form */}
                                    <div style={{ flex: '2 1 320px', overflowY: 'auto' }}>
                                        <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '1rem', fontSize: '1rem' }}>{editBookIdx !== null ? '✎ Edit Book' : '+ Add New Book'}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem' }}>Category</label>
                                                <select value={bookCategory} onChange={e => setBookCategory(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                                                    {BOOK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem' }}>Department</label>
                                                <select value={bookDept} onChange={e => setBookDept(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                                                    <option>Computer</option><option>Civil</option><option>Electrical</option><option>Electronics</option><option>Mechanical</option><option>All</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem' }}>Book Title *</label>
                                            <input type="text" value={bookTitle} onChange={e => setBookTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} placeholder="e.g. Engineering Mathematics Vol. 1" />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem' }}>PDF URL * <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Google Drive / Direct link)</span></label>
                                            <input type="text" value={bookUrl} onChange={e => setBookUrl(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} placeholder="https://drive.google.com/..." />
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem' }}>Cover Image URL <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(optional)</span></label>
                                            <input type="text" value={bookCover} onChange={e => setBookCover(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} placeholder="https://..." />
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            {editBookIdx !== null && <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', flex: 1, minWidth: '100px' }} onClick={() => { setEditBookIdx(null); setBookTitle(''); setBookUrl(''); setBookCover(''); }}>Cancel</button>}
                                            <button className="btn" style={{ background: bookCategory === 'Master Book' ? '#f59e0b' : 'var(--primary)', color: 'white', flex: 2, minWidth: '140px', border: 'none' }} onClick={saveBook}>
                                                {editBookIdx !== null ? '✓ Update Book' : '+ Save Book'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 🔒 Security Tab */}
                            {adminTab === 'security' && (
                                <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <div style={{ fontSize: '2rem' }}>🔑</div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Change Admin Password</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Stored securely in your browser</div>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Password</label>
                                            <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)}
                                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: '1rem' }}
                                                placeholder="Enter current password" />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                                            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: '1rem' }}
                                                placeholder="Enter new password" />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm New Password</label>
                                            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: `1px solid ${confirmPass && newPass && confirmPass !== newPass ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, color: 'white', outline: 'none', fontSize: '1rem' }}
                                                placeholder="Re-enter new password" />
                                            {confirmPass && newPass && confirmPass !== newPass && (
                                                <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.4rem' }}>⚠ Passwords do not match</div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (!oldPass || !newPass || !confirmPass) return alert('Please fill all fields!');
                                                if (oldPass !== getStoredPassword()) return alert('❌ Current password is incorrect!');
                                                if (newPass.length < 4) return alert('New password must be at least 4 characters!');
                                                if (newPass !== confirmPass) return alert('❌ New passwords do not match!');
                                                localStorage.setItem('pathshala_admin_pass', newPass);
                                                alert('✅ Password changed successfully!');
                                                setOldPass(''); setNewPass(''); setConfirmPass('');
                                            }}
                                            style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', transition: 'all 0.2s' }}
                                        >
                                            🔐 Update Password
                                        </button>

                                        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '1rem', fontSize: '0.75rem', color: '#fcd34d', lineHeight: 1.6 }}>
                                            ⚠️ <strong>Important:</strong> If you forget your password, it's stored in your browser's localStorage under key <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>pathshala_admin_pass</code>. Default password is <strong>1122</strong>.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── Semester Selection ───────────────────────────────────────
    if (!selectedSemester) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSelectedDept(null)}>Departments</span>
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                    <span>Select <span style={{ color: 'var(--primary)' }}>Semester</span></span>
                </h2>
                <div className="video-grid">
                    {semesters.map(s => (
                        <div key={s.slug} className="video-card glass-panel" style={{ padding: '2rem', textAlign: 'center' }} onClick={() => setSelectedSemester(s.slug)}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📘</div>
                            <h3 style={{ fontSize: '1.25rem', color: 'white' }}>{s.semesterName}</h3>
                            <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>{s.department} DEPT.</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ─── Class Dashboard ──────────────────────────────────────────
    // All attached PDFs (from videos' notes) + standalone PDFs from JSON
    const allAttachedPdfs = [
        // PDFs attached to videos as notes
        ...parsedSubjects.flatMap(sub =>
            sub.classes.flatMap(v => (v.notes || []).filter((n: any) => !n.isLink).map((n: any) => ({ ...n, classTitle: v.title, subTitle: sub.title })))
        ),
        // Standalone PDFs (no parent video) from JSON — show with their section name
        ...standalonePdfs.map(p => ({ ...p, classTitle: p.sectionTitle, subTitle: p.sectionTitle }))
    ];

    // Show ALL books (no department restriction so nothing is missed)
    const masterBooks = allBooks.filter(b => b.category === 'Master Book');

    const isBookTab = activeFilter === '__master__' || activeFilter === '__allpdfs__';
    const filteredClasses = !isBookTab ? parsedSubjects
        .filter(sub => activeFilter === 'all' || activeFilter === sub.id)
        .flatMap(sub => sub.classes.filter(v => !localSearch || v.title.toLowerCase().includes(localSearch.toLowerCase())).map(v => ({ ...v, subTitle: sub.title }))) : [];

    // PDF rows for "All PDFs" tab — JSON PDFs + admin-added books
    const allPdfItems = activeFilter === '__allpdfs__'
        ? [
            ...allAttachedPdfs.filter(p => !localSearch || p.title.toLowerCase().includes(localSearch.toLowerCase())),
            ...allBooks.filter(b => !localSearch || b.title.toLowerCase().includes(localSearch.toLowerCase())).map(b => ({ title: b.title, url: b.url, classTitle: b.category, subTitle: b.department, isBook: true, category: b.category }))
        ]
        : activeFilter === '__master__'
            // Master Book tab: show admin-added Master Books + standalone PDFs named "All Book"
            ? [
                ...masterBooks.filter(b => !localSearch || b.title.toLowerCase().includes(localSearch.toLowerCase())).map(b => ({ title: b.title, url: b.url, classTitle: b.category, subTitle: b.department, isBook: true, category: b.category })),
                ...standalonePdfs.filter(p => !localSearch || p.title.toLowerCase().includes(localSearch.toLowerCase())).map(p => ({ title: p.title, url: p.url, classTitle: p.sectionTitle, subTitle: p.sectionTitle, isBook: false, category: 'PDF' }))
            ]
            : [];


    const catColor = (cat: string) => cat === 'Master Book' ? '#f59e0b' : cat === 'Others Book' ? '#3b82f6' : cat === 'Reference' ? '#10b981' : '#8b5cf6';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '2rem' }}>
            {/* Breadcrumb + Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => { setSelectedDept(null); setSelectedSemester(null); }}>Library</span>
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                    <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSelectedSemester(null)}>{selectedDept}</span>
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                    <span style={{ color: 'var(--primary)' }}>{activeCourse?.semesterName}</span>
                </h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <input type="text" placeholder="🔍 Search..." value={localSearch} onChange={e => setLocalSearch(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '999px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', outline: 'none', fontSize: '0.875rem', minWidth: '160px' }} />
                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.4rem 0.9rem', borderRadius: '999px', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        👤 {activeCourse?.fullData?.users_count?.toLocaleString()} Students
                    </div>
                </div>
            </div>

            {/* Subject + Book Filters in ONE scrollable tab bar */}
            <div className="tabs-container" style={{ marginBottom: '2rem', paddingBottom: '0.5rem' }}>
                <button className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>All Subjects</button>
                {parsedSubjects.map(sub => (
                    <button key={sub.id} className={`tab-btn ${activeFilter === sub.id ? 'active' : ''}`} onClick={() => setActiveFilter(sub.id)}>{sub.title}</button>
                ))}
                {/* Divider */}
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 0.25rem', alignSelf: 'stretch' }} />
                {/* Book tabs */}
                <button
                    onClick={() => setActiveFilter('__master__')}
                    style={{ padding: '0.75rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', transition: 'all 0.2s', fontSize: '0.875rem', borderBottom: `2px solid ${activeFilter === '__master__' ? '#f59e0b' : 'transparent'}`, color: activeFilter === '__master__' ? '#f59e0b' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                    ⭐ Master Book
                    {masterBooks.length > 0 && <span style={{ background: '#f59e0b', color: 'white', borderRadius: '999px', padding: '1px 7px', fontSize: '0.65rem', fontWeight: 'bold' }}>{masterBooks.length}</span>}
                </button>
                <button
                    onClick={() => setActiveFilter('__allpdfs__')}
                    style={{ padding: '0.75rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', transition: 'all 0.2s', fontSize: '0.875rem', borderBottom: `2px solid ${activeFilter === '__allpdfs__' ? '#a78bfa' : 'transparent'}`, color: activeFilter === '__allpdfs__' ? '#a78bfa' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                    📄 All PDFs
                    {(allAttachedPdfs.length + allBooks.length) > 0 && <span style={{ background: '#8b5cf6', color: 'white', borderRadius: '999px', padding: '1px 7px', fontSize: '0.65rem', fontWeight: 'bold' }}>{allAttachedPdfs.length + allBooks.length}</span>}
                </button>
            </div>

            {/* ─── PDF / BOOK LIST VIEW (Master Book or All PDFs tab) ─── */}
            {isBookTab && (
                <div>
                    {allPdfItems.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem' }}>📚</div>
                            <h3 style={{ marginTop: '1rem' }}>No {activeFilter === '__master__' ? 'Master Books' : 'PDFs'} found.</h3>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Admin can add books from the Admin Control panel.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {allPdfItems.map((item, i) => (
                                <button key={i} onClick={() => setPdfPreview({ url: item.url, title: item.title })}
                                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = item.isBook ? catColor((item as any).category || '') : 'rgba(245,158,11,0.5)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
                                        background: item.isBook
                                            ? `linear-gradient(135deg, ${catColor((item as any).category || '')}, ${catColor((item as any).category || '')}aa)`
                                            : 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                                        boxShadow: `0 4px 12px ${item.isBook ? catColor((item as any).category || '') : '#f59e0b'}33`
                                    }}>
                                        {item.isBook ? '📖' : '📄'}
                                    </div>
                                    {/* Info */}
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ color: 'white', fontWeight: '700', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span>{item.subTitle}</span>
                                            {item.isBook && <span style={{ background: catColor((item as any).category || '') + '33', color: catColor((item as any).category || ''), borderRadius: '4px', padding: '1px 6px', fontSize: '0.62rem', fontWeight: 'bold' }}>{(item as any).category}</span>}
                                            {!item.isBook && <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: '4px', padding: '1px 6px', fontSize: '0.62rem', fontWeight: 'bold' }}>📎 NOTE · {item.classTitle}</span>}
                                            {(item as any).date && <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>📅 {timeAgo((item as any).date)}</span>}
                                        </div>
                                    </div>
                                    {/* Action */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            style={{ padding: '0.35rem 0.75rem', borderRadius: '7px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-muted)', fontSize: '0.72rem', textDecoration: 'none', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                            ↗ Open
                                        </a>
                                        <div style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>›</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── CLASS CARDS VIEW ─── */}
            {!isBookTab && (
                <>
                    <div className="video-grid">
                        {filteredClasses.map((v, idx) => (
                            <div key={v.id + idx} className="video-card glass-panel animate-fade-in" style={{ animationDelay: `${Math.min(0.05 * idx, 0.8)}s`, display: 'flex', flexDirection: 'column' }}>
                                <div className="video-thumbnail-container" onClick={() => handleVideoClick(v, { title: v.subTitle })} style={{ cursor: 'pointer' }}>
                                    <img loading="lazy" decoding="async" src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt="Thumbnail" className="video-thumbnail" />
                                    <span className="video-duration" style={{ background: v.type === 'live' ? 'rgba(239,68,68,0.9)' : 'rgba(59,130,246,0.9)' }}>{v.type.toUpperCase()}</span>
                                </div>
                                <div className="video-info" style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleVideoClick(v, { title: v.subTitle })}>
                                    <h3 className="video-title text-white">{v.title}</h3>
                                    <div className="video-channel"><span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> {v.subTitle}</div>
                                    <div className="video-meta">{timeAgo(v.date)}</div>
                                </div>
                                {/* Attached Notes */}
                                {v.notes && v.notes.length > 0 && (
                                    <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>📎 Notes ({v.notes.length})</div>
                                        {v.notes.map((note: any, ni: number) => (
                                            <button key={ni} onClick={() => setPdfPreview({ url: note.url, title: note.title })}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06))', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(251,191,36,0.15))'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.6)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06))'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}>
                                                <div style={{ width: 30, height: 30, borderRadius: '6px', flexShrink: 0, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', boxShadow: '0 2px 6px rgba(245,158,11,0.35)' }}>📄</div>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ color: '#fcd34d', fontWeight: '600', fontSize: '0.76rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</div>
                                                    <div style={{ color: 'rgba(253,211,77,0.55)', fontSize: '0.62rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                        <span>📅 {timeAgo(note.date)}</span>
                                                        <span>· Tap to preview</span>
                                                    </div>
                                                </div>
                                                <span style={{ color: '#f59e0b', fontSize: '1rem', flexShrink: 0 }}>›</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {filteredClasses.length === 0 && (
                        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem' }}>🔍</div>
                            <h3 style={{ marginTop: '1rem' }}>No classes found.</h3>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudyMode;

