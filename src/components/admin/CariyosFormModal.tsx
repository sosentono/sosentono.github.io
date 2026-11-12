import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Cariyos } from '../../types';

interface CariyosFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cariyosToEdit?: Cariyos | null;
  onSaveCariyos: (cariyosData: Omit<Cariyos, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const CariyosFormModal: React.FC<CariyosFormModalProps> = ({
  isOpen,
  onClose,
  cariyosToEdit,
  onSaveCariyos,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Cariyos['category']>('Leluhur');
  const [era, setEra] = useState('');
  const [narrator, setNarrator] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    if (cariyosToEdit) {
      setTitle(cariyosToEdit.title);
      setCategory(cariyosToEdit.category);
      setEra(cariyosToEdit.era || '');
      setNarrator(cariyosToEdit.narrator || '');
      setImageUrl(cariyosToEdit.imageUrl || '');
      setContent(cariyosToEdit.content);
    } else {
      setTitle('');
      setCategory('Leluhur');
      setEra('');
      setNarrator('');
      setImageUrl('');
      setContent('');
    }
  }, [cariyosToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !content.trim()) {
      setFormError('Judul dan naskah cerita wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveCariyos({
        title: title.trim(),
        category,
        era: era.trim() || undefined,
        narrator: narrator.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        content: content.trim(),
      });
      onClose();
    } catch (err: any) {
      setFormError('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-950">
              {cariyosToEdit ? 'Sunting Cariyos' : 'Tambah Cariyos Baru'}
            </h3>
            {formError && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {formError}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              Dokumentasi sejarah leluhur dan piweling keluarga
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 text-xs sm:text-sm max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1 text-slate-700">Kategori Cariyos</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Leluhur">Leluhur (Kisah Mbah Wiwitan)</option>
                <option value="Sejarah Trah">Sejarah Trah</option>
                <option value="Migrasi">Migrasi / Rantau</option>
                <option value="Tradisi">Tradisi Keluarga</option>
                <option value="Pitutur Luhur">Pitutur Luhur & Falsafah</option>
                <option value="Asal-Usul">Asal-Usul</option>
                <option value="Foto Lawas">Foto Lawas & Dokumentasi</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700">Kurun Waktu / Era</label>
              <input
                type="text"
                value={era}
                onChange={(e) => setEra(e.target.value)}
                placeholder="Contoh: 1940-1970an"
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1 text-slate-700">Judul Cariyos *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Babad Asal-Usul Eyang Wiwitan"
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1 text-slate-700">Penutur Asli</label>
              <input
                type="text"
                value={narrator}
                onChange={(e) => setNarrator(e.target.value)}
                placeholder="Eyang Raharjo (Alm)"
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700">URL Gambar / Foto</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1 text-slate-700">Naskah Cerita Lengkap *</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan kisah sejarah lengkap, petuah, atau catatan berharga..."
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-serif leading-relaxed focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Cariyos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
