import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { CollectionItem } from '../../types/collection';
import { formatPrice } from '../../utils';

interface CollectionCardProps {
  item: CollectionItem;
  onClick?: () => void;
  mode?: 'grid' | 'list';
}

const CollectionCard: React.FC<CollectionCardProps> = ({ item, onClick, mode = 'grid' }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` });
    }
  };

  return (
    <View 
      className={classnames(styles.card, mode === 'list' && styles.listMode)} 
      onClick={handleClick}
    >
      <View className={styles.imageWrapper}>
        <Image 
          src={item.photos[0]} 
          mode="aspectFill" 
          className={styles.image}
          onError={(e) => console.error('[Image] Failed to load:', e)}
        />
        {!item.hasArrived && (
          <View className={classnames(styles.statusBadge, styles.pending)}>
            <Text>待到货</Text>
          </View>
        )}
        {!item.isUnboxed && item.hasArrived && (
          <View className={classnames(styles.statusBadge, styles.sealed)}>
            <Text>未拆封</Text>
          </View>
        )}
        {item.flaws.length > 0 && item.hasArrived && (
          <View className={classnames(styles.statusBadge, styles.flaw)}>
            <Text>有瑕疵</Text>
          </View>
        )}
      </View>
      <View className={styles.info}>
        <Text className={styles.characterName}>{item.characterName}</Text>
        <Text className={styles.seriesName}>{item.seriesName}</Text>
        <View className={styles.meta}>
          <Text className={styles.scale}>{item.scale}</Text>
          <Text className={styles.manufacturer}>{item.manufacturer}</Text>
        </View>
        <Text className={styles.price}>{formatPrice(item.purchasePrice)}</Text>
        {mode === 'list' && (
          <View className={styles.location}>
            <Text className={styles.locationText}>摆放位置：{item.displayLocation}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CollectionCard;
