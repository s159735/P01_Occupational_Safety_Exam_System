// ============================================================
// 🎯 渲染_計算題 v10.2.0 (完整版)
// 職責：計算題渲染（含多子題支援、數字鍵盤限制）
// 格式依據：乙級術科電腦測驗官方模擬格式
// 更新日期：2026-07-17
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_計算題 v10.2.0 載入中...');

    // ============================================================
    // 1. 計算題渲染
    // ============================================================
    function renderCalc(q, index, container) {
        if (!q) {
            if (container) container.innerHTML = '<div style="padding:10px;color:#999;">題目資料不存在</div>';
            return;
        }

        if (!window.G_userAnswers) {
            window.G_userAnswers = [];
        }
        if (window.G_userAnswers[index] === undefined || window.G_userAnswers[index] === null) {
            window.G_userAnswers[index] = '';
        }

        var saved = String(window.G_userAnswers[index] || '').split(/[，,、\s]+/).filter(function(s) { return s && s.trim() !== ''; });
        if (!Array.isArray(saved)) {
            saved = [];
        }

        var totalPoints = q.points || '10%';
        var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        // 判斷子題數量
        var text = q.text || '';
        var subQuestionCount = 0;

        var abPattern = /\([A-Z]\)/g;
        var matches = text.match(abPattern);
        if (matches) {
            subQuestionCount = matches.length;
        }

        if (subQuestionCount === 0 && Array.isArray(q.answer)) {
            subQuestionCount = q.answer.length;
        }

        if (subQuestionCount === 0) {
            var qmMatches = text.match(/[？?]/g);
            if (qmMatches) {
                subQuestionCount = qmMatches.length;
            }
        }

        if (subQuestionCount === 0) {
            subQuestionCount = 1;
        }

        while (saved.length < subQuestionCount) {
            saved.push('');
        }
        saved = saved.slice(0, subQuestionCount);

        var pointsPerItem = q.pointsPerItem || Math.round(parseFloat(totalPoints) / subQuestionCount) + '%';

        // 更新題目文字
        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '（無題目文字）';
            textEl.innerHTML = displayText;
        }

        // 更新配分
        var typeBadge = document.getElementById('questionTypeBadge');
        if (typeBadge) {
            var typeLabel = q.typeLabel || '計算題';
            typeBadge.textContent = typeLabel + ' (' + totalPoints + ')';
        }

        var pointsEl = document.getElementById('questionPoints');
        if (pointsEl) {
            pointsEl.textContent = '(' + totalPoints + ')';
        }

        var groupEl = document.getElementById('questionGroup');
        if (groupEl) {
            if (q.group) {
                groupEl.textContent = '題組 ' + q.group;
                groupEl.style.display = 'block';
            } else {
                groupEl.style.display = 'none';
            }
        }

        var stemEl = document.querySelector('.row-4');
        if (stemEl) {
            if (q.stem) {
                stemEl.textContent = q.stem;
            } else {
                stemEl.textContent = '試回答下列問題：';
            }
        }

        if (!container) {
            container = document.getElementById('dropTargetArea') || document.getElementById('options-container');
        }
        if (!container) {
            console.warn('⚠️ 找不到容器');
            return;
        }

        container.innerHTML = '';
        container.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding:16px 0 8px 0;';

        // 顯示公式（若有）
        if (q.formulaKey && window.FORMULA_MAP && window.FORMULA_MAP[q.formulaKey]) {
            var formula = window.FORMULA_MAP[q.formulaKey];
            var formulaDisplay = formula.display || q.formulaKey;
            var formulaDesc = formula.desc || '';
            
            var formulaBox = document.createElement('div');
            formulaBox.style.cssText = 'padding:10px 16px;background:#e3f2fd;border-radius:6px;border-left:4px solid #0d47a1;margin-bottom:8px;';
            formulaBox.innerHTML = '<strong>📐 公式：</strong><span style="font-family:monospace;font-size:16px;">' + formulaDisplay + '</span>' + 
                (formulaDesc ? ' <span style="color:#666;font-size:14px;">（' + formulaDesc + '）</span>' : '');
            container.appendChild(formulaBox);
        }

        // 渲染子題
        if (subQuestionCount === 1) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:4px 0;';

            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'calc-input';
            input.placeholder = '請輸入計算結果';
            input.value = saved[0] || '';
            input.inputMode = 'decimal';
            input.style.cssText = 'flex:1;max-width:400px;padding:8px 16px;background:rgba(46,125,50,0.06);border:none;border-bottom:3px solid #888;font-size:20px;text-align:center;color:#1a1a2e;border-radius:4px 4px 0 0;outline:none;font-weight:600;transition:all 0.3s ease;';

            if (saved[0]) {
                input.style.borderBottom = '3px solid #2e7d32';
                input.style.background = 'rgba(46,125,50,0.12)';
            }

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

            input.onpaste = function(e) {
                e.preventDefault();
                var pasted = (e.clipboardData || window.clipboardData).getData('text');
                var cleaned = pasted.replace(/[^0-9.\-]/g, '');
                this.value = cleaned;
                var allInputs = container.querySelectorAll('.calc-input, .calc-input-sub');
                var values = [];
                allInputs.forEach(function(inp) {
                    values.push(inp.value.trim());
                });
                window.G_userAnswers[index] = values.join('、');
                if (typeof updateAnsweredCount === 'function') {
                    updateAnsweredCount();
                }
                var hasValue = this.value && this.value.trim() !== '';
                this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
            };

            input.oninput = function() {
                var cleaned = this.value.replace(/[^0-9.\-]/g, '');
                if (cleaned !== this.value) {
                    this.value = cleaned;
                }
                var allInputs = container.querySelectorAll('.calc-input, .calc-input-sub');
                var values = [];
                allInputs.forEach(function(inp) {
                    values.push(inp.value.trim());
                });
                window.G_userAnswers[index] = values.join('、');
                if (typeof updateAnsweredCount === 'function') {
                    updateAnsweredCount();
                }
                var hasValue = this.value && this.value.trim() !== '';
                this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
            };

            input.onfocus = function() {
                if (typeof showKeyboardForInput === 'function') {
                    showKeyboardForInput(this);
                }
                this.style.borderBottom = '3px solid #067ae0';
                this.style.background = 'rgba(6,122,224,0.08)';
            };

            input.onblur = function() {
                var hasValue = this.value && this.value.trim() !== '';
                this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
            };

            row.appendChild(input);

            var pointsSpan = document.createElement('span');
            pointsSpan.textContent = '(' + pointsPerItem + ')';
            pointsSpan.style.cssText = 'font-size:14px;color:#666;min-width:50px;text-align:right;';
            row.appendChild(pointsSpan);

            var clearBtn = document.createElement('button');
            clearBtn.textContent = '✕';
            clearBtn.style.cssText = 'background:none;border:none;color:#e05046;cursor:pointer;font-size:16px;padding:0 6px;opacity:' + (saved[0] ? '0.4' : '0.1') + ';transition:all 0.2s;';
            clearBtn.onmouseover = function() { this.style.opacity = '1'; };
            clearBtn.onmouseout = function() { this.style.opacity = saved[0] ? '0.4' : '0.1'; };
            clearBtn.onclick = function() {
                window.G_userAnswers[index] = '';
                if (typeof renderQuestion === 'function') {
                    renderQuestion(index);
                }
                if (typeof updateAnsweredCount === 'function') {
                    updateAnsweredCount();
                }
            };
            row.appendChild(clearBtn);

            container.appendChild(row);

        } else {
            // 多子題
            for (var i = 0; i < subQuestionCount; i++) {
                var val = (saved && saved.length > i && saved[i]) ? saved[i] : '';
                var letter = labels[i] || String.fromCharCode(65 + i);

                var row = document.createElement('div');
                row.className = 'calc-sub-row';
                row.dataset.slot = i;
                row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:6px 8px;border-bottom:1px solid #f5f5f5;';

                var label = document.createElement('span');
                label.textContent = '(' + letter + ')';
                label.style.cssText = 'font-weight:700;color:#1a1a2e;min-width:40px;font-size:18px;';
                row.appendChild(label);

                var input = document.createElement('input');
                input.type = 'text';
                input.className = 'calc-input-sub';
                input.dataset.subIndex = i;
                input.placeholder = '請輸入答案';
                input.value = val;
                input.inputMode = 'decimal';
                input.style.cssText = 'flex:1;max-width:350px;padding:6px 12px;background:rgba(46,125,50,0.06);border:none;border-bottom:3px solid #888;font-size:18px;text-align:center;color:#1a1a2e;border-radius:4px 4px 0 0;outline:none;font-weight:600;transition:all 0.3s ease;';

                if (val) {
                    input.style.borderBottom = '3px solid #2e7d32';
                    input.style.background = 'rgba(46,125,50,0.12)';
                }

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

                input.onpaste = function(e) {
                    e.preventDefault();
                    var pasted = (e.clipboardData || window.clipboardData).getData('text');
                    var cleaned = pasted.replace(/[^0-9.\-]/g, '');
                    this.value = cleaned;
                    var allInputs = container.querySelectorAll('.calc-input, .calc-input-sub');
                    var values = [];
                    allInputs.forEach(function(inp) {
                        values.push(inp.value.trim());
                    });
                    window.G_userAnswers[index] = values.join('、');
                    if (typeof updateAnsweredCount === 'function') {
                        updateAnsweredCount();
                    }
                    var hasValue = this.value && this.value.trim() !== '';
                    this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                    this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
                };

                input.oninput = function() {
                    var cleaned = this.value.replace(/[^0-9.\-]/g, '');
                    if (cleaned !== this.value) {
                        this.value = cleaned;
                    }
                    var allInputs = container.querySelectorAll('.calc-input, .calc-input-sub');
                    var values = [];
                    allInputs.forEach(function(inp) {
                        values.push(inp.value.trim());
                    });
                    window.G_userAnswers[index] = values.join('、');
                    if (typeof updateAnsweredCount === 'function') {
                        updateAnsweredCount();
                    }
                    var hasValue = this.value && this.value.trim() !== '';
                    this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                    this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
                };

                input.onfocus = function() {
                    if (typeof showKeyboardForInput === 'function') {
                        showKeyboardForInput(this);
                    }
                    this.style.borderBottom = '3px solid #067ae0';
                    this.style.background = 'rgba(6,122,224,0.08)';
                };

                input.onblur = function() {
                    var hasValue = this.value && this.value.trim() !== '';
                    this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                    this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
                };

                row.appendChild(input);

                var pointsSpan = document.createElement('span');
                pointsSpan.textContent = '(' + pointsPerItem + ')';
                pointsSpan.style.cssText = 'font-size:14px;color:#666;min-width:50px;text-align:right;';
                row.appendChild(pointsSpan);

                var clearBtn = document.createElement('button');
                clearBtn.textContent = '✕';
                clearBtn.style.cssText = 'background:none;border:none;color:#e05046;cursor:pointer;font-size:16px;padding:0 6px;opacity:' + (val ? '0.4' : '0.1') + ';transition:all 0.2s;';
                clearBtn.onmouseover = function() { this.style.opacity = '1'; };
                clearBtn.onmouseout = function() { this.style.opacity = val ? '0.4' : '0.1'; };
                clearBtn.onclick = (function(slotIndex) {
                    return function() {
                        var current = window.G_userAnswers[index] ? window.G_userAnswers[index].split(/[、，,、\s]+/) : [];
                        if (!Array.isArray(current)) {
                            current = [];
                        }
                        while (current.length <= slotIndex) {
                            current.push('');
                        }
                        current[slotIndex] = '';
                        current = current.filter(function(v) { return v && v.trim() !== ''; });
                        while (current.length < subQuestionCount) {
                            current.push('');
                        }
                        window.G_userAnswers[index] = current.join('、');
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
        }

        // 計算機輔助按鈕
        var calcRow = document.createElement('div');
        calcRow.style.cssText = 'display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;';

        var calcBtn = document.createElement('button');
        calcBtn.textContent = '🧮 開啟計算機';
        calcBtn.style.cssText = 'padding:8px 20px;background:#fff;border:2px solid #1a237e;border-radius:6px;color:#1a237e;font-size:15px;cursor:pointer;transition:all 0.2s;';
        calcBtn.onmouseover = function() { this.style.background = '#e8f0fe'; };
        calcBtn.onmouseout = function() { this.style.background = '#fff'; };
        calcBtn.onclick = function() {
            if (typeof window.toggleCalculator === 'function') {
                window.toggleCalculator();
            } else {
                alert('🧮 計算機功能：請自行使用系統計算機或手算');
            }
        };
        calcRow.appendChild(calcBtn);

        var hint = document.createElement('span');
        hint.textContent = '💡 僅能輸入數字、小數點、負號，可使用計算機輔助';
        hint.style.cssText = 'font-size:14px;color:#999;align-self:center;margin-left:8px;';
        calcRow.appendChild(hint);

        container.appendChild(calcRow);

        console.log('✅ 計算題渲染完成: 第', index + 1, '題');
    }

    // ============================================================
    // 2. 匯出到全域
    // ============================================================
    window.renderCalc = renderCalc;

    console.log('✅ 32_渲染_計算題 v10.2.0 已載入');
    console.log('   🧮 計算題: 支援單一/多子題 + 計算機按鈕');

})();