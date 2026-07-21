// ============================================================
// 📋 題型格式規範（8 大題型完整範本）- v10.2.0-DETAILED
// 檔案位置：03_核心邏輯/00_題型格式規範.js
// 職責：定義各題型的標準資料格式與 spec 規範
// 更新日期：2026-07-17
// 版本：10.2.0（具體詳細版 - 完整欄位定義 + 雙模式支援）
// ============================================================

console.log('📋 00_題型格式規範 v10.2.0-DETAILED 載入中...');

// ============================================================
// 📌 重要說明：雙模式架構
// ============================================================
// 
// 【模式一：完整詳細版】（本檔案定義）
//   - 包含所有欄位：id, type, typeLabel, text, options, answer,
//     points, group, stem, imageUrl, explanation, law, tips, 
//     logic, spec, formulaKey, formulaParams, leftItems, rightItems,
//     pairs, blanks, pointsPerItem
//   - 適用場景：種子本、完整題庫、系統最終輸出
//   - 優點：所有資訊完整，無需即時計算
//   - 缺點：檔案體積較大
//
// 【模式二：精簡核心版】（由智慧引擎生成）
//   - 只保留核心欄位：id, type, typeLabel, typePrefix, text,
//     options, answer, points, group, stem, imageUrl, law
//   - 其餘欄位（explanation, tips, logic, spec）由 14_解析_主引擎.js
//     根據關鍵字動態生成
//   - 適用場景：種子繁衍、大量儲存、動態解析
//   - 優點：檔案體積小、易於維護
//   - 缺點：需要智慧引擎支援
//
// ============================================================

// ============================================================
// 1. 選擇題(單選題) (single) - 完整詳細版
// ============================================================
var SingleChoiceTemplate = {
  // ----- 核心欄位（兩種模式都必須有）-----
  id: "S0",                    // 題號（前綴+數字，如 S0, S1, ...）
  type: "single",              // 題型代碼（single / multiple / truefalse / fill / calc / match / sequencing / link）
  typeLabel: "選擇題(單選題)",   // 題型顯示名稱
  typePrefix: "S",             // 題型前綴（S / M / T / F / C / P / Q / L）
  text: "未滿18歲可以從事下列那一項工作？",  // 題目文字
  options: [                   // 選項陣列（選擇題/是非題專用）
    "220伏特以下電力線之銜接",
    "起重機運轉工作",
    "坑內工作",
    "鍋爐操作"
  ],
  answer: 0,                   // 正確答案索引（從 0 開始）
  points: "10%",               // 配分（字串格式，如 "10%" 或 "10分"）
  group: 3,                    // 題組編號（可選）
  stem: "試回答下列問題：",      // 題幹提示文字
  imageUrl: null,              // 圖片網址（可選）

  // ----- 完整欄位（完整詳細版專用）-----
  // 以下欄位在「精簡核心版」模式中會被移除，由智慧引擎動態生成
  explanation: {               // 解析摘要（完整詳細版儲存；精簡版由引擎生成）
    summary: "未滿18歲不得從事危險性工作，220伏特以下電力線銜接屬非危險性工作。",
    detail: "勞動基準法規定雇主不得使未滿18歲勞工從事危險性或有害性工作。",
    lawRef: {                  // 法規參照（可選）
      name: "勞動基準法",
      pcode: "N0030025",
      article: "第 44 條、第 45 條"
    }
  },
  law: {                       // 法規資訊（完整詳細版儲存；精簡版只保留 pcode）
    pcode: "N0030025",         // 法規代碼（必填）
    name: "勞動基準法",        // 法規名稱
    article: {                 // 條文資訊
      full: "第 44 條、第 45 條",
      條: "第 44 條"
    },
    summary: "雇主不得使未滿18歲勞工從事危險性或有害性工作。"
  },
  tips: {                      // 答題秘訣（完整詳細版儲存；精簡版由引擎生成）
    quick: ["💡 核心口訣：18歲以下只能做低壓電，其他危險工作不能做！"],
    mnemonic: "🧠 完整記憶劇本：\n【18歲以下】＝保護對象\n不能碰：起重機、坑內、鍋爐\n可以碰：220伏特以下電力線",
    commonMistake: ["🚨 陷阱：未滿18歲「可以」從事220伏特以下電力線銜接，不要看到「電」就以為不行！"]
  },
  logic: [                     // 邏輯標籤（完整詳細版儲存；精簡版由引擎生成）
    { 
      label: "法規數字", 
      reason: "測驗考生對勞動基準法第44條、第45條中18歲年齡限制的記憶。" 
    }
  ],
  spec: {                      // 規格模板（完整詳細版儲存；精簡版由引擎生成）
    layout: "題幹區（中央） → 選項區（下方）",
    structure: ["題幹區", "選項區"],
    optionUI: "○ (A)(B)(C)(D) 圓形單選鈕",
    action: "點選",
    draggable: false,
    scoring: "單題計分",
    steps: [
      "閱讀題幹區的題目",
      "閱讀 (A)(B)(C)(D) 四個選項",
      "以滑鼠左鍵點選認為正確的選項"
    ]
  }
};

// ============================================================
// 2. 選擇題(複選題) (multiple) - 完整詳細版
// ============================================================
var MultipleChoiceTemplate = {
  // ----- 核心欄位 -----
  id: "M0",
  type: "multiple",
  typeLabel: "選擇題(複選題)",
  typePrefix: "M",
  text: "下列那些為職業安全衛生設施規則規定之車輛機械？",
  options: ["挖土機", "吊籠", "堆高機", "腳踏車", "捲揚機"],
  answer: [0, 2],              // 複選題答案為索引陣列
  points: "10%",
  group: 4,
  stem: "試回答下列問題：",
  imageUrl: null,

  // ----- 完整欄位 -----
  explanation: {
    summary: "職業安全衛生設施規則所稱車輛機械，包括挖土機、堆高機等。",
    detail: "吊籠屬升降機具，非車輛機械。捲揚機屬起重機具，亦非車輛機械。",
    lawRef: {
      name: "職業安全衛生設施規則",
      pcode: "N0060009",
      article: "第 6 條"
    }
  },
  law: {
    pcode: "N0060009",
    name: "職業安全衛生設施規則",
    article: {
      full: "第 6 條",
      條: "第 6 條"
    },
    summary: "車輛機械係指能自行移動或拖曳之動力機械。"
  },
  tips: {
    quick: ["💡 核心口訣：會動的、能挖的、能堆的才是車輛機械！"],
    mnemonic: "🧠 完整記憶劇本：\n【車輛機械】＝「會自己移動」的動力機械",
    commonMistake: ["🚨 陷阱：吊籠和捲揚機「不是」車輛機械！"]
  },
  logic: [{ label: "法規記憶", reason: "測驗考生對車輛機械定義的記憶與分類能力。" }],
  spec: {
    layout: "題幹區（中央） → 選項區（下方）",
    structure: ["題幹區", "選項區"],
    optionUI: "☑ (A)(B)(C)(D) 方形勾選框（全對才給分）",
    action: "勾選",
    draggable: false,
    scoring: "全對才給分",
    steps: [
      "閱讀題幹區的題目",
      "閱讀所有選項",
      "逐一點選所有認為正確的選項"
    ]
  }
};

// ============================================================
// 3. 是非題 (truefalse) - 完整詳細版
// ============================================================
var TrueFalseTemplate = {
  // ----- 核心欄位 -----
  id: "T0",
  type: "truefalse",
  typeLabel: "是非題",
  typePrefix: "T",
  text: "職業安全衛生管理都是職業安全衛生人員的責任。",
  options: ["是", "否"],       // 是非題固定為 ["是", "否"]
  answer: 1,                   // 0=是, 1=否
  points: "10%",
  group: 1,
  stem: "試回答下列問題：",
  imageUrl: null,

  // ----- 完整欄位 -----
  explanation: {
    summary: "職業安全衛生是雇主、管理人員及勞工共同的責任。",
    detail: "職業安全衛生法規定雇主負有防止職業災害之義務。",
    lawRef: {
      name: "職業安全衛生法",
      pcode: "N0010029",
      article: "第 5 條"
    }
  },
  law: {
    pcode: "N0010029",
    name: "職業安全衛生法",
    article: {
      full: "第 5 條",
      條: "第 5 條"
    },
    summary: "雇主、管理人員及勞工應共同致力於職業安全衛生之推動。"
  },
  tips: {
    quick: ["💡 核心口訣：安全衛生大家扛，不是只有一個人！"],
    mnemonic: "🧠 完整記憶劇本：\n【雇主】＝出錢出力\n【管理人員】＝規劃執行\n【勞工】＝遵守規定",
    commonMistake: ["🚨 陷阱：職業安全衛生「不是」只有職安人員的責任！"]
  },
  logic: [{ label: "法規記憶", reason: "測驗考生對職業安全衛生法第5條共同責任概念的記憶。" }],
  spec: {
    layout: "題幹區（中央） → 選項區（下方）",
    structure: ["題幹區", "選項區"],
    optionUI: "○ 是 ○ 否",
    action: "點選",
    draggable: false,
    scoring: "單題計分",
    steps: [
      "閱讀題幹區的敘述",
      "判斷敘述是否正確",
      "點選「是」或「否」"
    ]
  }
};

// ============================================================
// 4. 填空題 (fill) - 完整詳細版
// ============================================================
var FillBlankTemplate = {
  // ----- 核心欄位 -----
  id: "F0",
  type: "fill",
  typeLabel: "填空題",
  typePrefix: "F",
  text: "依勞動基準法第36條第1項規定，勞工每7日中應有A日之休息，其中B日為例假，C日為休息日。",
  options: [],                 // 填空題無選項
  answer: ["2", "1", "1"],    // 填空答案陣列（依序對應 A, B, C）
  points: "10%",
  pointsPerItem: "3.3%",      // 每個子題配分
  group: 6,
  stem: "試回答下列問題：",
  imageUrl: null,
  blanks: ["A", "B", "C"],    // 填空標記（可選，用於識別填空位置）

  // ----- 完整欄位 -----
  explanation: {
    summary: "7日內應有2日休息，其中1日例假、1日休息日。",
    detail: "勞基法第36條明定：每7日應有2日休息。",
    lawRef: {
      name: "勞動基準法",
      pcode: "N0030025",
      article: "第 36 條"
    }
  },
  law: {
    pcode: "N0030025",
    name: "勞動基準法",
    article: {
      full: "第 36 條",
      條: "第 36 條"
    },
    summary: "勞工每七日中應有二日之休息，其中一日為例假，一日為休息日。"
  },
  tips: {
    quick: ["💡 核心口訣：7日2休，1例1休"],
    mnemonic: "🧠 完整記憶劇本：\n你每7天要放2天假\n其中1天是「例假」\n另1天是「休息日」",
    commonMistake: ["🚨 陷阱：很多人以為A是「1」，正確答案是「2」！"]
  },
  logic: [{ label: "法規數字", reason: "測驗考生對勞動基準法第36條中休息日數字的記憶。" }],
  spec: {
    layout: "題幹區（上方，內嵌空白欄位） → 作答區（數字鍵盤）",
    structure: ["題幹區", "作答區"],
    optionUI: "(A) ______ (3.3%)",
    action: "數字鍵盤輸入",
    draggable: false,
    scoring: "各欄位獨立計分",
    hasNumberPad: true,
    steps: [
      "閱讀題幹區的題目",
      "點選空白欄位",
      "使用數字鍵盤輸入答案"
    ]
  }
};

// ============================================================
// 5. 計算題 (calc) - 完整詳細版
// ============================================================
var CalculationTemplate = {
  // ----- 核心欄位 -----
  id: "C0",
  type: "calc",
  typeLabel: "計算題",
  typePrefix: "C",
  text: "某勞工身高165公分，體重57公斤。其BMI為何？（四捨五入至小數點第一位）",
  options: [],
  answer: "20.9",
  points: "10%",
  group: 9,
  stem: "試回答下列問題：",
  imageUrl: null,
  formulaKey: "BMI",          // 公式代號（對應 FORMULA_MAP）
  formulaParams: {            // 公式參數
    體重: 57,
    身高: 1.65
  },

  // ----- 完整欄位 -----
  explanation: {
    summary: "BMI = 57 ÷ (1.65)² = 20.94 → 20.9",
    detail: "計算步驟：\n① 身高165cm → 1.65m\n② 1.65² = 2.7225\n③ 57 ÷ 2.7225 = 20.94",
    lawRef: {
      name: "勞工健康保護規則",
      pcode: "N0060022",
      article: "第 12 條"
    }
  },
  law: {
    pcode: "N0060022",
    name: "勞工健康保護規則",
    article: {
      full: "第 12 條",
      條: "第 12 條"
    },
    summary: "雇主應依規定辦理勞工健康檢查及健康管理。"
  },
  tips: {
    quick: ["💡 核心口訣：體重 ÷ 身高的平方"],
    mnemonic: "🧠 完整記憶劇本：\n【BMI】＝Body Mass Index\n步驟1：公分換公尺\n步驟2：身高平方\n步驟3：體重除以平方",
    commonMistake: ["🚨 陷阱：身高要換成「公尺」！"]
  },
  logic: [{ label: "計算應用", reason: "測驗考生對BMI計算公式的掌握。" }],
  spec: {
    layout: "題幹區 → 計算機區 → 答案欄位",
    structure: ["題幹區", "計算機區", "答案欄位"],
    optionUI: "______ (10%) + 計算機按鈕",
    action: "計算 + 輸入",
    draggable: false,
    scoring: "輸入正確答案即給分",
    hasNumberPad: true,
    hasCalculator: true,
    steps: [
      "閱讀題幹區的題目",
      "使用計算機運算",
      "輸入最終答案"
    ]
  }
};

// ============================================================
// 6. 配合題 (match) - 完整詳細版
// ============================================================
var MatchingTemplate = {
  // ----- 核心欄位 -----
  id: "P0",
  type: "match",
  typeLabel: "配合題",
  typePrefix: "P",
  text: "請將下列工地常見墜落地點與其對應之風險進行配對。",
  leftItems: ["施工架上", "合梯上", "開口邊緣", "屋頂", "鋼構上"],
  rightItems: [
    "墜落高度2公尺以上",
    "重心不穩易傾倒",
    "無護欄防護",
    "斜屋頂易滑落",
    "踏空風險高",
    "樓梯間",      // 干擾選項
    "電梯口"       // 干擾選項
  ],
  answer: [
    "墜落高度2公尺以上",
    "重心不穩易傾倒",
    "無護欄防護",
    "斜屋頂易滑落",
    "踏空風險高"
  ],
  points: "10%",
  pointsPerItem: "2%",
  group: 5,
  stem: "試回答下列問題：",
  imageUrl: null,

  // ----- 完整欄位 -----
  explanation: {
    summary: "工地常發生墜落之地點包括施工架上、鋼構上、合梯上、開口邊緣、屋頂。",
    detail: "平面道路、樓梯間、電梯口非墜落高風險地點，屬於干擾選項。",
    lawRef: {
      name: "營造安全衛生設施標準",
      pcode: "N0060014",
      article: "第 17 條至第 23 條"
    }
  },
  law: {
    pcode: "N0060014",
    name: "營造安全衛生設施標準",
    article: {
      full: "第 17 條至第 23 條",
      條: "第 17 條"
    },
    summary: "雇主對於高度二公尺以上之工作場所應設置防護設施。"
  },
  tips: {
    quick: ["💡 核心口訣：鋼構合梯施工架，開口屋頂都危險！"],
    mnemonic: "🧠 完整記憶劇本：\n【鋼構上】＝踩空\n【合梯上】＝重心不穩\n【施工架上】＝高度超過2公尺\n【開口邊緣】＝旁邊沒護欄\n【屋頂】＝斜的會滑",
    commonMistake: ["🚨 陷阱：平面道路、樓梯間、電梯口不是墜落高風險地點！"]
  },
  logic: [{ label: "危害辨識", reason: "測驗考生能否辨識墜落風險類型。" }],
  spec: {
    layout: "上層：題幹區 → 中層：作答區 (A)(B)(C)(D)(E) ______ (2%) → 下層：選項區（卡片）",
    structure: ["題幹區", "作答區", "選項區"],
    optionUI: "卡片形式（含干擾選項）",
    action: "拖曳",
    draggable: true,
    scoring: "各配對獨立計分",
    hasMiddleZone: true,
    hasAnswerZone: true,
    distractors: "2~4 個干擾選項",
    steps: [
      "閱讀上層題幹區的題目",
      "瀏覽下層選項區的卡片",
      "拖曳至中層作答區"
    ]
  }
};

// ============================================================
// 7. 排序題 (sequencing) - 完整詳細版
// ============================================================
var SequencingTemplate = {
  // ----- 核心欄位 -----
  id: "Q0",
  type: "sequencing",
  typeLabel: "排序題",
  typePrefix: "Q",
  text: "請依序排列我國法令位階之高低順序（由高至低）。",
  options: ["憲法", "法律", "法規命令", "行政規則", "地方法規", "自治條例"],
  answer: ["憲法", "法律", "法規命令", "行政規則"],
  points: "10%",
  pointsPerItem: "2.5%",
  group: 8,
  stem: "試回答下列問題：",
  imageUrl: null,

  // ----- 完整欄位 -----
  explanation: {
    summary: "我國法令位階：憲法 → 法律 → 法規命令 → 行政規則。",
    detail: "憲法為國家根本大法，法律不得牴觸憲法。",
    lawRef: {
      name: "中央法規標準法",
      pcode: "A0000001",
      article: "第 2 條"
    }
  },
  law: {
    pcode: "A0000001",
    name: "中央法規標準法",
    article: {
      full: "第 2 條",
      條: "第 2 條"
    },
    summary: "法律位階由高至低為憲法、法律、命令。"
  },
  tips: {
    quick: ["💡 核心口訣：憲法最大、法律次之、命令第三、規則最小"],
    mnemonic: "🧠 完整記憶劇本：\n【憲法】＝國家根本大法\n【法律】＝立法院通過\n【法規命令】＝須有法律授權\n【行政規則】＝內部使用",
    commonMistake: ["🚨 陷阱：法規命令「有」法律授權，行政規則「沒有」！"]
  },
  logic: [{ label: "法規記憶", reason: "測驗考生對法令位階順序的記憶。" }],
  spec: {
    layout: "上層：題幹區 → 中層：作答區 1. 2. 3. 4. ______ (2.5%) → 下層：選項區（卡片）",
    structure: ["題幹區", "作答區", "選項區"],
    optionUI: "卡片形式（含干擾選項）",
    action: "拖曳",
    draggable: true,
    scoring: "全對才給分",
    hasMiddleZone: true,
    hasAnswerZone: true,
    distractors: "1~2 個干擾選項",
    steps: [
      "閱讀上層題幹區的題目",
      "瀏覽下層選項區的卡片",
      "拖曳至中層作答區排列"
    ]
  }
};

// ============================================================
// 8. 連連看 (link) - 完整詳細版
// ============================================================
var LinkingTemplate = {
  // ----- 核心欄位 -----
  id: "L0",
  type: "link",
  typeLabel: "連連看",
  typePrefix: "L",
  text: "請將左側法規名稱與右側其對應之主管機關進行配對。",
  pairs: [
    { left: "職業安全衛生法", right: "勞動部" },
    { left: "工廠管理輔導法", right: "經濟部" },
    { left: "空氣污染防制法", right: "環境部" },
    { left: "消防法", right: "內政部" }
  ],
  answer: ["勞動部", "經濟部", "環境部", "內政部"],
  points: "10%",
  pointsPerItem: "2.5%",
  group: 7,
  stem: "試回答下列問題：",
  imageUrl: null,

  // ----- 完整欄位 -----
  explanation: {
    summary: "職安法→勞動部；工廠管理輔導法→經濟部；空污法→環境部；消防法→內政部。",
    detail: "各法規對應之主管機關如上。",
    lawRef: {
      name: "職業安全衛生法",
      pcode: "N0010029",
      article: "第 4 條"
    }
  },
  law: {
    pcode: "N0010029",
    name: "職業安全衛生法",
    article: {
      full: "第 4 條",
      條: "第 4 條"
    },
    summary: "職業安全衛生法之主管機關為勞動部。"
  },
  tips: {
    quick: ["💡 核心口訣：職安找勞動、工廠找經濟、空污找環境、消防找內政"],
    mnemonic: "🧠 完整記憶劇本：\n【職業安全衛生法】→勞動部\n【工廠管理輔導法】→經濟部\n【空氣污染防制法】→環境部\n【消防法】→內政部",
    commonMistake: ["🚨 陷阱：消防法的主管機關是「內政部」，不是「環境部」！"]
  },
  logic: [{ label: "法規記憶", reason: "測驗考生對各法規主管機關的記憶與配對能力。" }],
  spec: {
    layout: "左欄：題幹項目 → 右欄：答案項目",
    structure: ["左欄（題幹）", "右欄（答案）"],
    optionUI: "點選連線",
    action: "點選左欄 → 點選右欄配對",
    draggable: false,
    scoring: "所有連線完全正確才給分",
    steps: [
      "閱讀左欄與右欄的所有項目",
      "點選左欄項目",
      "點選右欄對應答案"
    ]
  }
};

// ============================================================
// 9. 8 大題型總表
// ============================================================
var QUESTION_TYPES = {
  single: SingleChoiceTemplate,
  multiple: MultipleChoiceTemplate,
  truefalse: TrueFalseTemplate,
  fill: FillBlankTemplate,
  calc: CalculationTemplate,
  match: MatchingTemplate,
  sequencing: SequencingTemplate,
  link: LinkingTemplate
};

var TYPE_LIST = [
  { type: "single", label: "選擇題(單選題)", icon: "fa-circle" },
  { type: "multiple", label: "選擇題(複選題)", icon: "fa-check-square" },
  { type: "truefalse", label: "是非題", icon: "fa-question-circle" },
  { type: "fill", label: "填空題", icon: "fa-pencil" },
  { type: "calc", label: "計算題", icon: "fa-calculator" },
  { type: "match", label: "配合題", icon: "fa-link" },
  { type: "sequencing", label: "排序題", icon: "fa-arrows-alt-v" },
  { type: "link", label: "連連看", icon: "fa-chain" }
];

var LOGIC_TAGS = [
  { id: "法規數字", label: "法規數字", emoji: "🟢", color: "#2ecc71" },
  { id: "法規記憶", label: "法規記憶", emoji: "🟢", color: "#27ae60" },
  { id: "法規理解", label: "法規理解", emoji: "🟡", color: "#f1c40f" },
  { id: "危害辨識", label: "危害辨識", emoji: "🟠", color: "#f39c12" },
  { id: "計算應用", label: "計算應用", emoji: "🔴", color: "#e74c3c" },
  { id: "流程操作", label: "流程操作", emoji: "🟣", color: "#9b59b6" }
];

// ============================================================
// 10. 雙模式欄位對照表
// ============================================================
var FIELD_MAPPING = {
  description: "本對照表說明「完整詳細版」與「精簡核心版」的欄位差異",
  
  // 核心欄位（兩種模式都必須有）
  core: {
    common: ['id', 'type', 'typeLabel', 'typePrefix', 'text', 'answer', 'points', 'group', 'stem', 'imageUrl', 'law'],
    description: "所有題型共用的核心欄位",
    single: { fields: ['options'], description: "單選題專用" },
    multiple: { fields: ['options'], description: "複選題專用" },
    truefalse: { fields: ['options'], description: "是非題專用" },
    fill: { fields: ['blanks'], description: "填空題專用" },
    calc: { fields: ['formulaKey', 'formulaParams'], description: "計算題專用" },
    match: { fields: ['leftItems', 'rightItems'], description: "配合題專用" },
    sequencing: { fields: ['options'], description: "排序題專用" },
    link: { fields: ['pairs'], description: "連連看專用" }
  },
  
  // 完整欄位（完整詳細版儲存；精簡版由智慧引擎生成）
  full: {
    explanation: {
      fields: ['summary', 'detail', 'lawRef'],
      generator: '14_解析_主引擎.js → generateExplanation()',
      description: '解析摘要與詳細說明'
    },
    tips: {
      fields: ['quick', 'mnemonic', 'commonMistake'],
      generator: '14_解析_主引擎.js → generateTips()',
      description: '答題秘訣（口訣、記憶劇本、常見陷阱）'
    },
    logic: {
      fields: ['label', 'reason'],
      generator: '14_解析_主引擎.js → generateLogic()',
      description: '邏輯標籤（法規數字/記憶/理解、危害辨識、計算應用、流程操作）'
    },
    spec: {
      fields: ['layout', 'structure', 'optionUI', 'action', 'draggable', 'scoring', 'steps'],
      generator: '14_解析_主引擎.js → getTypeSpec(type)',
      description: 'UI 規格模板（佈局、操作方式、計分方式、步驟說明）'
    },
    pointsPerItem: {
      generator: '依 answer 陣列長度自動計算',
      description: '子題配分（多子題時使用）'
    }
  }
};

// ============================================================
// 11. 匯出到全域
// ============================================================

if (typeof window !== "undefined") {
  window.SingleChoiceTemplate = SingleChoiceTemplate;
  window.MultipleChoiceTemplate = MultipleChoiceTemplate;
  window.TrueFalseTemplate = TrueFalseTemplate;
  window.FillBlankTemplate = FillBlankTemplate;
  window.CalculationTemplate = CalculationTemplate;
  window.MatchingTemplate = MatchingTemplate;
  window.SequencingTemplate = SequencingTemplate;
  window.LinkingTemplate = LinkingTemplate;
  window.QUESTION_TYPES = QUESTION_TYPES;
  window.TYPE_LIST = TYPE_LIST;
  window.LOGIC_TAGS = LOGIC_TAGS;
  window.FIELD_MAPPING = FIELD_MAPPING;
  window.TypeFormat = window.TypeFormat || {};
}

console.log("✅ 00_題型格式規範 v10.2.0-DETAILED 已載入");
console.log("📋 支援題型：選擇題(單選題)、選擇題(複選題)、是非題、填空題、計算題、配合題、排序題、連連看");
console.log("📌 雙模式支援：完整詳細版（儲存所有欄位） + 精簡核心版（僅核心欄位，其餘由智慧引擎生成）");
console.log("");
console.log("📊 核心欄位數：", Object.keys(FIELD_MAPPING.core.common).length + 5, "個");
console.log("🧠 智慧引擎生成欄位：", Object.keys(FIELD_MAPPING.full).length, "組");
console.log("📋 8 大題型完整範本已載入");