import type { Checklist } from '../types/Checklist';
import { storageService } from './storageService';

export class ChecklistService {
  async updateChecklist(checklist: Checklist): Promise<void> {
    await storageService.saveChecklist(checklist);
  }

  async getChecklist(): Promise<Checklist | null> {
    return null;
  }
}

export const checklistService = new ChecklistService(); 