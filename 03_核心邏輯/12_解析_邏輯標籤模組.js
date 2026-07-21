// ============================================================
// 🏷️ 解析_邏輯標籤模組 v10.2.0
// 職責：邏輯標籤渲染與策略說明
// 更新日期：2026-07-17
// ============================================================

console.log('🏷️ 12_解析_邏輯標籤模組 v10.2.0 載入中...');

(function() {
    "use strict";
    
    // ============================================================
    // 1. 邏輯標籤 → 題型對應
    // ============================================================
    var LOGIC_TO_TYPE = {
        "法規數字": { types: ["single", "truefalse"], desc: "數字口訣 + 反覆背誦" },
        "法規記憶": { types: ["single", "multiple"], desc: "口訣記憶 + 關鍵字串聯" },
        "法規理解": { types: ["single", "truefalse"], desc: "對比理解 + 立法精神" },
        "危害辨識": { types: ["match", "link"], desc: "危害→物質 配對記憶" },
        "計算應用": { types: ["calc"], desc: "先寫公式 → 代入數值 → 注意單位" },
        "流程操作": { types: ["sequencing"], desc: "步驟分解 → 順序排列 → 口訣輔助" }
    };
    
    // ============================================================
    // 2. 邏輯標籤策略配置
    // ============================================================
    var LogicTagModule = {
        logicStrategies: {
            "法規數字": { 
                color: "#2ecc71", 
                emoji: "🟢", 
                strategy: "數字口訣 + 反覆背誦", 
                tip: "記住數字就記住法條！",
                examples: ["天數", "人數", "距離", "濃度", "高度", "深度"]
            },
            "法規記憶": { 
                color: "#27ae60", 
                emoji: "🟢", 
                strategy: "口訣記憶 + 關鍵字串聯", 
                tip: "用關鍵字串聯法條內容！",
                examples: ["法條內容", "定義", "分類"]
            },
            "法規理解": { 
                color: "#f1c40f", 
                emoji: "🟡", 
                strategy: "對比理解 + 立法精神", 
                tip: "理解立法目的，而不是死背！",
                examples: ["立法精神", "原則", "例外"]
            },
            "危害辨識": { 
                color: "#f39c12", 
                emoji: "🟠", 
                strategy: "危害→物質 配對記憶", 
                tip: "先辨識危害類型，再對應防護措施！",
                examples: ["GHS圖式", "危害分類", "物質特性"]
            },
            "計算應用": { 
                color: "#e74c3c", 
                emoji: "🔴", 
                strategy: "先寫公式 → 代入數值 → 注意單位", 
                tip: "公式先寫出來，再一步步代入！",
                examples: ["BMI", "WBGT", "FR", "SR", "換氣量"]
            },
            "流程操作": { 
                color: "#9b59b6", 
                emoji: "🟣", 
                strategy: "步驟分解 → 順序排列 → 口訣輔助", 
                tip: "把大流程拆成小步驟！",
                examples: ["作業步驟", "急救流程", "安全程序"]
            }
        },
        
        // ============================================================
        // 3. 渲染邏輯標籤
        // ============================================================
        renderLogicTags: function(logicTags) {
            if (!logicTags || !Array.isArray(logicTags) || logicTags.length === 0) {
                return '<span style="color:#999;font-size:14px;">無邏輯標籤</span>';
            }
            
            var self = this;
            return logicTags.map(function(tag) {
                var tagName = typeof tag === "string" ? tag : (tag.label || "未知");
                var cfg = self.logicStrategies[tagName];
                if (!cfg) {
                    return "<span class=\"logic-tag\" style=\"display:inline-block;padding:2px 12px;margin:2px 4px;border-radius:12px;font-size:13px;font-weight:500;background:#f0f0f0;border:1px solid #ccc;color:#333;\">🏷️ " + tagName + "</span>";
                }
                var color = cfg.color;
                var emoji = cfg.emoji;
                return "<span class=\"logic-tag\" style=\"display:inline-block;padding:2px 14px;margin:2px 4px;border-radius:20px;font-size:14px;font-weight:600;background:" + color + "25;border:2px solid " + color + ";color:" + color + ";box-shadow:0 1px 3px rgba(0,0,0,0.08);\">" + emoji + " " + tagName + "</span>";
            }).join(" ");
        },
        
        // ============================================================
        // 4. 渲染邏輯標籤（含策略說明）
        // ============================================================
        renderLogicTagsWithStrategy: function(logicTags) {
            if (!logicTags || !Array.isArray(logicTags) || logicTags.length === 0) {
                return '<span style="color:#999;font-size:14px;">無邏輯標籤</span>';
            }
            
            var self = this;
            var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">';
            html += logicTags.map(function(tag) {
                var tagName = typeof tag === "string" ? tag : (tag.label || "未知");
                var cfg = self.logicStrategies[tagName];
                if (!cfg) {
                    return "<span style=\"display:inline-block;padding:2px 12px;margin:2px 4px;border-radius:12px;font-size:13px;font-weight:500;background:#f0f0f0;border:1px solid #ccc;color:#333;\">🏷️ " + tagName + "</span>";
                }
                var color = cfg.color;
                var emoji = cfg.emoji;
                var strategy = cfg.strategy;
                var tip = cfg.tip;
                return "<span class=\"logic-tag\" style=\"display:inline-block;padding:4px 16px;margin:2px 4px;border-radius:20px;font-size:14px;font-weight:600;background:" + color + "25;border:2px solid " + color + ";color:" + color + ";box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:help;\" title=\"" + strategy + " | " + tip + "\">" + emoji + " " + tagName + "</span>";
            }).join("");
            html += '</div>';
            return html;
        },
        
        // ============================================================
        // 5. 取得策略
        // ============================================================
        getStrategy: function(tagName) { 
            return this.logicStrategies[tagName] || null; 
        },
        
        // ============================================================
        // 6. 取得支援的標籤列表
        // ============================================================
        getSupportedTags: function() { 
            return Object.keys(this.logicStrategies); 
        },
        
        // ============================================================
        // 7. 根據題型推薦邏輯標籤
        // ============================================================
        recommendTags: function(type) {
            var result = [];
            for (var key in LOGIC_TO_TYPE) {
                if (LOGIC_TO_TYPE[key].types.indexOf(type) !== -1) {
                    result.push(key);
                }
            }
            return result;
        }
    };
    
    // ============================================================
    // 8. 匯出到全域
    // ============================================================
    window.LogicTagModule = LogicTagModule;
    window.LOGIC_TO_TYPE = LOGIC_TO_TYPE;
    window.renderLogicTags = LogicTagModule.renderLogicTags;
    window.renderLogicTagsWithStrategy = LogicTagModule.renderLogicTagsWithStrategy;
    
    console.log("✅ 12_解析_邏輯標籤模組 v10.2.0 已載入");
    console.log("   🏷️ 支援 " + Object.keys(LogicTagModule.logicStrategies).length + " 種邏輯標籤");
    console.log("   📋 對應 " + Object.keys(LOGIC_TO_TYPE).length + " 種題型");
})();