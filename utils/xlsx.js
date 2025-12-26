// 简易占位文件，避免因缺少模块导致小程序崩溃。
// 仅用于开发时占位。若需要导出 Excel，请替换为 SheetJS 浏览器构建或完整实现。
module.exports = {
  // 导出最小接口占位
  utils: {},
  write: function() {
    throw new Error('xlsx.write: not implemented in placeholder. Replace utils/xlsx.js with real implementation.');
  },
  read: function() {
    throw new Error('xlsx.read: not implemented in placeholder. Replace utils/xlsx.js with real implementation.');
  }
};