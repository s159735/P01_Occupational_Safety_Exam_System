// ============================================================
// 📋 題型對應表 v10.2.0
// 檔案位置：03_核心邏輯/01_題型對應表.js
// 職責：定義題型顯示名稱、顏色、圖示、模組對應
// 更新日期：2026-07-17
// ============================================================

console.log('📋 01_題型對應表 v10.2.0 載入中...');

// ============================================================
// 1. 題型顯示名稱對應
// ============================================================
var TYPE_DISPLAY = {
    single: '選擇題(單選題)',
    multiple: '選擇題(複選題)',
    truefalse: '是非題',
    fill: '填空題',
    calc: '計算題',
    match: '配合題',
    sort: '排序題',
    sequencing: '排序題',
    link: '連連看'
};

// ============================================================
// 2. 題型顏色對應（UI 用）
// ============================================================
var TYPE_COLORS = {
    single: '#1a237e',
    multiple: '#e65100',
    truefalse: '#6b46c1',
    calc: '#d9534f',
    fill: '#2e7d32',
    sort: '#f7c948',
    match: '#8e44ad',
    link: '#5bc0de'
};

// ============================================================
// 3. 題型圖示對應（FontAwesome）
// ============================================================
var TYPE_ICONS = {
    single: 'fa-circle',
    multiple: 'fa-check-square',
    truefalse: 'fa-question-circle',
    fill: 'fa-pencil',
    calc: 'fa-calculator',
    match: 'fa-link',
    sort: 'fa-arrows-alt-v',
    link: 'fa-chain'
};

// ============================================================
// 4. 題型模組名稱對應
// ============================================================
var TYPE_MODULES = {
    single: '選擇題(單選題)',
    multiple: '選擇題(複選題)',
    truefalse: '是非題',
    fill: '填空題',
    calc: '計算題',
    match: '配合題',
    sort: '排序題',
    link: '連連看'
};

// ============================================================
// 5. 題型渲染函數對應表（動態註冊）
// ============================================================
var TYPE_RENDERERS = {};

// ============================================================
// 6. 題型規格模板對應
// ============================================================
var TYPE_SPECS = {
    single: {
        layout: '題幹區（中央） → 選項區（下方）',
        structure: ['題幹區', '選項區'],
        optionUI: '○ (A)(B)(C)(D) 圓形單選鈕',
        action: '點選',
        draggable: false,
        scoring: '單題計分',
        steps: ['閱讀題幹區的題目', '閱讀 (A)(B)(C)(D) 四個選項', '以滑鼠左鍵點選認為正確的選項']
    },
    multiple: {
        layout: '題幹區（中央） → 選項區（下方）',
        structure: ['題幹區', '選項區'],
        optionUI: '☑ (A)(B)(C)(D) 方形勾選框（全對才給分）',
        action: '勾選',
        draggable: false,
        scoring: '全對才給分',
        steps: ['閱讀題幹區的題目', '閱讀所有選項', '逐一點選所有認為正確的選項']
    },
    truefalse: {
        layout: '題幹區（中央） → 選項區（下方）',
        structure: ['題幹區', '選項區'],
        optionUI: '○ 是 ○ 否',
        action: '點選',
        draggable: false,
        scoring: '單題計分',
        steps: ['閱讀題幹區的敘述', '判斷敘述是否正確', '點選「是」或「否」']
    },
    fill: {
        layout: '題幹區（上方，內嵌空白欄位） → 作答區（數字鍵盤）',
        structure: ['題幹區', '作答區'],
        optionUI: '(A) ______ (3.3%)',
        action: '數字鍵盤輸入',
        draggable: false,
        scoring: '各欄位獨立計分',
        hasNumberPad: true,
        steps: ['閱讀題幹區的題目', '點選空白欄位', '使用數字鍵盤輸入答案']
    },
    calc: {
        layout: '題幹區 → 計算機區 → 答案欄位',
        structure: ['題幹區', '計算機區', '答案欄位'],
        optionUI: '______ (10%) + 計算機按鈕',
        action: '計算 + 輸入',
        draggable: false,
        scoring: '輸入正確答案即給分',
        hasNumberPad: true,
        hasCalculator: true,
        steps: ['閱讀題幹區的題目', '使用計算機運算', '輸入最終答案']
    },
    match: {
        layout: '上層：題幹區 → 中層：作答區 (A)(B)(C)(D)(E) ______ (2%) → 下層：選項區（卡片）',
        structure: ['題幹區', '作答區', '選項區'],
        optionUI: '卡片形式（含干擾選項）',
        action: '拖曳',
        draggable: true,
        scoring: '各配對獨立計分',
        hasMiddleZone: true,
        hasAnswerZone: true,
        distractors: '2~4 個干擾選項',
        steps: ['閱讀上層題幹區的題目', '瀏覽下層選項區的卡片', '拖曳至中層作答區']
    },
    sequencing: {
        layout: '上層：題幹區 → 中層：作答區 1. 2. 3. 4. ______ (2.5%) → 下層：選項區（卡片）',
        structure: ['題幹區', '作答區', '選項區'],
        optionUI: '卡片形式（含干擾選項）',
        action: '拖曳',
        draggable: true,
        scoring: '全對才給分',
        hasMiddleZone: true,
        hasAnswerZone: true,
        distractors: '1~2 個干擾選項',
        steps: ['閱讀上層題幹區的題目', '瀏覽下層選項區的卡片', '拖曳至中層作答區排列']
    },
    link: {
        layout: '左欄：題幹項目 → 右欄：答案項目',
        structure: ['左欄（題幹）', '右欄（答案）'],
        optionUI: '點選連線',
        action: '點選左欄 → 點選右欄配對',
        draggable: false,
        scoring: '所有連線完全正確才給分',
        steps: ['閱讀左欄與右欄的所有項目', '點選左欄項目', '點選右欄對應答案']
    }
};

// ============================================================
// 7. 公用函數
// ============================================================

function getTypeDisplay(type) {
    return TYPE_DISPLAY[type] || '未知題型';
}

function getTypeColor(type) {
    return TYPE_COLORS[type] || '#888888';
}

function getTypeIcon(type) {
    return TYPE_ICONS[type] || 'fa-question';
}

function getTypeModule(type) {
    return TYPE_MODULES[type] || type;
}

function getTypeSpec(type) {
    return TYPE_SPECS[type] || TYPE_SPECS.single;
}

function registerRenderer(type, renderFn) {
    TYPE_RENDERERS[type] = renderFn;
    console.log('✅ 已註冊題型渲染器: ' + getTypeDisplay(type));
}

function getRenderer(type) {
    return TYPE_RENDERERS[type] || null;
}

function isTypeSupported(type) {
    return type in TYPE_DISPLAY;
}

function getSupportedTypes() {
    return Object.keys(TYPE_DISPLAY);
}

// ============================================================
// 8. 匯出到全域
// ============================================================

window.TypeMapping = {
    TYPE_DISPLAY: TYPE_DISPLAY,
    TYPE_COLORS: TYPE_COLORS,
    TYPE_ICONS: TYPE_ICONS,
    TYPE_MODULES: TYPE_MODULES,
    TYPE_RENDERERS: TYPE_RENDERERS,
    TYPE_SPECS: TYPE_SPECS,
    getTypeDisplay: getTypeDisplay,
    getTypeColor: getTypeColor,
    getTypeIcon: getTypeIcon,
    getTypeModule: getTypeModule,
    getTypeSpec: getTypeSpec,
    registerRenderer: registerRenderer,
    getRenderer: getRenderer,
    isTypeSupported: isTypeSupported,
    getSupportedTypes: getSupportedTypes
};

console.log('✅ 01_題型對應表 v10.2.0 已載入');
console.log('   📋 支援 ' + Object.keys(TYPE_DISPLAY).length + ' 種題型');
console.log('   🎨 已註冊 ' + Object.keys(TYPE_SPECS).length + ' 種規格模板');