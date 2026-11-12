import React from 'react';
import { Person, getJavaneseGenerationTerm } from '../../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PersonCardProps {
  person: Person;
  spouses?: Person[];
  isDescendant: boolean;
  onSelect: (person: Person) => void;
  isFocused?: boolean;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  childIndex?: number;
  totalSiblings?: number;
  childrenCount?: number;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  spouses = [],
  onSelect,
  isFocused = false,
  hasChildren = false,
  isCollapsed = false,
  onToggleCollapse,
  childIndex,
  totalSiblings,
  childrenCount,
}) => {
  const gen = person.generation ?? 0;
  const genTerm = getJavaneseGenerationTerm(gen);

  // Helper label for descendant role badge
  const getDescendantBadge = () => {
    if (gen === 0) {
      return {
        label: '👑 WIWITAN (LELUHUR)',
        className: 'bg-amber-100 text-amber-900 border-amber-300',
        roleText: 'Pancer Pokok / Leluhur',
      };
    }
    if (gen === 1) {
      return {
        label: `🌿 ANAK KANDUNG${childIndex ? ` #${childIndex}` : ''}`,
        className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        roleText: 'Garis Pancer Trah',
      };
    }
    if (gen === 2) {
      return {
        label: `🌿 CUCU (PUTU)${childIndex ? ` #${childIndex}` : ''}`,
        className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        roleText: 'Garis Pancer Trah',
      };
    }
    if (gen === 3) {
      return {
        label: `🌿 CICIT (BUYUT)${childIndex ? ` #${childIndex}` : ''}`,
        className: 'bg-teal-50 text-teal-800 border-teal-300',
        roleText: 'Garis Pancer Trah',
      };
    }
    return {
      label: `🌿 KETURUNAN (${genTerm.toUpperCase()})`,
      className: 'bg-teal-50 text-teal-800 border-teal-300',
      roleText: 'Garis Pancer Trah',
    };
  };

  const descBadge = getDescendantBadge();
  const hasSpouses = spouses.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Container holding primary person + spouse(s) connected */}
      <div
        className={`relative flex items-center transition-all ${
          hasSpouses
            ? 'p-2 sm:p-2.5 rounded-2xl bg-amber-50/25 border border-[#C9A84C]/30 shadow-xs'
            : ''
        }`}
      >
        {/* Small header label for the couple container if married */}
        {hasSpouses && (
          <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-white border border-[#C9A84C]/40 text-[9px] font-bold text-[#8B6A50] shadow-2xs select-none">
            💍 Ikatan Keluarga / Pasangan
          </div>
        )}

        {/* ================= MAIN DESCENDANT CARD (ANAK / KETURUNAN) ================= */}
        <div
          onClick={() => onSelect(person)}
          className={`relative cursor-pointer w-44 sm:w-52 py-2.5 px-3 rounded-xl bg-white text-stone-900 border-t border-r border-b border-l-4 transition-all shadow-xs ${
            gen === 0
              ? 'border-l-amber-500 border-stone-200 hover:border-amber-500'
              : 'border-l-emerald-600 border-stone-200 hover:border-emerald-500'
          } ${
            isFocused
              ? 'ring-2 ring-emerald-500 scale-105 shadow-md'
              : 'hover:shadow-sm'
          }`}
        >
          {/* Top-Right Gender Dot */}
          <span
            className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full border border-white shadow-2xs ${
              person.gender === 'MALE' ? 'bg-[#6ab0e0]' : 'bg-[#e0a0b0]'
            }`}
            title={person.gender === 'MALE' ? 'Laki-laki (♂)' : 'Perempuan (♀)'}
          />

          <div className="text-left pr-3">
            {/* Explicit Role Pill: ANAK / KETURUNAN KANDUNG */}
            <div className="flex items-center gap-1 mb-1">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-tight border uppercase ${descBadge.className}`}
              >
                {descBadge.label}
              </span>
            </div>

            {/* Person Name */}
            <h4
              className="font-bold text-xs sm:text-[13px] text-stone-900 truncate leading-snug"
              title={person.name}
            >
              {person.name}
            </h4>

            {/* Lineage & Javanese Generation Subtitle */}
            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium mt-0.5">
              <span className="truncate">
                {gen === 0 ? 'Wiwitan Trah' : `Gen ${gen} · ${genTerm}`}
              </span>
              {childIndex && totalSiblings ? (
                <span className="text-[10px] text-stone-400 font-mono shrink-0 ml-1">
                  Ke-{childIndex}/{totalSiblings}
                </span>
              ) : null}
            </div>

            {/* Birth / Death Year */}
            {person.birthYear && (
              <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                {person.birthYear} {!person.isAlive && `— †${person.deathYear || ''}`}
              </div>
            )}
          </div>
        </div>

        {/* ================= SPOUSE CARD(S) (PASANGAN / MENANTU) ================= */}
        {spouses.map((spouse) => (
          <React.Fragment key={spouse.id}>
            {/* Marriage Bridge between Descendant and Spouse */}
            <div
              className="flex flex-col items-center justify-center shrink-0 px-1 py-1 select-none"
              title="Hubungan Pernikahan (Pasangan Suami - Istri)"
            >
              <div className="flex items-center">
                <div className="w-2 sm:w-2.5 h-[2px] bg-rose-300" />
                <div className="w-5 h-5 rounded-full bg-rose-50 border border-rose-300 text-rose-600 flex items-center justify-center shadow-2xs text-[11px]">
                  💍
                </div>
                <div className="w-2 sm:w-2.5 h-[2px] bg-rose-300" />
              </div>
              <span className="text-[8px] font-extrabold text-rose-600 mt-0.5 uppercase tracking-wider">
                Nikah
              </span>
            </div>

            {/* Spouse Card (Dashed Border + Rose Accent) */}
            <div
              onClick={() => onSelect(spouse)}
              className="relative cursor-pointer w-44 sm:w-52 py-2.5 px-3 rounded-xl bg-[#FFF9F6] text-stone-800 border-t border-r border-b border-dashed border-rose-300/80 border-l-4 border-l-rose-400 hover:border-rose-400 hover:bg-white transition-all shadow-2xs"
            >
              {/* Gender Dot */}
              <span
                className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full border border-white shadow-2xs ${
                  spouse.gender === 'FEMALE' ? 'bg-[#e0a0b0]' : 'bg-[#6ab0e0]'
                }`}
                title={spouse.gender === 'FEMALE' ? 'Perempuan (♀)' : 'Laki-laki (♂)'}
              />

              <div className="text-left pr-3">
                {/* Explicit Role Pill: PASANGAN / MENANTU */}
                <div className="flex items-center gap-1 mb-1">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-tight border uppercase bg-rose-100 text-rose-800 border-rose-200">
                    💍 PASANGAN / MENANTU
                  </span>
                </div>

                {/* Spouse Name */}
                <h4
                  className="font-semibold text-xs sm:text-[13px] text-stone-800 truncate leading-snug"
                  title={spouse.name}
                >
                  {spouse.name}
                </h4>

                {/* Subtitle */}
                <div className="text-[11px] text-rose-700 font-medium mt-0.5 truncate">
                  Pasangan {person.callName || person.name.split(' ')[0]}
                </div>

                {/* Birth / Death Year */}
                {spouse.birthYear && (
                  <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                    {spouse.birthYear} {!spouse.isAlive && `— †${spouse.deathYear || ''}`}
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Collapse / Expand Handle with connecting stems */}
      {hasChildren && onToggleCollapse && (
        <div className="relative flex flex-col items-center z-20">
          {/* Connector stem from card to toggle button */}
          <div className="w-[2px] h-2 bg-[#C9A84C]" />

          {isCollapsed ? (
            <button
              onClick={onToggleCollapse}
              title="Buka cabang anak / keturunan"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs text-[10px] font-bold transition-all hover:scale-105"
            >
              <ChevronDown className="w-3 h-3 text-emerald-600" />
              <span>Buka {childrenCount ? `${childrenCount} Anak` : 'Keturunan'}</span>
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              title="Tutup cabang anak"
              className="w-5 h-5 rounded-full bg-white hover:bg-stone-100 text-[#C9A84C] flex items-center justify-center border border-[#C9A84C]/50 shadow-2xs text-xs transition-transform hover:scale-110"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          )}

          {/* Connector stem below toggle button connecting to downward branch */}
          {!isCollapsed && <div className="w-[2px] h-2 bg-[#C9A84C]" />}
        </div>
      )}
    </div>
  );
};
