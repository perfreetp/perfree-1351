export default defineAppConfig({
  pages: [
    'pages/showcase/index',
    'pages/plan/index',
    'pages/maintenance/index',
    'pages/stats/index',
    'pages/detail/index',
    'pages/add/index',
    'pages/share/index',
    'pages/cabinet/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0F172A',
    navigationBarTitleText: '手办展示柜',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0F172A'
  },
  tabBar: {
    color: '#64748B',
    selectedColor: '#A78BFA',
    backgroundColor: '#0F172A',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/showcase/index',
        text: '展示柜'
      },
      {
        pagePath: 'pages/plan/index',
        text: '到货计划'
      },
      {
        pagePath: 'pages/maintenance/index',
        text: '维护记录'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计看板'
      }
    ]
  }
})
