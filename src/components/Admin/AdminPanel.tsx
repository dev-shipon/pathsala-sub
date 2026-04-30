import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaVideo, FaShieldAlt, FaTrash, FaPlus, FaSignOutAlt, FaHome } from 'react-icons/fa';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [allData, setAllData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'syllabus' | 'books' | 'users'>('users');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Syllabus Form
  const [adminDept, setAdminDept] = useState('Computer');
  const [adminSemName, setAdminSemName] = useState('');
  const [adminSemSlug, setAdminSemSlug] = useState('');
  const [adminJson, setAdminJson] = useState('');
  const [saving, setSaving] = useState(false);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'shipontalukdaroffice@gmail.com') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        if (!user) navigate('/login');
        else navigate('/');
      }
    });

    const unsubData = onSnapshot(query(collection(db, 'pathshala_data'), orderBy('updatedAt', 'desc')), (snap) => {
      setAllData(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      setAllUsers(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    });

    return () => { unsubscribe(); unsubData(); unsubUsers(); };
  }, [navigate]);

  if (isAuthorized === false) return null; // Prevent flicker before redirect

  const saveSyllabus = async () => {
    if (!adminSemName || !adminSemSlug || !adminJson) return alert('Fill all fields!');
    try {
      setSaving(true);
      const item = { 
        department: adminDept, 
        semesterName: adminSemName, 
        slug: adminSemSlug, 
        fullData: JSON.parse(adminJson), 
        updatedAt: new Date().toISOString() 
      };
      await setDoc(doc(db, 'pathshala_data', adminSemSlug), item);
      alert('Syllabus saved!');
      setAdminSemName(''); setAdminSemSlug(''); setAdminJson('');
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally { setSaving(false); }
  };

  const approveUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'approved' });
      alert('User approved!');
    } catch (e: any) { alert(e.message); }
  };

  const deleteUser = async (uid: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        alert('User deleted!');
      } catch (e: any) { alert(e.message); }
    }
  };

  const deleteSyllabus = async (id: string) => {
    if (window.confirm('Delete this course?')) {
      await deleteDoc(doc(db, 'pathshala_data', id));
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-slate-500 text-sm">Manage courses, books and user access</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-xs hover:bg-white/10 transition-all"
            >
              <FaHome /> <span>Dashboard</span>
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-xs hover:bg-red-500/20 transition-all"
            >
              <FaSignOutAlt /> <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar Tabs */}
          <div className="flex flex-col gap-2">
            {[
              { id: 'syllabus', icon: <FaVideo />, label: 'Syllabus & Classes' },
              { id: 'books', icon: <FaBook />, label: 'Digital Library' },
              { id: 'users', icon: <FaShieldAlt />, label: 'User Management' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                {tab.icon} <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'syllabus' && (
              <div className="flex flex-col gap-10 animate-fade-in">
                {/* Form */}
                <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl">
                  <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                    <FaPlus className="text-blue-500" /> Add New Course
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Department</label>
                      <select 
                        value={adminDept} 
                        onChange={e => setAdminDept(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                      >
                        {['Computer', 'Civil', 'Electrical', 'Mechanical', 'Electronics'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Semester Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 5th Semester" 
                        value={adminSemName} 
                        onChange={e => setAdminSemName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unique Slug</label>
                      <input 
                        type="text" 
                        placeholder="e.g. computer-5th" 
                        value={adminSemSlug} 
                        onChange={e => setAdminSemSlug(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-8">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Course JSON Data</label>
                    <textarea 
                      rows={10} 
                      placeholder="Paste JSON here..." 
                      value={adminJson} 
                      onChange={e => setAdminJson(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs text-slate-300 outline-none focus:border-blue-500/50 transition-all font-mono leading-relaxed"
                    ></textarea>
                  </div>
                  <button 
                    onClick={saveSyllabus}
                    disabled={saving}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Syllabus'}
                  </button>
                </div>

                {/* List */}
                <div className="grid md:grid-cols-2 gap-6">
                  {allData.map(course => (
                    <div key={course.firestoreId} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col gap-6 hover:bg-white/[0.04] transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-bold">{course.semesterName}</h3>
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">{course.department}</p>
                        </div>
                        <button onClick={() => deleteSyllabus(course.firestoreId)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all">
                          <FaTrash />
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 bg-white/5 p-4 rounded-xl font-mono">
                        ID: {course.firestoreId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="grid grid-cols-1 gap-4">
                  {allUsers.length === 0 ? (
                    <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 text-center py-32 text-slate-500">
                      <FaShieldAlt className="text-5xl mx-auto mb-6 opacity-20" />
                      <p>No users found in the system.</p>
                    </div>
                  ) : (
                    allUsers.map(user => (
                      <div key={user.uid} className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.05] transition-all">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${user.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg">{user.displayName || 'No Name'}</h3>
                            <p className="text-slate-500 text-sm">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex flex-col items-end px-4">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Status</span>
                            <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${user.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {user.status?.toUpperCase() || 'NEW'}
                            </span>
                          </div>
                          <div className="flex flex-col items-end px-4 border-l border-white/5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Plan</span>
                            <span className="text-[11px] font-bold text-blue-400">
                              {user.subscription?.toUpperCase() || 'NONE'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {user.status === 'pending' && (
                              <button 
                                onClick={() => approveUser(user.uid)}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                              >
                                Approve
                              </button>
                            )}
                            <button 
                              onClick={() => deleteUser(user.uid)}
                              className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'books' && (
              <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 text-center py-32 text-slate-500">
                <FaBook className="text-5xl mx-auto mb-6 opacity-20" />
                <p>Digital Library Management Coming Soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
