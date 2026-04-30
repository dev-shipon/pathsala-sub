import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative group">
                {/* Glow Background */}
                <div className="absolute inset-0 bg-blue-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-xl"></div>
                
                {/* SVG Icon */}
                <svg 
                    width="44" 
                    height="44" 
                    viewBox="0 0 100 100" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative z-10 drop-shadow-2xl transform group-hover:rotate-12 transition-all duration-700"
                >
                    {/* Outer Futuristic Hexagon/Shield */}
                    <path 
                        d="M50 5 L92 27 V73 L50 95 L8 73 V27 L50 5Z" 
                        fill="url(#shield_grad)" 
                        className="drop-shadow-lg"
                    />
                    
                    {/* Inner Glowing Layer */}
                    <path 
                        d="M50 15 L82 32 V68 L50 85 L18 68 V32 L50 15Z" 
                        fill="white" 
                        fillOpacity="0.1" 
                    />

                    {/* Stylized 'T' & 'P' Abstract Path */}
                    <path 
                        d="M40 30H65V40H55V75H45V40H40V30ZM60 45C65 45 70 49 70 55C70 61 65 65 60 65H55V45H60Z" 
                        fill="white" 
                        className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    />
                    
                    {/* Bottom Tech Detail */}
                    <rect x="40" y="80" width="20" height="2" rx="1" fill="white" fillOpacity="0.5" />

                    <defs>
                        <linearGradient id="shield_grad" x1="8" y1="5" x2="92" y2="95" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#2563EB" />
                            <stop offset="0.5" stopColor="#3B82F6" />
                            <stop offset="1" stopColor="#6366F1" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <div className="flex flex-col">
                <span className="text-2xl font-black text-white tracking-tighter leading-none font-siliguri italic">
                    TALUKDAR <span className="text-blue-500">PATHSHALA</span>
                </span>
                <span className="text-[7px] font-bold uppercase tracking-[0.6em] text-slate-500 mt-1 pl-1">
                    Engineering Excellence
                </span>
            </div>
        </div>
    );
};

export default Logo;
