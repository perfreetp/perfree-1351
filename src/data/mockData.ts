import { CollectionItem, MaintenanceReminder, Statistics } from '../types/collection';

export const mockCollections: CollectionItem[] = [
  {
    id: '1',
    characterName: '蕾姆',
    seriesName: 'Re:从零开始的异世界生活',
    scale: '1/7',
    manufacturer: 'Good Smile Company',
    purchasePrice: 1299,
    purchaseDate: '2024-01-15',
    photos: ['https://picsum.photos/id/1027/300/300'],
    displayLocation: '展柜A-3层',
    isUnboxed: true,
    unboxedDate: '2024-02-20',
    hasArrived: true,
    arrivalDate: '2024-02-20',
    coverPhotoIndex: 0,
    collectionStatus: 'in_cabinet',
    flaws: [],
    replacementParts: [],
    maintenanceRecords: [
      { id: 'm1', type: 'dust', date: '2024-05-10', description: '定期除尘保养' },
      { id: 'm2', type: 'light_protection', date: '2024-05-10', description: '检查避光措施' }
    ],
    notes: '初回限定版，附带特典底座',
    createdAt: '2024-01-15',
    sortOrder: 1
  },
  {
    id: '2',
    characterName: '樱岛麻衣',
    seriesName: '青春猪头少年不会梦到兔女郎学姐',
    scale: '1/7',
    manufacturer: 'Aniplex',
    purchasePrice: 1580,
    purchaseDate: '2024-03-20',
    photos: ['https://picsum.photos/id/64/300/300'],
    displayLocation: '展柜A-2层',
    isUnboxed: true,
    hasArrived: true,
    arrivalDate: '2024-04-25',
    flaws: [
      { id: 'f1', description: '底座边缘轻微划痕', date: '2024-05-01', photos: [], status: 'pending' }
    ],
    replacementParts: [],
    maintenanceRecords: [
      { id: 'm3', type: 'dust', date: '2024-06-01', description: '定期除尘保养' }
    ],
    notes: '兔女郎造型，做工精细',
    createdAt: '2024-03-20',
    sortOrder: 2
  },
  {
    id: '3',
    characterName: '初音未来',
    seriesName: 'VOCALOID',
    scale: '1/4',
    manufacturer: 'FREEing',
    purchasePrice: 2200,
    purchaseDate: '2024-02-10',
    photos: ['https://picsum.photos/id/177/300/300'],
    displayLocation: '展柜B-1层',
    isUnboxed: false,
    hasArrived: true,
    arrivalDate: '2024-03-15',
    flaws: [],
    replacementParts: [
      { id: 'r1', description: '麦克风配件', applyDate: '2024-03-20', receivedDate: '2024-04-01', status: 'received' }
    ],
    maintenanceRecords: [],
    notes: '1/4大比例，未拆封收藏',
    createdAt: '2024-02-10',
    sortOrder: 3
  },
  {
    id: '4',
    characterName: 'Saber',
    seriesName: 'Fate/stay night',
    scale: '1/7',
    manufacturer: 'Alter',
    purchasePrice: 1899,
    purchaseDate: '2023-12-25',
    photos: ['https://picsum.photos/id/338/300/300'],
    displayLocation: '展柜A-1层',
    isUnboxed: true,
    hasArrived: true,
    arrivalDate: '2024-01-30',
    flaws: [],
    replacementParts: [],
    maintenanceRecords: [
      { id: 'm4', type: 'dust', date: '2024-04-15', description: '定期除尘保养' }
    ],
    notes: '阿尔托莉雅·潘德拉贡',
    createdAt: '2023-12-25',
    sortOrder: 4
  },
  {
    id: '5',
    characterName: '时崎狂三',
    seriesName: '约会大作战',
    scale: '1/7',
    manufacturer: 'KADOKAWA',
    purchasePrice: 1450,
    purchaseDate: '2024-04-05',
    photos: ['https://picsum.photos/id/91/300/300'],
    displayLocation: '展柜B-2层',
    isUnboxed: true,
    hasArrived: true,
    arrivalDate: '2024-05-10',
    flaws: [],
    replacementParts: [],
    maintenanceRecords: [],
    notes: '狂三外传限定版',
    createdAt: '2024-04-05',
    sortOrder: 5
  },
  {
    id: '6',
    characterName: '零二',
    seriesName: 'DARLING in the FRANXX',
    scale: '1/7',
    manufacturer: 'Good Smile Company',
    purchasePrice: 1680,
    purchaseDate: '2024-05-01',
    photos: ['https://picsum.photos/id/64/300/300'],
    displayLocation: '展柜C-1层',
    isUnboxed: true,
    hasArrived: true,
    arrivalDate: '2024-06-15',
    flaws: [],
    replacementParts: [],
    maintenanceRecords: [],
    notes: '国家队02，婚纱造型',
    createdAt: '2024-05-01',
    sortOrder: 6
  },
  {
    id: '7',
    characterName: '甘雨',
    seriesName: '原神',
    scale: '1/7',
    manufacturer: 'APEX',
    purchasePrice: 1399,
    purchaseDate: '2024-02-28',
    reservationDate: '2024-02-28',
    balanceDueDate: '2024-08-15',
    photos: ['https://picsum.photos/id/1027/300/300'],
    displayLocation: '待到货',
    isUnboxed: false,
    hasArrived: false,
    flaws: [],
    replacementParts: [],
    maintenanceRecords: [],
    notes: '预订中，等待尾款',
    createdAt: '2024-02-28',
    sortOrder: 7
  },
  {
    id: '8',
    characterName: '绫华',
    seriesName: '原神',
    scale: '1/7',
    manufacturer: 'APEX',
    purchasePrice: 1499,
    purchaseDate: '2024-03-15',
    reservationDate: '2024-03-15',
    balanceDueDate: '2024-09-01',
    photos: ['https://picsum.photos/id/177/300/300'],
    displayLocation: '待到货',
    isUnboxed: false,
    hasArrived: false,
    flaws: [],
    replacementParts: [],
    maintenanceRecords: [],
    notes: '神里绫华，预订中',
    createdAt: '2024-03-15',
    sortOrder: 8
  },
  {
    id: '9',
    characterName: '明日香',
    seriesName: '新世纪福音战士',
    scale: '1/4',
    manufacturer: 'FREEing',
    purchasePrice: 2500,
    purchaseDate: '2023-11-20',
    photos: ['https://picsum.photos/id/338/300/300'],
    displayLocation: '展柜C-2层',
    isUnboxed: true,
    hasArrived: true,
    arrivalDate: '2024-01-10',
    flaws: [
      { id: 'f2', description: '头发部分有轻微掉漆', date: '2024-02-15', photos: [], status: 'resolved' }
    ],
    replacementParts: [],
    maintenanceRecords: [
      { id: 'm5', type: 'dust', date: '2024-03-20', description: '定期除尘保养' }
    ],
    notes: '明日香·兰格雷',
    createdAt: '2023-11-20',
    sortOrder: 9
  },
  {
    id: '10',
    characterName: '雷姆',
    seriesName: 'Re:从零开始的异世界生活',
    scale: '1/4',
    manufacturer: 'FREEing',
    purchasePrice: 1800,
    purchaseDate: '2024-01-10',
    photos: ['https://picsum.photos/id/91/300/300'],
    displayLocation: '展柜B-3层',
    isUnboxed: true,
    hasArrived: true,
    arrivalDate: '2024-02-28',
    flaws: [],
    replacementParts: [],
    maintenanceRecords: [],
    notes: '雷姆泳装版',
    createdAt: '2024-01-10',
    sortOrder: 10
  },
  {
    id: '11',
    characterName: '刻晴',
    seriesName: '原神',
    scale: '1/7',
    manufacturer: 'APEX',
    purchasePrice: 0,
    purchaseDate: '2024-04-18',
    reservationDate: '2024-04-18',
    balanceDueDate: '2024-10-01',
    photos: ['https://picsum.photos/id/64/300/300'],
    displayLocation: '待到货',
    isUnboxed: false,
    hasArrived: false,
    flaws: [],
    replacementParts: [],
    maintenanceRecords: [],
    notes: '预订中，刻晴手办',
    createdAt: '2024-04-18',
    sortOrder: 11
  },
  {
    id: '12',
    characterName: '艾蕾',
    seriesName: 'Fate/Grand Order',
    scale: '1/7',
    manufacturer: 'Alter',
    purchasePrice: 1750,
    purchaseDate: '2023-10-15',
    photos: ['https://picsum.photos/id/177/300/300'],
    displayLocation: '展柜A-4层',
    isUnboxed: true,
    hasArrived: true,
    arrivalDate: '2023-12-20',
    flaws: [],
    replacementParts: [],
    maintenanceRecords: [
      { id: 'm6', type: 'dust', date: '2024-05-20', description: '定期除尘保养' },
      { id: 'm7', type: 'light_protection', date: '2024-05-20', description: '检查避光措施' }
    ],
    notes: '艾蕾什基伽勒，枪凛',
    createdAt: '2023-10-15',
    sortOrder: 12
  }
];

export const mockReminders: MaintenanceReminder[] = [
  {
    id: 'rem1',
    collectionId: '1',
    collectionName: '蕾姆',
    type: 'dust',
    nextDate: '2024-06-20',
    intervalDays: 30
  },
  {
    id: 'rem2',
    collectionId: '2',
    collectionName: '樱岛麻衣',
    type: 'dust',
    nextDate: '2024-07-01',
    intervalDays: 30
  },
  {
    id: 'rem3',
    collectionId: '4',
    collectionName: 'Saber',
    type: 'light_protection',
    nextDate: '2024-06-25',
    intervalDays: 90
  }
];

export const mockStatistics: Statistics = {
  totalCount: 12,
  totalSpent: 19056,
  unboxedCount: 8,
  pendingArrivalCount: 3,
  bySeries: [
    { name: '原神', count: 3, spent: 2898 },
    { name: 'Re:从零开始的异世界生活', count: 2, spent: 3099 },
    { name: 'Fate系列', count: 2, spent: 3649 },
    { name: 'VOCALOID', count: 1, spent: 2200 },
    { name: '青春猪头少年', count: 1, spent: 1580 },
    { name: '约会大作战', count: 1, spent: 1450 },
    { name: 'DARLING in the FRANXX', count: 1, spent: 1680 },
    { name: '新世纪福音战士', count: 1, spent: 2500 }
  ],
  byManufacturer: [
    { name: 'Good Smile Company', count: 2, spent: 2979 },
    { name: 'APEX', count: 3, spent: 2898 },
    { name: 'FREEing', count: 3, spent: 6500 },
    { name: 'Alter', count: 2, spent: 3649 },
    { name: 'Aniplex', count: 1, spent: 1580 },
    { name: 'KADOKAWA', count: 1, spent: 1450 }
  ],
  byYear: [
    { year: '2023', count: 3, spent: 6149 },
    { year: '2024', count: 9, spent: 12907 }
  ],
  monthlyTrend: [
    { month: '2023-10', count: 1, spent: 1750 },
    { month: '2023-11', count: 1, spent: 2500 },
    { month: '2023-12', count: 1, spent: 1899 },
    { month: '2024-01', count: 2, spent: 3099 },
    { month: '2024-02', count: 2, spent: 3599 },
    { month: '2024-03', count: 3, spent: 3079 },
    { month: '2024-04', count: 2, spent: 2949 }
  ]
};
