// ============================================================
// ⚙️ 設定 - 國家考試規格
// ============================================================

// 考試設定
const EXAM_CONFIG = {
    academic: { label: '學科', count: 80, time: 100 },
    technical: { label: '術科', count: 10, time: 120 },
    calc: { label: '計算', count: 20, time: 60 },
    law: { label: '法規', count: 30, time: 60 }
};

// 題型映射
const TYPE_MAP = {
    single: '選擇題',
    multiple: '複選題',
    truefalse: '是非題',
    calc: '計算題',
    fill: '填充題',
    sort: '排序題',
    match: '配合題',
    link: '連連看',
    law: '法規題',
    essay: '問答題'
};

console.log('✅ 設定已載入 (國家考試規格)');
