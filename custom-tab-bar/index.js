// components/tab-bar/tab-bar.js
Component({
  data: {
    selected: 0,
    // 使用同一张卡通小鱼图片，通过CSS滤镜区分
    iconPaths: [
      '/assets/images/monster-fish.png',  // 记录
      '/assets/images/monster-fish(2).png',  // 分析
      '/assets/images/monster-fish(3).png',  // 图鉴
      '/assets/images/monster-fish(4).png'   // 导出
    ],
    
    // 可选：添加不同的工具提示
    tabTips: [
      '记录抽卡数据',
      '分析抽卡统计',
      '查看干员图鉴',
      '导出你的数据'
    ]
  },

  lifetimes: {
    attached() {
      // 组件挂载时的初始化
      console.log('tab-bar组件加载完成，当前选中:', this.data.selected);
    }
  },

  methods: {
    switchTab(e) {
      const index = parseInt(e.currentTarget.dataset.index);
      const current = this.data.selected;
      
      if (index === current) {
        // 如果点击的是当前已选中的tab，可以添加一个轻微动画反馈
        this.animateTab(index);
        return;
      }
      
      // 先更新UI状态
      this.setData({ selected: index });
      
      // 添加切换动画效果
      this.animateTabSwitch(current, index);
      
      // 切换页面
      const paths = [
        '/pages/index/index',
        '/pages/analysis/analysis',
        '/pages/gallery/gallery',
        '/pages/export/export'
      ];
      
      // 延迟切换，让动画有足够时间显示
      setTimeout(() => {
        wx.switchTab({
          url: paths[index],
          fail: (err) => {
            console.error('切换页面失败:', err);
            // 如果切换失败，恢复原来的选中状态
            this.setData({ selected: current });
          }
        });
      }, 150);
    },
    
    // 供页面调用的方法
    setSelected(index) {
      if (typeof index !== 'number' || index < 0 || index > 3) {
        console.warn('setSelected: 无效的索引', index);
        return;
      }
      
      // 添加过渡效果
      this.setData({ 
        selected: index 
      }, () => {
        console.log('TabBar选中状态已更新为:', index);
      });
    },
    
    // 当前tab的轻微动画
    animateTab(index) {
      const query = this.createSelectorQuery();
      query.select(`.tab-item[data-index="${index}"]`).boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          // 可以在这里添加一个轻微震动的动画效果
          console.log(`Tab ${index} 被点击，当前已是选中状态`);
        }
      });
    },
    
    // Tab切换动画
    animateTabSwitch(fromIndex, toIndex) {
      // 简单的动画效果
      const fromElement = this.selectComponent(`.tab-item[data-index="${fromIndex}"]`);
      const toElement = this.selectComponent(`.tab-item[data-index="${toIndex}"]`);
      
      // 这里可以添加更复杂的动画效果
      console.log(`从Tab ${fromIndex} 切换到 Tab ${toIndex}`);
    },
    
    // 获取当前选中状态
    getCurrentSelected() {
      return this.data.selected;
    },
    
    // 获取tab名称
    getTabName(index) {
      const names = ['记录', '分析', '图鉴', '导出'];
      return names[index] || '未知';
    },
    
    // 重置选中状态（在某些情况下使用）
    resetSelection() {
      this.setData({ selected: 0 });
    }
  }
});