import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { CatalogItem } from '../../domain/models';
import { getFirebaseFirestore, getFirebaseStorage } from '../firebase';
import { readCatalogCache, replaceCatalogCache } from '../sqliteDatabase';

export type CatalogKind = 'services' | 'barbers' | 'promotions';

export const DEFAULT_CATALOG: Record<CatalogKind, CatalogItem[]> = {
  services: [
    { id: 'low-fade', name: 'Low Fade', description: 'Degradado bajo y limpio, cerca de la parte inferior.', price: '', discount: '' },
    { id: 'mullet', name: 'Mullet', description: 'Laterales y frente cortos; la parte trasera queda más larga.', price: '', discount: '' },
    { id: 'taper', name: 'Taper', description: 'Degradado clásico y sutil en patillas y nuca.', price: '', discount: '' },
    { id: 'custom-cut', name: 'Corte personalizado', description: 'Cuéntanos el corte que tienes en mente.', price: '', discount: '' },
  ],
  barbers: [
    { id: 'messi', name: 'Messi', description: 'Precisión y estilo clásico', price: '', discount: '', photoUrl: null, photoPath: null, isOccupied: false },
    { id: 'ronaldo', name: 'Ronaldo', description: 'Detalle y acabado definido', price: '', discount: '', photoUrl: null, photoPath: null, isOccupied: false },
    { id: 'neymar', name: 'Neymar', description: 'Creatividad para tu próximo look', price: '', discount: '', photoUrl: null, photoPath: null, isOccupied: false },
  ],
  promotions: [
    { id: 'fade-day', name: 'Día de Fade', description: 'Dale un nuevo acabado a tu Low Fade.', price: '', discount: '15% de descuento' },
    { id: 'full-style', name: 'Cambio de estilo', description: 'Anímate a probar un Mullet o un Taper.', price: '', discount: '10% de descuento' },
    { id: 'first-visit', name: 'Primera visita', description: 'Un detalle especial para conocer la barbería.', price: '', discount: 'Bebida de cortesía' },
  ],
};

export function createCatalogId(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export class FirestoreCatalogRepository {
  private cacheWriteQueue: Promise<void> = Promise.resolve();
  private db() { return getFirebaseFirestore(); }

  subscribe(kind: CatalogKind, listener: (items: CatalogItem[], fromCache: boolean) => void, onError: (error: Error) => void): Unsubscribe {
    return onSnapshot(collection(this.db(), kind), (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CatalogItem)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
      const fromCache = snapshot.metadata.fromCache;
      listener(items, fromCache);
      if (!fromCache) {
        const task = this.cacheWriteQueue.then(() => replaceCatalogCache(kind, items));
        this.cacheWriteQueue = task.then(() => undefined, () => undefined);
      }
    }, (error) => onError(error));
  }

  getCached(kind: CatalogKind) {
    return readCatalogCache(kind);
  }

  async list(kind: CatalogKind): Promise<CatalogItem[]> {
    const snapshot = await getDocs(collection(this.db(), kind));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CatalogItem)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async seedDefaultsIfEmpty(kind: CatalogKind) {
    const items = await this.list(kind);
    if (items.length) return items;
    for (const item of DEFAULT_CATALOG[kind]) {
      const { id, ...data } = item;
      await setDoc(doc(this.db(), kind, id), data);
    }
    return this.list(kind);
  }

  async save(kind: CatalogKind, item: CatalogItem) {
    const { id, ...data } = item;
    await setDoc(doc(this.db(), kind, id), data);
  }

  async remove(kind: CatalogKind, id: string) {
    await deleteDoc(doc(this.db(), kind, id));
  }

  async uploadBarberPhoto(id: string, uri: string) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `barbers/${id}/${Date.now()}.jpg`;
    const photoRef = ref(getFirebaseStorage(), path);
    await uploadBytes(photoRef, blob, { contentType: blob.type || 'image/jpeg' });
    return { photoUrl: await getDownloadURL(photoRef), photoPath: path };
  }

  async deleteBarberPhoto(path: string) {
    await deleteObject(ref(getFirebaseStorage(), path));
  }
}
