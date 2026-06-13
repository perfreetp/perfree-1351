import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button, Swiper, SwiperItem, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import { formatPrice, getMaintenanceTypeText, getFlawStatusText, getPartStatusText } from '../../utils';

const DetailPage: React.FC = () => {
  const router = useRouter();
  const { getCollectionById, updateCollection, deleteCollection } = useCollection();
  const [activeTab, setActiveTab] = useState<'flaws' | 'parts' | 'maintenance'>('flaws');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const id = router.params.id as string;
  const item = useMemo(() => getCollectionById(id), [id, getCollectionById]);

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
    updateCollection(item.id, { isUnboxed: !item.isUnboxed });
    Taro.showToast({ 
      title: item.isUnboxed ? '已标记为未拆封' : '已标记为已拆封', 
      icon: 'success' 
    });
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

  const handleEdit = () => {
    Taro.showToast({ title: '编辑功能开发中', icon: 'none' });
  };

  const handleAddMaintenance = () => {
    Taro.showToast({ title: '添加维护记录功能开发中', icon: 'none' });
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
            </SwiperItem>
          ))}
        </Swiper>
        <View className={styles.swiperIndicator}>
          {item.photos.map((_, index) => (
            <View
              key={index}
              className={classnames(styles.indicatorDot, currentPhotoIndex === index && styles.active)}
            />
          ))}
        </View>
      </View>

      <ScrollView scrollY enhanced>
        <View className={styles.infoSection}>
          <View className={styles.nameRow}>
            <Text className={styles.characterName}>{item.characterName}</Text>
            <View className={styles.statusTags}>
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
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>购买价格</Text>
              <Text className={classnames(styles.metaValue, styles.price)}>
                {formatPrice(item.purchasePrice)}
              </Text>
            </View>
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
            {item.reservationDate && (
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>预订日期</Text>
                <Text className={styles.metaValue}>{item.reservationDate}</Text>
              </View>
            )}
            {item.balanceDueDate && (
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>尾款截止</Text>
                <Text className={styles.metaValue}>{item.balanceDueDate}</Text>
              </View>
            )}
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
          {activeTab === 'flaws' && (
            item.flaws.length > 0 ? (
              <View className={styles.list}>
                {item.flaws.map(flaw => (
                  <View key={flaw.id} className={styles.recordCard}>
                    <View className={styles.recordHeader}>
                      <View className={classnames(styles.statusBadge, flaw.status)}>
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
              </View>
            )
          )}

          {activeTab === 'parts' && (
            item.replacementParts.length > 0 ? (
              <View className={styles.list}>
                {item.replacementParts.map(part => (
                  <View key={part.id} className={styles.recordCard}>
                    <View className={styles.recordHeader}>
                      <View className={classnames(styles.statusBadge, part.status)}>
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
              </View>
            )
          )}

          {activeTab === 'maintenance' && (
            item.maintenanceRecords.length > 0 ? (
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
              </View>
            )
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
          onClick={handleAddMaintenance}
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
    </View>
  );
};

export default DetailPage;
