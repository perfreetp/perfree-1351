import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Image, Button, ScrollView, Input, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import { CollectionItem, InventoryRecord } from '../../types/collection';
import {
  getCollectionStatusText,
  getCollectionStatusIcon,
  getInventoryStatusIcon
} from '../../utils';

const POSITIONS_PER_SHELF = 3;
const DEFAULT_CABINET = '展柜A';

type MoveTarget = 'cabinet' | 'shelf' | 'position';

const CabinetPage: React.FC = () => {
  const {
    allCollections,
    getCollectionById,
    cabinetLayout,
    setCabinetLayout,
    getCoverPhoto,
    markUnboxed,
    startInventory,
    updateInventoryItem,
    completeInventory,
    getLatestInventoryDate,
    getInventoryDiscrepancies
  } = useCollection();

  const [editMode, setEditMode] = useState(false);
  const [localLayout, setLocalLayout] = useState<typeof cabinetLayout>(JSON.parse(JSON.stringify(cabinetLayout)));
  const [newCabinetName, setNewCabinetName] = useState('');

  const [inventoryMode, setInventoryMode] = useState(false);
  const [activeInventory, setActiveInventory] = useState<InventoryRecord | null>(null);
  const [inventoryCabinet, setInventoryCabinet] = useState('');
  const [inventoryStep, setInventoryStep] = useState<'select' | 'checking' | 'summary'>('select');
  const [currentShelfIndex, setCurrentShelfIndex] = useState(0);
  const [discrepancies, setDiscrepancies] = useState<ReturnType<typeof getInventoryDiscrepancies>>([]);

  const [movePickerVisible, setMovePickerVisible] = useState(false);
  const [moveTargetType, setMoveTargetType] = useState<MoveTarget>('cabinet');
  const [movingItemId, setMovingItemId] = useState('');
  const [movingItemCabinet, setMovingItemCabinet] = useState('');
  const [movingItemShelf, setMovingItemShelf] = useState(0);
  const [movingItemPosition, setMovingItemPosition] = useState(0);

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

  const getShelfNumbers = useCallback((cabinet: string): number[] => {
    return Object.keys(localLayout[cabinet] || {}).map(Number).sort((a, b) => a - b);
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

  const handleMoveAction = useCallback((targetType: MoveTarget, itemId: string, currentCabinet: string, currentShelf: number, currentPosition: number) => {
    setMoveTargetType(targetType);
    setMovingItemId(itemId);
    setMovingItemCabinet(currentCabinet);
    setMovingItemShelf(currentShelf);
    setMovingItemPosition(currentPosition);
    setMovePickerVisible(true);
  }, []);

  const handlePickerConfirm = useCallback((e: any) => {
    const value = e.detail.value;
    if (typeof value !== 'number') return;

    if (moveTargetType === 'cabinet') {
      const targetCabinet = cabinetNames[value];
      if (targetCabinet && targetCabinet !== movingItemCabinet) {
        const maxShelf = getMaxShelf(targetCabinet);
        const targetShelf = maxShelf > 0 ? maxShelf : 1;
        handleMoveToPosition(movingItemId, targetCabinet, targetShelf, POSITIONS_PER_SHELF);
        Taro.showToast({ title: `已移至 ${targetCabinet}`, icon: 'success' });
      }
    } else if (moveTargetType === 'shelf') {
      const shelfNums = getShelfNumbers(movingItemCabinet);
      const targetShelf = shelfNums[value];
      if (targetShelf !== undefined && targetShelf !== movingItemShelf) {
        handleMoveToPosition(movingItemId, movingItemCabinet, targetShelf, POSITIONS_PER_SHELF);
        Taro.showToast({ title: `已移至第${targetShelf}层`, icon: 'success' });
      }
    } else if (moveTargetType === 'position') {
      const targetPos = value;
      if (targetPos !== movingItemPosition) {
        handleMoveToPosition(movingItemId, movingItemCabinet, movingItemShelf, targetPos);
        Taro.showToast({ title: `已移至位${targetPos + 1}`, icon: 'success' });
      }
    }

    setMovePickerVisible(false);
    setMovingItemId('');
  }, [moveTargetType, movingItemId, movingItemCabinet, movingItemShelf, movingItemPosition, cabinetNames, getMaxShelf, getShelfNumbers, handleMoveToPosition]);

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
    if (!editMode && !inventoryMode) {
      Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` });
    }
  };

  const handlePlaceItem = (itemId: string) => {
    const lastCabinet = cabinetNames[cabinetNames.length - 1] || DEFAULT_CABINET;
    const maxShelf = getMaxShelf(lastCabinet);
    handleMoveToPosition(itemId, lastCabinet, maxShelf > 0 ? maxShelf : 1, POSITIONS_PER_SHELF);
  };

  const handleStartInventory = useCallback((cabinet: string) => {
    const record = startInventory(cabinet);
    setActiveInventory(record);
    setInventoryCabinet(cabinet);
    setCurrentShelfIndex(0);
    setInventoryStep('checking');
    Taro.showToast({ title: `开始盘点 ${cabinet}`, icon: 'success' });
  }, [startInventory]);

  const handleInventoryItemStatus = useCallback((itemId: string, actualStatus: CollectionItem['collectionStatus']) => {
    if (!activeInventory) return;
    updateInventoryItem(activeInventory.id, itemId, actualStatus);
    setActiveInventory(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(it => {
          if (it.collectionId === itemId) {
            return { ...it, actualStatus, isMatch: it.expectedStatus === actualStatus };
          }
          return it;
        })
      };
    });
  }, [activeInventory, updateInventoryItem]);

  const handleFinishInventory = useCallback(() => {
    if (!activeInventory) return;
    completeInventory(activeInventory.id);
    const diffs = getInventoryDiscrepancies(activeInventory.id);
    setDiscrepancies(diffs);
    setInventoryStep('summary');
  }, [activeInventory, completeInventory, getInventoryDiscrepancies]);

  const handleExitInventory = useCallback(() => {
    setInventoryMode(false);
    setActiveInventory(null);
    setInventoryStep('select');
    setDiscrepancies([]);
    setCurrentShelfIndex(0);
  }, []);

  const latestInventoryDate = useMemo(() => getLatestInventoryDate(), [getLatestInventoryDate]);

  const getPickerRange = useCallback((): string[] => {
    if (moveTargetType === 'cabinet') {
      return cabinetNames;
    }
    if (moveTargetType === 'shelf') {
      return getShelfNumbers(movingItemCabinet).map(n => `第${n}层`);
    }
    return Array.from({ length: POSITIONS_PER_SHELF }, (_, i) => `位${i + 1}`);
  }, [moveTargetType, cabinetNames, movingItemCabinet, getShelfNumbers]);

  const getInventoryShelves = useCallback((): { shelfNum: number; items: (CollectionItem | null)[] }[] => {
    if (!inventoryCabinet) return [];
    const shelfNums = getShelfNumbers(inventoryCabinet);
    return shelfNums.map(shelfNum => ({
      shelfNum,
      items: getShelfItems(inventoryCabinet, shelfNum)
    }));
  }, [inventoryCabinet, getShelfNumbers, getShelfItems]);

  const currentInventoryShelf = useMemo(() => {
    const shelves = getInventoryShelves();
    return shelves[currentShelfIndex] || null;
  }, [getInventoryShelves, currentShelfIndex]);

  const renderMovePicker = () => {
    if (!movePickerVisible) return null;
    const range = getPickerRange();
    return (
      <View className={styles.pickerOverlay}>
        <View className={styles.pickerCard}>
          <Text className={styles.pickerTitle}>
            {moveTargetType === 'cabinet' ? '选择目标展柜' : moveTargetType === 'shelf' ? '选择目标层' : '选择目标位置'}
          </Text>
          <Picker
            mode='selector'
            range={range}
            onChange={handlePickerConfirm}
          >
            <View className={styles.pickerTrigger}>
              <Text className={styles.pickerTriggerText}>点击选择</Text>
            </View>
          </Picker>
          <Button
            className={styles.pickerCancelBtn}
            onClick={() => setMovePickerVisible(false)}
          >
            <Text>取消</Text>
          </Button>
        </View>
      </View>
    );
  };

  const renderInventorySelect = () => (
    <View className={styles.inventorySelect}>
      <Text className={styles.inventorySelectTitle}>选择要盘点的展柜</Text>
      {cabinetNames.length > 0 ? (
        <View className={styles.inventoryCabinetList}>
          {cabinetNames.map(name => (
            <Button
              key={name}
              className={styles.inventoryCabinetBtn}
              onClick={() => handleStartInventory(name)}
            >
              <Text>{name}</Text>
            </Button>
          ))}
        </View>
      ) : (
        <Text className={styles.inventoryEmpty}>暂无展柜</Text>
      )}
    </View>
  );

  const renderInventoryChecking = () => {
    if (!currentInventoryShelf) return null;
    const totalShelves = getInventoryShelves().length;

    return (
      <View className={styles.inventoryChecking}>
        <View className={styles.inventoryProgress}>
          <Text className={styles.inventoryProgressText}>
            {inventoryCabinet} - 第 {currentInventoryShelf.shelfNum} 层 ({currentShelfIndex + 1}/{totalShelves})
          </Text>
        </View>
        <View className={styles.inventoryShelfItems}>
          {currentInventoryShelf.items.map((item) => {
            if (!item) return null;
            const inventoryItem = activeInventory?.items.find(i => i.collectionId === item.id);
            const statusIcon = inventoryItem
              ? getInventoryStatusIcon(inventoryItem.isMatch ? 'checked' : 'mismatch')
              : getInventoryStatusIcon('unchecked');
            return (
              <View key={item.id} className={styles.inventoryItem}>
                <View className={styles.inventoryItemLeft}>
                  <Image
                    src={getCoverPhoto(item)}
                    mode="aspectFill"
                    className={styles.inventoryItemImg}
                  />
                  <View className={styles.inventoryItemInfo}>
                    <Text className={styles.inventoryItemName}>{item.characterName}</Text>
                    <Text className={styles.inventoryItemExpected}>
                      预期: {getCollectionStatusIcon(item.collectionStatus)} {getCollectionStatusText(item.collectionStatus)}
                    </Text>
                  </View>
                  <Text className={styles.inventoryStatusIcon}>{statusIcon}</Text>
                </View>
                <View className={styles.inventoryItemActions}>
                  {(['in_cabinet', 'loaned', 'pending_confirm'] as const).map(status => (
                    <Button
                      key={status}
                      className={classnames(
                        styles.inventoryStatusBtn,
                        inventoryItem?.actualStatus === status && styles.inventoryStatusBtnActive,
                        status === 'in_cabinet' && styles.statusInCabinet,
                        status === 'loaned' && styles.statusLoaned,
                        status === 'pending_confirm' && styles.statusPending
                      )}
                      onClick={() => handleInventoryItemStatus(item.id, status)}
                    >
                      <Text>{getCollectionStatusIcon(status)} {getCollectionStatusText(status)}</Text>
                    </Button>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
        <View className={styles.inventoryNav}>
          <Button
            className={classnames(styles.inventoryNavBtn, currentShelfIndex <= 0 && styles.disabled)}
            onClick={() => setCurrentShelfIndex(prev => Math.max(0, prev - 1))}
          >
            <Text>上一层</Text>
          </Button>
          {currentShelfIndex >= totalShelves - 1 ? (
            <Button className={styles.inventoryCompleteBtn} onClick={handleFinishInventory}>
              <Text>完成盘点</Text>
            </Button>
          ) : (
            <Button
              className={styles.inventoryNavBtn}
              onClick={() => setCurrentShelfIndex(prev => prev + 1)}
            >
              <Text>下一层</Text>
            </Button>
          )}
        </View>
      </View>
    );
  };

  const renderInventorySummary = () => (
    <View className={styles.inventorySummary}>
      <View className={styles.inventorySummaryHeader}>
        <Text className={styles.inventorySummaryTitle}>盘点完成</Text>
        {latestInventoryDate && (
          <Text className={styles.inventorySummaryDate}>最近盘点: {latestInventoryDate}</Text>
        )}
      </View>
      {discrepancies.length > 0 ? (
        <View className={styles.discrepancyList}>
          <Text className={styles.discrepancyTitle}>差异清单 ({discrepancies.length}项)</Text>
          {discrepancies.map(d => (
            <View key={d.collectionId} className={styles.discrepancyItem}>
              <Text className={styles.discrepancyName}>{d.collectionName}</Text>
              <View className={styles.discrepancyDetail}>
                <Text className={styles.discrepancyExpected}>
                  预期: {getCollectionStatusIcon(d.expectedStatus)} {getCollectionStatusText(d.expectedStatus)}
                </Text>
                <Text className={styles.discrepancyArrow}>→</Text>
                <Text className={styles.discrepancyActual}>
                  实际: {getCollectionStatusIcon(d.actualStatus)} {getCollectionStatusText(d.actualStatus)}
                </Text>
              </View>
              {d.notes && <Text className={styles.discrepancyNotes}>备注: {d.notes}</Text>}
            </View>
          ))}
        </View>
      ) : (
        <View className={styles.noDiscrepancy}>
          <Text className={styles.noDiscrepancyIcon}>✅</Text>
          <Text className={styles.noDiscrepancyText}>全部一致，无差异</Text>
        </View>
      )}
      <Button className={styles.inventoryExitBtn} onClick={handleExitInventory}>
        <Text>退出盘点</Text>
      </Button>
    </View>
  );

  const renderInventoryMode = () => {
    if (inventoryStep === 'select') return renderInventorySelect();
    if (inventoryStep === 'checking') return renderInventoryChecking();
    if (inventoryStep === 'summary') return renderInventorySummary();
    return null;
  };

  if (inventoryMode) {
    return (
      <View className={styles.page}>
        <View className={styles.inventoryToolbar}>
          <Button className={styles.inventoryBackBtn} onClick={handleExitInventory}>
            <Text>← 退出盘点</Text>
          </Button>
          <Text className={styles.inventoryToolbarTitle}>年度盘点</Text>
        </View>
        <ScrollView scrollY enhanced className={styles.cabinetScroll}>
          {renderInventoryMode()}
        </ScrollView>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.toolbar}>
        <Button
          className={classnames(styles.toolBtn, editMode && styles.active)}
          onClick={handleToggleEdit}
        >
          <Text>{editMode ? '取消编辑' : '编辑布局'}</Text>
        </Button>
        <Button
          className={classnames(styles.toolBtn, styles.inventoryBtn)}
          onClick={() => setInventoryMode(true)}
        >
          <Text>🔍 年度盘点</Text>
        </Button>
        {latestInventoryDate && (
          <Text className={styles.lastInventoryDate}>上次盘点: {latestInventoryDate}</Text>
        )}
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
                                  src={getCoverPhoto(item)}
                                  mode="aspectFill"
                                  className={styles.itemImage}
                                  onError={(e) => console.error('[Image] Failed to load:', e)}
                                />
                              </View>
                              <Text className={styles.itemName}>{item.characterName}</Text>
                              <Text className={styles.itemInfo}>{item.scale}</Text>
                              {editMode && (
                                <View className={styles.itemEditOverlay}>
                                  <View className={styles.positionTag}>
                                    <Text>{cabinetName}-{shelfNum}层-位{posIndex + 1}</Text>
                                  </View>
                                  <View className={styles.moveActions}>
                                    <Button
                                      className={classnames(styles.moveBtn, styles.moveCabinetBtn)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveAction('cabinet', item.id, cabinetName, shelfNum, posIndex);
                                      }}
                                    >
                                      <Text>换柜</Text>
                                    </Button>
                                    <Button
                                      className={classnames(styles.moveBtn, styles.moveShelfBtn)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveAction('shelf', item.id, cabinetName, shelfNum, posIndex);
                                      }}
                                    >
                                      <Text>换层</Text>
                                    </Button>
                                    <Button
                                      className={classnames(styles.moveBtn, styles.movePosBtn)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveAction('position', item.id, cabinetName, shelfNum, posIndex);
                                      }}
                                    >
                                      <Text>换位</Text>
                                    </Button>
                                  </View>
                                  {!item.isUnboxed && (
                                    <Button
                                      className={styles.unboxBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markUnboxed(item.id);
                                        Taro.showToast({ title: '已标记拆封', icon: 'success' });
                                      }}
                                    >
                                      <Text>拆封</Text>
                                    </Button>
                                  )}
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
                          src={getCoverPhoto(item)}
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

      {renderMovePicker()}
    </View>
  );
};

export default CabinetPage;
