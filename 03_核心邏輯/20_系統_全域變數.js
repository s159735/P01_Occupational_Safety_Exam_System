// ============================================================
// 🌐 系統_全域變數 v10.2.0
// 職責：全域變數定義
// 區塊：C（20~29）
// 編號：20
// 更新日期：2026-07-19
// 版本：10.2.0
// 修復：術科測試編號改為 115N + 年月日時分（無秒）
// ============================================================

console.log('🌐 20_系統_全域變數 v10.2.0 載入中...');

// ============================================================
// 1. 核心變數 (使用 G_ 前綴避免衝突)
// ============================================================

// 題目資料
var G_questionData = [];
var G_totalQuestions = 0;
var G_currentQuestionIndex = 0;

// 答案管理
var G_userAnswers = {};
var G_markedQuestions = {};

// 系統狀態
var G_isLoading = true;
var G_countdownSeconds = 7200;
var G_topRowsHidden = false;
var G_currentMode = 'academic';

// ============================================================
// 2. API 設定（從統一設定讀取，支援向後相容）
// ============================================================

var G_API_BASE = (function() {
    if (typeof window.API_CONFIG !== 'undefined' && window.API_CONFIG) {
        return window.API_CONFIG.baseURL || 'http://localhost:8001/api';
    }
    if (typeof window.API_BASE_URL !== 'undefined' && window.API_BASE_URL) {
        return window.API_BASE_URL;
    }
    console.warn('⚠️ 無法從統一設定取得 API 網址，使用備用值');
    return 'http://localhost:8001/api';
})();

if (typeof window.API_BASE_URL === 'undefined' || window.API_BASE_URL !== G_API_BASE) {
    window.API_BASE_URL = G_API_BASE;
}

// ============================================================
// 3. 考試日期（固定）
// ============================================================

var G_EXAM_DATE = new Date(2026, 7, 7, 7, 30, 0);
var G_examDate = G_EXAM_DATE.toISOString().slice(0, 10);

// ============================================================
// 4. 術科測試編號（115N + 年月日時分）
// ============================================================

function generateExamNumber() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    return '115N' + year + month + day + hours + minutes;
}

// 從 localStorage 讀取或產生新編號
var savedExamNumber = null;
try {
    savedExamNumber = localStorage.getItem('exam_number');
} catch (e) {}

var G_examNumber = savedExamNumber || generateExamNumber();

// 儲存到 localStorage
try {
    localStorage.setItem('exam_number', G_examNumber);
} catch (e) {}

// ============================================================
// 5. 別名（相容性）
// ============================================================

var G_currentIndex = G_currentQuestionIndex;
var G_examMode = G_currentMode;

// ============================================================
// 6. 圖片根目錄
// ============================================================

var G_IMAGE_BASE = '../01_前端資源/06_題庫圖片/';

// ============================================================
// 7. 邏輯標籤配置
// ============================================================

var LOGIC_CONFIG = {
    "法規數字": { color: "#2ecc71", strategy: "數字口訣 + 反覆背誦", emoji: "🟢" },
    "法規記憶": { color: "#27ae60", strategy: "口訣記憶 + 關鍵字串聯", emoji: "🟢" },
    "法規理解": { color: "#f1c40f", strategy: "對比理解 + 立法精神", emoji: "🟡" },
    "危害辨識": { color: "#f39c12", strategy: "危害→物質 配對記憶", emoji: "🟠" },
    "計算應用": { color: "#e74c3c", strategy: "先寫公式 → 代入數值 → 注意單位", emoji: "🔴" },
    "流程操作": { color: "#9b59b6", strategy: "步驟分解 → 順序排列 → 口訣輔助", emoji: "🟣" }
};

// ============================================================
// 8. 公式對應表（30+ 種）
// ============================================================

var FORMULA_MAP = {
    // ===== 職災統計 =====
    "FR": { display: "FR = 失能傷害人次數 × 10⁶ / 總經歷工時", desc: "失能傷害頻率", params: ["失能傷害人次數", "總經歷工時"] },
    "SR": { display: "SR = 總損失日數 × 10⁶ / 總經歷工時", desc: "失能傷害嚴重率", params: ["總損失日數", "總經歷工時"] },
    "FSI": { display: "FSI = √(FR × SR / 1000)", desc: "總合傷害指數", params: ["FR", "SR"] },
    "死亡千年人率": { display: "死亡千年人率 = (死亡人數 × 1000) / 平均勞工人數", desc: "死亡千年人率", params: ["死亡人數", "平均勞工人數"] },

    // ===== 物理性危害 - 噪音 =====
    "NOISE_DOSE": { display: "D = Σ(ti / Ti)", desc: "噪音劑量", params: ["各音壓級暴露時間", "對應容許暴露時間"], note: "D > 1 即超出容許暴露劑量" },
    "NOISE_TWA": { display: "LTWA = 16.61 × log(100×D/(12.5×t)) + 90", desc: "噪音8小時時量平均音壓級", params: ["噪音劑量D", "總工作暴露時間t"] },
    "NOISE_TWA_SIMPLE": { display: "LTWA = 16.61 × log(D) + 90", desc: "噪音8小時時量平均（簡化版）", params: ["噪音劑量D"] },
    "容許暴露時間": { display: "T = 8 / 2^((L-90)/5)", desc: "噪音容許暴露時間", params: ["噪音音壓級L"], note: "每增加5分貝，容許時間減半" },

    // ===== 物理性危害 - 溫濕環境 =====
    "BMI": { display: "BMI = 體重(kg) / 身高(m)²", desc: "身體質量指數", params: ["體重", "身高"], note: "身高須換算為公尺（cm ÷ 100）" },
    "WBGT_OUT": { display: "WBGT = 0.7×Tnwb + 0.2×Tgb + 0.1×Tdb", desc: "綜合溫度熱指數（戶外有日曬）", params: ["自然濕球溫度", "黑球溫度", "乾球溫度"] },
    "WBGT_IN": { display: "WBGT = 0.7×Tnwb + 0.3×Tgb", desc: "綜合溫度熱指數（戶內/戶外無日曬）", params: ["自然濕球溫度", "黑球溫度"] },
    "WBGT_AVG": { display: "WBGT_avg = Σ(WBGTᵢ × tᵢ) / Σtᵢ", desc: "綜合溫度熱指數（時量平均）", params: ["各WBGT值", "對應時間"] },
    "WBGT_WEIGHTED": { display: "WBGT_avg = (WBGT₁×1 + WBGT₂×2 + WBGT₃×1) / 4", desc: "綜合溫度熱指數（加權平均 1:2:1）", params: ["頭部WBGT", "腹部WBGT", "腳踝WBGT"] },

    // ===== 物理性危害 - 照度 =====
    "LUX_4": { display: "Ē = (1/4) × ΣEᵢ", desc: "平均照度（四點法）", params: ["各點照度值"] },
    "LUX_5": { display: "Ē = (1/6) × (ΣEᵢ + 2Eg)", desc: "平均照度（五點法）", params: ["各點照度值", "中心點照度"] },

    // ===== 機械安全 =====
    "GRINDING": { display: "V = π × D × N", desc: "研磨輪周速度", params: ["直徑D（公尺）", "轉速N（rpm）"], note: "D 須換算為公尺（mm ÷ 1000）" },
    "GRINDING_TEST": { display: "V_test = V × 1.5", desc: "研磨輪最高測試周速度", params: ["最高使用周速度V"] },

    // ===== 通風換氣 =====
    "VENT_1": { display: "Q = W × 0.3", desc: "第一種有機溶劑換氣量", params: ["每小時消費量W（g/hr）"] },
    "VENT_2": { display: "Q = W × 0.04", desc: "第二種有機溶劑換氣量", params: ["每小時消費量W（g/hr）"] },
    "VENT_3": { display: "Q = W × 0.01", desc: "第三種有機溶劑換氣量", params: ["每小時消費量W（g/hr）"] },
    "VENT_CONSUMPTION_1": { display: "容許消費量 = (1/15) × V", desc: "第一種有機溶劑容許消費量", params: ["作業場所氣積V"] },
    "VENT_CONSUMPTION_2": { display: "容許消費量 = (2/5) × V", desc: "第二種有機溶劑容許消費量", params: ["作業場所氣積V"] },
    "VENT_CONSUMPTION_3": { display: "容許消費量 = (3/2) × V", desc: "第三種有機溶劑容許消費量", params: ["作業場所氣積V"] },
    "CO2_VENT": { display: "Q = G × 10⁶ / (C - C₀)", desc: "二氧化碳換氣量", params: ["CO₂產生率G", "容許濃度C", "戶外濃度C₀"] },

    // ===== 電氣安全 =====
    "OHM": { display: "I = V / R", desc: "歐姆定律（電流）", params: ["電壓V", "電阻R"] },
    "POWER": { display: "P = I × V", desc: "電功率（瓦特）", params: ["電流I", "電壓V"] },
    "POWER_ALT": { display: "P = V² / R = I² × R", desc: "電功率（替代公式）", params: ["電壓V", "電阻R"] },
    "ENERGY": { display: "E = P × t / 1000", desc: "消耗度數（kWh）", params: ["功率P（瓦特）", "時間t（小時）"] },

    // ===== 氣體定律 =====
    "GAS_LAW": { display: "P₁/T₁ = P₂/T₂", desc: "定容查理定律", params: ["壓力P₁", "溫度T₁", "壓力P₂", "溫度T₂"], note: "須使用絕對溫度（K = °C + 273.15）" },
    "DILUTION": { display: "C = C₀ × e^(-Q/V × t)", desc: "通風稀釋（指數衰減）", params: ["初始濃度C₀", "換氣量Q", "空間體積V", "時間t"] },
    "DYNAMIC_PRESSURE": { display: "V = 4.04 × √Pv", desc: "動壓轉風速", params: ["動壓Pv"] },
    "AIR_FLOW": { display: "Q = V × A", desc: "風量計算", params: ["風速V", "截面積A"] },

    // ===== 危險度 =====
    "HAZARD_INDEX": { display: "危險度 = (UEL - LEL) / LEL", desc: "火災爆炸危險度指數", params: ["爆炸上限UEL", "爆炸下限LEL"] },

    // ===== 濃度換算 =====
    "PPM_TO_MG": { display: "mg/m³ = ppm × 分子量 / 24.45", desc: "ppm 換算 mg/m³", params: ["ppm濃度", "分子量"], note: "25°C 一大氣壓下莫耳體積 24.45 L" },
    "MG_TO_PPM": { display: "ppm = mg/m³ × 24.45 / 分子量", desc: "mg/m³ 換算 ppm", params: ["mg/m³濃度", "分子量"] },

    // ===== 過濾效率 =====
    "FILTER_EFFICIENCY": { display: "總效率 = 1 - Π(1 - ηᵢ)", desc: "多層過濾總效率", params: ["各層過濾效率ηᵢ"] },

    // ===== 容量計算 =====
    "STORAGE_CAPACITY": { display: "W = 0.9 × ρ × V", desc: "液化氣體儲存能力", params: ["比重ρ", "內容積V"] },
    "COOLING_CAPACITY": { display: "RT = 功率(kW) / 1.2", desc: "冷凍能力（公噸）", params: ["功率（kW）"] },
};

// ============================================================
// 9. 註冊到全域
// ============================================================

window.G_questionData = G_questionData;
window.G_totalQuestions = G_totalQuestions;
window.G_currentQuestionIndex = G_currentQuestionIndex;
window.G_userAnswers = G_userAnswers;
window.G_markedQuestions = G_markedQuestions;
window.G_API_BASE = G_API_BASE;
window.G_EXAM_DATE = G_EXAM_DATE;
window.G_IMAGE_BASE = G_IMAGE_BASE;
window.G_examNumber = G_examNumber;
window.LOGIC_CONFIG = LOGIC_CONFIG;
window.FORMULA_MAP = FORMULA_MAP;

console.log('✅ 20_系統_全域變數 v10.2.0 已載入');
console.log('   📡 API 網址:', G_API_BASE);
console.log('   📊 變數: G_questionData, G_userAnswers');
console.log('   📐 公式對應表: ' + Object.keys(FORMULA_MAP).length + ' 種');
console.log('   🏷️ 邏輯標籤: ' + Object.keys(LOGIC_CONFIG).length + ' 種');
console.log('   🆕 術科測試編號:', G_examNumber);