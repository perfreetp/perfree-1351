import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { CollectionItem, MaintenanceReminder, FlawRecord, ReplacementPart, MaintenanceRecord } from '../types/collection';
import { mockCollections, mockReminders } from '../data/mockData';

const STORAGE_KEY_COLLECTIONS = 'figure_collections';
const STORAGE_KEY_REMINDERS = 'figure_reminders';
const STORAGE_KEY_CABINET_ORDER = 'figure_cabinet_order';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = Taro.getStorageSync(key);
    if (stored) {
      return JSON.parse(stored as string) as T;
    }
  } catch (e) {
    console.error('[Storage] Failed to load:', key, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Storage] Failed to save:', key, e);
  }
}

interface CollectionContextType {
  collections: CollectionItem[];
  reminders: MaintenanceReminder[];
  selectedSeries: string | null;
  setSelectedSeries: (series: string | null) => void;
  getCollectionById: (id: string) => CollectionItem | undefined;
  getCollectionsBySeries: (series: string) => CollectionItem[];
  addCollection: (item: Omit<CollectionItem, 'id' | 'createdAt' | 'sortOrder'>) => void;
  updateCollection: (id: string, updates: Partial<CollectionItem>) => void;
  deleteCollection: (id: string) => void;
  completeMaintenance: (reminderId: string) => void;
  addMaintenanceRecord: (collectionId: string, record: Omit<MaintenanceRecord, 'id'>) => void;
  addFlawRecord: (collectionId: string, record: Omit<FlawRecord, 'id'>) => void;
  addReplacementPart: (collectionId: string, record: Omit<ReplacementPart, 'id'>) => void;
  updateFlawStatus: (collectionId: string, flawId: string, status: 'pending' | 'resolved') => void;
  updatePartStatus: (collectionId: string, partId: string, status: 'pending' | 'received') => void;
  getSeriesList: () => string[];
  sortType: 'default' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'showcase';
  setSortType: (type: 'default' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'showcase') => void;
  cabinetOrder: string[];
  setCabinetOrder: (order: string[]) => void;
  markArrived: (id: string) => void;
  markBalancePaid: (id: string) => void;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collections, setCollections] = useState<CollectionItem[]>(() =>
    loadFromStorage(STORAGE_KEY_COLLECTIONS, mockCollections)
  );
  const [reminders, setReminders] = useState<MaintenanceReminder[]>(() =>
    loadFromStorage(STORAGE_KEY_REMINDERS, mockReminders)
  );
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'default' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'showcase'>('default');
  const [cabinetOrder, setCabinetOrderState] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEY_CABINET_ORDER, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEY_COLLECTIONS, collections);
  }, [collections]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_REMINDERS, reminders);
  }, [reminders]);

  const setCabinetOrder = useCallback((order: string[]) => {
    setCabinetOrderState(order);
    saveToStorage(STORAGE_KEY_CABINET_ORDER, order);
  }, []);

  const getCollectionById = useCallback((id: string) => {
    return collections.find(item => item.id === id);
  }, [collections]);

  const getCollectionsBySeries = useCallback((series: string) => {
    return collections.filter(item => item.seriesName === series);
  }, [collections]);

  const addCollection = useCallback((item: Omit<CollectionItem, 'id' | 'createdAt' | 'sortOrder'>) => {
    const newItem: CollectionItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      sortOrder: collections.length + 1
    };
    setCollections(prev => [...prev, newItem]);

    if (newItem.hasArrived && newItem.isUnboxed) {
      const newReminder: MaintenanceReminder = {
        id: `rem_${Date.now()}`,
        collectionId: newItem.id,
        collectionName: newItem.characterName,
        type: 'dust',
        nextDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        intervalDays: 30
      };
      setReminders(prev => [...prev, newReminder]);
    }

    console.log('[Collection] Added new collection:', newItem);
  }, [collections.length]);

  const updateCollection = useCallback((id: string, updates: Partial<CollectionItem>) => {
    setCollections(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
    console.log('[Collection] Updated collection:', id, updates);
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setCollections(prev => prev.filter(item => item.id !== id));
    setReminders(prev => prev.filter(r => r.collectionId !== id));
    setCabinetOrderState(prev => prev.filter(itemId => itemId !== id));
    console.log('[Collection] Deleted collection:', id);
  }, []);

  const completeMaintenance = useCallback((reminderId: string) => {
    let completedReminder: MaintenanceReminder | undefined;
    setReminders(prev => prev.map(r => {
      if (r.id === reminderId) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + r.intervalDays);
        completedReminder = r;
        return { ...r, nextDate: nextDate.toISOString().split('T')[0] };
      }
      return r;
    }));

    if (completedReminder) {
      const record: MaintenanceRecord = {
        id: `mr_${Date.now()}`,
        type: completedReminder.type,
        date: new Date().toISOString().split('T')[0],
        description: completedReminder.type === 'dust' ? '定期除尘保养' : '检查避光措施'
      };
      setCollections(prev => prev.map(item => {
        if (item.id === completedReminder!.collectionId) {
          return { ...item, maintenanceRecords: [...item.maintenanceRecords, record] };
        }
        return item;
      }));
    }
    console.log('[Maintenance] Completed reminder:', reminderId);
  }, []);

  const addMaintenanceRecord = useCallback((collectionId: string, record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `mr_${Date.now()}`
    };
    setCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        return { ...item, maintenanceRecords: [...item.maintenanceRecords, newRecord] };
      }
      return item;
    }));
    console.log('[Collection] Added maintenance record:', collectionId, newRecord);
  }, []);

  const addFlawRecord = useCallback((collectionId: string, record: Omit<FlawRecord, 'id'>) => {
    const newRecord: FlawRecord = {
      ...record,
      id: `flaw_${Date.now()}`
    };
    setCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        return { ...item, flaws: [...item.flaws, newRecord] };
      }
      return item;
    }));
    console.log('[Collection] Added flaw record:', collectionId, newRecord);
  }, []);

  const addReplacementPart = useCallback((collectionId: string, record: Omit<ReplacementPart, 'id'>) => {
    const newRecord: ReplacementPart = {
      ...record,
      id: `part_${Date.now()}`
    };
    setCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        return { ...item, replacementParts: [...item.replacementParts, newRecord] };
      }
      return item;
    }));
    console.log('[Collection] Added replacement part:', collectionId, newRecord);
  }, []);

  const updateFlawStatus = useCallback((collectionId: string, flawId: string, status: 'pending' | 'resolved') => {
    setCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        return {
          ...item,
          flaws: item.flaws.map(f => f.id === flawId ? { ...f, status } : f)
        };
      }
      return item;
    }));
  }, []);

  const updatePartStatus = useCallback((collectionId: string, partId: string, status: 'pending' | 'received') => {
    setCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        return {
          ...item,
          replacementParts: item.replacementParts.map(p =>
            p.id === partId ? { ...p, status, receivedDate: status === 'received' ? new Date().toISOString().split('T')[0] : p.receivedDate } : p
          )
        };
      }
      return item;
    }));
  }, []);

  const markArrived = useCallback((id: string) => {
    setCollections(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          hasArrived: true,
          arrivalDate: new Date().toISOString().split('T')[0],
          isUnboxed: false,
          displayLocation: item.displayLocation === '待到货' ? '待摆放' : item.displayLocation
        };
      }
      return item;
    }));
    console.log('[Collection] Marked arrived:', id);
  }, []);

  const markBalancePaid = useCallback((id: string) => {
    setCollections(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, balanceDueDate: undefined };
      }
      return item;
    }));
    console.log('[Collection] Marked balance paid:', id);
  }, []);

  const getSeriesList = useCallback(() => {
    const seriesSet = new Set(collections.map(item => item.seriesName));
    return Array.from(seriesSet);
  }, [collections]);

  const sortedCollections = useMemo(() => {
    let result = [...collections];
    if (selectedSeries) {
      result = result.filter(item => item.seriesName === selectedSeries);
    }
    switch (sortType) {
      case 'price_asc':
        result.sort((a, b) => a.purchasePrice - b.purchasePrice);
        break;
      case 'price_desc':
        result.sort((a, b) => b.purchasePrice - a.purchasePrice);
        break;
      case 'date_asc':
        result.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
        break;
      case 'date_desc':
        result.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
        break;
      case 'showcase':
        if (cabinetOrder.length > 0) {
          result.sort((a, b) => {
            const aIndex = cabinetOrder.indexOf(a.id);
            const bIndex = cabinetOrder.indexOf(b.id);
            if (aIndex === -1 && bIndex === -1) return a.sortOrder - b.sortOrder;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          });
        } else {
          result.sort((a, b) => a.sortOrder - b.sortOrder);
        }
        break;
      default:
        result.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return result;
  }, [collections, selectedSeries, sortType, cabinetOrder]);

  return (
    <CollectionContext.Provider value={{
      collections: sortedCollections,
      reminders,
      selectedSeries,
      setSelectedSeries,
      getCollectionById,
      getCollectionsBySeries,
      addCollection,
      updateCollection,
      deleteCollection,
      completeMaintenance,
      addMaintenanceRecord,
      addFlawRecord,
      addReplacementPart,
      updateFlawStatus,
      updatePartStatus,
      getSeriesList,
      sortType,
      setSortType,
      cabinetOrder,
      setCabinetOrder,
      markArrived,
      markBalancePaid
    }}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
};
