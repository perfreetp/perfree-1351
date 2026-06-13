import React, { useState, useMemo } from 'react';
import { View, Text, Button, Image, ScrollView, Picker } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import PlanCard from '../../components/PlanCard';
import { CollectionItem } from '../../types/collection';
import { getDaysUntil, formatPrice } from '../../utils';

const PlanPage: React.FC = () => {
  const { allCollections, markArrived, markBalancePaid, getSeriesList } = useCollection();
  const [activeTab, setActiveTab] = useState<'pending' | 'arrived'>('pending');
  const [filterSeries, setFilterSeries] = useState<number>(0);

  const seriesList = useMemo(() => getSeriesList(), [getSeriesList]);
  const seriesOptions = useMemo(() => ['全部', ...seriesList], [seriesList]);

  const planCollections = useMemo(() => {
    const seriesName = seriesOptions[filterSeries];
    if (seriesName === '全部') return allCollections;
    return allCollections.filter(item => item.seriesName === seriesName);
  }, [allCollections, filterSeries, seriesOptions]);

  const pendingItems = useMemo(() => {
    return planCollections
      .filter(item => !item.hasArrived)
      .sort((a, b) => {
        if (!a.balanceDueDate && !b.balanceDueDate) return 0;
        if (!a.balanceDueDate) return 1;
        if (!b.balanceDueDate) return -1;
        return new Date(a.balanceDueDate).getTime() - new Date(b.balanceDueDate).getTime();
      });
  }, [planCollections]);

  const arrivedItems = useMemo(() => {
    return planCollections
      .filter(item => item.hasArrived)
      .sort((a, b) => {
        if (!a.arrivalDate && !b.arrivalDate) return 0;
        if (!a.arrivalDate) return 1;
        if (!b.arrivalDate) return -1;
        return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime();
      });
  }, [planCollections]);

  const urgentPendingItems = useMemo(() => {
    return pendingItems.filter(item => {
      if (!item.balanceDueDate) return false;
      const days = getDaysUntil(item.balanceDueDate);
      return days <= 7;
    });
  }, [pendingItems]);

  const handlePayBalance = (item: CollectionItem) => {
    Taro.showModal({
      title: '支付尾款',
      content: `确认支付「${item.characterName}」的尾款 ${formatPrice(item.purchasePrice)}？支付后尾款截止日期将清除。`,
      confirmColor: '#F59E0B',
      success: (res) => {
        if (res.confirm) {
          markBalancePaid(item.id);
          Taro.showToast({ title: '尾款已支付', icon: 'success' });
        }
      }
    });
  };

  const handleMarkArrived = (item: CollectionItem) => {
    Taro.showModal({
      title: '标记到货',
      content: `确认「${item.characterName}」已到货？到货后将从待到货移至已到货列表。`,
      confirmColor: '#10B981',
      success: (res) => {
        if (res.confirm) {
          markArrived(item.id);
          Taro.showToast({ title: '已标记到货', icon: 'success' });
        }
      }
    });
  };

  const handleItemClick = (item: CollectionItem) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` });
  };

  usePullDownRefresh(() => {
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
            {formatPrice(pendingItems.reduce((sum, item) => sum + item.purchasePrice, 0))}
          </Text>
          <Text className={styles.statLabel}>待支付</Text>
        </View>
      </View>

      <View className={styles.filterBar}>
        <Picker mode="selector" range={seriesOptions} value={filterSeries} onChange={(e) => setFilterSeries(Number(e.detail.value))}>
          <View className={styles.filterBtn}>
            <Text>{seriesOptions[filterSeries]}</Text>
            <Text className={styles.filterArrow}>▾</Text>
          </View>
        </Picker>
      </View>

      {urgentPendingItems.length > 0 && activeTab === 'pending' && (
        <View className={styles.urgentBanner}>
          <Text className={styles.urgentIcon}>⚠️</Text>
          <Text className={styles.urgentText}>
            {urgentPendingItems.length} 件手办尾款即将到期或已逾期
          </Text>
        </View>
      )}

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
                      <Text className={styles.arrivedLocation}>摆放位置：{item.displayLocation}</Text>
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
