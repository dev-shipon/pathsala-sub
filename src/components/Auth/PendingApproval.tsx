import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

const PendingApproval: React.FC = () => {
  const whatsappNumber = "+8801570215792";
  const whatsappMessage = encodeURIComponent("Hello Admin, I have selected a plan for Talukdar Pathsala. Please approve my account.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#020617] overflow-hidden p-6 font-inter">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/[0.05] rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/[0.05] rounded-full blur-[140px] pointer-events-none animate-pulse delay-1000"></div>

      <div className="relative z-10 w-full max-w-lg bg-white/[0.03] border border-white/10 rounded-[3rem] p-10 md:p-16 backdrop-blur-xl text-center shadow-2xl">
        <div className="inline-flex p-6 bg-amber-500/10 rounded-[2.5rem] mb-10 border border-amber-500/20 shadow-xl shadow-amber-500/5">
          <svg className="w-14 h-14 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-4xl font-bold text-white mb-6 tracking-tight font-siliguri leading-tight">অনুমোদনের অপেক্ষা</h2>
        <p className="text-slate-400 mb-12 leading-relaxed max-w-sm mx-auto text-sm md:text-base">
          আপনার সাবস্ক্রিপশনটি বর্তমানে অ্যাডমিনের ভেরিফিকেশনের জন্য অপেক্ষায় আছে। দ্রুত অনুমোদনের জন্য নিচে হোয়াটসঅ্যাপ বাটনে ক্লিক করুন।
        </p>

        <div className="flex flex-col gap-6 max-w-xs mx-auto">
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-4 w-full py-5 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#20ba5a] transition-all shadow-2xl shadow-green-500/20 active:scale-95 transform hover:scale-[1.02]"
          >
            <FaWhatsapp className="text-2xl" />
            <span className="text-sm">Confirm via WhatsApp</span>
          </a>

          <button 
            onClick={() => signOut(auth)}
            className="py-3 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            Switch Account
          </button>
        </div>

        <div className="mt-16 pt-10 border-t border-white/5">
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Admin Support Line</p>
            <p className="text-white font-mono text-sm tracking-widest">+880 1570-215792</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
