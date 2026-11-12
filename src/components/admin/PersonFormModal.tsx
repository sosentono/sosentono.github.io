import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Person, Relationship, Gender, Visibility } from '../../types';

interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  personToEdit?: Person | null;
  people: Person[];
  relationships: Relationship[];
  onSavePerson: (personData: Omit<Person, 'createdAt' | 'updatedAt'>, relsToAdd?: { parentIds: string[]; spouseIds: string[] }) => Promise<void>;
}

export const PersonFormModal: React.FC<PersonFormModalProps> = ({
  isOpen,
  onClose,
  personToEdit,
  people,
  relationships,
  onSavePerson,
}) => {
  const [name, setName] = useState('');
  const [callName, setCallName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [isDescendant, setIsDescendant] = useState(true);
  const [isAlive, setIsAlive] = useState(true);
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [deathYear, setDeathYear] = useState<string>('');
  const [residence, setResidence] = useState('');
  const [occupation, setOccupation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [biography, setBiography] = useState('');
  const [branchName, setBranchName] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [showPhoto, setShowPhoto] = useState(true);
  const [showBirthYear, setShowBirthYear] = useState(true);
  const [showResidence, setShowResidence] = useState(true);
  const [showBiography, setShowBiography] = useState(true);

  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [selectedSpouseIds, setSelectedSpouseIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (personToEdit) {
      setName(personToEdit.name || '');
      setCallName(personToEdit.callName || '');
      setGender(personToEdit.gender || 'MALE');
      setIsDescendant(personToEdit.isDescendant ?? true);
      setIsAlive(personToEdit.isAlive ?? true);
      setBirthYear(personToEdit.birthYear ? String(personToEdit.birthYear) : '');
      setBirthDate(personToEdit.birthDate || '');
      setDeathYear(personToEdit.deathYear ? String(personToEdit.deathYear) : '');
      setResidence(personToEdit.residence || '');
      setOccupation(personToEdit.occupation || '');
      setPhotoUrl(personToEdit.photoUrl || '');
      setBiography(personToEdit.biography || '');
      setBranchName(personToEdit.branchName || '');
      setVisibility(personToEdit.visibility || 'PUBLIC');
      setShowPhoto(personToEdit.showPhoto ?? true);
      setShowBirthYear(personToEdit.showBirthYear ?? true);
      setShowResidence(personToEdit.showResidence ?? true);
      setShowBiography(personToEdit.showBiography ?? true);

      const existingParents = relationships
        .filter(r => r.person2Id === personToEdit.id && r.type === 'PARENT')
        .map(r => r.person1Id);
      setSelectedParentIds(existingParents);

      const existingSpouses = relationships
        .filter(r => (r.person1Id === personToEdit.id || r.person2Id === personToEdit.id) && r.type === 'SPOUSE')
        .map(r => r.person1Id === personToEdit.id ? r.person2Id : r.person1Id);
      setSelectedSpouseIds(existingSpouses);
    } else {
      setName('');
      setCallName('');
      setGender('MALE');
      setIsDescendant(true);
      setIsAlive(true);
      setBirthYear('');
      setBirthDate('');
      setDeathYear('');
      setResidence('');
      setOccupation('');
      setPhotoUrl('');
      setBiography('');
      setBranchName('');
      setVisibility('PUBLIC');
      setShowPhoto(true);
      setShowBirthYear(true);
      setShowResidence(true);
      setShowBiography(true);
      setSelectedParentIds([]);
      setSelectedSpouseIds([]);
    }
  }, [personToEdit, relationships, isOpen]);

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Nama lengkap wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const personData: Omit<Person, 'createdAt' | 'updatedAt'> = {
        id: personToEdit?.id || `P_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        callName: callName.trim() || undefined,
        gender,
        isDescendant,
        isAlive,
        birthYear: birthYear ? parseInt(birthYear, 10) : undefined,
        birthDate: birthDate.trim() || undefined,
        deathYear: (!isAlive && deathYear) ? parseInt(deathYear, 10) : undefined,
        residence: residence.trim() || undefined,
        occupation: occupation.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        biography: biography.trim() || undefined,
        branchName: branchName.trim() || undefined,
        visibility,
        showPhoto,
        showBirthDate: true,
        showBirthYear,
        showResidence,
        showBiography,
        isWiwitan: personToEdit?.isWiwitan || false,
      };

      await onSavePerson(personData, {
        parentIds: selectedParentIds,
        spouseIds: selectedSpouseIds,
      });

      onClose();
    } catch (err: any) {
      setFormError('Gagal menyimpan ke Firebase: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherPeople = people.filter(p => p.id !== personToEdit?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-950">
              {personToEdit ? 'Sunting Data Anggota' : 'Tambah Anggota Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {personToEdit ? personToEdit.name : 'Lengkapi identitas dan hubungan silsilah'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 text-xs sm:text-sm max-h-[75vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError(null)} className="text-rose-500 hover:text-rose-800 text-xs">Tutup</button>
            </div>
          )}
          
          <div className="space-y-3">
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">
              Identitas Pribadi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: R. Sutrisno Sosentono, S.H."
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700">Nama Panggilan</label>
                <input
                  type="text"
                  value={callName}
                  onChange={(e) => setCallName(e.target.value)}
                  placeholder="Contoh: Pak Tris"
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700">Jenis Kelamin</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                >
                  <option value="MALE">Laki-laki</option>
                  <option value="FEMALE">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700">Garis Keturunan *</label>
                <select
                  value={isDescendant ? 'TRUE' : 'FALSE'}
                  onChange={(e) => setIsDescendant(e.target.value === 'TRUE')}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                >
                  <option value="TRUE">Keturunan Langsung</option>
                  <option value="FALSE">Pasangan Menantu</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700">Status</label>
                <select
                  value={isAlive ? 'TRUE' : 'FALSE'}
                  onChange={(e) => setIsAlive(e.target.value === 'TRUE')}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                >
                  <option value="TRUE">Masih Hidup</option>
                  <option value="FALSE">Wafat (Sampun Sedo)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700">Tahun Lahir</label>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="1968"
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {!isAlive && (
                <div>
                  <label className="block font-medium mb-1 text-slate-700">Tahun Wafat</label>
                  <input
                    type="number"
                    value={deathYear}
                    onChange={(e) => setDeathYear(e.target.value)}
                    placeholder="2015"
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium mb-1 text-slate-700">Domisili</label>
                <input
                  type="text"
                  value={residence}
                  onChange={(e) => setResidence(e.target.value)}
                  placeholder="Sleman, Yogyakarta"
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700">Profesi</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Pendidik / Pengusaha"
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700">URL Foto Profil</label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700">Riwayat Singkat</label>
              <textarea
                rows={3}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                placeholder="Catatan riwayat hidup atau pengabdian..."
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Silsilah Hubungan */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">
              Hubungan Silsilah
            </h4>

            <div>
              <label className="block font-medium mb-1 text-slate-700">
                Pilih Orang Tua:
              </label>
              <select
                multiple
                value={selectedParentIds}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, opt => opt.value);
                  setSelectedParentIds(options);
                }}
                className="w-full border border-slate-200 rounded-xl p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 h-24"
              >
                {otherPeople.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.callName ? `(${p.callName})` : ''} — Gen {p.generation ?? '?'}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Tahan Ctrl / Cmd untuk memilih ayah dan ibu bersamaan.
              </span>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700">
                Pilih Pasangan Sah:
              </label>
              <select
                multiple
                value={selectedSpouseIds}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, opt => opt.value);
                  setSelectedSpouseIds(options);
                }}
                className="w-full border border-slate-200 rounded-xl p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 h-20"
              >
                {otherPeople.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.callName ? `(${p.callName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
