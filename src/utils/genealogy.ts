import { Person, Relationship, JAVANESE_GENERATIONS, getJavaneseGenerationTerm } from '../types';

export interface TreeNode {
  person: Person;
  spouses: Person[];
  children: TreeNode[];
  generation: number;
  generationTerm: string;
  branchName: string;
  childIndex?: number;
  totalSiblings?: number;
}

/**
 * Calculates generation levels and branches from the chosen Wiwitan (Leluhur Utama).
 * Rule:
 * - Wiwitan = Generation 0
 * - PARENT relationship increases generation: child.generation = parent.generation + 1
 * - SPOUSE relationship DOES NOT increase generation level.
 */
export function computeGenealogyData(
  people: Person[],
  relationships: Relationship[],
  wiwitanPersonId?: string
): {
  peopleWithGen: Person[];
  branches: string[];
} {
  if (!people || people.length === 0) {
    return { peopleWithGen: [], branches: [] };
  }

  // Find Wiwitan person
  let wiwitan = people.find(p => p.id === wiwitanPersonId || p.isWiwitan);
  if (!wiwitan) {
    // Default to oldest person or first person if none designated
    wiwitan = [...people].sort((a, b) => (a.birthYear || 9999) - (b.birthYear || 9999))[0];
  }

  // Build relationship maps
  // Parent -> Children (person1Id is parent of person2Id)
  const parentToChildren = new Map<string, string[]>();
  const childToParents = new Map<string, string[]>();
  // Spouse <-> Spouse
  const spousesMap = new Map<string, Set<string>>();

  relationships.forEach(rel => {
    if (rel.type === 'PARENT') {
      if (!parentToChildren.has(rel.person1Id)) parentToChildren.set(rel.person1Id, []);
      parentToChildren.get(rel.person1Id)!.push(rel.person2Id);

      if (!childToParents.has(rel.person2Id)) childToParents.set(rel.person2Id, []);
      childToParents.get(rel.person2Id)!.push(rel.person1Id);
    } else if (rel.type === 'SPOUSE') {
      if (!spousesMap.has(rel.person1Id)) spousesMap.set(rel.person1Id, new Set());
      if (!spousesMap.has(rel.person2Id)) spousesMap.set(rel.person2Id, new Set());
      spousesMap.get(rel.person1Id)!.add(rel.person2Id);
      spousesMap.get(rel.person2Id)!.add(rel.person1Id);
    }
  });

  const genMap = new Map<string, number>();
  const branchMap = new Map<string, string>();
  const personMap = new Map<string, Person>();
  people.forEach(p => personMap.set(p.id, p));

  // Wiwitan is Generation 0
  if (wiwitan) {
    genMap.set(wiwitan.id, 0);
    branchMap.set(wiwitan.id, 'Pancer Utama');

    // Breadth-first traversal to compute generations for direct descendants
    const queue: { id: string; gen: number; branch: string }[] = [{
      id: wiwitan.id,
      gen: 0,
      branch: 'Pancer Utama'
    }];
    const visited = new Set<string>([wiwitan.id]);

    while (queue.length > 0) {
      const { id, gen, branch } = queue.shift()!;
      const childrenIds = parentToChildren.get(id) || [];

      childrenIds.forEach(childId => {
        if (!visited.has(childId)) {
          visited.add(childId);
          const nextGen = gen + 1;
          genMap.set(childId, nextGen);

          // If this child is generation 1, their name defines the branch!
          let childBranch = branch;
          if (nextGen === 1) {
            const childPerson = personMap.get(childId);
            childBranch = `Cabang ${childPerson?.callName || childPerson?.name || childId}`;
          }
          branchMap.set(childId, childBranch);

          queue.push({ id: childId, gen: nextGen, branch: childBranch });
        }
      });
    }

    // Now resolve spouses of bloodline descendants:
    // A spouse MUST NOT increase generation level. They share their partner's generation.
    people.forEach(p => {
      if (!genMap.has(p.id)) {
        const mySpouses = spousesMap.get(p.id);
        if (mySpouses) {
          for (const spouseId of mySpouses) {
            if (genMap.has(spouseId)) {
              genMap.set(p.id, genMap.get(spouseId)!);
              branchMap.set(p.id, branchMap.get(spouseId) || 'Kerabat');
              break;
            }
          }
        }
      }
    });

    // Spouses of Wiwitan (e.g. Nyai Sosentono)
    const wiwitanSpouses = spousesMap.get(wiwitan.id);
    if (wiwitanSpouses) {
      wiwitanSpouses.forEach(spId => {
        genMap.set(spId, 0);
        branchMap.set(spId, 'Pancer Utama');
      });
    }
  }

  // Update people with computed values
  const branchesSet = new Set<string>();
  const peopleWithGen = people.map(p => {
    const gen = genMap.has(p.id) ? genMap.get(p.id)! : (p.generation ?? 0);
    const branch = branchMap.get(p.id) || p.branchName || 'Umum';
    if (branch && branch !== 'Pancer Utama' && branch !== 'Umum') {
      branchesSet.add(branch);
    }
    return {
      ...p,
      generation: gen,
      branchName: branch,
      isWiwitan: p.id === wiwitan?.id,
    };
  });

  return {
    peopleWithGen,
    branches: Array.from(branchesSet),
  };
}

/**
 * Build hierarchical tree nodes starting from Wiwitan (or root of chosen branch)
 */
export function buildFamilyTreeHierarchy(
  people: Person[],
  relationships: Relationship[],
  rootPersonId: string,
  filterBranch?: string
): TreeNode | null {
  const personMap = new Map<string, Person>();
  people.forEach(p => personMap.set(p.id, p));

  const rootPerson = personMap.get(rootPersonId);
  if (!rootPerson) return null;

  // Build parent-to-children and spouse maps
  const parentToChildren = new Map<string, string[]>();
  const spouseMap = new Map<string, string[]>();

  relationships.forEach(rel => {
    if (rel.type === 'PARENT') {
      if (!parentToChildren.has(rel.person1Id)) parentToChildren.set(rel.person1Id, []);
      parentToChildren.get(rel.person1Id)!.push(rel.person2Id);
    } else if (rel.type === 'SPOUSE') {
      if (!spouseMap.has(rel.person1Id)) spouseMap.set(rel.person1Id, []);
      if (!spouseMap.has(rel.person2Id)) spouseMap.set(rel.person2Id, []);
      spouseMap.get(rel.person1Id)!.push(rel.person2Id);
      spouseMap.get(rel.person2Id)!.push(rel.person1Id);
    }
  });

  const visited = new Set<string>();

  function buildNode(personId: string, childIndex?: number, totalSiblings?: number): TreeNode | null {
    if (visited.has(personId)) return null;
    visited.add(personId);

    const person = personMap.get(personId);
    if (!person) return null;

    // Get spouses
    const spouseIds = spouseMap.get(personId) || [];
    const spouses = spouseIds
      .map(id => personMap.get(id))
      .filter((p): p is Person => p !== undefined);

    // Get children of this person (also check if any children are attached via spouses)
    const directChildrenIds = parentToChildren.get(personId) || [];
    const spouseChildrenIds = spouseIds.flatMap(sId => parentToChildren.get(sId) || []);
    const uniqueChildrenIds = Array.from(new Set([...directChildrenIds, ...spouseChildrenIds]));

    // Sort children by birth year or order
    const sortedChildren = uniqueChildrenIds
      .map(id => personMap.get(id))
      .filter((p): p is Person => p !== undefined)
      .sort((a, b) => (a.birthYear || 9999) - (b.birthYear || 9999));

    // Filter by branch if applicable
    const validChildren = sortedChildren.filter(child => {
      if (filterBranch && filterBranch !== 'Semua Trah') {
        if (child.branchName && child.branchName !== filterBranch && person.generation !== 0) {
          return false;
        }
      }
      return true;
    });

    const children: TreeNode[] = [];
    validChildren.forEach((child, idx) => {
      const childNode = buildNode(child.id, idx + 1, validChildren.length);
      if (childNode) {
        children.push(childNode);
      }
    });

    const generation = person.generation ?? 0;
    return {
      person,
      spouses,
      children,
      generation,
      generationTerm: getJavaneseGenerationTerm(generation),
      branchName: person.branchName || 'Trah Utama',
      childIndex,
      totalSiblings,
    };
  }

  return buildNode(rootPersonId);
}

/**
 * Generate CSV/Excel string with Indonesian headers and UTF-8 BOM
 */
export function generateExcelExport(people: Person[], relationships: Relationship[]): string {
  const relationshipMap = new Map<string, { parents: string[]; spouses: string[]; children: string[] }>();
  people.forEach(p => {
    relationshipMap.set(p.id, { parents: [], spouses: [], children: [] });
  });

  const personNames = new Map<string, string>();
  people.forEach(p => personNames.set(p.id, p.name));

  relationships.forEach(rel => {
    if (rel.type === 'PARENT') {
      const parentName = personNames.get(rel.person1Id);
      const childName = personNames.get(rel.person2Id);
      if (parentName && relationshipMap.has(rel.person2Id)) {
        relationshipMap.get(rel.person2Id)!.parents.push(parentName);
      }
      if (childName && relationshipMap.has(rel.person1Id)) {
        relationshipMap.get(rel.person1Id)!.children.push(childName);
      }
    } else if (rel.type === 'SPOUSE') {
      const sp1Name = personNames.get(rel.person1Id);
      const sp2Name = personNames.get(rel.person2Id);
      if (sp1Name && relationshipMap.has(rel.person2Id)) {
        relationshipMap.get(rel.person2Id)!.spouses.push(sp1Name);
      }
      if (sp2Name && relationshipMap.has(rel.person1Id)) {
        relationshipMap.get(rel.person1Id)!.spouses.push(sp2Name);
      }
    }
  });

  const headers = [
    'ID',
    'Nama Lengkap',
    'Nama Panggilan',
    'Jenis Kelamin',
    'Garis Keturunan (Darah/Pasangan)',
    'Tingkat Generasi',
    'Istilah Generasi Jawa',
    'Cabang Trah',
    'Tahun Lahir',
    'Status (Hidup/Wafat)',
    'Domisili',
    'Orang Tua',
    'Pasangan',
    'Jumlah Anak'
  ];

  const rows = people.map(p => {
    const rel = relationshipMap.get(p.id) || { parents: [], spouses: [], children: [] };
    const gen = p.generation ?? 0;
    return [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.callName || '').replace(/"/g, '""')}"`,
      `"${p.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}"`,
      `"${p.isDescendant ? 'Keturunan Langsung (Darah)' : 'Pasangan Menantu'}"`,
      gen,
      `"${getJavaneseGenerationTerm(gen)}"`,
      `"${p.branchName || 'Trah Utama'}"`,
      p.birthYear || '-',
      `"${p.isAlive ? 'Masih Hidup' : 'Sampun Sedo (Wafat)'}"`,
      `"${(p.residence || '-').replace(/"/g, '""')}"`,
      `"${rel.parents.join(', ') || '-'}"`,
      `"${rel.spouses.join(', ') || '-'}"`,
      rel.children.length
    ].join(',');
  });

  // UTF-8 BOM for Microsoft Excel auto-detecting Indonesian accents and UTF-8 characters
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers instant CSV file download for Microsoft Excel / Google Sheets
 */
export function exportFamilyToCSV(people: Person[], relationships: Relationship[], branchName: string = 'Semua Trah'): void {
  const filtered = branchName === 'Semua Trah' 
    ? people 
    : people.filter(p => p.branchName === branchName || p.generation === 0);
  
  const csvContent = generateExcelExport(filtered, relationships);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeBranch = branchName.replace(/\s+/g, '_');
  link.setAttribute('download', `Silsilah_Trah_${safeBranch}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
