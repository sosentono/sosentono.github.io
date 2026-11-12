import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Sparkles,
  FolderOpen,
  Image as ImageIcon,
  ExternalLink,
  Maximize2,
  X,
  ArrowRight,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { Agenda, AgendaType, Settings, GalleryItem } from '../../types';
import { format24HourWIB } from '../../utils/javaneseCalendar';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { AgendaCard } from './AgendaCard';
import { AgendaDetailModal } from './AgendaDetailModal';
import { GalleryFormModal } from './GalleryFormModal';
import { INITIAL_GALLERY } from '../../utils/seedData';

interface AgendaSectionProps {
  agendas: Agenda[];
  settings: Settings;
  isAdmin?: boolean;
  onAddAgenda?: () => void;
  onEditAgenda?: (agenda: Agenda) => void;
  onDeleteAgenda?: (id: string) => Promise<void>;
  onSaveAgenda?: (agendaData: Omit<Agenda, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateSettings?: (settingsData: Partial<Settings>) => Promise<void>;
  onNavigate?: (tab: string) => void;
}

const CATEGORY_OPTIONS = [
  'Arisan Trah',
  'Syawalan Trah',
  'Lain-lain'
];

// Presets jam ramah orang tua
const TIME_PRESETS = [
  { label: 'Arisan Minggu Pon', timeStr: '09:30 - 13:00 WIB', sh: '09', sm: '30', eh: '13', em: '00', mode: 'TIME' },
  { label: 'Pagi', timeStr: '08:00 - 11:30 WIB', sh: '08', sm: '00', eh: '11', em: '30', mode: 'TIME' },
  { label: 'Siang', timeStr: '10:00 - 14:00 WIB', sh: '10', sm: '00', eh: '14', em: '00', mode: 'TIME' },
  { label: 'Sore', timeStr: '13:30 - 16:30 WIB', sh: '13', sm: '30', eh: '16', em: '30', mode: 'TIME' },
  { label: 'Malam', timeStr: '19:30 - 22:00 WIB', sh: '19', sm: '30', eh: '22', em: '00', mode: 'TIME' },
  { label: 'Selesai', timeStr: '09:30 WIB - Selesai', sh: '09', sm: '30', eh: '13', em: '00', mode: 'SELESAI' },
];

export const AgendaSection: React.FC<AgendaSectionProps> = ({
  agendas,
  settings,
  isAdmin: propIsAdmin,
  onAddAgenda,
  onEditAgenda,
  onDeleteAgenda,
  onSaveAgenda,
  onUpdateSettings,
  onNavigate,
}) => {
  const { isAdmin: authIsAdmin, currentAdmin } = useAuth();
  const isAdmin = useMemo(() => {
    if (propIsAdmin !== undefined && propIsAdmin) return true;
    if (authIsAdmin || !!currentAdmin) return true;
    if (typeof window !== 'undefined') {
      try {
        const s1 = localStorage.getItem('trah_sosentono_active_admin_session');
        const s2 = localStorage.getItem('trah_soesentono_active_admin_session');
        if (s1 || s2) return true;
      } catch (e) {
        // ignore
      }
    }
    return false;
  }, [propIsAdmin, authIsAdmin, currentAdmin]);
  const {
    gallery = [],
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
  } = useFamily();
  const [activeTab, setActiveTab] = useState<'ALL' | 'ARISAN' | 'TRAH_BESAR' | 'OTHER'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [sectionView, setSectionView] = useState<'AGENDA' | 'BERITA'>('AGENDA');

  // Modal Detail Agenda
  const [selectedAgendaForDetail, setSelectedAgendaForDetail] = useState<Agenda | null>(null);

  // Form state untuk Tambah Agenda di kolom kiri
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCategory, setFormCategory] = useState('Arisan Trah');
  const [formDocUrl, setFormDocUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Waktu pelaksanaan (Format 24 Jam WIB - Ramah Orang Tua)
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('30');
  const [endMode, setEndMode] = useState<'TIME' | 'SELESAI'>('TIME');
  const [endHour, setEndHour] = useState('13');
  const [endMinute, setEndMinute] = useState('00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Notifikasi status
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [galleryNotice, setGalleryNotice] = useState<string | null>(null);

  // Galeri foto dokumentasi state
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<GalleryItem | null>(null);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<GalleryItem | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<string>('ALL');

  // Handlers untuk CRUD Galeri Dokumentasi (Khusus Admin)
  const handleOpenAddPhoto = () => {
    setPhotoToEdit(null);
    setIsGalleryModalOpen(true);
  };

  const handleOpenEditPhoto = (photo: GalleryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPhotoToEdit(photo);
    setIsGalleryModalOpen(true);
  };

  const handleSaveGalleryPhoto = async (photoData: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (photoToEdit && !photoToEdit.id.startsWith('agenda-')) {
        await updateGalleryItem(photoToEdit.id, photoData);
        setGalleryNotice(`Foto "${photoData.title}" berhasil diperbarui.`);
        if (activeLightboxPhoto?.id === photoToEdit.id) {
          setActiveLightboxPhoto(prev => prev ? { ...prev, ...photoData } : null);
        }
      } else {
        await addGalleryItem(photoData);
        setGalleryNotice(`Foto "${photoData.title}" berhasil ditambahkan ke galeri.`);
      }
      setIsGalleryModalOpen(false);
      setPhotoToEdit(null);
      setTimeout(() => setGalleryNotice(null), 4000);
    } catch (err: any) {
      console.error('Error saving gallery item:', err);
      setGalleryNotice(`Gagal menyimpan foto: ${err.message || 'Terjadi kesalahan'}`);
      throw err;
    }
  };

  const handleDeleteGalleryPhoto = async (photoId: string, photoTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDeletePhotoId(null);
    try {
      if (photoId.startsWith('agenda-')) {
        setGalleryNotice('Foto ini bersumber dari data agenda. Untuk menghapusnya, silakan sunting agenda terkait.');
        setTimeout(() => setGalleryNotice(null), 4000);
        return;
      }
      await deleteGalleryItem(photoId);
      setGalleryNotice(`Foto "${photoTitle}" berhasil dihapus.`);
      if (activeLightboxPhoto?.id === photoId) {
        setActiveLightboxPhoto(null);
      }
      setTimeout(() => setGalleryNotice(null), 3500);
    } catch (err: any) {
      console.error('Error deleting gallery item:', err);
      setGalleryNotice(`Gagal menghapus: ${err.message || 'Terjadi kesalahan'}`);
    }
  };

  const computedTime = useMemo(() => {
    if (endMode === 'SELESAI') {
      return `${startHour}:${startMinute} WIB - Selesai`;
    }
    return `${startHour}:${startMinute} - ${endHour}:${endMinute} WIB`;
  }, [startHour, startMinute, endMode, endHour, endMinute]);

  const sortedAgendas = useMemo(() => {
    return [...agendas].sort((a, b) => {
      if (sortOrder === 'NEWEST') {
        return b.date.localeCompare(a.date);
      }
      return a.date.localeCompare(b.date);
    });
  }, [agendas, sortOrder]);

  const filteredAgendas = useMemo(() => {
    if (activeTab === 'ALL') return sortedAgendas;
    return sortedAgendas.filter(a => {
      if (activeTab === 'ARISAN') return a.type === 'ARISAN' || a.category === 'Arisan Trah';
      if (activeTab === 'TRAH_BESAR') return a.type === 'TRAH_BESAR' || a.category === 'Syawalan Trah';
      if (activeTab === 'OTHER') return a.type === 'OTHER' || a.category === 'Lain-lain';
      return true;
    });
  }, [sortedAgendas, activeTab]);

  // Kumpulkan foto galeri dari koleksi Firestore
  const allGalleryPhotos = useMemo(() => {
    return gallery ? [...gallery] : [];
  }, [gallery]);

  const filteredGalleryPhotos = useMemo(() => {
    if (galleryFilter === 'ALL') return allGalleryPhotos;
    return allGalleryPhotos.filter(p => p.category === galleryFilter);
  }, [allGalleryPhotos, galleryFilter]);

  // Hapus instan
  const handleDirectDelete = (id: string, title: string) => {
    if (!onDeleteAgenda) return;
    setDeleteNotice(`Agenda "${title}" berhasil dihapus.`);
    setTimeout(() => setDeleteNotice(null), 3500);

    onDeleteAgenda(id).catch((err: any) => {
      console.error('Delete error in background:', err);
      setDeleteNotice(`Gagal menghapus: ${err.message || 'Koneksi bermasalah'}`);
    });
  };

  // Submit form tambah agenda di kolom kiri
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formTitle.trim() || !formDate) {
      setFormError('Judul acara dan tanggal wajib diisi');
      return;
    }

    if (!onSaveAgenda) {
      if (onAddAgenda) onAddAgenda();
      return;
    }

    setIsSubmitting(true);

    let type: AgendaType = 'OTHER';
    if (formCategory === 'Arisan Trah') type = 'ARISAN';
    else if (formCategory === 'Syawalan Trah') type = 'TRAH_BESAR';
    else type = 'OTHER';

    try {
      await onSaveAgenda({
        type,
        title: formTitle.trim(),
        date: formDate,
        time: computedTime,
        location: formLocation.trim() || 'Lokasi Pertemuan Keluarga',
        category: formCategory,
        documentationUrl: formDocUrl.trim() || undefined,
        description: formDescription.trim() || undefined,
        status: 'UPCOMING',
      });

      // Reset form
      setFormTitle('');
      setFormDate('');
      setFormLocation('');
      setFormDocUrl('');
      setFormDescription('');
      setFormSuccess(true);
      setActiveTab('ALL');
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (err: any) {
      setFormError('Gagal menambah agenda ke Firebase: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* ================= SUBHEADER & TABS ================= */}
      <div className="border-b border-[#C9A84C]/30 pb-3">
        <p className="text-xs sm:text-sm text-stone-600 mb-3">
          Agenda kegiatan, dokumentasi foto, dan berita seputar keluarga {settings.familyName}
        </p>
        
        {/* Tab Navigasi: 📅 AGENDA | 📰 BERITA */}
        <div className="flex items-center gap-6 text-xs sm:text-sm font-bold uppercase tracking-wider">
          <button
            onClick={() => setSectionView('AGENDA')}
            className={`pb-2 transition-all flex items-center gap-2 border-b-2 ${
              sectionView === 'AGENDA'
                ? 'border-[#C9A84C] text-[#20150b] font-extrabold'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <span>📅</span>
            <span>Agenda Kegiatan ({agendas.length})</span>
          </button>

          <button
            onClick={() => {
              if (onNavigate) onNavigate('kabar');
              else setSectionView('BERITA');
            }}
            className="pb-2 transition-all flex items-center gap-2 border-b-2 border-transparent text-stone-400 hover:text-stone-700"
          >
            <span>📰</span>
            <span>Kabar & Berita Keluarga</span>
          </button>
        </div>
      </div>

      {/* ================= KONTEN UTAMA DUA KOLOM ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= KOLOM KIRI: FORM TAMBAH AGENDA (HANYA UNTUK ADMIN) ================= */}
        {isAdmin && (
          <div className="lg:col-span-4 bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="font-serif-title font-bold text-stone-900 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C9A84C]" />
                <span>Tambah Agenda Baru</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Isi form berikut untuk menerbitkan agenda ke seluruh keluarga
              </p>
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Agenda berhasil ditambahkan ke Firebase!</span>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-semibold text-rose-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              
              {/* JUDUL */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                  JUDUL ACARA *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="cth. Arisan Rutin Minggu Pon"
                  className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:bg-white text-xs"
                />
              </div>

              {/* TANGGAL */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                  TANGGAL *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:bg-white text-xs font-medium"
                />
              </div>

              {/* WAKTU PELAKSANAAN (24 JAM WIB - RAMAH ORANG TUA) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700 uppercase tracking-wider text-[11px]">
                    WAKTU PELAKSANAAN
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className="text-[10px] text-[#C9A84C] hover:underline font-bold"
                  >
                    {showTimePicker ? 'Tutup Pilihan' : 'Ubah Jam'}
                  </button>
                </div>

                {/* Display Jam Terpilih */}
                <div className="p-2.5 rounded-xl border border-stone-200 bg-[#FAF7F2] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-stone-900">
                    <Clock className="w-3.5 h-3.5 text-[#C9A84C]" />
                    <span>{computedTime}</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium">Format 24 Jam</span>
                </div>

                {/* Dropdown Presets Jam Mudah */}
                {showTimePicker && (
                  <div className="mt-2 p-2.5 rounded-xl bg-white border border-stone-200 shadow-sm space-y-2">
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Pilihan Waktu Cepat:
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TIME_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setStartHour(p.sh);
                            setStartMinute(p.sm);
                            setEndHour(p.eh);
                            setEndMinute(p.em);
                            setEndMode(p.mode as any);
                            setShowTimePicker(false);
                          }}
                          className="p-1.5 rounded-lg border border-stone-100 hover:border-[#C9A84C] bg-stone-50 hover:bg-[#FAF7F2] text-left text-[11px] text-stone-800 transition-colors"
                        >
                          <div className="font-semibold truncate">{p.label}</div>
                          <div className="text-[10px] text-stone-500 font-mono">{p.timeStr}</div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-stone-500">Selesai Acara:</span>
                      <button
                        type="button"
                        onClick={() => setEndMode(endMode === 'TIME' ? 'SELESAI' : 'TIME')}
                        className="text-[10px] font-bold text-amber-800 underline"
                      >
                        {endMode === 'SELESAI' ? 'Sampai Selesai' : `${endHour}:${endMinute} WIB`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* LOKASI */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                  LOKASI
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="cth. Dalem Bp. Raharjo, Sleman"
                  className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:bg-white text-xs"
                />
              </div>

              {/* KATEGORI */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                  KATEGORI
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:bg-white text-xs"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* LINK DOKUMENTASI (GOOGLE DRIVE) */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1 flex items-center justify-between">
                  <span>LINK DOKUMENTASI FOTO</span>
                  <span className="text-[9px] text-blue-600 font-normal">Google Drive</span>
                </label>
                <input
                  type="url"
                  value={formDocUrl}
                  onChange={(e) => setFormDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:bg-white text-xs font-mono"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Tempel tautan folder Google Drive untuk foto & video acara
                </p>
              </div>

              {/* KETERANGAN / RINGKASAN */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                  RINGKASAN & KETERANGAN
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ringkasan susunan acara, hasil arisan, notula silaturahmi..."
                  className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:bg-white text-xs"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C9A84C] hover:bg-[#b5943b] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan ke Firebase...' : '+ Tambah Agenda'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ================= KOLOM KANAN: DAFTAR KARTU AGENDA ================= */}
        <div className={`${isAdmin ? 'lg:col-span-8' : 'lg:col-span-12 max-w-4xl mx-auto w-full'} space-y-4`}>
          
          {/* Header Baris Kanan: Kategori Filter & Panduan Klik */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { label: 'Semua', val: 'ALL' },
                { label: 'Arisan Trah', val: 'ARISAN' },
                { label: 'Syawalan Trah', val: 'TRAH_BESAR' },
                { label: 'Lain-lain', val: 'OTHER' },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => setActiveTab(t.val as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === t.val
                      ? 'bg-[#20150b] text-[#C9A84C]'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium flex-wrap">
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors shadow-2xs"
                title="Klik untuk mengubah urutan tanggal agenda"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span>{sortOrder === 'NEWEST' ? 'Terbaru ke Terlama' : 'Terlama ke Terbaru'}</span>
              </button>
              <span className="font-mono bg-stone-100 px-2 py-1 rounded-lg text-[11px] text-stone-600 border border-stone-200">
                {filteredAgendas.length} agenda
              </span>
            </div>
          </div>

          {/* Daftar Agenda Menggunakan AgendaCard */}
          {filteredAgendas.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
              Belum ada agenda yang tersimpan.
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredAgendas.map((item) => (
                <AgendaCard
                  key={item.id}
                  agenda={item}
                  isAdmin={isAdmin}
                  onSelect={(ag) => setSelectedAgendaForDetail(ag)}
                  onEdit={isAdmin ? onEditAgenda : undefined}
                  onDelete={isAdmin ? handleDirectDelete : undefined}
                />
              ))}
            </div>
          )}

        </div>

      </div>

      {/* ================= SECTION BAWAH: GALERI FOTO DOKUMENTASI TRAH ================= */}
      <div className="pt-8 border-t-2 border-[#C9A84C]/40 space-y-6">
        
        {/* Dedicated Admin Control Banner for Gallery */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-amber-50 to-stone-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#20150b] text-[#C9A84C] flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
                👑
              </div>
              <div>
                <div className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-2">
                  <span>Menu Admin Galeri Foto Trah</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 font-mono text-[10px] font-bold">
                    {allGalleryPhotos.length} Foto
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Anda memiliki akses admin penuh untuk menambah foto baru, menyunting data, atau menghapus foto dokumentasi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenAddPhoto}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A84C] hover:bg-[#d6b75e] text-[#20150b] font-bold text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Tambah Foto Dokumentasi Baru ke Galeri"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Tambah Foto Dokumentasi</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('admin') : (window.location.hash = '#admin')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold text-xs shadow-2xs transition-colors"
                title="Buka panel admin utama untuk kelola galeri"
              >
                <span>Kelola di Panel Admin</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              </button>
            </div>
          </div>
        )}

        {/* Header Galeri */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C]/20 text-[#8B6B23] border border-[#C9A84C]/40 tracking-wider uppercase">
                Dokumentasi Trah
              </span>
              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-400/40 flex items-center gap-1">
                  <span>👑 Mode Admin: Akses Sunting Aktif</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                  Mode Tamu (Hanya Lihat)
                </span>
              )}
            </div>
            <h3 className="font-serif-title font-bold text-xl sm:text-2xl text-[#20150b] flex items-center gap-2 mt-1">
              <ImageIcon className="w-6 h-6 text-[#C9A84C]" />
              <span>Galeri Dokumentasi Foto & Pertemuan Trah</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Kumpulan dokumentasi foto kebersamaan keluarga dari arisan selapanan, syawalan akbar, dan momentum penting
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Tombol Tambah Foto Khusus Admin */}
            {isAdmin ? (
              <button
                type="button"
                onClick={handleOpenAddPhoto}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d6b75e] text-[#20150b] font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Tambah Foto Dokumentasi Baru ke Galeri"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Tambah Foto Dokumentasi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('admin') : (window.location.hash = '#admin')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition-colors"
                title="Masuk sebagai admin untuk menyunting atau menambah foto"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Masuk Admin untuk Sunting Galeri</span>
              </button>
            )}

            {/* Tombol Buka Drive Utama jika sudah disetting */}
            {settings.googleDriveFolderUrl && (
              <a
                href={settings.googleDriveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Buka Google Drive Trah ↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Filter Kategori Galeri */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { label: 'Semua Momen', val: 'ALL' },
            { label: 'Syawalan Trah', val: 'Syawalan Trah' },
            { label: 'Arisan Trah', val: 'Arisan Trah' },
            { label: 'Ziarah Leluhur', val: 'Ziarah Leluhur' },
            { label: 'Rembug Pengurus', val: 'Rembug Pengurus' },
            { label: 'Lain-lain', val: 'Lain-lain' },
          ].map(f => {
            const count = f.val === 'ALL'
              ? allGalleryPhotos.length
              : allGalleryPhotos.filter(p => p.category === f.val).length;
            return (
              <button
                key={f.val}
                type="button"
                onClick={() => setGalleryFilter(f.val)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  galleryFilter === f.val
                    ? 'bg-[#20150b] text-[#C9A84C] shadow-2xs'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  galleryFilter === f.val ? 'bg-[#C9A84C]/30 text-amber-200' : 'bg-stone-100 text-stone-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid Foto Dokumentasi */}
        {filteredGalleryPhotos.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-500 text-xs space-y-3 shadow-xs">
            <ImageIcon className="w-12 h-12 mx-auto text-stone-300" />
            <div className="space-y-1">
              <p className="font-bold text-stone-800 text-sm">
                {allGalleryPhotos.length === 0
                  ? 'Belum Ada Foto Dokumentasi di Galeri Trah'
                  : 'Belum Ada Foto untuk Kategori Ini'}
              </p>
              <p className="text-stone-500 text-xs max-w-md mx-auto">
                {allGalleryPhotos.length === 0
                  ? 'Galeri dokumentasi saat ini kosong. Anda dapat menambahkan foto kenangan silaturahmi syawalan, arisan selapanan, atau momentum penting lainnya.'
                  : 'Coba pilih kategori filter lain atau klik tombol Semua Momen di atas.'}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddPhoto}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A84C] hover:bg-[#d6b75e] text-[#20150b] font-bold text-xs transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Tambah Foto Dokumentasi</span>
                </button>
              )}
              {allGalleryPhotos.length > 0 && galleryFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setGalleryFilter('ALL')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold"
                >
                  <span>Lihat Semua Momen</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGalleryPhotos.map((photo) => {
              const isDeleting = confirmDeletePhotoId === photo.id;
              const isAgendaSource = photo.id.startsWith('agenda-');

              return (
                <div
                  key={photo.id}
                  onClick={() => setActiveLightboxPhoto(photo)}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-[#C9A84C] hover:shadow-md transition-all cursor-pointer flex flex-col relative"
                >
                  <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-xs">
                        <Maximize2 className="w-5 h-5 drop-shadow" />
                      </div>
                    </div>

                    {/* Kategori Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                      <span className="px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[10px] font-bold text-white border border-white/20">
                        {photo.category}
                      </span>
                    </div>

                    {/* Admin Action Buttons on Image Overlay */}
                    {isAdmin && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-stone-900/85 backdrop-blur-xs p-1 rounded-xl border border-white/20 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditPhoto(photo, e)}
                          title="Sunting Foto Dokumentasi"
                          className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-white/20 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeletePhotoId(isDeleting ? null : photo.id);
                          }}
                          title="Hapus Foto Dokumentasi"
                          className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Inline Confirmation Overlay for Delete */}
                    {isAdmin && isDeleting && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-0 z-30 bg-stone-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center text-white animate-in fade-in duration-150"
                      >
                        <AlertTriangle className="w-6 h-6 text-red-400 mb-1" />
                        <p className="text-xs font-bold leading-tight">Hapus foto ini?</p>
                        <p className="text-[10px] text-stone-300 line-clamp-1 mt-0.5 max-w-[85%]">{photo.title}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteGalleryPhoto(photo.id, photo.title, e)}
                            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-sm transition-colors"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeletePhotoId(null);
                            }}
                            className="px-3 py-1 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 text-[11px] transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif-title font-bold text-stone-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#C9A84C] transition-colors">
                        {photo.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {photo.caption}
                      </p>
                    </div>

                    {/* Dedicated Card Footer with explicit Edit and Delete Buttons */}
                    <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-1.5">
                      <span className="text-[10px] text-stone-400 font-mono truncate max-w-[90px]">
                        {photo.date}
                      </span>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditPhoto(photo, e)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all shadow-2xs hover:scale-105"
                              title="Sunting data foto ini"
                            >
                              <Edit2 className="w-3 h-3 text-amber-700" />
                              <span>Sunting</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeletePhotoId(isDeleting ? null : photo.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition-all shadow-2xs hover:scale-105"
                              title="Hapus foto dari galeri"
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                              <span>Hapus</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveLightboxPhoto(photo)}
                          className="text-[#C9A84C] hover:text-[#8B6B23] text-[11px] font-bold flex items-center gap-0.5 ml-1"
                        >
                          <span>Buka ↗</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ================= MODAL DETAIL AGENDA ================= */}
      <AgendaDetailModal
        agenda={selectedAgendaForDetail}
        isOpen={!!selectedAgendaForDetail}
        onClose={() => setSelectedAgendaForDetail(null)}
        isAdmin={isAdmin}
        onEdit={onEditAgenda}
        onDelete={handleDirectDelete}
      />

      {/* ================= LIGHTBOX MODAL PREVIEW FOTO ================= */}
      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => setActiveLightboxPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Tutup Preview"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full flex flex-col items-center">
            <img
              src={activeLightboxPhoto.imageUrl}
              alt={activeLightboxPhoto.title}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            
            <div className="mt-4 p-4 rounded-2xl bg-stone-900/90 text-white max-w-xl w-full border border-white/10 text-center space-y-2">
              <div className="font-serif-title font-bold text-base text-[#C9A84C]">
                {activeLightboxPhoto.title}
              </div>
              <p className="text-xs text-stone-300">
                {activeLightboxPhoto.caption}
              </p>
              <div className="text-[11px] text-stone-400 font-mono">
                {activeLightboxPhoto.date} · {activeLightboxPhoto.category}
              </div>

              {activeLightboxPhoto.driveUrl && (
                <div className="pt-1">
                  <a
                    href={activeLightboxPhoto.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Buka Album di Google Drive ↗</span>
                  </a>
                </div>
              )}

              {/* Admin Actions inside Lightbox */}
              {isAdmin && (
                <div className="pt-3 border-t border-white/10 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const photo = activeLightboxPhoto;
                      setActiveLightboxPhoto(null);
                      handleOpenEditPhoto(photo);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sunting Foto Ini</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const photo = activeLightboxPhoto;
                      handleDeleteGalleryPhoto(photo.id, photo.title);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / SUNTING FOTO (KHUSUS ADMIN) ================= */}
      {isAdmin && isGalleryModalOpen && (
        <GalleryFormModal
          isOpen={isGalleryModalOpen}
          onClose={() => {
            setIsGalleryModalOpen(false);
            setPhotoToEdit(null);
          }}
          photoToEdit={photoToEdit}
          onSave={handleSaveGalleryPhoto}
        />
      )}

      {/* Floating Status Notification (Muncul Saat Simpan/Hapus) */}
      {(deleteNotice || galleryNotice) && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#20150b] text-[#C9A84C] border border-[#C9A84C]/40 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{galleryNotice || deleteNotice}</span>
        </div>
      )}

    </div>
  );
};
