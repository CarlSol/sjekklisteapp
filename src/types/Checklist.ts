export type ChecklistItem = {
  id: string;
  category: string;
  checkPoint: string;
  frequency: string;
  status: 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | null;
  notes: string;
  imageRefs: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  inspector: string;
};

export type Checklist = {
  id: string;
  solparkName: string;
  areaNumber: number;
  inspectionDate: string;
  inspectors: string[];
  weatherConditions: string;
  generalCondition: string;
  items: ChecklistItem[];
  status: 'draft' | 'completed' | 'sent';
  createdAt: string;
  updatedAt: string;
};

export type InspectionReport = {
  checklist: Checklist;
  pdfUrl?: string;
  sentTo: string;
  sentAt?: string;
}; 