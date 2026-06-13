import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Picker, Input } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import { MaintenanceTemplate } from '../../types/collection';
import {
  getDaysUntil,
  getMaintenanceTypeText,
  getFlawStatusText,
  getPartStatusText,
  getCollectionStatusText,
  getCollectionStatusIcon,
  getInventoryStatusText,
  getTimelineTypeText,
  getTimelineTypeIcon
} from '../../utils';

const materialOptions = ['PVC', 'ABS', '树脂', '宝丽石', '软胶', '合金', '混合材质'];

const MaintenancePage: React.FC = () => {
  const {
    allCollections,
    reminders,
    completeMaintenance,
    getTimeline,
    getSeriesList,
    maintenanceTemplates,
    addMaintenanceTemplate,
    deleteMaintenanceTemplate
  } = useCollection();

  const [activeTab, setActiveTab] = useState<'timeline' | 'history' | 'flaws' | 'parts'>('timeline');
  const [filterCollection, setFilterCollection] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [templateExpanded, setTemplateExpanded] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    material: 0,
    seriesName: 0,
    dustIntervalDays: '30',
    lightProtectionIntervalDays: '60'
  });

  const collectionOptions = useMemo(() => {
    return ['全部藏品', ...allCollections.map(item => item.characterName)];
  }, [allCollections]);

  const seriesOptions = useMemo(() => {
    return ['不限', ...getSeriesList()];
  }, [getSeriesList]);

  const typeOptions = [
    '全部类型', '除尘保养', '避光检查', '其他维护',
    '瑕疵记录', '补件进度', '到货签收', '拆封展示',
    '购入记录', '出手记录', '盘点核对'
  ];

  const typeToFilter: Record<string, string> = {
    '除尘保养': 'dust',
    '避光检查': 'light_protection',
    '其他维护': 'other',
    '瑕疵记录': 'flaw',
    '补件进度': 'part',
    '到货签收': 'arrival',
    '拆封展示': 'unbox',
    '购入记录': 'purchase',
    '出手记录': 'sold',
    '盘点核对': 'inventory'
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

  const getReminderStatusClass = (days: number) => {
    if (days < 0) return styles.overdue;
    if (days === 0) return styles.dueToday;
    return '';
  };

  const getReminderDateText = (days: number, nextDate: string) => {
    if (days < 0) return `逾期 ${Math.abs(days)} 天`;
    if (days === 0) return '今日到期';
    return `还有 ${days} 天（${nextDate}）`;
  };

  const handleAddTemplate = () => {
    const { name, material, seriesName, dustIntervalDays, lightProtectionIntervalDays } = templateForm;
    if (!name.trim()) {
      Taro.showToast({ title: '请输入模板名称', icon: 'none' });
      return;
    }
    const dustDays = parseInt(dustIntervalDays, 10);
    const lightDays = parseInt(lightProtectionIntervalDays, 10);
    if (isNaN(dustDays) || dustDays <= 0 || isNaN(lightDays) || lightDays <= 0) {
      Taro.showToast({ title: '周期天数须为正整数', icon: 'none' });
      return;
    }

    addMaintenanceTemplate({
      name: name.trim(),
      material: material === 0 ? undefined : materialOptions[material],
      seriesName: seriesName === 0 ? undefined : seriesOptions[seriesName],
      dustIntervalDays: dustDays,
      lightProtectionIntervalDays: lightDays
    });

    setTemplateForm({
      name: '',
      material: 0,
      seriesName: 0,
      dustIntervalDays: '30',
      lightProtectionIntervalDays: '60'
    });
    setShowTemplateForm(false);
    Taro.showToast({ title: '模板已添加', icon: 'success' });
  };

  const handleDeleteTemplate = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除该保养周期模板吗？',
      success: (res) => {
        if (res.confirm) {
          deleteMaintenanceTemplate(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
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
                <View
                  key={reminder.id}
                  className={classnames(styles.reminderCard, getReminderStatusClass(days))}
                >
                  <View className={classnames(styles.reminderIcon, reminder.type)}>
                    <Text>{getReminderIcon(reminder.type)}</Text>
                  </View>
                  <View className={styles.reminderInfo}>
                    <Text className={styles.reminderName}>{reminder.collectionName}</Text>
                    <Text className={styles.reminderType}>{getMaintenanceTypeText(reminder.type)}</Text>
                    <View className={styles.reminderDateRow}>
                      <Text
                        className={classnames(
                          styles.reminderDate,
                          days < 0 && styles.overdueText,
                          days === 0 && styles.dueTodayText
                        )}
                      >
                        {getReminderDateText(days, reminder.nextDate)}
                      </Text>
                      {days < 0 && (
                        <Text className={styles.overdueTag}>逾期{Math.abs(days)}天</Text>
                      )}
                      {days === 0 && (
                        <Text className={styles.dueTodayTag}>今日到期</Text>
                      )}
                    </View>
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

      <View className={styles.templateSection}>
        <View
          className={styles.templateHeader}
          onClick={() => setTemplateExpanded(!templateExpanded)}
        >
          <Text className={styles.sectionTitle}>保养周期模板</Text>
          <Text className={classnames(styles.templateArrow, templateExpanded && styles.expanded)}>
            ▸
          </Text>
        </View>
        {templateExpanded && (
          <View className={styles.templateBody}>
            {maintenanceTemplates.length > 0 ? (
              <View className={styles.templateList}>
                {maintenanceTemplates.map(tpl => (
                  <View key={tpl.id} className={styles.templateCard}>
                    <View className={styles.templateInfo}>
                      <Text className={styles.templateName}>{tpl.name}</Text>
                      <Text className={styles.templateDetail}>
                        适用：{tpl.material || '全部材质'}{tpl.seriesName ? ` / ${tpl.seriesName}` : ''}
                      </Text>
                      <Text className={styles.templateDetail}>
                        除尘周期：{tpl.dustIntervalDays}天 | 避光周期：{tpl.lightProtectionIntervalDays}天
                      </Text>
                    </View>
                    <Button
                      className={styles.deleteTemplateBtn}
                      onClick={() => handleDeleteTemplate(tpl.id)}
                    >
                      <Text>删除</Text>
                    </Button>
                  </View>
                ))}
              </View>
            ) : (
              <Text className={styles.noReminders}>暂无保养周期模板</Text>
            )}
            {!showTemplateForm ? (
              <Button
                className={styles.addTemplateBtn}
                onClick={() => setShowTemplateForm(true)}
              >
                <Text>+ 添加模板</Text>
              </Button>
            ) : (
              <View className={styles.templateForm}>
                <View className={styles.formField}>
                  <Text className={styles.formLabel}>模板名称</Text>
                  <Input
                    className={styles.formInput}
                    value={templateForm.name}
                    placeholder="输入模板名称"
                    onInput={e => setTemplateForm(prev => ({ ...prev, name: e.detail.value }))}
                  />
                </View>
                <View className={styles.formField}>
                  <Text className={styles.formLabel}>适用材质</Text>
                  <Picker
                    mode="selector"
                    range={materialOptions}
                    value={templateForm.material}
                    onChange={e => setTemplateForm(prev => ({ ...prev, material: Number(e.detail.value) }))}
                  >
                    <View className={styles.formPicker}>
                      <Text>{materialOptions[templateForm.material]}</Text>
                      <Text className={styles.pickerArrow}>▾</Text>
                    </View>
                  </Picker>
                </View>
                <View className={styles.formField}>
                  <Text className={styles.formLabel}>适用系列</Text>
                  <Picker
                    mode="selector"
                    range={seriesOptions}
                    value={templateForm.seriesName}
                    onChange={e => setTemplateForm(prev => ({ ...prev, seriesName: Number(e.detail.value) }))}
                  >
                    <View className={styles.formPicker}>
                      <Text>{seriesOptions[templateForm.seriesName]}</Text>
                      <Text className={styles.pickerArrow}>▾</Text>
                    </View>
                  </Picker>
                </View>
                <View className={styles.formField}>
                  <Text className={styles.formLabel}>除尘周期（天）</Text>
                  <Input
                    className={styles.formInput}
                    type="number"
                    value={templateForm.dustIntervalDays}
                    placeholder="30"
                    onInput={e => setTemplateForm(prev => ({ ...prev, dustIntervalDays: e.detail.value }))}
                  />
                </View>
                <View className={styles.formField}>
                  <Text className={styles.formLabel}>避光周期（天）</Text>
                  <Input
                    className={styles.formInput}
                    type="number"
                    value={templateForm.lightProtectionIntervalDays}
                    placeholder="60"
                    onInput={e => setTemplateForm(prev => ({ ...prev, lightProtectionIntervalDays: e.detail.value }))}
                  />
                </View>
                <View className={styles.formActions}>
                  <Button
                    className={styles.formCancelBtn}
                    onClick={() => setShowTemplateForm(false)}
                  >
                    <Text>取消</Text>
                  </Button>
                  <Button
                    className={styles.formConfirmBtn}
                    onClick={handleAddTemplate}
                  >
                    <Text>确认添加</Text>
                  </Button>
                </View>
              </View>
            )}
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
