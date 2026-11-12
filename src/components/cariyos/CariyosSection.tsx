import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Feather,
  Clock,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { Cariyos } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface CariyosSectionProps {
  cariyos: Cariyos[];
  onAddCariyos?: () => void;
  onEditCariyos?: (item: Cariyos) => void;
  onDeleteCariyos?: (id: string) => void;
}

export const CariyosSection: React.FC<CariyosSectionProps> = ({
  cariyos,
  onAddCariyos,
  onEditCariyos,
  onDeleteCariyos,
}) => {
  const { isAdmin } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [readingStory, setReadingStory] = useState<Cariyos | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const categories = [
    'ALL',
    'Leluhur',
    'Sejarah Trah',
    'Migrasi',
    'Tradisi',
    'Pitutur Luhur',
    'Asal-Usul',
    'Foto Lawas',
  ];

  const filteredCariyos = useMemo(() => {
    if (selectedCategory === 'ALL') return cariyos;
    return cariyos.filter(c => c.category === selectedCategory);
  }, [cariyos, selectedCategory]);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Cariyos Trah
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Arsip digital kisah sejarah leluhur, tradisi keluarga, dan piweling pitutur luhur
          </p>
        </div>

        {isAdmin && onAddCariyos && (
          <button
            onClick={onAddCariyos}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Cariyos Baru</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat === 'ALL' ? 'Semua Cariyos' : cat}
          </button>
        ))}
      </div>

      {/* Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCariyos.map(item => (
          <article
            key={item.id}
            onClick={() => setReadingStory(item)}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Unboxed Metadata (Zero-Pill Rule) */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-3">
                <span className="font-semibold text-slate-900">{item.category}</span>
                {item.era && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.era}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-950 leading-snug group-hover:text-slate-700 transition-colors">
                {item.title}
              </h3>

              {/* Snippet */}
              <p className="text-xs sm:text-sm text-slate-600 mt-2.5 line-clamp-4 leading-relaxed font-serif">
                {item.content}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 truncate text-slate-600">
                <Feather className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Penutur: {item.narrator || 'Sesepuh'}</span>
              </div>

              <span className="font-medium text-slate-900 group-hover:translate-x-0.5 transition-transform shrink-0">
                Baca →
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* ================= FULL READER MODAL ================= */}
      {readingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="font-semibold text-slate-900">{readingStory.category}</span>
                {readingStory.era && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">Kurun Waktu: {readingStory.era}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setReadingStory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-4 max-h-[75vh] overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">
                {readingStory.title}
              </h2>

              <div className="text-xs text-slate-500 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Feather className="w-4 h-4 text-slate-400" />
                <span>Dituturkan oleh: <strong className="text-slate-900">{readingStory.narrator || 'Pini Sepuh Trah'}</strong></span>
              </div>

              {readingStory.imageUrl && (
                <div className="rounded-2xl overflow-hidden my-4 border border-slate-200">
                  <img
                    src={readingStory.imageUrl}
                    alt={readingStory.title}
                    className="w-full h-auto max-h-80 object-cover"
                  />
                </div>
              )}

              <div className="text-slate-800 text-base leading-relaxed whitespace-pre-line font-serif space-y-4 pt-2">
                {readingStory.content}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Arsip Digital Trah Sosentono</span>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  {onEditCariyos && (
                    <button
                      onClick={() => {
                        const s = readingStory;
                        setReadingStory(null);
                        onEditCariyos(s);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                    >
                      Sunting
                    </button>
                  )}
                  {onDeleteCariyos && (
                    isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                        <button
                          onClick={() => {
                            onDeleteCariyos(readingStory.id);
                            setIsConfirmingDelete(false);
                            setReadingStory(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700"
                        >
                          Hapus!
                        </button>
                        <button
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-2 py-1.5 rounded-lg text-slate-600 text-xs hover:bg-slate-100"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsConfirmingDelete(true)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600 font-medium"
                      >
                        Hapus
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
