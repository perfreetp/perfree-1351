export interface CollectionItem {
  id: string;
  characterName: string;
  seriesName: string;
  scale: string;
  manufacturer: string;
  purchasePrice: number;
  purchaseDate: string;
  photos: string[];
  displayLocation: string;
  isUnboxed: boolean;
  reservationDate?: string;
  balanceDueDate?: string;
  hasArrived: boolean;
  arrivalDate?: string;
  flaws: FlawRecord[];
  replacementParts: ReplacementPart[];
  maintenanceRecords: MaintenanceRecord[];
  notes: string;
  createdAt: string;
  sortOrder: number;
  cabinetPosition?: CabinetPosition;
}

export interface CabinetPosition {
  cabinet: string;
  shelf: number;
  position: number;
}

export interface FlawRecord {
  id: string;
  description: string;
  date: string;
  photos: string[];
  status: 'pending' | 'resolved';
}

export interface ReplacementPart {
  id: string;
  description: string;
  applyDate: string;
  receivedDate?: string;
  status: 'pending' | 'received';
}

export interface MaintenanceRecord {
  id: string;
  type: 'dust' | 'light_protection' | 'other';
  date: string;
  description: string;
}

export interface MaintenanceReminder {
  id: string;
  collectionId: string;
  collectionName: string;
  type: 'dust' | 'light_protection';
  nextDate: string;
  intervalDays: number;
}

export interface TimelineEvent {
  id: string;
  collectionId: string;
  collectionName: string;
  date: string;
  type: 'dust' | 'light_protection' | 'other' | 'flaw' | 'part' | 'arrival' | 'unbox' | 'purchase';
  description: string;
  status?: string;
}

export interface Statistics {
  totalCount: number;
  totalSpent: number;
  unboxedCount: number;
  pendingArrivalCount: number;
  bySeries: { name: string; count: number; spent: number }[];
  byManufacturer: { name: string; count: number; spent: number }[];
  byYear: { year: string; count: number; spent: number }[];
  monthlyTrend: { month: string; count: number; spent: number }[];
}
