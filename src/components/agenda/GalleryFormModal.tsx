import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Link as LinkIcon, Calendar, Tag, FolderOpen, Save, AlertCircle, Sparkles } from 'lucide-react';
import { GalleryItem } from '../../types';

interface GalleryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoToEdit?: GalleryItem | null;
  onSave: (data: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  'Syawalan Trah',
  'Arisan Trah',
  'Ziarah Leluhur',
  'Rembug Pengurus',
  'Lain-lain',
];

const PRESET_PHOTOS = [
  {
    name: 'Syawalan Akbar',
    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Pertemuan Pendopo',
    url: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Ziarah & Doa Bersama',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Generasi Muda Trah',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop',
  },
];

export const GalleryFormModal: React.FC<GalleryFormModalProps> = ({
  isOpen,
  onClose,
  photoToEdit,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Syawalan Trah');
  const [date, setDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (photoToEdit) {
      setTitle(photoToEdit.title || '');
      setCategory(photoToEdit.category || 'Syawalan Trah');
      setDate(photoToEdit.date || '');
      setImageUrl(photoToEdit.imageUrl || '');
      setDriveUrl(photoToEdit.driveUrl || '');
      setCaption(photoToEdit.caption || '');
    } else {
      setTitle('');
      setCategory('Syawalan Trah');
      setDate('1447 H / 2026');
      setImageUrl('');
      setDriveUrl('');
      setCaption('');
    }
    setErrorMessage(null);
    setImageLoadError(false);
  }, [photoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Judul dokumentasi foto wajib diisi.');
      return;
    }

    if (!imageUrl.trim()) {
      setErrorMessage('URL Foto / Gambar wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        category: category.trim() || 'Lain-lain',
        date: date.trim() || 'Momentum Trah',
        imageUrl: imageUrl.trim(),
        driveUrl: driveUrl.trim() || undefined,
        caption: caption.trim() || '',
      });
      onClose();
    } catch (err: any) {
      console.error('Error saving gallery item:', err);
      setErrorMessage(err.message || 'Gagal menyimpan foto dokumentasi ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-[#C9A84C]/35 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#C9A84C]/25 bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#20150b] text-[#C9A84C] flex items-center justify-center shrink-0 shadow-2xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-lg sm:text-xl text-[#20150b]">
                {photoToEdit ? 'Sunting Foto Dokumentasi' : 'Tambah Foto Dokumentasi Trah'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {photoToEdit ? 'Perbarui informasi dan tautan foto dokumentasi' : 'Dokumentasikan momentum silaturahmi & kegiatan keluarga'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Judul Foto */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Judul Dokumentasi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Silaturahmi Syawalan Akbar Trah 1447 H"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] bg-[#FAF7F2]/40"
            />
          </div>

          {/* Kategori & Tanggal/Momentum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span>Kategori Kegiatan</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C] bg-[#FAF7F2]/40"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span>Waktu / Tanggal / Momentum</span>
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Contoh: Syawal 1447 H / 2026 atau Minggu Pon"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C] bg-[#FAF7F2]/40"
              />
            </div>
          </div>

          {/* URL Gambar */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span>URL Foto / Gambar <span className="text-red-500">*</span></span>
            </label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageLoadError(false);
              }}
              placeholder="https://images.unsplash.com/... atau tautan file foto langsung"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C] bg-[#FAF7F2]/40"
            />

            {/* Presets / Contoh Cepat */}
            <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-stone-500">
              <Sparkles className="w-3 h-3 text-[#C9A84C] shrink-0" />
              <span className="shrink-0 font-medium">Contoh Cepat:</span>
              {PRESET_PHOTOS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => {
                    setImageUrl(p.url);
                    setImageLoadError(false);
                  }}
                  className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 whitespace-nowrap text-[10px] transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Image Preview */}
          {imageUrl.trim() && (
            <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-100 relative">
              <div className="aspect-16/9 w-full overflow-hidden bg-stone-100 flex items-center justify-center">
                {imageLoadError ? (
                  <div className="p-4 text-center text-xs text-rose-500 flex flex-col items-center gap-1">
                    <AlertCircle className="w-5 h-5" />
                    <span>Gambar tidak dapat dimuat dari tautan tersebut. Pastikan URL mengarah ke file gambar langsung.</span>
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt="Pratinjau Foto"
                    onError={() => setImageLoadError(true)}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium backdrop-blur-xs">
                Pratinjau Foto
              </div>
            </div>
          )}

          {/* Tautan Album Google Drive (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span>Tautan Album Google Drive (Opsional)</span>
            </label>
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/... (folder foto lengkap)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C] bg-[#FAF7F2]/40"
            />
          </div>

          {/* Keterangan / Cerita Momen */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Keterangan / Cerita Singkat Momen
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ceritakan suasana pertemuan, lokasi acara, atau anggota keluarga yang hadir..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C] bg-[#FAF7F2]/40 resize-none"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#20150b] hover:bg-[#322013] text-[#C9A84C] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : (photoToEdit ? 'Simpan Perubahan' : 'Tambahkan Foto')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
