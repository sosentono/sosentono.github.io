import React from 'react';
import { JAVANESE_GENERATIONS } from '../../types';

interface SilsilahJawaSidebarProps {
  maxLevel?: number;
  highlightLevel?: number;
  onSelectLevel?: (level: number) => void;
}

export const SilsilahJawaSidebar: React.FC<SilsilahJawaSidebarProps> = ({
  maxLevel = 10,
  highlightLevel,
  onSelectLevel,
}) => {
  const items = JAVANESE_GENERATIONS.slice(0, maxLevel);

  return (
    <div className="bg-white rounded-xl border border-[#C9A84C]/25 shadow-sm p-4 w-full">
      {/* Title matching prototype: 🌿 Silsilah Jawa */}
      <div className="border-b border-[#C9A84C]/20 pb-2.5 mb-3 flex items-center justify-between">
        <h3 className="font-serif-title font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
          <span>🌿</span>
          <span>Silsilah Jawa</span>
        </h3>
        <span className="text-[10px] text-[#A0785A] uppercase tracking-wider font-semibold">
          10 Jenjang
        </span>
      </div>

      {/* Generation List matching prototype styling */}
      <ul className="space-y-1 text-xs">
        {items.map((gen) => {
          const isSelected = highlightLevel === gen.level;
          return (
            <li
              key={gen.level}
              onClick={() => onSelectLevel && onSelectLevel(gen.level)}
              className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors border-b border-[#C9A84C]/10 last:border-b-0 ${
                isSelected
                  ? 'bg-[rgba(201,168,76,0.15)] text-stone-900 font-bold'
                  : 'hover:bg-[#FAF7F2] text-stone-700'
              } ${onSelectLevel ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-[#C9A84C] text-[#20150b]'
                      : 'bg-[#20150b] text-[#C9A84C]'
                  }`}
                >
                  {gen.level}
                </span>
                <span className="font-bold text-stone-900 truncate">
                  {gen.level === 0 ? 'Empu / Wiwitan' : gen.term}
                </span>
              </div>
              <span className="text-stone-400 text-[10px] font-mono shrink-0 pl-1">
                Generasi {gen.level + 1}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
