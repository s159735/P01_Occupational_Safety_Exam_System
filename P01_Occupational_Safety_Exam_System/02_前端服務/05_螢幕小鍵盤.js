// ============================================================
// ⌨️ 螢幕小鍵盤 - 國家考試規格 v10.2.0
// 職責：提供螢幕數字鍵盤，支援填充題和計算題
// 更新日期：2026-07-18
// ============================================================

(function() {
    'use strict';

    console.log('⌨️ 05_螢幕小鍵盤 v10.2.0 載入中...');

    // ============================================================
    // 1. 狀態變數
    // ============================================================

    var activeInput = null;
    var activeQuestionIndex = -1;
    var activeSlotIndex = -1;

    // ============================================================
    // 2. 儲存計算題答案（修復：新增此函數）
    // ============================================================

    function saveCalcAnswer(questionIndex, value) {
        try {
            if (questionIndex === undefined || questionIndex === null) {
                console.warn('⚠️ saveCalcAnswer: 無效的題目索引');
                return false;
            }

            if (!window.G_userAnswers) {
                window.G_userAnswers = {};
            }

            // 取得目前題目
            var q = window.G_questionData && window.G_questionData[questionIndex];
            if (!q) {
                console.warn('⚠️ saveCalcAnswer: 找不到題目', questionIndex);
                return false;
            }

            // 判斷是否為多子題計算題
            var text = q.text || '';
            var subCount = 0;
            var abPattern = /\([A-Z]\)/g;
            var matches = text.match(abPattern);
            if (matches) {
                subCount = matches.length;
            }
            if (subCount === 0 && Array.isArray(q.answer)) {
                subCount = q.answer.length;
            }
            if (subCount === 0) {
                subCount = 1;
            }

            // 處理值
            var finalValue = value || '';
            if (typeof finalValue === 'string') {
                finalValue = finalValue.trim();
            }

            // 如果有多子題，需要保留其他子題的值
            if (subCount > 1) {
                var existing = window.G_userAnswers[questionIndex] || '';
                var parts = String(existing).split(/[、，,、\s]+/).filter(function(s) { return s && s.trim() !== ''; });
                while (parts.length < subCount) {
                    parts.push('');
                }
                // 更新對應 slot（從 activeSlotIndex 取得）
                var slotIdx = activeSlotIndex;
                if (slotIdx >= 0 && slotIdx < parts.length) {
                    parts[slotIdx] = finalValue;
                } else {
                    // 如果沒有指定 slot，嘗試自動偵測
                    for (var i = 0; i < parts.length; i++) {
                        if (parts[i] === '') {
                            parts[i] = finalValue;
                            break;
                        }
                    }
                }
                // 過濾空值，但保留位置
                parts = parts.filter(function(s) { return s !== ''; });
                while (parts.length < subCount) {
                    parts.push('');
                }
                window.G_userAnswers[questionIndex] = parts.join('、');
            } else {
                window.G_userAnswers[questionIndex] = finalValue;
            }

            // 更新答題計數
            if (typeof updateAnsweredCount === 'function') {
                updateAnsweredCount();
            }

            // 觸發儲存事件
            var event = new CustomEvent('answerSaved', {
                detail: {
                    questionIndex: questionIndex,
                    answer: window.G_userAnswers[questionIndex]
                }
            });
            document.dispatchEvent(event);

            console.log('📝 儲存計算題答案: 第', questionIndex + 1, '題 =', window.G_userAnswers[questionIndex]);
            return true;
        } catch (e) {
            console.error('❌ saveCalcAnswer 錯誤:', e);
            return false;
        }
    }

    // ============================================================
    // 3. 儲存填充題答案（修復：強化此函數）
    // ============================================================

    function saveFillAnswer(questionIndex, value, slotIndex) {
        try {
            if (questionIndex === undefined || questionIndex === null) {
                console.warn('⚠️ saveFillAnswer: 無效的題目索引');
                return false;
            }

            if (!window.G_userAnswers) {
                window.G_userAnswers = {};
            }

            // 取得目前題目
            var q = window.G_questionData && window.G_questionData[questionIndex];
            if (!q) {
                console.warn('⚠️ saveFillAnswer: 找不到題目', questionIndex);
                return false;
            }

            // 計算填空數量
            var blankMatches = (q.text || "").match(/【___】/g);
            var numSlots = blankMatches ? blankMatches.length : 1;
            var letterMatches = (q.text || "").match(/[A-Z](?=、|\.|\)|日|項|款|年|分|秒|人|個|次|倍|%|度|公尺|公分|公噸|公斤|公升|毫西弗|ppm|dBA|dB|Hz|Ω|W|V|A|m|cm|mm|km|kg|g|mg|μg|L|mL|m³|cm²|m²)/g);
            if (letterMatches && letterMatches.length > numSlots) {
                numSlots = letterMatches.length;
            }

            // 處理值
            var finalValue = value || '';
            if (typeof finalValue === 'string') {
                finalValue = finalValue.trim();
            }

            // 取得現有答案
            var existing = window.G_userAnswers[questionIndex] || '';
            var parts = String(existing).split(/[、，,、\s]+/).filter(function(s) { return s && s.trim() !== ''; });
            while (parts.length < numSlots) {
                parts.push('');
            }

            // 更新對應 slot
            var idx = (slotIndex !== undefined && slotIndex !== null) ? slotIndex : activeSlotIndex;
            if (idx >= 0 && idx < parts.length) {
                parts[idx] = finalValue;
            } else {
                // 自動填入第一個空位
                for (var i = 0; i < parts.length; i++) {
                    if (parts[i] === '') {
                        parts[i] = finalValue;
                        break;
                    }
                }
            }

            // 過濾空值，保留位置
            parts = parts.filter(function(s) { return s !== ''; });
            while (parts.length < numSlots) {
                parts.push('');
            }

            window.G_userAnswers[questionIndex] = parts.join('、');

            // 更新答題計數
            if (typeof updateAnsweredCount === 'function') {
                updateAnsweredCount();
            }

            // 觸發儲存事件
            var event = new CustomEvent('answerSaved', {
                detail: {
                    questionIndex: questionIndex,
                    slotIndex: idx,
                    answer: window.G_userAnswers[questionIndex]
                }
            });
            document.dispatchEvent(event);

            console.log('📝 儲存填充題答案: 第', questionIndex + 1, '題 slot', idx, '=', finalValue);
            return true;
        } catch (e) {
            console.error('❌ saveFillAnswer 錯誤:', e);
            return false;
        }
    }

    // ============================================================
    // 4. 開啟小鍵盤（原有功能，強化）
    // ============================================================

    function openKeyboardForFillInput(input) {
        if (!input) return;

        activeInput = input;
        activeQuestionIndex = window.G_currentQuestionIndex || 0;
        activeSlotIndex = parseInt(input.dataset.index) || 0;

        var keyboard = document.getElementById('virtualKeyboard');
        if (!keyboard) return;

        keyboard.classList.add('active');

        var rect = input.getBoundingClientRect();
        var keyboardHeight = keyboard.offsetHeight || 120;
        var viewportHeight = window.innerHeight;

        var top = rect.bottom + 4;
        if (top + keyboardHeight > viewportHeight - 10) {
            top = rect.top - keyboardHeight - 4;
        }
        if (top < 10) top = 10;
        keyboard.style.top = top + 'px';
        keyboard.style.bottom = 'auto';

        var left = rect.left + (rect.width - keyboard.offsetWidth) / 2;
        keyboard.style.left = Math.max(10, left) + 'px';
        keyboard.style.transform = 'none';

        input.focus();
        input.style.borderBottomColor = '#067ae0';
        input.style.background = '#f5f5f5';

        // 更新鍵盤標題
        var titleEl = keyboard.querySelector('.keyboard-title');
        if (titleEl) {
            var isCalc = input.classList.contains('calc-input') || input.classList.contains('calc-input-sub');
            titleEl.textContent = isCalc ? '🧮 計算題輸入' : '📝 填充題輸入';
        }
    }

    // ============================================================
    // 5. 顯示小鍵盤（別名，向後相容）
    // ============================================================

    function showKeyboardForInput(input) {
        openKeyboardForFillInput(input);
    }

    // ============================================================
    // 6. 關閉小鍵盤
    // ============================================================

    function closeKeyboard() {
        var keyboard = document.getElementById('virtualKeyboard');
        if (keyboard) keyboard.classList.remove('active');

        if (activeInput) {
            activeInput.style.borderBottomColor = '';
            activeInput.style.borderColor = '';
            activeInput.style.boxShadow = '';
            activeInput.style.background = '';
            activeInput = null;
        }
        activeQuestionIndex = -1;
        activeSlotIndex = -1;
    }

    // ============================================================
    // 7. 鍵盤按鍵輸入（核心功能）
    // ============================================================

    function keyboardInput(value) {
        if (!activeInput) {
            // 嘗試自動尋找輸入框
            var firstInput = document.querySelector('.fill-input-field, .calc-input, .calc-input-sub');
            if (firstInput) {
                activeInput = firstInput;
                activeQuestionIndex = window.G_currentQuestionIndex || 0;
                activeSlotIndex = parseInt(firstInput.dataset.index) || 0;
                openKeyboardForFillInput(firstInput);
            } else {
                console.warn('⚠️ keyboardInput: 沒有 activeInput');
                return;
            }
        }

        var input = activeInput;
        var start = input.selectionStart || 0;
        var end = input.selectionEnd || 0;
        var currentValue = input.value || '';

        // 判斷輸入類型
        var isCalc = input.classList.contains('calc-input') || input.classList.contains('calc-input-sub');
        var isFill = input.classList.contains('fill-input-field');

        switch (value) {
            case 'backspace':
                if (start === end && start > 0) {
                    input.value = currentValue.substring(0, start - 1) + currentValue.substring(end);
                    input.selectionStart = input.selectionEnd = start - 1;
                } else if (start < end) {
                    input.value = currentValue.substring(0, start) + currentValue.substring(end);
                    input.selectionStart = input.selectionEnd = start;
                }
                break;

            case 'clear':
                input.value = '';
                input.selectionStart = input.selectionEnd = 0;
                break;

            case 'enter':
                // 儲存答案
                if (isCalc) {
                    var qIdx = activeQuestionIndex !== undefined ? activeQuestionIndex : window.G_currentQuestionIndex;
                    saveCalcAnswer(qIdx, input.value);
                } else if (isFill) {
                    var qIdx = activeQuestionIndex !== undefined ? activeQuestionIndex : window.G_currentQuestionIndex;
                    var slotIdx = parseInt(input.dataset.index) || 0;
                    saveFillAnswer(qIdx, input.value, slotIdx);
                }
                closeKeyboard();

                // 重新渲染題目以更新 UI
                if (typeof renderQuestion === 'function') {
                    renderQuestion(window.G_currentQuestionIndex || 0);
                }
                return;

            default:
                // 一般輸入（僅允許數字、小數點、負號）
                var cleaned = value.replace(/[^0-9.\-]/g, '');
                if (cleaned !== value) {
                    console.warn('⚠️ 過濾無效字元:', value, '→', cleaned);
                }
                input.value = currentValue.substring(0, start) + cleaned + currentValue.substring(end);
                input.selectionStart = input.selectionEnd = start + cleaned.length;

                // 自動儲存（即時儲存）
                if (isCalc) {
                    var qIdx = activeQuestionIndex !== undefined ? activeQuestionIndex : window.G_currentQuestionIndex;
                    saveCalcAnswer(qIdx, input.value);
                } else if (isFill) {
                    var qIdx = activeQuestionIndex !== undefined ? activeQuestionIndex : window.G_currentQuestionIndex;
                    var slotIdx = parseInt(input.dataset.index) || 0;
                    saveFillAnswer(qIdx, input.value, slotIdx);
                }
                break;
        }

        // 觸發 input 事件
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();

        // 更新樣式
        var hasValue = input.value && input.value.trim() !== '';
        input.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
        input.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
    }

    // ============================================================
    // 8. 匯出到全域
    // ============================================================

    window.openKeyboardForFillInput = openKeyboardForFillInput;
    window.showKeyboardForInput = showKeyboardForInput;
    window.closeKeyboard = closeKeyboard;
    window.keyboardInput = keyboardInput;
    window.saveCalcAnswer = saveCalcAnswer;
    window.saveFillAnswer = saveFillAnswer;

    console.log('✅ 05_螢幕小鍵盤 v10.2.0 已載入');
    console.log('   ⌨️ 支援 計算題 和 填充題 輸入');
    console.log('   💾 saveCalcAnswer 和 saveFillAnswer 已註冊');

})();