/**
 * Service to fetch and manage Javanese Calendar data from https://tanggalanjawa.com/api
 * Includes precomputed high-fidelity data matching tanggalanjawa.com directly,
 * plus resilient API and algorithmic calculation.
 */

import precomputedDataRaw from './jawaDataPrecomputed.json';

export interface JawaInfo {
  day: number;
  month: number;
  monthName: string;
  year: number;
  yearName: string;
  windu?: string;
}

export interface JawaDayData {
  date: string; // YYYY-MM-DD
  day: number;
  weekday: string; // 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  pasaran: string; // 'Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'
  jawa: JawaInfo;
  wuku: string;
  mangsa: string;
  isMingguPon: boolean;
  neptu: number;
  weton: string; // e.g. "Minggu Pon"
}

export const DINO_7 = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const PASARAN_5 = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];

export const DINO_NEPTU: Record<string, number> = {
  Minggu: 5,
  Senin: 4,
  Selasa: 3,
  Rabu: 7,
  Kamis: 8,
  Jumat: 6,
  Sabtu: 9,
};

export const PASARAN_NEPTU: Record<string, number> = {
  Legi: 5,
  Pahing: 9,
  Pon: 7,
  Wage: 4,
  Kliwon: 8,
};

export const BULAN_JAWA_12 = [
  'Sura',
  'Sapar',
  'Mulud',
  'Bakda Mulud',
  'Jumadilawal',
  'Jumadilakir',
  'Rejeb',
  'Ruwah',
  'Pasa',
  'Sawal',
  'Sela',
  'Besar',
];

export const TAHUN_JAWA_8 = ['Alip', 'Ehe', 'Jimawal', 'Je', 'Dal', 'Be', 'Wawu', 'Jimakir'];

export const WUKU_30 = [
  'Sinta', 'Landep', 'Wukir', 'Kurantil', 'Tolu', 'Gumbreg',
  'Warigalit', 'Warigagung', 'Julungwangi', 'Sungsang', 'Galungan', 'Kuningan',
  'Langkir', 'Mandasiya', 'Julungpujut', 'Pahang', 'Kuruwelut', 'Marakeh',
  'Tambir', 'Medangkungan', 'Maktal', 'Wuye', 'Manahil', 'Prangbakat',
  'Bala', 'Wugu', 'Wayang', 'Kulawu', 'Dukut', 'Watugunung'
];

// Memory cache to avoid repeated network calls
const cacheMonth: Record<string, JawaDayData[]> = {};
const cacheDay: Record<string, JawaDayData> = {};

// Cast precomputed dataset
const precomputedData: Record<string, any[]> = precomputedDataRaw as Record<string, any[]>;

/**
 * Mathematical weton calculation as immediate anchor:
 * January 1, 1970 was Thursday (Kamis) Wage.
 * Uses Date.UTC with noon to strictly prevent timezone boundary shifts.
 */
export function calculateLocalWeton(date: Date | string): { dino: string; pasaran: string; weton: string; neptu: number } {
  let y: number;
  let m: number;
  let d: number;

  if (typeof date === 'string') {
    const parts = date.split('-').map(Number);
    y = parts[0];
    m = parts[1];
    d = parts[2];
  } else {
    y = date.getFullYear();
    m = date.getMonth() + 1;
    d = date.getDate();
  }

  const utcMs = Date.UTC(y, m - 1, d, 12, 0, 0);
  const epochDays = Math.floor(utcMs / (1000 * 60 * 60 * 24));

  const dinoIndex = ((epochDays + 4) % 7 + 7) % 7;
  const pasaranIndex = ((epochDays + 3) % 5 + 5) % 5;

  const dino = DINO_7[dinoIndex];
  const pasaran = PASARAN_5[pasaranIndex];
  const neptu = (DINO_NEPTU[dino] || 0) + (PASARAN_NEPTU[pasaran] || 0);

  return {
    dino,
    pasaran,
    weton: `${dino} ${pasaran}`,
    neptu,
  };
}

/**
 * Calculate Wuku deterministically (210-day cycle).
 * Reference anchor: 2026-10-04 is Sunday (Minggu), Wuku Wayang (index 26).
 */
export function calculateWuku(date: Date | string): string {
  let y: number, m: number, d: number;
  if (typeof date === 'string') {
    const parts = date.split('-').map(Number);
    y = parts[0]; m = parts[1]; d = parts[2];
  } else {
    y = date.getFullYear(); m = date.getMonth() + 1; d = date.getDate();
  }
  const utcMs = Date.UTC(y, m - 1, d, 12, 0, 0);
  const refTime = Date.UTC(2026, 9, 4, 12, 0, 0); // 2026-10-04 (Wayang)
  const diffDays = Math.floor((utcMs - refTime) / (24 * 3600 * 1000));
  const weekOffset = Math.floor(diffDays / 7);
  const wukuIndex = ((26 + weekOffset) % 30 + 30) % 30;
  return WUKU_30[wukuIndex];
}

/**
 * Calculate Pranata Mangsa deterministically (Solar Javanese season).
 */
export function calculateMangsa(date: Date | string): string {
  let m: number, d: number;
  if (typeof date === 'string') {
    const parts = date.split('-').map(Number);
    m = parts[1]; d = parts[2];
  } else {
    m = date.getMonth() + 1; d = date.getDate();
  }

  // Monthly transition points
  if ((m === 6 && d >= 23) || (m === 7 && d <= 31) || (m === 8 && d <= 2)) return 'Kaso';
  if ((m === 8 && d >= 3 && d <= 25)) return 'Karo';
  if ((m === 8 && d >= 26) || (m === 9 && d <= 18)) return 'Katelu';
  if ((m === 9 && d >= 19) || (m === 10 && d <= 13)) return 'Kapat';
  if ((m === 10 && d >= 14) || (m === 11 && d <= 9)) return 'Kalima';
  if ((m === 11 && d >= 10) || (m === 12 && d <= 22)) return 'Kanem';
  if ((m === 12 && d >= 23) || (m === 1 && d <= 31) || (m === 2 && d <= 3)) return 'Kapitu';
  if ((m === 2 && d >= 4 && d <= 28)) return 'Kawolu';
  if (m === 3 && d <= 25) return 'Kasanga';
  if ((m === 3 && d >= 26) || (m === 4 && d <= 18)) return 'Kadasa';
  if ((m === 4 && d >= 19) || (m === 5 && d <= 11)) return 'Dhesta';
  return 'Saddha';
}

/**
 * Fallback generator for a month outside precomputed range.
 */
export function generateFallbackJawaMonth(year: number, month: number): JawaDayData[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const results: JawaDayData[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const yyyy = year;
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const { dino, pasaran, weton, neptu } = calculateLocalWeton(dateStr);
    const isMingguPon = dino === 'Minggu' && pasaran === 'Pon';
    const wuku = calculateWuku(dateStr);
    const mangsa = calculateMangsa(dateStr);

    const approxJawaYear = year - 66;
    const jawaYearName = TAHUN_JAWA_8[(approxJawaYear - 1) % 8] || 'Be';

    results.push({
      date: dateStr,
      day,
      weekday: dino,
      pasaran,
      jawa: {
        day: ((day + 15) % 30) + 1,
        month: month,
        monthName: BULAN_JAWA_12[(month - 1) % 12],
        year: approxJawaYear,
        yearName: jawaYearName,
        windu: 'Sancaya',
      },
      wuku,
      mangsa,
      isMingguPon,
      neptu,
      weton,
    });
  }

  return results;
}

/**
 * Fetch calendar data for an entire Gregorian month (1-12).
 * Priority:
 * 1. Memory Cache
 * 2. Precomputed Data (2024-2028 from tanggalanjawa.com API)
 * 3. Network Fetch (GET /api/calendar)
 * 4. Algorithmic Fallback
 */
export async function fetchJawaCalendarMonth(year: number, month: number): Promise<JawaDayData[]> {
  const cacheKey = `${year}-${month}`;
  if (cacheMonth[cacheKey]) {
    return cacheMonth[cacheKey];
  }

  // 1. Check precomputed dataset from tanggalanjawa.com
  const precomputedList = precomputedData[cacheKey];
  if (Array.isArray(precomputedList) && precomputedList.length > 0) {
    const parsed: JawaDayData[] = precomputedList.map((item: any) => {
      const weekday = item.weekday || '';
      const pasaran = item.pasaran || '';
      const isMingguPon = weekday === 'Minggu' && pasaran === 'Pon';
      const neptu = (DINO_NEPTU[weekday] || 0) + (PASARAN_NEPTU[pasaran] || 0);

      return {
        date: item.date,
        day: item.day,
        weekday,
        pasaran,
        jawa: {
          day: item.jawa?.day || item.day,
          month: item.jawa?.month || month,
          monthName: item.jawa?.monthName || BULAN_JAWA_12[(month - 1) % 12],
          year: item.jawa?.year || year - 66,
          yearName: item.jawa?.yearName || 'Dal',
          windu: item.jawa?.windu || 'Sancaya',
        },
        wuku: item.wuku || calculateWuku(item.date),
        mangsa: item.mangsa || calculateMangsa(item.date),
        isMingguPon,
        neptu,
        weton: `${weekday} ${pasaran}`,
      };
    });

    cacheMonth[cacheKey] = parsed;
    return parsed;
  }

  // 2. If not precomputed (e.g. far future/past), try live API endpoints
  const endpoints = [
    `/api/calendar?year=${year}&month=${month}`,
    `https://tanggalanjawa.com/api/calendar?year=${year}&month=${month}`,
  ];

  let rawData: any = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        rawData = await res.json();
        if (rawData) break;
      }
    } catch {
      // try next endpoint
    }
  }

  if (rawData && typeof rawData === 'object') {
    const firstKey = Object.keys(rawData)[0];
    const items: any[] = Array.isArray(rawData[firstKey])
      ? rawData[firstKey]
      : Array.isArray(rawData)
      ? rawData
      : [];

    if (items.length > 0) {
      const parsed: JawaDayData[] = items.map((item: any) => {
        const weekday = item.weekday || '';
        const pasaran = item.pasaran || '';
        const isMingguPon = weekday === 'Minggu' && pasaran === 'Pon';
        const neptu = (DINO_NEPTU[weekday] || 0) + (PASARAN_NEPTU[pasaran] || 0);

        return {
          date: item.date,
          day: item.day,
          weekday,
          pasaran,
          jawa: {
            day: item.jawa?.day || item.day,
            month: item.jawa?.month || month,
            monthName: item.jawa?.monthName || BULAN_JAWA_12[(month - 1) % 12],
            year: item.jawa?.year || year - 66,
            yearName: item.jawa?.yearName || 'Dal',
            windu: item.jawa?.windu || 'Sancaya',
          },
          wuku: item.wuku || calculateWuku(item.date),
          mangsa: item.mangsa || calculateMangsa(item.date),
          isMingguPon,
          neptu,
          weton: `${weekday} ${pasaran}`,
        };
      });

      cacheMonth[cacheKey] = parsed;
      return parsed;
    }
  }

  // 3. Fallback calculation
  const fallback = generateFallbackJawaMonth(year, month);
  cacheMonth[cacheKey] = fallback;
  return fallback;
}

/**
 * Fetch calendar data for a single date.
 */
export async function fetchJawaCalendarDay(year: number, month: number, day: number): Promise<JawaDayData> {
  const cacheKey = `${year}-${month}-${day}`;
  if (cacheDay[cacheKey]) {
    return cacheDay[cacheKey];
  }

  const monthData = await fetchJawaCalendarMonth(year, month);
  const found = monthData.find((d) => d.day === day);
  if (found) {
    cacheDay[cacheKey] = found;
    return found;
  }

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const { dino, pasaran, weton, neptu } = calculateLocalWeton(dateStr);
  const isMingguPon = dino === 'Minggu' && pasaran === 'Pon';

  const result: JawaDayData = {
    date: dateStr,
    day,
    weekday: dino,
    pasaran,
    jawa: {
      day: ((day + 15) % 30) + 1,
      month,
      monthName: BULAN_JAWA_12[(month - 1) % 12],
      year: year - 66,
      yearName: TAHUN_JAWA_8[(year - 66 - 1) % 8] || 'Dal',
      windu: 'Sancaya',
    },
    wuku: calculateWuku(dateStr),
    mangsa: calculateMangsa(dateStr),
    isMingguPon,
    neptu,
    weton,
  };

  cacheDay[cacheKey] = result;
  return result;
}

export { calculateNextMingguPons, format24HourWIB, formatIndonesianDate, parseDateBadge } from './javaneseCalendar';
