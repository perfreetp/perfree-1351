import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { CollectionItem } from '../../types/collection';
import { formatPrice, getDaysUntil } from '../../utils';

interface PlanCardProps {
  item: CollectionItem;
  coverPhoto?: string;
  onPayBalance?: () => void;
  onMarkArrived?: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ item, coverPhoto, onPayBalance, onMarkArrived }) => {
  const daysUntil = item.balanceDueDate ? getDaysUntil(item.balanceDueDate) : 0;
  const isUrgent = daysUntil > 0 && daysUntil <= 7;
  const isOverdue = daysUntil < 0;

  return (
    <View className={styles.card}>
      <View className={styles.imageWrapper}>
        <Image 
          src={coverPhoto || item.photos[0]}
          mode="aspectFill" 
          className={styles.image}
          onError={(e) => console.error('[Image] Failed to load:', e)}
        />
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.characterName}>{item.characterName}</Text>
          <Text className={styles.seriesName}>{item.seriesName}</Text>
        </View>
        
        <View className={styles.metaRow}>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>比例</Text>
            <Text className={styles.metaValue}>{item.scale}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>厂商</Text>
            <Text className={styles.metaValue}>{item.manufacturer}</Text>
          </View>
        </View>

        <View className={styles.priceRow}>
          <Text className={styles.price}>{formatPrice(item.purchasePrice)}</Text>
          {item.balanceDueDate && (
            <View className={classnames(styles.dueBadge, isUrgent && styles.urgent, isOverdue && styles.overdue)}>
              {daysUntil > 0 ? (
                <Text className={styles.dueText}>尾款倒计时 {daysUntil} 天</Text>
              ) : daysUntil === 0 ? (
                <Text className={styles.dueText}>今日截止</Text>
              ) : (
                <Text className={styles.dueText}>已逾期 {Math.abs(daysUntil)} 天</Text>
              )}
            </View>
          )}
        </View>

        <View className={styles.dateInfo}>
          {item.reservationDate && (
            <Text className={styles.dateText}>预订日期：{item.reservationDate}</Text>
          )}
          {item.balanceDueDate && (
            <Text className={styles.dateText}>尾款截止：{item.balanceDueDate}</Text>
          )}
        </View>

        <View className={styles.actions}>
          {!item.hasArrived && (
            <>
              {onPayBalance && (
                <Button 
                  className={classnames(styles.actionBtn, styles.secondaryBtn)} 
                  onClick={onPayBalance}
                >
                  <Text>支付尾款</Text>
                </Button>
              )}
              {onMarkArrived && (
                <Button 
                  className={classnames(styles.actionBtn, styles.primaryBtn)} 
                  onClick={onMarkArrived}
                >
                  <Text>标记到货</Text>
                </Button>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default PlanCard;
