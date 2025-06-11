export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  images: string[];
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  category: string;
  checkPoint: string;
  timestamp: string;
  inspectors: string[];
  frequency: string;
  status: 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | 'Ja' | 'Nei' | 'Behov ikke funnet' | null;
}

export interface Checklist {
  id: string;
  title?: string;
  items: ChecklistItem[];
  timestamp: string;
  inspector?: string;
  status?: 'draft' | 'completed' | 'sent';
  solparkName?: string;
  areaNumber?: string;
  inspectionDate?: string;
  inspectors?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChecklistFormData {
  title: string;
  inspector: string;
  items: ChecklistItem[];
}

export type InspectionReport = {
  checklist: Checklist;
  pdfUrl?: string;
  sentTo: string;
  sentAt?: string;
}; 