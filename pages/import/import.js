// pages/import/import.js
import { addRecords } from '../../utils/storage';

Page({
  data: {
    pasteText: '',
    pastePreviewCount: 0,
    pasteErrors: []
  },

  onLoad() {
    // nothing
  },

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

  // 仅分析（不保存）
  onAnalyzePaste() {
    const { pasteText } = this.data;
    const { validRecords, errors } = this.parsePastedRecords(pasteText);
    this.setData({ pastePreviewCount: validRecords.length, pasteErrors: errors });
    if (validRecords.length > 0) {
      wx.showToast({ title: `已解析 ${validRecords.length} 条，错误 ${errors.length}`, icon: 'none' });
    } else {
      wx.showToast({ title: `未解析到有效记录，错误: ${errors.length}`, icon: 'none' });
    }
  },

  // 导入并保存（去重），完成后跳回分析页
  async onImportAndSave() {
    const { pasteText } = this.data;
    const { validRecords, errors } = this.parsePastedRecords(pasteText);
    if (validRecords.length === 0) {
      this.setData({ pasteErrors: errors });
      wx.showToast({ title: '没有有效记录可导入', icon: 'none' });
      return;
    }
    try {
      const res = await addRecords(validRecords, { dedupe: true });
      wx.showToast({ title: `导入完成，新增 ${res.added} 条，跳过 ${res.skipped} 条`, icon: 'success' });
      // 自动跳回分析 tab 并触发刷新（analysis 页 onShow 已会重新分析）
      wx.switchTab({ url: '/pages/analysis/analysis' });
    } catch (e) {
      console.error('导入失败', e);
      wx.showToast({ title: '导入失败，请查看控制台', icon: 'none' });
    }
  },

  onCancel() {
    // 返回分析页（或上一页）
    wx.switchTab({ url: '/pages/analysis/analysis' });
  }
});