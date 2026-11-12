import React, { useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { DatabaseBackup, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { db } from '../../firebase';

/**
 * Alat sekali pakai untuk Master Admin:
 * menyalin seluruh data dari database lama (proyek AI Studio) ke database baru.
 *
 * - Hanya MEMBACA dari database lama; database lama tidak diubah.
 * - Dokumen ditulis dengan ID yang sama, jadi aman dijalankan ulang.
 * - Koleksi "admins" sengaja TIDAK disalin (di database lama berisi password
 *   teks biasa). Admin didaftarkan ulang lewat tab Kelola Admin.
 */
const OLD_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBvg91ZMNRQZR9tvpLXxu7gseGys9fkk3s',
  authDomain: 'fundamental-hope-0ggh3.firebaseapp.com',
  projectId: 'fundamental-hope-0ggh3',
  appId: '1:941689114815:web:3eadd1d0e4739494ec360a',
};
const OLD_DATABASE_ID = 'ai-studio-6008220b-c6fe-45e8-9f60-a31f99584655';

const COLLECTIONS = ['people', 'relationships', 'agendas', 'kabar', 'cariyos', 'gallery', 'settings'] as const;

const LABELS: Record<string, string> = {
  people: 'Anggota keluarga',
  relationships: 'Hubungan keluarga',
  agendas: 'Agenda',
  kabar: 'Kabar',
  cariyos: 'Cariyos',
  gallery: 'Galeri',
  settings: 'Pengaturan',
};

type Snapshot = Record<string, { id: string; data: Record<string, any> }[]>;

async function readOldDatabase(): Promise<Snapshot> {
  const oldApp = initializeApp(OLD_FIREBASE_CONFIG, `db-lama-${Date.now()}`);
  try {
    const oldDb = initializeFirestore(oldApp, { experimentalAutoDetectLongPolling: true }, OLD_DATABASE_ID);
    const result: Snapshot = {};
    for (const name of COLLECTIONS) {
      const snap = await getDocs(collection(oldDb, name));
      result[name] = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    }
    return result;
  } finally {
    deleteApp(oldApp).catch(() => undefined);
  }
}

export const MigrasiDataLama: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const describeError = (err: any) => {
    const msg: string = err?.message || String(err);
    if (err?.code === 'permission-denied') {
      return 'Ditolak oleh aturan database. Pastikan Anda masuk sebagai admin dan aturan Firestore (firestore.rules) sudah dipasang di proyek baru. Jika penolakan datang dari database lama, berarti database lama sudah tidak bisa dibaca.';
    }
    return msg;
  };

  const handleBackup = async () => {
    setRunning(true);
    setError(null);
    setDone(false);
    setProgress('Membaca database lama...');
    try {
      const data = await readOldDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cadangan-trah-sosentono-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setCounts(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])));
      setProgress('Cadangan diunduh.');
    } catch (err) {
      setError(describeError(err));
      setProgress(null);
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = async () => {
    setRunning(true);
    setError(null);
    setDone(false);
    setCounts(null);
    setProgress('Membaca database lama...');
    try {
      const data = await readOldDatabase();
      const total = Object.values(data).reduce((n, list) => n + list.length, 0);
      if (total === 0) {
        throw new Error('Database lama kosong atau tidak bisa dibaca — tidak ada yang disalin.');
      }

      let written = 0;
      for (const name of COLLECTIONS) {
        const list = data[name] || [];
        // Tulis sedikit-sedikit: dokumen berisi foto bisa besar
        for (let i = 0; i < list.length; i += 10) {
          const chunk = list.slice(i, i + 10);
          await Promise.all(chunk.map((item) => setDoc(doc(db, name, item.id), item.data)));
          written += chunk.length;
          setProgress(`Menyalin ${LABELS[name]}... (${written}/${total})`);
        }
      }

      setCounts(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])));
      setProgress(`Selesai: ${written} dokumen tersalin.`);
      setDone(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-300/80 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <DatabaseBackup className="w-5 h-5 text-amber-600" />
        <h4 className="text-base font-bold text-slate-950">Salin Data dari Database Lama</h4>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        Menyalin anggota, hubungan, agenda, kabar, cariyos, galeri, dan pengaturan dari database versi
        AI Studio ke database baru ini. Database lama hanya dibaca dan tidak diubah. Data dengan ID yang
        sama di database baru akan ditimpa. Akun admin tidak ikut disalin.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleBackup}
          disabled={running}
          className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-semibold text-xs flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>1. Unduh Cadangan (JSON)</span>
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={running}
          className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-colors"
        >
          <DatabaseBackup className="w-4 h-4 text-amber-400" />
          <span>{running ? 'Sedang berjalan...' : '2. Salin ke Database Baru'}</span>
        </button>
      </div>

      {progress && !error && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
            done ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {done && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
          <div>
            <div className="font-semibold">{progress}</div>
            {counts && (
              <div className="mt-1 text-slate-600">
                {COLLECTIONS.map((c) => `${LABELS[c]}: ${counts[c] ?? 0}`).join(' · ')}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="font-medium leading-relaxed">{error}</div>
        </div>
      )}
    </div>
  );
};
