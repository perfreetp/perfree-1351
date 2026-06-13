import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button, Swiper, SwiperItem, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import { CollectionItem } from '../../types/collection';
import {
  formatPrice,
  getMaintenanceTypeText,
  getFlawStatusText,
  getPartStatusText,
  getTimelineTypeText,
  getTimelineTypeIcon,
  getCollectionStatusText,
  getCollectionStatusIcon,
  getInventoryStatusText,
  getInventoryStatusIcon,
  getMaterialText
} from '../../utils';

type AddModalType = 'maintenance' | 'flaw' | 'part' | null;
type CollectionStatus = CollectionItem['collectionStatus'];

const STATUS_OPTIONS: { value: CollectionStatus; label: string }[] = [
  { value: 'in_cabinet', label: '在柜' },
  { value: 'loaned', label: '借出' },
  { value: 'sold', label: '已出' },
  { value: 'pending_confirm', label: '待确认' }
];

const DetailPage: React.FC = () => {
  const router = useRouter();
  const {
    getCollectionById,
    updateCollection,
    deleteCollection,
    addMaintenanceRecord,
    addFlawRecord,
    addReplacementPart,
    updateFlawStatus,
    updatePartStatus,
    addPhotos,
    removePhoto,
    setCoverPhoto,
    getCoverPhoto,
    markUnboxed,
    getTimeline
  } = useCollection();
  const [activeTab, setActiveTab] = useState<'timeline' | 'flaws' | 'parts' | 'maintenance'>('timeline');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState<AddModalType>(null);
  const [salePriceInput, setSalePriceInput] = useState('');
  const [showSalePriceModal, setShowSalePriceModal] = useState(false);

  const [maintForm, setMaintForm] = useState({
    type: 'dust' as 'dust' | 'light_protection' | 'other',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [flawForm, setFlawForm] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as 'pending' | 'resolved'
  });
  const [partForm, setPartForm] = useState({
    description: '',
    applyDate: new Date().toISOString().split('T')[0],
    status: 'pending' as 'pending' | 'received'
  });

  const id = router.params.id as string;
  const item = useMemo(() => getCollectionById(id), [id, getCollectionById]);
  const timeline = useMemo(() => getTimeline(id), [id, getTimeline]);
  const coverPhoto = useMemo(() => item ? getCoverPhoto(item) : '', [item, getCoverPhoto]);

  if (!item) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>❓</Text>
          <Text className={styles.emptyText}>藏品不存在</Text>
        </View>
      </View>
    );
  }

  const handleToggleUnboxed = () => {
    if (item.isUnboxed) {
      updateCollection(item.id, { isUnboxed: false, unboxedDate: undefined });
      Taro.showToast({ title: '已标记为未拆封', icon: 'success' });
    } else {
      markUnboxed(item.id);
      Taro.showToast({ title: '已标记为已拆封', icon: 'success' });
    }
  };

  const handleSetCover = (index: number) => {
    setCoverPhoto(item.id, index);
    Taro.showToast({ title: '已设为封面', icon: 'success' });
  };

  const handleStatusChange = (newStatus: CollectionStatus) => {
    if (newStatus === 'sold') {
      setShowSalePriceModal(true);
      return;
    }
    updateCollection(item.id, { collectionStatus: newStatus });
    Taro.showToast({ title: `状态已更新为${getCollectionStatusText(newStatus)}`, icon: 'success' });
  };

  const handleSalePriceConfirm = () => {
    const price = parseFloat(salePriceInput);
    if (isNaN(price) || price < 0) {
      Taro.showToast({ title: '请输入有效的出手价', icon: 'none' });
      return;
    }
    updateCollection(item.id, { collectionStatus: 'sold', salePrice: price });
    setShowSalePriceModal(false);
    setSalePriceInput('');
    Taro.showToast({ title: '已标记为已出', icon: 'success' });
  };

  const handleDelete = () => {
    Taro.showModal({
      title: '删除藏品',
      content: `确定要删除「${item.characterName}」吗？此操作不可恢复。`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          deleteCollection(item.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1000);
        }
      }
    });
  };

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - item.photos.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      await addPhotos(item.id, res.tempFilePaths);
      Taro.showToast({ title: '照片已添加', icon: 'success' });
    } catch (e) {
      console.error('[Detail] Failed to choose image:', e);
    }
  };

  const handleDeletePhoto = (index: number) => {
    Taro.showModal({
      title: '删除照片',
      content: '确定删除这张照片吗？',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          removePhoto(item.id, index);
          Taro.showToast({ title: '照片已删除', icon: 'success' });
        }
      }
    });
  };

  const handleSaveMaintenance = () => {
    if (!maintForm.description.trim()) {
      Taro.showToast({ title: '请输入维护描述', icon: 'none' });
      return;
    }
    addMaintenanceRecord(item.id, {
      type: maintForm.type,
      date: maintForm.date,
      description: maintForm.description.trim()
    });
    setShowAddModal(null);
    setMaintForm({
      type: 'dust',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setActiveTab('timeline');
    Taro.showToast({ title: '维护记录已添加', icon: 'success' });
  };

  const handleSaveFlaw = () => {
    if (!flawForm.description.trim()) {
      Taro.showToast({ title: '请输入瑕疵描述', icon: 'none' });
      return;
    }
    addFlawRecord(item.id, {
      description: flawForm.description.trim(),
      date: flawForm.date,
      photos: [],
      status: flawForm.status
    });
    setShowAddModal(null);
    setFlawForm({
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    });
    setActiveTab('timeline');
    Taro.showToast({ title: '瑕疵记录已添加', icon: 'success' });
  };

  const handleSavePart = () => {
    if (!partForm.description.trim()) {
      Taro.showToast({ title: '请输入补件描述', icon: 'none' });
      return;
    }
    addReplacementPart(item.id, {
      description: partForm.description.trim(),
      applyDate: partForm.applyDate,
      status: partForm.status
    });
    setShowAddModal(null);
    setPartForm({
      description: '',
      applyDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    });
    setActiveTab('timeline');
    Taro.showToast({ title: '补件记录已添加', icon: 'success' });
  };

  const handleFlawStatusToggle = (flawId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
    updateFlawStatus(item.id, flawId, newStatus);
    Taro.showToast({ title: newStatus === 'resolved' ? '已标记为已解决' : '已标记为待处理', icon: 'success' });
  };

  const handlePartStatusToggle = (partId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'received' : 'pending';
    updatePartStatus(item.id, partId, newStatus);
    Taro.showToast({ title: newStatus === 'received' ? '已标记为已收到' : '已标记为待补发', icon: 'success' });
  };

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/add/index?id=${item.id}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.photoContainer}>
        <Swiper
          className={styles.photoSwiper}
          circular
          autoplay={false}
          current={currentPhotoIndex}
          onChange={(e) => setCurrentPhotoIndex(e.detail.current)}
        >
          {item.photos.map((photo, index) => (
            <SwiperItem key={index}>
              <Image
                src={photo}
                mode="aspectFill"
                className={styles.swiperImage}
                onError={(e) => console.error('[Image] Failed to load:', e)}
              />
              <View className={styles.photoDeleteBtn} onClick={() => handleDeletePhoto(index)}>
                <Text>×</Text>
              </View>
              {photo === coverPhoto && (
                <View className={styles.coverStar}>
                  <Text>⭐</Text>
                </View>
              )}
              <View className={styles.setCoverBtn} onClick={() => handleSetCover(index)}>
                <Text>{photo === coverPhoto ? '当前封面' : '设为封面'}</Text>
              </View>
            </SwiperItem>
          ))}
        </Swiper>
        <View className={styles.photoActions}>
          <View className={styles.swiperIndicator}>
            {item.photos.map((_, index) => (
              <View
                key={index}
                className={classnames(styles.indicatorDot, currentPhotoIndex === index && styles.active)}
              />
            ))}
          </View>
          {item.photos.length < 9 && (
            <Button className={styles.addPhotoBtn} onClick={handleChooseImage}>
              <Text>+ 添加照片</Text>
            </Button>
          )}
        </View>
      </View>

      <ScrollView scrollY enhanced>
        <View className={styles.infoSection}>
          <View className={styles.nameRow}>
            <Text className={styles.characterName}>{item.characterName}</Text>
            <View className={styles.statusTags}>
              <View className={classnames(styles.statusTag, styles[item.collectionStatus])}>
                <Text>{getCollectionStatusIcon(item.collectionStatus)} {getCollectionStatusText(item.collectionStatus)}</Text>
              </View>
              {!item.hasArrived && (
                <View className={classnames(styles.statusTag, styles.pending)}>
                  <Text>待到货</Text>
                </View>
              )}
              {item.hasArrived && item.isUnboxed && (
                <View className={classnames(styles.statusTag, styles.unboxed)}>
                  <Text>已拆封</Text>
                </View>
              )}
              {item.hasArrived && !item.isUnboxed && (
                <View className={classnames(styles.statusTag, styles.sealed)}>
                  <Text>未拆封</Text>
                </View>
              )}
              {item.flaws.length > 0 && (
                <View className={classnames(styles.statusTag, styles.flaw)}>
                  <Text>有瑕疵</Text>
                </View>
              )}
            </View>
          </View>

          <Text className={styles.seriesName}>{item.seriesName}</Text>

          <View className={styles.metaGrid}>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>比例</Text>
              <Text className={styles.metaValue}>{item.scale}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>厂商</Text>
              <Text className={styles.metaValue}>{item.manufacturer}</Text>
            </View>
            {item.material && (
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>材质</Text>
                <Text className={styles.metaValue}>{getMaterialText(item.material)}</Text>
              </View>
            )}
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>购买价格</Text>
              <Text className={classnames(styles.metaValue, styles.price)}>
                {formatPrice(item.purchasePrice)}
              </Text>
            </View>
            {item.currentValue != null && (
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>当前估值</Text>
                <Text className={classnames(styles.metaValue, styles.price)}>
                  {formatPrice(item.currentValue)}
                </Text>
              </View>
            )}
            {item.collectionStatus === 'sold' && item.salePrice != null && (
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>出手价</Text>
                <Text className={classnames(styles.metaValue, styles.price)}>
                  {formatPrice(item.salePrice)}
                </Text>
              </View>
            )}
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>购买日期</Text>
              <Text className={styles.metaValue}>{item.purchaseDate}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>摆放位置</Text>
              <Text className={styles.metaValue}>{item.displayLocation}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>到货日期</Text>
              <Text className={styles.metaValue}>
                {item.hasArrived ? item.arrivalDate || '已到货' : '待到货'}
              </Text>
            </View>
            {item.unboxedDate && (
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>拆封日期</Text>
                <Text className={styles.metaValue}>{item.unboxedDate}</Text>
              </View>
            )}
            {item.inventoryStatus && (
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>盘点状态</Text>
                <Text className={styles.metaValue}>
                  {getInventoryStatusIcon(item.inventoryStatus)} {getInventoryStatusText(item.inventoryStatus)}
                </Text>
              </View>
            )}
            {item.reservationDate && (
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>预订日期</Text>
                <Text className={styles.metaValue}>{item.reservationDate}</Text>
              </View>
            )}
            {item.balanceDueDate && (
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>尾款截止</Text>
                <Text className={classnames(styles.metaValue, styles.warning)}>
                  {item.balanceDueDate}
                </Text>
              </View>
            )}
          </View>

          <View className={styles.statusSelector}>
            <Text className={styles.statusSelectorLabel}>收藏状态</Text>
            <View className={styles.statusSelectorOptions}>
              {STATUS_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  className={classnames(
                    styles.statusOptionBtn,
                    item.collectionStatus === opt.value && styles.statusOptionActive,
                    opt.value === 'sold' && styles.statusOptionSold
                  )}
                  onClick={() => handleStatusChange(opt.value)}
                >
                  <Text>{getCollectionStatusIcon(opt.value)} {opt.label}</Text>
                </Button>
              ))}
            </View>
          </View>

          {item.notes && (
            <View className={styles.notes}>
              <Text className={styles.notesLabel}>备注</Text>
              <Text className={styles.notesContent}>{item.notes}</Text>
            </View>
          )}
        </View>

        <View className={styles.tabBar}>
          <Button
            className={classnames(styles.tabBtn, activeTab === 'timeline' && styles.active)}
            onClick={() => setActiveTab('timeline')}
          >
            <Text>时间轴</Text>
          </Button>
          <Button
            className={classnames(styles.tabBtn, activeTab === 'flaws' && styles.active)}
            onClick={() => setActiveTab('flaws')}
          >
            <Text>瑕疵 ({item.flaws.length})</Text>
          </Button>
          <Button
            className={classnames(styles.tabBtn, activeTab === 'parts' && styles.active)}
            onClick={() => setActiveTab('parts')}
          >
            <Text>补件 ({item.replacementParts.length})</Text>
          </Button>
          <Button
            className={classnames(styles.tabBtn, activeTab === 'maintenance' && styles.active)}
            onClick={() => setActiveTab('maintenance')}
          >
            <Text>维护 ({item.maintenanceRecords.length})</Text>
          </Button>
        </View>

        <View className={styles.listSection}>
          {activeTab === 'timeline' && (
            <>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>维护时间轴</Text>
              </View>
              {timeline.length > 0 ? (
                <View className={styles.timeline}>
                  {timeline.map(event => (
                    <View key={event.id} className={styles.timelineItem}>
                      <View className={classnames(styles.timelineDot, event.type)} />
                      <View className={styles.timelineLine} />
                      <View className={styles.timelineContent}>
                        <View className={styles.timelineHeader}>
                          <Text className={styles.timelineIcon}>{getTimelineTypeIcon(event.type)}</Text>
                          <Text className={classnames(styles.timelineType, event.type)}>
                            {getTimelineTypeText(event.type)}
                          </Text>
                          <Text className={styles.timelineDate}>{event.date}</Text>
                        </View>
                        <Text className={styles.timelineDesc}>{event.description}</Text>
                        {event.status && (
                          <Text className={classnames(styles.timelineStatus, event.status)}>
                            {event.type === 'flaw'
                              ? getFlawStatusText(event.status)
                              : getPartStatusText(event.status)
                            }
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>📋</Text>
                  <Text className={styles.emptyText}>暂无维护记录</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'flaws' && (
            <>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>瑕疵记录</Text>
                <Button className={styles.addRecordBtn} onClick={() => setShowAddModal('flaw')}>
                  <Text>+ 添加</Text>
                </Button>
              </View>
              {item.flaws.length > 0 ? (
                <View className={styles.list}>
                  {item.flaws.map(flaw => (
                    <View key={flaw.id} className={styles.recordCard}>
                      <View className={styles.recordHeader}>
                        <View
                          className={classnames(styles.statusBadge, flaw.status)}
                          onClick={() => handleFlawStatusToggle(flaw.id, flaw.status)}
                        >
                          <Text>{getFlawStatusText(flaw.status)}</Text>
                        </View>
                        <Text className={styles.recordDate}>{flaw.date}</Text>
                      </View>
                      <Text className={styles.recordDesc}>{flaw.description}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>✨</Text>
                  <Text className={styles.emptyText}>暂无瑕疵记录</Text>
                  <Button className={styles.emptyAddBtn} onClick={() => setShowAddModal('flaw')}>
                    <Text>添加瑕疵记录</Text>
                  </Button>
                </View>
              )}
            </>
          )}

          {activeTab === 'parts' && (
            <>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>补件记录</Text>
                <Button className={styles.addRecordBtn} onClick={() => setShowAddModal('part')}>
                  <Text>+ 添加</Text>
                </Button>
              </View>
              {item.replacementParts.length > 0 ? (
                <View className={styles.list}>
                  {item.replacementParts.map(part => (
                    <View key={part.id} className={styles.recordCard}>
                      <View className={styles.recordHeader}>
                        <View
                          className={classnames(styles.statusBadge, part.status)}
                          onClick={() => handlePartStatusToggle(part.id, part.status)}
                        >
                          <Text>{getPartStatusText(part.status)}</Text>
                        </View>
                        <Text className={styles.recordDate}>
                          {part.receivedDate ? `收到：${part.receivedDate}` : `申请：${part.applyDate}`}
                        </Text>
                      </View>
                      <Text className={styles.recordDesc}>{part.description}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>📦</Text>
                  <Text className={styles.emptyText}>暂无补件记录</Text>
                  <Button className={styles.emptyAddBtn} onClick={() => setShowAddModal('part')}>
                    <Text>添加补件记录</Text>
                  </Button>
                </View>
              )}
            </>
          )}

          {activeTab === 'maintenance' && (
            <>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>维护记录</Text>
                <Button className={styles.addRecordBtn} onClick={() => setShowAddModal('maintenance')}>
                  <Text>+ 添加</Text>
                </Button>
              </View>
              {item.maintenanceRecords.length > 0 ? (
                <View className={styles.list}>
                  {item.maintenanceRecords.map(record => (
                    <View key={record.id} className={styles.recordCard}>
                      <View className={styles.recordHeader}>
                        <View className={classnames(styles.recordType, record.type)}>
                          <Text>{getMaintenanceTypeText(record.type)}</Text>
                        </View>
                        <Text className={styles.recordDate}>{record.date}</Text>
                      </View>
                      <Text className={styles.recordDesc}>{record.description}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>📋</Text>
                  <Text className={styles.emptyText}>暂无维护记录</Text>
                  <Button className={styles.emptyAddBtn} onClick={() => setShowAddModal('maintenance')}>
                    <Text>添加维护记录</Text>
                  </Button>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <View className={styles.actionBar}>
        <Button
          className={classnames(styles.actionBtn, styles.secondary)}
          onClick={handleToggleUnboxed}
        >
          <Text>{item.isUnboxed ? '标记未拆' : '标记已拆'}</Text>
        </Button>
        <Button
          className={classnames(styles.actionBtn, styles.secondary)}
          onClick={() => setShowAddModal('maintenance')}
        >
          <Text>添加维护</Text>
        </Button>
        <Button
          className={classnames(styles.actionBtn, styles.primary)}
          onClick={handleEdit}
        >
          <Text>编辑</Text>
        </Button>
        <Button
          className={classnames(styles.actionBtn, styles.danger)}
          onClick={handleDelete}
        >
          <Text>删除</Text>
        </Button>
      </View>

      {showSalePriceModal && (
        <View className={styles.modalOverlay} onClick={() => { setShowSalePriceModal(false); setSalePriceInput(''); }}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>填写出手价</Text>
            <View className={styles.modalField}>
              <Text className={styles.modalLabel}>出手价格</Text>
              <Input
                className={styles.modalInput}
                type="digit"
                placeholder="请输入出手价格"
                placeholderTextColor="#64748B"
                value={salePriceInput}
                onInput={(e) => setSalePriceInput(e.detail.value)}
              />
            </View>
            <View className={styles.modalActions}>
              <Button className={styles.modalCancelBtn} onClick={() => { setShowSalePriceModal(false); setSalePriceInput(''); }}>
                <Text>取消</Text>
              </Button>
              <Button className={styles.modalConfirmBtn} onClick={handleSalePriceConfirm}>
                <Text>确认</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      {showAddModal && (
        <View className={styles.modalOverlay} onClick={() => setShowAddModal(null)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            {showAddModal === 'maintenance' && (
              <>
                <Text className={styles.modalTitle}>添加维护记录</Text>
                <View className={styles.typeSelector}>
                  {(['dust', 'light_protection', 'other'] as const).map(t => (
                    <Button
                      key={t}
                      className={classnames(styles.typeOption, maintForm.type === t && styles.typeActive)}
                      onClick={() => setMaintForm(prev => ({ ...prev, type: t }))}
                    >
                      <Text>{getMaintenanceTypeText(t)}</Text>
                    </Button>
                  ))}
                </View>
                <View className={styles.modalField}>
                  <Text className={styles.modalLabel}>维护日期</Text>
                  <Input
                    className={styles.modalInput}
                    type="text"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                    value={maintForm.date}
                    onInput={(e) => setMaintForm(prev => ({ ...prev, date: e.detail.value }))}
                  />
                </View>
                <View className={styles.modalField}>
                  <Text className={styles.modalLabel}>维护描述</Text>
                  <Textarea
                    className={styles.modalTextarea}
                    placeholder="描述维护内容，如除尘部位、避光措施等"
                    placeholderTextColor="#64748B"
                    value={maintForm.description}
                    onInput={(e) => setMaintForm(prev => ({ ...prev, description: e.detail.value }))}
                  />
                </View>
                <View className={styles.modalActions}>
                  <Button className={styles.modalCancelBtn} onClick={() => setShowAddModal(null)}>
                    <Text>取消</Text>
                  </Button>
                  <Button className={styles.modalConfirmBtn} onClick={handleSaveMaintenance}>
                    <Text>保存</Text>
                  </Button>
                </View>
              </>
            )}

            {showAddModal === 'flaw' && (
              <>
                <Text className={styles.modalTitle}>添加瑕疵记录</Text>
                <View className={styles.modalField}>
                  <Text className={styles.modalLabel}>发现日期</Text>
                  <Input
                    className={styles.modalInput}
                    type="text"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                    value={flawForm.date}
                    onInput={(e) => setFlawForm(prev => ({ ...prev, date: e.detail.value }))}
                  />
                </View>
                <View className={styles.modalField}>
                  <Text className={styles.modalLabel}>瑕疵描述</Text>
                  <Textarea
                    className={styles.modalTextarea}
                    placeholder="描述瑕疵情况，如掉漆、变形等"
                    placeholderTextColor="#64748B"
                    value={flawForm.description}
                    onInput={(e) => setFlawForm(prev => ({ ...prev, description: e.detail.value }))}
                  />
                </View>
                <View className={styles.typeSelector}>
                  <Button
                    className={classnames(styles.typeOption, flawForm.status === 'pending' && styles.typeActive)}
                    onClick={() => setFlawForm(prev => ({ ...prev, status: 'pending' }))}
                  >
                    <Text>待处理</Text>
                  </Button>
                  <Button
                    className={classnames(styles.typeOption, flawForm.status === 'resolved' && styles.typeActive)}
                    onClick={() => setFlawForm(prev => ({ ...prev, status: 'resolved' }))}
                  >
                    <Text>已解决</Text>
                  </Button>
                </View>
                <View className={styles.modalActions}>
                  <Button className={styles.modalCancelBtn} onClick={() => setShowAddModal(null)}>
                    <Text>取消</Text>
                  </Button>
                  <Button className={styles.modalConfirmBtn} onClick={handleSaveFlaw}>
                    <Text>保存</Text>
                  </Button>
                </View>
              </>
            )}

            {showAddModal === 'part' && (
              <>
                <Text className={styles.modalTitle}>添加补件记录</Text>
                <View className={styles.modalField}>
                  <Text className={styles.modalLabel}>申请日期</Text>
                  <Input
                    className={styles.modalInput}
                    type="text"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                    value={partForm.applyDate}
                    onInput={(e) => setPartForm(prev => ({ ...prev, applyDate: e.detail.value }))}
                  />
                </View>
                <View className={styles.modalField}>
                  <Text className={styles.modalLabel}>补件描述</Text>
                  <Textarea
                    className={styles.modalTextarea}
                    placeholder="描述需要补发的配件信息"
                    placeholderTextColor="#64748B"
                    value={partForm.description}
                    onInput={(e) => setPartForm(prev => ({ ...prev, description: e.detail.value }))}
                  />
                </View>
                <View className={styles.typeSelector}>
                  <Button
                    className={classnames(styles.typeOption, partForm.status === 'pending' && styles.typeActive)}
                    onClick={() => setPartForm(prev => ({ ...prev, status: 'pending' }))}
                  >
                    <Text>待补发</Text>
                  </Button>
                  <Button
                    className={classnames(styles.typeOption, partForm.status === 'received' && styles.typeActive)}
                    onClick={() => setPartForm(prev => ({ ...prev, status: 'received' }))}
                  >
                    <Text>已收到</Text>
                  </Button>
                </View>
                <View className={styles.modalActions}>
                  <Button className={styles.modalCancelBtn} onClick={() => setShowAddModal(null)}>
                    <Text>取消</Text>
                  </Button>
                  <Button className={styles.modalConfirmBtn} onClick={handleSavePart}>
                    <Text>保存</Text>
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default DetailPage;
