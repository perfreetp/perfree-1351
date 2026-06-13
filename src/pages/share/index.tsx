import React, { useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import CollectionCard from '../../components/CollectionCard';
import { formatPrice } from '../../utils';

const SharePage: React.FC = () => {
  const router = useRouter();
  const { getCollectionsBySeries } = useCollection();
  
  const seriesName = useMemo(() => {
    return decodeURIComponent(router.params.series as string || '');
  }, [router.params.series]);

  const collections = useMemo(() => {
    return getCollectionsBySeries(seriesName);
  }, [seriesName, getCollectionsBySeries]);

  const stats = useMemo(() => {
    const totalSpent = collections.reduce((sum, item) => sum + item.purchasePrice, 0);
    return {
      count: collections.length,
      totalSpent
    };
  }, [collections]);

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    Taro.showToast({ title: '请点击右上角分享', icon: 'none' });
  };

  const handleSaveImage = () => {
    Taro.showToast({ title: '生成分享图功能开发中', icon: 'none' });
  };

  useShareAppMessage(() => {
    return {
      title: `我的${seriesName}手办收藏`,
      path: `/pages/share/index?series=${encodeURIComponent(seriesName)}`
    };
  });

  if (!seriesName) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>❓</Text>
          <Text className={styles.emptyText}>请先选择要分享的系列</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.seriesName}>{seriesName}</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.count}</Text>
            <Text className={styles.statLabel}>藏品数量</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatPrice(stats.totalSpent)}</Text>
            <Text className={styles.statLabel}>总价值</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY enhanced>
        <View className={styles.collectionList}>
          <Text className={styles.listTitle}>藏品列表</Text>
          {collections.length > 0 ? (
            <View className={styles.grid}>
              {collections.map(item => (
                <CollectionCard key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📦</Text>
              <Text className={styles.emptyText}>该系列暂无藏品</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className={styles.actionBar}>
        <Button
          className={styles.actionBtn + ' ' + styles.secondary}
          onClick={handleSaveImage}
        >
          <Text>保存长图</Text>
        </Button>
        <Button
          className={styles.actionBtn + ' ' + styles.primary}
          onClick={handleShare}
        >
          <Text>分享给朋友</Text>
        </Button>
      </View>
    </View>
  );
};

export default SharePage;
