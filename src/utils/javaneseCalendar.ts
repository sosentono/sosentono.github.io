// Javanese Weton and Calendar Utilities

export const DINO_7 = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const PASARAN_5 = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];

/**
 * Known anchor:
 * January 1, 1970 was a Thursday (Kamis) and Wage.
 * Kamis is index 4 in DINO_7 ('Minggu' = 0, 'Kamis' = 4).
 * Wage is index 3 in PASARAN_5 ('Wage' = 3).
 *
 * Uses Date.UTC with noon (12:00 UTC) to strictly prevent any timezone-offset shifts
 * (e.g. UTC+7 WIB shifting midnight to 17:00 UTC of previous day, turning Minggu Pon into Sabtu Pahing).
 */
export function getWeton(date: Date | string): { dino: string; pasaran: string; full: string } {
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

  // Exact UTC noon prevents timezone boundary shifts in Indonesia (WIB) or elsewhere
  const utcMs = Date.UTC(y, m - 1, d, 12, 0, 0);
  const epochDays = Math.floor(utcMs / (1000 * 60 * 60 * 24));

  // Day of week: 1970-01-01 was Thursday (index 4)
  const dinoIndex = ((epochDays + 4) % 7 + 7) % 7;
  // Pasaran: 1970-01-01 was Wage (index 3)
  const pasaranIndex = ((epochDays + 3) % 5 + 5) % 5;

  const dino = DINO_7[dinoIndex];
  const pasaran = PASARAN_5[pasaranIndex];

  return {
    dino,
    pasaran,
    full: `${dino} ${pasaran}`,
  };
}

/**
 * Calculates future Minggu Pon dates using the repeating 35-day cycle.
 * Every 35 days (7 x 5), the day of week is guaranteed to be Minggu and pasaran is Pon.
 */
export function calculateNextMingguPons(
  referenceDateStr: string = '2024-01-07',
  count: number = 6
): { dateStr: string; dateObj: Date; label: string; daysFromNow: number }[] {
  // Parse reference date YYYY-MM-DD
  const [year, month, day] = referenceDateStr.split('-').map(Number);
  const refUtc = Date.UTC(year, month - 1, day, 12, 0, 0);

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const CYCLE_MS = 35 * MS_PER_DAY;

  // Find nearest upcoming cycle
  const diffMs = todayUtc - refUtc;
  let cycleOffset = Math.floor(diffMs / CYCLE_MS);

  let currentMs = refUtc + (cycleOffset * CYCLE_MS);
  while (currentMs < todayUtc) {
    currentMs += CYCLE_MS;
  }

  const results: { dateStr: string; dateObj: Date; label: string; daysFromNow: number }[] = [];

  for (let i = 0; i < count; i++) {
    const cycleMs = currentMs + (i * CYCLE_MS);
    const d = new Date(cycleMs);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const daysFromNow = Math.round((cycleMs - todayUtc) / MS_PER_DAY);
    const label = formatIndonesianDate(dateStr, true);

    results.push({
      dateStr,
      dateObj: new Date(yyyy, Number(mm) - 1, Number(dd)),
      label,
      daysFromNow,
    });
  }

  return results;
}

export function formatIndonesianDate(dateStr?: string, includeWeton: boolean = true): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;

  const [y, m, d] = parts.map(Number);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dateFormatted = `${d} ${months[m - 1]} ${y}`;

  if (includeWeton) {
    const weton = getWeton(dateStr);
    return `${weton.full}, ${dateFormatted}`;
  }

  return dateFormatted;
}

/**
 * Normalizes time strings into Indonesian 24-hour WIB format.
 * Examples:
 *   "09.30 - 13.00 WIB" -> "09:30 - 13:00 WIB"
 *   "9:30"              -> "09:30 WIB"
 *   "14.00"             -> "14:00 WIB"
 *   "19:00 - 21:30"     -> "19:00 - 21:30 WIB"
 */
export function format24HourWIB(timeStr?: string): string {
  if (!timeStr || !timeStr.trim()) return '09:00 WIB';

  let cleaned = timeStr.trim();
  // Remove trailing or duplicate WIB words for clean parsing
  cleaned = cleaned.replace(/\s*WIB\b/gi, '').trim();

  // If time contains a range like "09.30 - 13.00" or "09:30 - 13:00"
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-').map(p => p.trim());
    const start = normalizeSingleTime(parts[0]);
    const end = normalizeSingleTime(parts[1]);
    if (start && end) {
      return `${start} - ${end} WIB`;
    }
    if (start) {
      return `${start} WIB - Selesai`;
    }
  }

  // Single time
  const single = normalizeSingleTime(cleaned);
  return single ? `${single} WIB` : `${cleaned} WIB`;
}

function normalizeSingleTime(str: string): string {
  if (!str) return '';
  const trimmed = str.trim();
  // Match HH.MM or HH:MM or H.MM or H:MM
  const match = trimmed.match(/^(\d{1,2})[:.](\d{2})$/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    return `${h}:${m}`;
  }
  // If only hour e.g. "9" or "14"
  const hourMatch = trimmed.match(/^(\d{1,2})$/);
  if (hourMatch) {
    const h = hourMatch[1].padStart(2, '0');
    return `${h}:00`;
  }
  // Replace internal dots between digits with colon (e.g. 09.30 -> 09:30)
  return trimmed.replace(/(\d{1,2})\.(\d{2})/g, '$1:$2');
}

const SHORT_MONTHS_ID = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

export function parseDateBadge(dateStr: string): { day: string; month: string; year: string } {
  if (!dateStr) {
    const now = new Date();
    return {
      day: String(now.getDate()).padStart(2, '0'),
      month: SHORT_MONTHS_ID[now.getMonth()],
      year: String(now.getFullYear()),
    };
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const mIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
    const day = parts[2].padStart(2, '0');
    const month = SHORT_MONTHS_ID[mIdx] || 'JAN';
    return { day, month, year };
  }
  return { day: '01', month: 'JAN', year: '2026' };
}

