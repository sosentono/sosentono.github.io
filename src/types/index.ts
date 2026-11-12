export type Gender = 'MALE' | 'FEMALE';
export type Visibility = 'PUBLIC' | 'FAMILY' | 'PRIVATE';
export type RelationshipType = 'PARENT' | 'SPOUSE';
export type AgendaType = 'ARISAN' | 'TRAH_BESAR' | 'OTHER';
export type AgendaCategory = 'Arisan Trah' | 'Syawalan Trah' | 'Lain-lain';

export interface Person {
  id: string;
  name: string;
  callName?: string;
  gender: Gender;
  birthYear?: number;
  birthDate?: string;
  deathYear?: number;
  deathDate?: string;
  isAlive: boolean;
  photoUrl?: string;
  residence?: string;
  occupation?: string;
  biography?: string;
  phone?: string;
  email?: string;
  isWiwitan?: boolean;
  isDescendant: boolean; // Direct bloodline (true) vs Spouse (false)
  generation?: number; // 0 for Wiwitan, 1 for Anak, 2 for Putu, etc.
  branchName?: string; // e.g. "Cabang Sutrisno"
  visibility: Visibility;
  showPhoto: boolean;
  showBirthDate: boolean;
  showBirthYear: boolean;
  showResidence: boolean;
  showBiography: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  person1Id: string; // Parent ID or Spouse 1
  person2Id: string; // Child ID or Spouse 2
  type: RelationshipType; // 'PARENT' | 'SPOUSE'
  order?: number; // Child birth order or spouse order
  notes?: string;
  createdAt: string;
}

export interface Agenda {
  id: string;
  type: AgendaType;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  category?: string;
  hostFamily?: string;
  description?: string;
  gmapsUrl?: string;
  documentationUrl?: string;
  photoUrls?: string[]; // Daftar URL foto dokumentasi acara
  summary?: string; // Ringkasan acara / notula / kesimpulan pertemuan
  hijriYear?: string; // e.g., "1447 H"
  theme?: string;
  contactPerson?: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface Kabar {
  id: string;
  title: string;
  category: 'Kelahiran' | 'Pernikahan' | 'Kabar Duka' | 'Prestasi' | 'Undangan' | 'Pengumuman' | 'Kegiatan';
  content: string;
  author: string;
  date: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Cariyos {
  id: string;
  title: string;
  category: 'Leluhur' | 'Sejarah Trah' | 'Migrasi' | 'Tradisi' | 'Pitutur Luhur' | 'Asal-Usul' | 'Foto Lawas';
  content: string;
  era?: string;
  narrator?: string;
  imageUrl?: string;
  audioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  date: string;
  imageUrl: string;
  driveUrl?: string;
  caption: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Settings {
  id: string;
  familyName: string;
  wiwitanPersonId: string;
  mingguPonReferenceDate: string; // e.g. '2024-01-07'
  tagline: string;
  announcement?: string;
  googleDriveFolderUrl?: string; // Tautan utama folder Google Drive penyimpanan database foto dokumentasi trah
  updatedAt: string;
}

export type AdminRole = 'master_admin' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  displayName?: string;
  email?: string;
  role: AdminRole;
  addedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

// 18 Generations of Javanese Kinship
export const JAVANESE_GENERATIONS: { level: number; term: string; meaning: string }[] = [
  { level: 0, term: 'Wiwitan / Leluhur Utama', meaning: 'Akar pertama silsilah / Pancer trah' },
  { level: 1, term: 'Anak', meaning: 'Keturunan generasi pertama' },
  { level: 2, term: 'Putu', meaning: 'Cucu' },
  { level: 3, term: 'Buyut', meaning: 'Cicit' },
  { level: 4, term: 'Canggah', meaning: 'Keturunan ke-4' },
  { level: 5, term: 'Wareng', meaning: 'Keturunan ke-5' },
  { level: 6, term: 'Udheg-udheg', meaning: 'Keturunan ke-6' },
  { level: 7, term: 'Gantung Siwur', meaning: 'Keturunan ke-7' },
  { level: 8, term: 'Grebak Sente', meaning: 'Keturunan ke-8' },
  { level: 9, term: 'Debok Bosok', meaning: 'Keturunan ke-9' },
  { level: 10, term: 'Galih Asem', meaning: 'Keturunan ke-10' },
  { level: 11, term: 'Grobak Waton', meaning: 'Keturunan ke-11' },
  { level: 12, term: 'Cendeng', meaning: 'Keturunan ke-12' },
  { level: 13, term: 'Giyeng', meaning: 'Keturunan ke-13' },
  { level: 14, term: 'Cumpleng', meaning: 'Keturunan ke-14' },
  { level: 15, term: 'Ampleng', meaning: 'Keturunan ke-15' },
  { level: 16, term: 'Menyoman', meaning: 'Keturunan ke-16' },
  { level: 17, term: 'Menyu-menyu', meaning: 'Keturunan ke-17' },
  { level: 18, term: 'Trah Tumerah', meaning: 'Keturunan langgeng turun-temurun' },
];

export function getJavaneseGenerationTerm(level?: number): string {
  if (level === undefined || level === null || level < 0) return 'Kerabat';
  if (level < JAVANESE_GENERATIONS.length) {
    return JAVANESE_GENERATIONS[level].term;
  }
  return `Generasi ke-${level} (Trah Tumerah)`;
}
