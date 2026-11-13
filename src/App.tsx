/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Plus, CheckCircle2, AlertCircle, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { AgendaCard } from './components/agenda/AgendaCard';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { FamilyTreeViewer } from './components/tree/FamilyTreeViewer';
import { SilsilahJawaSidebar } from './components/tree/SilsilahJawaSidebar';
import { MemberDirectory } from './components/directory/MemberDirectory';
import { PersonDetailModal } from './components/directory/PersonDetailModal';
import { AgendaSection } from './components/agenda/AgendaSection';
import { AgendaDetailModal } from './components/agenda/AgendaDetailModal';
import { KabarSection } from './components/kabar/KabarSection';
import { CariyosSection } from './components/cariyos/CariyosSection';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginPortal } from './components/admin/AdminLoginPortal';
import { PersonFormModal } from './components/admin/PersonFormModal';
import { AgendaFormModal } from './components/admin/AgendaFormModal';
import { CariyosFormModal } from './components/admin/CariyosFormModal';
import { KabarFormModal } from './components/admin/KabarFormModal';
import { motion, useReducedMotion } from 'motion/react';
import { EmptyState } from './components/arc/empty-state/empty-state';
import { Skeleton } from './components/arc/skeleton/skeleton';
import { AnnouncementBar } from './components/arc/announcement-bar/announcement-bar';
import { SearchPalette } from './components/SearchPalette';
import { MiniKalenderJawa } from './components/home/MiniKalenderJawa';
import { getWeton, format24HourWIB } from './utils/javaneseCalendar';
import { Person, Agenda, Cariyos, Kabar } from './types';

const VALID_TABS = ['beranda', 'pohon', 'anggota', 'agenda', 'kabar', 'admin'] as const;
type TabType = typeof VALID_TABS[number];

function MainApp() {
  const { isAdmin } = useAuth();
  const {
    people,
    relationships,
    agendas,
    kabar,
    cariyos,
    settings,
    branches,
    wiwitanPerson,
    loading,
    addPerson,
    updatePerson,
    deletePerson,
    savePersonAndRelationships,
    addRelationship,
    deleteRelationship,
    addAgenda,
    updateAgenda,
    deleteAgenda,
    addKabar,
    updateKabar,
    deleteKabar,
    addCariyos,
    updateCariyos,
    deleteCariyos,
    updateSettings,
    setWiwitan,
  } = useFamily();

  // Navigation tab matching prototype tabs: beranda, pohon, anggota, agenda, kabar, cariyos, admin
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (VALID_TABS.includes(hash as TabType)) {
        return hash;
      }
    }
    return 'beranda';
  });

  // Text size for elder accessibility
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Modals state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);

  const [isAgendaFormOpen, setIsAgendaFormOpen] = useState(false);
  const [agendaToEdit, setAgendaToEdit] = useState<Agenda | null>(null);
  const [selectedAgendaDetail, setSelectedAgendaDetail] = useState<Agenda | null>(null);

  const [isCariyosFormOpen, setIsCariyosFormOpen] = useState(false);
  const [cariyosToEdit, setCariyosToEdit] = useState<Cariyos | null>(null);

  const [isKabarFormOpen, setIsKabarFormOpen] = useState(false);
  const [kabarToEdit, setKabarToEdit] = useState<Kabar | null>(null);

  // Floating Toast Notification
  const [toastNotice, setToastNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastNotice({ message, type });
    setTimeout(() => {
      setToastNotice(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Notifikasi Melayang Khusus Agenda yang Selesai Ditambahkan / Disimpan
  const [agendaFloatingNotice, setAgendaFloatingNotice] = useState<{
    id: string;
    title: string;
    action: 'add' | 'edit';
    date: string;
    time?: string;
    location?: string;
    category?: string;
  } | null>(null);

  const showAgendaFloatingNotice = useCallback((agenda: {
    title: string;
    action: 'add' | 'edit';
    date: string;
    time?: string;
    location?: string;
    category?: string;
  }) => {
    const id = Date.now().toString();
    setAgendaFloatingNotice({ ...agenda, id });
    setTimeout(() => {
      setAgendaFloatingNotice(prev => (prev?.id === id ? null : prev));
    }, 7000);
  }, []);

  // Sorted agendas for consistent and immediate display (newest to oldest)
  const sortedAgendas = React.useMemo(() => {
    return [...agendas].sort((a, b) => b.date.localeCompare(a.date));
  }, [agendas]);

  /**
   * Navigate to a tab and push history entry so the browser Back button works naturally.
   */
  const navigateToTab = useCallback((newTab: string, pushHistory: boolean = true) => {
    // Close any open modals on tab change
    if (selectedPerson) setSelectedPerson(null);
    if (isPersonFormOpen) setIsPersonFormOpen(false);
    if (isAgendaFormOpen) setIsAgendaFormOpen(false);
    if (isCariyosFormOpen) setIsCariyosFormOpen(false);
    if (isKabarFormOpen) setIsKabarFormOpen(false);

    const cleanTab = newTab.toLowerCase();
    setActiveTab(cleanTab);

    if (pushHistory) {
      const currentHash = window.location.hash.replace('#', '').toLowerCase();
      if (currentHash !== cleanTab) {
        window.history.pushState({ tab: cleanTab }, '', `#${cleanTab}`);
      }
    }

    // Scroll to top of viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedPerson, isPersonFormOpen, isAgendaFormOpen, isCariyosFormOpen, isKabarFormOpen]);

  /**
   * Synchronize browser history and hash on initial load and handle browser Back/Forward (popstate)
   */
  useEffect(() => {
    // 1. Initial State Setup
    const initialHash = window.location.hash.replace('#', '').toLowerCase();
    if (initialHash && !window.history.state) {
      window.history.replaceState({ tab: activeTab }, '', `#${activeTab}`);
    }

    // Check if initial hash links to a specific person: #person-P001
    if (initialHash.startsWith('person-') && people.length > 0) {
      const personId = initialHash.replace('person-', '');
      const found = people.find(p => p.id === personId);
      if (found) {
        setSelectedPerson(found);
      }
    }

    // 2. PopState Listener (Browser Back & Forward)
    const handlePopState = (event: PopStateEvent) => {
      // If a modal is open, browser back closes the modal first
      if (selectedPerson) {
        setSelectedPerson(null);
        return;
      }
      if (isPersonFormOpen || isAgendaFormOpen || isCariyosFormOpen || isKabarFormOpen) {
        setIsPersonFormOpen(false);
        setIsAgendaFormOpen(false);
        setIsCariyosFormOpen(false);
        setIsKabarFormOpen(false);
        return;
      }

      const currentHash = window.location.hash.replace('#', '').toLowerCase();
      if (currentHash.startsWith('person-')) {
        const personId = currentHash.replace('person-', '');
        const target = people.find(p => p.id === personId);
        if (target) {
          setSelectedPerson(target);
          return;
        }
      }

      const targetTab = event.state?.tab || currentHash || 'beranda';
      if (VALID_TABS.includes(targetTab as TabType)) {
        setActiveTab(targetTab);
      } else {
        setActiveTab('beranda');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [people, selectedPerson, isPersonFormOpen, isAgendaFormOpen, isCariyosFormOpen, isKabarFormOpen, activeTab]);

  /**
   * Handle selecting / closing a person detail with history support
   */
  const handleSelectPerson = useCallback((person: Person | null) => {
    if (person) {
      window.history.pushState(
        { tab: activeTab, modal: 'person', personId: person.id },
        '',
        `#person-${person.id}`
      );
      setSelectedPerson(person);
    } else {
      setSelectedPerson(null);
      if (window.location.hash.startsWith('#person-')) {
        window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
      }
    }
  }, [activeTab]);

  /**
   * Universal "Kembali" (Back) handler:
   * First closes any open modal, then uses history.back(), or returns to Beranda.
   */
  const handleGoBack = useCallback(() => {
    if (selectedPerson) {
      handleSelectPerson(null);
      return;
    }
    if (selectedAgendaDetail) {
      setSelectedAgendaDetail(null);
      return;
    }
    if (isPersonFormOpen || isAgendaFormOpen || isCariyosFormOpen || isKabarFormOpen) {
      setIsPersonFormOpen(false);
      setIsAgendaFormOpen(false);
      setIsCariyosFormOpen(false);
      setIsKabarFormOpen(false);
      return;
    }

    if (window.history.state && window.history.length > 1 && activeTab !== 'beranda') {
      window.history.back();
    } else {
      navigateToTab('beranda');
    }
  }, [selectedPerson, selectedAgendaDetail, isPersonFormOpen, isAgendaFormOpen, isCariyosFormOpen, isKabarFormOpen, activeTab, handleSelectPerson, navigateToTab]);

  const handleOpenAddPerson = () => {
    setPersonToEdit(null);
    setIsPersonFormOpen(true);
  };

  const handleOpenEditPerson = (p: Person) => {
    setPersonToEdit(p);
    setIsPersonFormOpen(true);
  };

  const handleSavePerson = async (
    personData: Omit<Person, 'createdAt' | 'updatedAt'>,
    relsToAdd?: { parentIds: string[]; spouseIds: string[] }
  ) => {
    try {
      const targetPersonId = personData.id;
      await savePersonAndRelationships(personData, relsToAdd);

      showToast(`Data anggota "${personData.name}" berhasil disimpan ke sistem & Firebase!`);
      setIsPersonFormOpen(false);
      setPersonToEdit(null);
      if (selectedPerson?.id === targetPersonId) {
        setSelectedPerson(prev => prev ? { ...prev, ...personData } as Person : null);
      }
    } catch (err: any) {
      console.error('Error in handleSavePerson:', err);
      showToast('Gagal menyimpan ke Firebase: ' + (err.message || 'Terjadi kesalahan'), 'error');
      throw err;
    }
  };

  const handleDeletePerson = async (id: string, name?: string) => {
    try {
      await deletePerson(id);
      showToast(`Data anggota "${name || id}" berhasil dihapus dari sistem & Firebase.`);
      if (selectedPerson?.id === id) {
        setSelectedPerson(null);
      }
    } catch (err: any) {
      console.error('Error in handleDeletePerson:', err);
      showToast('Gagal menghapus anggota: ' + (err.message || 'Terjadi kesalahan'), 'error');
    }
  };

  const handleOpenAddAgenda = () => {
    setAgendaToEdit(null);
    setIsAgendaFormOpen(true);
  };

  const handleOpenEditAgenda = (a: Agenda) => {
    setAgendaToEdit(a);
    setIsAgendaFormOpen(true);
  };

  const handleCloseAgendaForm = () => {
    setIsAgendaFormOpen(false);
    setAgendaToEdit(null);
  };

  const handleSaveAgenda = async (agendaData: Omit<Agenda, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (agendaToEdit) {
        await updateAgenda(agendaToEdit.id, agendaData);
        showAgendaFloatingNotice({
          action: 'edit',
          title: agendaData.title,
          date: agendaData.date,
          time: agendaData.time,
          location: agendaData.location,
          category: agendaData.category,
        });
      } else {
        await addAgenda(agendaData);
        showAgendaFloatingNotice({
          action: 'add',
          title: agendaData.title,
          date: agendaData.date,
          time: agendaData.time,
          location: agendaData.location,
          category: agendaData.category,
        });
      }
      setAgendaToEdit(null);
      setIsAgendaFormOpen(false);
    } catch (err: any) {
      showToast('Gagal menyimpan agenda: ' + (err.message || 'Terjadi kesalahan'), 'error');
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    try {
      await deleteAgenda(id);
      showToast('Agenda berhasil dihapus.');
    } catch (err: any) {
      showToast('Gagal menghapus agenda', 'error');
    }
  };

  const handleOpenAddCariyos = () => {
    setCariyosToEdit(null);
    setIsCariyosFormOpen(true);
  };

  const handleOpenEditCariyos = (c: Cariyos) => {
    setCariyosToEdit(c);
    setIsCariyosFormOpen(true);
  };

  const handleSaveCariyos = async (cariyosData: Omit<Cariyos, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (cariyosToEdit) {
      await updateCariyos(cariyosToEdit.id, cariyosData);
    } else {
      await addCariyos(cariyosData);
    }
  };

  const handleOpenAddKabar = () => {
    setKabarToEdit(null);
    setIsKabarFormOpen(true);
  };

  const handleOpenEditKabar = (k: Kabar) => {
    setKabarToEdit(k);
    setIsKabarFormOpen(true);
  };

  const handleSaveKabar = async (kabarData: Omit<Kabar, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (kabarToEdit) {
      await updateKabar(kabarToEdit.id, kabarData);
    } else {
      await addKabar(kabarData);
    }
  };

  const reduceMotion = useReducedMotion();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl + K membuka pencarian cepat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Agenda terdekat yang akan datang untuk bar pengumuman
  const nextAgenda = React.useMemo(() => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return [...agendas]
      .filter((a) => a.status === 'UPCOMING' && a.date >= iso)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [agendas]);

  const maxGen = Math.max(...people.map(p => p.generation ?? 0), 0) + 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton label="Memuat data keluarga" lines={2} />
          <Skeleton lines={4} avatar />
          <Skeleton lines={4} avatar />
        </div>
      </div>
    );
  }


  return (
    <div className={`min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C1A0E] ${
      textSize === 'xlarge' ? 'text-lg' : textSize === 'large' ? 'text-base' : 'text-sm'
    }`}>
      {nextAgenda && (
        <div className="arc-announcement">
          <AnnouncementBar
            id="agenda-terdekat"
            dismissible
            messages={[
              {
                id: nextAgenda.id,
                message: `Agenda berikutnya: ${nextAgenda.title}, ${new Date(nextAgenda.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                action: { label: 'Lihat agenda', onClick: () => navigateToTab('agenda') },
              },
            ]}
          />
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        textSize={textSize}
        setTextSize={setTextSize}
        onOpenSearch={() => setPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        <motion.div
          key={activeTab}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
        
        {/* ================= TAB: BERANDA ================= */}
        {activeTab === 'beranda' && (
          <div>
            {/* Hero Banner */}
            <HomeHero
              settings={settings}
              wiwitanPerson={wiwitanPerson}
              memberCount={people.length}
              generationCount={maxGen}
              agendaCount={agendas.length}
              onNavigate={navigateToTab}
            />

            {/* Section: Pohon Keluarga matching prototype */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              
              {/* Centered Heading with gold divider line */}
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-serif-title font-bold text-[#20150b]">
                  Pohon Keluarga
                </h2>
                <div className="w-11 h-0.5 bg-[#C9A84C] mx-auto my-2 rounded-full" />
                <p className="text-xs sm:text-sm text-stone-600">
                  Info Lengkap Lihat{' '}
                  <button
                    onClick={() => navigateToTab('anggota')}
                    className="text-[#C9A84C] hover:text-[#9c7b2c] font-bold hover:underline transition-colors"
                  >
                    Anggota
                  </button>
                </p>
              </div>

              {/* Grid: Tree Canvas on the left + Silsilah Jawa on the right */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
                {/* Family Tree Viewport */}
                <div className="lg:col-span-3">
                  <FamilyTreeViewer
                    people={people}
                    relationships={relationships}
                    settings={settings}
                    branches={branches}
                    wiwitanPerson={wiwitanPerson}
                    onSelectPerson={handleSelectPerson}
                  />
                </div>

                {/* Silsilah Jawa Right Sidebar */}
                <div className="lg:col-span-1">
                  <SilsilahJawaSidebar maxLevel={10} />
                </div>
              </div>
            </div>

            {/* ================= SECTION: AGENDA KEGIATAN KELUARGA & KALENDER JAWA (HALAMAN DEPAN) ================= */}
            <div className="bg-[#FAF7F2] border-t-2 border-[#C9A84C]/25 py-10 sm:py-14">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* Header Section dengan Aksi */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C9A84C]/20 pb-4">
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#C9A84C] uppercase tracking-[2px] block">
                      Pertemuan Trah & Penanggalan Jawa
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif-title font-bold text-[#20150b] mt-0.5">
                      Agenda Kegiatan Keluarga
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1">
                      Jadwal reuni, arisan selapanan Minggu Pon, dan kalender Jawa patokan pertemuan Trah {settings.familyName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={handleOpenAddAgenda}
                        className="px-3.5 py-2 rounded-xl bg-[#20150b] hover:bg-[#322013] text-[#C9A84C] font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                        title="Tambah Jadwal Agenda Pertemuan Baru"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Agenda</span>
                      </button>
                    )}
                    <button
                      onClick={() => navigateToTab('agenda')}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                    >
                      <span>Lihat Semua Agenda</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C9A84C]" />
                    </button>
                  </div>
                </div>

                {/* Tata Letak Bersebelahan: Agenda di Kiri (lg:col-span-7) + Kalender Jawa Kecil di Kanan (lg:col-span-5) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Kolom Kiri: Kartu Agenda Kegiatan */}
                  <div className="lg:col-span-7 space-y-3.5">
                    {agendas.length === 0 ? (
                      <EmptyState
                        title="Belum ada agenda"
                        description="Agenda arisan dan pertemuan trah akan tampil di sini setelah dijadwalkan pengurus."
                        icon={<Calendar width={24} height={24} strokeWidth={1.5} />}
                      />
                    ) : (
                      <div className="space-y-3">
                        {sortedAgendas.slice(0, 6).map((item) => (
                          <AgendaCard
                            key={item.id}
                            agenda={item}
                            isAdmin={isAdmin}
                            onSelect={setSelectedAgendaDetail}
                            onEdit={isAdmin ? handleOpenEditAgenda : undefined}
                            onDelete={isAdmin ? handleDeleteAgenda : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Kolom Kanan: Kalender Jawa Kecil di Sebelah Agenda */}
                  <div className="lg:col-span-5">
                    <MiniKalenderJawa agendas={agendas} />
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: POHON (Full Width Tree Page) ================= */}
        {activeTab === 'pohon' && (
          <div>
            {/* Page Header with Back Button */}
            <div className="bg-[#20150b] text-white px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-[#C9A84C] shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif-title text-[#C9A84C] text-lg sm:text-2xl font-bold tracking-tight">
                    Diagram Pohon Keluarga
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#E8D4A0] opacity-85 font-light mt-0.5">
                    Semua generasi · Geser dan perbesar untuk menjelajahi seluruh pohon keturunan
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isAdmin && (
                    <button
                      onClick={handleOpenAddPerson}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C9A84C] hover:bg-[#b5943b] text-white text-xs font-bold transition-all shadow-xs"
                      title="Tambah Anggota Baru ke Pohon Silsilah"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Anggota</span>
                    </button>
                  )}
                  <button
                    onClick={handleGoBack}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E1F12] hover:bg-[#3D2B1A] text-[#E8D4A0] hover:text-white border border-[#C9A84C]/40 text-xs font-semibold transition-all shadow-2xs group"
                    title="Kembali ke Halaman Sebelumnya"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#C9A84C] group-hover:-translate-x-0.5 transition-transform" />
                    <span>Kembali ke Beranda</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <FamilyTreeViewer
                people={people}
                relationships={relationships}
                settings={settings}
                branches={branches}
                wiwitanPerson={wiwitanPerson}
                onSelectPerson={handleSelectPerson}
                onAddPerson={isAdmin ? handleOpenAddPerson : undefined}
              />
            </div>
          </div>
        )}

        {/* ================= TAB: ANGGOTA (Directory) ================= */}
        {activeTab === 'anggota' && (
          <div>
            {/* Page Header with Back Button */}
            <div className="bg-[#20150b] text-white px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-[#C9A84C] shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif-title text-[#C9A84C] text-lg sm:text-2xl font-bold tracking-tight">
                    Anggota Keluarga
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#E8D4A0] opacity-85 font-light mt-0.5">
                    Hanya anggota berdarah Sosentono & pasangan — klik kartu untuk rincian detail
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isAdmin && (
                    <button
                      onClick={handleOpenAddPerson}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C9A84C] hover:bg-[#d6b75e] text-[#20150b] text-xs font-bold transition-all shadow-xs"
                      title="Tambah Anggota Baru"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Anggota</span>
                    </button>
                  )}
                  <button
                    onClick={handleGoBack}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E1F12] hover:bg-[#3D2B1A] text-[#E8D4A0] hover:text-white border border-[#C9A84C]/40 text-xs font-semibold transition-all shadow-2xs group"
                    title="Kembali ke Halaman Sebelumnya"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#C9A84C] group-hover:-translate-x-0.5 transition-transform" />
                    <span>Kembali ke Beranda</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <MemberDirectory
                people={people}
                branches={branches}
                onSelectPerson={handleSelectPerson}
                textSize={textSize}
                isAdmin={isAdmin}
                onAddPerson={handleOpenAddPerson}
              />
            </div>
          </div>
        )}

        {/* ================= TAB: AGENDA ================= */}
        {activeTab === 'agenda' && (
          <div>
            <div className="bg-[#20150b] text-white px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-[#C9A84C] shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif-title text-[#C9A84C] text-lg sm:text-2xl font-bold tracking-tight">
                    Informasi Keluarga
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#E8D4A0] opacity-85 font-light mt-0.5">
                    Agenda pertemuan rutin selapanan Minggu Pon dan silaturahmi tahunan Trah Besar Syawal
                  </p>
                </div>
                <button
                  onClick={handleGoBack}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E1F12] hover:bg-[#3D2B1A] text-[#E8D4A0] hover:text-white border border-[#C9A84C]/40 text-xs font-semibold transition-all shadow-2xs group"
                  title="Kembali ke Halaman Sebelumnya"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#C9A84C] group-hover:-translate-x-0.5 transition-transform" />
                  <span>Kembali ke Beranda</span>
                </button>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <AgendaSection
                agendas={agendas}
                settings={settings}
                isAdmin={isAdmin}
                onAddAgenda={isAdmin ? handleOpenAddAgenda : undefined}
                onEditAgenda={isAdmin ? handleOpenEditAgenda : undefined}
                onDeleteAgenda={isAdmin ? deleteAgenda : undefined}
                onSaveAgenda={isAdmin ? handleSaveAgenda : undefined}
                onUpdateSettings={isAdmin ? updateSettings : undefined}
                onNavigate={navigateToTab}
              />
            </div>
          </div>
        )}

        {/* ================= TAB: KABAR ================= */}
        {activeTab === 'kabar' && (
          <div>
            <div className="bg-[#20150b] text-white px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-[#C9A84C] shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif-title text-[#C9A84C] text-lg sm:text-2xl font-bold tracking-tight">
                    Kabar Trah
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#E8D4A0] opacity-85 font-light mt-0.5">
                    Warta terkini kelahiran, pernikahan, kabar duka, prestasi, dan pengumuman keluarga
                  </p>
                </div>
                <button
                  onClick={handleGoBack}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E1F12] hover:bg-[#3D2B1A] text-[#E8D4A0] hover:text-white border border-[#C9A84C]/40 text-xs font-semibold transition-all shadow-2xs group"
                  title="Kembali ke Halaman Sebelumnya"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#C9A84C] group-hover:-translate-x-0.5 transition-transform" />
                  <span>Kembali ke Beranda</span>
                </button>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <KabarSection
                kabar={kabar}
                onAddKabar={handleOpenAddKabar}
                onEditKabar={handleOpenEditKabar}
                onDeleteKabar={deleteKabar}
              />
            </div>
          </div>
        )}

        {/* ================= TAB: ADMIN ================= */}
        {activeTab === 'admin' && (
          isAdmin ? (
            <div>
              <div className="bg-[#20150b] text-white px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-[#C9A84C] shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif-title text-[#C9A84C] text-lg sm:text-2xl font-bold tracking-tight">
                      Kelola Data Keluarga
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#E8D4A0] opacity-85 font-light mt-0.5">
                      Panel kendali administrator untuk memperbarui silsilah, agenda, dan warta kabar trah
                    </p>
                  </div>
                  <button
                    onClick={handleGoBack}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E1F12] hover:bg-[#3D2B1A] text-[#E8D4A0] hover:text-white border border-[#C9A84C]/40 text-xs font-semibold transition-all shadow-2xs group"
                    title="Kembali ke Halaman Sebelumnya"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#C9A84C] group-hover:-translate-x-0.5 transition-transform" />
                    <span>Kembali ke Beranda</span>
                  </button>
                </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <AdminDashboard
                  people={people}
                  relationships={relationships}
                  agendas={agendas}
                  kabar={kabar}
                  cariyos={cariyos}
                  settings={settings}
                  branches={branches}
                  wiwitanPerson={wiwitanPerson}
                  onOpenAddPerson={handleOpenAddPerson}
                  onOpenEditPerson={handleOpenEditPerson}
                  onDeletePerson={handleDeletePerson}
                  onOpenAddAgenda={handleOpenAddAgenda}
                  onOpenEditAgenda={handleOpenEditAgenda}
                  onDeleteAgenda={deleteAgenda}
                  onOpenAddCariyos={handleOpenAddCariyos}
                  onOpenEditCariyos={handleOpenEditCariyos}
                  onDeleteCariyos={deleteCariyos}
                  onOpenAddKabar={handleOpenAddKabar}
                  onSetWiwitan={setWiwitan}
                  onUpdateSettings={updateSettings}
                  onDeleteRelationship={deleteRelationship}
                  onBackToHome={handleGoBack}
                />
              </div>
            </div>
          ) : (
            <AdminLoginPortal onBackToHome={handleGoBack} />
          )
        )}
        </motion.div>
      </main>

      <SearchPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        people={people}
        isAdmin={isAdmin}
        onNavigate={navigateToTab}
        onSelectPerson={handleSelectPerson}
      />

      {/* ================= MODALS ================= */}
      <PersonDetailModal
        person={selectedPerson}
        onClose={() => handleSelectPerson(null)}
        people={people}
        relationships={relationships}
        onSelectPerson={handleSelectPerson}
        onEditPerson={handleOpenEditPerson}
        onDeletePerson={isAdmin ? handleDeletePerson : undefined}
      />

      {/* Modal Detail & Dokumentasi Agenda */}
      <AgendaDetailModal
        agenda={selectedAgendaDetail}
        isOpen={!!selectedAgendaDetail}
        onClose={() => setSelectedAgendaDetail(null)}
        isAdmin={isAdmin}
        onEdit={handleOpenEditAgenda}
        onDelete={handleDeleteAgenda}
      />

      {isAdmin && (
        <PersonFormModal
          isOpen={isPersonFormOpen}
          onClose={() => setIsPersonFormOpen(false)}
          personToEdit={personToEdit}
          people={people}
          relationships={relationships}
          onSavePerson={handleSavePerson}
        />
      )}

      <AgendaFormModal
        isOpen={isAgendaFormOpen}
        onClose={handleCloseAgendaForm}
        agendaToEdit={agendaToEdit}
        onSaveAgenda={handleSaveAgenda}
      />

      {isAdmin && (
        <CariyosFormModal
          isOpen={isCariyosFormOpen}
          onClose={() => setIsCariyosFormOpen(false)}
          cariyosToEdit={cariyosToEdit}
          onSaveCariyos={handleSaveCariyos}
        />
      )}

      {isAdmin && (
        <KabarFormModal
          isOpen={isKabarFormOpen}
          onClose={() => setIsKabarFormOpen(false)}
          kabarToEdit={kabarToEdit}
          onSaveKabar={handleSaveKabar}
        />
      )}

      {/* Footer matching prototype */}
      <footer className="no-print mt-auto bg-[#20150b] text-stone-300 border-t-2 border-[#C9A84C] py-7 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
            <span className="font-serif-title font-bold text-sm text-[#C9A84C]">
              {settings.familyName}
            </span>
          </div>

          <div className="italic text-stone-300 font-serif text-xs">
            "{settings.tagline || 'Ngumpulke Balung Pisah, Mikul Dhuwur Mendhem Jero'}"
          </div>

          <div className="text-stone-400 text-[11px]">
            Hak Cipta © {new Date().getFullYear()} {settings.familyName}
          </div>
        </div>
      </footer>

      {/* ================= NOTIFIKASI MELAYANG: AGENDA SELESAI DITAMBAHKAN ================= */}
      {agendaFloatingNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 sm:top-24 sm:right-6 z-[99999] max-w-sm sm:max-w-md w-full bg-[#1c120a] text-white border-2 border-[#C9A84C] rounded-3xl shadow-2xl p-4 sm:p-5 animate-in fade-in slide-in-from-top-4 duration-300 ring-4 ring-[#C9A84C]/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C9A84C]/20 border border-[#C9A84C] flex items-center justify-center shrink-0 text-[#C9A84C] shadow-xs">
                <Sparkles className="w-5 h-5 text-[#C9A84C] animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>
                    {agendaFloatingNotice.action === 'add' ? 'Agenda Selesai Ditambahkan' : 'Perubahan Agenda Disimpan'}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold font-serif-title text-[#FAF7F2] leading-snug">
                  {agendaFloatingNotice.title}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setAgendaFloatingNotice(null)}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="Tutup notifikasi"
            >
              ✕
            </button>
          </div>

          {/* Details pills */}
          <div className="mt-3 pt-3 border-t border-[#C9A84C]/20 flex flex-wrap gap-2 text-xs text-stone-300">
            {agendaFloatingNotice.date && (
              <div className="flex items-center gap-1.5 bg-stone-900/90 px-2.5 py-1 rounded-xl border border-stone-800 text-[#C9A84C] font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{getWeton(agendaFloatingNotice.date).full}, {agendaFloatingNotice.date}</span>
              </div>
            )}
            {agendaFloatingNotice.time && (
              <div className="flex items-center gap-1.5 bg-stone-900/90 px-2.5 py-1 rounded-xl border border-stone-800 text-stone-300 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{format24HourWIB(agendaFloatingNotice.time)}</span>
              </div>
            )}
            {agendaFloatingNotice.location && (
              <div className="flex items-center gap-1.5 bg-stone-900/90 px-2.5 py-1 rounded-xl border border-stone-800 text-stone-300 truncate max-w-full text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{agendaFloatingNotice.location}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= FLOATING TOAST POPUP ("TELAH DITAMBAHKAN") ================= */}
      {toastNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9999] border-2 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 text-xs sm:text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md ${
            toastNotice.type === 'error'
              ? 'bg-[#2b1111] text-red-200 border-red-500/80 shadow-red-950/40'
              : 'bg-[#20150b] text-[#C9A84C] border-[#C9A84C] shadow-black/60 ring-2 ring-[#C9A84C]/30'
          }`}
        >
          {toastNotice.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-white font-medium flex-1">{toastNotice.message}</span>
          <button
            onClick={() => setToastNotice(null)}
            className="ml-2 text-stone-400 hover:text-white transition-colors text-xs font-bold p-1 rounded-md"
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <MainApp />
      </FamilyProvider>
    </AuthProvider>
  );
}
