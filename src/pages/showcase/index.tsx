import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import CollectionCard from '../../components/CollectionCard';
import SeriesTag from '../../components/SeriesTag';
import { CollectionItem } from '../../types/collection';

const ShowcasePage: React.FC = () => {
  const {
    collections,
    allCollections,
    showcaseSeries,
    setShowcaseSeries,
    getSeriesList,
    getCoverPhoto,
    sortType,
    setSortType,
  } = useCollection();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const seriesList = useMemo(() => getSeriesList(), [getSeriesList]);

  const filteredCollections = useMemo(() => {
    let result = collections;
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(item =>
        item.characterName.toLowerCase().includes(keyword) ||
        item.seriesName.toLowerCase().includes(keyword) ||
        item.manufacturer.toLowerCase().includes(keyword)
      );
    }
    return result;
  }, [collections, searchKeyword]);

  const getSeriesCount = useCallback((series: string) => {
    return allCollections.filter(item => item.seriesName === series).length;
  }, [allCollections]);

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/add/index' });
  };

  const handleOpenCabinet = () => {
    Taro.navigateTo({ url: '/pages/cabinet/index' });
  };

  const handleShareSeries = () => {
    if (showcaseSeries) {
      Taro.navigateTo({ url: `/pages/share/index?series=${encodeURIComponent(showcaseSeries)}` });
    } else {
      Taro.showToast({ title: '请先选择一个系列', icon: 'none' });
    }
  };

  const handleSortSelect = (type: typeof sortType) => {
    setSortType(type);
    setShowSortDropdown(false);
  };

  const sortOptions = [
    { value: 'default', label: '自定义排序' },
    { value: 'showcase', label: '展柜排序' },
    { value: 'price_asc', label: '价格从低到高' },
    { value: 'price_desc', label: '价格从高到低' },
    { value: 'date_asc', label: '购买日期从早到晚' },
    { value: 'date_desc', label: '购买日期从晚到早' }
  ];

  usePullDownRefresh(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索角色、作品、厂商..."
            placeholderTextColor="#64748B"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>

        <View className={styles.actionRow}>
          <Button
            className={styles.sortBtn}
            onClick={() => setShowSortDropdown(true)}
          >
            <Text>排序：{sortOptions.find(o => o.value === sortType)?.label}</Text>
          </Button>

          <View className={styles.viewToggle}>
            <Button
              className={classnames(styles.viewBtn, viewMode === 'grid' && styles.active)}
              onClick={() => setViewMode('grid')}
            >
              <Text>网格</Text>
            </Button>
            <Button
              className={classnames(styles.viewBtn, viewMode === 'list' && styles.active)}
              onClick={() => setViewMode('list')}
            >
              <Text>列表</Text>
            </Button>
          </View>
        </View>
      </View>

      <View className={styles.seriesSection}>
        <ScrollView
          className={styles.seriesScroll}
          scrollX
          enhanced
          showScrollbar={false}
        >
          <View className={styles.seriesTag}>
            <SeriesTag
              name="全部"
              count={allCollections.length}
              active={showcaseSeries === null}
              onClick={() => setShowcaseSeries(null)}
            />
          </View>
          {seriesList.map(series => (
            <View key={series} className={styles.seriesTag}>
              <SeriesTag
                name={series}
                count={getSeriesCount(series)}
                active={showcaseSeries === series}
                onClick={() => setShowcaseSeries(series)}
              />
            </View>
          ))}
          {showcaseSeries && (
            <View className={styles.seriesTag}>
              <Button
                className={styles.sortBtn}
                onClick={handleShareSeries}
              >
                <Text>分享系列</Text>
              </Button>
            </View>
          )}
        </ScrollView>
      </View>

      <View className={styles.cabinetEntry} onClick={handleOpenCabinet}>
        <Text className={styles.cabinetIcon}>🏛️</Text>
        <View className={styles.cabinetEntryInfo}>
          <Text className={styles.cabinetEntryTitle}>虚拟展柜</Text>
          <Text className={styles.cabinetEntryDesc}>按展柜层位排布查看藏品</Text>
        </View>
        <Text className={styles.cabinetArrow}>›</Text>
      </View>

      <View className={styles.collectionList}>
        {filteredCollections.length > 0 ? (
          <View className={viewMode === 'grid' ? styles.gridLayout : styles.listLayout}>
            {filteredCollections.map((item: CollectionItem) => (
              <CollectionCard
                key={item.id}
                item={item}
                coverPhoto={getCoverPhoto(item)}
                mode={viewMode}
              />
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📦</Text>
            <Text className={styles.emptyText}>
              {searchKeyword ? '没有找到匹配的藏品' : '暂无藏品，点击右下角按钮添加'}
            </Text>
          </View>
        )}
      </View>

      <Button className={styles.fab} onClick={handleAdd}>
        <Text className={styles.fabIcon}>+</Text>
      </Button>

      {showSortDropdown && (
        <View className={styles.sortDropdown} onClick={() => setShowSortDropdown(false)}>
          <View className={styles.sortContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.sortTitle}>选择排序方式</Text>
            {sortOptions.map(option => (
              <Button
                key={option.value}
                className={classnames(styles.sortOption, sortType === option.value && styles.active)}
                onClick={() => handleSortSelect(option.value as typeof sortType)}
              >
                <Text>{option.label}</Text>
              </Button>
            ))}
            <Button
              className={styles.sortCancel}
              onClick={() => setShowSortDropdown(false)}
            >
              <Text>取消</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default ShowcasePage;
