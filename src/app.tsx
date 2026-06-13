import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { CollectionProvider } from './store/CollectionContext';
// 全局样式
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] Initialized');
  }, []);

  useDidShow(() => {
    console.log('[App] Show');
  });

  useDidHide(() => {
    console.log('[App] Hide');
  });

  return (
    <CollectionProvider>
      {props.children}
    </CollectionProvider>
  );
}

export default App;
