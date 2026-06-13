import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface SeriesTagProps {
  name: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

const SeriesTag: React.FC<SeriesTagProps> = ({ name, count, active, onClick }) => {
  return (
    <View 
      className={classnames(styles.tag, active && styles.active)} 
      onClick={onClick}
    >
      <Text className={styles.name}>{name}</Text>
      {count !== undefined && (
        <Text className={styles.count}>{count}</Text>
      )}
    </View>
  );
};

export default SeriesTag;
