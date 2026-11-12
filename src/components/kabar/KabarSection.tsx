import React, { useState, useMemo } from 'react';
import {
  Calendar,
  User,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Kabar } from '../../types';
import { formatIndonesianDate } from '../../utils/javaneseCalendar';
import { useAuth } from '../../context/AuthContext';

interface KabarSectionProps {
  kabar: Kabar[];
  onAddKabar?: () => void;
  onEditKabar?: (item: Kabar) => void;
  onDeleteKabar?: (id: string) => void;
}

export const KabarSection: React.FC<KabarSectionProps> = ({
  kabar,
  onAddKabar,
  onEditKabar,
  onDeleteKabar,
}) => {
  const { isAdmin } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    'ALL',
    'Kelahiran',
    'Pernikahan',
    'Kabar Duka',
    'Prestasi',
    'Undangan',
    'Pengumuman',
    'Kegiatan',
  ];

  const filteredKabar = useMemo(() => {
    if (selectedCategory === 'ALL') return kabar;
    return kabar.filter(k => k.category === selectedCategory);
  }, [kabar, selectedCategory]);

  return (
    <div className="space-y-4">
      
      {/* Top Bar with category filter tabs and Add button */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#C9A84C]/25 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap rounded ${
                  isActive
                    ? 'bg-[#20150b] text-[#C9A84C] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2]'
                }`}
              >
                {cat === 'ALL' ? 'Semua Warta' : cat}
              </button>
            );
          })}
        </div>

        {isAdmin && onAddKabar && (
          <button
            onClick={onAddKabar}
            className="px-3.5 py-1.5 rounded bg-[#20150b] hover:bg-[#322013] text-[#C9A84C] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tulis Kabar</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-[#C9A84C]/20 text-xs text-stone-600">
          <span>🔒</span>
          <span>Hanya akun admin terverifikasi yang dapat menambah atau mengelola warta kabar keluarga.</span>
        </div>
      )}

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredKabar.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-5 border border-[#C9A84C]/25 shadow-xs hover:border-[#C9A84C]/60 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              {/* Category & Date */}
              <div className="flex items-center justify-between gap-2 mb-2 text-xs text-stone-500 font-medium">
                <span className="text-[#A0785A] font-bold uppercase tracking-wider text-[11px]">
                  {item.category}
                </span>
                <span className="font-mono text-[11px]">
                  {formatIndonesianDate(item.date, false)}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-serif-title text-base sm:text-lg font-bold text-stone-900 leading-snug">
                {item.title}
              </h3>

              {/* Image if available */}
              {item.imageUrl && (
                <div className="my-3 rounded-lg overflow-hidden max-h-48 border border-stone-200">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <p className="text-xs sm:text-sm text-stone-700 mt-2 leading-relaxed whitespace-pre-line">
                {item.content}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
              <div className="flex items-center gap-1.5 text-stone-600">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>Oleh <strong className="text-stone-900 font-medium">{item.author}</strong></span>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1">
                  {onEditKabar && (
                    <button
                      onClick={() => onEditKabar(item)}
                      className="p-1 rounded hover:bg-stone-100 text-stone-600"
                      title="Sunting"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteKabar && (
                    <button
                      onClick={() => onDeleteKabar(item.id)}
                      className="p-1 rounded hover:bg-rose-50 text-rose-500"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredKabar.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-xl border border-[#C9A84C]/20 text-center text-stone-500 text-xs">
            Belum ada warta untuk kategori ini.
          </div>
        )}
      </div>

    </div>
  );
};
