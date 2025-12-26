// pages/analysis/analysis.js
import { loadRecords, loadRecordsFromFile, addRecords } from '../../utils/storage';
import { POOLS } from '../../utils/gachaData';

Page({
  data: {
    total: 0,
    sixStarCount: 0,
    fiveStarCount: 0,
    sixStarRate: '0.00',
    fiveStarRate: '0.00',
    offTargetRate: '0.00',
    poolStats: [],

    // 粘贴导入相关
    pasteText: '',
    pastePreviewCount: 0,
    pasteErrors: [], // 每项: {index, error}
    showDebug: false
  },

  onLoad() {
    console.log('DEBUG: analysis onLoad called');
    const pages = getCurrentPages ? getCurrentPages() : [];
    console.log('DEBUG: current routes =', pages.map(p => p.route));
    wx.showToast({ title: 'analysis 页面已加载（测试）', icon: 'none', duration: 1200 });

    // 不在 onLoad 查询 DOM，改到 onReady
    this.analyzeData();
  },

  // 在 onReady 中等待视图渲染后再查询/显示运行时调试条
  onReady() {
    // 小延迟确保视图完全渲染（也可以尝试不延迟）
    setTimeout(() => {
      // 显示运行时调试条（wx:if 将生效）
      this.setData({ showDebug: true });

      // 在当前页面作用域内查询元素
      const q = wx.createSelectorQuery().in(this);
      q.selectAll('*').boundingClientRect((rects) => {
        console.log('DEBUG selectAll * rects length =', Array.isArray(rects) ? rects.length : 'no-array', rects);
      });
      // 如果你为调试条设置了 id，例如 id="debugFloat"，也可以单独查询：
      // q.select('#debugFloat').boundingClientRect(r => console.log('debugFloat rect=', r));
      q.exec();
    }, 80);
  },

  onShow() {
    // 每次进入页面重新分析（支持新增记录后刷新）
    this.analyzeData();
    
    // 更新自定义tabBar选中状态 - 使用更安全的方式
    this.safeUpdateTabBar();
  },

  // 安全更新自定义tabBar的方法
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

  /**
   * analyzeData 支持外部传入记录数组（用于文件/粘贴导入分析）
   * 如果未传入，则从本地存储读取（异步）
   */
  async analyzeData(externalRecords) {
    let records = externalRecords;
    if (!records) {
      try {
        records = await loadRecords();
      } catch (e) {
        records = [];
      }
    }
    const total = (records && records.length) || 0;

    if (total === 0) {
      this.setData({
        total: 0,
        sixStarCount: 0,
        fiveStarCount: 0,
        sixStarRate: '0.00',
        fiveStarRate: '0.00',
        offTargetRate: '0.00',
        poolStats: []
      });
      return;
    }

    const sixStars = records.filter(r => r.rarity === 6);
    const fiveStars = records.filter(r => r.rarity === 5);
    const offTargets = sixStars.filter(r => !r.isTarget);

    // 按卡池聚合
    const poolMap = {};
    records.forEach(r => {
      if (!poolMap[r.pool]) {
        poolMap[r.pool] = { total: 0, six: 0, off: 0 };
      }
      poolMap[r.pool].total++;
      if (r.rarity === 6) {
        poolMap[r.pool].six++;
        if (!r.isTarget) poolMap[r.pool].off++;
      }
    });

    const poolStats = Object.entries(poolMap).map(([key, stat]) => {
      const poolName = POOLS[key]?.name || key;
      const sixRate = (stat.six / stat.total * 100).toFixed(2);
      const offRate = stat.six > 0 ? (stat.off / stat.six * 100).toFixed(2) : '0.00';
      return {
        name: poolName,
        total: stat.total,
        sixCount: stat.six,
        sixRate: sixRate + '%',
        offRate: offRate + '%'
      };
    });

    this.setData({
      total,
      sixStarCount: sixStars.length,
      fiveStarCount: fiveStars.length,
      sixStarRate: (sixStars.length / total * 100).toFixed(2) + '%',
      fiveStarRate: (fiveStars.length / total * 100).toFixed(2) + '%',
      offTargetRate: sixStars.length > 0
        ? (offTargets.length / sixStars.length * 100).toFixed(2) + '%'
        : '0.00%',
      poolStats
    });
  },

  // 从文件选择并加载（用于离线导入分析）
  chooseFileAndAnalyze() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) {
          wx.showToast({ title: '未选择文件', icon: 'none' });
          return;
        }
        const path = file.path;
        loadRecordsFromFile(path)
          .then(records => {
            this.analyzeData(records);
            wx.showToast({ title: '文件加载完成（仅用于分析）', icon: 'success' });
          })
          .catch(err => {
            wx.showToast({ title: err.message || String(err), icon: 'none', duration: 3000 });
          });
      },
      fail() {
        wx.showToast({ title: '文件选择取消', icon: 'none' });
      }
    });
  },

  // ---------- 粘贴导入逻辑 ----------
  onPasteInput(e) {
    this.setData({ pasteText: e.detail.value });
  },

  // 解析粘贴文本，返回 { validRecords, errors }
  parsePastedRecords(text) {
    const result = { validRecords: [], errors: [] };
    if (!text || !text.trim()) {
      return result;
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      result.errors.push({ index: -1, error: 'JSON 解析失败: ' + e.message });
      return result;
    }
    if (!Array.isArray(parsed)) {
      result.errors.push({ index: -1, error: '顶层必须是数组' });
      return result;
    }
    parsed.forEach((item, idx) => {
      const errPrefix = `项 ${idx}`;
      if (!item || typeof item !== 'object') {
        result.errors.push({ index: idx, error: `${errPrefix} 不是对象` });
        return;
      }
      const pool = String(item.pool || '').trim();
      const operator = String(item.operator || '').trim();
      const rarity = Number(item.rarity);
      let isTarget = item.isTarget;
      let timestamp = item.timestamp;

      if (!pool) {
        result.errors.push({ index: idx, error: `${errPrefix} 缺少 pool` });
        return;
      }
      if (!operator) {
        result.errors.push({ index: idx, error: `${errPrefix} 缺少 operator` });
        return;
      }
      if (Number.isNaN(rarity) || (rarity !== 5 && rarity !== 6)) {
        result.errors.push({ index: idx, error: `${errPrefix} rarity 应为 5 或 6` });
        return;
      }
      // isTarget 允许 boolean 或字符串 'true'/'false'
      if (typeof isTarget === 'string') {
        isTarget = isTarget.toLowerCase() === 'true';
      } else {
        isTarget = Boolean(isTarget);
      }
      // timestamp 支持数字或可解析字符串
      if (typeof timestamp === 'string') {
        const t = Date.parse(timestamp);
        if (Number.isNaN(t)) {
          result.errors.push({ index: idx, error: `${errPrefix} timestamp 字符串无法解析` });
          return;
        }
        timestamp = t;
      } else if (typeof timestamp !== 'number') {
        result.errors.push({ index: idx, error: `${errPrefix} 缺少有效 timestamp` });
        return;
      }

      result.validRecords.push({
        pool,
        operator,
        rarity,
        isTarget,
        timestamp
      });
    });
    return result;
  },

  // 仅分析粘贴内容（预览）
  onAnalyzePaste() {
    const { pasteText } = this.data;
    const { validRecords, errors } = this.parsePastedRecords(pasteText);
    this.setData({
      pastePreviewCount: validRecords.length,
      pasteErrors: errors
    });
    if (validRecords.length > 0) {
      this.analyzeData(validRecords);
      wx.showToast({ title: `已分析 ${validRecords.length} 条（${errors.length} 条错误）`, icon: 'none' });
    } else {
      wx.showToast({ title: `未解析到有效记录，错误: ${errors.length}`, icon: 'none' });
    }
  },

  // 导入并保存（默认去重）
  async onImportAndSave() {
    const { pasteText } = this.data;
    const { validRecords, errors } = this.parsePastedRecords(pasteText);
    if (validRecords.length === 0) {
      wx.showToast({ title: '没有有效记录可导入', icon: 'none' });
      this.setData({ pasteErrors: errors });
      return;
    }
    try {
      const res = await addRecords(validRecords, { dedupe: true });
      wx.showToast({ title: `导入完成，新增 ${res.added} 条，跳过 ${res.skipped} 条`, icon: 'success' });
      // 重新分析并刷新页面数据
      this.analyzeData();
      // 清除粘贴区（可保留，视需）
      this.setData({ pasteText: '', pastePreviewCount: 0, pasteErrors: [] });
    } catch (e) {
      console.error('导入失败', e);
      wx.showToast({ title: '导入失败，请查看控制台', icon: 'none' });
    }
  },

  // ---------- 刷新数据 ----------
  onPullDownRefresh() {
    this.analyzeData();
    wx.stopPullDownRefresh();
  }
});