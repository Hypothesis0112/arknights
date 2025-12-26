// utils/storage.js

function loadRecords() {
    return new Promise((resolve) => {
      wx.getStorage({
        key: 'gachaRecords',
        success(res) {
          try {
            const data = JSON.parse(res.data);
            resolve(Array.isArray(data) ? data : []);
          } catch (e) {
            console.error('parse storage data error', e);
            resolve([]);
          }
        },
        fail() {
          resolve([]); // 如果没有记录，则返回空数组
        }
      });
    });
  }
  
  /**
   * 将单条记录追加并保存
   * 返回 Promise，在调用处可以选择 await 或不 await
   */
  function addRecord(record) {
    return loadRecords().then(records => {
      records.push(record);
      return new Promise((resolve, reject) => {
        wx.setStorage({
          key: 'gachaRecords',
          data: JSON.stringify(records),
          success() {
            console.log('Record saved successfully');
            resolve();
          },
          fail(error) {
            console.error('Failed to save record:', error);
            reject(error);
          }
        });
      });
    });
  }
  
  /**
   * 批量追加记录并保存
   * records: Array
   * options: { dedupe: true|false }  默认去重
   * 返回 Promise< { added, skipped, total } >
   */
  function addRecords(records, options = { dedupe: true }) {
    if (!Array.isArray(records)) {
      return Promise.reject(new Error('records must be an array'));
    }
    return loadRecords().then(existing => {
      const existingKeys = new Set(existing.map(r => `${r.pool}||${r.operator}||${r.timestamp}`));
      let added = 0, skipped = 0;
      records.forEach(r => {
        const key = `${r.pool}||${r.operator}||${r.timestamp}`;
        if (options.dedupe && existingKeys.has(key)) {
          skipped++;
        } else {
          existing.push(r);
          existingKeys.add(key);
          added++;
        }
      });
      return new Promise((resolve, reject) => {
        wx.setStorage({
          key: 'gachaRecords',
          data: JSON.stringify(existing),
          success() {
            resolve({ added, skipped, total: records.length });
          },
          fail(err) {
            reject(err);
          }
        });
      });
    });
  }
  
  /**
   * 为兼容旧引用保留 saveRecord（行为等同 addRecord）
   */
  function saveRecord(record) {
    return addRecord(record);
  }
  
  /**
   * 从本地临时文件读取并解析记录（返回 Promise）
   * filePath: wx.chooseMessageFile 返回的 tempFiles[0].path
   * 返回值: Promise< Array >
   */
  function loadRecordsFromFile(filePath) {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      fs.readFile({
        filePath,
        encoding: 'utf-8',
        success(res) {
          try {
            const data = JSON.parse(res.data);
            if (!Array.isArray(data)) {
              reject(new Error('文件内容不是记录数组'));
              return;
            }
            resolve(data);
          } catch (e) {
            reject(new Error('JSON 解析失败：' + e.message));
          }
        },
        fail(err) {
          reject(new Error('读取文件失败：' + (err && err.errMsg ? err.errMsg : JSON.stringify(err))));
        }
      });
    });
  }
  
  export { loadRecords, addRecord, saveRecord, loadRecordsFromFile, addRecords };