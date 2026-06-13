import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Picker } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import StatCard from '../../components/StatCard';
import { formatPrice } from '../../utils';

const StatsPage: React.FC = () => {
  const { allCollections, getSeriesList } = useCollection();
  const [activeTab, setActiveTab] = useState<'series' | 'manufacturer' | 'year' | 'trend'>('series');
  const [filterSeries, setFilterSeries] = useState<number>(0);

  const seriesList = useMemo(() => getSeriesList(), [getSeriesList]);
  const seriesOptions = useMemo(() => ['全部', ...seriesList], [seriesList]);

  const statsCollections = useMemo(() => {
    const seriesName = seriesOptions[filterSeries];
    if (seriesName === '全部') return allCollections;
    return allCollections.filter(item => item.seriesName === seriesName);
  }, [allCollections, filterSeries, seriesOptions]);

  const stats = useMemo(() => {
    const arrivedItems = statsCollections.filter(item => item.hasArrived);
    const pendingItems = statsCollections.filter(item => !item.hasArrived);
    const unboxedCount = arrivedItems.filter(item => item.isUnboxed).length;

    const bySeries: Array<{ name: string; count: number; spent: number }> = [];
    const seriesMap = new Map<string, { count: number; spent: number }>();
    statsCollections.forEach(item => {
      if (!seriesMap.has(item.seriesName)) {
        seriesMap.set(item.seriesName, { count: 0, spent: 0 });
      }
      const data = seriesMap.get(item.seriesName)!;
      data.count++;
      data.spent += item.purchasePrice;
    });
    seriesMap.forEach((value, key) => {
      bySeries.push({ name: key, count: value.count, spent: value.spent });
    });
    bySeries.sort((a, b) => b.spent - a.spent);

    const byManufacturer: Array<{ name: string; count: number; spent: number }> = [];
    const manuMap = new Map<string, { count: number; spent: number }>();
    statsCollections.forEach(item => {
      if (!manuMap.has(item.manufacturer)) {
        manuMap.set(item.manufacturer, { count: 0, spent: 0 });
      }
      const data = manuMap.get(item.manufacturer)!;
      data.count++;
      data.spent += item.purchasePrice;
    });
    manuMap.forEach((value, key) => {
      byManufacturer.push({ name: key, count: value.count, spent: value.spent });
    });
    byManufacturer.sort((a, b) => b.spent - a.spent);

    const byYear: Array<{ year: string; count: number; spent: number }> = [];
    const yearMap = new Map<string, { count: number; spent: number }>();
    statsCollections.forEach(item => {
      const year = item.purchaseDate.substring(0, 4);
      if (!yearMap.has(year)) {
        yearMap.set(year, { count: 0, spent: 0 });
      }
      const data = yearMap.get(year)!;
      data.count++;
      data.spent += item.purchasePrice;
    });
    yearMap.forEach((value, key) => {
      byYear.push({ year: key, count: value.count, spent: value.spent });
    });
    byYear.sort((a, b) => b.year.localeCompare(a.year));

    const monthlyTrend: Array<{ month: string; count: number; spent: number }> = [];
    const monthMap = new Map<string, { count: number; spent: number }>();
    statsCollections.forEach(item => {
      const month = item.purchaseDate.substring(0, 7);
      if (!monthMap.has(month)) {
        monthMap.set(month, { count: 0, spent: 0 });
      }
      const data = monthMap.get(month)!;
      data.count++;
      data.spent += item.purchasePrice;
    });
    monthMap.forEach((value, key) => {
      monthlyTrend.push({ month: key, count: value.count, spent: value.spent });
    });
    monthlyTrend.sort((a, b) => a.month.localeCompare(b.month));

    const totalSpent = statsCollections.reduce((sum, item) => sum + item.purchasePrice, 0);
    const maxSpent = bySeries.length > 0 ? Math.max(...bySeries.map(s => s.spent)) : 1;

    return {
      totalCount: statsCollections.length,
      totalSpent,
      arrivedCount: arrivedItems.length,
      pendingCount: pendingItems.length,
      unboxedCount,
      bySeries,
      byManufacturer,
      byYear,
      monthlyTrend,
      maxSpent
    };
  }, [statsCollections]);

  const renderStatList = (
    data: Array<{ name: string; count: number; spent: number }>,
    maxSpent: number
  ) => {
    if (data.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📊</Text>
          <Text className={styles.emptyText}>暂无数据</Text>
        </View>
      );
    }

    return (
      <View className={styles.statList}>
        {data.map((item, index) => (
          <View key={item.name} className={styles.statItem}>
            <View className={styles.statInfo}>
              <Text className={styles.statName}>{index + 1}. {item.name}</Text>
              <View className={styles.statCounts}>
                <Text className={styles.statCount}>{item.count} 件</Text>
              </View>
              <View className={styles.progressBar}>
                <View
                  className={styles.progressFill}
                  style={{ width: `${(item.spent / maxSpent) * 100}%` }}
                />
              </View>
            </View>
            <View className={styles.statValue}>
              <Text className={styles.statPrice}>{formatPrice(item.spent)}</Text>
              <Text className={styles.statPercent}>
                {((item.spent / stats.totalSpent) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderYearList = () => {
    if (stats.byYear.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📊</Text>
          <Text className={styles.emptyText}>暂无数据</Text>
        </View>
      );
    }

    return (
      <View className={styles.statList}>
        {stats.byYear.map((item) => (
          <View key={item.year} className={styles.statItem}>
            <View className={styles.statInfo}>
              <Text className={styles.statName}>{item.year}年</Text>
              <View className={styles.statCounts}>
                <Text className={styles.statCount}>{item.count} 件</Text>
              </View>
            </View>
            <View className={styles.statValue}>
              <Text className={styles.statPrice}>{formatPrice(item.spent)}</Text>
              <Text className={styles.statPercent}>
                {((item.spent / stats.totalSpent) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTrendChart = () => {
    if (stats.monthlyTrend.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📈</Text>
          <Text className={styles.emptyText}>暂无趋势数据</Text>
        </View>
      );
    }

    const maxCount = Math.max(...stats.monthlyTrend.map(m => m.count));

    return (
      <View className={styles.trendChart}>
        <View className={styles.trendHeader}>
          <Text className={styles.trendTitle}>月度收藏趋势</Text>
        </View>
        <View className={styles.trendBars}>
          {stats.monthlyTrend.map((item) => (
            <View key={item.month} className={styles.trendBarItem}>
              <Text className={styles.trendBarValue}>{item.count}</Text>
              <View
                className={styles.trendBar}
                style={{ height: `${(item.count / maxCount) * 100}%` }}
              />
              <Text className={styles.trendBarLabel}>
                {item.month.substring(5)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  usePullDownRefresh(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  return (
    <View className={styles.page}>
      <View className={styles.filterBar}>
        <Picker mode="selector" range={seriesOptions} value={filterSeries} onChange={(e) => setFilterSeries(Number(e.detail.value))}>
          <View className={styles.filterBtn}>
            <Text>{seriesOptions[filterSeries]}</Text>
            <Text className={styles.filterArrow}>▾</Text>
          </View>
        </Picker>
      </View>

      <View className={styles.statsGrid}>
        <StatCard
          title="总藏品数"
          value={stats.totalCount}
          subtitle="件"
          color="primary"
        />
        <StatCard
          title="总花费"
          value={formatPrice(stats.totalSpent)}
          color="success"
        />
        <StatCard
          title="已拆封"
          value={stats.unboxedCount}
          subtitle={`${stats.arrivedCount > 0 ? ((stats.unboxedCount / stats.arrivedCount) * 100).toFixed(0) : 0}%`}
          color="warning"
        />
        <StatCard
          title="待到货"
          value={stats.pendingCount}
          subtitle="件"
          color="error"
        />
      </View>

      <View className={styles.tabBar}>
        <Button
          className={classnames(styles.tabBtn, activeTab === 'series' && styles.active)}
          onClick={() => setActiveTab('series')}
        >
          <Text>系列</Text>
        </Button>
        <Button
          className={classnames(styles.tabBtn, activeTab === 'manufacturer' && styles.active)}
          onClick={() => setActiveTab('manufacturer')}
        >
          <Text>厂商</Text>
        </Button>
        <Button
          className={classnames(styles.tabBtn, activeTab === 'year' && styles.active)}
          onClick={() => setActiveTab('year')}
        >
          <Text>年度</Text>
        </Button>
        <Button
          className={classnames(styles.tabBtn, activeTab === 'trend' && styles.active)}
          onClick={() => setActiveTab('trend')}
        >
          <Text>趋势</Text>
        </Button>
      </View>

      <ScrollView className={styles.listSection} scrollY enhanced>
        {activeTab === 'series' && (
          <>
            <Text className={styles.sectionTitle}>系列分布</Text>
            {renderStatList(stats.bySeries, stats.maxSpent)}
          </>
        )}
        {activeTab === 'manufacturer' && (
          <>
            <Text className={styles.sectionTitle}>厂商分布</Text>
            {renderStatList(stats.byManufacturer, stats.maxSpent)}
          </>
        )}
        {activeTab === 'year' && (
          <>
            <Text className={styles.sectionTitle}>年度统计</Text>
            {renderYearList()}
          </>
        )}
        {activeTab === 'trend' && (
          <>
            <Text className={styles.sectionTitle}>收藏趋势</Text>
            {renderTrendChart()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default StatsPage;
