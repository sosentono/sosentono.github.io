import React, { useState } from 'react';
import { X, Printer, FileSpreadsheet, Image as ImageIcon, Layers } from 'lucide-react';
import { Person, Relationship, Settings, JAVANESE_GENERATIONS } from '../../types';
import { generateExcelExport } from '../../utils/genealogy';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  relationships: Relationship[];
  branches: string[];
  settings: Settings;
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  onTriggerPrint: () => void;
  onExportPNG: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  people,
  relationships,
  branches,
  settings,
  selectedBranch,
  onSelectBranch,
  onTriggerPrint,
  onExportPNG,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'Poster'>('A4');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeBirthYear, setIncludeBirthYear] = useState(true);
  const [includeSpouses, setIncludeSpouses] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);

  if (!isOpen) return null;

  const handleDownloadExcel = () => {
    const csvContent = generateExcelExport(people, relationships);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${settings.familyName.replace(/\s+/g, '_')}_Silsilah_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCount = selectedBranch === 'Semua Trah'
    ? people.length
    : people.filter(p => p.branchName === selectedBranch || p.generation === 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-950">
              Cetak & Ekspor Silsilah
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.familyName} · {settings.tagline}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-slate-800 text-sm">
          
          {/* Branch Selection */}
          <div>
            <label className="block font-semibold text-slate-900 mb-1.5 text-xs">
              Pilih Cabang Trah:
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs sm:text-sm font-medium"
            >
              <option value="Semua Trah">Semua Trah (Seluruh Anggota)</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="mt-1.5 text-xs text-slate-500">
              Total anggota yang dicetak: <strong className="text-slate-900">{filteredCount} orang</strong>
            </div>
          </div>

          {/* Paper Size Option */}
          <div>
            <label className="block font-semibold text-slate-900 mb-1.5 text-xs">
              Ukuran Kertas (Landscape):
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'A4', label: 'A4 Landscape', desc: 'Standar dokumen' },
                { id: 'A3', label: 'A3 Landscape', desc: 'Ukuran besar' },
                { id: 'Poster', label: 'Poster', desc: 'Kanvas dinding' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setPaperSize(item.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paperSize === item.id
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-semibold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                  <div className={`text-[10px] ${paperSize === item.id ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Element Inclusion Toggles */}
          <div>
            <label className="block font-semibold text-slate-900 mb-1.5 text-xs">
              Opsi Tampilan Cetak:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={includeSpouses}
                  onChange={e => setIncludeSpouses(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Pasangan Menantu</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={includeBirthYear}
                  onChange={e => setIncludeBirthYear(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Tahun Kelahiran</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={e => setIncludePhotos(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Foto Profil</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={includeLegend}
                  onChange={e => setIncludeLegend(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Tabel Generasi Jawa</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => {
                onClose();
                setTimeout(() => onTriggerPrint(), 200);
              }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={() => {
                onExportPNG();
                onClose();
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Unduh PNG</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Hasil cetak otomatis bersih dari tombol navigasi, kontrol zoom, dan panel aplikasi.
        </div>
      </div>
    </div>
  );
};
