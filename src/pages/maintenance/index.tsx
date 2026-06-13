import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Picker } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import { getDaysUntil, getMaintenanceTypeText, getFlawStatusText, getPartStatusText, getTimelineTypeText, getTimelineTypeIcon } from '../../utils';

const MaintenancePage: React.FC = () => {
  const { allCollections, reminders, completeMaintenance, getTimeline } = useCollection();
  const [activeTab, setActiveTab] = useState<'timeline' | 'history' | 'flaws' | 'parts'>('timeline');
  const [filterCollection, setFilterCollection] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const collectionOptions = useMemo(() => {
    return ['全部藏品', ...allCollections.map(item => item.characterName)];
  }, [allCollections]);

  const typeOptions = ['全部类型', '除尘保养', '避光检查', '其他维护', '瑕疵记录', '补件进度', '到货签收', '拆封展示', '购入记录'];

  const typeToFilter: Record<string, string> = {
    '除尘保养': 'dust',
    '避光检查': 'light_protection',
    '其他维护': 'other',
    '瑕疵记录': 'flaw',
    '补件进度': 'part',
    '到货签收': 'arrival',
    '拆封展示': 'unbox',
    '购入记录': 'purchase'
  };

  const urgentReminders = useMemo(() => {
    return reminders
      .filter(r => getDaysUntil(r.nextDate) <= 7)
      .sort((a, b) => getDaysUntil(a.nextDate) - getDaysUntil(b.nextDate));
  }, [reminders]);

  const filteredTimeline = useMemo(() => {
    let events = getTimeline();
    if (filterCollection) {
      events = events.filter(e => e.collectionName === filterCollection);
    }
    if (filterType) {
      const typeKey = typeToFilter[filterType];
      if (typeKey) {
        events = events.filter(e => e.type === typeKey);
      }
    }
    return events;
  }, [getTimeline, filterCollection, filterType]);

  const maintenanceHistory = useMemo(() => {
    const allRecords: Array<{
      id: string;
      collectionId: string;
      collectionName: string;
      date: string;
      type: string;
      description: string;
    }> = [];

    allCollections.forEach(item => {
      item.maintenanceRecords.forEach(record => {
        allRecords.push({
          id: record.id,
          collectionId: item.id,
          collectionName: item.characterName,
          date: record.date,
          type: record.type,
          description: record.description
        });
      });
    });

    return allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allCollections]);

  const flawRecords = useMemo(() => {
    const allFlaws: Array<{
      id: string;
      collectionId: string;
      collectionName: string;
      date: string;
      description: string;
      status: string;
    }> = [];

    allCollections.forEach(item => {
      item.flaws.forEach(flaw => {
        allFlaws.push({
          id: flaw.id,
          collectionId: item.id,
          collectionName: item.characterName,
          date: flaw.date,
          description: flaw.description,
          status: flaw.status
        });
      });
    });

    return allFlaws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allCollections]);

  const partRecords = useMemo(() => {
    const allParts: Array<{
      id: string;
      collectionId: string;
      collectionName: string;
      applyDate: string;
      receivedDate?: string;
      description: string;
      status: string;
    }> = [];

    allCollections.forEach(item => {
      item.replacementParts.forEach(part => {
        allParts.push({
          id: part.id,
          collectionId: item.id,
          collectionName: item.characterName,
          applyDate: part.applyDate,
          receivedDate: part.receivedDate,
          description: part.description,
          status: part.status
        });
      });
    });

    return allParts.sort((a, b) => new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime());
  }, [allCollections]);

  const handleCompleteReminder = (reminderId: string) => {
    completeMaintenance(reminderId);
    Taro.showToast({ title: '已完成保养', icon: 'success' });
  };

  const handleCollectionFilterChange = (e: { detail: { value: number } }) => {
    const idx = e.detail.value;
    if (idx === 0) {
      setFilterCollection(null);
    } else {
      setFilterCollection(collectionOptions[idx]);
    }
  };

  const handleTypeFilterChange = (e: { detail: { value: number } }) => {
    const idx = e.detail.value;
    if (idx === 0) {
      setFilterType(null);
    } else {
      setFilterType(typeOptions[idx]);
    }
  };

  const getReminderIcon = (type: string) => {
    return type === 'dust' ? '🧹' : '☀️';
  };

  usePullDownRefresh(() => {
    console.log('[Maintenance] Pull down refresh');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  return (
    <View className={styles.page}>
      <View className={styles.reminderSection}>
        <Text className={styles.sectionTitle}>待办提醒</Text>
        {urgentReminders.length > 0 ? (
          <View className={styles.reminderList}>
            {urgentReminders.map(reminder => {
              const days = getDaysUntil(reminder.nextDate);
              return (
                <View key={reminder.id} className={styles.reminderCard}>
                  <View className={classnames(styles.reminderIcon, reminder.type)}>
                    <Text>{getReminderIcon(reminder.type)}</Text>
                  </View>
                  <View className={styles.reminderInfo}>
                    <Text className={styles.reminderName}>{reminder.collectionName}</Text>
                    <Text className={styles.reminderType}>{getMaintenanceTypeText(reminder.type)}</Text>
                    <Text className={styles.reminderDate}>
                      {days > 0
                        ? `还有 ${days} 天（${reminder.nextDate}）`
                        : days === 0
                          ? '今日到期'
                          : `已逾期 ${Math.abs(days)} 天`
                      }
                    </Text>
                  </View>
                  <Button
                    className={styles.reminderAction}
                    onClick={() => handleCompleteReminder(reminder.id)}
                  >
                    <Text>完成</Text>
                  </Button>
                </View>
              );
            })}
          </View>
        ) : (
          <Text className={styles.noReminders}>暂无待办保养任务</Text>
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
          className={classnames(styles.tabBtn, activeTab === 'history' && styles.active)}
          onClick={() => setActiveTab('history')}
        >
          <Text>维护历史</Text>
        </Button>
        <Button
          className={classnames(styles.tabBtn, activeTab === 'flaws' && styles.active)}
          onClick={() => setActiveTab('flaws')}
        >
          <Text>瑕疵记录</Text>
        </Button>
        <Button
          className={classnames(styles.tabBtn, activeTab === 'parts' && styles.active)}
          onClick={() => setActiveTab('parts')}
        >
          <Text>补件记录</Text>
        </Button>
      </View>

      <ScrollView className={styles.listSection} scrollY enhanced>
        {activeTab === 'timeline' && (
          <>
            <View className={styles.filterBar}>
              <Picker
                mode="selector"
                range={collectionOptions}
                onChange={handleCollectionFilterChange}
              >
                <Button className={styles.filterBtn}>
                  <Text>{filterCollection || '全部藏品'} ▾</Text>
                </Button>
              </Picker>
              <Picker
                mode="selector"
                range={typeOptions}
                onChange={handleTypeFilterChange}
              >
                <Button className={styles.filterBtn}>
                  <Text>{filterType || '全部类型'} ▾</Text>
                </Button>
              </Picker>
            </View>
            <Text className={styles.sectionTitle}>全局时间轴</Text>
            {filteredTimeline.length > 0 ? (
              <View className={styles.timeline}>
                {filteredTimeline.map(event => (
                  <View key={event.id} className={styles.timelineItem}>
                    <View className={classnames(styles.timelineDot, event.type)} />
                    <View className={styles.timelineLine} />
                    <View className={styles.timelineContent}>
                      <View className={styles.timelineHeader}>
                        <Text className={styles.timelineIcon}>{getTimelineTypeIcon(event.type)}</Text>
                        <Text className={styles.timelineName}>{event.collectionName}</Text>
                        <Text className={classnames(styles.timelineType, event.type)}>
                          {getTimelineTypeText(event.type)}
                        </Text>
                        <Text className={styles.timelineDate}>{event.date}</Text>
                      </View>
                      <Text className={styles.timelineDesc}>{event.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📋</Text>
                <Text className={styles.emptyText}>暂无时间轴记录</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <Text className={styles.sectionTitle}>维护历史</Text>
            {maintenanceHistory.length > 0 ? (
              <View className={styles.list}>
                {maintenanceHistory.map(record => (
                  <View key={record.id} className={styles.recordCard} onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${record.collectionId}` })}>
                    <View className={styles.recordHeader}>
                      <Text className={styles.recordName}>{record.collectionName}</Text>
                      <Text className={styles.recordDate}>{record.date}</Text>
                    </View>
                    <View className={classnames(styles.recordType, record.type)}>
                      <Text>{getMaintenanceTypeText(record.type)}</Text>
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
            )}
          </>
        )}

        {activeTab === 'flaws' && (
          <>
            <Text className={styles.sectionTitle}>瑕疵记录</Text>
            {flawRecords.length > 0 ? (
              <View className={styles.list}>
                {flawRecords.map(record => (
                  <View key={record.id} className={styles.recordCard} onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${record.collectionId}` })}>
                    <View className={styles.recordHeader}>
                      <Text className={styles.recordName}>{record.collectionName}</Text>
                      <Text className={styles.recordDate}>{record.date}</Text>
                    </View>
                    <View className={classnames(styles.statusBadge, record.status)}>
                      <Text>{getFlawStatusText(record.status)}</Text>
                    </View>
                    <Text className={styles.recordDesc}>{record.description}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>✨</Text>
                <Text className={styles.emptyText}>暂无瑕疵记录</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'parts' && (
          <>
            <Text className={styles.sectionTitle}>补件记录</Text>
            {partRecords.length > 0 ? (
              <View className={styles.list}>
                {partRecords.map(record => (
                  <View key={record.id} className={styles.recordCard} onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${record.collectionId}` })}>
                    <View className={styles.recordHeader}>
                      <Text className={styles.recordName}>{record.collectionName}</Text>
                      <Text className={styles.recordDate}>
                        申请：{record.applyDate}
                        {record.receivedDate && ` / 收到：${record.receivedDate}`}
                      </Text>
                    </View>
                    <View className={classnames(styles.statusBadge, record.status)}>
                      <Text>{getPartStatusText(record.status)}</Text>
                    </View>
                    <Text className={styles.recordDesc}>{record.description}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📦</Text>
                <Text className={styles.emptyText}>暂无补件记录</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default MaintenancePage;
