// pages/gallery/gallery.js
import { loadRecords } from '../../utils/storage';
import { OPERATORS } from '../../utils/gachaData';

Page({
  data: {
    operators: [],
    ownedSet: new Set(),
    filterRarity: '全部', // 'all', 5, 6
    filterRarityIndex: 0,
    rarityArray: ['全部', '5星', '6星'],
    filterClass: '全部',  // 'all', '狙击', '术师', ...
    filterClassIndex: 0,
    allClasses: ['全部', '先锋', '近卫', '重装', '狙击', '术师', '医疗', '辅助', '特种']
  },

  onShow() {
    // 延迟一点确保tabBar已经加载
    setTimeout(() => {
      const tabBar = this.getTabBar ? this.getTabBar() : null;
      if (tabBar) {
        const routeMap = {
          'pages/index/index': 0,
          'pages/analysis/analysis': 1,
          'pages/gallery/gallery': 2,
          'pages/export/export': 3
        };
        
        const index = routeMap[this.route] || 0;
        tabBar.setSelected(index);
      }
    }, 100);
  },

  onLoad() {
    this.loadGalleryData();
  },

  loadGalleryData() {
    console.log('开始加载图库数据...');
    
    // 同步加载记录
    const records = loadRecords();
    console.log('加载的记录:', records);
    
    const ownedNames = new Set();
    
    // 安全处理记录数据
    if (records && Array.isArray(records)) {
      records.forEach(record => {
        if (record && record.operator && typeof record.operator === 'string') {
          ownedNames.add(record.operator.trim());
        }
      });
    } else {
      console.warn('记录不是数组或为空:', records);
    }
    
    console.log('已拥有干员:', Array.from(ownedNames));
    
    // 获取所有干员
    const allOperators = Object.values(OPERATORS);
    console.log('总干员数:', allOperators.length);
    
    // 获取所有职业类型（去重）
    const classes = [...new Set(allOperators.map(op => op.class).filter(Boolean))].sort();
    const allClasses = ['全部', ...classes];
    
    console.log('职业列表:', allClasses);
    
    // 构建展示列表
    const operators = allOperators.map(op => ({
      ...op,
      owned: ownedNames.has(op.name)
    }));
    
    console.log('处理后的干员数据:', operators);
    
    this.setData({
      operators,
      ownedSet: ownedNames,
      allClasses,
      filteredOperators: operators
    });
    
    this.applyFilters();
  },

  applyFilters() {
    const { operators, filterRarity, filterClass } = this.data;
    let filtered = operators;
    
    console.log('应用过滤:', { filterRarity, filterClass, operatorsCount: operators.length });

    if (filterRarity !== '全部') {
      // 从 '5星' 字符串中提取数字
      const rarityNum = filterRarity === '5星' ? 5 : 
                       filterRarity === '6星' ? 6 : 
                       parseInt(filterRarity);
      console.log('过滤星级:', filterRarity, '->', rarityNum);
      
      if (!isNaN(rarityNum)) {
        filtered = filtered.filter(op => {
          const match = op.rarity === rarityNum;
          return match;
        });
      }
    }
    
    if (filterClass !== '全部') {
      console.log('过滤职业:', filterClass);
      filtered = filtered.filter(op => op.class === filterClass);
    }
    
    console.log('过滤结果数量:', filtered.length);
    this.setData({ filteredOperators: filtered });
  },

  onRarityFilterChange(e) {
    const index = e.detail.value;
    this.setData({ 
      filterRarityIndex: index, 
      filterRarity: this.data.rarityArray[index] 
    }, () => {
      this.applyFilters();
    });
  },

  onClassFilterChange(e) {
    const index = e.detail.value;
    this.setData({ 
      filterClassIndex: index, 
      filterClass: this.data.allClasses[index] 
    }, () => {
      this.applyFilters();
    });
  }
});