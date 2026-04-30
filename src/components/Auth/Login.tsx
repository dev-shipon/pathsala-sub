import React, { useState } from 'react';
import { auth, db, googleProvider } from '../../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FcGoogle } from 'react-icons/fc';
import { FaEnvelope, FaLock, FaUser, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../UI/Logo';

const Login: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName });
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          status: 'new',
          subscription: null,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#020617] overflow-hidden p-6 font-inter">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/[0.08] rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/[0.08] rounded-full blur-[140px] pointer-events-none animate-pulse delay-1000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-10"
        >
          <Logo className="h-16" />
        </motion.div>

        {/* Auth Card */}
        <motion.div 
          layout
          className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                {isSignup ? 'Join our community of engineering students' : 'বাংলাদেশের ডিপ্লোমা ইঞ্জিনিয়ারিং শিক্ষার্থীদের জন্য অনলাইন প্ল্যাটফর্ম।'}
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] p-3 rounded-xl text-center font-bold"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {isSignup && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      required={isSignup}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <span>{loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Sign In')}</span>
              {!loading && <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />}
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <span className="relative bg-[#020617] px-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            >
              <FcGoogle className="text-xl" />
              <span>Google</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsSignup(!isSignup)}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
              <span className="text-blue-400 font-bold">{isSignup ? 'Sign In' : 'Sign Up'}</span>
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">© 2026 Talukdar Pathshala</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
