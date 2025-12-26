// pages/index/index.js
import { addRecord } from '../../utils/storage';
import { POOLS } from '../../utils/gachaData';

Page({
  data: {
    pools: Object.entries(POOLS).map(([key, val]) => ({ key, name: val.name })),
    selectedPool: 0,
    selectedPoolIndex: 0,
    selectedPoolName: '请选择卡池', // ← 用于 WXML 安全显示
    operator: '',
    rarity: 6,
    array: ['五星', '六星'],
    starIndex: 1,
    isTarget: false,
    timestamp: ''
  },

  onLoad() {
    const now = new Date();
    const localISO = now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
    this.setData({ timestamp: localISO, starIndex: 1 });
  },

  onShow() {
    // 使用和 analysis 页面相同的安全方式更新tabBar
    this.safeUpdateTabBar();
  },

  // 安全更新自定义tabBar的方法（与analysis页面保持一致）
  safeUpdateTabBar() {
    // 防抖处理，避免重复调用
    if (this._updatingTabBar) {
      return;
    }
    
    this._updatingTabBar = true;
    
    setTimeout(() => {
      try {
        // 使用 getCurrentPages 获取当前路由，比 this.route 更可靠
        const pages = getCurrentPages();
        if (!pages || pages.length === 0) {
          this._updatingTabBar = false;
          return;
        }
        
        const currentPage = pages[pages.length - 1];
        const route = currentPage.route;
        
        if (!route) {
          console.warn('无法获取当前路由');
          this._updatingTabBar = false;
          return;
        }
        
        // 路由到tab索引的映射
        const routeMap = {
          'pages/index/index': 0,
          'pages/analysis/analysis': 1,
          'pages/gallery/gallery': 2,
          'pages/export/export': 3
        };
        
        const index = routeMap[route];
        
        // 验证索引有效性
        if (typeof index !== 'number' || index < 0) {
          console.warn(`无效的路由索引: ${index} (路由: ${route})`);
          this._updatingTabBar = false;
          return;
        }
        
        // 获取tabBar组件
        const tabBar = this.getTabBar ? this.getTabBar() : null;
        
        if (!tabBar) {
          console.warn('未找到tabBar组件');
          this._updatingTabBar = false;
          return;
        }
        
        // 检查tabBar是否有setSelected方法
        if (typeof tabBar.setSelected === 'function') {
          tabBar.setSelected(index);
        } 
        // 如果没有setSelected方法，尝试使用setData
        else if (tabBar.setData && typeof tabBar.setData === 'function') {
          tabBar.setData({
            selected: index
          });
        } 
        // 如果tabBar是一个组件，尝试调用组件方法
        else if (tabBar.selectComponent && typeof tabBar.selectComponent === 'function') {
          const tabBarComponent = tabBar.selectComponent('.tab-bar');
          if (tabBarComponent && tabBarComponent.setData) {
            tabBarComponent.setData({
              selected: index
            });
          }
        } 
        else {
          console.warn('tabBar不支持setSelected或setData方法');
        }
        
      } catch (error) {
        console.error('更新tabBar选中状态时出错:', error);
      } finally {
        this._updatingTabBar = false;
      }
    }, 100);
  },

  onPoolChange(e) {
    const poolKey = e.detail.value;
    const pool = this.data.pools.find(p => p.key === poolKey);
    this.setData({
      selectedPool: poolKey,
      selectedPoolName: pool.name
    });
  },

  onOperatorInput(e) {
    this.setData({ operator: e.detail.value.trim() });
  },

  // 添加这个计算函数
  getStarText(rarity) {
    return rarity === 6 ? '六星' : '五星';
  },

  onRarityChange(e) {
    this.setData({ starIndex: e.detail.value });
  },

  onIsTargetChange(e) {
    this.setData({ isTarget: e.detail.value.includes('true') });
  },

  onTimeChange(e) {
    this.setData({ timestamp: e.detail.value });
  },

  submitForm() {
    const { selectedPool, operator, starIndex, isTarget, timestamp } = this.data;
    console.log(this.data);
    // 转换starIndex为rarity
    const rarity = starIndex === 0 ? 5 : 6;

    if (!selectedPool) {
      wx.showToast({ title: '请选择卡池', icon: 'none' });
      return;
    }
    if (!operator) {
      wx.showToast({ title: '请输入干员名称', icon: 'none' });
      return;
    }

    const timeMs = new Date(timestamp).getTime();
    if (isNaN(timeMs)) {
      wx.showToast({ title: '时间格式无效', icon: 'none' });
      return;
    }

    const record = {
      pool: selectedPool,
      operator: operator,
      rarity: rarity,
      isTarget: isTarget,
      timestamp: timeMs
    };

    addRecord(record);
    wx.showToast({ title: '记录已保存', icon: 'success' });

    // 清空部分字段，保留卡池和时间
    this.setData({
      operator: '',
      starIndex: 1,
      isTarget: false
    });
  },
  
  // 快捷填充示例（可选）
  fillExample() {
    this.setData({
      selectedPool: '2024_12_winter',
      selectedPoolName: '2024 冬活限定寻访',
      operator: 'W',
      starIndex: 1,  // 改为1，对应六星
      isTarget: true
    });
  },

  // 打开批量导入页面
  openImportPage() {
    wx.navigateTo({
      url: '/pages/import/import'  // 需要创建批量导入页面
    });
  },
});