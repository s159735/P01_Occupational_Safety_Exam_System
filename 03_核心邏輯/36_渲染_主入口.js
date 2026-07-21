// ============================================================
// 🎯 渲染_主入口 v10.2.0
// 職責：整合 D 區塊（30~35）所有渲染器，提供統一 renderQuestion 接口
// 更新日期：2026-07-19
// 修復：移除所有題型標籤的配分顯示
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_主入口 v10.2.0 載入中...');

    // ============================================================
    // 1. 強制繁體中文題型標籤對應表（純文字，不包含配分）
    // ============================================================
    var TYPE_LABEL_MAP = {
        'single': '單選題',
        'choice': '單選題',
        'multiple': '複選題',
        'truefalse': '是非題',
        'boolean': '是非題',
        'fill': '填空題',
        'blank': '填空題',
        'calc': '計算題',
        'calculation': '計算題',
        'match': '配合題',
        'matching': '配合題',
        'sort': '排序題',
        'sequencing': '排序題',
        'link': '連連看',
        'connection': '連連看',
        'law': '法規題'
    };

    // ============================================================
    // 2. 題型規格模板（備用）
    // ============================================================
    var TYPE_SPEC = {
        'single': {
            layout: '題幹區（中央） → 選項區（下方）',
            structure: ['題幹區', '選項區'],
            optionUI: '○ (A)(B)(C)(D) 圓形單選鈕',
            action: '點選',
            draggable: false,
            scoring: '單題計分',
            steps: ['閱讀題幹區的題目', '閱讀 (A)(B)(C)(D) 四個選項', '以滑鼠左鍵點選認為正確的選項']
        },
        'multiple': {
            layout: '題幹區（中央） → 選項區（下方）',
            structure: ['題幹區', '選項區'],
            optionUI: '☑ (A)(B)(C)(D) 方形勾選框（全對才給分）',
            action: '勾選',
            draggable: false,
            scoring: '全對才給分',
            steps: ['閱讀題幹區的題目', '閱讀所有選項', '逐一點選所有認為正確的選項']
        },
        'truefalse': {
            layout: '題幹區（中央） → 選項區（下方）',
            structure: ['題幹區', '選項區'],
            optionUI: '○ 是 ○ 否',
            action: '點選',
            draggable: false,
            scoring: '單題計分',
            steps: ['閱讀題幹區的敘述', '判斷敘述是否正確', '點選「是」或「否」']
        },
        'fill': {
            layout: '題幹區（上方，內嵌空白欄位） → 作答區（數字鍵盤）',
            structure: ['題幹區', '作答區'],
            optionUI: '(A) ______ (3.3%)',
            action: '數字鍵盤輸入',
            draggable: false,
            scoring: '各欄位獨立計分',
            hasNumberPad: true,
            steps: ['閱讀題幹區的題目', '點選空白欄位', '使用數字鍵盤輸入答案']
        },
        'calc': {
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
        'match': {
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
        'sequencing': {
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
        'link': {
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
    // 3. 獲取題型規格
    // ============================================================
    function getTypeSpec(type) {
        if (window.TypeMapping && window.TypeMapping.getTypeSpec) {
            return window.TypeMapping.getTypeSpec(type);
        }
        return TYPE_SPEC[type] || TYPE_SPEC.single;
    }

    // ============================================================
    // 4. 主渲染函數
    // ============================================================
    function renderQuestion(index) {
        if (typeof window.G_questionData === 'undefined' || !window.G_questionData[index]) {
            console.warn('renderQuestion: 題目不存在或尚未載入，index:', index);
            return;
        }

        var q = window.G_questionData[index];
        if (!q) {
            console.warn('renderQuestion: 題目資料為空，index:', index);
            return;
        }

        console.log('🎯 渲染題目:', index + 1, '類型:', q.type, 'ID:', q.id);

        // ===== 1. 更新題目文字 =====
        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '（無題目文字）';
            textEl.innerHTML = displayText;
        }

        // ===== 2. 更新題號 =====
        var numEl = document.getElementById('questionNumber');
        if (numEl) {
            numEl.innerHTML = '第 ' + (index + 1) + ' 題/共 ' + window.G_questionData.length + ' 題';
        }

        // ===== 3. 更新題號徽章 =====
        var badgeEl = document.getElementById('questionNumberBadge');
        if (badgeEl) {
            badgeEl.innerHTML = index + 1;
        }

        // ===== 4. 更新配分（只顯示在 questionPoints） =====
        var points = q.points || '10%';
        var pointsEl = document.getElementById('questionPoints');
        if (pointsEl) {
            pointsEl.innerHTML = '(' + points + ')';
        }

        // ===== 5. 題型標籤（純文字，不顯示配分） =====
        var typeBadge = document.getElementById('questionTypeBadge');
        if (typeBadge) {
            var typeKey = q.type || 'single';
            var displayType = TYPE_LABEL_MAP[typeKey] || q.typeLabel || typeKey;
            typeBadge.textContent = displayType;
            typeBadge.className = 'question-type-badge ' + (q.type || '');
        }

        // ===== 6. 更新題組名稱 =====
        var groupEl = document.getElementById('questionGroup');
        if (groupEl && q.group) {
            groupEl.innerHTML = '題組 ' + q.group;
        }

        // ===== 7. 更新題幹下方的「試回答下列問題：」 =====
        var stemEl = document.querySelector('.row-4');
        if (stemEl && q.stem) {
            stemEl.textContent = q.stem;
        }

        // ===== 8. 獲取容器 =====
        var cardArea = document.getElementById('optionsCardArea');
        var dropArea = document.getElementById('dropTargetArea');

        // ===== 9. 根據題型調用對應的渲染器 =====
        var type = q.type || 'single';

        switch (type) {
            case 'single':
            case 'choice':
                if (typeof window.renderChoice === 'function') {
                    if (dropArea) window.renderChoice(q, index, dropArea);
                } else {
                    console.warn('⚠️ renderChoice 未定義');
                }
                break;

            case 'multiple':
                if (typeof window.renderMultipleChoice === 'function') {
                    if (dropArea) window.renderMultipleChoice(q, index, dropArea);
                } else {
                    console.warn('⚠️ renderMultipleChoice 未定義');
                }
                break;

            case 'truefalse':
            case 'boolean':
                if (typeof window.renderTrueFalse === 'function') {
                    if (dropArea) window.renderTrueFalse(q, index, dropArea);
                } else {
                    console.warn('⚠️ renderTrueFalse 未定義');
                }
                break;

            case 'fill':
            case 'blank':
                if (typeof window.renderFill === 'function') {
                    if (dropArea) window.renderFill(q, index, dropArea);
                } else {
                    console.warn('⚠️ renderFill 未定義');
                }
                break;

            case 'calc':
            case 'calculation':
                if (typeof window.renderCalc === 'function') {
                    if (dropArea) window.renderCalc(q, index, dropArea);
                } else {
                    console.warn('⚠️ renderCalc 未定義');
                }
                break;

            case 'match':
            case 'matching':
                if (typeof window.renderMatch === 'function') {
                    if (cardArea || dropArea) window.renderMatch(q, index, cardArea, dropArea);
                } else {
                    console.warn('⚠️ renderMatch 未定義');
                }
                break;

            case 'sort':
            case 'sequencing':
                if (typeof window.renderSort === 'function') {
                    if (dropArea || cardArea) window.renderSort(q, index, dropArea, cardArea);
                } else {
                    console.warn('⚠️ renderSort 未定義');
                }
                break;

            case 'link':
            case 'connection':
                if (typeof window.renderLink === 'function') {
                    if (dropArea) window.renderLink(q, index, dropArea);
                } else {
                    console.warn('⚠️ renderLink 未定義');
                }
                break;

            default:
                console.warn('⚠️ 不支援的題型:', type);
                if (dropArea) {
                    dropArea.innerHTML = '<div style="padding:10px;color:#666;">不支援的題型</div>';
                }
        }

        // ===== 10. 更新答題計數 =====
        if (typeof updateAnsweredCount === 'function') {
            updateAnsweredCount();
        }

        // ===== 11. 更新標記按鈕 =====
        var markBtn = document.getElementById('markButton');
        if (markBtn) {
            if (window.G_markedQuestions && window.G_markedQuestions[index]) {
                markBtn.classList.add('active');
                markBtn.textContent = '標記★';
            } else {
                markBtn.classList.remove('active');
                markBtn.textContent = '標記☆';
            }
        }

        // ===== 12. 更新解析區（智慧引擎） =====
        if (typeof window.ExplanationEngine !== 'undefined') {
            // --- 法規內容 ---
            var lawEl = document.getElementById('lawContent');
            if (lawEl) {
                var lawHTML = '';
                if (typeof window.ExplanationEngine.generateLawContent === 'function') {
                    lawHTML = window.ExplanationEngine.generateLawContent(q);
                } else if (typeof window.generateLawContent === 'function') {
                    lawHTML = window.generateLawContent(q);
                }
                if (lawHTML && lawHTML.trim() !== '') {
                    lawEl.innerHTML = lawHTML;
                    lawEl.style.display = 'block';
                } else {
                    lawEl.innerHTML = '<span style="color:#999;">無法規資料</span>';
                    lawEl.style.display = 'block';
                }
            }

            // --- 答題秘訣 ---
            var tipEl = document.getElementById('tipContent');
            if (tipEl) {
                var tipsHTML = '';
                if (typeof window.ExplanationEngine.generateTips === 'function') {
                    tipsHTML = window.ExplanationEngine.generateTips(q);
                }
                if (tipsHTML && typeof tipsHTML === 'string' && tipsHTML.trim() !== '') {
                    tipEl.innerHTML = tipsHTML;
                    tipEl.style.display = 'block';
                } else {
                    tipEl.innerHTML = '<span style="color:#999;">無答題秘訣</span>';
                    tipEl.style.display = 'block';
                }
            }

            // --- 邏輯標籤 ---
            var logicEl = document.getElementById('logicContent');
            if (logicEl) {
                var logicTags = q.logic || [];
                if (logicTags.length > 0) {
                    if (typeof window.renderLogicTags === 'function') {
                        logicEl.innerHTML = window.renderLogicTags(logicTags);
                    } else {
                        var tagHtml = logicTags.map(function(tag) {
                            var label = typeof tag === 'string' ? tag : (tag.label || '未知');
                            return '<span class="logic-tag">🏷️ ' + label + '</span>';
                        }).join(' ');
                        logicEl.innerHTML = tagHtml;
                    }
                    logicEl.style.display = 'block';
                } else {
                    logicEl.innerHTML = '<span style="color:#999;">無邏輯概念標籤</span>';
                    logicEl.style.display = 'block';
                }
            }
        }

        // ===== 13. 正確解答 =====
        var answerEl = document.getElementById('answerContent');
        if (answerEl) {
            var answer = q.answer;
            var displayAnswer = '';
            if (answer !== undefined && answer !== null) {
                if (Array.isArray(answer)) {
                    displayAnswer = answer.join('、');
                } else {
                    displayAnswer = String(answer);
                }
            }
            if (displayAnswer.trim() === '') {
                displayAnswer = '無正確解答';
            }
            answerEl.textContent = displayAnswer;
        }

        // ===== 14. 題幹解析 =====
        var expText = document.getElementById('explanationText');
        if (expText) {
            var exp = q.explanation;
            if (exp) {
                if (typeof exp === 'string') {
                    expText.innerHTML = exp;
                } else if (typeof exp === 'object' && exp.summary) {
                    expText.innerHTML = exp.summary;
                } else {
                    expText.innerHTML = '無解析內容';
                }
            } else {
                if (typeof window.ExplanationEngine !== 'undefined' && 
                    typeof window.ExplanationEngine.generateExplanation === 'function') {
                    var genExp = window.ExplanationEngine.generateExplanation(q);
                    if (genExp && genExp.summary) {
                        expText.innerHTML = genExp.summary;
                    } else {
                        expText.innerHTML = '無解析內容';
                    }
                } else {
                    expText.innerHTML = '無解析內容';
                }
            }
        }

        console.log('✅ 渲染完成：第', index + 1, '題');
    }

    // ============================================================
    // 5. 暴露到全域
    // ============================================================
    window.renderQuestion = renderQuestion;
    window.getTypeSpec = getTypeSpec;

    console.log('✅ 36_渲染_主入口 v10.2.0 已載入');
    console.log('   🎯 支援 8 大題型渲染');
    console.log('   🧠 整合智慧引擎 (14_解析_主引擎.js)');
    console.log('   📌 題型標籤純文字（不顯示配分）');
    console.log('   ✅ 配分僅顯示在 questionPoints 位置');

})();