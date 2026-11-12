import React from 'react';
import { MapPin, Clock, ExternalLink, Trash2, Edit } from 'lucide-react';
import { Agenda } from '../../types';
import { format24HourWIB, parseDateBadge } from '../../utils/javaneseCalendar';

interface AgendaCardProps {
  agenda: Agenda;
  isAdmin?: boolean;
  onSelect?: (agenda: Agenda) => void;
  onEdit?: (agenda: Agenda) => void;
  onDelete?: (id: string, title: string) => void;
}

export const AgendaCard: React.FC<AgendaCardProps> = ({
  agenda,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { day, month, year } = parseDateBadge(agenda.date);
  const displayCategory = agenda.category || (
    agenda.type === 'ARISAN' ? 'Arisan Trah' :
    agenda.type === 'TRAH_BESAR' ? 'Syawalan Trah' :
    'Lain-lain'
  );

  const getCategoryBadgeClass = (cat: string) => {
    if (cat.includes('Arisan')) return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (cat.includes('Syawal')) return 'bg-amber-50 text-amber-900 border-amber-300';
    return 'bg-stone-100 text-stone-700 border-stone-200';
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(agenda);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        onSelect ? 'cursor-pointer hover:border-[#C9A84C] hover:shadow-md group/card' : ''
      }`}
    >
      {/* Sisi Kiri: Badge Tanggal Hitam Persegi (Persis Screenshot) */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="bg-[#20150b] text-white rounded-2xl p-2.5 sm:p-3 min-w-[65px] sm:min-w-[72px] text-center shrink-0 flex flex-col items-center justify-center shadow-xs">
          <span className="text-2xl sm:text-3xl font-black leading-none text-white font-mono">
            {day}
          </span>
          <span className="text-[11px] font-bold text-[#C9A84C] tracking-wider uppercase mt-1">
            {month}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            {year}
          </span>
        </div>

        {/* Tengah: Konten Detail Agenda */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <h4 className="font-serif-title font-bold text-base sm:text-lg text-stone-900 leading-snug">
            {agenda.title}
          </h4>

          {agenda.description && (
            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {agenda.description}
            </p>
          )}

          {/* Link Dokumentasi (Google Drive / Foto) */}
          {agenda.documentationUrl && (
            <div className="pt-0.5">
              <a
                href={agenda.documentationUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-mono truncate max-w-md group"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{agenda.documentationUrl}</span>
              </a>
            </div>
          )}

          {/* Badges Bawah: Kategori, Lokasi, Waktu */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getCategoryBadgeClass(displayCategory)}`}>
              {displayCategory.toUpperCase()}
            </span>

            {agenda.location && (
              <span className="text-stone-600 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                <span>{agenda.location}</span>
              </span>
            )}

            {agenda.time && (
              <span className="text-stone-600 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                <span>{format24HourWIB(agenda.time)}</span>
              </span>
            )}

            {onSelect && (
              <span className="text-[11px] font-bold text-[#C9A84C] group-hover/card:translate-x-0.5 transition-transform hidden sm:inline-flex items-center gap-0.5 ml-auto">
                <span>Lihat Ringkasan & Dokumentasi</span>
                <span>→</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Tombol Aksi (Sunting & Hapus) - Hanya muncul jika login Admin / Master Admin */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {isAdmin && onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(agenda);
            }}
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-[#C9A84C] text-stone-700 hover:text-stone-950 hover:bg-stone-50 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs group"
            title="Sunting Perubahan Agenda"
          >
            <Edit className="w-3.5 h-3.5 text-[#C9A84C] group-hover:scale-110 transition-transform" />
            <span>Edit</span>
          </button>
        )}

        {isAdmin && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(agenda.id, agenda.title);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1"
            title="Hapus Agenda Langsung"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        )}
      </div>
    </div>
  );
};
