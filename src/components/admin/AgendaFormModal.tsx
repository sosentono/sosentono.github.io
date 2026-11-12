import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Clock, Check, Plus, Minus, Sparkles, Sun, Moon, Coffee } from 'lucide-react';
import { Agenda, AgendaType } from '../../types';

interface AgendaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendaToEdit?: Agenda | null;
  onSaveAgenda: (agendaData: Omit<Agenda, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

// Jam dari pagi hingga malam (Format 24 Jam)
const HOURS = [
  '06', '07', '08', '09', '10', '11', '12',
  '13', '14', '15', '16', '17', '18', '19',
  '20', '21', '22', '23'
];

// Menit standar pertemuan keluarga
const MINUTES = ['00', '15', '30', '45'];

// Pilihan Cepat (1-Klik untuk Orang Tua)
const PRESETS = [
  {
    label: 'Arisan Minggu Pon',
    icon: '☀️',
    badge: 'Paling Sering',
    timeStr: '09:30 - 13:00 WIB',
    sh: '09', sm: '30', eh: '13', em: '00', mode: 'TIME' as const
  },
  {
    label: 'Pagi Hari',
    icon: '🌅',
    badge: 'Silaturahmi',
    timeStr: '08:00 - 11:30 WIB',
    sh: '08', sm: '00', eh: '11', em: '30', mode: 'TIME' as const
  },
  {
    label: 'Siang s/d Selesai',
    icon: '☕',
    badge: 'Fleksibel',
    timeStr: '09:30 WIB - Selesai',
    sh: '09', sm: '30', eh: '13', em: '00', mode: 'SELESAI' as const
  },
  {
    label: 'Sore Hari',
    icon: '🌇',
    badge: 'Pertemuan Santai',
    timeStr: '13:30 - 16:30 WIB',
    sh: '13', sm: '30', eh: '16', em: '30', mode: 'TIME' as const
  },
  {
    label: 'Malam Hari',
    icon: '🌙',
    badge: 'Yasinan/Rembug',
    timeStr: '19:30 - 22:00 WIB',
    sh: '19', sm: '30', eh: '22', em: '00', mode: 'TIME' as const
  },
  {
    label: 'Syawalan Trah',
    icon: '✨',
    badge: 'Halal Bihalal',
    timeStr: '09:00 - 14:00 WIB',
    sh: '09', sm: '00', eh: '14', em: '00', mode: 'TIME' as const
  },
];

function parseTimeString(timeStr?: string) {
  if (!timeStr) {
    return { startHour: '09', startMinute: '30', endMode: 'TIME' as const, endHour: '13', endMinute: '00' };
  }
  const clean = timeStr.replace(/\s*WIB/gi, '').trim();
  const isSelesai = /selesai/i.test(clean);

  // Match range: "HH:MM - HH:MM" or "HH.MM - HH.MM"
  const rangeMatch = clean.match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
  if (rangeMatch) {
    return {
      startHour: rangeMatch[1].padStart(2, '0'),
      startMinute: rangeMatch[2],
      endMode: 'TIME' as const,
      endHour: rangeMatch[3].padStart(2, '0'),
      endMinute: rangeMatch[4],
    };
  }

  // Single time: "HH:MM"
  const singleMatch = clean.match(/(\d{1,2})[:.](\d{2})/);
  if (singleMatch) {
    return {
      startHour: singleMatch[1].padStart(2, '0'),
      startMinute: singleMatch[2],
      endMode: isSelesai ? ('SELESAI' as const) : ('TIME' as const),
      endHour: '13',
      endMinute: '00',
    };
  }

  return { startHour: '09', startMinute: '30', endMode: 'TIME' as const, endHour: '13', endMinute: '00' };
}

export const AgendaFormModal: React.FC<AgendaFormModalProps> = ({
  isOpen,
  onClose,
  agendaToEdit,
  onSaveAgenda,
}) => {
  const [type, setType] = useState<AgendaType>('ARISAN');
  const [category, setCategory] = useState<'Arisan Trah' | 'Syawalan Trah' | 'Lain-lain'>('Arisan Trah');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [hostFamily, setHostFamily] = useState('');
  const [description, setDescription] = useState('');
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('');
  const [photoUrlsText, setPhotoUrlsText] = useState('');
  const [hijriYear, setHijriYear] = useState('');
  const [theme, setTheme] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [status, setStatus] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State angka jam - RAMAH ORANG TUA (Murni klik & sentuh angka, tanpa ketik keyboard!)
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('30');
  const [endMode, setEndMode] = useState<'TIME' | 'SELESAI'>('TIME');
  const [endHour, setEndHour] = useState('13');
  const [endMinute, setEndMinute] = useState('00');

  useEffect(() => {
    setFormError(null);
    if (agendaToEdit) {
      setType(agendaToEdit.type);
      const cat = (agendaToEdit.category as any) || (
        agendaToEdit.type === 'ARISAN' ? 'Arisan Trah' :
        agendaToEdit.type === 'TRAH_BESAR' ? 'Syawalan Trah' :
        'Lain-lain'
      );
      setCategory(cat);
      setTitle(agendaToEdit.title);
      setDate(agendaToEdit.date);
      setLocation(agendaToEdit.location);
      setHostFamily(agendaToEdit.hostFamily || '');
      setDescription(agendaToEdit.description || '');
      setGmapsUrl(agendaToEdit.gmapsUrl || '');
      setDocumentationUrl(agendaToEdit.documentationUrl || '');
      setPhotoUrlsText(agendaToEdit.photoUrls ? agendaToEdit.photoUrls.join('\n') : '');
      setHijriYear(agendaToEdit.hijriYear || '');
      setTheme(agendaToEdit.theme || '');
      setContactPerson(agendaToEdit.contactPerson || '');
      setStatus(agendaToEdit.status || 'UPCOMING');

      const parsed = parseTimeString(agendaToEdit.time);
      setStartHour(parsed.startHour);
      setStartMinute(parsed.startMinute);
      setEndMode(parsed.endMode);
      setEndHour(parsed.endHour);
      setEndMinute(parsed.endMinute);
    } else {
      setType('ARISAN');
      setCategory('Arisan Trah');
      setTitle('Arisan Selapanan Minggu Pon');
      setDate(new Date().toISOString().slice(0, 10));
      setLocation('');
      setHostFamily('');
      setDescription('');
      setGmapsUrl('');
      setDocumentationUrl('');
      setPhotoUrlsText('');
      setHijriYear('');
      setTheme('');
      setContactPerson('');
      setStatus('UPCOMING');

      // Standar default pertemuan Arisan Pon
      setStartHour('09');
      setStartMinute('30');
      setEndMode('TIME');
      setEndHour('13');
      setEndMinute('00');
    }
  }, [agendaToEdit, isOpen]);

  // Format 24 Jam WIB yang rapi dan standar
  const computedTime = useMemo(() => {
    if (endMode === 'SELESAI') {
      return `${startHour}:${startMinute} WIB - Selesai`;
    }
    return `${startHour}:${startMinute} - ${endHour}:${endMinute} WIB`;
  }, [startHour, startMinute, endMode, endHour, endMinute]);

  // Stepper helper functions untuk orang tua
  const adjustHour = (current: string, delta: number): string => {
    let val = parseInt(current, 10) + delta;
    if (val < 6) val = 23;
    if (val > 23) val = 6;
    return val.toString().padStart(2, '0');
  };

  const adjustMinute = (current: string, delta: number): string => {
    const mins = ['00', '15', '30', '45'];
    const idx = mins.indexOf(current);
    if (idx === -1) return '00';
    let nextIdx = (idx + delta) % mins.length;
    if (nextIdx < 0) nextIdx += mins.length;
    return mins[nextIdx];
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !date) {
      setFormError('Judul dan tanggal acara wajib diisi');
      return;
    }

    const photoUrls = photoUrlsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    setIsSubmitting(true);
    try {
      await onSaveAgenda({
        type,
        category,
        title: title.trim(),
        date,
        time: computedTime,
        location: location.trim() || 'Lokasi Pertemuan',
        hostFamily: hostFamily.trim() || undefined,
        description: description.trim() || undefined,
        gmapsUrl: gmapsUrl.trim() || undefined,
        documentationUrl: documentationUrl.trim() || undefined,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
        hijriYear: hijriYear.trim() || undefined,
        theme: theme.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setFormError('Gagal menyimpan agenda ke Firebase: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-4 sm:my-6">
        
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-[#FAF7F2]">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20150b] font-serif-title">
              {agendaToEdit ? 'Sunting Agenda Pertemuan' : 'Tambah Agenda Baru'}
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Jadwal arisan selapanan Minggu Pon, syawalan trah, atau kegiatan keluarga lainnya
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Isi */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-slate-800 text-xs sm:text-sm max-h-[78vh] overflow-y-auto">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError(null)} className="text-rose-500 hover:text-rose-800 text-xs font-bold">Tutup</button>
            </div>
          )}
          
          {/* Baris Kategori Acara & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Kategori Agenda *</label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as 'Arisan Trah' | 'Syawalan Trah' | 'Lain-lain';
                  setCategory(val);
                  if (val === 'Arisan Trah') setType('ARISAN');
                  else if (val === 'Syawalan Trah') setType('TRAH_BESAR');
                  else setType('OTHER');
                }}
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              >
                <option value="Arisan Trah">Arisan Trah (Minggu Pon)</option>
                <option value="Syawalan Trah">Syawalan Trah (Tahunan)</option>
                <option value="Lain-lain">Lain-lain (Silaturahmi, Ziarah)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Status Pelaksanaan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              >
                <option value="UPCOMING">Akan Datang</option>
                <option value="COMPLETED">Selesai Terlaksana</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>
          </div>

          {/* Judul & Tanggal */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Judul Agenda *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Arisan Minggu Pon Putaran #48"
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700">Tanggal Pelaksanaan *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
          </div>

          {/* ========================================================================= */}
          {/* PANEL WAKTU RAMAH ORANG TUA: MURNI KLIK ANGKA (TIDAK BISA DIKETIK MANUAL) */}
          {/* ========================================================================= */}
          <div className="rounded-2xl bg-linear-to-b from-amber-50 to-orange-50/40 border-2 border-amber-300 p-4 sm:p-5 space-y-4 shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
              <div>
                <label className="font-bold text-amber-950 flex items-center gap-1.5 text-sm sm:text-base">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Waktu Pelaksanaan (Format 24 Jam WIB)</span>
                </label>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  Ramah orang tua: <strong>Tinggal sentuh/klik angka</strong> di bawah ini, tidak perlu mengetik manual.
                </p>
              </div>
              <span className="self-start sm:self-auto text-[10px] bg-amber-200 text-amber-950 font-extrabold px-2.5 py-1 rounded-full border border-amber-300 uppercase tracking-wider">
                Sentuh Angka Saja
              </span>
            </div>

            {/* 1. KOTAK HASIL AKHIR TERPILIH (BESAR & SANGAT JELAS DIBACA) */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-400 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                    Jam Acara Terjadwal:
                  </span>
                  <span className="font-mono font-black text-base sm:text-lg text-amber-950">
                    {computedTime}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-800 bg-emerald-100 font-bold px-3 py-1 rounded-full border border-emerald-300">
                WIB (24 Jam)
              </span>
            </div>

            {/* 2. PILIHAN CEPAT 1-SENTUHAN (PALING PRAKTIS UNTUK ORANG TUA) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pilihan Cepat Waktu Pertemuan:</span>
                </span>
                <span className="text-[10px] text-amber-700 font-medium">1x klik langsung terisi</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESETS.map((p) => {
                  const isSelected =
                    startHour === p.sh &&
                    startMinute === p.sm &&
                    (p.mode === 'SELESAI' ? endMode === 'SELESAI' : endHour === p.eh && endMinute === p.em && endMode === 'TIME');

                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setStartHour(p.sh);
                        setStartMinute(p.sm);
                        setEndHour(p.eh);
                        setEndMinute(p.em);
                        setEndMode(p.mode);
                      }}
                      className={`p-2.5 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-200 border-amber-600 text-amber-950 font-bold shadow-xs ring-2 ring-amber-400 scale-[1.01]'
                          : 'bg-white hover:bg-amber-100/70 border-amber-200/90 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-stone-900 flex items-center gap-1">
                          <span>{p.icon}</span>
                          <span className="truncate">{p.label}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-800 shrink-0" />}
                      </div>
                      <div className="text-[11px] font-mono font-extrabold text-amber-900 mt-1">
                        {p.timeStr}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. PEMILIHAN ANGKA BEBAS DENGAN TOMBOL BESAR (+ / -) DAN TOMBOL ANGKA */}
            <div className="pt-2 border-t border-amber-200/80 space-y-3">
              <span className="text-xs font-bold text-amber-950 block">
                Atau sesuaikan angka jam secara mandiri:
              </span>

              {/* JAM MULAI */}
              <div className="bg-white p-3.5 rounded-2xl border border-amber-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Jam Mulai Acara:</span>
                  </span>
                  <div className="font-mono text-base font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    Pukul {startHour}:{startMinute} WIB
                  </div>
                </div>

                {/* Stepper Besar (Tambah / Kurang) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  
                  {/* Stepper Jam */}
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex flex-col items-center">
                    <span className="text-[10px] text-stone-500 font-bold uppercase mb-1">Angka Jam</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStartHour(adjustHour(startHour, -1))}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                        title="Kurangi 1 Jam"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-xl font-black text-stone-900 w-10 text-center">
                        {startHour}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStartHour(adjustHour(startHour, 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                        title="Tambah 1 Jam"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stepper Menit */}
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex flex-col items-center">
                    <span className="text-[10px] text-stone-500 font-bold uppercase mb-1">Angka Menit</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStartMinute(adjustMinute(startMinute, -1))}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                        title="Kurangi Menit"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-xl font-black text-stone-900 w-10 text-center">
                        {startMinute}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStartMinute(adjustMinute(startMinute, 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                        title="Tambah Menit"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tombol Angka Cepat Jam Mulai */}
                <div className="pt-1">
                  <span className="text-[10px] text-stone-500 font-bold block mb-1">Pilih Angka Jam Langsung:</span>
                  <div className="flex flex-wrap gap-1">
                    {['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setStartHour(h)}
                        className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                          startHour === h
                            ? 'bg-amber-600 border-amber-700 text-white shadow-2xs scale-105'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tombol Menit */}
                <div className="pt-0.5">
                  <span className="text-[10px] text-stone-500 font-bold block mb-1">Pilih Menit:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MINUTES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setStartMinute(m)}
                        className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                          startMinute === m
                            ? 'bg-amber-600 border-amber-700 text-white shadow-2xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        :{m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* JAM SELESAI ATAU SAMPAI SELESAI */}
              <div className="bg-white p-3.5 rounded-2xl border border-amber-200/90 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span>Jam Selesai Acara:</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEndMode('TIME')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        endMode === 'TIME'
                          ? 'bg-amber-700 border-amber-800 text-white shadow-2xs'
                          : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Pilih Jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndMode('SELESAI')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        endMode === 'SELESAI'
                          ? 'bg-amber-700 border-amber-800 text-white shadow-2xs'
                          : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Sampai Selesai
                    </button>
                  </div>
                </div>

                {endMode === 'TIME' ? (
                  <>
                    {/* Stepper Besar Jam Selesai */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      
                      {/* Stepper Jam */}
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex flex-col items-center">
                        <span className="text-[10px] text-stone-500 font-bold uppercase mb-1">Angka Jam Selesai</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEndHour(adjustHour(endHour, -1))}
                            className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                            title="Kurangi 1 Jam"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-xl font-black text-stone-900 w-10 text-center">
                            {endHour}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEndHour(adjustHour(endHour, 1))}
                            className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                            title="Tambah 1 Jam"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Stepper Menit */}
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex flex-col items-center">
                        <span className="text-[10px] text-stone-500 font-bold uppercase mb-1">Angka Menit Selesai</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEndMinute(adjustMinute(endMinute, -1))}
                            className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                            title="Kurangi Menit"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-xl font-black text-stone-900 w-10 text-center">
                            {endMinute}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEndMinute(adjustMinute(endMinute, 1))}
                            className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                            title="Tambah Menit"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Angka Cepat Jam Selesai */}
                    <div className="pt-1">
                      <span className="text-[10px] text-stone-500 font-bold block mb-1">Pilih Angka Jam Selesai:</span>
                      <div className="flex flex-wrap gap-1">
                        {['10', '11', '12', '13', '14', '15', '16', '17', '18', '20', '21', '22'].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setEndHour(h)}
                            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                              endHour === h
                                ? 'bg-amber-600 border-amber-700 text-white shadow-2xs scale-105'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tombol Menit Selesai */}
                    <div className="pt-0.5">
                      <span className="text-[10px] text-stone-500 font-bold block mb-1">Pilih Menit Selesai:</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {MINUTES.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setEndMinute(m)}
                            className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                              endMinute === m
                                ? 'bg-amber-600 border-amber-700 text-white shadow-2xs'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            :{m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-950 font-medium">
                    <span>✨ Acara berlangsung tanpa batas jam tetap (<strong>Sampai Selesai</strong>)</span>
                    <button
                      type="button"
                      onClick={() => setEndMode('TIME')}
                      className="text-amber-800 font-bold underline hover:text-amber-950 ml-2"
                    >
                      Ubah ke Jam Pasti
                    </button>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Opsi Khusus Trah Akbar Syawal */}
          {type === 'TRAH_BESAR' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Tahun Hijriyah</label>
                <input
                  type="text"
                  value={hijriYear}
                  onChange={(e) => setHijriYear(e.target.value)}
                  placeholder="Contoh: 1448 H"
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Tema Pertemuan Syawal</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Contoh: Ngumpulke Balung Pisah"
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                />
              </div>
            </div>
          )}

          {/* Lokasi Pertemuan */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Lokasi Pertemuan</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Dalem Bp. Raharjo, Sleman, Yogyakarta"
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
          </div>

          {/* Tuan Rumah & Narahubung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Tuan Rumah</label>
              <input
                type="text"
                value={hostFamily}
                onChange={(e) => setHostFamily(e.target.value)}
                placeholder="Contoh: Keluarga Bp. Dimas Aditya"
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Narahubung / Kontak WA</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contoh: Mas Dimas (0812-3456-7890)"
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              />
            </div>
          </div>

          {/* Tautan Google Maps */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Tautan Google Maps Lokasi</label>
            <input
              type="url"
              value={gmapsUrl}
              onChange={(e) => setGmapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
          </div>

          {/* Keterangan / Catatan Tambahan / Ringkasan Acara */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Ringkasan Acara & Notula Pertemuan</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ringkasan jalannya acara, pembahasan silaturahmi, penerima arisan berikutnya, notula musyawarah keluarga..."
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
          </div>

          {/* Link Dokumentasi Google Drive / Cloud */}
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2">
            <div>
              <label className="block font-semibold mb-1 text-blue-950 flex items-center justify-between">
                <span>Link Dokumentasi (Google Drive / Foto Acara)</span>
                <span className="text-[10px] text-blue-700 font-normal">Disarankan Google Drive Folder</span>
              </label>
              <input
                type="url"
                value={documentationUrl}
                onChange={(e) => setDocumentationUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full border border-blue-200 rounded-xl p-2.5 bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-blue-800/80 mt-1">
                Tautkan link folder Google Drive dokumentasi foto & video. Anggota keluarga dapat langsung membuka dan mengunduh foto dari agenda ini.
              </p>
            </div>

            {/* Foto Langsung (Opsional) */}
            <div className="pt-2 border-t border-blue-100">
              <label className="block font-semibold mb-1 text-slate-700 text-xs">
                Tautan Foto Langsung (Opsional, pisahkan dengan baris baru untuk preview galeri)
              </label>
              <textarea
                rows={2}
                value={photoUrlsText}
                onChange={(e) => setPhotoUrlsText(e.target.value)}
                placeholder="https://images.unsplash.com/...&#10;https://..."
                className="w-full border border-slate-200 rounded-xl p-2 bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              />
            </div>
          </div>

          {/* Tombol Aksi Bawah */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#20150b] hover:bg-[#322013] text-[#C9A84C] font-bold shadow-xs flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
