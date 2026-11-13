import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  MapPin,
  Clock,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { Agenda } from '../../types';
import {
  fetchJawaCalendarMonth,
  JawaDayData,
  BULAN_JAWA_12,
  DINO_7,
  format24HourWIB,
} from '../../utils/jawaApiService';

interface MiniKalenderJawaProps {
  agendas: Agenda[];
  onSelectAgenda?: (agenda: Agenda) => void;
  className?: string;
}

const SHORT_MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const FULL_MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MiniKalenderJawa: React.FC<MiniKalenderJawaProps> = ({
  agendas,
  className = '',
}) => {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [monthData, setMonthData] = useState<JawaDayData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<JawaDayData | null>(null);

  // Load calendar month from API (https://tanggalanjawa.com/api)
  const loadMonthData = async (y: number, m: number) => {
    setLoading(true);
    try {
      const data = await fetchJawaCalendarMonth(y, m);
      setMonthData(data);
    } catch (err) {
      console.error('Error fetching Jawa calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthData(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleTodayMonth = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Map agendas by date YYYY-MM-DD
  const agendasByDate = useMemo(() => {
    const map = new Map<string, Agenda[]>();
    for (const a of agendas) {
      if (a.date) {
        const existing = map.get(a.date) || [];
        existing.push(a);
        map.set(a.date, existing);
      }
    }
    return map;
  }, [agendas]);

  // Calendar grid alignment: first day weekday index (0 = Minggu, 1 = Senin, ... 6 = Sabtu)
  const firstDayOfMonthWeekday = useMemo(() => {
    const firstDate = new Date(currentYear, currentMonth - 1, 1);
    return firstDate.getDay();
  }, [currentYear, currentMonth]);

  // Summary info of the Javanese Month currently viewed
  const sampleDay = monthData[15] || monthData[0];
  const jawaMonthName = sampleDay?.jawa?.monthName || BULAN_JAWA_12[(currentMonth - 1) % 12];
  const jawaYear = sampleDay?.jawa?.year || currentYear - 67;
  const jawaYearName = sampleDay?.jawa?.yearName || 'Dal';

  return (
    <div className={`bg-white rounded-3xl border border-stone-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between ${className}`}>
      
      {/* Header Mini Kalender */}
      <div className="space-y-2 border-b border-stone-100 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#C9A84C]" />
            <h3 className="font-serif-title font-bold text-stone-900 text-base sm:text-lg leading-tight">
              Kalender Jawa
            </h3>
            {loading && <RefreshCw className="w-3.5 h-3.5 text-stone-400 animate-spin" />}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleTodayMonth}
              title="Kembali ke Bulan Ini"
              className="px-2 py-0.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-[10px] font-bold text-stone-600 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={handlePrevMonth}
              aria-label="Bulan Sebelumnya"
              className="p-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Bulan Berikutnya"
              className="p-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Info Bulan Masehi & Bulan Jawa */}
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-bold text-stone-800 text-sm">
            {FULL_MONTHS_ID[currentMonth - 1]} {currentYear}
          </span>
          <span className="text-[11px] text-[#856b26] font-medium font-serif italic truncate max-w-[190px]">
            {jawaMonthName} {jawaYear} {jawaYearName}
          </span>
        </div>
      </div>

      {/* Grid 7 Hari Header (Min, Sen, Sel, Rab, Kam, Jum, Sab) */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold pt-2.5 pb-1 border-b border-stone-100 text-stone-500">
        <div className="text-red-600">Min</div>
        <div>Sen</div>
        <div>Sel</div>
        <div>Rab</div>
        <div>Kam</div>
        <div className="text-emerald-700">Jum</div>
        <div>Sab</div>
      </div>

      {/* Grid Hari / Tanggal Kalender */}
      <div className="grid grid-cols-7 gap-1 pt-1.5">
        {/* Padding awal bulan */}
        {Array.from({ length: firstDayOfMonthWeekday }).map((_, i) => (
          <div key={`mini-pad-${i}`} className="h-10 sm:h-11 rounded-lg bg-stone-50/30 opacity-20" />
        ))}

        {/* Tanggal Aktif */}
        {monthData.map((item) => {
          const dayAgendas = agendasByDate.get(item.date) || [];
          const hasAgenda = dayAgendas.length > 0;
          const isToday =
            today.getFullYear() === currentYear &&
            today.getMonth() + 1 === currentMonth &&
            today.getDate() === item.day;
          const isPonSunday = item.isMingguPon;

          return (
            <button
              key={item.date}
              onClick={() => setSelectedDay(item)}
              title={`${item.weekday} ${item.pasaran}, ${item.day} ${SHORT_MONTHS_ID[currentMonth - 1]}${isPonSunday ? ' (Minggu Pon - Patokan Arisan)' : ''}${hasAgenda ? ' • Ada Agenda' : ''}`}
              className={`h-11 sm:h-12 rounded-xl p-1 text-center flex flex-col justify-between items-center transition-all relative border ${
                isPonSunday
                  ? 'bg-amber-100/90 border-[#C9A84C] text-[#20150b] ring-1 ring-[#C9A84C] font-bold shadow-2xs hover:bg-amber-200/90'
                  : isToday
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-200'
                  : 'bg-stone-50/70 border-stone-100/80 hover:bg-white hover:border-stone-300 text-stone-800'
              }`}
            >
              {/* Angka Tanggal Masehi */}
              <div className="flex items-center justify-center gap-0.5 w-full leading-none">
                <span
                  className={`text-[11px] sm:text-xs font-mono font-bold leading-none ${
                    isPonSunday
                      ? 'text-amber-950 font-black'
                      : item.weekday === 'Minggu'
                      ? 'text-red-600'
                      : 'text-stone-800'
                  }`}
                >
                  {item.day}
                </span>

                {/* Indikator Agenda jika ada */}
                {hasAgenda && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                )}
              </div>

              {/* Nama Pasaran Jawa (Pon, Wage, Kliwon, Legi, Pahing) */}
              <span
                className={`text-[9px] font-bold uppercase tracking-tight leading-none truncate ${
                  isPonSunday
                    ? 'text-amber-900 font-black'
                    : item.pasaran === 'Pon'
                    ? 'text-amber-700'
                    : item.pasaran === 'Kliwon'
                    ? 'text-purple-700'
                    : item.pasaran === 'Legi'
                    ? 'text-blue-700'
                    : item.pasaran === 'Pahing'
                    ? 'text-rose-700'
                    : 'text-stone-500'
                }`}
              >
                {item.pasaran}
              </span>

              {/* Tag Kecil Minggu Pon */}
              {isPonSunday ? (
                <span className="text-[7px] text-[#20150b] font-black uppercase tracking-tighter leading-none bg-[#C9A84C] px-1 py-0.2 rounded">
                  ARISAN
                </span>
              ) : (
                <span className="text-[8px] text-stone-400 font-mono leading-none">
                  {item.jawa?.day || ''}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Keterangan Singkat Bawah */}
      <div className="pt-3 mt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-medium text-amber-950">
            <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-[#C9A84C] inline-block"></span>
            <span>Minggu Pon (Arisan)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Agenda</span>
          </span>
        </div>
        <span className="text-stone-400 font-mono">
  
        </span>
      </div>

      {/* ================= MODAL DETAIL TANGGAL JAWA & AGENDA ================= */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-stone-200 overflow-hidden my-4">
            
            {/* Header Modal */}
            <div className={`p-4 border-b flex items-start justify-between ${
              selectedDay.isMingguPon
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                : 'bg-[#FAF7F2] border-stone-200'
            }`}>
              <div className="space-y-0.5">
                {selectedDay.isMingguPon && (
                  <span className="px-2 py-0.5 rounded-full bg-[#20150b] text-[#C9A84C] text-[9px] font-extrabold uppercase tracking-wider inline-block">
                    ⭐ Patokan Arisan Trah
                  </span>
                )}
                <h4 className="text-lg font-serif-title font-bold text-[#20150b]">
                  {selectedDay.weekday} {selectedDay.pasaran}
                </h4>
                <p className="text-xs text-stone-600">
                  {selectedDay.day} {FULL_MONTHS_ID[currentMonth - 1]} {currentYear}
                </p>
              </div>

              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Detail Hari Jawa */}
            <div className="p-4 space-y-3 text-xs text-stone-700">
              
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">
                    Penanggalan Jawa
                  </span>
                  <span className="font-bold text-stone-900 mt-0.5 block">
                    {selectedDay.jawa?.day} {selectedDay.jawa?.monthName || jawaMonthName}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Tahun {selectedDay.jawa?.year || jawaYear} ({selectedDay.jawa?.yearName || jawaYearName})
                  </span>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">
                    Neptu Weton
                  </span>
                  <span className="font-bold text-amber-900 mt-0.5 block">
                    Neptu: {selectedDay.neptu}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {selectedDay.weekday} + {selectedDay.pasaran}
                  </span>
                </div>

                {selectedDay.wuku && (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">
                      Wuku (Pawukon)
                    </span>
                    <span className="font-bold text-stone-900 mt-0.5 block">
                      {selectedDay.wuku}
                    </span>
                  </div>
                )}

                {selectedDay.mangsa && (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">
                      Pranata Mangsa
                    </span>
                    <span className="font-bold text-stone-900 mt-0.5 block">
                      {selectedDay.mangsa}
                    </span>
                  </div>
                )}
              </div>

              {/* Catatan Jika Minggu Pon */}
              {selectedDay.isMingguPon && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 text-[11px] leading-relaxed">
                  <strong>Hari Arisan Trah:</strong> Patokan berkumpulnya arisan selapanan (35 hari) paguyuban keluarga Trah.
                </div>
              )}

              {/* Agenda Pada Tanggal Ini */}
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-stone-900 text-xs block">
                  Agenda Pertemuan:
                </span>

                {(agendasByDate.get(selectedDay.date) || []).length === 0 ? (
                  <p className="text-stone-400 text-[11px] italic">
                    Tidak ada agenda trah di tanggal ini.
                  </p>
                ) : (
                  (agendasByDate.get(selectedDay.date) || []).map((ag) => (
                    <div
                      key={ag.id}
                      className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1"
                    >
                      <div className="font-bold text-stone-900 text-xs">
                        {ag.title}
                      </div>
                      {ag.location && (
                        <div className="text-[10px] text-stone-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{ag.location}</span>
                        </div>
                      )}
                      {ag.time && (
                        <div className="text-[10px] text-stone-600 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{format24HourWIB(ag.time)}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-3 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-3.5 py-1.5 rounded-xl bg-[#20150b] text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
