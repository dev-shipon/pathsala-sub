import React from 'react';
import { FaCheck, FaWhatsapp } from 'react-icons/fa';
import { auth } from '../../firebase';

interface PlanProps {
  name: string;
  price?: string;
  features: string[];
  isPopular?: boolean;
  isWhatsApp?: boolean;
  onSelect: () => void;
}

const Plan: React.FC<PlanProps> = ({ name, price, features, isPopular, isWhatsApp, onSelect }) => (
  <div className={`relative flex flex-col h-full p-10 rounded-[3rem] border transition-all duration-500 group overflow-hidden ${isPopular ? 'border-blue-500/50 bg-blue-500/[0.03] shadow-2xl shadow-blue-500/10' : 'border-white/10 bg-white/[0.01] hover:bg-white/[0.03]'}`}>
    {/* Subtle Glow Effect */}
    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 blur-[60px] rounded-full pointer-events-none transition-opacity duration-500 ${isPopular ? 'bg-blue-600/20 opacity-100' : 'bg-white/10 opacity-0 group-hover:opacity-100'}`}></div>

    {isPopular && (
      <div className="absolute top-8 right-8 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
        Best Choice
      </div>
    )}

    <div className="relative z-10 flex flex-col h-full">
      <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-slate-300'}`}>{name}</h3>
      <div className="flex items-baseline gap-2 mb-10">
        {price ? (
          <>
            <span className="text-5xl font-bold text-white tracking-tighter">{price}</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">/ Lifetime</span>
          </>
        ) : (
          <span className="text-3xl font-bold text-white tracking-tight py-2 italic opacity-60">Price on Contact</span>
        )}
      </div>
      
      <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-10"></div>

      <ul className="flex-grow space-y-5 mb-12">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-4 text-slate-400 group/item">
            <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isPopular ? 'bg-blue-500/20 text-blue-500' : 'bg-white/5 text-slate-600 group-hover/item:text-white'}`}>
              <FaCheck className="text-[10px]" />
            </div>
            <span className="text-sm leading-relaxed transition-colors group-hover/item:text-slate-200">{f}</span>
          </li>
        ))}
      </ul>
      
      <button
        onClick={() => {
          if (isWhatsApp) {
            window.open(`https://wa.me/+8801570215792?text=I'm interested in the ${name} plan. Please give me more details.`, '_blank');
          }
          onSelect();
        }}
        className={`w-full py-5 rounded-[1.5rem] font-bold text-sm transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2 ${isPopular ? 'bg-white text-slate-900 hover:bg-slate-100' : isWhatsApp ? 'bg-[#25D366] text-white hover:bg-[#128C7E]' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
      >
        {isWhatsApp && <FaWhatsapp className="text-lg" />}
        {isWhatsApp ? 'Confirm on WhatsApp' : `Choose ${name}`}
      </button>
    </div>
  </div>
);

const Subscription: React.FC<{ onComplete: (plan: string) => void }> = ({ onComplete }) => {
  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-200 overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/[0.05] rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/[0.05] rounded-full blur-[140px] pointer-events-none animate-pulse delay-1000"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-24 max-w-3xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            Special Offer: Lifetime Access
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 font-siliguri tracking-tight leading-tight">আপনার ভবিষ্যতের জন্য <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">সেরা প্ল্যানটি</span> বেছে নিন</h2>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            ইঞ্জিনিয়ারিং শিক্ষার পূর্ণাঙ্গ রিসোর্স এবং সাপোর্ট পেতে আজই আমাদের সাথে যুক্ত হোন।
          </p>
        </div>

        {/* Plans Grid - Centered single plan */}
        <div className="flex justify-center w-full animate-fade-in delay-100">
          <div className="w-full max-w-md">
            <Plan 
              name="All-In-One Pathshala Pass" 
              features={[
                "সব ভিডিও ক্লাসের অ্যাক্সেস",
                "অধ্যায়ভিত্তিক সব PDF নোটস",
                "সাপ্তাহিক লাইভ সাপোর্ট ক্লাস",
                "ডিপ্লোমা এক্সাম স্পেশাল সাজেশন",
                "১-টু-১ পার্সোনাল মেন্টরশিপ",
                "লাইফটাইম মেম্বারশিপ সাপোর্ট"
              ]} 
              isPopular
              isWhatsApp
              onSelect={() => onComplete('all-in-one')}
            />
          </div>
        </div>

        {/* Support & Switch Account Section */}
        <div className="mt-24 pt-16 border-t border-white/5 w-full flex flex-col items-center gap-10 animate-fade-in delay-200">
          <div className="flex flex-col items-center gap-4">
            <p className="text-slate-500 text-sm font-medium">Have questions? We're here to help you choose the right path.</p>
            <a 
              href="https://wa.me/+8801570215792"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-5 px-10 py-5 bg-white/[0.03] border border-white/10 rounded-3xl hover:bg-white/[0.07] hover:border-white/20 transition-all shadow-2xl active:scale-[0.98]"
            >
              <div className="p-3 bg-[#25D366]/10 rounded-2xl group-hover:bg-[#25D366]/20 transition-colors">
                <FaWhatsapp className="text-3xl text-[#25D366]" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">24/7 Support</span>
                <span className="text-lg font-bold text-white">Contact on WhatsApp</span>
              </div>
            </a>
          </div>

          <button 
            onClick={() => auth.signOut()}
            className="text-slate-600 hover:text-red-400 text-xs font-bold uppercase tracking-[0.2em] transition-colors py-4 px-8"
          >
            Switch to another account
          </button>
        </div>
      </div>
    </div>
  );
};
export default Subscription;
