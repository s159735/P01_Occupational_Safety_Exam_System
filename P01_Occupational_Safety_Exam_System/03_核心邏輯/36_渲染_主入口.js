// ============================================================
// 🎯 渲染_主入口 v10.4.0 (每個題型獨立容器)
// 職責：整合 D 區塊（30~35）所有渲染器
// 特色：每個題型使用獨立容器，沒用到的自動隱藏
// 更新日期：2026-07-21
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_主入口 v10.4.0 載入中...');

    // ============================================================
    // 1. 題型標籤對應表
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
    // 2. 題型規格模板
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
    // 4. 獲取所有容器
    // ============================================================
    function getAllContainers() {
        return {
            sortDrop: document.getElementById('answerContainer1'),
            sortCard: document.getElementById('answerContainer2'),
            matchCard: document.getElementById('optionsCardArea'),
            commonDrop: document.getElementById('dropTargetArea'),
            answer3: document.getElementById('answerContainer3')
        };
    }

    // ============================================================
    // 5. 隱藏所有容器（除了指定的）
    // ============================================================
    function hideAllContainers(except) {
        var containers = getAllContainers();
        var exceptList = except || [];
        
        for (var key in containers) {
            var el = containers[key];
            if (el) {
                if (exceptList.indexOf(key) === -1) {
                    el.style.display = 'none';
                    el.innerHTML = '';
                } else {
                    el.style.display = 'block';
                }
            }
        }
    }

    // ============================================================
    // 6. 主渲染函數
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

        var type = q.type || 'single';
        var containers = getAllContainers();

        // ============================================================
        // 6a. 根據題型決定要顯示哪些容器
        // ============================================================
        var showContainers = [];

        switch (type) {
            case 'single':
            case 'choice':
                showContainers = ['commonDrop'];
                break;
            case 'multiple':
                showContainers = ['commonDrop'];
                break;
            case 'truefalse':
            case 'boolean':
                showContainers = ['commonDrop'];
                break;
            case 'fill':
            case 'blank':
                showContainers = ['commonDrop'];
                break;
            case 'calc':
            case 'calculation':
                showContainers = ['commonDrop'];
                break;
            case 'match':
            case 'matching':
                showContainers = ['commonDrop', 'matchCard'];
                break;
            case 'sort':
            case 'sequencing':
                showContainers = ['sortDrop', 'sortCard'];
                break;
            case 'link':
            case 'connection':
                showContainers = ['commonDrop'];
                break;
            default:
                showContainers = ['commonDrop'];
        }

        // ============================================================
        // 6b. 隱藏所有容器，只顯示需要的
        // ============================================================
        hideAllContainers(showContainers);

        // ============================================================
        // 6c. 清空要使用的容器（保留顯示狀態）
        // ============================================================
        if (containers.sortDrop && showContainers.indexOf('sortDrop') !== -1) {
            containers.sortDrop.innerHTML = '';
            containers.sortDrop.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:16px 20px;background:#faf8f5;border:2px solid #d5c8a8;border-radius:8px;min-height:80px;margin-bottom:10px;';
        }
        if (containers.sortCard && showContainers.indexOf('sortCard') !== -1) {
            containers.sortCard.innerHTML = '';
            containers.sortCard.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:16px 20px;background:#f5f0e8;border:2px solid #d5c8a8;border-radius:8px;min-height:60px;';
        }
        if (containers.commonDrop && showContainers.indexOf('commonDrop') !== -1) {
            containers.commonDrop.innerHTML = '';
            containers.commonDrop.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:16px 20px;background:#faf8f5;border:2px solid #d5c8a8;border-radius:8px;min-height:80px;';
        }
        if (containers.matchCard && showContainers.indexOf('matchCard') !== -1) {
            containers.matchCard.innerHTML = '';
            containers.matchCard.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px 16px;padding:16px 20px;background:#f5f0e8;border:2px solid #d5c8a8;border-radius:8px;min-height:60px;margin-top:16px;';
        }

        // ============================================================
        // 6d. 更新基本 UI 元素
        // ============================================================

        var textEl = document.getElementById('questionText');
        if (textEl) {
            textEl.innerHTML = q.text || '（無題目文字）';
        }

        var numEl = document.getElementById('questionNumber');
        if (numEl) {
            numEl.innerHTML = '第 ' + (index + 1) + ' 題/共 ' + window.G_questionData.length + ' 題';
        }

        var badgeEl = document.getElementById('questionNumberBadge');
        if (badgeEl) {
            badgeEl.innerHTML = index + 1;
        }

        var points = q.points || '10%';
        var pointsEl = document.getElementById('questionPoints');
        if (pointsEl) {
            pointsEl.innerHTML = '(' + points + ')';
        }

        var typeBadge = document.getElementById('questionTypeBadge');
        if (typeBadge) {
            var typeKey = q.type || 'single';
            var displayType = TYPE_LABEL_MAP[typeKey] || q.typeLabel || typeKey;
            typeBadge.textContent = displayType;
            typeBadge.className = 'question-type-badge ' + (q.type || '');
        }

        var groupEl = document.getElementById('questionGroup');
        if (groupEl && q.group) {
            groupEl.innerHTML = '題組 ' + q.group;
        }

        // ============================================================
        // 6e. 根據題型調用對應的渲染器
        // ============================================================

        switch (type) {
            case 'single':
            case 'choice':
                if (typeof window.renderChoice === 'function') {
                    if (containers.commonDrop) window.renderChoice(q, index, containers.commonDrop);
                } else {
                    console.warn('⚠️ renderChoice 未定義');
                    if (containers.commonDrop) containers.commonDrop.innerHTML = '<div style="padding:10px;color:#999;">單選題渲染器未載入</div>';
                }
                break;

            case 'multiple':
                if (typeof window.renderMultipleChoice === 'function') {
                    if (containers.commonDrop) window.renderMultipleChoice(q, index, containers.commonDrop);
                } else {
                    console.warn('⚠️ renderMultipleChoice 未定義');
                    if (containers.commonDrop) containers.commonDrop.innerHTML = '<div style="padding:10px;color:#999;">複選題渲染器未載入</div>';
                }
                break;

            case 'truefalse':
            case 'boolean':
                if (typeof window.renderTrueFalse === 'function') {
                    if (containers.commonDrop) window.renderTrueFalse(q, index, containers.commonDrop);
                } else {
                    console.warn('⚠️ renderTrueFalse 未定義');
                    if (containers.commonDrop) containers.commonDrop.innerHTML = '<div style="padding:10px;color:#999;">是非題渲染器未載入</div>';
                }
                break;

            case 'fill':
            case 'blank':
                if (typeof window.renderFill === 'function') {
                    if (containers.commonDrop) window.renderFill(q, index, containers.commonDrop);
                } else {
                    console.warn('⚠️ renderFill 未定義');
                    if (containers.commonDrop) containers.commonDrop.innerHTML = '<div style="padding:10px;color:#999;">填空題渲染器未載入</div>';
                }
                break;

            case 'calc':
            case 'calculation':
                if (typeof window.renderCalc === 'function') {
                    if (containers.commonDrop) window.renderCalc(q, index, containers.commonDrop);
                } else {
                    console.warn('⚠️ renderCalc 未定義');
                    if (containers.commonDrop) containers.commonDrop.innerHTML = '<div style="padding:10px;color:#999;">計算題渲染器未載入</div>';
                }
                break;

            case 'match':
            case 'matching':
                if (typeof window.renderMatch === 'function') {
                    window.renderMatch(q, index, containers.matchCard, containers.commonDrop);
                } else {
                    console.warn('⚠️ renderMatch 未定義');
                    if (containers.commonDrop) containers.commonDrop.innerHTML = '<div style="padding:10px;color:#999;">配合題渲染器未載入</div>';
                }
                break;

            case 'sort':
            case 'sequencing':
                console.log('🔧 排序題: 開始渲染, ID:', q.id);
                if (typeof window.renderSort === 'function') {
                    if (containers.sortDrop && containers.sortCard) {
                        window.renderSort(q, index, containers.sortDrop, containers.sortCard);
                        console.log('✅ 排序題渲染完成');
                    } else {
                        console.error('❌ 排序題容器缺失');
                        if (containers.sortDrop) containers.sortDrop.innerHTML = '<div style="padding:10px;color:#e05046;">排序題容器設定錯誤</div>';
                    }
                } else {
                    console.error('❌ renderSort 未定義');
                    if (containers.sortDrop) containers.sortDrop.innerHTML = '<div style="padding:10px;color:#e05046;">排序題渲染器未載入</div>';
                }
                break;

            case 'link':
            case 'connection':
                if (typeof window.renderLink === 'function') {
                    if (containers.commonDrop) window.renderLink(q, index, containers.commonDrop);
                } else {
                    console.warn('⚠️ renderLink 未定義');
                    if (containers.commonDrop) containers.commonDrop.innerHTML = '<div style="padding:10px;color:#999;">連連看渲染器未載入</div>';
                }
                break;

            default:
                console.warn('⚠️ 不支援的題型:', type);
                if (containers.commonDrop) {
                    containers.commonDrop.innerHTML = '<div style="padding:10px;color:#666;">不支援的題型: ' + type + '</div>';
                }
        }

        // ============================================================
        // 6f. 更新答題計數
        // ============================================================
        if (typeof updateAnsweredCount === 'function') {
            updateAnsweredCount();
        }

        // ============================================================
        // 6g. 更新標記按鈕
        // ============================================================
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

        // ============================================================
        // 6h. 更新解析區
        // ============================================================
        if (typeof window.ExplanationEngine !== 'undefined') {
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

        // ============================================================
        // 6i. 正確解答
        // ============================================================
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

        // ============================================================
        // 6j. 題幹解析
        // ============================================================
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
    // 7. 暴露到全域
    // ============================================================
    window.renderQuestion = renderQuestion;
    window.getTypeSpec = getTypeSpec;

    console.log('✅ 36_渲染_主入口 v10.4.0 已載入');
    console.log('   🎯 支援 8 大題型渲染');
    console.log('   📦 每個題型使用獨立容器');
    console.log('   🔄 切換時自動顯示/隱藏');
    console.log('   ✅ 排序題使用 answerContainer1 + answerContainer2');

})();