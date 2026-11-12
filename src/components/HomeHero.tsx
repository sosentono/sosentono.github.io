import React from 'react';
import { Settings, Person } from '../types';

interface HomeHeroProps {
  settings: Settings;
  wiwitanPerson: Person | undefined;
  memberCount: number;
  generationCount: number;
  agendaCount: number;
  onNavigate?: (tab: string) => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  settings,
  wiwitanPerson,
  memberCount,
  generationCount,
  agendaCount,
  onNavigate,
}) => {
  const familyName = settings.familyName.replace(/^Trah\s*(Simbah\s*)?/i, '') || 'Sosentono';

  return (
    <div className="hero-pattern text-center text-white py-12 sm:py-16 px-4 border-b border-[#3d2716] shadow-inner relative overflow-hidden">
      <div className="relative max-w-4xl mx-auto space-y-4">
        
        {/* Cultural Motto Eyebrow Pill from prototype */}
        <div>
          <span className="inline-block text-[10px] sm:text-[11px] tracking-[2.5px] font-bold uppercase text-[#C9A84C] border border-[#C9A84C] bg-[rgba(201,168,76,0.14)] px-4 py-1 rounded-full shadow-xs">
            OJO PEDOT OYOT! JANGAN PUTUS AKAR!
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif-title text-3xl sm:text-5xl text-white font-bold leading-tight tracking-tight">
          <span>Trah Simbah </span>
          <br className="sm:hidden" />
          <span className="italic font-normal text-[#C9A84C] font-serif">
            {familyName}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#E8D4A0] opacity-85 font-light tracking-wide max-w-xl mx-auto">
          Menjaga warisan · Menghormati akar · Menghubungkan generasi
        </p>

        {/* 3 Metric Counters Matching Prototype with modern refinement */}
        <div className="pt-4 flex justify-center items-center gap-8 sm:gap-14">
          <div
            onClick={() => onNavigate && onNavigate('anggota')}
            className={`text-center group ${onNavigate ? 'cursor-pointer' : ''}`}
          >
            <div className="text-3xl sm:text-4xl font-serif text-[#C9A84C] font-bold group-hover:scale-105 transition-transform">
              {memberCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#E8D4A0] uppercase tracking-[1.5px] opacity-75 mt-0.5">
              Anggota
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('pohon')}
            className={`text-center group ${onNavigate ? 'cursor-pointer' : ''}`}
          >
            <div className="text-3xl sm:text-4xl font-serif text-[#C9A84C] font-bold group-hover:scale-105 transition-transform">
              {generationCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#E8D4A0] uppercase tracking-[1.5px] opacity-75 mt-0.5">
              Generasi
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('agenda')}
            className={`text-center group ${onNavigate ? 'cursor-pointer' : ''}`}
          >
            <div className="text-3xl sm:text-4xl font-serif text-[#C9A84C] font-bold group-hover:scale-105 transition-transform">
              {agendaCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#E8D4A0] uppercase tracking-[1.5px] opacity-75 mt-0.5">
              Agenda
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
