// ============================================================
// 🆕 填充題支援 - v10.2.0 (完整版)
// 功能：在術科和法規測驗中顯示填充題
// 更新日期：2026-07-17
// ============================================================

(function() {
    'use strict';

    console.log('📝 填充題支援模組 v10.2.0 載入中...');

    var currentFillQuestion = null;
    var currentFillIndex = -1;

    // ============================================================
    // 渲染填充題
    // ============================================================
    function renderFillQuestion(q, index) {
        if (!q || q.type !== 'fill') {
            return;
        }

        console.log('📝 渲染填充題 (完整版):', q.id);

        currentFillQuestion = q;
        currentFillIndex = index;

        var container = document.getElementById('options-container');
        if (!container) return;

        // 從題目 text 中偵測填空數量（【___】或 A、B、C 標記）
        var blanks = q.blanks || [];
        var numSlots = blanks.length;
        if (numSlots === 0) {
            var blankMatches = (q.text || "").match(/【___】/g);
            numSlots = blankMatches ? blankMatches.length : 1;
        }

        var totalPoints = q.points || '10%';
        var pointsPerItem = q.pointsPerItem || Math.round(parseFloat(totalPoints) / numSlots) + '%';
        var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        var saved = window.userAnswers && window.userAnswers[index] ? 
            String(window.userAnswers[index]).split(/[、，,、\s]+/).filter(function(s) { return s && s.trim() !== ''; }) : [];

        container.innerHTML = '';
        container.style.cssText = 'display:flex;flex-direction:column;gap:14px;padding:16px 0 8px 0;';

        for (var i = 0; i < numSlots; i++) {
            var val = (saved && saved.length > i && saved[i]) ? saved[i] : '';
            var letter = labels[i] || String.fromCharCode(65 + i);

            var row = document.createElement('div');
            row.className = 'fill-row';
            row.dataset.slot = i;
            row.style.cssText = 'display:flex;align-items:center;gap:16px;padding:6px 8px;border-bottom:1px solid #f5f5f5;';

            var label = document.createElement('span');
            label.textContent = '(' + letter + ')';
            label.style.cssText = 'font-weight:700;color:#1a1a2e;min-width:40px;font-size:20px;';
            row.appendChild(label);

            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'fill-input-field';
            input.dataset.index = i;
            input.placeholder = '請輸入數字';
            input.value = val;
            input.inputMode = 'decimal';
            input.style.cssText = 'flex:1;max-width:350px;padding:6px 12px;background:rgba(46,125,50,0.06);border:none;border-bottom:3px solid #888;font-size:20px;text-align:center;color:#1a1a2e;border-radius:4px 4px 0 0;outline:none;font-weight:600;transition:all 0.3s ease;';

            if (val) {
                input.style.borderBottom = '3px solid #2e7d32';
                input.style.background = 'rgba(46,125,50,0.12)';
            }

            // 聚焦事件
            input.onfocus = function() {
                if (typeof openKeyboardForFillInput === 'function') {
                    openKeyboardForFillInput(this);
                }
                this.style.borderBottom = '3px solid #067ae0';
                this.style.background = 'rgba(6,122,224,0.08)';
            };

            // 失焦事件
            input.onblur = function() {
                var hasValue = this.value && this.value.trim() !== '';
                this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
            };

            // 限制輸入：僅允許數字、小數點、負號
            input.onkeydown = function(e) {
                var key = e.key;
                var allowedKeys = ['0','1','2','3','4','5','6','7','8','9','.','-','Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter','Home','End'];
                if (allowedKeys.indexOf(key) !== -1) {
                    return true;
                }
                if (e.ctrlKey && (key === 'c' || key === 'v' || key === 'x' || key === 'a')) {
                    return true;
                }
                e.preventDefault();
                return false;
            };

            // 貼上事件（過濾非數字字元）
            input.onpaste = function(e) {
                e.preventDefault();
                var pasted = (e.clipboardData || window.clipboardData).getData('text');
                var cleaned = pasted.replace(/[^0-9.\-]/g, '');
                this.value = cleaned;
                if (typeof saveFillAnswer === 'function') {
                    saveFillAnswer(index, this.value, parseInt(this.dataset.index));
                }
                var hasValue = this.value && this.value.trim() !== '';
                this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
            };

            // 輸入事件
            input.oninput = function() {
                var cleaned = this.value.replace(/[^0-9.\-]/g, '');
                if (cleaned !== this.value) {
                    this.value = cleaned;
                }
                if (typeof saveFillAnswer === 'function') {
                    saveFillAnswer(index, this.value, parseInt(this.dataset.index));
                }
                var hasValue = this.value && this.value.trim() !== '';
                this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
            };

            row.appendChild(input);

            var pointsSpan = document.createElement('span');
            pointsSpan.textContent = '(' + pointsPerItem + ')';
            pointsSpan.style.cssText = 'font-size:14px;color:#666;min-width:50px;text-align:right;';
            row.appendChild(pointsSpan);

            // 清除按鈕
            var clearBtn = document.createElement('button');
            clearBtn.textContent = '✕';
            clearBtn.style.cssText = 'background:none;border:none;color:#e05046;cursor:pointer;font-size:16px;padding:0 6px;opacity:0.3;transition:all 0.2s;';
            clearBtn.onmouseover = function() { this.style.opacity = '1'; };
            clearBtn.onmouseout = function() { this.style.opacity = '0.3'; };
            clearBtn.onclick = (function(slotIndex) {
                return function() {
                    var current = window.userAnswers[index] ? window.userAnswers[index].split(/[、，,、\s]+/) : [];
                    if (!Array.isArray(current)) {
                        current = [];
                    }
                    while (current.length <= slotIndex) {
                        current.push('');
                    }
                    current[slotIndex] = '';
                    current = current.filter(function(v) { return v && v.trim() !== ''; });
                    while (current.length < numSlots) {
                        current.push('');
                    }
                    window.userAnswers[index] = current.join('、');
                    if (typeof renderQuestion === 'function') {
                        renderQuestion(index);
                    }
                    if (typeof updateAnsweredCount === 'function') {
                        updateAnsweredCount();
                    }
                };
            })(i);

            row.appendChild(clearBtn);
            container.appendChild(row);
        }

        // 輔助訊息
        var helper = document.createElement('div');
        helper.style.cssText = 'margin-top:12px;padding:10px 16px;background:#f5edd6;border-radius:6px;border-left:4px solid #067ae0;font-size:15px;color:#666;text-align:left;display:flex;align-items:center;gap:10px;';
        helper.innerHTML = '⌨️ 點擊輸入框使用螢幕數字鍵盤（僅能輸入數字）';
        container.appendChild(helper);

        console.log('✅ 填充題渲染完成 (完整版): 第', index + 1, '題');
    }

    // ============================================================
    // 儲存填充題答案
    // ============================================================
    function saveFillAnswer(index, value, slotIndex) {
        var current = window.userAnswers[index] ? window.userAnswers[index].split(/[、，,、\s]+/) : [];
        if (!Array.isArray(current)) {
            current = [];
        }
        while (current.length <= slotIndex) {
            current.push('');
        }
        current[slotIndex] = value;
        current = current.filter(function(v) { return v && v.trim() !== ''; });
        while (current.length < 10) {
            current.push('');
        }
        window.userAnswers[index] = current.join('、');
        if (typeof updateAnsweredCount === 'function') {
            updateAnsweredCount();
        }
    }

    // ============================================================
    // 註冊到全域
    // ============================================================
    window.renderFillQuestion = renderFillQuestion;
    window.saveFillAnswer = saveFillAnswer;
    window._fillSupportReady = true;

    // ============================================================
    // 初始化填充題支援
    // ============================================================
    function initFillSupport() {
        console.log('📝 初始化填充題支援 (v10.2.0)...');
        if (window.app) {
            var originalUpdate = window.app.updateDisplay;
            window.app.updateDisplay = function() {
                if (typeof originalUpdate === 'function') {
                    originalUpdate.call(this);
                }
                var q = this.questions && this.questions[this.currentIndex];
                if (q && q.type === 'fill') {
                    setTimeout(function() {
                        renderFillQuestion(q, this.currentIndex);
                    }.bind(this), 50);
                }
            };
            console.log('✅ 填充題支援已整合到 Vue (v10.2.0)');
        } else {
            var checkVue = setInterval(function() {
                if (window.app) {
                    clearInterval(checkVue);
                    initFillSupport();
                }
            }, 200);
        }
    }

    if (document.readyState === 'complete') {
        setTimeout(initFillSupport, 100);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initFillSupport, 100);
        });
    }

    console.log('✅ 填充題支援模組 v10.2.0 載入完成');
})();