#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
強化解析生成腳本 v1.0
功能：
  1. 將 FORMULA_MAP 整合到解析生成邏輯
  2. 強化 11_解析_秘訣生成模組.js 中的 autoGenerateReason()
  3. 新增常見錯誤自動生成邏輯
"""

import re
from pathlib import Path

# ============================================================
# 設定區
# ============================================================

PROJECT_ROOT = Path(__file__).parent.parent
TARGET_FILE = PROJECT_ROOT / '03_核心邏輯/11_解析_秘訣生成模組.js'

# ============================================================
# 新增/強化的程式碼片段
# ============================================================

# 1. 新增：從 FORMULA_MAP 取得公式顯示
NEW_FORMULA_LOOKUP = '''

    // ============================================================
    // 從 FORMULA_MAP 取得公式顯示（整合 20_系統_全域變數.js）
    // ============================================================
    getFormulaDisplay: function(formulaKey) {
        if (typeof window.FORMULA_MAP !== 'undefined' && window.FORMULA_MAP[formulaKey]) {
            var formula = window.FORMULA_MAP[formulaKey];
            var display = formula.display || formulaKey;
            var desc = formula.desc || '';
            var note = formula.note || '';
            var result = '📐 ' + display;
            if (desc) result += '（' + desc + '）';
            if (note) result += '\\n💡 ' + note;
            return result;
        }
        return null;
    },

    // ============================================================
    // 強化版：自動生成原因（整合 FORMULA_MAP）
    // ============================================================
    autoGenerateReasonEnhanced: function(q) {
        var text = q.text || '';
        var type = q.type || '';
        var lawName = q.law ? q.law.name : '';
        var logicTags = q.logic || [];
        var formulaKey = q.formulaKey || '';
        var answer = q.answer || '';
        var options = q.options || [];

        // ===== 1. 如果是計算題且有 formulaKey =====
        if (type === 'calc' && formulaKey) {
            var formulaDisplay = this.getFormulaDisplay(formulaKey);
            if (formulaDisplay) {
                var result = '🤔 這題需要使用公式進行計算。\\n\\n📐 ' + formulaDisplay;
                if (answer) {
                    result += '\\n\\n✅ 計算結果為：' + answer;
                }
                return result;
            }
        }

        // ===== 2. 如果是計算題（無 formulaKey） =====
        if (type === 'calc') {
            return '🤔 計算題的關鍵是：①先寫出正確的公式 ②代入數值時注意單位換算 ③最後四捨五入到指定小數位數。公式寫對，分數就拿到一半了！';
        }

        // ===== 3. 流程操作題 =====
        if (type === 'sequencing' || text.match(/順序|步驟|先後|排列|流程/)) {
            var steps = q.answer || [];
            if (Array.isArray(steps) && steps.length > 0) {
                var orderText = steps.join(' → ');
                return '🤔 這題考的是正確的作業順序。正確順序是：' + orderText + '。\\n\\n💡 為什麼這樣排？因為每個步驟之間有嚴格的邏輯關係，順序錯了可能導致安全風險！';
            }
            return '🤔 順序題要記住「先後邏輯」，建議用口訣把順序串聯起來。';
        }

        // ===== 4. 局限空間 =====
        if (text.match(/局限空間|缺氧|通風|氣體測定|進入許可/)) {
            return '🤔 局限空間作業的正確順序是：測定→通風→許可→監視→進入。\\n\\n💡 為什麼這樣排？因為要先確認環境安全（測定、通風），再申請行政許可，最後才進入作業。這是為了確保人員安全，順序錯了可能導致缺氧或中毒事故！';
        }

        // ===== 5. 墜落防護 =====
        if (text.match(/墜落|護欄|安全網|安全帶|防墜/)) {
            return '🤔 墜落防護措施的優先順序是：先從「源頭消除危害」開始（在地面作業），再依序使用護欄、安全網、安全帶。\\n\\n💡 為什麼這樣排？因為越前面的措施越能「主動」預防墜落，越後面則是「被動」防護，效果也越差。';
        }

        // ===== 6. 教育訓練 =====
        if (text.match(/教育訓練|時數|在職訓練|新僱|業務主管|急救人員/)) {
            return '🤔 這題考的是職業安全衛生教育訓練規則中，不同人員類別的訓練時數要求。\\n\\n💡 重點是記住：新僱勞工至少3小時、業務主管每2年6小時、急救人員每3年12小時、一般勞工每3年3小時。這些時數規定是為了確保不同層級人員都具備足夠的安全衛生知識。';
        }

        // ===== 7. 邏輯標籤導向 =====
        if (logicTags.indexOf('計算應用') !== -1) {
            return '🤔 計算題的關鍵是：①先寫出正確的公式 ②代入數值時注意單位換算 ③最後四捨五入到指定小數位數。公式寫對，分數就拿到一半了！';
        }

        if (logicTags.indexOf('流程操作') !== -1) {
            return '🤔 流程操作題要記住「先後順序」！順序錯了整個流程就會出錯。建議用口訣或編號來輔助記憶，把複雜流程拆成小步驟。';
        }

        if (logicTags.indexOf('危害辨識') !== -1) {
            return '🤔 危害辨識要建立「危害類型 → 防護措施」的對應關係。先辨識出是什麼危害，才能選擇正確的防護方式，這是職業安全的基本原則。';
        }

        if (logicTags.indexOf('法規數字') !== -1) {
            if (lawName) {
                return '🤔 這題考的是「' + lawName + '」中的關鍵數字。法規中的數字（天數、人數、距離、濃度等）通常是考試重點，記住數字就能掌握法條的核心要件。';
            }
            return '🤔 法規題常考關鍵數字（天數、人數、距離、濃度等），這些數字通常是法條的核心要件，記住就能快速判斷對錯。';
        }

        if (logicTags.indexOf('法規記憶') !== -1 || logicTags.indexOf('法規理解') !== -1) {
            if (lawName) {
                return '🤔 這題考的是「' + lawName + '」的規定。理解法條背後的「立法精神」比死背法條文字更重要，因為考題常會換句話說來測試你是否真正理解。';
            }
            return '🤔 法規題要理解「立法精神」而不是死背法條文字。考題常會換句話說，真正理解才能正確判斷。';
        }

        // ===== 8. 依題型預設 =====
        var typeMessages = {
            'single': '🤔 單選題只有一個正確答案，要學會分辨「正確」與「最正確」的差異。其他選項通常是常見的錯誤觀念或陷阱。',
            'multiple': '🤔 複選題要選出「所有」正確的選項，漏選或錯選都不給分。建議用「排除法」先刪除確定錯誤的選項，再從剩下的選項中挑選正確的。',
            'truefalse': '🤔 是非題的關鍵是「完全正確」才對。只要題幹中有一個細節不符合法規規定，整題就是錯的。',
            'fill': '🤔 填空題要填入最精確的關鍵字，通常是法條中的數字（天數、人數）或專有名詞。填錯一個字就錯，所以精確度很重要。',
            'match': '🤔 配合題要建立「左欄→右欄」的正確對應關係。建議先確認左欄項目的順序，再逐一找出對應的右欄答案。',
            'link': '🤔 連連看要建立「左欄→右欄」的正確配對。建議先確認左欄項目的順序，再逐一找出對應的右欄答案。',
        };

        if (typeMessages[type]) {
            return typeMessages[type];
        }

        if (lawName) {
            return '🤔 這題與「' + lawName + '」有關，理解法條背後的立法精神比死背法條文字更重要。';
        }

        return '🤔 理解題目背後的邏輯和原理，是正確答題的關鍵。不要只背答案，要理解「為什麼」。';
    },
'''

# 2. 修改 autoGenerateTips 函數（強化版）
NEW_AUTO_TIPS = '''

    // ============================================================
    // 強化版：自動生成提示（整合 FORMULA_MAP）
    // ============================================================
    autoGenerateTipsEnhanced: function(q) {
        var html = '';
        var type = q.type || '';
        var answer = q.answer;
        var options = q.options || [];
        var labelMap = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        var formulaKey = q.formulaKey || '';

        // ===== 1. 計算題：顯示公式 =====
        if (type === 'calc' && formulaKey) {
            var formulaDisplay = this.getFormulaDisplay(formulaKey);
            if (formulaDisplay) {
                html += '<div style="padding:6px 12px;background:#e3f2fd;border-radius:4px;border-left:3px solid #0d47a1;margin-bottom:4px;">';
                html += '📐 <strong>公式：</strong>' + formulaDisplay;
                html += '</div>';
                return html;
            }
        }

        // ===== 2. 單選題 =====
        if (type === 'single' || type === 'choice') {
            if (typeof answer === 'number' && options[answer] !== undefined) {
                var label = labelMap[answer] || (parseInt(answer) + 1);
                html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
                html += '✅ 正確解答：<strong>' + label + '. ' + options[answer] + '</strong>';
                html += '</div>';
                return html;
            }
        }

        // ===== 3. 複選題 =====
        if (type === 'multiple') {
            if (Array.isArray(answer)) {
                var answerLabels = [];
                answer.forEach(function(idx) {
                    var i = parseInt(idx);
                    if (!isNaN(i) && options[i] !== undefined) {
                        var label = labelMap[i] || (i + 1);
                        answerLabels.push(label + '. ' + options[i]);
                    }
                });
                if (answerLabels.length > 0) {
                    html += '<div style="padding:8px 14px;background:#e8f5e9;border-radius:6px;border-left:4px solid #2e7d32;margin-bottom:4px;">';
                    html += '✅ 正確解答：<br>';
                    answerLabels.forEach(function(label) {
                        html += '&nbsp;&nbsp;• ' + label + '<br>';
                    });
                    html += '</div>';
                    return html;
                }
            }
        }

        // ===== 4. 是非題 =====
        if (type === 'truefalse') {
            var isTrue = answer === 0 || answer === true || answer === 'true' || answer === '是';
            html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
            html += '✅ 正確解答：<strong>' + (isTrue ? '是（正確）' : '否（錯誤）') + '</strong>';
            html += '</div>';
            return html;
        }

        // ===== 5. 填充題 =====
        if (type === 'fill') {
            if (answer) {
                var fillLabelMap = ['(A)', '(B)', '(C)', '(D)', '(E)', '(F)', '(G)', '(H)'];
                if (typeof answer === 'string' && (answer.indexOf(',') !== -1 || answer.indexOf('、') !== -1)) {
                    var parts = answer.split(/[,，、\s]+/).filter(function(s) { return s && s.trim() !== ''; });
                    if (parts.length > 0) {
                        html += '<div style="padding:8px 14px;background:#e8f5e9;border-radius:6px;border-left:4px solid #2e7d32;margin-bottom:4px;">';
                        html += '✅ 正確解答：<br>';
                        parts.forEach(function(part, index) {
                            var label = fillLabelMap[index] || '第' + (index + 1) + '格';
                            html += '&nbsp;&nbsp;' + label + ' → <strong>' + part.trim() + '</strong><br>';
                        });
                        html += '</div>';
                        return html;
                    }
                }
                html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
                html += '✅ 正確解答：<strong>' + answer + '</strong>';
                html += '</div>';
                return html;
            }
        }

        // ===== 6. 配合題 =====
        if (type === 'match') {
            var leftItems = q.leftItems || [];
            if (leftItems.length > 0 && Array.isArray(answer)) {
                html += '<div style="padding:8px 14px;background:#e8f5e9;border-radius:6px;border-left:4px solid #2e7d32;margin-bottom:4px;">';
                html += '✅ 正確配對：<br>';
                leftItems.forEach(function(item, i) {
                    html += '&nbsp;&nbsp;• ' + item + ' → ' + (answer[i] || '?') + '<br>';
                });
                html += '</div>';
                return html;
            }
        }

        // ===== 7. 排序題 =====
        if (type === 'sequencing') {
            if (Array.isArray(answer) && answer.length > 0) {
                html += '<div style="padding:8px 14px;background:#e8f5e9;border-radius:6px;border-left:4px solid #2e7d32;margin-bottom:4px;">';
                html += '✅ 正確順序：<br>';
                answer.forEach(function(item, idx) {
                    html += '&nbsp;&nbsp;' + (idx + 1) + '. ' + item + '<br>';
                });
                html += '</div>';
                return html;
            }
        }

        // ===== 8. 連連看 =====
        if (type === 'link') {
            if (Array.isArray(answer) && answer.length > 0) {
                html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
                html += '✅ 正確配對：<strong>' + answer.join('、') + '</strong>';
                html += '</div>';
                return html;
            }
        }

        if (answer) {
            html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
            html += '✅ 正確答案：<strong>' + answer + '</strong>';
            html += '</div>';
        }

        return html;
    },
'''


def main():
    print('='*60)
    print('🔧 強化解析生成腳本 v1.0')
    print('='*60)

    if not TARGET_FILE.exists():
        print(f'❌ 檔案不存在: {TARGET_FILE}')
        return

    print(f'📁 目標檔案: {TARGET_FILE}')

    # 讀取檔案
    with open(TARGET_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # 檢查是否已強化
    if 'autoGenerateReasonEnhanced' in content:
        print('⚠️ 解析生成已強化，無需重複執行')
        return

    # 檢查是否包含 TipGeneratorModule
    if 'var TipGeneratorModule' not in content:
        print('⚠️ 找不到 TipGeneratorModule，請確認檔案正確')
        return

    # 1. 在 autoGenerateReason 函數之後插入強化版
    # 尋找 autoGenerateReason: function(q) { 的結尾
    pattern1 = r'(\s+autoGenerateReason: function\(q\) \{[^}]*\},)'
    if re.search(pattern1, content):
        # 在 autoGenerateReason 後面插入新函數
        content = re.sub(
            pattern1,
            r'\1\n' + NEW_FORMULA_LOOKUP,
            content
        )
        print('✅ 已插入 autoGenerateReasonEnhanced')
    else:
        print('⚠️ 找不到 autoGenerateReason，請手動檢查')
        return

    # 2. 在 autoGenerateTips 函數之後插入強化版
    pattern2 = r'(\s+autoGenerateTips: function\(q\) \{[^}]*\},)'
    if re.search(pattern2, content):
        content = re.sub(
            pattern2,
            r'\1\n' + NEW_AUTO_TIPS,
            content
        )
        print('✅ 已插入 autoGenerateTipsEnhanced')
    else:
        print('⚠️ 找不到 autoGenerateTips，請手動檢查')

    # 3. 修改 generateTips 函數，優先使用強化版
    # 在 generateTips 函數中，如果存在 enhanced 版本則優先使用
    pattern3 = r'(generateTips: function\(q\) \{)'
    if re.search(pattern3, content):
        # 在 generateTips 函數開頭加入判斷
        replacement = r'''\1
        // 優先使用強化版（如果存在）
        if (typeof this.autoGenerateTipsEnhanced === 'function') {
            var enhancedResult = this.autoGenerateTipsEnhanced(q);
            if (enhancedResult) return enhancedResult;
        }'''
        content = re.sub(pattern3, replacement, content)
        print('✅ 已修改 generateTips 優先使用強化版')

    # 寫回檔案
    with open(TARGET_FILE, 'w', encoding='utf-8') as f:
        f.write(content)

    print('\n' + '='*60)
    print('✅ 解析生成強化完成！')
    print('📁 檔案已更新: ' + str(TARGET_FILE))
    print('📊 新增功能:')
    print('   1. autoGenerateReasonEnhanced() - 整合 FORMULA_MAP')
    print('   2. autoGenerateTipsEnhanced() - 強化版提示生成')
    print('   3. getFormulaDisplay() - 從 FORMULA_MAP 取得公式')
    print('='*60)


if __name__ == '__main__':
    main()