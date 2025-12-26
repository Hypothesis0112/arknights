// utils/excelExporter.js
import XLSX from 'xlsx';

export function exportToExcel(records) {
  // 转换时间戳为可读格式
  const data = records.map(r => ({
    卡池: r.pool,
    干员: r.operator,
    星级: r.rarity,
    是否UP: r.isTarget ? '是' : '否',
    时间: new Date(r.timestamp).toLocaleString('zh-CN')
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "抽卡记录");

  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const filePath = `${wx.env.USER_DATA_PATH}/arknights_gacha.xlsx`;

  const fs = wx.getFileSystemManager();
  fs.writeFile({
    filePath: filePath,
    data: wbout,
    encoding: 'binary',
    success: () => {
      wx.openDocument({
        filePath: filePath,
        fileType: 'xlsx',
        success: () => console.log('Excel opened'),
        fail: (err) => {
          wx.showToast({ title: '打开失败，请到文件App查看', icon: 'none' });
        }
      });
    },
    fail: (err) => {
      wx.showToast({ title: '导出失败', icon: 'error' });
      console.error('Export error:', err);
    }
  });
}