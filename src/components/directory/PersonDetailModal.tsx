import React from 'react';
import {
  X,
  MapPin,
  Calendar,
  Briefcase,
  ArrowRight,
  Heart
} from 'lucide-react';
import { Person, Relationship, getJavaneseGenerationTerm } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface PersonDetailModalProps {
  person: Person | null;
  onClose: () => void;
  people: Person[];
  relationships: Relationship[];
  onSelectPerson: (p: Person) => void;
  onEditPerson?: (p: Person) => void;
  onDeletePerson?: (id: string, name?: string) => void;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  person,
  onClose,
  people,
  relationships,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
}) => {
  const { isAdmin } = useAuth();
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  if (!person) return null;

  // Always resolve latest person record from live people prop so edits sync immediately
  const activePerson = people.find(p => p.id === person.id) || person;

  const personMap = new Map<string, Person>();
  people.forEach(p => personMap.set(p.id, p));

  const parentIds = relationships
    .filter(r => r.person2Id === activePerson.id && r.type === 'PARENT')
    .map(r => r.person1Id);
  const parents = parentIds.map(id => personMap.get(id)).filter((p): p is Person => !!p);

  const spouseIds = relationships
    .filter(r => (r.person1Id === activePerson.id || r.person2Id === activePerson.id) && r.type === 'SPOUSE')
    .map(r => r.person1Id === activePerson.id ? r.person2Id : r.person1Id);
  const spouses = spouseIds.map(id => personMap.get(id)).filter((p): p is Person => !!p);

  const childrenIds = relationships
    .filter(r => r.person1Id === activePerson.id && r.type === 'PARENT')
    .map(r => r.person2Id);
  const children = childrenIds.map(id => personMap.get(id)).filter((p): p is Person => !!p);

  const genTerm = getJavaneseGenerationTerm(activePerson.generation);

  const isLiving = activePerson.isAlive;
  const isPrivate = activePerson.visibility === 'PRIVATE' && !isAdmin;
  const canShowBirth = activePerson.showBirthYear || !isLiving || isAdmin;
  const canShowResidence = (activePerson.showResidence && !isPrivate) || !isLiving || isAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#C9A84C]/35 overflow-hidden my-6">
        
        {/* Header matching prototype */}
        <div className="p-5 border-b border-[#C9A84C]/20 bg-[#FAF7F2] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {activePerson.isDescendant ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                🌿 {activePerson.generation === 0 ? 'LELUHUR / WIWITAN' : (activePerson.generation === 1 ? 'ANAK KANDUNG' : 'KETURUNAN KANDUNG')}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                💍 PASANGAN / MENANTU
              </span>
            )}
            <span className="text-xs text-stone-600 font-medium">
              Gen {activePerson.generation ?? 0} · {activePerson.generation === 0 ? 'Empu / Wiwitan' : genTerm}
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs text-stone-500 font-normal">
              {activePerson.isDescendant ? (activePerson.branchName || 'Trah Utama') : 'Menantu Keluarga'}
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              {activePerson.photoUrl && (activePerson.showPhoto || isAdmin) ? (
                <img
                  src={activePerson.photoUrl}
                  alt={activePerson.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#C9A84C]"
                />
              ) : (
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-2xs ${
                    activePerson.gender === 'MALE' ? 'bg-[#6ab0e0]' : 'bg-[#e0a0b0]'
                  }`}
                >
                  {activePerson.gender === 'MALE' ? '♂' : '♀'}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pr-6">
              <h3 className="font-serif-title text-xl font-bold text-stone-900 leading-tight">
                {activePerson.name}
              </h3>
              {activePerson.callName && (
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Panggilan: {activePerson.callName}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                <span>{activePerson.gender === 'MALE' ? 'Laki-laki (♂)' : 'Perempuan (♀)'}</span>
                <span>·</span>
                <span className={activePerson.isAlive ? 'text-emerald-700 font-medium' : 'text-stone-400'}>
                  {activePerson.isAlive ? 'Masih Hidup' : 'Sampun Sedo (†)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 space-y-4 text-stone-800 text-xs sm:text-sm">
          
          {/* Key Facts */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#C9A84C]/15">
              <span className="text-stone-400 flex items-center gap-1 mb-0.5 text-[11px]">
                <Calendar className="w-3 h-3 text-[#C9A84C]" />
                Kelahiran
              </span>
              <div className="font-semibold text-stone-900">
                {canShowBirth ? (
                  <>
                    {activePerson.birthYear || '-'}
                    {!activePerson.isAlive && activePerson.deathYear && ` — †${activePerson.deathYear}`}
                  </>
                ) : (
                  <span className="text-stone-400 italic">Disembunyikan</span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#C9A84C]/15">
              <span className="text-stone-400 flex items-center gap-1 mb-0.5 text-[11px]">
                <MapPin className="w-3 h-3 text-[#C9A84C]" />
                Domisili
              </span>
              <div className="font-semibold text-stone-900 truncate">
                {canShowResidence && activePerson.residence ? activePerson.residence : (
                  <span className="text-stone-400 italic">-</span>
                )}
              </div>
            </div>

            {activePerson.occupation && (
              <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#C9A84C]/15 col-span-2">
                <span className="text-stone-400 flex items-center gap-1 mb-0.5 text-[11px]">
                  <Briefcase className="w-3 h-3 text-[#C9A84C]" />
                  Peran / Pekerjaan
                </span>
                <div className="font-semibold text-stone-900">
                  {activePerson.occupation}
                </div>
              </div>
            )}
          </div>

          {/* Family Connections */}
          <div className="space-y-2.5 pt-1">
            <h4 className="font-bold text-xs text-[#20150b] uppercase tracking-wider">
              Hubungan Keluarga
            </h4>

            {/* Parents */}
            <div>
              <span className="text-xs text-stone-500 block mb-1">
                Orang Tua Kandung:
              </span>
              {parents.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {parents.map(par => (
                    <button
                      key={par.id}
                      onClick={() => onSelectPerson(par)}
                      className="px-2.5 py-1 rounded bg-[#FAF7F2] hover:bg-[#C9A84C]/20 border border-[#C9A84C]/30 text-stone-900 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>{par.name}</span>
                      <ArrowRight className="w-3 h-3 text-[#C9A84C]" />
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-stone-400 italic">Pancer Awal (Wiwitan / Empu)</span>
              )}
            </div>

            {/* Spouses */}
            {spouses.length > 0 && (
              <div>
                <span className="text-xs text-stone-500 block mb-1">
                  Menikah dengan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {spouses.map(sp => (
                    <button
                      key={sp.id}
                      onClick={() => onSelectPerson(sp)}
                      className="px-2.5 py-1 rounded bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 text-stone-900 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span className="text-[#e07b7b]">♥</span>
                      <span>{sp.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Children */}
            {children.length > 0 && (
              <div>
                <span className="text-xs text-stone-500 block mb-1">
                  Keturunan / Anak ({children.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {children.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => onSelectPerson(ch)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>{ch.name}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-stone-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Edit & Delete buttons if signed in */}
          {isAdmin && (
            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {onEditPerson && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditPerson(activePerson);
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#20150b] hover:bg-[#322013] text-[#C9A84C] font-bold text-xs transition-colors"
                  >
                    Edit Data Anggota Ini
                  </button>
                )}

                {onDeletePerson && (
                  isConfirmingDelete ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                      <button
                        onClick={() => {
                          onDeletePerson(activePerson.id, activePerson.name);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                      >
                        Hapus!
                      </button>
                      <button
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1.5 rounded-lg text-stone-600 text-xs hover:bg-stone-100"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className="px-3 py-2 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                      title="Hapus data anggota ini"
                    >
                      Hapus
                    </button>
                  )
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
