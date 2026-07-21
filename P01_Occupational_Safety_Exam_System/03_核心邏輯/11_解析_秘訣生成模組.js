// ============================================================
// 💡 解析_秘訣生成模組 v10.2.0（完整強化版）
// 職責：答題秘訣生成（含 autoGenerateReason）
// 更新日期：2026-07-17
// ============================================================

console.log('💡 11_解析_秘訣生成模組 v10.2.0 載入中...');

var TipGeneratorModule = {
    // ============================================================
    // 1. 從 FORMULA_MAP 取得公式顯示
    // ============================================================
    getFormulaDisplay: function(formulaKey) {
        if (typeof window.FORMULA_MAP !== 'undefined' && window.FORMULA_MAP[formulaKey]) {
            var formula = window.FORMULA_MAP[formulaKey];
            var display = formula.display || formulaKey;
            var desc = formula.desc || '';
            var note = formula.note || '';
            var result = '📐 ' + display;
            if (desc) result += '（' + desc + '）';
            if (note) result += '\n💡 ' + note;
            return result;
        }
        return null;
    },

    // ============================================================
    // 2. 生成答題秘訣（主函數）
    // ============================================================
    generateTips: function(q) {
        if (!q) return '';
        
        var enhancedTips = this.autoGenerateTipsEnhanced(q);
        if (enhancedTips) return enhancedTips;
        
        var tips = q.tips;
        if (!tips) return '';
        var html = '';
        var hasContent = false;
        var displayedContent = [];

        if (typeof tips === 'string') {
            if (tips.trim() !== '') return tips;
            return '';
        }

        if (typeof tips === 'object') {
            // --- 核心口訣 ---
            if (tips.mnemonic && tips.mnemonic.trim() !== '') {
                var mnemonicText = tips.mnemonic.trim();
                var isDuplicate = false;
                if (tips.quick && Array.isArray(tips.quick)) {
                    for (var i = 0; i < tips.quick.length; i++) {
                        if (tips.quick[i] && mnemonicText.indexOf(tips.quick[i]) !== -1) {
                            isDuplicate = true;
                            break;
                        }
                    }
                }
                if (!isDuplicate && displayedContent.indexOf(mnemonicText) === -1) {
                    hasContent = true;
                    html += '<div class="tip-mnemonic" style="font-size:18px;font-weight:700;color:#1a237e;padding:10px 16px;background:#e8eaf6;border-radius:8px;margin-bottom:8px;border-left:4px solid #1a237e;">';
                    html += '🧠 【核心口訣】' + mnemonicText;
                    html += '</div>';
                    displayedContent.push(mnemonicText);
                }
            }

            // --- 關鍵數字 ---
            if (tips.quick && tips.quick.length > 0) {
                var quickTexts = (Array.isArray(tips.quick) ? tips.quick : [tips.quick]).filter(function(t) { return t && t.trim() !== ''; });
                if (quickTexts.length > 0) {
                    var quickJoined = quickTexts.join('　');
                    var isDuplicate = false;
                    if (tips.mnemonic && quickJoined.indexOf(tips.mnemonic) !== -1) {
                        isDuplicate = true;
                    }
                    if (!isDuplicate && displayedContent.indexOf(quickJoined) === -1) {
                        hasContent = true;
                        html += '<div class="tip-quick" style="font-size:15px;color:#e65100;padding:6px 16px;background:#fff3e0;border-radius:6px;margin-bottom:6px;border-left:3px solid #e65100;">';
                        html += '📌 【關鍵數字】' + quickJoined;
                        html += '</div>';
                        displayedContent.push(quickJoined);
                    }
                }
            }

            // --- 原因邏輯 ---
            var reasonText = '';
            if (tips.reason && tips.reason.trim() !== '') {
                reasonText = tips.reason.trim();
            } else {
                reasonText = this.autoGenerateReasonEnhanced(q);
            }
            if (reasonText && reasonText.trim() !== '') {
                if (displayedContent.indexOf(reasonText) === -1) {
                    hasContent = true;
                    html += '<div class="tip-reason" style="font-size:15px;color:#0d47a1;padding:8px 16px;background:#e3f2fd;border-radius:6px;margin-bottom:6px;border-left:3px solid #0d47a1;">';
                    html += '🤔 【原因邏輯】' + reasonText;
                    html += '</div>';
                    displayedContent.push(reasonText);
                }
            }

            // --- 考試陷阱 ---
            var mistakeItems = [];
            if (tips.commonMistake) {
                if (Array.isArray(tips.commonMistake)) {
                    mistakeItems = tips.commonMistake.filter(function(t) { return t && t.trim() !== ''; });
                } else if (typeof tips.commonMistake === 'string' && tips.commonMistake.trim() !== '') {
                    mistakeItems = [tips.commonMistake.trim()];
                }
            }
            if (tips.examTrap) {
                var examTrapItems = [];
                if (Array.isArray(tips.examTrap)) {
                    examTrapItems = tips.examTrap.filter(function(t) { return t && t.trim() !== ''; });
                } else if (typeof tips.examTrap === 'string' && tips.examTrap.trim() !== '') {
                    examTrapItems = [tips.examTrap.trim()];
                }
                examTrapItems.forEach(function(item) {
                    if (mistakeItems.indexOf(item) === -1) mistakeItems.push(item);
                });
            }

            if (mistakeItems.length > 0) {
                var maxMistakes = Math.min(mistakeItems.length, 3);
                for (var i = 0; i < maxMistakes; i++) {
                    var mistakeText = mistakeItems[i];
                    if (displayedContent.indexOf(mistakeText) === -1) {
                        hasContent = true;
                        var isFirst = (i === 0);
                        var borderWidth = isFirst ? '4px' : '3px';
                        var bgColor = isFirst ? '#ffebee' : '#fff5f5';
                        html += '<div class="tip-mistake" style="font-size:14px;color:#b71c1c;padding:' + (isFirst ? '8px' : '6px') + ' 16px;background:' + bgColor + ';border-radius:6px;margin-bottom:4px;border-left:' + borderWidth + ' solid #b71c1c;">';
                        html += '⚠️ 【考試陷阱】' + mistakeText;
                        html += '</div>';
                        displayedContent.push(mistakeText);
                    }
                }
            }
        }

        if (!hasContent) {
            var autoTips = this.autoGenerateTipsEnhanced(q);
            if (autoTips) return autoTips;
            return '';
        }
        return html;
    },

    // ============================================================
    // 3. 強化版：自動生成提示（支援所有官方格式題型）
    // ============================================================
    autoGenerateTipsEnhanced: function(q) {
        var html = '';
        var type = q.type || '';
        var answer = q.answer;
        var options = q.options || [];
        var labelMap = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        var formulaKey = q.formulaKey || '';

        // 計算題：顯示公式
        if (type === 'calc' && formulaKey) {
            var formulaDisplay = this.getFormulaDisplay(formulaKey);
            if (formulaDisplay) {
                html += '<div style="padding:6px 12px;background:#e3f2fd;border-radius:4px;border-left:3px solid #0d47a1;margin-bottom:4px;">';
                html += '📐 <strong>公式：</strong>' + formulaDisplay;
                html += '</div>';
                return html;
            }
        }

        // 單選題
        if (type === 'single' || type === 'choice') {
            if (typeof answer === 'number' && options[answer] !== undefined) {
                var label = labelMap[answer] || (parseInt(answer) + 1);
                html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
                html += '✅ 正確解答：<strong>' + label + '. ' + options[answer] + '</strong>';
                html += '</div>';
                return html;
            }
        }

        // 複選題
        if (type === 'multiple' && Array.isArray(answer)) {
            var answerLabels = [];
            answer.forEach(function(idx) {
                var i = parseInt(idx);
                if (!isNaN(i) && options[i] !== undefined) {
                    answerLabels.push((labelMap[i] || (i + 1)) + '. ' + options[i]);
                }
            });
            if (answerLabels.length > 0) {
                html += '<div style="padding:8px 14px;background:#e8f5e9;border-radius:6px;border-left:4px solid #2e7d32;margin-bottom:4px;">';
                html += '✅ 正確解答：<br>';
                answerLabels.forEach(function(label) { html += '&nbsp;&nbsp;• ' + label + '<br>'; });
                html += '</div>';
                return html;
            }
        }

        // 是非題
        if (type === 'truefalse') {
            var isTrue = answer === 0 || answer === true || answer === 'true' || answer === '是';
            html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
            html += '✅ 正確解答：<strong>' + (isTrue ? '是（正確）' : '否（錯誤）') + '</strong>';
            html += '</div>';
            return html;
        }

        // 填充題
        if (type === 'fill' && answer) {
            var fillLabelMap = ['(A)', '(B)', '(C)', '(D)', '(E)', '(F)', '(G)', '(H)'];
            if (Array.isArray(answer) && answer.length > 0) {
                html += '<div style="padding:8px 14px;background:#e8f5e9;border-radius:6px;border-left:4px solid #2e7d32;margin-bottom:4px;">';
                html += '✅ 正確解答：<br>';
                answer.forEach(function(part, index) {
                    html += '&nbsp;&nbsp;' + (fillLabelMap[index] || '第' + (index+1) + '格') + ' → <strong>' + part.trim() + '</strong><br>';
                });
                html += '</div>';
                return html;
            }
            html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
            html += '✅ 正確解答：<strong>' + answer + '</strong>';
            html += '</div>';
            return html;
        }

        // 配合題
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

        // 排序題
        if (type === 'sequencing' && Array.isArray(answer) && answer.length > 0) {
            html += '<div style="padding:8px 14px;background:#e8f5e9;border-radius:6px;border-left:4px solid #2e7d32;margin-bottom:4px;">';
            html += '✅ 正確順序：<br>';
            answer.forEach(function(item, idx) { html += '&nbsp;&nbsp;' + (idx+1) + '. ' + item + '<br>'; });
            html += '</div>';
            return html;
        }

        // 連連看
        if (type === 'link' && Array.isArray(answer) && answer.length > 0) {
            var displayAnswer = answer.map(function(item) { return String(item); }).join('、');
            html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
            html += '✅ 正確配對：<strong>' + displayAnswer + '</strong>';
            html += '</div>';
            return html;
        }

        if (answer) {
            html += '<div style="padding:6px 12px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32;margin-bottom:4px;">';
            html += '✅ 正確答案：<strong>' + answer + '</strong>';
            html += '</div>';
        }

        return html;
    },

    // ============================================================
    // 4. 強化版：自動生成原因
    // ============================================================
    autoGenerateReasonEnhanced: function(q) {
        var type = q.type || '';
        var text = q.text || '';
        var lawName = q.law ? q.law.name : (q.lawRef ? q.lawRef.law : '');
        var logicTags = q.logicTags || q.logic || [];
        var formulaKey = q.formulaKey || '';
        var answer = q.answer || '';

        if (type === 'calc' && formulaKey) {
            var formulaDisplay = this.getFormulaDisplay(formulaKey);
            if (formulaDisplay) {
                var result = '🤔 這題需要使用公式進行計算。\n\n📐 ' + formulaDisplay;
                if (answer) {
                    result += '\n\n✅ 計算結果為：' + answer;
                }
                return result;
            }
        }

        if (type === 'calc') {
            return '🤔 計算題的關鍵是：①先寫出正確的公式 ②代入數值時注意單位換算 ③最後四捨五入到指定小數位數。公式寫對，分數就拿到一半了！';
        }

        if (type === 'sequencing' || text.match(/順序|流程|步驟|先後|排列|配對|作業步驟/)) {
            var items = q.answer || q.leftItems || [];
            if (Array.isArray(items) && items.length > 0) {
                var orderText = items.join(' → ');
                return '🤔 這題考的是正確的作業順序。正確順序是：' + orderText + '。\n\n💡 因為每個步驟之間有嚴格的邏輯關係，順序錯了可能導致安全風險！';
            }
            if (lawName) {
                return '🤔 這題考的是「' + lawName + '」中規定的作業流程。每個步驟都不能跳過或顛倒！';
            }
            return '🤔 順序題要記住「先後邏輯」，建議用口訣把順序串聯起來。';
        }

        if (text.match(/局限空間|缺氧|通風|氣體測定|進入許可/)) {
            return '🤔 局限空間作業的正確順序是：測定→通風→許可→監視→進入。\n\n💡 要先確認環境安全（測定、通風），再申請行政許可，最後才進入作業。順序錯了可能導致缺氧或中毒事故！';
        }

        if (text.match(/墜落|護欄|安全網|安全帶|防墜/)) {
            return '🤔 墜落防護措施的優先順序：地面作業→護欄→安全網→安全帶。\n\n💡 越前面的措施越能「主動」預防墜落，越後面則是「被動」防護，效果也越差。';
        }

        if (text.match(/教育訓練|時數|在職訓練|新僱|業務主管|急救人員/)) {
            return '🤔 這題考的是教育訓練規則中不同人員的訓練時數要求。\n\n💡 新僱勞工至少3小時、業務主管每2年6小時、急救人員每3年12小時、一般勞工每3年3小時。';
        }

        // 邏輯標籤導向
        if (logicTags.indexOf('計算應用') !== -1) {
            return '🤔 計算題的關鍵：①先寫公式 ②代入數值注意單位 ③最後四捨五入。公式寫對，分數就拿到一半了！';
        }
        if (logicTags.indexOf('流程操作') !== -1) {
            return '🤔 流程操作題要記住「先後順序」！順序錯了整個流程就會出錯。';
        }
        if (logicTags.indexOf('危害辨識') !== -1) {
            return '🤔 危害辨識要建立「危害類型 → 防護措施」的對應關係。先辨識出是什麼危害，才能選擇正確的防護方式。';
        }
        if (logicTags.indexOf('法規數字') !== -1) {
            if (lawName) {
                return '🤔 這題考的是「' + lawName + '」中的關鍵數字。記住數字就能掌握法條的核心要件。';
            }
            return '🤔 法規題常考關鍵數字（天數、人數、距離、濃度等），這些數字通常是法條的核心要件。';
        }
        if (logicTags.indexOf('法規記憶') !== -1 || logicTags.indexOf('法規理解') !== -1) {
            if (lawName) {
                return '🤔 這題考的是「' + lawName + '」的規定。理解「立法精神」比死背法條文字更重要。';
            }
            return '🤔 法規題要理解「立法精神」而不是死背法條文字。';
        }

        var typeMessages = {
            'single': '🤔 單選題要學會分辨「正確」與「最正確」的差異。其他選項通常是常見的錯誤觀念或陷阱。',
            'multiple': '🤔 複選題要用「排除法」先刪除確定錯誤的選項，再從剩下的選項中挑選正確的。',
            'truefalse': '🤔 是非題的關鍵是「完全正確」才對。只要題幹中有一個細節不符合法規規定，整題就是錯的。',
            'fill': '🤔 填空題要填入最精確的關鍵字，通常是法條中的數字（天數、人數）或專有名詞。填錯一個字就錯！',
            'match': '🤔 配合題要建立「左欄→右欄」的正確對應關係。先確認左欄項目的順序，再逐一找出對應的右欄答案。',
            'link': '🤔 連連看要建立「左欄→右欄」的正確配對。先確認左欄項目的順序，再逐一找出對應的右欄答案。',
        };
        if (typeMessages[type]) return typeMessages[type];
        if (lawName) return '🤔 這題與「' + lawName + '」有關，理解法條背後的立法精神比死背法條文字更重要。';

        return '🤔 理解題目背後的邏輯和原理，是正確答題的關鍵。不要只背答案，要理解「為什麼」。';
    },

    // ============================================================
    // 5. 對外接口
    // ============================================================
    autoGenerateTips: function(q) {
        return this.autoGenerateTipsEnhanced(q);
    },

    autoGenerateReason: function(q) {
        return this.autoGenerateReasonEnhanced(q);
    },

    formatAnswerWithContext: function(q) {
        if (typeof window.AnswerFormatterModule !== 'undefined') {
            return window.AnswerFormatterModule.formatAnswerWithContext(q);
        }
        return '✅ 正確解答：' + (q.answer || '');
    }
};

// ============================================================
// 6. 匯出到全域
// ============================================================
if (typeof window !== 'undefined') {
    window.TipGeneratorModule = TipGeneratorModule;
    window.generateTips = TipGeneratorModule.generateTips;
    window.autoGenerateReason = TipGeneratorModule.autoGenerateReasonEnhanced;
}

console.log('✅ 11_解析_秘訣生成模組 v10.2.0 強化版已載入');
console.log('   📊 支援所有 8 大題型');
console.log('   💡 包含 30+ 組答題口訣');