import React, { useMemo } from 'react';
import { Calendar, Home, Newspaper, Settings, TreePine, Users, User } from 'lucide-react';
import { Dialog, DialogContent } from './arc/dialog/dialog';
import { CommandPalette, type CommandItem } from './arc/command-palette/command-palette';
import { Person } from '../types';

interface SearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: Person[];
  isAdmin: boolean;
  onNavigate: (tab: string) => void;
  onSelectPerson: (person: Person) => void;
}

const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const;

/**
 * Pencarian cepat (Cmd/Ctrl + K): loncat ke halaman atau langsung membuka data anggota.
 * Memakai blok command-palette dari Arc UI di dalam dialog.
 */
export const SearchPalette: React.FC<SearchPaletteProps> = ({
  open,
  onOpenChange,
  people,
  isAdmin,
  onNavigate,
  onSelectPerson,
}) => {
  const items = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = [
      { id: 'page:beranda', label: 'Beranda', group: 'Halaman', icon: <Home {...ICON} />, keywords: ['depan', 'utama'] },
      { id: 'page:pohon', label: 'Pohon keluarga', group: 'Halaman', icon: <TreePine {...ICON} />, keywords: ['silsilah', 'wit'] },
      { id: 'page:anggota', label: 'Daftar anggota', group: 'Halaman', icon: <Users {...ICON} />, keywords: ['keluarga', 'direktori'] },
      { id: 'page:agenda', label: 'Agenda dan arisan Pon', group: 'Halaman', icon: <Calendar {...ICON} />, keywords: ['jadwal', 'reuni', 'syawal', 'galeri'] },
      { id: 'page:kabar', label: 'Kabar trah', group: 'Halaman', icon: <Newspaper {...ICON} />, keywords: ['warta', 'berita', 'duka'] },
      {
        id: 'page:admin',
        label: isAdmin ? 'Panel admin' : 'Masuk admin',
        group: 'Halaman',
        icon: <Settings {...ICON} />,
        keywords: ['login', 'pengurus'],
      },
    ];

    const members: CommandItem[] = people.map((p) => {
      const parts: string[] = [];
      if (typeof p.generation === 'number') parts.push(`Generasi ${p.generation}`);
      parts.push(p.isDescendant ? p.branchName || 'Trah utama' : 'Pasangan keluarga');
      return {
        id: `person:${p.id}`,
        label: p.name,
        description: parts.join(', '),
        group: 'Anggota',
        icon: <User {...ICON} />,
        keywords: [p.callName, p.residence, p.occupation].filter((v): v is string => !!v),
      };
    });

    return [...pages, ...members];
  }, [people, isAdmin]);

  const handleSelect = (item: CommandItem) => {
    onOpenChange(false);
    // Beri waktu dialog pencarian menutup sebelum panel lain terbuka, supaya fokus tidak berebut.
    window.setTimeout(() => {
      if (item.id.startsWith('page:')) {
        onNavigate(item.id.slice(5));
      } else if (item.id.startsWith('person:')) {
        const person = people.find((p) => p.id === item.id.slice(7));
        if (person) onSelectPerson(person);
      }
    }, 180);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Cari cepat"
        description="Ketik nama anggota atau nama halaman."
        className="arc-palette-dialog"
      >
        <CommandPalette
          items={items}
          placeholder="Cari anggota atau halaman"
          label="Cari anggota atau halaman"
          onSelect={handleSelect}
          onClose={() => onOpenChange(false)}
          autoFocus
        />
      </DialogContent>
    </Dialog>
  );
};
