export interface CollectionItem {
  id: string;
  characterName: string;
  seriesName: string;
  scale: string;
  manufacturer: string;
  material?: string;
  purchasePrice: number;
  currentValue?: number;
  salePrice?: number;
  purchaseDate: string;
  photos: string[];
  coverPhotoIndex: number;
  displayLocation: string;
  isUnboxed: boolean;
  unboxedDate?: string;
  reservationDate?: string;
  balanceDueDate?: string;
  hasArrived: boolean;
  arrivalDate?: string;
  collectionStatus: 'in_cabinet' | 'loaned' | 'sold' | 'pending_confirm';
  inventoryStatus?: 'checked' | 'mismatch' | 'unchecked';
  lastInventoryDate?: string;
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
  material?: string;
  seriesName?: string;
}

export interface MaintenanceTemplate {
  id: string;
  name: string;
  material?: string;
  seriesName?: string;
  dustIntervalDays: number;
  lightProtectionIntervalDays: number;
}

export interface InventoryRecord {
  id: string;
  date: string;
  cabinet: string;
  items: InventoryCheckItem[];
  completedAt?: string;
}

export interface InventoryCheckItem {
  collectionId: string;
  collectionName: string;
  expectedStatus: 'in_cabinet' | 'loaned' | 'sold' | 'pending_confirm';
  actualStatus: 'in_cabinet' | 'loaned' | 'sold' | 'pending_confirm';
  isMatch: boolean;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  collectionId: string;
  collectionName: string;
  date: string;
  type: 'dust' | 'light_protection' | 'other' | 'flaw' | 'part' | 'arrival' | 'unbox' | 'purchase' | 'sold' | 'inventory';
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
