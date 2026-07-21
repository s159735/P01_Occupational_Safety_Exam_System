// ============================================================
// 🎯 渲染_是非填空 v10.2.0 (完整版)
// 職責：是非題、填空題渲染
// 格式依據：乙級術科電腦測驗官方模擬格式
// 更新日期：2026-07-17
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_是非填空 v10.2.0 載入中...');

    // ============================================================
    // 1. 是非題渲染
    // ============================================================
    function renderTrueFalse(q, index, container) {
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

        var saved = window.G_userAnswers[index];

        // 更新題目文字 + 配分
        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '（無題目文字）';
            var points = q.points || '10%';
            textEl.innerHTML = displayText + ' <span style="font-size:16px;color:#e65100;font-weight:600;">(' + points + ')</span>';
        }

        var pointsEl = document.getElementById('questionPoints');
        if (pointsEl) {
            pointsEl.textContent = '(' + (q.points || '10%') + ')';
        }

        // 更新題組
        var groupEl = document.getElementById('questionGroup');
        if (groupEl) {
            if (q.group) {
                groupEl.textContent = '題組 ' + q.group;
                groupEl.style.display = 'block';
            } else {
                groupEl.style.display = 'none';
            }
        }

        // 更新題幹提示
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
        container.style.cssText = 'display:flex;gap:40px;padding:16px 0 8px 0;align-items:center;';

        var options = ['是', '否'];
        options.forEach(function(opt, i) {
            var label = document.createElement('label');
            label.style.cssText = 'display:flex;align-items:center;gap:10px;font-size:20px;font-weight:500;cursor:pointer;padding:8px 16px;border-radius:6px;transition:background 0.2s;';
            
            label.onmouseover = function() { this.style.background = '#f0f4ff'; };
            label.onmouseout = function() { this.style.background = 'transparent'; };

            var isChecked = (saved === i || saved === String(i));
            label.innerHTML = '<input type="radio" name="tf_' + index + '" value="' + i + '" ' + (isChecked ? 'checked' : '') + ' style="width:20px;height:20px;cursor:pointer;accent-color:#1a237e;"><span style="font-size:20px;">' + opt + '</span>';
            
            label.onclick = function(e) {
                if (e.target.tagName !== 'INPUT') {
                    var radio = this.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        var event = new Event('change', { bubbles: true });
                        radio.dispatchEvent(event);
                    }
                }
            };

            var radio = label.querySelector('input[type="radio"]');
            radio.onchange = function() {
                var val = parseInt(this.value);
                if (typeof saveAnswer === 'function') {
                    saveAnswer(index, val);
                } else {
                    window.G_userAnswers[index] = val;
                    if (typeof updateAnsweredCount === 'function') {
                        updateAnsweredCount();
                    }
                }
                var allLabels = container.querySelectorAll('label');
                allLabels.forEach(function(lbl) {
                    lbl.style.background = 'transparent';
                });
                if (this.checked) {
                    label.style.background = '#e8f0fe';
                }
            };

            if (isChecked) {
                label.style.background = '#e8f0fe';
            }

            container.appendChild(label);
        });

        var helper = document.createElement('div');
        helper.style.cssText = 'width:100%;margin-top:8px;padding:6px 12px;font-size:14px;color:#999;text-align:left;';
        helper.textContent = '點選 ○ 是 或 ○ 否 作答';
        container.appendChild(helper);

        console.log('✅ 是非題渲染完成: 第', index + 1, '題');
    }

    // ============================================================
    // 2. 題幹格式化（填空題專用）
    // ============================================================
    function formatFillText(text) {
        if (!text) return text;
        var result = text.replace(
            /([一二三四五六七八九十]+、|（[一二三四五六七八九十]+）|\([一二三四五六七八九十]+\)|[一二三四五六七八九十]+\.\s*|[A-Z]、|[A-Z]\.\s*|\([A-Z]\))/g,
            '\n'
        );
        return result.trim();
    }

    // ============================================================
    // 3. 填空題渲染
    // ============================================================
    function renderFill(q, index, container) {
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

        var saved = String(window.G_userAnswers[index] || '').split(/[、，,、\s]+/).filter(function(s) { return s && s.trim() !== ''; });
        if (!Array.isArray(saved)) {
            saved = [];
        }

        var blankMatches = (q.text || "").match(/【___】/g);
        var numSlots = blankMatches ? blankMatches.length : 1;

        var letterMatches = (q.text || "").match(/[A-Z](?=、|\.|\)|日|項|款|年|分|秒|人|個|次|倍|%|度|公尺|公分|公噸|公斤|公升|毫西弗|ppm|dBA|dB|Hz|Ω|W|V|A|m|cm|mm|km|kg|g|mg|μg|L|mL|m³|cm²|m²)/g);
        if (letterMatches && letterMatches.length > numSlots) {
            numSlots = letterMatches.length;
        }

        var totalPoints = q.points || '10%';
        var pointsPerItem = q.pointsPerItem || Math.round(parseFloat(totalPoints) / numSlots) + '%';

        while (saved.length < numSlots) {
            saved.push('');
        }
        saved = saved.slice(0, numSlots);

        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '（無題目文字）';
            textEl.innerHTML = displayText + ' <span style="font-size:16px;color:#e65100;font-weight:600;">(' + totalPoints + ')</span>';
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
        container.style.cssText = 'display:flex;flex-direction:column;gap:14px;padding:16px 0 8px 0;';

        for (var i = 0; i < numSlots; i++) {
            var val = (saved && saved.length > i && saved[i]) ? saved[i] : '';
            var letter = String.fromCharCode(65 + i);

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

            input.onfocus = function() {
                if (typeof openKeyboardForFillInput === 'function') {
                    openKeyboardForFillInput(this);
                }
                this.style.borderBottom = '3px solid #067ae0';
                this.style.background = 'rgba(6,122,224,0.08)';
            };

            input.onblur = function() {
                var hasValue = this.value && this.value.trim() !== '';
                this.style.borderBottom = hasValue ? '3px solid #2e7d32' : '3px solid #888';
                this.style.background = hasValue ? 'rgba(46,125,50,0.12)' : 'rgba(46,125,50,0.06)';
            };

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
                if (typeof saveFillAnswer === 'function') {
                    saveFillAnswer(index, this.value, parseInt(this.dataset.index));
                } else {
                    var current = window.G_userAnswers[index] ? window.G_userAnswers[index].split(/[、，,、\s]+/) : [];
                    while (current.length <= parseInt(this.dataset.index)) {
                        current.push('');
                    }
                    current[parseInt(this.dataset.index)] = this.value;
                    current = current.filter(function(v) { return v && v.trim() !== ''; });
                    while (current.length < numSlots) {
                        current.push('');
                    }
                    window.G_userAnswers[index] = current.join('、');
                    if (typeof updateAnsweredCount === 'function') {
                        updateAnsweredCount();
                    }
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

                if (typeof saveFillAnswer === 'function') {
                    saveFillAnswer(index, this.value, parseInt(this.dataset.index));
                } else {
                    var current = window.G_userAnswers[index] ? window.G_userAnswers[index].split(/[、，,、\s]+/) : [];
                    while (current.length <= parseInt(this.dataset.index)) {
                        current.push('');
                    }
                    current[parseInt(this.dataset.index)] = this.value;
                    current = current.filter(function(v) { return v && v.trim() !== ''; });
                    while (current.length < numSlots) {
                        current.push('');
                    }
                    window.G_userAnswers[index] = current.join('、');
                    if (typeof updateAnsweredCount === 'function') {
                        updateAnsweredCount();
                    }
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

            var clearBtn = document.createElement('button');
            clearBtn.textContent = '✕';
            clearBtn.style.cssText = 'background:none;border:none;color:#e05046;cursor:pointer;font-size:16px;padding:0 6px;opacity:0.3;transition:all 0.2s;';
            clearBtn.onmouseover = function() { this.style.opacity = '1'; };
            clearBtn.onmouseout = function() { this.style.opacity = '0.3'; };
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
                    while (current.length < numSlots) {
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

        var helper = document.createElement('div');
        helper.style.cssText = 'margin-top:12px;padding:10px 16px;background:#f5edd6;border-radius:6px;border-left:4px solid #067ae0;font-size:15px;color:#666;text-align:left;display:flex;align-items:center;gap:10px;';
        helper.innerHTML = '⌨️ 點擊輸入框使用螢幕數字鍵盤（僅能輸入數字）';
        container.appendChild(helper);

        console.log('✅ 填空題渲染完成: 第', index + 1, '題');
    }

    // ============================================================
    // 4. 匯出到全域
    // ============================================================
    window.renderTrueFalse = renderTrueFalse;
    window.renderFill = renderFill;
    window.formatFillText = formatFillText;

    console.log('✅ 31_渲染_是非填空 v10.2.0 已載入');
    console.log('   ○ 是非題: 是/否 圓形選鈕');
    console.log('   □ 填空題: 數字輸入框');

})();