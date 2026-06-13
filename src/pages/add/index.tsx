import React, { useState, useEffect } from 'react';
import { View, Text, Input, Textarea, Button, Image, Switch, ScrollView, Picker } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import { CollectionItem } from '../../types/collection';

const scaleOptions = ['1/4', '1/6', '1/7', '1/8', '1/10', 'Figma', 'Nendoroid', '其他'];

const AddPage: React.FC = () => {
  const router = useRouter();
  const { addCollection, updateCollection, getCollectionById } = useCollection();
  const editId = router.params.id as string;
  const isEdit = !!editId;

  const [formData, setFormData] = useState({
    characterName: '',
    seriesName: '',
    scale: '1/7',
    manufacturer: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    displayLocation: '',
    isUnboxed: false,
    hasArrived: true,
    reservationDate: '',
    balanceDueDate: '',
    notes: ''
  });

  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (isEdit && editId) {
      const item = getCollectionById(editId);
      if (item) {
        setFormData({
          characterName: item.characterName,
          seriesName: item.seriesName,
          scale: item.scale,
          manufacturer: item.manufacturer,
          purchasePrice: String(item.purchasePrice),
          purchaseDate: item.purchaseDate,
          displayLocation: item.displayLocation,
          isUnboxed: item.isUnboxed,
          hasArrived: item.hasArrived,
          reservationDate: item.reservationDate || '',
          balanceDueDate: item.balanceDueDate || '',
          notes: item.notes
        });
        setPhotos(item.photos);
      }
    }
  }, [isEdit, editId, getCollectionById]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'hasArrived' && value === true) {
        newData.isUnboxed = false;
      }
      return newData;
    });
  };

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - photos.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      setPhotos(prev => [...prev, ...res.tempFilePaths]);
      console.log('[Add] Photos selected:', res.tempFilePaths);
    } catch (e) {
      console.error('[Add] Failed to choose image:', e);
    }
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!formData.characterName.trim()) {
      Taro.showToast({ title: '请输入角色名', icon: 'none' });
      return;
    }
    if (!formData.seriesName.trim()) {
      Taro.showToast({ title: '请输入作品名', icon: 'none' });
      return;
    }

    const photoUrls = photos.length > 0
      ? photos
      : [`https://picsum.photos/id/${Math.floor(Math.random() * 100) + 1}/300/300`];

    if (isEdit && editId) {
      updateCollection(editId, {
        characterName: formData.characterName.trim(),
        seriesName: formData.seriesName.trim(),
        scale: formData.scale,
        manufacturer: formData.manufacturer.trim(),
        purchasePrice: parseFloat(formData.purchasePrice as string) || 0,
        purchaseDate: formData.purchaseDate,
        photos: photoUrls,
        displayLocation: formData.displayLocation.trim() || '待摆放',
        isUnboxed: formData.isUnboxed,
        hasArrived: formData.hasArrived,
        reservationDate: formData.reservationDate || undefined,
        balanceDueDate: formData.balanceDueDate || undefined,
        arrivalDate: formData.hasArrived ? (formData.purchaseDate) : undefined,
        notes: formData.notes.trim()
      });
      Taro.showToast({ title: '保存成功', icon: 'success' });
    } else {
      const newItem: Omit<CollectionItem, 'id' | 'createdAt' | 'sortOrder'> = {
        characterName: formData.characterName.trim(),
        seriesName: formData.seriesName.trim(),
        scale: formData.scale,
        manufacturer: formData.manufacturer.trim(),
        purchasePrice: parseFloat(formData.purchasePrice as string) || 0,
        purchaseDate: formData.purchaseDate,
        photos: photoUrls,
        displayLocation: formData.hasArrived
          ? (formData.displayLocation.trim() || '待摆放')
          : '待到货',
        isUnboxed: formData.isUnboxed,
        hasArrived: formData.hasArrived,
        reservationDate: formData.reservationDate || undefined,
        balanceDueDate: formData.balanceDueDate || undefined,
        arrivalDate: formData.hasArrived ? formData.purchaseDate : undefined,
        flaws: [],
        replacementParts: [],
        maintenanceRecords: [],
        notes: formData.notes.trim()
      };

      addCollection(newItem);
      Taro.showToast({ title: '添加成功', icon: 'success' });
    }

    setTimeout(() => {
      Taro.navigateBack();
    }, 1000);
  };

  const handleReset = () => {
    if (isEdit) {
      const item = getCollectionById(editId);
      if (item) {
        setFormData({
          characterName: item.characterName,
          seriesName: item.seriesName,
          scale: item.scale,
          manufacturer: item.manufacturer,
          purchasePrice: String(item.purchasePrice),
          purchaseDate: item.purchaseDate,
          displayLocation: item.displayLocation,
          isUnboxed: item.isUnboxed,
          hasArrived: item.hasArrived,
          reservationDate: item.reservationDate || '',
          balanceDueDate: item.balanceDueDate || '',
          notes: item.notes
        });
        setPhotos(item.photos);
      }
    } else {
      setFormData({
        characterName: '',
        seriesName: '',
        scale: '1/7',
        manufacturer: '',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        displayLocation: '',
        isUnboxed: false,
        hasArrived: true,
        reservationDate: '',
        balanceDueDate: '',
        notes: ''
      });
      setPhotos([]);
    }
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollY enhanced>
        <View className={styles.form}>
          <View className={styles.formSection}>
            <Text className={styles.sectionTitle}>基本信息</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>角色名 *</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入角色名称"
                placeholderTextColor="#64748B"
                value={formData.characterName}
                onInput={(e) => handleInputChange('characterName', e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>作品名 *</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入作品/系列名称"
                placeholderTextColor="#64748B"
                value={formData.seriesName}
                onInput={(e) => handleInputChange('seriesName', e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>比例</Text>
              <Picker
                mode="selector"
                range={scaleOptions}
                value={scaleOptions.indexOf(formData.scale) >= 0 ? scaleOptions.indexOf(formData.scale) : scaleOptions.length - 1}
                onChange={(e) => handleInputChange('scale', scaleOptions[e.detail.value])}
              >
                <View className={styles.formInput}>
                  <Text className={styles.pickerText}>{formData.scale}</Text>
                  <Text className={styles.pickerArrow}>▾</Text>
                </View>
              </Picker>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>厂商</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入生产厂商"
                placeholderTextColor="#64748B"
                value={formData.manufacturer}
                onInput={(e) => handleInputChange('manufacturer', e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>购买价格（元）</Text>
              <Input
                className={styles.formInput}
                type="digit"
                placeholder="请输入购买价格"
                placeholderTextColor="#64748B"
                value={formData.purchasePrice as string}
                onInput={(e) => handleInputChange('purchasePrice', e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>购买日期</Text>
              <Picker
                mode="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.detail.value)}
              >
                <View className={styles.formInput}>
                  <Text className={styles.pickerText}>{formData.purchaseDate}</Text>
                  <Text className={styles.pickerArrow}>📅</Text>
                </View>
              </Picker>
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionTitle}>展示照片</Text>
            <View className={styles.photoUpload}>
              {photos.map((photo, index) => (
                <View key={index} className={styles.photoItem}>
                  <Image
                    src={photo}
                    mode="aspectFill"
                    className={styles.photoImage}
                    onError={(e) => console.error('[Image] Failed to load:', e)}
                  />
                  <View className={styles.photoDelete} onClick={() => handleDeletePhoto(index)}>
                    <Text>×</Text>
                  </View>
                </View>
              ))}
              {photos.length < 9 && (
                <View className={styles.photoAdd} onClick={handleChooseImage}>
                  <Text className={styles.photoAddIcon}>+</Text>
                  <Text className={styles.photoAddText}>添加照片</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionTitle}>到货状态</Text>

            <View className={styles.switchRow}>
              <Text className={styles.switchLabel}>是否已到货</Text>
              <Switch
                checked={formData.hasArrived}
                onChange={(e) => handleInputChange('hasArrived', e.detail.value)}
                color="#7C3AED"
              />
            </View>

            {formData.hasArrived && (
              <View className={styles.switchRow}>
                <Text className={styles.switchLabel}>是否已拆封</Text>
                <Switch
                  checked={formData.isUnboxed}
                  onChange={(e) => handleInputChange('isUnboxed', e.detail.value)}
                  color="#7C3AED"
                />
              </View>
            )}

            {!formData.hasArrived && (
              <View className={styles.preOrderSection}>
                <View className={styles.preOrderBadge}>
                  <Text className={styles.preOrderBadgeText}>预订模式</Text>
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>预订日期</Text>
                  <Picker
                    mode="date"
                    value={formData.reservationDate || formData.purchaseDate}
                    onChange={(e) => handleInputChange('reservationDate', e.detail.value)}
                  >
                    <View className={styles.formInput}>
                      <Text className={styles.pickerText}>
                        {formData.reservationDate || formData.purchaseDate}
                      </Text>
                      <Text className={styles.pickerArrow}>📅</Text>
                    </View>
                  </Picker>
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>尾款截止日期</Text>
                  <Picker
                    mode="date"
                    value={formData.balanceDueDate}
                    onChange={(e) => handleInputChange('balanceDueDate', e.detail.value)}
                  >
                    <View className={classnames(styles.formInput, styles.importantInput)}>
                      <Text className={styles.pickerText}>
                        {formData.balanceDueDate || '请选择尾款截止日期'}
                      </Text>
                      <Text className={styles.pickerArrow}>📅</Text>
                    </View>
                  </Picker>
                </View>
                {formData.balanceDueDate && (
                  <View className={styles.balanceTip}>
                    <Text className={styles.balanceTipText}>
                      尾款截止：{formData.balanceDueDate}，添加后将在到货计划中显示待处理项
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>摆放位置</Text>
              <Input
                className={styles.formInput}
                placeholder={formData.hasArrived ? '如：展柜A-3层' : '到货后填写'}
                placeholderTextColor="#64748B"
                value={formData.displayLocation}
                onInput={(e) => handleInputChange('displayLocation', e.detail.value)}
              />
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionTitle}>备注</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="记录一些重要信息，如版本、特典等"
              placeholderTextColor="#64748B"
              value={formData.notes}
              onInput={(e) => handleInputChange('notes', e.detail.value)}
            />
          </View>
        </View>
      </ScrollView>

      <View className={styles.actionBar}>
        <Button
          className={styles.actionBtn + ' ' + styles.secondary}
          onClick={handleReset}
        >
          <Text>重置</Text>
        </Button>
        <Button
          className={styles.actionBtn + ' ' + styles.primary}
          onClick={handleSubmit}
        >
          <Text>{isEdit ? '保存修改' : '保存藏品'}</Text>
        </Button>
      </View>
    </View>
  );
};

function classnames(...args: string[]) {
  return args.filter(Boolean).join(' ');
}

export default AddPage;
