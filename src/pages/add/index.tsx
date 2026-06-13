import React, { useState } from 'react';
import { View, Text, Input, Textarea, Button, Image, Switch, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useCollection } from '../../store/CollectionContext';
import { CollectionItem } from '../../types/collection';

const AddPage: React.FC = () => {
  const { addCollection } = useCollection();
  
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

  const handleInputChange = (field: keyof typeof formData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    const newItem: Omit<CollectionItem, 'id' | 'createdAt' | 'sortOrder'> = {
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
      arrivalDate: formData.hasArrived ? formData.purchaseDate : undefined,
      flaws: [],
      replacementParts: [],
      maintenanceRecords: [],
      notes: formData.notes.trim()
    };

    addCollection(newItem);
    Taro.showToast({ title: '添加成功', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1000);
  };

  const handleReset = () => {
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
              <Input
                className={styles.formInput}
                placeholder="如：1/7、1/4、Figma"
                placeholderTextColor="#64748B"
                value={formData.scale}
                onInput={(e) => handleInputChange('scale', e.detail.value)}
              />
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
              <Input
                className={styles.formInput}
                type="number"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
                value={formData.purchaseDate}
                onInput={(e) => handleInputChange('purchaseDate', e.detail.value)}
              />
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
            <Text className={styles.sectionTitle}>状态信息</Text>
            
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
              <>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>预订日期</Text>
                  <Input
                    className={styles.formInput}
                    type="number"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                    value={formData.reservationDate}
                    onInput={(e) => handleInputChange('reservationDate', e.detail.value)}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>尾款截止日期</Text>
                  <Input
                    className={styles.formInput}
                    type="number"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                    value={formData.balanceDueDate}
                    onInput={(e) => handleInputChange('balanceDueDate', e.detail.value)}
                  />
                </View>
              </>
            )}

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>摆放位置</Text>
              <Input
                className={styles.formInput}
                placeholder="如：展柜A-3层"
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
          <Text>保存藏品</Text>
        </Button>
      </View>
    </View>
  );
};

export default AddPage;
