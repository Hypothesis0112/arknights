// pages/export/export.js
import { loadRecords } from '../../utils/storage';
import { exportToExcel } from '../../utils/excelExporter';

Page({
  data: {
    recordCount: 0
  },

  onShow() {
    // 使用安全的方式更新tabBar
    this.safeUpdateTabBar();
  },

  onLoad() {
    // 异步加载记录数量
    this.loadRecordCount();
  },

  // 添加和analysis页面相同的safeUpdateTabBar方法
  safeUpdateTabBar() {
    if (this._updatingTabBar) {
      return;
    }
    
    this._updatingTabBar = true;
    
    setTimeout(() => {
      try {
        const pages = getCurrentPages();
        if (!pages || pages.length === 0) {
          this._updatingTabBar = false;
          return;
        }
        
        const currentPage = pages[pages.length - 1];
        const route = currentPage.route;
        
        if (!route) {
          this._updatingTabBar = false;
          return;
        }
        
        const routeMap = {
          'pages/index/index': 0,
          'pages/analysis/analysis': 1,
          'pages/gallery/gallery': 2,
          'pages/export/export': 3
        };
        
        const index = routeMap[route];
        
        if (typeof index !== 'number' || index < 0) {
          this._updatingTabBar = false;
          return;
        }
        
        const tabBar = this.getTabBar ? this.getTabBar() : null;
        
        if (!tabBar) {
          this._updatingTabBar = false;
          return;
        }
        
        if (typeof tabBar.setSelected === 'function') {
          tabBar.setSelected(index);
        } else if (tabBar.setData) {
          tabBar.setData({ selected: index });
        } else if (tabBar.selectComponent) {
          const tabBarComponent = tabBar.selectComponent('.tab-bar');
          if (tabBarComponent) {
            tabBarComponent.setData({ selected: index });
          }
        }
        
      } catch (error) {
        console.error('更新tabBar失败:', error);
      } finally {
        this._updatingTabBar = false;
      }
    }, 100);
  },

  // 异步加载记录数量
  async loadRecordCount() {
    try {
      const records = await loadRecords();
      this.setData({ 
        recordCount: records.length 
      });
    } catch (error) {
      console.error('加载记录失败:', error);
      this.setData({ 
        recordCount: 0 
      });
    }
  },

  // 导出JSON
  async exportJSON() {
    try {
      const records = await loadRecords();
      
      if (records.length === 0) {
        wx.showToast({ title: '无记录可导出', icon: 'none' });
        return;
      }
      
      const jsonStr = JSON.stringify(records, null, 2);
      
      wx.setClipboardData({
        data: jsonStr,
        success: () => {
          wx.showToast({ title: 'JSON已复制到剪贴板' });
        },
        fail: (err) => {
          wx.showToast({ title: '复制失败', icon: 'error' });
          console.error('复制失败:', err);
        }
      });
      
    } catch (error) {
      console.error('导出JSON失败:', error);
      wx.showToast({ title: '导出失败', icon: 'error' });
    }
  },

  // 导出Excel
  async exportExcel() {
    try {
      const records = await loadRecords();
      
      if (records.length === 0) {
        wx.showToast({ title: '无记录可导出', icon: 'none' });
        return;
      }
      
      exportToExcel(records);
      
    } catch (error) {
      console.error('导出Excel失败:', error);
      wx.showToast({ title: '导出失败', icon: 'error' });
    }
  },

  // 刷新数据（从其他页面返回时刷新）
  onShow() {
    this.safeUpdateTabBar();
    this.loadRecordCount();  // 每次显示时重新加载
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadRecordCount().then(() => {
      wx.stopPullDownRefresh();
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  }
});