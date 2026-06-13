import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CollectionItem, MaintenanceReminder } from '../types/collection';
import { mockCollections, mockReminders } from '../data/mockData';

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
  getSeriesList: () => string[];
  sortType: 'default' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
  setSortType: (type: 'default' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc') => void;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collections, setCollections] = useState<CollectionItem[]>(mockCollections);
  const [reminders, setReminders] = useState<MaintenanceReminder[]>(mockReminders);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'default' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc'>('default');

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
    console.log('[Collection] Deleted collection:', id);
  }, []);

  const completeMaintenance = useCallback((reminderId: string) => {
    setReminders(prev => prev.map(r => {
      if (r.id === reminderId) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + r.intervalDays);
        return { ...r, nextDate: nextDate.toISOString().split('T')[0] };
      }
      return r;
    }));
    console.log('[Maintenance] Completed reminder:', reminderId);
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
      default:
        result.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return result;
  }, [collections, selectedSeries, sortType]);

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
      getSeriesList,
      sortType,
      setSortType
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
