import React, { useState, useMemo } from 'react';
import {
  Search,
  Grid,
  List as ListIcon,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  MapPin,
  Filter,
  X,
  RotateCcw,
  Users,
  TreeDeciduous,
  Layers,
  SearchX
} from 'lucide-react';
import { Person, getJavaneseGenerationTerm } from '../../types';
import { exportFamilyToCSV } from '../../utils/genealogy';

interface MemberDirectoryProps {
  people: Person[];
  branches: string[];
  onSelectPerson: (person: Person) => void;
  textSize: 'normal' | 'large' | 'xlarge';
  isAdmin?: boolean;
  onAddPerson?: () => void;
}

export const MemberDirectory: React.FC<MemberDirectoryProps> = ({
  people,
  branches,
  onSelectPerson,
  textSize,
  isAdmin,
  onAddPerson,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGen, setSelectedGen] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedResidence, setSelectedResidence] = useState<string>('ALL');
  const [selectedLineage, setSelectedLineage] = useState<'ALL' | 'BLOOD' | 'SPOUSE'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ALIVE' | 'DECEASED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Generation Tabs configuration
  const generationTabs = [
    { label: 'Semua', value: 'ALL' },
    { label: 'Empu', value: '0' },
    { label: 'Anak', value: '1' },
    { label: 'Putu', value: '2' },
    { label: 'Buyut', value: '3' },
    { label: 'Canggah', value: '4' },
    { label: 'Wareng', value: '5' },
    { label: 'Udheg-udheg', value: '6' },
  ];

  // Ekstrak seluruh cabang keluarga unik dari data & props
  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    branches.forEach(b => { if (b) set.add(b); });
    people.forEach(p => { if (p.branchName) set.add(p.branchName); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [branches, people]);

  // Ekstrak lokasi / domisili tempat tinggal unik dan hitung jumlah anggotanya
  const { availableResidences, unspecifiedResidenceCount } = useMemo(() => {
    const map = new Map<string, number>();
    let unspecified = 0;
    people.forEach(p => {
      const res = p.residence?.trim();
      if (res) {
        map.set(res, (map.get(res) || 0) + 1);
      } else {
        unspecified++;
      }
    });

    const sorted = Array.from(map.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // Terbanyak dahulu
      return a[0].localeCompare(b[0]);
    });

    return {
      availableResidences: sorted,
      unspecifiedResidenceCount: unspecified,
    };
  }, [people]);

  // Hitung jumlah orang per cabang
  const branchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    people.forEach(p => {
      if (p.branchName) {
        counts[p.branchName] = (counts[p.branchName] || 0) + 1;
      }
    });
    return counts;
  }, [people]);

  // Hitung jumlah orang per generasi
  const generationCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: people.length };
    people.forEach(p => {
      const genKey = String(p.generation ?? 0);
      counts[genKey] = (counts[genKey] || 0) + 1;
    });
    return counts;
  }, [people]);

  // Filter logika gabungan: pencarian teks, generasi, cabang, domisili, garis keturunan, status hidup
  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      // 1. Pencarian teks
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCall = p.callName?.toLowerCase().includes(q);
        const matchesRole = p.occupation?.toLowerCase().includes(q);
        const matchesResidence = p.residence?.toLowerCase().includes(q);
        const matchesBranch = p.branchName?.toLowerCase().includes(q);
        if (!matchesName && !matchesCall && !matchesRole && !matchesResidence && !matchesBranch) {
          return false;
        }
      }

      // 2. Filter Generasi
      if (selectedGen !== 'ALL' && p.generation !== Number(selectedGen)) {
        return false;
      }

      // 3. Filter Cabang Keluarga
      if (selectedBranch !== 'ALL' && p.branchName !== selectedBranch) {
        return false;
      }

      // 4. Filter Lokasi Tempat Tinggal / Domisili
      if (selectedResidence !== 'ALL') {
        if (selectedResidence === 'UNSPECIFIED') {
          if (p.residence && p.residence.trim()) return false;
        } else {
          const res = (p.residence || '').toLowerCase();
          const target = selectedResidence.toLowerCase();
          if (!res.includes(target)) return false;
        }
      }

      // 5. Filter Garis Keturunan (Keturunan Langsung vs Pasangan)
      if (selectedLineage === 'BLOOD' && !p.isDescendant) return false;
      if (selectedLineage === 'SPOUSE' && p.isDescendant) return false;

      // 6. Filter Status Kehidupan (Sugeng vs Sedo)
      if (selectedStatus === 'ALIVE' && !p.isAlive) return false;
      if (selectedStatus === 'DECEASED' && p.isAlive) return false;

      return true;
    }).sort((a, b) => {
      const genDiff = (a.generation ?? 0) - (b.generation ?? 0);
      if (genDiff !== 0) return genDiff;
      return (a.birthYear || 9999) - (b.birthYear || 9999);
    });
  }, [people, search, selectedGen, selectedBranch, selectedResidence, selectedLineage, selectedStatus]);

  // Cek apakah ada filter yang sedang aktif
  const isAnyFilterActive =
    search.trim() !== '' ||
    selectedGen !== 'ALL' ||
    selectedBranch !== 'ALL' ||
    selectedResidence !== 'ALL' ||
    selectedLineage !== 'ALL' ||
    selectedStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedGen('ALL');
    setSelectedBranch('ALL');
    setSelectedResidence('ALL');
    setSelectedLineage('ALL');
    setSelectedStatus('ALL');
  };

  const handleDownloadExcel = () => {
    exportFamilyToCSV(filteredPeople, [], selectedBranch === 'ALL' ? 'Semua Trah' : selectedBranch);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Bar with Generation Tabs and Excel Export button */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#C9A84C]/25 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Generation Tabs Row with Member Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {generationTabs.map(tab => {
            const isActive = selectedGen === tab.value;
            const count = generationCounts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedGen(tab.value)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap rounded-xl flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#20150b] text-[#C9A84C] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2] border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-[#C9A84C]/30 text-amber-200' : 'bg-stone-100 text-stone-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Tools: View Toggle & Excel Export Button */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* View Toggle */}
          <div className="flex items-center bg-[#FAF7F2] p-1 rounded-xl border border-[#C9A84C]/20">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Tampilan Kartu"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Tampilan Tabel"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleDownloadExcel}
            className="px-3 py-1.5 rounded-xl border border-[#C9A84C] text-[#8B6B23] hover:bg-[#C9A84C] hover:text-[#20150b] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Unduh Data Anggota Terfilter ke Excel (.CSV)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          {/* Add Member Button if Admin */}
          {isAdmin && onAddPerson && (
            <button
              onClick={onAddPerson}
              className="px-3.5 py-1.5 rounded-xl bg-[#20150b] text-[#C9A84C] hover:bg-[#322013] border border-[#C9A84C]/50 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              title="Tambah Anggota Baru"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Anggota</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= FILTER PANEL UTAMA ================= */}
      <div className="bg-white p-4 rounded-2xl border border-[#C9A84C]/25 shadow-xs space-y-3.5">
        
        {/* Row 1: Search Box + Quick Clear */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama anggota, panggilan, profesi, cabang, atau kota tempat tinggal..."
            className="w-full bg-[#FAF7F2] text-stone-900 placeholder-stone-400 pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm border border-[#C9A84C]/25 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Grid Filter Selectors (Cabang, Generasi, Lokasi Domisili, Garis Keturunan, Status) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          
          {/* 1. Filter Cabang Keluarga */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#C9A84C]" />
              <span>Cabang Keluarga</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-[#FAF7F2] text-stone-800 text-xs py-2 px-2.5 rounded-xl border border-[#C9A84C]/25 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] truncate"
            >
              <option value="ALL">Semua Cabang ({people.length})</option>
              {availableBranches.map(b => (
                <option key={b} value={b}>
                  {b} ({branchCounts[b] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Generasi */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
              <TreeDeciduous className="w-3 h-3 text-[#C9A84C]" />
              <span>Tingkat Generasi</span>
            </label>
            <select
              value={selectedGen}
              onChange={(e) => setSelectedGen(e.target.value)}
              className="w-full bg-[#FAF7F2] text-stone-800 text-xs py-2 px-2.5 rounded-xl border border-[#C9A84C]/25 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] truncate"
            >
              <option value="ALL">Semua Generasi ({people.length})</option>
              <option value="0">Gen 0: Wiwitan / Empu ({generationCounts['0'] || 0})</option>
              <option value="1">Gen 1: Anak ({generationCounts['1'] || 0})</option>
              <option value="2">Gen 2: Putu / Cucu ({generationCounts['2'] || 0})</option>
              <option value="3">Gen 3: Buyut / Cicit ({generationCounts['3'] || 0})</option>
              <option value="4">Gen 4: Canggah ({generationCounts['4'] || 0})</option>
              <option value="5">Gen 5: Wareng ({generationCounts['5'] || 0})</option>
              <option value="6">Gen 6: Udheg-udheg ({generationCounts['6'] || 0})</option>
            </select>
          </div>

          {/* 3. Filter Lokasi Tempat Tinggal / Domisili */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#C9A84C]" />
              <span>Lokasi Domisili</span>
            </label>
            <select
              value={selectedResidence}
              onChange={(e) => setSelectedResidence(e.target.value)}
              className="w-full bg-[#FAF7F2] text-stone-800 text-xs py-2 px-2.5 rounded-xl border border-[#C9A84C]/25 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] truncate"
            >
              <option value="ALL">Semua Lokasi ({people.length})</option>
              {availableResidences.map(([res, count]) => (
                <option key={res} value={res}>
                  📍 {res} ({count})
                </option>
              ))}
              {unspecifiedResidenceCount > 0 && (
                <option value="UNSPECIFIED">
                  Belum Tercatat ({unspecifiedResidenceCount})
                </option>
              )}
            </select>
          </div>

          {/* 4. Filter Garis Keturunan */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
              <Users className="w-3 h-3 text-[#C9A84C]" />
              <span>Garis Keturunan</span>
            </label>
            <select
              value={selectedLineage}
              onChange={(e) => setSelectedLineage(e.target.value as any)}
              className="w-full bg-[#FAF7F2] text-stone-800 text-xs py-2 px-2.5 rounded-xl border border-[#C9A84C]/25 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] truncate"
            >
              <option value="ALL">Keturunan & Pasangan</option>
              <option value="BLOOD">🌿 Hanya Keturunan Kandung</option>
              <option value="SPOUSE">💍 Hanya Pasangan / Menantu</option>
            </select>
          </div>

          {/* 5. Filter Status Kehidupan */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#C9A84C]" />
              <span>Status Kehidupan</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-[#FAF7F2] text-stone-800 text-xs py-2 px-2.5 rounded-xl border border-[#C9A84C]/25 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] truncate"
            >
              <option value="ALL">Semua Status</option>
              <option value="ALIVE">🟢 Masih Hidup (Sugeng)</option>
              <option value="DECEASED">⚪ Telah Wafat (Sedo)</option>
            </select>
          </div>

        </div>

        {/* Row 3: Active Filters Tags + Result Summary */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-stone-500 font-medium text-[11px]">Filter Aktif:</span>

            {!isAnyFilterActive && (
              <span className="text-stone-400 italic text-[11px]">Tidak ada filter aktif (menampilkan semua)</span>
            )}

            {search.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-medium">
                <span>Pencarian: "{search}"</span>
                <button type="button" onClick={() => setSearch('')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedBranch !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                <span>Cabang: {selectedBranch}</span>
                <button type="button" onClick={() => setSelectedBranch('ALL')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedGen !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-medium">
                <span>Generasi: {selectedGen === '0' ? 'Empu' : getJavaneseGenerationTerm(Number(selectedGen))}</span>
                <button type="button" onClick={() => setSelectedGen('ALL')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedResidence !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-medium">
                <span>Lokasi: {selectedResidence === 'UNSPECIFIED' ? 'Belum Tercatat' : selectedResidence}</span>
                <button type="button" onClick={() => setSelectedResidence('ALL')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedLineage !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-800 border border-stone-300 text-[11px] font-medium">
                <span>{selectedLineage === 'BLOOD' ? 'Keturunan Kandung' : 'Pasangan / Menantu'}</span>
                <button type="button" onClick={() => setSelectedLineage('ALL')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-800 border border-stone-300 text-[11px] font-medium">
                <span>{selectedStatus === 'ALIVE' ? 'Masih Sugeng' : 'Telah Sedo'}</span>
                <button type="button" onClick={() => setSelectedStatus('ALL')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 ml-1 underline decoration-dotted"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Semua</span>
              </button>
            )}
          </div>

          <div className="text-stone-500 font-mono text-[11px] shrink-0">
            Ditemukan <strong className="text-stone-900 font-bold">{filteredPeople.length}</strong> dari {people.length} anggota
          </div>
        </div>

      </div>

      {/* ================= VIEW: EMPTY STATE ================= */}
      {filteredPeople.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-[#C9A84C] flex items-center justify-center mx-auto">
            <SearchX className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-base font-serif-title">
              Tidak Ada Anggota yang Cocok
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
              Tidak ditemukan data keluarga yang sesuai dengan kombinasi pencarian atau filter yang dipilih (cabang, generasi, atau lokasi tempat tinggal).
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#20150b] text-[#C9A84C] hover:bg-[#322013] text-xs font-bold transition-all shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hapus Filter & Tampilkan Semua</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= VIEW: GRID CARDS ================= */}
      {viewMode === 'grid' && filteredPeople.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPeople.map(p => {
            const genTerm = getJavaneseGenerationTerm(p.generation);
            return (
              <div
                key={p.id}
                onClick={() => onSelectPerson(p)}
                className={`relative cursor-pointer rounded-2xl p-4 border bg-white transition-all hover:shadow-md ${
                  p.isWiwitan
                    ? 'border-[#C9A84C] ring-1 ring-[#C9A84C] border-l-4 border-l-amber-500'
                    : p.isDescendant
                    ? 'border-stone-200 border-l-4 border-l-emerald-600 hover:border-emerald-500'
                    : 'border-dashed border-rose-300 border-l-4 border-l-rose-400 bg-[#FFF9F6] hover:border-rose-400'
                }`}
              >
                {/* Top-Right Gender Dot (#6ab0e0 male / #e0a0b0 female) */}
                <span
                  className={`absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full ${
                    p.gender === 'MALE' ? 'bg-[#6ab0e0]' : 'bg-[#e0a0b0]'
                  }`}
                  title={p.gender === 'MALE' ? 'Laki-laki (♂)' : 'Perempuan (♀)'}
                />

                <div className="pr-5">
                  {/* Explicit Role Pill */}
                  <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
                    {p.isDescendant ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                        🌿 {p.generation === 0 ? 'WIWITAN / LELUHUR' : (p.generation === 1 ? 'ANAK KANDUNG' : 'KETURUNAN')}
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                        💍 PASANGAN / MENANTU
                      </span>
                    )}

                    {!p.isAlive && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-stone-100 text-stone-600 border border-stone-200">
                        Alm.
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-stone-900 truncate">
                    {p.name}
                  </h4>
                  
                  <div className="flex items-center gap-1.5 text-xs text-[#A0785A] font-semibold mt-1">
                    <span>{p.generation === 0 ? 'Empu / Wiwitan' : genTerm}</span>
                    <span className="text-stone-300">·</span>
                    <span className="text-stone-600 font-medium">
                      {p.isDescendant ? (p.branchName || 'Trah Utama') : 'Menantu Keluarga'}
                    </span>
                  </div>

                  {/* Lokasi Tempat Tinggal (Domisili) dengan MapPin Icon */}
                  {p.residence && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                      <span className="truncate font-medium">{p.residence}</span>
                    </div>
                  )}

                  {p.occupation && (
                    <div className="text-xs text-stone-500 mt-1 truncate">
                      {p.occupation}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-3 mt-3 border-t border-[#C9A84C]/15">
                    <span className="font-mono">
                      {p.birthYear ? `Lahir ${p.birthYear}` : 'Tahun lahir -'}
                      {!p.isAlive && ` (†)`}
                    </span>
                    <span className="text-[#C9A84C] text-[11px] font-semibold flex items-center gap-0.5">
                      <span>Detail</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= VIEW: TABLE VIEW ================= */}
      {viewMode === 'table' && filteredPeople.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#C9A84C]/25 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#24180E] font-bold border-b border-[#C9A84C]/20 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Nama Lengkap</th>
                <th className="py-2.5 px-3">Cabang Trah</th>
                <th className="py-2.5 px-3">Generasi</th>
                <th className="py-2.5 px-3">Domisili / Lokasi</th>
                <th className="py-2.5 px-3">Kel.</th>
                <th className="py-2.5 px-3">Peran / Profesi</th>
                <th className="py-2.5 px-3">Lahir</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredPeople.map(p => (
                <tr
                  key={p.id}
                  onClick={() => onSelectPerson(p)}
                  className="hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-stone-900 truncate max-w-[200px]">
                    {p.name}
                  </td>
                  <td className="py-2.5 px-3 text-stone-700 font-medium">
                    {p.branchName || 'Trah Utama'}
                  </td>
                  <td className="py-2.5 px-3 text-[#A0785A] font-medium">
                    {p.generation === 0 ? 'Empu' : getJavaneseGenerationTerm(p.generation)}
                  </td>
                  <td className="py-2.5 px-3 text-stone-600 truncate max-w-[150px]">
                    {p.residence ? (
                      <span className="inline-flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-[#C9A84C] shrink-0" />
                        <span>{p.residence}</span>
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                      p.gender === 'MALE' ? 'bg-[#6ab0e0]' : 'bg-[#e0a0b0]'
                    }`} />
                    <span>{p.gender === 'MALE' ? '♂ L' : '♀ P'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-stone-600 truncate max-w-[150px]">
                    {p.occupation || '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {p.birthYear || '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                      p.isAlive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}>
                      {p.isAlive ? 'Sugeng' : 'Sedo'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#C9A84C] font-semibold text-right">
                    Detail →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
