import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import { formatPrice } from '../../utils';
import { CollectionItem } from '../../types/collection';

const ITEMS_PER_SHELF = 3;

const CabinetPage: React.FC = () => {
  const { collections, cabinetOrder, setCabinetOrder } = useCollection();
  const [editMode, setEditMode] = useState(false);
  const [localOrder, setLocalOrder] = useState<string[]>(cabinetOrder.length > 0 ? cabinetOrder : collections.map(c => c.id));

  const orderedItems = useMemo(() => {
    const itemMap = new Map<string, CollectionItem>();
    collections.forEach(item => itemMap.set(item.id, item));

    const ordered: CollectionItem[] = [];
    localOrder.forEach(id => {
      const item = itemMap.get(id);
      if (item) ordered.push(item);
    });

    collections.forEach(item => {
      if (!localOrder.includes(item.id)) {
        ordered.push(item);
      }
    });

    return ordered;
  }, [collections, localOrder]);

  const arrivedItems = useMemo(() => orderedItems.filter(item => item.hasArrived), [orderedItems]);

  const shelves = useMemo(() => {
    const result: CollectionItem[][] = [];
    for (let i = 0; i < arrivedItems.length; i += ITEMS_PER_SHELF) {
      result.push(arrivedItems.slice(i, i + ITEMS_PER_SHELF));
    }
    return result;
  }, [arrivedItems]);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setLocalOrder(prev => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= localOrder.length - 1) return;
    setLocalOrder(prev => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
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
    setLocalOrder(sorted.map(item => item.id));
    Taro.showToast({ title: '已按摆放位置自动排布', icon: 'success' });
  }, [arrivedItems]);

  const handleSaveOrder = useCallback(() => {
    setCabinetOrder(localOrder);
    setEditMode(false);
    Taro.showToast({ title: '展柜排序已保存', icon: 'success' });
  }, [localOrder, setCabinetOrder]);

  const handleToggleEdit = useCallback(() => {
    if (editMode) {
      setEditMode(false);
      setLocalOrder(cabinetOrder.length > 0 ? cabinetOrder : collections.map(c => c.id));
    } else {
      setLocalOrder(cabinetOrder.length > 0 ? cabinetOrder : collections.map(c => c.id));
      setEditMode(true);
    }
  }, [editMode, cabinetOrder, collections]);

  const handleItemClick = (item: CollectionItem) => {
    if (!editMode) {
      Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.toolbar}>
        <Button
          className={classnames(styles.toolBtn, editMode && styles.active)}
          onClick={handleToggleEdit}
        >
          <Text>{editMode ? '取消编辑' : '编辑排序'}</Text>
        </Button>
        {editMode && (
          <>
            <Button className={styles.toolBtn} onClick={handleAutoArrange}>
              <Text>自动排布</Text>
            </Button>
            <Button className={classnames(styles.toolBtn, styles.saveBtn)} onClick={handleSaveOrder}>
              <Text>保存排序</Text>
            </Button>
          </>
        )}
      </View>

      {!editMode ? (
        <ScrollView scrollY enhanced className={styles.cabinetScroll}>
          {shelves.length > 0 ? (
            <View className={styles.cabinet}>
              <View className={styles.cabinetTop} />
              {shelves.map((shelf, shelfIndex) => (
                <View key={shelfIndex} className={styles.shelf}>
                  <View className={styles.shelfLabel}>
                    <Text>第 {shelfIndex + 1} 层</Text>
                  </View>
                  <View className={styles.shelfItems}>
                    {shelf.map(item => (
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
                        <Text className={styles.itemInfo}>{item.scale} · {item.manufacturer}</Text>
                      </View>
                    ))}
                    {Array.from({ length: ITEMS_PER_SHELF - shelf.length }).map((_, i) => (
                      <View key={`empty-${i}`} className={styles.shelfItemEmpty}>
                        <View className={styles.emptySlot}>
                          <Text className={styles.emptySlotText}>空位</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  <View className={styles.shelfBoard} />
                </View>
              ))}
              <View className={styles.cabinetBottom} />
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🏚️</Text>
              <Text className={styles.emptyText}>暂无已到货的藏品可展示</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView scrollY enhanced className={styles.editScroll}>
          <View className={styles.editList}>
            {arrivedItems.map((item, index) => (
              <View key={item.id} className={styles.editItem}>
                <View className={styles.editOrder}>
                  <Text className={styles.orderNum}>{index + 1}</Text>
                </View>
                <View className={styles.editItemImageWrapper}>
                  <Image
                    src={item.photos[0]}
                    mode="aspectFill"
                    className={styles.editItemImage}
                    onError={(e) => console.error('[Image] Failed to load:', e)}
                  />
                </View>
                <View className={styles.editItemInfo}>
                  <Text className={styles.editItemName}>{item.characterName}</Text>
                  <Text className={styles.editItemSeries}>{item.seriesName}</Text>
                  <Text className={styles.editItemMeta}>{item.displayLocation} · {formatPrice(item.purchasePrice)}</Text>
                </View>
                <View className={styles.editControls}>
                  <Button
                    className={classnames(styles.controlBtn, index === 0 && styles.disabled)}
                    onClick={() => handleMoveUp(localOrder.indexOf(item.id))}
                    disabled={index === 0}
                  >
                    <Text>↑</Text>
                  </Button>
                  <Button
                    className={classnames(styles.controlBtn, index === arrivedItems.length - 1 && styles.disabled)}
                    onClick={() => handleMoveDown(localOrder.indexOf(item.id))}
                    disabled={index === arrivedItems.length - 1}
                  >
                    <Text>↓</Text>
                  </Button>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default CabinetPage;
