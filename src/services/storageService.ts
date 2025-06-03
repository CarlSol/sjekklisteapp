import type { Checklist } from '../types/Checklist';

const DB_NAME = 'sjekklisteapp_db';
const DB_VERSION = 1;
const CHECKLISTS_STORE = 'checklists';
const IMAGES_STORE = 'images';

class StorageService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Opprett checklists store
        if (!db.objectStoreNames.contains(CHECKLISTS_STORE)) {
          db.createObjectStore(CHECKLISTS_STORE, { keyPath: 'id' });
        }
        
        // Opprett images store
        if (!db.objectStoreNames.contains(IMAGES_STORE)) {
          db.createObjectStore(IMAGES_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  private async waitForDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  async saveChecklist(checklist: Checklist): Promise<void> {
    const db = await this.waitForDB();
    
    // Lagre sjekkliste uten bilder
    const checklistWithoutImages = {
      ...checklist,
      items: checklist.items.map(item => ({
        ...item,
        images: [] // Fjern bildereferanser fra sjekklisten
      }))
    };

    // Lagre bilder separat
    for (const item of checklist.items) {
      for (let i = 0; i < item.images.length; i++) {
        const imageId = `${checklist.id}_${item.id}_${i}`;
        await this.saveImage(imageId, item.images[i]);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHECKLISTS_STORE], 'readwrite');
      const store = transaction.objectStore(CHECKLISTS_STORE);
      const request = store.put(checklistWithoutImages);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async saveImage(id: string, imageData: string): Promise<void> {
    const db = await this.waitForDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGES_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.put({ id, data: imageData });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getChecklistById(id: string): Promise<Checklist | null> {
    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHECKLISTS_STORE, IMAGES_STORE], 'readonly');
      const checklistStore = transaction.objectStore(CHECKLISTS_STORE);
      const imagesStore = transaction.objectStore(IMAGES_STORE);
      
      const request = checklistStore.get(id);
      
      request.onsuccess = async () => {
        const checklist = request.result;
        if (!checklist) {
          resolve(null);
          return;
        }

        // Hent bilder for hvert punkt
        const itemsWithImages = await Promise.all(
          checklist.items.map(async (item: any) => {
            const images = [];
            for (let i = 0; i < 10; i++) { // Anta maks 10 bilder per punkt
              const imageId = `${id}_${item.id}_${i}`;
              try {
                const image = await new Promise((resolve, reject) => {
                  const request = imagesStore.get(imageId);
                  request.onsuccess = () => resolve(request.result);
                  request.onerror = () => reject(request.error);
                });
                if (image) {
                  images.push((image as any).data);
                }
              } catch (error) {
                console.error('Error loading image:', error);
              }
            }
            return { ...item, images };
          })
        );

        resolve({
          ...checklist,
          items: itemsWithImages
        });
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAllChecklists(): Promise<Checklist[]> {
    const db = await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHECKLISTS_STORE], 'readonly');
      const store = transaction.objectStore(CHECKLISTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChecklist(id: string): Promise<void> {
    const db = await this.waitForDB();
    
    // Slett alle bilder for denne sjekklisten
    const checklist = await this.getChecklistById(id);
    if (checklist) {
      for (const item of checklist.items) {
        for (let i = 0; i < item.images.length; i++) {
          const imageId = `${id}_${item.id}_${i}`;
          await this.deleteImage(imageId);
        }
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHECKLISTS_STORE], 'readwrite');
      const store = transaction.objectStore(CHECKLISTS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteImage(id: string): Promise<void> {
    const db = await this.waitForDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGES_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imageData = e.target?.result as string;
          const imageId = `image_${Date.now()}`;
          await this.saveImage(imageId, imageData);
          resolve(imageData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}

export const storageService = new StorageService(); 