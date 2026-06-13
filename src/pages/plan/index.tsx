import React, { useState, useMemo } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import PlanCard from '../../components/PlanCard';
import { CollectionItem } from '../../types/collection';

const PlanPage: React.FC = () => {
  const { collections, updateCollection } = useCollection();
  const [activeTab, setActiveTab] = useState<'pending' | 'arrived'>('pending');

  const pendingItems = useMemo(() => {
    return collections
      .filter(item => !item.hasArrived)
      .sort((a, b) => {
        if (!a.balanceDueDate && !b.balanceDueDate) return 0;
        if (!a.balanceDueDate) return 1;
        if (!b.balanceDueDate) return -1;
        return new Date(a.balanceDueDate).getTime() - new Date(b.balanceDueDate).getTime();
      });
  }, [collections]);

  const arrivedItems = useMemo(() => {
    return collections
      .filter(item => item.hasArrived)
      .sort((a, b) => {
        if (!a.arrivalDate && !b.arrivalDate) return 0;
        if (!a.arrivalDate) return 1;
        if (!b.arrivalDate) return -1;
        return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime();
      });
  }, [collections]);

  const handlePayBalance = (item: CollectionItem) => {
    Taro.showModal({
      title: '支付尾款',
      content: `确认支付 ${item.characterName} 的尾款 ¥${item.purchasePrice}？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '支付成功', icon: 'success' });
          console.log('[Plan] Paid balance for:', item.id);
        }
      }
    });
  };

  const handleMarkArrived = (item: CollectionItem) => {
    Taro.showModal({
      title: '标记到货',
      content: `确认 ${item.characterName} 已到货？`,
      success: (res) => {
        if (res.confirm) {
          updateCollection(item.id, {
            hasArrived: true,
            arrivalDate: new Date().toISOString().split('T')[0],
            isUnboxed: false,
            displayLocation: '待摆放'
          });
          Taro.showToast({ title: '已标记到货', icon: 'success' });
        }
      }
    });
  };

  const handleItemClick = (item: CollectionItem) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` });
  };

  usePullDownRefresh(() => {
    console.log('[Plan] Pull down refresh');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  return (
    <View className={styles.page}>
      <View className={styles.statsBar}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{pendingItems.length}</Text>
          <Text className={styles.statLabel}>待到货</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{arrivedItems.length}</Text>
          <Text className={styles.statLabel}>已到货</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>
            ¥{pendingItems.reduce((sum, item) => sum + item.purchasePrice, 0).toLocaleString()}
          </Text>
          <Text className={styles.statLabel}>待支付</Text>
        </View>
      </View>

      <View className={styles.tabBar}>
        <Button
          className={classnames(styles.tabBtn, activeTab === 'pending' && styles.active)}
          onClick={() => setActiveTab('pending')}
        >
          <Text>待到货 ({pendingItems.length})</Text>
        </Button>
        <Button
          className={classnames(styles.tabBtn, activeTab === 'arrived' && styles.active)}
          onClick={() => setActiveTab('arrived')}
        >
          <Text>已到货 ({arrivedItems.length})</Text>
        </Button>
      </View>

      <ScrollView className={styles.listSection} scrollY enhanced>
        {activeTab === 'pending' ? (
          <>
            <Text className={styles.sectionTitle}>预订中</Text>
            {pendingItems.length > 0 ? (
              <View className={styles.list}>
                {pendingItems.map(item => (
                  <View key={item.id} onClick={() => handleItemClick(item)}>
                    <PlanCard
                      item={item}
                      onPayBalance={() => handlePayBalance(item)}
                      onMarkArrived={() => handleMarkArrived(item)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📦</Text>
                <Text className={styles.emptyText}>暂无预订中的手办</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text className={styles.sectionTitle}>近期到货</Text>
            {arrivedItems.length > 0 ? (
              <View className={styles.list}>
                {arrivedItems.slice(0, 10).map(item => (
                  <View 
                    key={item.id} 
                    className={styles.arrivedItem}
                    onClick={() => handleItemClick(item)}
                  >
                    <View className={styles.arrivedImageWrapper}>
                      <Image
                        src={item.photos[0]}
                        mode="aspectFill"
                        className={styles.arrivedImage}
                        onError={(e) => console.error('[Image] Failed to load:', e)}
                      />
                      <View className={styles.arrivedBadge}>
                        <Text>已到货</Text>
                      </View>
                    </View>
                    <View className={styles.arrivedInfo}>
                      <Text className={styles.arrivedName}>{item.characterName}</Text>
                      <Text className={styles.arrivedSeries}>{item.seriesName}</Text>
                      <Text className={styles.arrivedDate}>到货日期：{item.arrivalDate}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📦</Text>
                <Text className={styles.emptyText}>暂无已到货的手办</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default PlanPage;
