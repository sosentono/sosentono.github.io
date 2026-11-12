import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Kabar } from '../../types';

interface KabarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  kabarToEdit?: Kabar | null;
  onSaveKabar: (kabarData: Omit<Kabar, 'id' | 'createdAt'>) => Promise<void>;
}

export const KabarFormModal: React.FC<KabarFormModalProps> = ({
  isOpen,
  onClose,
  kabarToEdit,
  onSaveKabar,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Kabar['category']>('Kegiatan');
  const [author, setAuthor] = useState('');
  const [date, setDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    if (kabarToEdit) {
      setTitle(kabarToEdit.title);
      setCategory(kabarToEdit.category);
      setAuthor(kabarToEdit.author);
      setDate(kabarToEdit.date);
      setImageUrl(kabarToEdit.imageUrl || '');
      setContent(kabarToEdit.content);
    } else {
      setTitle('');
      setCategory('Kegiatan');
      setAuthor('Humas Trah Sosentono');
      setDate(new Date().toISOString().slice(0, 10));
      setImageUrl('');
      setContent('');
    }
  }, [kabarToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !content.trim()) {
      setFormError('Judul dan isi kabar wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveKabar({
        title: title.trim(),
        category,
        author: author.trim() || 'Humas Trah',
        date,
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
              {kabarToEdit ? 'Sunting Kabar' : 'Tulis Kabar Trah Baru'}
            </h3>
            {formError && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {formError}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              Informasi terkini untuk keluarga besar
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
              <label className="block font-medium mb-1 text-slate-700">Kategori Kabar *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Kelahiran">Kelahiran</option>
                <option value="Pernikahan">Pernikahan</option>
                <option value="Kabar Duka">Kabar Duka (Lelayu)</option>
                <option value="Prestasi">Prestasi</option>
                <option value="Undangan">Undangan Khusus</option>
                <option value="Pengumuman">Pengumuman</option>
                <option value="Kegiatan">Kegiatan</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700">Tanggal Warta *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1 text-slate-700">Judul Kabar *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kelahiran Putra Pertama Mas Dimas Aditya"
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1 text-slate-700">Penulis / Pewarta</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Dimas Aditya"
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700">URL Gambar (Opsional)</label>
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
            <label className="block font-medium mb-1 text-slate-700">Isi Berita Lengkap *</label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rincian informasi, doa, ucapan, atau pengumuman..."
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
              <span>{isSubmitting ? 'Menyimpan...' : 'Terbitkan Kabar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
