import type { Checklist } from '../types/Checklist';

const STORAGE_KEY = 'sjekklisteapp_checklists';

export class StorageService {
  private static instance: StorageService;
  private storage: Storage;

  private constructor() {
    this.storage = window.localStorage;
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public saveChecklist(checklist: Checklist): void {
    const checklists = this.getAllChecklists();
    const existingIndex = checklists.findIndex(c => c.id === checklist.id);
    
    if (existingIndex >= 0) {
      checklists[existingIndex] = checklist;
    } else {
      checklists.push(checklist);
    }

    this.storage.setItem(STORAGE_KEY, JSON.stringify(checklists));
  }

  public getAllChecklists(): Checklist[] {
    const data = this.storage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  public getChecklistById(id: string): Checklist | null {
    const checklists = this.getAllChecklists();
    return checklists.find(c => c.id === id) || null;
  }

  public deleteChecklist(id: string): void {
    const checklists = this.getAllChecklists().filter(c => c.id !== id);
    this.storage.setItem(STORAGE_KEY, JSON.stringify(checklists));
  }

  public clearAllChecklists(): void {
    this.storage.removeItem(STORAGE_KEY);
  }
}

export const storageService = StorageService.getInstance(); 