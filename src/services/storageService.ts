import type { Checklist } from '../types/Checklist';

const STORAGE_PREFIX = 'sjekkliste_';

export function saveChecklist(checklist: Checklist): void {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${checklist.id}`,
      JSON.stringify(checklist)
    );
  } catch (error) {
    console.error('Feil ved lagring av sjekkliste:', error);
    throw error;
  }
}

export function getChecklist(id: string): Checklist | null {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Feil ved henting av sjekkliste:', error);
    return null;
  }
}

export function getAllChecklists(): Checklist[] {
  try {
    const checklists: Checklist[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          checklists.push(JSON.parse(data));
        }
      }
    }
    return checklists;
  } catch (error) {
    console.error('Feil ved henting av alle sjekklister:', error);
    return [];
  }
}

export function deleteChecklist(id: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
  } catch (error) {
    console.error('Feil ved sletting av sjekkliste:', error);
    throw error;
  }
}

export function clearAllChecklists(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Feil ved sletting av alle sjekklister:', error);
    throw error;
  }
} 