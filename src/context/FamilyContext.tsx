import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  getDoc,
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Person, Relationship, Agenda, Kabar, Cariyos, Settings, GalleryItem } from '../types';
import { computeGenealogyData } from '../utils/genealogy';
import {
  INITIAL_SETTINGS,
  INITIAL_PEOPLE,
  INITIAL_RELATIONSHIPS,
  INITIAL_AGENDAS,
  INITIAL_KABAR,
  INITIAL_CARIYOS,
  INITIAL_GALLERY
} from '../utils/seedData';

interface FamilyContextType {
  people: Person[];
  relationships: Relationship[];
  agendas: Agenda[];
  kabar: Kabar[];
  cariyos: Cariyos[];
  gallery: GalleryItem[];
  settings: Settings;
  branches: string[];
  wiwitanPerson: Person | undefined;
  loading: boolean;
  
  // Person CRUD
  addPerson: (personData: Omit<Person, 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePerson: (id: string, personData: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  savePersonAndRelationships: (
    personData: Omit<Person, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string },
    relsToAdd?: { parentIds: string[]; spouseIds: string[] }
  ) => Promise<void>;

  // Relationship CRUD
  addRelationship: (relData: Omit<Relationship, 'id' | 'createdAt'>) => Promise<void>;
  deleteRelationship: (id: string) => Promise<void>;

  // Agenda CRUD
  addAgenda: (agendaData: Omit<Agenda, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAgenda: (id: string, agendaData: Partial<Agenda>) => Promise<void>;
  deleteAgenda: (id: string) => Promise<void>;

  // Kabar CRUD
  addKabar: (kabarData: Omit<Kabar, 'id' | 'createdAt'>) => Promise<void>;
  updateKabar: (id: string, kabarData: Partial<Kabar>) => Promise<void>;
  deleteKabar: (id: string) => Promise<void>;

  // Cariyos CRUD
  addCariyos: (cariyosData: Omit<Cariyos, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCariyos: (id: string, cariyosData: Partial<Cariyos>) => Promise<void>;
  deleteCariyos: (id: string) => Promise<void>;

  // Gallery CRUD
  addGalleryItem: (data: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGalleryItem: (id: string, data: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;

  // Settings & Wiwitan
  updateSettings: (settingsData: Partial<Settings>) => Promise<void>;
  setWiwitan: (personId: string) => Promise<void>;
  seedInitialDataIfEmpty: () => Promise<void>;
}

const CACHE_KEYS = {
  people: 'trah_sosentono_people_cache',
  relationships: 'trah_sosentono_relationships_cache',
  agendas: 'trah_sosentono_agendas_cache',
  kabar: 'trah_sosentono_kabar_cache',
  cariyos: 'trah_sosentono_cariyos_cache',
  gallery: 'trah_sosentono_gallery_cache',
  settings: 'trah_sosentono_settings_cache',
};

function loadCache<T>(key: string, fallback: T): T {
  try {
    const legacyKey = key.replace('trah_sosentono_', 'trah_soesentono_');
    const raw = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (raw === null || raw === undefined) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? (parsed as T) : fallback;
    }
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('saveCache note:', err);
  }
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawPeople, setRawPeople] = useState<Person[]>(() => loadCache(CACHE_KEYS.people, INITIAL_PEOPLE));
  const [relationships, setRelationships] = useState<Relationship[]>(() => loadCache(CACHE_KEYS.relationships, INITIAL_RELATIONSHIPS));
  const [agendas, setAgendas] = useState<Agenda[]>(() => loadCache(CACHE_KEYS.agendas, INITIAL_AGENDAS));
  const [kabar, setKabar] = useState<Kabar[]>(() => loadCache(CACHE_KEYS.kabar, INITIAL_KABAR));
  const [cariyos, setCariyos] = useState<Cariyos[]>(() => loadCache(CACHE_KEYS.cariyos, INITIAL_CARIYOS));
  const [gallery, setGallery] = useState<GalleryItem[]>(() => loadCache(CACHE_KEYS.gallery, []));
  const [settings, setSettings] = useState<Settings>(() => loadCache(CACHE_KEYS.settings, INITIAL_SETTINGS));
  const [loading, setLoading] = useState<boolean>(true);

  // Firestore listeners
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    try {
      // Settings listener
      const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Settings;
          setSettings(data);
          saveCache(CACHE_KEYS.settings, data);
        }
      }, (error) => {
        console.warn('Settings onSnapshot listener note:', error);
      });
      unsubs.push(unsubSettings);

      // People listener
      const unsubPeople = onSnapshot(collection(db, 'people'), (snapshot) => {
        const list: Person[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Person);
        });
        setRawPeople(list);
        saveCache(CACHE_KEYS.people, list);
      }, (error) => {
        console.warn('People onSnapshot listener note:', error);
      });
      unsubs.push(unsubPeople);

      // Relationships listener
      const unsubRel = onSnapshot(collection(db, 'relationships'), (snapshot) => {
        const list: Relationship[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Relationship);
        });
        setRelationships(list);
        saveCache(CACHE_KEYS.relationships, list);
      }, (error) => {
        console.warn('Relationships onSnapshot listener note:', error);
      });
      unsubs.push(unsubRel);

      // Agendas listener (real-time sync across browsers)
      const unsubAgendas = onSnapshot(collection(db, 'agendas'), (snapshot) => {
        const list: Agenda[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Agenda);
        });
        list.sort((a, b) => b.date.localeCompare(a.date));
        setAgendas(list);
        saveCache(CACHE_KEYS.agendas, list);
      }, (error) => {
        console.warn('Agendas onSnapshot listener note:', error);
      });
      unsubs.push(unsubAgendas);

      // Kabar listener
      const unsubKabar = onSnapshot(collection(db, 'kabar'), (snapshot) => {
        const list: Kabar[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Kabar);
        });
        setKabar(list);
        saveCache(CACHE_KEYS.kabar, list);
      }, (error) => {
        console.warn('Kabar onSnapshot listener note:', error);
      });
      unsubs.push(unsubKabar);

      // Cariyos listener
      const unsubCariyos = onSnapshot(collection(db, 'cariyos'), (snapshot) => {
        const list: Cariyos[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Cariyos);
        });
        setCariyos(list);
        saveCache(CACHE_KEYS.cariyos, list);
      }, (error) => {
        console.warn('Cariyos onSnapshot listener note:', error);
      });
      unsubs.push(unsubCariyos);

      // Gallery listener
      const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
        const list: GalleryItem[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as GalleryItem);
        });
        if (list.length > 0) {
          list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        }
        setGallery(list);
        saveCache(CACHE_KEYS.gallery, list);
      }, (error) => {
        console.warn('Gallery onSnapshot listener note:', error);
      });
      unsubs.push(unsubGallery);

      setLoading(false);
    } catch (err) {
      console.error('Error attaching Firestore listeners:', err);
      setLoading(false);
    }

    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  // Compute genealogy (generations 0..18, branches from Wiwitan)
  const { peopleWithGen: people, branches } = useMemo(() => {
    return computeGenealogyData(rawPeople, relationships, settings.wiwitanPersonId);
  }, [rawPeople, relationships, settings.wiwitanPersonId]);

  const wiwitanPerson = useMemo(() => {
    return people.find(p => p.id === settings.wiwitanPersonId || p.isWiwitan);
  }, [people, settings.wiwitanPersonId]);

  // Seed helper: Only seeds on a completely fresh database, never overwrites or resurrects deleted data
  const seedInitialDataIfEmpty = async () => {
    try {
      const snapSettings = await getDoc(doc(db, 'settings', 'general'));
      if (snapSettings.exists()) {
        // System already initialized, never re-seed
        return;
      }

      const snapPeople = await getDocs(collection(db, 'people'));
      if (!snapPeople.empty) {
        // Data already exists, do not overwrite
        return;
      }

      console.log('Seeding initial data for fresh installation...');
      const batch = writeBatch(db);
      INITIAL_PEOPLE.forEach(p => batch.set(doc(db, 'people', p.id), cleanForFirestore(p)));
      INITIAL_RELATIONSHIPS.forEach(r => batch.set(doc(db, 'relationships', r.id), cleanForFirestore(r)));
      INITIAL_AGENDAS.forEach(a => batch.set(doc(db, 'agendas', a.id), cleanForFirestore(a)));
      INITIAL_KABAR.forEach(k => batch.set(doc(db, 'kabar', k.id), cleanForFirestore(k)));
      INITIAL_CARIYOS.forEach(c => batch.set(doc(db, 'cariyos', c.id), cleanForFirestore(c)));
      INITIAL_GALLERY.forEach(g => batch.set(doc(db, 'gallery', g.id), cleanForFirestore(g)));
      batch.set(doc(db, 'settings', 'general'), cleanForFirestore(INITIAL_SETTINGS));
      await batch.commit();
      console.log('Initial data seeded successfully.');
    } catch (err) {
      console.warn('Initial seeding note:', err);
    }
  };

  // Data contoh TIDAK lagi diisi otomatis: database baru diisi lewat
  // "Salin Data dari Database Lama" di panel Master Admin, supaya data contoh
  // tidak tercampur dengan data keluarga yang asli.

// Helper to recursively strip undefined values to prevent Firestore from throwing "Unsupported field value: undefined"
function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

  // Actions
  const addPerson = async (personData: Omit<Person, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = personData.id || `P_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPerson: Person = {
      ...personData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const sanitized = cleanForFirestore(newPerson);
      // Clean set without merge to ensure exact state persistence
      await setDoc(doc(db, 'people', id), sanitized);
      console.log('Anggota berhasil disimpan ke Firestore:', id);

      setRawPeople(prev => {
        const updated = [...prev.filter(p => p.id !== id), newPerson];
        saveCache(CACHE_KEYS.people, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error saving person to Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, `people/${id}`);
      throw error;
    }
  };

  const updatePerson = async (id: string, personData: Partial<Person>) => {
    const now = new Date().toISOString();
    const existing = rawPeople.find(p => p.id === id);
    const updated: Person = {
      ...(existing || {} as Person),
      ...personData,
      id,
      updatedAt: now,
    };

    // Remove keys that are explicitly set to undefined
    for (const key of Object.keys(personData)) {
      if ((personData as any)[key] === undefined) {
        delete (updated as any)[key];
      }
    }

    try {
      const sanitized = cleanForFirestore(updated);
      // Clean set without merge: true so cleared fields are removed from Firestore
      await setDoc(doc(db, 'people', id), sanitized);
      console.log('Anggota berhasil diupdate di Firestore:', id);

      setRawPeople(prev => {
        const list = prev.map(p => p.id === id ? updated : p);
        saveCache(CACHE_KEYS.people, list);
        return list;
      });
    } catch (error) {
      console.error('Error updating person in Firestore:', error);
      handleFirestoreError(error, OperationType.UPDATE, `people/${id}`);
      throw error;
    }
  };

  /**
   * Atomic Save for Person & All Related Parent/Spouse Relationships
   * Prevents multi-step race conditions, partial writes, and snapshot flapping.
   */
  const savePersonAndRelationships = async (
    personData: Omit<Person, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string },
    relsToAdd?: { parentIds: string[]; spouseIds: string[] }
  ) => {
    const now = new Date().toISOString();
    const id = personData.id;
    const existingPerson = rawPeople.find(p => p.id === id);

    const fullPerson: Person = {
      ...personData,
      id,
      createdAt: existingPerson?.createdAt || personData.createdAt || now,
      updatedAt: now,
    };

    try {
      const batch = writeBatch(db);
      const sanitizedPerson = cleanForFirestore(fullPerson);
      // Clean set without merge: true so any removed optional fields (e.g. occupation) are erased in Firestore
      batch.set(doc(db, 'people', id), sanitizedPerson);

      let updatedRels = [...relationships];

      if (relsToAdd) {
        // 1. Parent relationships: person2Id is the child (target), person1Id is parent
        const currentParentRels = relationships.filter(
          r => r.person2Id === id && r.type === 'PARENT'
        );

        // Delete parents no longer selected
        for (const rel of currentParentRels) {
          if (!relsToAdd.parentIds.includes(rel.person1Id)) {
            batch.delete(doc(db, 'relationships', rel.id));
            updatedRels = updatedRels.filter(r => r.id !== rel.id);
          }
        }

        // Add newly selected parents
        for (const parentId of relsToAdd.parentIds) {
          const exists = currentParentRels.some(r => r.person1Id === parentId);
          if (!exists) {
            const relId = `R_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const newRel: Relationship = {
              id: relId,
              person1Id: parentId,
              person2Id: id,
              type: 'PARENT',
              createdAt: now,
            };
            batch.set(doc(db, 'relationships', relId), cleanForFirestore(newRel));
            updatedRels.push(newRel);
          }
        }

        // 2. Spouse relationships: person1Id or person2Id is target
        const currentSpouseRels = relationships.filter(
          r => (r.person1Id === id || r.person2Id === id) && r.type === 'SPOUSE'
        );

        // Delete spouses no longer selected
        for (const rel of currentSpouseRels) {
          const partnerId = rel.person1Id === id ? rel.person2Id : rel.person1Id;
          if (!relsToAdd.spouseIds.includes(partnerId)) {
            batch.delete(doc(db, 'relationships', rel.id));
            updatedRels = updatedRels.filter(r => r.id !== rel.id);
          }
        }

        // Add newly selected spouses
        for (const spouseId of relsToAdd.spouseIds) {
          const exists = currentSpouseRels.some(
            r => (r.person1Id === spouseId && r.person2Id === id) ||
                 (r.person1Id === id && r.person2Id === spouseId)
          );
          if (!exists) {
            const relId = `R_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const newRel: Relationship = {
              id: relId,
              person1Id: id,
              person2Id: spouseId,
              type: 'SPOUSE',
              createdAt: now,
            };
            batch.set(doc(db, 'relationships', relId), cleanForFirestore(newRel));
            updatedRels.push(newRel);
          }
        }
      }

      // Execute atomic batch to Firestore
      await batch.commit();
      console.log('savePersonAndRelationships batch committed successfully for:', id);

      // Update state and cache simultaneously
      setRawPeople(prev => {
        const list = [...prev.filter(p => p.id !== id), fullPerson];
        saveCache(CACHE_KEYS.people, list);
        return list;
      });
      setRelationships(updatedRels);
      saveCache(CACHE_KEYS.relationships, updatedRels);
    } catch (error) {
      console.error('Error in savePersonAndRelationships batch:', error);
      handleFirestoreError(error, OperationType.WRITE, `people/${id}`);
      throw error;
    }
  };

  const deletePerson = async (id: string) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'people', id));

      // Local relationships to delete
      const relsToDelete = relationships.filter(r => r.person1Id === id || r.person2Id === id);
      for (const r of relsToDelete) {
        batch.delete(doc(db, 'relationships', r.id));
      }

      // Also query Firestore directly to ensure no orphaned relationships exist
      try {
        const q1 = query(collection(db, 'relationships'), where('person1Id', '==', id));
        const q2 = query(collection(db, 'relationships'), where('person2Id', '==', id));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        snap1.forEach(docSnap => batch.delete(docSnap.ref));
        snap2.forEach(docSnap => batch.delete(docSnap.ref));
      } catch (qErr) {
        console.warn('Relationship cleanup query note:', qErr);
      }

      // Atomic commit to Firestore
      await batch.commit();
      console.log('Anggota & relasi terkait berhasil dihapus dari Firestore:', id);

      // Update local state and cache
      const updatedPeople = rawPeople.filter(p => p.id !== id);
      const updatedRels = relationships.filter(r => r.person1Id !== id && r.person2Id !== id);

      setRawPeople(updatedPeople);
      saveCache(CACHE_KEYS.people, updatedPeople);
      setRelationships(updatedRels);
      saveCache(CACHE_KEYS.relationships, updatedRels);
    } catch (error) {
      console.error('Error deleting person from Firestore:', error);
      handleFirestoreError(error, OperationType.DELETE, `people/${id}`);
      throw error;
    }
  };

  const addRelationship = async (relData: Omit<Relationship, 'id' | 'createdAt'>) => {
    // Generate collision-free ID
    const id = `R_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRel: Relationship = {
      ...relData,
      id,
      createdAt: new Date().toISOString(),
    };

    try {
      const sanitized = cleanForFirestore(newRel);
      await setDoc(doc(db, 'relationships', id), sanitized);
      console.log('Relasi berhasil disimpan ke Firestore:', id);

      setRelationships(prev => {
        const list = [...prev.filter(r => r.id !== id), newRel];
        saveCache(CACHE_KEYS.relationships, list);
        return list;
      });
    } catch (error) {
      console.error('Error saving relationship to Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, `relationships/${id}`);
      throw error;
    }
  };

  const deleteRelationship = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'relationships', id));
      console.log('Relasi berhasil dihapus dari Firestore:', id);

      setRelationships(prev => {
        const list = prev.filter(r => r.id !== id);
        saveCache(CACHE_KEYS.relationships, list);
        return list;
      });
    } catch (error) {
      console.error('Error deleting relationship from Firestore:', error);
      handleFirestoreError(error, OperationType.DELETE, `relationships/${id}`);
      throw error;
    }
  };


  const addAgenda = async (agendaData: Omit<Agenda, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = `A${Date.now().toString().slice(-6)}`;
    const newAgenda: Agenda = {
      ...agendaData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Instantly update React state and save to cache immediately
    setAgendas(prev => {
      const updated = [newAgenda, ...prev.filter(a => a.id !== id)];
      saveCache(CACHE_KEYS.agendas, updated);
      return updated;
    });

    // 2. Persist to Firestore with undefined values safely stripped
    try {
      const sanitized = cleanForFirestore(newAgenda);
      await setDoc(doc(db, 'agendas', id), sanitized, { merge: true });
      console.log('Agenda successfully saved to Firestore:', id);
    } catch (error) {
      console.error('Error saving agenda to Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, `agendas/${id}`);
      throw error;
    }
  };

  const updateAgenda = async (id: string, agendaData: Partial<Agenda>) => {
    const now = new Date().toISOString();
    const updated = { ...agendaData, id, updatedAt: now };

    // 1. Instantly update local state and save to cache
    setAgendas(prev => {
      const newList = prev.map(a => a.id === id ? { ...a, ...updated } : a);
      saveCache(CACHE_KEYS.agendas, newList);
      return newList;
    });

    // 2. Persist to Firestore with merge: true (bulletproof against missing doc)
    try {
      const sanitized = cleanForFirestore(updated);
      await setDoc(doc(db, 'agendas', id), sanitized, { merge: true });
      console.log('Agenda successfully updated in Firestore:', id);
    } catch (error) {
      console.error('Error updating agenda in Firestore:', error);
      handleFirestoreError(error, OperationType.UPDATE, `agendas/${id}`);
      throw error;
    }
  };

  const deleteAgenda = async (id: string) => {
    // 1. Optimistic removal for instantaneous UI response and save to cache
    setAgendas(prev => {
      const newList = prev.filter(a => a.id !== id);
      saveCache(CACHE_KEYS.agendas, newList);
      return newList;
    });
    try {
      await deleteDoc(doc(db, 'agendas', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `agendas/${id}`);
      throw error;
    }
  };

  const addKabar = async (kabarData: Omit<Kabar, 'id' | 'createdAt'>) => {
    const id = `K${Date.now().toString().slice(-6)}`;
    const newKabar: Kabar = {
      ...kabarData,
      id,
      createdAt: new Date().toISOString(),
    };
    setKabar(prev => [newKabar, ...prev.filter(k => k.id !== id)]);
    try {
      await setDoc(doc(db, 'kabar', id), cleanForFirestore(newKabar));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `kabar/${id}`);
    }
  };

  const updateKabar = async (id: string, kabarData: Partial<Kabar>) => {
    setKabar(prev => prev.map(k => k.id === id ? { ...k, ...kabarData } : k));
    try {
      await updateDoc(doc(db, 'kabar', id), cleanForFirestore(kabarData));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `kabar/${id}`);
    }
  };

  const deleteKabar = async (id: string) => {
    setKabar(prev => prev.filter(k => k.id !== id));
    try {
      await deleteDoc(doc(db, 'kabar', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `kabar/${id}`);
    }
  };

  const addCariyos = async (cariyosData: Omit<Cariyos, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = `C${Date.now().toString().slice(-6)}`;
    const newCariyos: Cariyos = {
      ...cariyosData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setCariyos(prev => [newCariyos, ...prev.filter(c => c.id !== id)]);
    try {
      await setDoc(doc(db, 'cariyos', id), cleanForFirestore(newCariyos));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `cariyos/${id}`);
    }
  };

  const updateCariyos = async (id: string, cariyosData: Partial<Cariyos>) => {
    const now = new Date().toISOString();
    const updated = { ...cariyosData, updatedAt: now };
    setCariyos(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    try {
      await updateDoc(doc(db, 'cariyos', id), cleanForFirestore(updated));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cariyos/${id}`);
    }
  };

  const deleteCariyos = async (id: string) => {
    setCariyos(prev => prev.filter(c => c.id !== id));
    try {
      await deleteDoc(doc(db, 'cariyos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cariyos/${id}`);
    }
  };

  const addGalleryItem = async (data: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = `G_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem: GalleryItem = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const sanitized = cleanForFirestore(newItem);
      await setDoc(doc(db, 'gallery', id), sanitized);
      console.log('Foto galeri berhasil disimpan ke Firestore:', id);
      setGallery(prev => {
        const updated = [newItem, ...prev.filter(g => g.id !== id)];
        saveCache(CACHE_KEYS.gallery, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error saving gallery item:', error);
      handleFirestoreError(error, OperationType.WRITE, `gallery/${id}`);
      throw error;
    }
  };

  const updateGalleryItem = async (id: string, data: Partial<GalleryItem>) => {
    const now = new Date().toISOString();
    const existing = gallery.find(g => g.id === id);
    const updated: GalleryItem = {
      ...(existing || {} as GalleryItem),
      ...data,
      id,
      updatedAt: now,
    };
    for (const key of Object.keys(data)) {
      if ((data as any)[key] === undefined) {
        delete (updated as any)[key];
      }
    }
    try {
      const sanitized = cleanForFirestore(updated);
      await setDoc(doc(db, 'gallery', id), sanitized);
      console.log('Foto galeri berhasil diupdate di Firestore:', id);
      setGallery(prev => {
        const list = prev.map(g => g.id === id ? updated : g);
        saveCache(CACHE_KEYS.gallery, list);
        return list;
      });
    } catch (error) {
      console.error('Error updating gallery item:', error);
      handleFirestoreError(error, OperationType.UPDATE, `gallery/${id}`);
      throw error;
    }
  };

  const deleteGalleryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
      console.log('Foto galeri berhasil dihapus dari Firestore:', id);
      setGallery(prev => {
        const list = prev.filter(g => g.id !== id);
        saveCache(CACHE_KEYS.gallery, list);
        return list;
      });
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
      throw error;
    }
  };

  const updateSettings = async (settingsData: Partial<Settings>) => {
    const updated = { ...settings, ...settingsData, updatedAt: new Date().toISOString() };
    setSettings(updated);
    try {
      await setDoc(doc(db, 'settings', 'general'), cleanForFirestore(updated));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    }
  };

  const setWiwitan = async (personId: string) => {
    await updateSettings({ wiwitanPersonId: personId });
    // Also toggle isWiwitan on the person
    const person = rawPeople.find(p => p.id === personId);
    if (person) {
      await updatePerson(personId, { isWiwitan: true, isDescendant: true });
    }
  };

  return (
    <FamilyContext.Provider
      value={{
        people,
        relationships,
        agendas,
        kabar,
        cariyos,
        gallery,
        settings,
        branches,
        wiwitanPerson,
        loading,
        addPerson,
        updatePerson,
        deletePerson,
        savePersonAndRelationships,
        addRelationship,
        deleteRelationship,
        addAgenda,
        updateAgenda,
        deleteAgenda,
        addKabar,
        updateKabar,
        deleteKabar,
        addCariyos,
        updateCariyos,
        deleteCariyos,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        updateSettings,
        setWiwitan,
        seedInitialDataIfEmpty,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
