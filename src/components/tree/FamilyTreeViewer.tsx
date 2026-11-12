import React, { useState, useRef, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Printer,
  Layers,
  X,
  FileSpreadsheet,
  Info,
  HelpCircle,
  Plus
} from 'lucide-react';
import { Person, Relationship, Settings } from '../../types';
import { TreeNode, buildFamilyTreeHierarchy, exportFamilyToCSV } from '../../utils/genealogy';
import { PersonCard } from './PersonCard';
import { ExportModal } from './ExportModal';

interface FamilyTreeViewerProps {
  people: Person[];
  relationships: Relationship[];
  settings: Settings;
  branches: string[];
  wiwitanPerson: Person | undefined;
  onSelectPerson: (person: Person) => void;
  onAddPerson?: () => void;
  maxGenFilter?: number;
}

export const FamilyTreeViewer: React.FC<FamilyTreeViewerProps> = ({
  people,
  relationships,
  settings,
  branches,
  wiwitanPerson,
  onSelectPerson,
  onAddPerson,
  maxGenFilter = 18,
}) => {
  const [zoom, setZoom] = useState<number>(0.92);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('Semua Trah');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [bgStyle, setBgStyle] = useState<'dots' | 'clean'>('dots');

  const containerRef = useRef<HTMLDivElement>(null);
  const treeContentRef = useRef<HTMLDivElement>(null);

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return people.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.callName && p.callName.toLowerCase().includes(q)) ||
      (p.branchName && p.branchName.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery, people]);

  const rootPersonId = wiwitanPerson ? wiwitanPerson.id : (people[0]?.id || '');

  const treeData = useMemo(() => {
    if (!rootPersonId) return null;
    return buildFamilyTreeHierarchy(people, relationships, rootPersonId, selectedBranch);
  }, [people, relationships, rootPersonId, selectedBranch]);

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => {
    setZoom(0.92);
    setPan({ x: 0, y: 0 });
  };

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, .no-drag')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFocusMember = (person: Person) => {
    setFocusedPersonId(person.id);
    onSelectPerson(person);
    setSearchQuery('');
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleExportPNG = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportFamilyToCSV(people, relationships, selectedBranch);
  };

  // Recursive Tree Node Renderer with precision aligned branches
  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    if (depth > maxGenFilter) return null;

    const isCollapsed = collapsedNodes.has(node.person.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.person.id} className="flex flex-col items-center">
        {/* Person Card (contains descendant + attached spouse) */}
        <div className="relative z-10">
          <PersonCard
            person={node.person}
            spouses={node.spouses}
            isDescendant={node.person.isDescendant}
            onSelect={onSelectPerson}
            isFocused={focusedPersonId === node.person.id}
            hasChildren={hasChildren}
            isCollapsed={isCollapsed}
            onToggleCollapse={hasChildren ? () => toggleCollapse(node.person.id) : undefined}
            childIndex={node.childIndex}
            totalSiblings={node.totalSiblings}
            childrenCount={node.children.length}
          />
        </div>

        {/* Children branches (Down to next generation) */}
        {hasChildren && !isCollapsed && (
          <div className="relative flex flex-col items-center w-full">
            {/* Trunk line continuing down from card/button to horizontal sibling bar */}
            <div className="w-[2px] h-7 bg-[#C9A84C] relative flex items-center justify-center">
              {/* Badge showing child count on the trunk */}
              <span className="absolute px-2 py-0.5 rounded-full bg-white border border-[#C9A84C]/60 text-[10px] font-bold text-stone-700 shadow-2xs whitespace-nowrap z-20">
                <span className="text-emerald-700 font-extrabold mr-0.5">↓</span>
                {node.children.length} Anak
              </span>
            </div>

            {/* Container for children cards - NO GAP to prevent any broken horizontal lines */}
            <div className="flex items-start justify-center relative">
              {node.children.map((childNode, index) => {
                const isOnly = node.children.length === 1;
                const isFirst = index === 0;
                const isLast = index === node.children.length - 1;

                return (
                  <div
                    key={childNode.person.id}
                    className="relative flex flex-col items-center px-3 sm:px-6"
                  >
                    {/* Horizontal connector lines spanning exactly between children centers without gaps */}
                    {!isOnly && (
                      <>
                        {/* Line from left edge of this column to its center */}
                        {!isFirst && (
                          <div className="absolute top-0 left-0 right-1/2 h-[2px] bg-[#C9A84C]" />
                        )}
                        {/* Line from center of this column to its right edge */}
                        {!isLast && (
                          <div className="absolute top-0 left-1/2 right-0 h-[2px] bg-[#C9A84C]" />
                        )}
                      </>
                    )}

                    {/* Vertical line dropping down from the horizontal bar into this child */}
                    <div className="w-[2px] h-3.5 bg-[#C9A84C]" />

                    {/* Child index pill above card */}
                    <div className="z-10">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-[9px] font-extrabold shadow-2xs whitespace-nowrap">
                        <span>Anak ke-{childNode.childIndex || (index + 1)}</span>
                      </span>
                    </div>

                    {/* Vertical stem connecting child index pill directly into top of child card without gaps */}
                    <div className="w-[2px] h-2.5 bg-[#C9A84C]" />

                    {/* Render child node recursively */}
                    {renderTreeNode(childNode, depth + 1)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-white rounded-xl border border-[#C9A84C]/25 shadow-sm overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[640px] lg:h-[700px]'
      }`}
    >
      {/* ================= PRINT-ONLY HEADER ================= */}
      <div className="hidden print-only p-6 border-b border-stone-300 text-center mb-6">
        <h1 className="text-2xl font-bold font-serif-title tracking-tight text-stone-900">
          WIT KETURUNAN {settings.familyName.toUpperCase()}
        </h1>
        <p className="text-xs italic text-stone-600 mt-1">
          "{settings.tagline}"
        </p>
        <div className="flex justify-center gap-6 text-xs text-stone-500 mt-2 font-mono">
          <span>Cabang: {selectedBranch}</span>
          <span>Dicetak: {new Date().toLocaleDateString('id-ID')}</span>
          <span>Wiwitan: {wiwitanPerson?.name || 'Leluhur Utama'}</span>
        </div>
      </div>

      {/* ================= TOP CONTROLS BAR ================= */}
      <div className="no-print p-2.5 sm:p-3 bg-[#FAF7F2] border-b border-[#C9A84C]/20 text-stone-700 z-30 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: Branch Selector & Guide Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
            <span className="text-xs font-semibold text-stone-600 hidden sm:inline">Cabang:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-white text-stone-900 text-xs font-medium py-1 px-2.5 rounded border border-[#C9A84C]/30 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            >
              <option value="Semua Trah">Semua Trah</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-emerald-50 border border-emerald-300/80 text-emerald-800 text-xs font-semibold shadow-2xs transition-colors"
            title="Cara membedakan Anak dan Pasangan"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Panduan Alur Pohon</span>
            <span className="sm:hidden">Panduan</span>
          </button>

          {onAddPerson && (
            <button
              onClick={onAddPerson}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#20150b] hover:bg-[#322013] text-[#C9A84C] text-xs font-bold shadow-2xs border border-[#C9A84C]/40 transition-colors"
              title="Tambah Anggota Baru ke Pohon Silsilah"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Anggota</span>
            </button>
          )}
        </div>

        {/* Center: Search Member */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari anggota dalam pohon..."
            className="w-full bg-white text-stone-900 placeholder-stone-400 text-xs pl-8 pr-6 py-1 rounded border border-[#C9A84C]/30 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1.5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#C9A84C]/30 rounded-lg shadow-xl overflow-hidden z-50">
              {searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleFocusMember(p)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#FAF7F2] text-stone-700 flex items-center justify-between border-b border-stone-100 last:border-0 transition-colors"
                >
                  <span className="font-semibold text-stone-900 truncate">{p.name}</span>
                  <span className={`text-[10px] font-bold ${p.isDescendant ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {p.isDescendant ? `Gen ${p.generation ?? 0} (Anak/Pancer)` : 'Pasangan/Menantu'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Tools: Zoom, Fullscreen, Excel, Print */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white rounded border border-[#C9A84C]/30 p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-stone-100 text-stone-600 rounded transition-colors"
              title="Perkecil"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-[10px] font-mono font-medium text-stone-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-stone-100 text-stone-600 rounded transition-colors"
              title="Perbesar"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:bg-stone-100 text-stone-600 rounded border-l border-stone-200 transition-colors"
              title="Kembalikan Tampilan"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => setBgStyle(prev => prev === 'dots' ? 'clean' : 'dots')}
            className="hidden md:flex items-center gap-1 px-2 py-1 bg-white hover:bg-stone-50 text-stone-700 rounded border border-[#C9A84C]/30 text-xs font-medium"
            title="Ganti latar kanvas: Titik Minimalis vs Polos Bersih"
          >
            <Layers className="w-3 h-3 text-[#C9A84C]" />
            <span>{bgStyle === 'dots' ? 'Latar: Titik Lembut' : 'Latar: Polos Bersih'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-white hover:bg-stone-100 text-stone-600 rounded border border-[#C9A84C]/30"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          <button
            onClick={handleExportExcel}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-700 rounded border border-[#C9A84C]/30 text-xs font-medium"
            title="Unduh Excel"
          >
            <FileSpreadsheet className="w-3 h-3 text-[#C9A84C]" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-2.5 py-1 bg-[#20150b] hover:bg-[#322013] text-[#C9A84C] rounded text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
          >
            <Printer className="w-3 h-3" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* ================= TREE CANVAS ================= */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-auto cursor-grab active:cursor-grabbing p-8 flex justify-center items-start print-canvas-wrapper ${
          bgStyle === 'dots' ? 'tree-canvas-bg' : 'tree-canvas-bg-clean'
        } ${isDragging ? 'cursor-grabbing select-none' : ''}`}
      >
        <div
          ref={treeContentRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="inline-block min-w-max pb-20 pt-4"
        >
          {treeData && renderTreeNode(treeData)}
        </div>
      </div>

      {/* ================= CLEAR LEGEND BAR ================= */}
      <div className="no-print py-2 px-4 bg-[#FAF7F2] border-t border-[#C9A84C]/20 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] text-stone-700">
        {/* Descendant indicator */}
        <div className="flex items-center gap-1.5" title="Keturunan Kandung Pancer">
          <span className="w-3.5 h-3.5 rounded bg-white border border-stone-300 border-l-[3px] border-l-emerald-600 shadow-2xs" />
          <span className="font-bold text-emerald-900">Anak / Keturunan Kandung</span>
        </div>

        {/* Spouse indicator */}
        <div className="flex items-center gap-1.5" title="Pasangan Menantu">
          <span className="w-3.5 h-3.5 rounded bg-[#FFF9F6] border border-dashed border-rose-300 border-l-[3px] border-l-rose-400 shadow-2xs" />
          <span className="font-bold text-rose-800">Pasangan / Menantu</span>
        </div>

        {/* Marriage link */}
        <div className="flex items-center gap-1.5" title="Simbol Ikatan Pernikahan">
          <span className="text-rose-600 text-xs">💍</span>
          <span className="text-stone-600 font-medium">Ikatan Nikah (Suami-Istri)</span>
        </div>

        {/* Child branch line */}
        <div className="flex items-center gap-1.5" title="Garis alur vertikal yang menghubungkan orang tua ke anak-anaknya">
          <svg width="22" height="8">
            <line x1="0" y1="4" x2="22" y2="4" stroke="#C9A84C" strokeWidth="2.5" />
          </svg>
          <span className="text-stone-600 font-medium">Garis Cabang Anak</span>
        </div>

        {/* Gender dots */}
        <div className="flex items-center gap-2 border-l border-stone-300 pl-3">
          <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#6ab0e0]" /> ♂ Laki-laki
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#e0a0b0]" /> ♀ Perempuan
          </span>
        </div>
      </div>

      {/* ================= MODAL: PANDUAN MEMBACA POHON SILSILAH ================= */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#C9A84C]/35 overflow-hidden">
            <div className="p-4 bg-[#FAF7F2] border-b border-[#C9A84C]/25 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  💡
                </div>
                <h3 className="font-serif-title font-bold text-base text-stone-900">
                  Panduan Membedakan Anak & Pasangan
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm text-stone-700">
              <p className="leading-relaxed text-stone-600">
                Pohon silsilah dirancang agar anggota keluarga dapat dengan mudah membedakan garis keturunan darah langsung (*pancer*) dan ikatan pernikahan (*menantu*):
              </p>

              {/* Guide Item 1: Anak / Keturunan */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-300">
                  🌿
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs sm:text-sm">
                    1. Anak / Keturunan Kandung (Garis Pancer)
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    • Memiliki <strong>label hijau jelas</strong>: <span className="bg-emerald-100 px-1 py-0.5 rounded font-bold">ANAK KANDUNG</span> atau <span className="bg-emerald-100 px-1 py-0.5 rounded font-bold">CUCU (PUTU)</span>.<br/>
                    • Kartu berlatar <strong>putih bersih dengan garis hijau tebal</strong> di sisi kiri.<br/>
                    • Terhubung langsung dari <strong>garis cabang emas dari atas</strong> dengan label nomor urut kelahiran (contoh: <em>Anak ke-1</em>, <em>Anak ke-2</em>).
                  </p>
                </div>
              </div>

              {/* Guide Item 2: Pasangan / Menantu */}
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm shrink-0 border border-rose-300">
                  💍
                </div>
                <div>
                  <h4 className="font-bold text-rose-950 text-xs sm:text-sm">
                    2. Pasangan / Menantu
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    • Terletak <strong>bersebelahan</strong> di dalam bingkai pasangan dengan simbol cincin nikah <span className="font-bold text-rose-600">💍 NIKAH</span>.<br/>
                    • Memiliki <strong>label kemerahan</strong>: <span className="bg-rose-100 px-1 py-0.5 rounded font-bold">PASANGAN / MENANTU</span>.<br/>
                    • Kartu berbingkai <strong>garis putus-putus (*dashed border*)</strong> dengan aksen warna rose di sisi kiri.
                  </p>
                </div>
              </div>

              {/* Guide Item 3: Alur ke Anak */}
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-300">
                  ↓
                </div>
                <div>
                  <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                    3. Alur Menurun ke Anak
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Garis vertikal emas menurun dari tengah unit pasangan suami-istri dengan penanda <span className="bg-white border border-amber-300 px-1.5 py-0.5 rounded-full font-bold text-[10px]">↓ 4 Anak</span>, lalu terbagi horizontal ke masing-masing anak.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 bg-[#20150b] text-[#C9A84C] font-semibold text-xs rounded-lg hover:bg-[#322013] transition-colors"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        people={people}
        relationships={relationships}
        branches={branches}
        settings={settings}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
        onTriggerPrint={handleTriggerPrint}
        onExportPNG={handleExportPNG}
      />
    </div>
  );
};
