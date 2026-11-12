import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  TreeDeciduous,
  Layers,
  Calendar,
  BookOpen,
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  Crown,
  Save,
  Search,
  Shield,
  ShieldCheck,
  UserPlus,
  Key,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Github,
  Database,
  Copy,
  Check,
  Download,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Newspaper,
  X,
  FolderOpen,
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react';
import { Person, Relationship, Agenda, Kabar, Cariyos, Settings, AdminRole, AdminUser, GalleryItem, getJavaneseGenerationTerm } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { GalleryFormModal } from '../agenda/GalleryFormModal';
import { formatIndonesianDate, format24HourWIB } from '../../utils/javaneseCalendar';
import { executeRecaptcha } from '../../utils/recaptcha';
import { MigrasiDataLama } from './MigrasiDataLama';

interface AdminDashboardProps {
  people: Person[];
  relationships: Relationship[];
  agendas: Agenda[];
  kabar: Kabar[];
  cariyos: Cariyos[];
  settings: Settings;
  branches: string[];
  wiwitanPerson: Person | undefined;
  onOpenAddPerson: () => void;
  onOpenEditPerson: (p: Person) => void;
  onDeletePerson: (id: string) => void;
  onOpenAddAgenda: () => void;
  onOpenEditAgenda: (a: Agenda) => void;
  onDeleteAgenda: (id: string) => any;
  onOpenAddCariyos: () => void;
  onOpenEditCariyos: (c: Cariyos) => void;
  onDeleteCariyos: (id: string) => void;
  onOpenAddKabar: () => void;
  onSetWiwitan: (personId: string) => Promise<void>;
  onUpdateSettings: (settingsData: Partial<Settings>) => Promise<void>;
  onDeleteRelationship: (id: string) => Promise<void>;
  onBackToHome?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  people,
  relationships,
  agendas,
  kabar,
  cariyos,
  settings,
  branches,
  wiwitanPerson,
  onOpenAddPerson,
  onOpenEditPerson,
  onDeletePerson,
  onOpenAddAgenda,
  onOpenEditAgenda,
  onDeleteAgenda,
  onOpenAddCariyos,
  onOpenEditCariyos,
  onDeleteCariyos,
  onOpenAddKabar,
  onSetWiwitan,
  onUpdateSettings,
  onDeleteRelationship,
  onBackToHome,
}) => {
  const {
    currentAdmin,
    isMasterAdmin,
    adminRole,
    adminsList,
    registerAdmin,
    updateAdminPassword,
    sendAdminPasswordReset,
    updateAdminRole,
    removeAdmin
  } = useAuth();

  const {
    gallery = [],
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
  } = useFamily();

  const [selectedWiwitanId, setSelectedWiwitanId] = useState<string>(settings.wiwitanPersonId || '');
  const [familyNameInput, setFamilyNameInput] = useState<string>(settings.familyName || '');
  const [taglineInput, setTaglineInput] = useState<string>(settings.tagline || '');
  const [mingguPonRefInput, setMingguPonRefInput] = useState<string>(settings.mingguPonReferenceDate || '2024-01-07');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<'OVERVIEW' | 'MEMBERS' | 'RELATIONSHIPS' | 'AGENDAS' | 'GALLERY' | 'ADMINS' | 'GITHUB'>('OVERVIEW');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Gallery Admin Management States
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryFilter, setGalleryFilter] = useState('ALL');
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<GalleryItem | null>(null);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<GalleryItem | null>(null);
  const [galleryFeedback, setGalleryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // In-place confirmation states (eliminates iframe-blocked confirm/alert calls)
  const [confirmDeletePersonId, setConfirmDeletePersonId] = useState<string | null>(null);
  const [confirmDeleteRelId, setConfirmDeleteRelId] = useState<string | null>(null);
  const [confirmRemoveAdminId, setConfirmRemoveAdminId] = useState<string | null>(null);

  // Master Admin: Google Drive Database Configuration State
  const [driveUrlInput, setDriveUrlInput] = useState<string>(settings.googleDriveFolderUrl || '');
  const [isSavingDriveUrl, setIsSavingDriveUrl] = useState(false);
  const [driveSaveSuccess, setDriveSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings.googleDriveFolderUrl !== undefined) {
      setDriveUrlInput(settings.googleDriveFolderUrl || '');
    }
  }, [settings.googleDriveFolderUrl]);

  // Master Admin: reCAPTCHA trigger test state
  const [recaptchaTesting, setRecaptchaTesting] = useState(false);
  const [recaptchaResult, setRecaptchaResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    token?: string;
  } | null>(null);

  const handleTestRecaptcha = async () => {
    setRecaptchaTesting(true);
    setRecaptchaResult(null);
    try {
      const token = await executeRecaptcha('ADMIN_MANUAL_TEST');
      if (token) {
        setRecaptchaResult({
          status: 'success',
          message: 'reCAPTCHA Enterprise berhasil dieksekusi secara valid oleh browser.',
          token: `${token.substring(0, 24)}... (token valid)`,
        });
      } else {
        setRecaptchaResult({
          status: 'error',
          message: 'Token tidak diterima. Script reCAPTCHA mungkin terhambat oleh browser atau adblocker.',
        });
      }
    } catch (err: any) {
      setRecaptchaResult({
        status: 'error',
        message: err?.message || 'Gagal mengeksekusi reCAPTCHA.',
      });
    } finally {
      setRecaptchaTesting(false);
    }
  };

  // Master Admin: Form state for registering admin (Username, Password, Display Name, Role)
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('admin');
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password editing & visibility state
  const [editingPasswordAdminId, setEditingPasswordAdminId] = useState<string | null>(null);
  const [editingPasswordVal, setEditingPasswordVal] = useState<string>('');
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  const [dashboardNotice, setDashboardNotice] = useState<string | null>(null);

  // Direct Hapus Instan (0 Milidetik, Tanpa Modal Loading)
  const handleDirectDeleteAgenda = (id: string, title: string) => {
    setDashboardNotice(`Agenda "${title}" berhasil dihapus.`);
    setTimeout(() => setDashboardNotice(null), 3500);
    try {
      const res = onDeleteAgenda(id);
      if (res && typeof (res as any).catch === 'function') {
        (res as any).catch((err: any) => {
          console.error('Delete error in background:', err);
          setDashboardNotice(`Gagal menghapus: ${err.message || 'Koneksi bermasalah'}`);
        });
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setDashboardNotice(`Gagal menghapus: ${err.message || 'Koneksi bermasalah'}`);
    }
  };

  // Compute Statistics
  const totalAnggota = people.length;
  const maxGen = useMemo(() => {
    return Math.max(...people.map(p => p.generation ?? 0), 0);
  }, [people]);
  const totalGenerasi = maxGen + 1;
  const totalCabang = branches.length;
  const upcomingAgendasCount = agendas.filter(a => a.status === 'UPCOMING').length;
  const totalCariyos = cariyos.length;
  const totalFoto = people.filter(p => !!p.photoUrl).length;

  const nextGathering = useMemo(() => {
    return agendas.filter(a => a.status === 'UPCOMING').sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [agendas]);

  const recentlyAdded = useMemo(() => {
    return [...people].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  }, [people]);

  const dataRequiringCompletion = useMemo(() => {
    const parentRelMap = new Set(relationships.filter(r => r.type === 'PARENT').map(r => r.person2Id));

    return people.filter(p => {
      const missingBirth = !p.birthYear;
      const missingPhoto = !p.photoUrl;
      const missingParents = p.isDescendant && (p.generation ?? 0) > 0 && !parentRelMap.has(p.id);
      return missingBirth || missingPhoto || missingParents;
    }).slice(0, 6);
  }, [people, relationships]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return people;
    const q = memberSearch.toLowerCase();
    return people.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.callName && p.callName.toLowerCase().includes(q)) ||
      (p.branchName && p.branchName.toLowerCase().includes(q))
    );
  }, [people, memberSearch]);

  const filteredAdminGallery = useMemo(() => {
    return gallery.filter(item => {
      const matchesCategory = galleryFilter === 'ALL' || item.category === galleryFilter;
      const matchesSearch = !gallerySearch.trim() ||
        item.title.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        (item.caption && item.caption.toLowerCase().includes(gallerySearch.toLowerCase())) ||
        (item.date && item.date.toLowerCase().includes(gallerySearch.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [gallery, galleryFilter, gallerySearch]);

  const handleOpenAddPhoto = () => {
    setPhotoToEdit(null);
    setIsGalleryModalOpen(true);
  };

  const handleOpenEditPhoto = (photo: GalleryItem) => {
    setPhotoToEdit(photo);
    setIsGalleryModalOpen(true);
  };

  const handleSaveGalleryItem = async (photoData: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (photoToEdit) {
        await updateGalleryItem(photoToEdit.id, photoData);
        setGalleryFeedback({
          type: 'success',
          message: `Foto dokumentasi "${photoData.title}" berhasil diperbarui di Firestore.`,
        });
      } else {
        await addGalleryItem(photoData);
        setGalleryFeedback({
          type: 'success',
          message: `Foto dokumentasi "${photoData.title}" berhasil ditambahkan ke galeri.`,
        });
      }
      setIsGalleryModalOpen(false);
      setPhotoToEdit(null);
      setTimeout(() => setGalleryFeedback(null), 4000);
    } catch (err: any) {
      setGalleryFeedback({
        type: 'error',
        message: `Gagal menyimpan foto: ${err?.message || 'Error'}`,
      });
      throw err;
    }
  };

  const handleDeleteGalleryPhoto = async (photoId: string, photoTitle: string) => {
    try {
      setConfirmDeletePhotoId(null);
      await deleteGalleryItem(photoId);
      setGalleryFeedback({
        type: 'success',
        message: `Foto "${photoTitle}" berhasil dihapus dari galeri dan Firestore.`,
      });
      if (activeLightboxPhoto?.id === photoId) {
        setActiveLightboxPhoto(null);
      }
      setTimeout(() => setGalleryFeedback(null), 3500);
    } catch (err: any) {
      setGalleryFeedback({
        type: 'error',
        message: `Gagal menghapus: ${err?.message || 'Error'}`,
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      if (selectedWiwitanId !== settings.wiwitanPersonId) {
        await onSetWiwitan(selectedWiwitanId);
      }
      await onUpdateSettings({
        familyName: familyNameInput,
        tagline: taglineInput,
        mingguPonReferenceDate: mingguPonRefInput,
      });
      setDashboardNotice('Pengaturan trah berhasil disimpan ke Firebase!');
      setTimeout(() => setDashboardNotice(null), 3500);
    } catch (err: any) {
      setDashboardNotice('Gagal menyimpan: ' + (err.message || 'Error'));
      setTimeout(() => setDashboardNotice(null), 4000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Master Admin: Simpan Konfigurasi Google Drive ke Firebase
  const handleSaveDriveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDriveUrl(true);
    try {
      await onUpdateSettings({
        googleDriveFolderUrl: driveUrlInput.trim() || undefined,
      });
      setDriveSaveSuccess(true);
      setDashboardNotice('Konfigurasi Google Drive berhasil disimpan ke Firebase!');
      setTimeout(() => setDriveSaveSuccess(false), 4000);
      setTimeout(() => setDashboardNotice(null), 3500);
    } catch (err: any) {
      console.error('Error saving drive configuration:', err);
      setDashboardNotice('Gagal menyimpan konfigurasi: ' + (err.message || 'Error'));
      setTimeout(() => setDashboardNotice(null), 4000);
    } finally {
      setIsSavingDriveUrl(false);
    }
  };

  const handleRegisterNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);
    setAdminActionLoading(true);

    try {
      await registerAdmin(newAdminUsername, newAdminPassword, newAdminDisplayName, newAdminRole);
      setAdminFeedback({
        type: 'success',
        message: `Admin @${newAdminUsername.toLowerCase().trim()} berhasil didaftarkan sebagai ${newAdminRole === 'master_admin' ? 'Master Admin' : 'Admin Paguyuban'}!`,
      });
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminDisplayName('');
      setNewAdminRole('admin');
    } catch (err: any) {
      setAdminFeedback({
        type: 'error',
        message: err.message || 'Gagal mendaftarkan admin.',
      });
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleToggleAdminRole = async (targetAdmin: AdminUser) => {
    const nextRole: AdminRole = targetAdmin.role === 'master_admin' ? 'admin' : 'master_admin';
    const nextLabel = nextRole === 'master_admin' ? 'Master Admin' : 'Admin Paguyuban';

    try {
      await updateAdminRole(targetAdmin.id, nextRole);
      setAdminFeedback({
        type: 'success',
        message: `Peran admin @${targetAdmin.username} berhasil diperbarui menjadi ${nextLabel}.`,
      });
    } catch (err: any) {
      setAdminFeedback({
        type: 'error',
        message: err.message || 'Gagal mengubah peran admin.',
      });
    }
  };

  const handleRemoveAdminUser = async (targetAdmin: AdminUser) => {
    try {
      await removeAdmin(targetAdmin.id);
      setConfirmRemoveAdminId(null);
      setAdminFeedback({
        type: 'success',
        message: `Akses admin untuk @${targetAdmin.username} berhasil dicabut.`,
      });
    } catch (err: any) {
      setAdminFeedback({
        type: 'error',
        message: err.message || 'Gagal mencabut akses admin.',
      });
    }
  };

  const handleSaveChangedPassword = async (adminId: string) => {
    if (!editingPasswordVal.trim() || editingPasswordVal.trim().length < 6) {
      setAdminFeedback({
        type: 'error',
        message: 'Password baru minimal 6 karakter.',
      });
      return;
    }

    try {
      await updateAdminPassword(adminId, editingPasswordVal.trim());
      setAdminFeedback({
        type: 'success',
        message: 'Password admin berhasil diperbarui!',
      });
      setEditingPasswordAdminId(null);
      setEditingPasswordVal('');
    } catch (err: any) {
      setAdminFeedback({
        type: 'error',
        message: 'Gagal mengubah password: ' + (err.message || 'Error'),
      });
    }
  };

  const handleSendPasswordReset = async (targetAdmin: AdminUser) => {
    if (!targetAdmin.email) return;
    try {
      await sendAdminPasswordReset(targetAdmin.email);
      setAdminFeedback({
        type: 'success',
        message: `Email reset password dikirim ke ${targetAdmin.email}. Minta admin tersebut membuka emailnya.`,
      });
    } catch (err: any) {
      setAdminFeedback({
        type: 'error',
        message: err.message || 'Gagal mengirim email reset password.',
      });
    }
  };

  const togglePasswordVisibility = (adminId: string) => {
    setRevealedPasswords(prev => {
      const next = new Set(prev);
      if (next.has(adminId)) next.delete(adminId);
      else next.add(adminId);
      return next;
    });
  };

  const personNameMap = useMemo(() => {
    const map = new Map<string, string>();
    people.forEach(p => map.set(p.id, p.name));
    return map;
  }, [people]);

  return (
    <div className="space-y-8">
      
      {/* Back Button to return to previous page */}
      {onBackToHome && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-2xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Kembali ke Halaman Sebelumnya</span>
          </button>
        </div>
      )}

      {/* Top Banner (Modern SaaS style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            {isMasterAdmin ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[11px] shadow-2xs">
                <Crown className="w-3 h-3 text-amber-600" />
                <span>Master Admin</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-bold text-[11px]">
                <Shield className="w-3 h-3 text-slate-600" />
                <span>Admin Paguyuban</span>
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700 font-bold">{currentAdmin?.email || `@${currentAdmin?.username}`}</span>
            {currentAdmin?.displayName && currentAdmin.displayName !== currentAdmin.username && (
              <span className="text-slate-500">({currentAdmin.displayName})</span>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 font-serif-title">
            Pusat Pengelolaan Trah
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data silsilah, kelola administrator, tetapkan Wiwitan utama, dan arsip keluarga
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl self-start lg:self-auto">
          {[
            { id: 'OVERVIEW', label: 'Ringkasan' },
            { id: 'MEMBERS', label: 'Anggota' },
            { id: 'RELATIONSHIPS', label: 'Relasi' },
            { id: 'AGENDAS', label: `Agenda (${agendas.length})` },
            { id: 'GALLERY', label: `Galeri Foto (${gallery.length})` },
            ...(isMasterAdmin ? [
              { id: 'ADMINS', label: 'Kelola Admin' },
              { id: 'GITHUB', label: 'GitHub & Database' },
            ] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeAdminTab === tab.id
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {tab.id === 'GALLERY' && <ImageIcon className="w-3 h-3 text-[#C9A84C]" />}
              {tab.id === 'ADMINS' && <Key className="w-3 h-3 text-amber-600" />}
              {tab.id === 'GITHUB' && <Github className="w-3 h-3 text-slate-700" />}
              <span>{tab.label}</span>
              {tab.id === 'ADMINS' && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-100 text-amber-900">
                  {adminsList.length || 1}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeAdminTab === 'OVERVIEW' && (
        <div className="space-y-8">
          
          {/* Quick Actions Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Tindakan Cepat:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                onClick={onOpenAddPerson}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Anggota Baru</span>
              </button>

              <button
                onClick={onOpenAddAgenda}
                className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>+ Jadwal Agenda</span>
              </button>

              <button
                onClick={onOpenAddKabar}
                className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Newspaper className="w-4 h-4 text-slate-500" />
                <span>+ Kabar Trah</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('GALLERY')}
                className="p-3 rounded-2xl border border-[#C9A84C]/40 bg-[#FAF7F2] hover:bg-amber-50 text-amber-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                title="Buka menu khusus kelola Galeri Dokumentasi Foto Trah"
              >
                <ImageIcon className="w-4 h-4 text-[#C9A84C]" />
                <span>Kelola Galeri Foto ({gallery.length})</span>
              </button>

              <button
                onClick={handleOpenAddPhoto}
                className="p-3 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                title="Tambah Foto Baru Langsung ke Galeri Trah"
              >
                <Plus className="w-4 h-4 text-amber-700" />
                <span>+ Foto Dokumentasi</span>
              </button>

              {isMasterAdmin && (
                <button
                  onClick={() => setActiveAdminTab('ADMINS')}
                  className="p-3 rounded-2xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100/60 text-amber-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors col-span-2 sm:col-span-3"
                >
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>Kelola Admin & Kredensial ({adminsList.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Metric Cards (Statistik Utama) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Total Anggota</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                {totalAnggota}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {people.filter(p => p.isDescendant).length} keturunan · {people.filter(p => !p.isDescendant).length} pasangan
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Jenjang Generasi</span>
                <TreeDeciduous className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                {totalGenerasi}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Dari Wiwitan hingga Gen {maxGen}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Cabang Keluarga</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                {totalCabang}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Garis keturunan tingkat 1
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Admin Paguyuban</span>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                {adminsList.length || 1}
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-1">
                {adminsList.filter(a => a.role === 'master_admin').length} Master Admin terdaftar
              </div>
            </div>
          </div>

          {/* Agenda & Data Verification Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Next Gathering Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Agenda Terdekat
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Clock className="w-3 h-3" />
                    <span>Mendatang</span>
                  </span>
                </div>

                {nextGathering ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-950">
                      {nextGathering.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      📅 {formatIndonesianDate(nextGathering.date)} ({format24HourWIB(nextGathering.time)})
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      📍 {nextGathering.location}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <button
                        onClick={() => onOpenEditAgenda(nextGathering)}
                        className="font-medium text-slate-700 hover:text-slate-950 underline"
                      >
                        Sunting Agenda
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => handleDirectDeleteAgenda(nextGathering.id, nextGathering.title)}
                        className="font-medium text-rose-600 hover:text-rose-800 underline"
                      >
                        Hapus Agenda
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Belum ada agenda mendatang yang dijadwalkan.
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  {upcomingAgendasCount} agenda aktif
                </span>
                <button
                  onClick={onOpenAddAgenda}
                  className="text-xs font-semibold text-slate-900 hover:underline"
                >
                  + Tambah Agenda
                </button>
              </div>
            </div>

            {/* Data Completeness Reminder */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pemberitahuan Data Belum Lengkap
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {dataRequiringCompletion.length} perlu dilengkapi
                  </span>
                </div>

                <div className="space-y-2">
                  {dataRequiringCompletion.map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-950">{p.name}</div>
                        <div className="text-[10px] text-amber-700 font-medium">
                          {!p.birthYear && 'Belum ada tahun lahir · '}
                          {!p.photoUrl && 'Foto belum diunggah'}
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenEditPerson(p)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-950 hover:underline"
                      >
                        Lengkapi
                      </button>
                    </div>
                  ))}
                  {dataRequiringCompletion.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      Semua data silsilah telah lengkap!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MANAGE MEMBERS ================= */}
      {activeAdminTab === 'MEMBERS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-950">
                Kelola Seluruh Anggota
              </h3>
              <p className="text-xs text-slate-500">
                Tambah, sunting, atau hapus anggota keluarga dan pasangan
              </p>
            </div>
            <button
              onClick={onOpenAddPerson}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Cari anggota berdasarkan nama..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nama</th>
                  <th className="py-3 px-3">Garis</th>
                  <th className="py-3 px-3">Generasi</th>
                  <th className="py-3 px-3">Cabang</th>
                  <th className="py-3 px-3">Kelahiran</th>
                  <th className="py-3 px-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredMembers.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-medium text-slate-950">
                      {p.name} {p.callName && <span className="text-slate-400 font-normal">({p.callName})</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.isDescendant ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Darah
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          Pasangan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      Gen {p.generation ?? 0} · {getJavaneseGenerationTerm(p.generation)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.branchName || 'Trah'}</td>
                    <td className="py-3 px-3 text-slate-600">{p.birthYear || '-'}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenEditPerson(p)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Sunting"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {confirmDeletePersonId === p.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                            <button
                              onClick={async () => {
                                setConfirmDeletePersonId(null);
                                await onDeletePerson(p.id);
                                setDashboardNotice(`Anggota "${p.name}" berhasil dihapus.`);
                                setTimeout(() => setDashboardNotice(null), 3500);
                              }}
                              className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 shadow-2xs"
                            >
                              Hapus!
                            </button>
                            <button
                              onClick={() => setConfirmDeletePersonId(null)}
                              className="px-1.5 py-1 rounded text-slate-600 text-[11px] hover:bg-slate-200"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeletePersonId(p.id)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: RELATIONSHIPS ================= */}
      {activeAdminTab === 'RELATIONSHIPS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-950">
                Kelola Relasi Silsilah
              </h3>
              <p className="text-xs text-slate-500">
                Daftar relasi orang tua-anak (PARENT) dan pasangan (SPOUSE)
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total: {relationships.length} relasi
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {relationships.map(rel => {
              const p1Name = personNameMap.get(rel.person1Id) || rel.person1Id;
              const p2Name = personNameMap.get(rel.person2Id) || rel.person2Id;

              return (
                <div key={rel.id} className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {rel.type}
                    </span>
                    <div>
                      {rel.type === 'PARENT' ? (
                        <span>
                          <strong className="text-slate-950">{p1Name}</strong> adalah orang tua dari <strong className="text-slate-950">{p2Name}</strong>
                        </span>
                      ) : (
                        <span>
                          <strong className="text-slate-950">{p1Name}</strong> menikah dengan <strong className="text-slate-950">{p2Name}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {confirmDeleteRelId === rel.id ? (
                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                      <button
                        onClick={async () => {
                          setConfirmDeleteRelId(null);
                          await onDeleteRelationship(rel.id);
                          setDashboardNotice('Relasi berhasil dihapus.');
                          setTimeout(() => setDashboardNotice(null), 3000);
                        }}
                        className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 shadow-2xs"
                      >
                        Hapus!
                      </button>
                      <button
                        onClick={() => setConfirmDeleteRelId(null)}
                        className="px-1.5 py-1 rounded text-slate-600 text-[11px] hover:bg-slate-200"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteRelId(rel.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB: AGENDAS ================= */}
      {activeAdminTab === 'AGENDAS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-950 font-serif-title">
                Kelola Seluruh Agenda Pertemuan
              </h3>
              <p className="text-xs text-slate-500">
                Tambah, sunting, atau hapus jadwal pertemuan arisan Pon, halal bihalal trah besar, dan ziarah (Format 24 Jam WIB)
              </p>
            </div>
            <button
              onClick={onOpenAddAgenda}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Tambah Agenda</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Judul Acara</th>
                  <th className="py-3 px-3">Jenis</th>
                  <th className="py-3 px-3">Tanggal & Waktu (WIB)</th>
                  <th className="py-3 px-3">Lokasi / Tuan Rumah</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {[...agendas].sort((a, b) => b.date.localeCompare(a.date)).map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-semibold text-slate-950">
                      <div>{a.title}</div>
                      {a.theme && <div className="text-[11px] text-slate-500 font-normal italic">"{a.theme}"</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        (a.category === 'Arisan Trah' || a.type === 'ARISAN')
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : (a.category === 'Syawalan Trah' || a.type === 'TRAH_BESAR')
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {a.category || (a.type === 'ARISAN' ? 'Arisan Trah' : a.type === 'TRAH_BESAR' ? 'Syawalan Trah' : 'Lain-lain')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">{formatIndonesianDate(a.date)}</div>
                      <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{format24HourWIB(a.time)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{a.location}</div>
                      {a.hostFamily && (
                        <div className="text-[11px] text-slate-500">Tuan Rumah: {a.hostFamily}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === 'UPCOMING'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : a.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {a.status === 'UPCOMING' ? 'Akan Datang' : a.status === 'COMPLETED' ? 'Selesai' : 'Dibatalkan'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenEditAgenda(a)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Sunting Agenda"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDirectDeleteAgenda(a.id, a.title)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Hapus Agenda Langsung"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {agendas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                      Belum ada agenda yang tersimpan. Klik "+ Tambah Agenda" di atas untuk membuat jadwal baru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: GALLERY (KELOLA GALERI FOTO & PERTEMUAN TRAH) ================= */}
      {activeAdminTab === 'GALLERY' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-[#C9A84C]">
                    <ImageIcon className="w-5 h-5 text-[#C9A84C]" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-950 font-serif-title">
                    Kelola Galeri Dokumentasi Foto & Pertemuan Trah
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                  Tambah foto baru, perbarui judul atau kategori, dan hapus foto dari galeri paguyuban. Seluruh perubahan tersimpan permanen di Firebase Firestore.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleOpenAddPhoto}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#C9A84C] hover:bg-[#d6b75e] text-[#20150b] font-bold text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Tambah Foto Dokumentasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '#agenda';
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                  title="Lihat tampilan galeri pada halaman publik"
                >
                  <span>Lihat Tampilan Publik</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Gallery Feedback Notice */}
            {galleryFeedback && (
              <div
                className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
                  galleryFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {galleryFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{galleryFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Total Foto Tersimpan</span>
              <span className="text-xl font-bold text-slate-900 font-mono">{gallery.length}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Kategori Syawalan</span>
              <span className="text-xl font-bold text-slate-900 font-mono">
                {gallery.filter(g => g.category === 'Syawalan Trah').length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Kategori Arisan Pon</span>
              <span className="text-xl font-bold text-slate-900 font-mono">
                {gallery.filter(g => g.category === 'Arisan Trah').length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Sinkronisasi Cloud</span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Firestore Aktif</span>
              </span>
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  placeholder="Cari berdasarkan judul, keterangan, atau tahun/tanggal..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {gallerySearch && (
                  <button
                    onClick={() => setGallerySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Counter Indicator */}
              <span className="text-xs text-slate-500 shrink-0">
                Menampilkan <strong>{filteredAdminGallery.length}</strong> dari <strong>{gallery.length}</strong> foto
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              {[
                { label: 'Semua Momen', val: 'ALL' },
                { label: 'Syawalan Trah', val: 'Syawalan Trah' },
                { label: 'Arisan Trah', val: 'Arisan Trah' },
                { label: 'Ziarah Leluhur', val: 'Ziarah Leluhur' },
                { label: 'Rembug Pengurus', val: 'Rembug Pengurus' },
                { label: 'Lain-lain', val: 'Lain-lain' },
              ].map(f => {
                const count = f.val === 'ALL'
                  ? gallery.length
                  : gallery.filter(g => g.category === f.val).length;
                return (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setGalleryFilter(f.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      galleryFilter === f.val
                        ? 'bg-slate-950 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      galleryFilter === f.val ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gallery Items Grid */}
          {filteredAdminGallery.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {gallery.length === 0
                  ? 'Belum Ada Foto Dokumentasi di Galeri'
                  : 'Tidak Ada Foto yang Sesuai Pencarian'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {gallery.length === 0
                  ? 'Koleksi foto galeri saat ini kosong. Anda dapat menambahkan foto dokumentasi silaturahmi syawalan, arisan selapanan, dan momen kebersamaan trah lainnya.'
                  : 'Coba ubah kata kunci pencarian atau pilih kategori lain di atas.'}
              </p>
              <div className="pt-2">
                {gallery.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleOpenAddPhoto}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A84C] hover:bg-[#d6b75e] text-[#20150b] font-bold text-xs shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Tambah Foto Dokumentasi Sekarang</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setGallerySearch('');
                      setGalleryFilter('ALL');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                  >
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAdminGallery.map((photo) => {
                const isDeleting = confirmDeletePhotoId === photo.id;
                return (
                  <div
                    key={photo.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-[#C9A84C] hover:shadow-md transition-all flex flex-col relative"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-4/3 bg-slate-100 overflow-hidden group">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Category Badge */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-[10px] font-bold text-white border border-white/20">
                          {photo.category}
                        </span>
                      </div>

                      {/* Date Badge */}
                      <div className="absolute bottom-2.5 left-2.5 z-10">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-xs text-[10px] font-mono text-amber-300 border border-white/10">
                          {photo.date}
                        </span>
                      </div>

                      {/* Preview Overlay Button */}
                      <button
                        type="button"
                        onClick={() => setActiveLightboxPhoto(photo)}
                        className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        title="Klik untuk pratinjau foto besar"
                      >
                        <div className="p-2 rounded-full bg-white/25 backdrop-blur-xs">
                          <Eye className="w-5 h-5 drop-shadow" />
                        </div>
                      </button>

                      {/* Inline Confirmation Delete Overlay */}
                      {isDeleting && (
                        <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center text-white animate-in fade-in duration-150">
                          <AlertCircle className="w-6 h-6 text-rose-400 mb-1" />
                          <p className="text-xs font-bold leading-tight">Hapus foto ini?</p>
                          <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5 max-w-[85%]">{photo.title}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteGalleryPhoto(photo.id, photo.title)}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePhotoId(null)}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                          {photo.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {photo.caption || 'Tanpa keterangan tambahan.'}
                        </p>
                        {photo.driveUrl && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                            <FolderOpen className="w-3 h-3 shrink-0" />
                            <a
                              href={photo.driveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline truncate"
                            >
                              Tersambung Google Drive
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons: Sunting, Hapus, Pratinjau */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPhoto(photo)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all shadow-2xs hover:scale-105"
                            title="Sunting data foto ini"
                          >
                            <Edit className="w-3 h-3 text-amber-700" />
                            <span>Sunting</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeletePhotoId(isDeleting ? null : photo.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-all shadow-2xs hover:scale-105"
                            title="Hapus foto ini secara permanen dari galeri"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Hapus</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveLightboxPhoto(photo)}
                          className="text-slate-400 hover:text-slate-700 text-[11px] font-medium flex items-center gap-0.5"
                          title="Lihat foto penuh"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Lihat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: MASTER ADMIN ONLY (KELOLA ADMIN & KREDENSIAL RAHASIA) ================= */}
      {activeAdminTab === 'ADMINS' && (
        !isMasterAdmin ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-200 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
              <Lock className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-950 font-serif-title">
                Akses Ditolak: Khusus Master Admin
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
                Bagian <strong>Kelola Admin</strong> bersifat rahasia karena memuat seluruh kata sandi pengurus, kredensial autentikasi, serta hak modifikasi administrator. Bagian ini hanya dapat dibuka dan dikelola secara langsung oleh <strong>Master Admin</strong>.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveAdminTab('OVERVIEW')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Halaman Ringkasan</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header & Role Info */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                      👑
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-950">
                      Kelola Administrator & Hak Akses
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Master Admin berhak mendaftarkan akun pengurus baru, melihat atau mengubah kata sandi, menetapkan peran, serta mencabut hak akses administrator.
                  </p>
                </div>

                {/* Current User Status Pill */}
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 self-start sm:self-auto text-xs">
                  <div className="text-[10px] text-amber-800 uppercase font-bold tracking-wider mb-0.5">
                    Status Anda Saat Ini
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>Master Admin (Akses Penuh)</span>
                  </div>
                </div>
              </div>

              {/* Notification Feedback */}
              {adminFeedback && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                    adminFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {adminFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{adminFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Form to Register New Admin (Master Admin Only) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-300/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <h4 className="text-base font-bold text-slate-950">
                  Daftarkan Administrator Baru
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Daftarkan email dan password awal untuk pengurus trah. Gunakan email asli pengurus supaya password bisa direset lewat email. Password minimal 6 karakter dan tidak disimpan di database.
              </p>

              <form onSubmit={handleRegisterNewAdmin} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Email / Username Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={newAdminUsername}
                      onChange={(e) => setNewAdminUsername(e.target.value.toLowerCase().trim())}
                      placeholder="contoh: pengurus@gmail.com"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs sm:text-sm text-slate-950 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="contoh: budi1234"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs sm:text-sm text-slate-950 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  {/* Display Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap / Panggilan
                    </label>
                    <input
                      type="text"
                      value={newAdminDisplayName}
                      onChange={(e) => setNewAdminDisplayName(e.target.value)}
                      placeholder="contoh: Pakde Budi"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs sm:text-sm text-slate-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tingkat Hak Akses *
                    </label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold text-xs sm:text-sm text-slate-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="admin">Admin Paguyuban (Kelola Data)</option>
                      <option value="master_admin">👑 Master Admin (Kelola Admin)</option>
                    </select>
                  </div>
                </div>

                {/* Role Explanations */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    {newAdminRole === 'master_admin' ? (
                      <span>
                        <strong>Master Admin:</strong> Memiliki wewenang penuh termasuk menambah, mengedit password, dan mengelola administrator lain.
                      </span>
                    ) : (
                      <span>
                        <strong>Admin Paguyuban:</strong> Dapat mengelola silsilah, arsip kabar trah, dan jadwal pertemuan tanpa akses menambah akun pengurus.
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={adminActionLoading}
                    className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-amber-400" />
                    <span>{adminActionLoading ? 'Mendaftarkan...' : '+ Simpan & Buat Akun Admin'}</span>
                  </button>
                </div>
              </form>
            </div>

          {/* Table / List of Registered Admins */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-950">
                  Daftar Administrator Terdaftar ({adminsList.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Seluruh akun pengurus yang memiliki hak akses sistem silsilah
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Administrator</th>
                    <th className="py-3 px-3">Peran</th>
                    <th className="py-3 px-3">Password</th>
                    <th className="py-3 px-3">Didaftarkan Oleh</th>
                    <th className="py-3 px-3">Tanggal Dibuat</th>
                    {isMasterAdmin && (
                      <th className="py-3 px-3 text-right">Tindakan</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {adminsList.map((adm) => {
                    const isSelf = currentAdmin?.id === adm.id;
                    const isMaster = adm.role === 'master_admin';
                    const isRevealed = revealedPasswords.has(adm.id);
                    const isEditingThisPassword = editingPasswordAdminId === adm.id;

                    return (
                      <tr key={adm.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-950 flex items-center gap-1.5">
                            <span>{adm.displayName || adm.username}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-200">
                                (Anda)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {adm.email || (adm.username.includes('@') ? adm.username : `@${adm.username}`)}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {isMaster ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                              <Crown className="w-3.5 h-3.5 text-amber-600" />
                              <span>Master Admin</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <Shield className="w-3.5 h-3.5 text-slate-500" />
                              <span>Admin Paguyuban</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {isEditingThisPassword ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                autoFocus
                                placeholder="Password baru"
                                value={editingPasswordVal}
                                onChange={(e) => setEditingPasswordVal(e.target.value)}
                                className="w-28 sm:w-36 px-2 py-1 rounded-lg border border-amber-400 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                              <button
                                onClick={() => handleSaveChangedPassword(adm.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPasswordAdminId(null);
                                  setEditingPasswordVal('');
                                }}
                                className="px-1.5 py-1 text-slate-500 hover:text-slate-800 text-[11px]"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Tersimpan aman (tidak dapat dilihat)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-500 text-xs">
                          {adm.addedBy || 'Master Admin'}
                        </td>

                        <td className="py-3 px-3 text-slate-500 text-xs font-mono">
                          {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </td>

                        {isMasterAdmin && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Change Password Button */}
                              {isSelf && !isEditingThisPassword && (
                                <button
                                  onClick={() => {
                                    setEditingPasswordAdminId(adm.id);
                                    setEditingPasswordVal('');
                                  }}
                                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                                  title="Ganti password akun Anda"
                                >
                                  Ganti Password
                                </button>
                              )}
                              {!isSelf && adm.email && (
                                <button
                                  onClick={() => handleSendPasswordReset(adm)}
                                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                                  title="Kirim email reset password ke admin ini"
                                >
                                  Kirim Email Reset
                                </button>
                              )}

                              {/* Toggle Role Button (only for other admins) */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleAdminRole(adm)}
                                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                                  title={adm.role === 'master_admin' ? 'Ubah ke Admin Biasa' : 'Jadikan Master Admin'}
                                >
                                  {adm.role === 'master_admin' ? 'Jadikan Admin' : 'Jadikan Master'}
                                </button>
                              )}

                              {/* Delete Admin Button */}
                              {!isSelf && (
                                confirmRemoveAdminId === adm.id ? (
                                  <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200 animate-in fade-in">
                                    <button
                                      onClick={() => handleRemoveAdminUser(adm)}
                                      className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 shadow-2xs"
                                    >
                                      Cabut!
                                    </button>
                                    <button
                                      onClick={() => setConfirmRemoveAdminId(null)}
                                      className="px-1.5 py-1 rounded text-slate-600 text-[10px] hover:bg-slate-200"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmRemoveAdminId(adm.id)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors"
                                    title="Hapus Akun Admin"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    )}

      {/* ================= TAB 6: GITHUB & FIREBASE DATABASE (MASTER ADMIN ONLY) ================= */}
      {activeAdminTab === 'GITHUB' && (
        !isMasterAdmin ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-200 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
              <Lock className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-950 font-serif-title">
                Akses Ditolak: Khusus Master Admin
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
                Petunjuk upload GitHub, trigger reCAPTCHA Enterprise, serta konfigurasi teknis database bersifat rahasia dan hanya dapat diakses oleh <strong>Master Admin</strong>.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveAdminTab('OVERVIEW')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Halaman Ringkasan</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-950 font-serif-title">
                    Pusat Pengaturan Master Admin & Cloud Database
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instruksi konfigurasi database cloud Google Drive, Firebase, reCAPTCHA, serta panduan upload GitHub
                  </p>
                </div>
              </div>
            </div>

            <MigrasiDataLama />

            {/* ================= PENGATURAN & KONFIGURASI GOOGLE DRIVE (KHUSUS MASTER ADMIN) ================= */}
            <div className="bg-white p-6 rounded-3xl border border-blue-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-950 text-base">
                        Konfigurasi Database Cloud Google Drive
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span>Khusus Master Admin</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pangkalan penyimpanan cloud dokumentasi foto, notula, dan album trah. Informasi konfigurasi ini hanya dapat dilihat oleh Master Admin.
                    </p>
                  </div>
                </div>

                {settings.googleDriveFolderUrl && (
                  <a
                    href={settings.googleDriveFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors shrink-0"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Buka Folder Aktif ↗</span>
                  </a>
                )}
              </div>

              {/* Form Input URL Google Drive */}
              <form onSubmit={handleSaveDriveConfig} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tautan Folder Utama Google Drive Trah</span>
                  </label>
                  {driveSaveSuccess && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 animate-in fade-in">
                      ✓ Tersimpan ke Firebase Settings!
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={driveUrlInput}
                    onChange={(e) => setDriveUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isSavingDriveUrl}
                    className="px-5 py-2 rounded-xl bg-[#20150b] hover:bg-[#322013] text-[#C9A84C] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingDriveUrl ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Tautan ini tersimpan secara aman di Firebase Settings (dokumen <code className="bg-white px-1 py-0.2 rounded border font-mono text-slate-700">settings/general</code>) dan menjadi rujukan cloud seluruh dokumentasi trah.
                </p>
              </form>

              {/* Panduan 3 Langkah Konfigurasi Google Drive untuk Master Admin */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Panduan Langkah Setup Google Drive sebagai Database Foto:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-700">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#20150b] text-[#C9A84C] flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h5 className="font-bold text-slate-900">Buat Folder di Google Drive</h5>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Buat folder baru di akun Google Drive pengurus trah, contoh: <strong>"Dokumentasi Trah Sosentono"</strong>. Di dalamnya buat sub-folder untuk tiap acara (Syawalan, Arisan Selapanan, dll).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#20150b] text-[#C9A84C] flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h5 className="font-bold text-slate-900">Atur Akses Publik (Pelihat)</h5>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Klik kanan folder &gt; <strong>Bagikan (Share)</strong> &gt; ubah Akses Umum menjadi <strong>"Siapa saja yang memiliki tautan" (Anyone with the link)</strong> dengan peran <strong>"Pelihat" (Viewer)</strong> agar seluruh keluarga bisa membuka tanpa login.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#20150b] text-[#C9A84C] flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h5 className="font-bold text-slate-900">Simpan Tautan di Form Ini</h5>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Salin tautan folder dan tempelkan pada kolom di atas, lalu klik <strong>Simpan Konfigurasi</strong>. Tautan juga dapat disematkan ke agenda kegiatan masing-masing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* reCAPTCHA Enterprise Trigger Card (Simpan Trigger Khusus Master Admin) */}
            <div className="bg-white p-6 rounded-3xl border border-amber-300 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 text-sm">
                      Uji / Trigger reCAPTCHA Enterprise
                    </h4>
                    <p className="text-xs text-slate-500">
                      Domain aktif saat ini: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800 font-semibold">{typeof window !== 'undefined' ? window.location.hostname : 'sosentono.ai.studio'}</code>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestRecaptcha}
                  disabled={recaptchaTesting}
                  className="px-4 py-2.5 rounded-xl bg-[#20150b] hover:bg-[#342211] text-[#E8D4A0] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${recaptchaTesting ? 'animate-spin' : ''}`} />
                  <span>{recaptchaTesting ? 'Memeriksa...' : 'Trigger Ulang'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Klik tombol <strong>Trigger Ulang</strong> di atas untuk memanggil reCAPTCHA langsung di tab browser Anda dan memverifikasi token perlindungan bot aktif tanpa perlu logout.
              </p>

              {recaptchaResult && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                    recaptchaResult.status === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {recaptchaResult.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-semibold">{recaptchaResult.message}</div>
                    {recaptchaResult.token && (
                      <div className="font-mono text-[11px] text-emerald-700 bg-white/80 px-2 py-1 rounded border border-emerald-200/60 break-all">
                        Token: {recaptchaResult.token}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          {/* Quick Action: Export Full Family Data to JSON */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-950 font-bold text-sm mb-1">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Cadangkan Data Silsilah (Export JSON Backup)</span>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Unduh seluruh data keluarga ({people.length} anggota, {relationships.length} relasi, {agendas.length} agenda) dalam format JSON sebagai arsip cadangan sebelum upload.
              </p>
            </div>
            <button
              onClick={() => {
                const fullBackup = {
                  version: '1.0',
                  exportedAt: new Date().toISOString(),
                  settings,
                  people,
                  relationships,
                  agendas,
                  kabar,
                  cariyos,
                };
                const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup_trah_${settings.familyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Arsip JSON Trah</span>
            </button>
          </div>

          {/* Step 1: Push to GitHub */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
              <span>Langkah 1: Perintah Terminal untuk Upload ke GitHub</span>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              Buat repository baru di <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">GitHub.com</a> (beri nama misalnya <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">silsilah-sosentono</code>), lalu jalankan perintah berikut di terminal:
            </p>
            <div className="pl-8">
              <div className="relative bg-[#1E1E1E] text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto">
                <button
                  onClick={() => {
                    const code = 'git init\ngit add .\ngit commit -m "feat: inisialisasi aplikasi silsilah trah modern"\ngit branch -M main\ngit remote add origin https://github.com/USERNAME/silsilah-sosentono.git\ngit push -u origin main';
                    navigator.clipboard.writeText(code);
                    setCopiedCodeId('git_cmd');
                    setTimeout(() => setCopiedCodeId(null), 2000);
                  }}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedCodeId === 'git_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodeId === 'git_cmd' ? 'Disalin!' : 'Salin Perintah'}</span>
                </button>
                <pre className="leading-relaxed">
{`# 1. Inisialisasi git jika belum ada
git init

# 2. Tambahkan semua file dan buat commit
git add .
git commit -m "feat: inisialisasi aplikasi silsilah trah modern"

# 3. Ubah nama branch utama ke main
git branch -M main

# 4. Hubungkan ke repository GitHub Anda (ganti USERNAME)
git remote add origin https://github.com/USERNAME/silsilah-sosentono.git

# 5. Push kode ke GitHub
git push -u origin main`}
                </pre>
              </div>
            </div>
          </div>

          {/* Step 2: Firebase Database Settings */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">2</span>
              <span>Langkah 2: Konfigurasi Firebase Database di Domain Baru</span>
            </div>
            
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              Database Firebase Firestore dan autentikasi telah disiapkan. Ketika aplikasi diakses dari domain baru (seperti Vercel, Netlify, atau localhost), pastikan:
            </p>

            <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-700" />
                  <span>Daftarkan Authorized Domains (PENTING)</span>
                </div>
                <p className="text-amber-900 leading-relaxed">
                  Buka <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong>.
                  Tambahkan domain hosting Anda (contoh: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">sosentono.vercel.app</code> dan <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">localhost</code>). Jika langkah ini tidak dilakukan, login Google akan menampilkan error unauthorized domain.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-950 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-slate-700" />
                  <span>Konfigurasi Database Terpasang</span>
                </div>
                <div className="font-mono text-[11px] text-slate-700 space-y-1">
                  <div><strong>Project ID:</strong> trah-sosentono</div>
                  <div><strong>Database ID:</strong> (default)</div>
                  <div><strong>Auth Domain:</strong> trah-sosentono.firebaseapp.com</div>
                  <div><strong>Master Admin:</strong> admin@sosentono.ai.studio</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Vercel Deploy */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
              <span>Langkah 3: Deploy ke Vercel (1-Klik Otomatis)</span>
            </div>
            <div className="pl-8 space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>1. Kunjungi <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">vercel.com</a> dan masuk menggunakan akun GitHub Anda.</p>
              <p>2. Klik <strong>Add New &gt; Project</strong> lalu impor repositori yang baru saja Anda push.</p>
              <p>3. Vercel otomatis mendeteksi proyek <strong>Vite + React</strong>. Tidak perlu mengubah Build Command (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">npm run build</code>) atau Output Directory (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">dist</code>).</p>
              <p>4. Klik <strong>Deploy</strong>. Situs silsilah langsung aktif online!</p>
            </div>
          </div>
        </div>
      )
    )}

      {/* Floating Success Notification */}
      {dashboardNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-amber-400 border border-slate-700 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{dashboardNotice}</span>
        </div>
      )}

      {/* Gallery Add / Edit Modal */}
      <GalleryFormModal
        isOpen={isGalleryModalOpen}
        onClose={() => {
          setIsGalleryModalOpen(false);
          setPhotoToEdit(null);
        }}
        photoToEdit={photoToEdit}
        onSave={handleSaveGalleryItem}
      />

      {/* Admin Photo Lightbox Modal */}
      {activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#1b120a] border border-[#C9A84C]/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#25180d] border-b border-[#C9A84C]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C]/20 text-amber-300 border border-[#C9A84C]/40">
                  {activeLightboxPhoto.category}
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  {activeLightboxPhoto.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditPhoto(activeLightboxPhoto);
                    setActiveLightboxPhoto(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Sunting</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLightboxPhoto(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo Viewport */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
              <img
                src={activeLightboxPhoto.imageUrl}
                alt={activeLightboxPhoto.title}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>

            {/* Caption & Footer */}
            <div className="p-5 bg-[#25180d] border-t border-[#C9A84C]/30 space-y-2">
              <h3 className="font-serif-title font-bold text-lg sm:text-xl text-[#F5E6C8]">
                {activeLightboxPhoto.title}
              </h3>
              {activeLightboxPhoto.caption && (
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  {activeLightboxPhoto.caption}
                </p>
              )}
              {activeLightboxPhoto.driveUrl && (
                <div className="pt-1">
                  <a
                    href={activeLightboxPhoto.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C9A84C] hover:underline"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Buka Album Google Drive Asli ↗</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
