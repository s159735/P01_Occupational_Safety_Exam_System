// ============================================================
// 📝 解析_答案格式化模組 v10.2.0
// 職責：答案格式化（含單位與關鍵字）
// 更新日期：2026-07-17
// ============================================================

console.log('📝 13_解析_答案格式化模組 v10.2.0 載入中...');

(function() {
    'use strict';

    // ============================================================
    // 1. 答案格式化：自動加上關鍵字與單位（計算題專用）
    // ============================================================
    function formatAnswerWithContext(q) {
        var answer = q.answer || '';
        var text = q.text || '';

        if (!answer) return '';

        var keyword = '';
        var unit = '';

        var patterns = [
            { match: /TWA|時量平均濃度/, keyword: '時量平均濃度 (TWA)', unit: 'ppm' },
            { match: /STEL|短時間時量平均/, keyword: '短時間時量平均 (STEL)', unit: 'ppm' },
            { match: /WBGT|綜合溫度熱指數/, keyword: '綜合溫度熱指數 (WBGT)', unit: '°C' },
            { match: /BMI|身體質量指數/, keyword: '身體質量指數 (BMI)', unit: '' },
            { match: /濃度|ppm|mg\/m³/, keyword: '濃度', unit: 'ppm' },
            { match: /壓力|kg\/cm²|psi/, keyword: '壓力', unit: 'kg/cm²' },
            { match: /溫度|°C|℃/, keyword: '溫度', unit: '°C' },
            { match: /風速|m\/s/, keyword: '風速', unit: 'm/s' },
            { match: /換氣量|m³\/min|CFM/, keyword: '換氣量', unit: 'm³/min' },
            { match: /電流|安培|A/, keyword: '電流', unit: 'A' },
            { match: /電阻|Ω/, keyword: '電阻', unit: 'Ω' },
            { match: /功率|瓦|W/, keyword: '功率', unit: 'W' },
            { match: /電壓|伏特|V/, keyword: '電壓', unit: 'V' },
            { match: /度數|度|kWh/, keyword: '消耗度數', unit: '度' },
            { match: /費用|元|錢/, keyword: '費用', unit: '元' },
            { match: /噪音|dBA/, keyword: '噪音', unit: 'dBA' },
            { match: /劑量|%/, keyword: '噪音劑量', unit: '%' },
            { match: /FR|失能傷害頻率/, keyword: '失能傷害頻率 (FR)', unit: '' },
            { match: /SR|失能傷害嚴重率/, keyword: '失能傷害嚴重率 (SR)', unit: '' },
            { match: /FSI|總合傷害指數/, keyword: '總合傷害指數 (FSI)', unit: '' },
            { match: /過濾效率|%/, keyword: '過濾效率', unit: '%' },
            { match: /傾斜度/, keyword: '傾斜度', unit: '' },
            { match: /危險度指數/, keyword: '危險度指數', unit: '' },
            { match: /儲存能力/, keyword: '儲存能力', unit: '公噸' },
            { match: /冷凍能力/, keyword: '冷凍能力', unit: '公噸' },
            { match: /粉塵濃度/, keyword: '粉塵濃度', unit: 'mg/m³' },
            { match: /照度/, keyword: '平均照度', unit: 'Lux' },
            { match: /電磁波|通量密度/, keyword: '通量密度', unit: 'mW/cm²' },
            { match: /急救人員/, keyword: '急救人員', unit: '人' },
            { match: /氣積|立方公尺/, keyword: '氣積', unit: 'm³' },
            { match: /新鮮空氣量/, keyword: '新鮮空氣量', unit: 'm³/min' }
        ];

        for (var i = 0; i < patterns.length; i++) {
            if (text.match(patterns[i].match)) {
                keyword = patterns[i].keyword;
                unit = patterns[i].unit;
                break;
            }
        }

        if (!keyword) {
            var extractMatch = text.match(/(?:計算|求|為|為多少|為何|為幾)\s*(.+?)(?:[，。？、）]|$)/);
            if (extractMatch) {
                keyword = extractMatch[1].trim();
            } else {
                keyword = '答案';
            }
        }

        var formatted = '✅ 正確解答：' + answer;
        if (keyword && keyword !== '答案') {
            formatted += ' ' + keyword;
        }
        if (unit) {
            formatted += ' (' + unit + ')';
        }

        return formatted;
    }

    // ============================================================
    // 2. 格式化排序題答案
    // ============================================================
    function formatSequencingAnswer(answer) {
        if (!answer || !Array.isArray(answer) || answer.length === 0) {
            return "無答案";
        }
        return answer.join(" → ");
    }

    // ============================================================
    // 3. 格式化連連看答案
    // ============================================================
    function formatLinkAnswer(answer, leftItems) {
        if (!answer || !Array.isArray(answer) || answer.length === 0) {
            return "無答案";
        }
        if (!leftItems || leftItems.length === 0) {
            return answer.join("，");
        }
        var pairs = [];
        for (var i = 0; i < Math.min(leftItems.length, answer.length); i++) {
            pairs.push(leftItems[i] + ' → ' + answer[i]);
        }
        return pairs.join("，");
    }

    // ============================================================
    // 4. 格式化配合題答案
    // ============================================================
    function formatMatchAnswer(answer, leftItems) {
        if (!answer || !Array.isArray(answer) || answer.length === 0) {
            return "無答案";
        }
        if (!leftItems || leftItems.length === 0) {
            return answer.join("，");
        }
        var pairs = [];
        for (var i = 0; i < Math.min(leftItems.length, answer.length); i++) {
            pairs.push(leftItems[i] + ' → ' + answer[i]);
        }
        return pairs.join("，");
    }

    // ============================================================
    // 5. 格式化複選題答案
    // ============================================================
    function formatMultipleAnswer(answer, options) {
        if (!answer || !Array.isArray(answer) || answer.length === 0) {
            return "無答案";
        }
        if (!options || options.length === 0) {
            return answer.join("、");
        }
        var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        var result = [];
        answer.forEach(function(idx) {
            var i = parseInt(idx);
            if (!isNaN(i) && options[i] !== undefined) {
                result.push((labels[i] || (i + 1)) + '. ' + options[i]);
            }
        });
        return result.join("、");
    }

    // ============================================================
    // 6. 格式化單選題答案
    // ============================================================
    function formatSingleAnswer(answer, options) {
        if (answer === undefined || answer === null || answer === '') {
            return "無答案";
        }
        var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        var i = parseInt(answer);
        if (!isNaN(i) && options && options[i] !== undefined) {
            return (labels[i] || (i + 1)) + '. ' + options[i];
        }
        return String(answer);
    }

    // ============================================================
    // 7. 格式化是非題答案
    // ============================================================
    function formatTrueFalseAnswer(answer) {
        if (answer === undefined || answer === null || answer === '') {
            return "無答案";
        }
        var isTrue = answer === 0 || answer === true || answer === 'true' || answer === '是';
        return isTrue ? '是（正確）' : '否（錯誤）';
    }

    // ============================================================
    // 8. 格式化填空題答案
    // ============================================================
    function formatFillAnswer(answer) {
        if (!answer) return "無答案";
        if (Array.isArray(answer)) {
            var labels = ['(A)', '(B)', '(C)', '(D)', '(E)', '(F)', '(G)', '(H)'];
            var result = [];
            answer.forEach(function(item, idx) {
                result.push((labels[idx] || '第' + (idx+1) + '格') + ' → ' + item);
            });
            return result.join("，");
        }
        return String(answer);
    }

    // ============================================================
    // 9. 格式化計算題答案
    // ============================================================
    function formatCalcAnswer(answer) {
        if (!answer) return "無答案";
        if (Array.isArray(answer)) {
            return answer.join("、");
        }
        return String(answer);
    }

    // ============================================================
    // 10. 通用答案格式化（支援所有官方格式題型）
    // ============================================================
    function formatAnswer(question) {
        var type = question.type || 'single';
        var answer = question.answer;
        
        switch(type) {
            case "single":
                return formatSingleAnswer(answer, question.options);
            case "multiple":
                return formatMultipleAnswer(answer, question.options);
            case "truefalse":
                return formatTrueFalseAnswer(answer);
            case "fill":
                return formatFillAnswer(answer);
            case "calc":
                return formatCalcAnswer(answer);
            case "match":
                return formatMatchAnswer(answer, question.leftItems);
            case "sequencing":
                return formatSequencingAnswer(answer);
            case "link":
                return formatLinkAnswer(answer, question.leftItems);
            default:
                return String(answer);
        }
    }

    // ============================================================
    // 11. 匯出到全域
    // ============================================================
    if (typeof window !== 'undefined') {
        window.AnswerFormatterModule = {
            formatAnswerWithContext: formatAnswerWithContext,
            formatSequencingAnswer: formatSequencingAnswer,
            formatLinkAnswer: formatLinkAnswer,
            formatMatchAnswer: formatMatchAnswer,
            formatMultipleAnswer: formatMultipleAnswer,
            formatSingleAnswer: formatSingleAnswer,
            formatTrueFalseAnswer: formatTrueFalseAnswer,
            formatFillAnswer: formatFillAnswer,
            formatCalcAnswer: formatCalcAnswer,
            formatAnswer: formatAnswer
        };
        
        window.formatAnswerWithContext = formatAnswerWithContext;
        window.formatSequencingAnswer = formatSequencingAnswer;
        window.formatLinkAnswer = formatLinkAnswer;
        window.formatMatchAnswer = formatMatchAnswer;
        window.formatAnswer = formatAnswer;
    }

    console.log('✅ 13_解析_答案格式化模組 v10.2.0 已載入');
    console.log('   📝 支援 8 大題型答案格式化');
    console.log('   📊 包含自動單位與關鍵字辨識');
})();