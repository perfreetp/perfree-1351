import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { CollectionItem, MaintenanceReminder, FlawRecord, ReplacementPart, MaintenanceRecord, CabinetPosition, TimelineEvent, MaintenanceTemplate, InventoryRecord, InventoryCheckItem } from '../types/collection';
import { mockCollections, mockReminders } from '../data/mockData';
import { formatPrice } from '../utils';

const STORAGE_KEY_COLLECTIONS = 'figure_collections';
const STORAGE_KEY_REMINDERS = 'figure_reminders';
const STORAGE_KEY_CABINET_LAYOUT = 'figure_cabinet_layout';
const STORAGE_KEY_TEMPLATES = 'figure_maintenance_templates';
const STORAGE_KEY_INVENTORIES = 'figure_inventories';

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

async function persistPhoto(tempPath: string): Promise<string> {
  if (!tempPath.startsWith('http') && !tempPath.startsWith('wxfile://') && !tempPath.startsWith('/')) {
    return tempPath;
  }
  if (tempPath.startsWith('http')) {
    return tempPath;
  }
  try {
    const res = await Taro.saveFile({ tempFilePath: tempPath });
    return res.savedFilePath;
  } catch (e) {
    console.error('[Photo] Failed to persist:', tempPath, e);
    return tempPath;
  }
}

interface CabinetLayout {
  [cabinetName: string]: {
    [shelfNum: number]: string[];
  };
}

interface CollectionContextType {
  allCollections: CollectionItem[];
  collections: CollectionItem[];
  reminders: MaintenanceReminder[];
  maintenanceTemplates: MaintenanceTemplate[];
  inventoryRecords: InventoryRecord[];
  showcaseSeries: string | null;
  setShowcaseSeries: (series: string | null) => void;
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
  cabinetLayout: CabinetLayout;
  setCabinetLayout: (layout: CabinetLayout) => void;
  markArrived: (id: string) => void;
  markBalancePaid: (id: string) => void;
  addPhotos: (collectionId: string, tempPaths: string[]) => Promise<void>;
  removePhoto: (collectionId: string, photoIndex: number) => void;
  setCoverPhoto: (collectionId: string, photoIndex: number) => void;
  getCoverPhoto: (item: CollectionItem) => string;
  getTimeline: (collectionId?: string) => TimelineEvent[];
  markUnboxed: (id: string) => void;
  addMaintenanceTemplate: (template: Omit<MaintenanceTemplate, 'id'>) => void;
  updateMaintenanceTemplate: (id: string, updates: Partial<MaintenanceTemplate>) => void;
  deleteMaintenanceTemplate: (id: string) => void;
  applyTemplateToCollection: (collectionId: string, templateId: string) => void;
  startInventory: (cabinet: string) => InventoryRecord;
  updateInventoryItem: (inventoryId: string, itemId: string, actualStatus: CollectionItem['collectionStatus'], notes?: string) => void;
  completeInventory: (inventoryId: string) => void;
  getLatestInventoryDate: () => string | null;
  getInventoryDiscrepancies: (inventoryId: string) => InventoryCheckItem[];
  getActiveCollections: () => CollectionItem[];
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

function migrateItem(item: any): CollectionItem {
  return {
    ...item,
    coverPhotoIndex: item.coverPhotoIndex ?? 0,
    collectionStatus: item.collectionStatus ?? 'in_cabinet',
    currentValue: item.currentValue,
    salePrice: item.salePrice,
    unboxedDate: item.unboxedDate,
    material: item.material,
    inventoryStatus: item.inventoryStatus,
    lastInventoryDate: item.lastInventoryDate,
  };
}

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawCollections, setRawCollections] = useState<any[]>(() =>
    loadFromStorage(STORAGE_KEY_COLLECTIONS, mockCollections)
  );
  const [reminders, setReminders] = useState<MaintenanceReminder[]>(() =>
    loadFromStorage(STORAGE_KEY_REMINDERS, mockReminders)
  );
  const [showcaseSeries, setShowcaseSeries] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'default' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'showcase'>('default');
  const [cabinetLayout, setCabinetLayoutState] = useState<CabinetLayout>(() =>
    loadFromStorage(STORAGE_KEY_CABINET_LAYOUT, {})
  );
  const [maintenanceTemplates, setMaintenanceTemplates] = useState<MaintenanceTemplate[]>(() =>
    loadFromStorage(STORAGE_KEY_TEMPLATES, [])
  );
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>(() =>
    loadFromStorage(STORAGE_KEY_INVENTORIES, [])
  );

  const allCollections = useMemo(() => rawCollections.map(migrateItem), [rawCollections]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_COLLECTIONS, rawCollections);
  }, [rawCollections]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_REMINDERS, reminders);
  }, [reminders]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_TEMPLATES, maintenanceTemplates);
  }, [maintenanceTemplates]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_INVENTORIES, inventoryRecords);
  }, [inventoryRecords]);

  const setCabinetLayout = useCallback((layout: CabinetLayout) => {
    setCabinetLayoutState(layout);
    saveToStorage(STORAGE_KEY_CABINET_LAYOUT, layout);
  }, []);

  const getCollectionById = useCallback((id: string) => {
    return allCollections.find(item => item.id === id);
  }, [allCollections]);

  const getCollectionsBySeries = useCallback((series: string) => {
    return allCollections.filter(item => item.seriesName === series);
  }, [allCollections]);

  const getActiveCollections = useCallback(() => {
    return allCollections.filter(item => item.collectionStatus !== 'sold');
  }, [allCollections]);

  const addCollection = useCallback((item: Omit<CollectionItem, 'id' | 'createdAt' | 'sortOrder'>) => {
    const newItem: CollectionItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      sortOrder: rawCollections.length + 1
    };
    setRawCollections(prev => [...prev, newItem]);

    if (newItem.hasArrived && newItem.isUnboxed) {
      const template = maintenanceTemplates.find(t =>
        t.material === newItem.material || t.seriesName === newItem.seriesName
      );
      const dustDays = template?.dustIntervalDays || 30;
      const newReminder: MaintenanceReminder = {
        id: `rem_${Date.now()}`,
        collectionId: newItem.id,
        collectionName: newItem.characterName,
        type: 'dust',
        nextDate: new Date(Date.now() + dustDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        intervalDays: dustDays,
        material: newItem.material,
        seriesName: newItem.seriesName
      };
      setReminders(prev => [...prev, newReminder]);
    }

    console.log('[Collection] Added new collection:', newItem);
  }, [rawCollections.length, maintenanceTemplates]);

  const updateCollection = useCallback((id: string, updates: Partial<CollectionItem>) => {
    setRawCollections(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
    console.log('[Collection] Updated collection:', id, updates);
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setRawCollections(prev => prev.filter(item => item.id !== id));
    setReminders(prev => prev.filter(r => r.collectionId !== id));
    setCabinetLayoutState(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(cabinet => {
        Object.keys(next[cabinet]).forEach(shelf => {
          next[cabinet][Number(shelf)] = next[cabinet][Number(shelf)].filter(itemId => itemId !== id);
        });
      });
      return next;
    });
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
      setRawCollections(prev => prev.map(item => {
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
    setRawCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        return { ...item, maintenanceRecords: [...item.maintenanceRecords, newRecord] };
      }
      return item;
    }));

    const matchingReminder = reminders.find(r => r.collectionId === collectionId && r.type === record.type);
    if (matchingReminder) {
      setReminders(prev => prev.map(r => {
        if (r.id === matchingReminder.id) {
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + r.intervalDays);
          return { ...r, nextDate: nextDate.toISOString().split('T')[0] };
        }
        return r;
      }));
    }

    console.log('[Collection] Added maintenance record:', collectionId, newRecord);
  }, [reminders]);

  const addFlawRecord = useCallback((collectionId: string, record: Omit<FlawRecord, 'id'>) => {
    const newRecord: FlawRecord = {
      ...record,
      id: `flaw_${Date.now()}`
    };
    setRawCollections(prev => prev.map(item => {
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
    setRawCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        return { ...item, replacementParts: [...item.replacementParts, newRecord] };
      }
      return item;
    }));
    console.log('[Collection] Added replacement part:', collectionId, newRecord);
  }, []);

  const updateFlawStatus = useCallback((collectionId: string, flawId: string, status: 'pending' | 'resolved') => {
    setRawCollections(prev => prev.map(item => {
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
    setRawCollections(prev => prev.map(item => {
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
    setRawCollections(prev => prev.map(item => {
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
    setRawCollections(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, balanceDueDate: undefined };
      }
      return item;
    }));
    console.log('[Collection] Marked balance paid:', id);
  }, []);

  const markUnboxed = useCallback((id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setRawCollections(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isUnboxed: true, unboxedDate: today };
      }
      return item;
    }));
    console.log('[Collection] Marked unboxed:', id, today);
  }, []);

  const addPhotos = useCallback(async (collectionId: string, tempPaths: string[]) => {
    const savedPaths: string[] = [];
    for (const path of tempPaths) {
      const saved = await persistPhoto(path);
      savedPaths.push(saved);
    }
    setRawCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        const newPhotos = [...item.photos, ...savedPaths].slice(0, 9);
        return { ...item, photos: newPhotos };
      }
      return item;
    }));
    console.log('[Collection] Added photos:', collectionId, savedPaths);
  }, []);

  const removePhoto = useCallback((collectionId: string, photoIndex: number) => {
    setRawCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        const newPhotos = item.photos.filter((_, i) => i !== photoIndex);
        const newCoverIndex = Math.min(item.coverPhotoIndex, Math.max(0, newPhotos.length - 1));
        return { ...item, photos: newPhotos, coverPhotoIndex: newCoverIndex };
      }
      return item;
    }));
    console.log('[Collection] Removed photo:', collectionId, photoIndex);
  }, []);

  const setCoverPhoto = useCallback((collectionId: string, photoIndex: number) => {
    setRawCollections(prev => prev.map(item => {
      if (item.id === collectionId) {
        return { ...item, coverPhotoIndex: photoIndex };
      }
      return item;
    }));
    console.log('[Collection] Set cover photo:', collectionId, photoIndex);
  }, []);

  const getCoverPhoto = useCallback((item: CollectionItem): string => {
    if (item.photos.length === 0) return '';
    const idx = Math.min(item.coverPhotoIndex, item.photos.length - 1);
    return item.photos[idx] || item.photos[0];
  }, []);

  const getSeriesList = useCallback(() => {
    const seriesSet = new Set(allCollections.map(item => item.seriesName));
    return Array.from(seriesSet);
  }, [allCollections]);

  const getTimeline = useCallback((collectionId?: string): TimelineEvent[] => {
    const items = collectionId
      ? allCollections.filter(item => item.id === collectionId)
      : allCollections;

    const events: TimelineEvent[] = [];

    items.forEach(item => {
      events.push({
        id: `purchase_${item.id}`,
        collectionId: item.id,
        collectionName: item.characterName,
        date: item.purchaseDate,
        type: 'purchase',
        description: `购入 ${item.characterName}`
      });

      if (item.hasArrived && item.arrivalDate) {
        events.push({
          id: `arrival_${item.id}`,
          collectionId: item.id,
          collectionName: item.characterName,
          date: item.arrivalDate,
          type: 'arrival',
          description: '到货签收'
        });
      }

      if (item.isUnboxed && item.unboxedDate) {
        events.push({
          id: `unbox_${item.id}`,
          collectionId: item.id,
          collectionName: item.characterName,
          date: item.unboxedDate,
          type: 'unbox',
          description: '拆封展示'
        });
      }

      if (item.collectionStatus === 'sold' && item.salePrice) {
        events.push({
          id: `sold_${item.id}`,
          collectionId: item.id,
          collectionName: item.characterName,
          date: item.purchaseDate,
          type: 'sold',
          description: `已出手 ${formatPrice(item.salePrice)}`
        });
      }

      item.maintenanceRecords.forEach(record => {
        events.push({
          id: record.id,
          collectionId: item.id,
          collectionName: item.characterName,
          date: record.date,
          type: record.type,
          description: record.description
        });
      });

      item.flaws.forEach(flaw => {
        events.push({
          id: flaw.id,
          collectionId: item.id,
          collectionName: item.characterName,
          date: flaw.date,
          type: 'flaw',
          description: flaw.description,
          status: flaw.status
        });
      });

      item.replacementParts.forEach(part => {
        events.push({
          id: part.id,
          collectionId: item.id,
          collectionName: item.characterName,
          date: part.applyDate,
          type: 'part',
          description: part.description,
          status: part.status
        });
      });
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allCollections]);

  const addMaintenanceTemplate = useCallback((template: Omit<MaintenanceTemplate, 'id'>) => {
    const newTemplate: MaintenanceTemplate = {
      ...template,
      id: `tpl_${Date.now()}`
    };
    setMaintenanceTemplates(prev => [...prev, newTemplate]);
    console.log('[Template] Added maintenance template:', newTemplate);
  }, []);

  const updateMaintenanceTemplate = useCallback((id: string, updates: Partial<MaintenanceTemplate>) => {
    setMaintenanceTemplates(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));
  }, []);

  const deleteMaintenanceTemplate = useCallback((id: string) => {
    setMaintenanceTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const applyTemplateToCollection = useCallback((collectionId: string, templateId: string) => {
    const template = maintenanceTemplates.find(t => t.id === templateId);
    if (!template) return;

    const collection = allCollections.find(item => item.id === collectionId);
    if (!collection) return;

    const existingDust = reminders.find(r => r.collectionId === collectionId && r.type === 'dust');
    if (existingDust) {
      setReminders(prev => prev.map(r => {
        if (r.id === existingDust.id) {
          return { ...r, intervalDays: template.dustIntervalDays };
        }
        return r;
      }));
    } else {
      setReminders(prev => [...prev, {
        id: `rem_${Date.now()}`,
        collectionId,
        collectionName: collection.characterName,
        type: 'dust',
        nextDate: new Date(Date.now() + template.dustIntervalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        intervalDays: template.dustIntervalDays,
        material: collection.material,
        seriesName: collection.seriesName
      }]);
    }

    const existingLight = reminders.find(r => r.collectionId === collectionId && r.type === 'light_protection');
    if (existingLight) {
      setReminders(prev => prev.map(r => {
        if (r.id === existingLight.id) {
          return { ...r, intervalDays: template.lightProtectionIntervalDays };
        }
        return r;
      }));
    } else {
      setReminders(prev => [...prev, {
        id: `rem_${Date.now()}_lp`,
        collectionId,
        collectionName: collection.characterName,
        type: 'light_protection',
        nextDate: new Date(Date.now() + template.lightProtectionIntervalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        intervalDays: template.lightProtectionIntervalDays,
        material: collection.material,
        seriesName: collection.seriesName
      }]);
    }

    console.log('[Template] Applied template to collection:', templateId, collectionId);
  }, [maintenanceTemplates, allCollections, reminders]);

  const startInventory = useCallback((cabinet: string): InventoryRecord => {
    const cabinetItems = allCollections.filter(item => {
      if (item.collectionStatus === 'sold') return false;
      const pos = item.cabinetPosition;
      return pos && pos.cabinet === cabinet;
    });

    const checkItems: InventoryCheckItem[] = cabinetItems.map(item => ({
      collectionId: item.id,
      collectionName: item.characterName,
      expectedStatus: item.collectionStatus,
      actualStatus: item.collectionStatus,
      isMatch: true
    }));

    const record: InventoryRecord = {
      id: `inv_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      cabinet,
      items: checkItems
    };

    setInventoryRecords(prev => [...prev, record]);
    console.log('[Inventory] Started inventory:', record);
    return record;
  }, [allCollections]);

  const updateInventoryItem = useCallback((inventoryId: string, itemId: string, actualStatus: CollectionItem['collectionStatus'], notes?: string) => {
    setInventoryRecords(prev => prev.map(record => {
      if (record.id === inventoryId) {
        return {
          ...record,
          items: record.items.map(item => {
            if (item.collectionId === itemId) {
              return {
                ...item,
                actualStatus,
                isMatch: item.expectedStatus === actualStatus,
                notes
              };
            }
            return item;
          })
        };
      }
      return record;
    }));

    setRawCollections(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          collectionStatus: actualStatus,
          inventoryStatus: 'checked',
          lastInventoryDate: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    }));
  }, []);

  const completeInventory = useCallback((inventoryId: string) => {
    setInventoryRecords(prev => prev.map(record => {
      if (record.id === inventoryId) {
        return { ...record, completedAt: new Date().toISOString().split('T')[0] };
      }
      return record;
    }));
    console.log('[Inventory] Completed inventory:', inventoryId);
  }, []);

  const getLatestInventoryDate = useCallback((): string | null => {
    const completed = inventoryRecords.filter(r => r.completedAt);
    if (completed.length === 0) return null;
    return completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date;
  }, [inventoryRecords]);

  const getInventoryDiscrepancies = useCallback((inventoryId: string): InventoryCheckItem[] => {
    const record = inventoryRecords.find(r => r.id === inventoryId);
    if (!record) return [];
    return record.items.filter(item => !item.isMatch);
  }, [inventoryRecords]);

  const showcaseSortedCollections = useMemo(() => {
    let result = allCollections.filter(item => item.collectionStatus !== 'sold');
    if (showcaseSeries) {
      result = result.filter(item => item.seriesName === showcaseSeries);
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
      case 'showcase': {
        const allIds: string[] = [];
        Object.values(cabinetLayout).forEach(cabinet => {
          Object.keys(cabinet).forEach(shelf => {
            allIds.push(...cabinet[Number(shelf)]);
          });
        });
        if (allIds.length > 0) {
          result.sort((a, b) => {
            const aIndex = allIds.indexOf(a.id);
            const bIndex = allIds.indexOf(b.id);
            if (aIndex === -1 && bIndex === -1) return a.sortOrder - b.sortOrder;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          });
        } else {
          result.sort((a, b) => a.sortOrder - b.sortOrder);
        }
        break;
      }
      default:
        result.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return result;
  }, [allCollections, showcaseSeries, sortType, cabinetLayout]);

  return (
    <CollectionContext.Provider value={{
      allCollections,
      collections: showcaseSortedCollections,
      reminders,
      maintenanceTemplates,
      inventoryRecords,
      showcaseSeries,
      setShowcaseSeries,
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
      cabinetLayout,
      setCabinetLayout,
      markArrived,
      markBalancePaid,
      addPhotos,
      removePhoto,
      setCoverPhoto,
      getCoverPhoto,
      getTimeline,
      markUnboxed,
      addMaintenanceTemplate,
      updateMaintenanceTemplate,
      deleteMaintenanceTemplate,
      applyTemplateToCollection,
      startInventory,
      updateInventoryItem,
      completeInventory,
      getLatestInventoryDate,
      getInventoryDiscrepancies,
      getActiveCollections
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
