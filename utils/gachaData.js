// utils/gachaData.js

export const OPERATORS = {
    '能天使': { id: '001', name: '能天使', class: '狙击', rarity: 6 },
    '银灰': { id: '002', name: '银灰', class: '近卫', rarity: 6 },
    '艾雅法拉': { id: '003', name: '艾雅法拉', class: '术师', rarity: 6 },
    '先锋干员A': { id: '004', name: '先锋干员A', class: '先锋', rarity: 5 },
    '狙击干员B': { id: '005', name: '狙击干员B', class: '狙击', rarity: 6 },
    '限定干员A': { id: '006', name: '限定干员A', class: '特种', rarity: 6, isTarget: true },
    '限定干员B': { id: '007', name: '限定干员B', class: '医疗', rarity: 6, isTarget: true },
    '年': { id: '008', name: '年', class: '重装', rarity: 6 },
    '夕': { id: '009', name: '夕', class: '术师', rarity: 6 },
    '令': { id: '010', name: '令', class: '辅助', rarity: 6 }
  };

export const POOLS = {
    0: {
      name: '标准寻访',
      operators: ['能天使', '银灰', '艾雅法拉']
    },
    1: {
      name: '2024冬活限定',
      operators: ['限定干员A', '限定干员B']
    },
    2: {
      name: '新年限定',
      operators: ['年', '夕', '令']
    }
  };