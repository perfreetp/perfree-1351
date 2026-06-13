import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Image, Button, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import { CollectionItem } from '../../types/collection';

const POSITIONS_PER_SHELF = 3;
const DEFAULT_CABINET = '展柜A';

const CabinetPage: React.FC = () => {
  const { allCollections, getCollectionById, cabinetLayout, setCabinetLayout } = useCollection();
  const [editMode, setEditMode] = useState(false);
  const [localLayout, setLocalLayout] = useState<typeof cabinetLayout>(JSON.parse(JSON.stringify(cabinetLayout)));
  const [newCabinetName, setNewCabinetName] = useState('');

  const arrivedItems = useMemo(() => {
    return allCollections.filter(item => item.hasArrived);
  }, [allCollections]);

  const placedItemIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(localLayout).forEach(cabinet => {
      Object.values(cabinet).forEach(shelfItems => {
        shelfItems.forEach(id => ids.add(id));
      });
    });
    return ids;
  }, [localLayout]);

  const unplacedItems = useMemo(() => {
    return arrivedItems.filter(item => !placedItemIds.has(item.id));
  }, [arrivedItems, placedItemIds]);

  const cabinetNames = useMemo(() => {
    return Object.keys(localLayout).sort();
  }, [localLayout]);

  const getShelfItems = useCallback((cabinet: string, shelf: number): (CollectionItem | null)[] => {
    const shelfIds = localLayout[cabinet]?.[shelf] || [];
    const result: (CollectionItem | null)[] = [];
    for (let i = 0; i < POSITIONS_PER_SHELF; i++) {
      const itemId = shelfIds[i];
      if (itemId) {
        const item = getCollectionById(itemId);
        result.push(item || null);
      } else {
        result.push(null);
      }
    }
    return result;
  }, [localLayout, getCollectionById]);

  const getMaxShelf = useCallback((cabinet: string): number => {
    const shelves = Object.keys(localLayout[cabinet] || {}).map(Number);
    return shelves.length > 0 ? Math.max(...shelves) : 0;
  }, [localLayout]);

  const handleMoveToPosition = useCallback((itemId: string, cabinet: string, shelf: number, position: number) => {
    setLocalLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      Object.keys(next).forEach(c => {
        Object.keys(next[c]).forEach(s => {
          next[c][Number(s)] = next[c][Number(s)].filter((id: string) => id !== itemId);
        });
      });
      if (!next[cabinet]) next[cabinet] = {};
      if (!next[cabinet][shelf]) next[cabinet][shelf] = [];
      const arr = next[cabinet][shelf];
      while (arr.length < position) arr.push('');
      if (arr[position] && arr[position] !== itemId) {
        arr.push(itemId);
      } else {
        arr[position] = itemId;
      }
      next[cabinet][shelf] = arr.filter((id: string) => id !== '');
      return next;
    });
  }, []);

  const handleAddCabinet = useCallback(() => {
    const name = newCabinetName.trim() || `展柜${String.fromCharCode(65 + cabinetNames.length)}`;
    if (localLayout[name]) {
      Taro.showToast({ title: '展柜名已存在', icon: 'none' });
      return;
    }
    setLocalLayout(prev => ({
      ...prev,
      [name]: {}
    }));
    setNewCabinetName('');
    Taro.showToast({ title: `已添加 ${name}`, icon: 'success' });
  }, [newCabinetName, cabinetNames.length, localLayout]);

  const handleDeleteCabinet = useCallback((cabinet: string) => {
    Taro.showModal({
      title: '删除展柜',
      content: `确定删除「${cabinet}」？展柜中的藏品将回到未摆放列表。`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          setLocalLayout(prev => {
            const next = { ...prev };
            delete next[cabinet];
            return next;
          });
        }
      }
    });
  }, []);

  const handleAddShelf = useCallback((cabinet: string) => {
    setLocalLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[cabinet]) next[cabinet] = {};
      const shelves = Object.keys(next[cabinet]).map(Number);
      const nextShelf = shelves.length > 0 ? Math.max(...shelves) + 1 : 1;
      next[cabinet][nextShelf] = [];
      return next;
    });
  }, []);

  const handleAutoArrange = useCallback(() => {
    const sorted = [...arrivedItems].sort((a, b) => {
      const locA = a.displayLocation || '';
      const locB = b.displayLocation || '';
      if (locA && locB) return locA.localeCompare(locB);
      if (locA) return -1;
      if (locB) return 1;
      return a.sortOrder - b.sortOrder;
    });
    const layout: typeof cabinetLayout = {};
    let currentCabinet = DEFAULT_CABINET;
    let currentShelf = 1;
    layout[currentCabinet] = { [currentShelf]: [] };

    sorted.forEach(item => {
      if (layout[currentCabinet][currentShelf].length >= POSITIONS_PER_SHELF) {
        currentShelf++;
        layout[currentCabinet][currentShelf] = [];
      }
      layout[currentCabinet][currentShelf].push(item.id);
    });

    setLocalLayout(layout);
    Taro.showToast({ title: '已自动排布到展柜', icon: 'success' });
  }, [arrivedItems]);

  const handleSaveLayout = useCallback(() => {
    setCabinetLayout(localLayout);
    setEditMode(false);
    Taro.showToast({ title: '展柜布局已保存', icon: 'success' });
  }, [localLayout, setCabinetLayout]);

  const handleToggleEdit = useCallback(() => {
    if (editMode) {
      setEditMode(false);
      setLocalLayout(JSON.parse(JSON.stringify(cabinetLayout)));
    } else {
      setLocalLayout(JSON.parse(JSON.stringify(cabinetLayout)));
      setEditMode(true);
    }
  }, [editMode, cabinetLayout]);

  const handleItemClick = (item: CollectionItem) => {
    if (!editMode) {
      Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` });
    }
  };

  const handlePlaceItem = (itemId: string) => {
    const lastCabinet = cabinetNames[cabinetNames.length - 1] || DEFAULT_CABINET;
    const maxShelf = getMaxShelf(lastCabinet);
    handleMoveToPosition(itemId, lastCabinet, maxShelf > 0 ? maxShelf : 1, POSITIONS_PER_SHELF);
  };

  return (
    <View className={styles.page}>
      <View className={styles.toolbar}>
        <Button
          className={classnames(styles.toolBtn, editMode && styles.active)}
          onClick={handleToggleEdit}
        >
          <Text>{editMode ? '取消编辑' : '编辑布局'}</Text>
        </Button>
        {editMode && (
          <>
            <Button className={styles.toolBtn} onClick={handleAutoArrange}>
              <Text>自动排布</Text>
            </Button>
            <Button className={classnames(styles.toolBtn, styles.saveBtn)} onClick={handleSaveLayout}>
              <Text>保存布局</Text>
            </Button>
          </>
        )}
      </View>

      <ScrollView scrollY enhanced className={styles.cabinetScroll}>
        {cabinetNames.length > 0 ? (
          <View className={styles.cabinets}>
            {cabinetNames.map(cabinetName => {
              const maxShelf = getMaxShelf(cabinetName);
              return (
                <View key={cabinetName} className={styles.cabinet}>
                  <View className={styles.cabinetHeader}>
                    <Text className={styles.cabinetName}>{cabinetName}</Text>
                    {editMode && (
                      <View className={styles.cabinetActions}>
                        <Button className={styles.shelfAddBtn} onClick={() => handleAddShelf(cabinetName)}>
                          <Text>+ 加层</Text>
                        </Button>
                        <Button className={styles.cabinetDeleteBtn} onClick={() => handleDeleteCabinet(cabinetName)}>
                          <Text>删除展柜</Text>
                        </Button>
                      </View>
                    )}
                  </View>
                  <View className={styles.cabinetTop} />
                  {Array.from({ length: maxShelf }, (_, i) => i + 1).map(shelfNum => (
                    <View key={shelfNum} className={styles.shelf}>
                      <View className={styles.shelfLabel}>
                        <Text>第 {shelfNum} 层</Text>
                      </View>
                      <View className={styles.shelfItems}>
                        {getShelfItems(cabinetName, shelfNum).map((item, posIndex) => (
                          item ? (
                            <View
                              key={item.id}
                              className={styles.shelfItem}
                              onClick={() => handleItemClick(item)}
                            >
                              <View className={styles.itemImageWrapper}>
                                <Image
                                  src={item.photos[0]}
                                  mode="aspectFill"
                                  className={styles.itemImage}
                                  onError={(e) => console.error('[Image] Failed to load:', e)}
                                />
                              </View>
                              <Text className={styles.itemName}>{item.characterName}</Text>
                              <Text className={styles.itemInfo}>{item.scale}</Text>
                              {editMode && (
                                <View className={styles.positionTag}>
                                  <Text>{cabinetName}-{shelfNum}层-位{posIndex + 1}</Text>
                                </View>
                              )}
                            </View>
                          ) : (
                            <View key={`empty-${posIndex}`} className={styles.shelfItemEmpty}>
                              <View className={styles.emptySlot}>
                                <Text className={styles.emptySlotText}>空位</Text>
                              </View>
                            </View>
                          )
                        ))}
                      </View>
                      <View className={styles.shelfBoard} />
                    </View>
                  ))}
                  <View className={styles.cabinetBottom} />
                </View>
              );
            })}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🏚️</Text>
            <Text className={styles.emptyText}>暂无展柜，点击编辑布局创建</Text>
          </View>
        )}

        {editMode && (
          <View className={styles.editSection}>
            <View className={styles.addCabinetRow}>
              <Input
                className={styles.cabinetNameInput}
                placeholder="新展柜名称"
                placeholderTextColor="#64748B"
                value={newCabinetName}
                onInput={(e) => setNewCabinetName(e.detail.value)}
              />
              <Button className={styles.addCabinetBtn} onClick={handleAddCabinet}>
                <Text>添加展柜</Text>
              </Button>
            </View>

            {unplacedItems.length > 0 && (
              <View className={styles.unplacedSection}>
                <Text className={styles.unplacedTitle}>未摆放的已到货藏品 ({unplacedItems.length})</Text>
                <View className={styles.unplacedList}>
                  {unplacedItems.map(item => (
                    <View key={item.id} className={styles.unplacedItem}>
                      <View className={styles.unplacedImageWrapper}>
                        <Image
                          src={item.photos[0]}
                          mode="aspectFill"
                          className={styles.unplacedImage}
                          onError={(e) => console.error('[Image] Failed to load:', e)}
                        />
                      </View>
                      <View className={styles.unplacedInfo}>
                        <Text className={styles.unplacedName}>{item.characterName}</Text>
                        <Text className={styles.unplacedSeries}>{item.seriesName}</Text>
                      </View>
                      <Button className={styles.placeBtn} onClick={() => handlePlaceItem(item.id)}>
                        <Text>放入</Text>
                      </Button>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default CabinetPage;
