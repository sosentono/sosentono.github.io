import React, { useState } from 'react';
import {
  ChevronDown,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
  Type,
  Calendar,
  Newspaper,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  textSize: 'normal' | 'large' | 'xlarge';
  setTextSize: (size: 'normal' | 'large' | 'xlarge') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  textSize,
  setTextSize,
}) => {
  const { currentAdmin, isAdmin, isMasterAdmin, logout } = useAuth();
  const { settings } = useFamily();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [infoDropdownOpen, setInfoDropdownOpen] = useState(false);

  const cycleTextSize = () => {
    if (textSize === 'normal') setTextSize('large');
    else if (textSize === 'large') setTextSize('xlarge');
    else setTextSize('normal');
  };

  const isInfoActive = ['agenda', 'kabar'].includes(activeTab);

  return (
    <nav className="sticky top-0 z-40 bg-[#20150b] text-stone-200 border-b-2 border-[#C9A84C] shadow-md px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        
        {/* Brand: • Trah Sosentono */}
        <div
          onClick={() => setActiveTab('beranda')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <span className="w-2 h-2 rounded-full bg-[#C9A84C] opacity-80 group-hover:opacity-100 transition-opacity" />
          <span className="font-serif-title font-bold text-base sm:text-lg text-[#C9A84C] tracking-wide group-hover:text-[#E8D4A0] transition-colors">
            {settings.familyName || 'Trah Sosentono'}
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-2 text-xs font-semibold uppercase tracking-wider">
          {/* Beranda */}
          <button
            onClick={() => setActiveTab('beranda')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'beranda'
                ? 'text-[#C9A84C] font-bold border-b-2 border-[#C9A84C]'
                : 'text-stone-300 hover:text-[#C9A84C]'
            }`}
          >
            Beranda
          </button>

          {/* Pohon */}
          <button
            onClick={() => setActiveTab('pohon')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'pohon'
                ? 'text-[#C9A84C] font-bold border-b-2 border-[#C9A84C]'
                : 'text-stone-300 hover:text-[#C9A84C]'
            }`}
          >
            Pohon
          </button>

          {/* Anggota */}
          <button
            onClick={() => setActiveTab('anggota')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'anggota'
                ? 'text-[#C9A84C] font-bold border-b-2 border-[#C9A84C]'
                : 'text-stone-300 hover:text-[#C9A84C]'
            }`}
          >
            Anggota
          </button>

          {/* Informasi Dropdown */}
          <div className="relative">
            <button
              onClick={() => setInfoDropdownOpen(!infoDropdownOpen)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
                isInfoActive
                  ? 'text-[#C9A84C] font-bold border-b-2 border-[#C9A84C]'
                  : 'text-stone-300 hover:text-[#C9A84C]'
              }`}
            >
              <span>Informasi</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {infoDropdownOpen && (
              <div
                onMouseLeave={() => setInfoDropdownOpen(false)}
                className="absolute right-0 top-full mt-2 w-56 bg-[#26190e] border border-[#C9A84C]/40 rounded-xl shadow-2xl py-1.5 z-50 normal-case text-left animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  onClick={() => {
                    setActiveTab('agenda');
                    setInfoDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-xs flex items-center gap-2.5 transition-colors ${
                    activeTab === 'agenda' ? 'bg-[#3b2716] text-[#C9A84C] font-semibold' : 'text-stone-200 hover:bg-[#322013] hover:text-[#C9A84C]'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-[#C9A84C]" />
                  <div>
                    <div className="font-medium">Agenda & Arisan Pon</div>
                    <div className="text-[10px] text-stone-400">Siklus 35 hari & Syawal</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('agenda');
                    setInfoDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs flex items-center gap-2.5 text-stone-200 hover:bg-[#322013] hover:text-[#C9A84C] transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-[#C9A84C]" />
                  <div>
                    <div className="font-medium">Galeri Foto Trah</div>
                    <div className="text-[10px] text-stone-400">Dokumentasi momen & pertemuan</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('kabar');
                    setInfoDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-xs flex items-center gap-2.5 transition-colors ${
                    activeTab === 'kabar' ? 'bg-[#3b2716] text-[#C9A84C] font-semibold' : 'text-stone-200 hover:bg-[#322013] hover:text-[#C9A84C]'
                  }`}
                >
                  <Newspaper className="w-4 h-4 text-[#C9A84C]" />
                  <div>
                    <div className="font-medium">Kabar Trah</div>
                    <div className="text-[10px] text-stone-400">Kelahiran, duka, prestasi</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Elder Text Size Switcher */}
          <button
            onClick={cycleTextSize}
            title="Ukuran teks untuk sesepuh"
            className="px-2 py-1 rounded border border-[#C9A84C]/30 text-stone-300 hover:text-[#C9A84C] text-[11px] normal-case flex items-center gap-1 ml-1 transition-colors"
          >
            <Type className="w-3 h-3 text-[#C9A84C]" />
            <span>{textSize === 'normal' ? 'A' : textSize === 'large' ? 'A+' : 'A++'}</span>
          </button>

          {/* Admin Button */}
          {currentAdmin && isAdmin ? (
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-[#C9A84C] text-[#20150b] font-bold shadow-xs'
                    : 'text-stone-300 hover:text-[#C9A84C]'
                }`}
              >
                {isMasterAdmin ? (
                  <span className="text-xs">👑</span>
                ) : (
                  <Settings className="w-3.5 h-3.5" />
                )}
                <span>{isMasterAdmin ? 'Master Admin' : 'Admin'}</span>
              </button>
              <button
                onClick={logout}
                className="p-1 text-stone-400 hover:text-rose-400 transition-colors"
                title="Keluar Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ml-2 ${
                activeTab === 'admin'
                  ? 'bg-[#C9A84C] text-[#20150b] font-bold shadow-xs'
                  : 'text-stone-300 hover:text-[#C9A84C]'
              }`}
            >
              <Settings className="w-3.5 h-3.5 opacity-80" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={cycleTextSize}
            className="p-1.5 text-stone-300 hover:text-[#C9A84C]"
            title="Ukuran teks"
          >
            <Type className="w-4 h-4 text-[#C9A84C]" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#E8D4A0] hover:text-[#C9A84C]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#24180e] border-t border-[#C9A84C]/20 px-4 py-3 space-y-1 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => {
              setActiveTab('beranda');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 ${
              activeTab === 'beranda' ? 'text-[#C9A84C]' : 'text-stone-300'
            }`}
          >
            🏠 Beranda
          </button>
          <button
            onClick={() => {
              setActiveTab('pohon');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 ${
              activeTab === 'pohon' ? 'text-[#C9A84C]' : 'text-stone-300'
            }`}
          >
            🌳 Pohon Keluarga
          </button>
          <button
            onClick={() => {
              setActiveTab('anggota');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 ${
              activeTab === 'anggota' ? 'text-[#C9A84C]' : 'text-stone-300'
            }`}
          >
            👥 Anggota
          </button>
          <button
            onClick={() => {
              setActiveTab('agenda');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 ${
              activeTab === 'agenda' ? 'text-[#C9A84C]' : 'text-stone-300'
            }`}
          >
            📅 Agenda & Arisan Pon
          </button>
          <button
            onClick={() => {
              setActiveTab('agenda');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-stone-300 hover:text-[#C9A84C]"
          >
            🖼️ Galeri Foto Trah
          </button>
          <button
            onClick={() => {
              setActiveTab('kabar');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 ${
              activeTab === 'kabar' ? 'text-[#C9A84C]' : 'text-stone-300'
            }`}
          >
            📰 Kabar Trah
          </button>
          <button
            onClick={() => {
              setActiveTab('admin');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 font-bold ${
              activeTab === 'admin' ? 'text-[#C9A84C]' : 'text-stone-300 hover:text-[#C9A84C]'
            }`}
          >
            {isMasterAdmin ? '👑 Master Admin Panel' : isAdmin ? '🛡️ Admin Panel' : '⚙ Admin Panel'}
          </button>
        </div>
      )}
    </nav>
  );
};
