import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  FolderOpen,
  Share2,
  Check,
  Edit,
  Trash2,
  Image as ImageIcon,
  UserCheck,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { Agenda } from '../../types';
import { formatIndonesianDate, format24HourWIB, parseDateBadge, getWeton } from '../../utils/javaneseCalendar';

interface AgendaDetailModalProps {
  agenda: Agenda | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onEdit?: (agenda: Agenda) => void;
  onDelete?: (id: string, title: string) => void;
}

export const AgendaDetailModal: React.FC<AgendaDetailModalProps> = ({
  agenda,
  isOpen,
  onClose,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen || !agenda) return null;

  const { day, month, year } = parseDateBadge(agenda.date);
  const weton = getWeton(agenda.date);
  const formattedDate = formatIndonesianDate(agenda.date, false);

  const displayCategory = agenda.category || (
    agenda.type === 'ARISAN' ? 'Arisan Trah' :
    agenda.type === 'TRAH_BESAR' ? 'Syawalan Trah' :
    'Lain-lain'
  );

  const isCompleted = agenda.status === 'COMPLETED' || new Date(agenda.date) < new Date(new Date().toDateString());

  // Handle Share / Salin Ringkasan Acara
  const handleCopySummary = () => {
    const text = `*${agenda.title}*\n` +
      `📅 Tanggal: ${weton.full}, ${formattedDate}\n` +
      `⏰ Waktu: ${format24HourWIB(agenda.time)}\n` +
      `📍 Lokasi: ${agenda.location}\n` +
      (agenda.hostFamily ? `🏠 Tuan Rumah: ${agenda.hostFamily}\n` : '') +
      (agenda.description ? `\n📝 Ringkasan:\n${agenda.description}\n` : '') +
      (agenda.documentationUrl ? `\n📸 Dokumentasi (Google Drive):\n${agenda.documentationUrl}` : '');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const mapsUrl = agenda.gmapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agenda.location)}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-[#C9A84C]/40 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Dialog */}
          <div className="bg-gradient-to-r from-[#20150b] to-[#342013] text-white p-5 sm:p-6 relative border-b-2 border-[#C9A84C]">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
              title="Tutup Ringkasan"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                displayCategory.includes('Arisan') ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' :
                displayCategory.includes('Syawal') ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' :
                'bg-stone-800 text-stone-300 border-stone-600'
              }`}>
                {displayCategory}
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isCompleted ? 'bg-stone-800 text-stone-300 border border-stone-700' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              }`}>
                {isCompleted ? '✓ Telah Terlaksana' : '⏳ Agenda Mendatang'}
              </span>

              {agenda.hijriYear && (
                <span className="text-[11px] font-serif text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded border border-[#C9A84C]/30">
                  {agenda.hijriYear}
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-serif-title text-[#FAF7F2] leading-snug pr-8">
              {agenda.title}
            </h3>

            {/* Sub-header info Weton & Tanggal */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#E8D4A0]">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <span className="font-semibold text-white">{weton.full}</span>, {formattedDate}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-stone-200">
                <Clock className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                <span>{format24HourWIB(agenda.time)}</span>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-6 max-h-[72vh] overflow-y-auto text-stone-800 text-xs sm:text-sm">
            
            {/* 1. Lokasi & Tuan Rumah */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#C9A84C]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                  <MapPin className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span>Tempat & Tuan Rumah</span>
                </div>
                <div className="font-bold text-stone-900 text-sm sm:text-base">
                  {agenda.location || 'Lokasi Pertemuan Keluarga'}
                </div>
                {agenda.hostFamily && (
                  <div className="text-xs text-stone-600 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Shohibul Bait / Tuan Rumah: <strong className="text-stone-800">{agenda.hostFamily}</strong></span>
                  </div>
                )}
              </div>

              {agenda.location && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-semibold text-xs shadow-2xs transition-colors shrink-0 group"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Buka di Google Maps</span>
                </a>
              )}
            </div>

            {/* 2. Ringkasan Acara & Notula */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                <h4 className="font-serif-title font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                  <span>Ringkasan Acara & Notula Pertemuan</span>
                </h4>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg transition-colors"
                  title="Salin ringkasan ke papan klip untuk WhatsApp"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3 text-stone-500" />
                      <span>Salin Ringkasan</span>
                    </>
                  )}
                </button>
              </div>

              {agenda.description ? (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 leading-relaxed text-stone-700 whitespace-pre-line text-xs sm:text-[13px]">
                  {agenda.description}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-stone-400 italic text-center">
                  Belum ada catatan atau ringkasan acara yang ditulis untuk agenda ini.
                </div>
              )}
            </div>

            {/* 3. Dokumentasi Foto & Akses Google Drive */}
            <div className="space-y-3">
              <div className="border-b border-stone-100 pb-1.5 flex items-center justify-between">
                <h4 className="font-serif-title font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#C9A84C]" />
                  <span>Dokumentasi Foto & Arsip Digital</span>
                </h4>
                <span className="text-[11px] text-stone-500 font-mono">
                  {agenda.documentationUrl ? 'Tersedia di Cloud' : 'Belum Ada Tautan'}
                </span>
              </div>

              {agenda.documentationUrl ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 text-xs sm:text-sm">
                          Folder Dokumentasi Foto & Video Acara
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono truncate max-w-xs sm:max-w-md">
                          {agenda.documentationUrl}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    Seluruh dokumentasi momen silaturahmi, foto keluarga, dan rekaman kegiatan tersimpan rapi di Google Drive Trah. Anggota keluarga dapat melihat dan mengunduh foto beresolusi penuh.
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <a
                      href={agenda.documentationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Buka Folder Google Drive ↗</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(agenda.documentationUrl || '');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2500);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-2xs transition-colors"
                    >
                      {copied ? '✓ Tautan Disalin' : 'Salin Tautan'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-2">
                  <FolderOpen className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs text-stone-500">
                    Tautan Google Drive dokumentasi untuk acara ini belum ditambahkan.
                  </p>
                  {isAdmin && onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(agenda);
                      }}
                      className="text-xs font-bold text-[#C9A84C] hover:underline"
                    >
                      + Tambahkan Link Dokumentasi Sekarang
                    </button>
                  )}
                </div>
              )}

              {/* Tampilan Galeri Foto Langsung (Jika ada daftar URL foto) */}
              {agenda.photoUrls && agenda.photoUrls.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-stone-700">Foto Terpilih ({agenda.photoUrls.length}):</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {agenda.photoUrls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhoto(url)}
                        className="group relative rounded-xl overflow-hidden aspect-4/3 bg-stone-100 border border-stone-200 hover:border-[#C9A84C] transition-all"
                      >
                        <img
                          src={url}
                          alt={`Dokumentasi ${agenda.title} #${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-5 h-5 drop-shadow" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Aksi Admin */}
            {isAdmin && (
              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-stone-500 font-medium">Aksi Pengelola Trah:</span>
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(agenda);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#C9A84C]" />
                      <span>Sunting Agenda & Link Dokumentasi</span>
                    </button>
                  )}

                  {onDelete && (
                    isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                        <span className="text-[11px] font-bold text-rose-700 px-1.5">Hapus agenda ini?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(agenda.id, agenda.title);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-2 py-1 rounded-lg text-stone-600 text-xs hover:bg-stone-100"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 border border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#20150b] text-[#C9A84C] hover:bg-[#322013] text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>

      {/* Lightbox Modal untuk Preview Foto Full Size */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto}
            alt="Dokumentasi Full Size"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
          />
        </div>
      )}
    </>
  );
};
