// ============================================================
// 🎯 渲染_單選複選 v10.2.0 (完整版)
// 職責：單選題、複選題渲染
// 格式依據：乙級術科電腦測驗官方模擬格式
// 更新日期：2026-07-18
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_單選複選 v10.2.0 載入中...');

    // ============================================================
    // 1. 圖片上傳擴充接口（保留）
    // ============================================================
    window.ImageUploadExtension = window.ImageUploadExtension || {
        enabled: true,
        uploadImage: function(file, callback) {
            console.log('📷 圖片上傳擴充功能已啟用 (待實作)', file);
            if (typeof callback === 'function') {
                callback(null, { url: null, message: '圖片上傳功能保留擴充' });
            }
        },
        renderImage: function(imageUrl, container) {
            if (imageUrl && container) {
                var img = document.createElement('img');
                img.src = imageUrl;
                img.style.cssText = 'max-width:100%;max-height:200px;margin:8px 0;border-radius:4px;border:1px solid #ddd;';
                container.appendChild(img);
            }
        }
    };

    // ============================================================
    // 2. 輔助函數：確保 G_userAnswers 存在
    // ============================================================
    function ensureAnswers(index) {
        if (!window.G_userAnswers) {
            window.G_userAnswers = {};
        }
        if (window.G_userAnswers[index] === undefined || window.G_userAnswers[index] === null) {
            window.G_userAnswers[index] = '';
        }
        return window.G_userAnswers;
    }

    // ============================================================
    // 3. 單選題渲染
    // ============================================================
    function renderChoice(q, index, container) {
        if (!q) {
            if (container) container.innerHTML = '<div style="padding:10px;color:#999;">題目資料不存在</div>';
            return;
        }

        // ✅ 修復：統一使用 G_userAnswers
        ensureAnswers(index);
        var saved = window.G_userAnswers[index];

        var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        var totalPoints = q.points || '10%';

        // 更新題目文字
        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '（無題目文字）';
            textEl.innerHTML = displayText;
        }

        var pointsEl = document.getElementById('questionPoints');
        if (pointsEl) {
            pointsEl.textContent = '(' + totalPoints + ')';
        }

        // 獲取容器
        if (!container) {
            container = document.getElementById('dropTargetArea') || document.getElementById('options-container');
        }
        if (!container) {
            console.warn('⚠️ 找不到容器');
            return;
        }

        container.innerHTML = '';
        container.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:12px 0;';

        // 圖片（若有）
        if (q.imageUrl && window.ImageUploadExtension.enabled) {
            var imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'margin-bottom:12px;';
            window.ImageUploadExtension.renderImage(q.imageUrl, imgContainer);
            container.appendChild(imgContainer);
        }

        // 渲染選項
        var options = q.options || [];
        options.forEach(function(opt, i) {
            var label = document.createElement('label');
            label.className = 'choice-option';
            label.style.cssText = 'display:flex;align-items:center;gap:14px;padding:10px 16px;border-radius:6px;cursor:pointer;font-size:18px;transition:background 0.2s, border-color 0.2s;border:2px solid transparent;';

            var isChecked = (saved === i || saved === String(i));

            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'q_' + index;
            radio.value = i;
            radio.checked = isChecked;
            radio.style.cssText = 'width:20px;height:20px;cursor:pointer;accent-color:#1a237e;flex-shrink:0;';

            var labelSpan = document.createElement('span');
            labelSpan.textContent = '(' + (labels[i] || (i + 1)) + ')';
            labelSpan.style.cssText = 'font-weight:700;color:#1a1a2e;min-width:32px;';

            var textSpan = document.createElement('span');
            textSpan.textContent = opt;
            textSpan.style.cssText = 'color:#1a1a2e;';

            label.appendChild(radio);
            label.appendChild(labelSpan);
            label.appendChild(textSpan);

            if (isChecked) {
                label.style.background = '#e8f0fe';
                label.style.borderColor = '#1a237e';
            }

            label.onmouseover = function() {
                if (!this.querySelector('input[type="radio"]').checked) {
                    this.style.background = '#f5f7fa';
                    this.style.borderColor = '#b0bec5';
                }
            };
            label.onmouseout = function() {
                if (!this.querySelector('input[type="radio"]').checked) {
                    this.style.background = 'transparent';
                    this.style.borderColor = 'transparent';
                }
            };

            radio.onchange = function() {
                var val = parseInt(this.value);
                // ✅ 修復：使用 G_userAnswers
                window.G_userAnswers[index] = val;
                if (typeof updateAnsweredCount === 'function') {
                    updateAnsweredCount();
                }
                var parent = this.closest('label');
                var allLabels = container.querySelectorAll('.choice-option');
                allLabels.forEach(function(lbl) {
                    lbl.style.background = 'transparent';
                    lbl.style.borderColor = 'transparent';
                });
                if (parent) {
                    parent.style.background = '#e8f0fe';
                    parent.style.borderColor = '#1a237e';
                }
            };

            container.appendChild(label);
        });

        console.log('✅ 單選題渲染完成: 第', index + 1, '題');
    }

    // ============================================================
    // 4. 複選題渲染
    // ============================================================
    function renderMultipleChoice(q, index, container) {
        if (!q) {
            if (container) container.innerHTML = '<div style="padding:10px;color:#999;">題目資料不存在</div>';
            return;
        }

        // ✅ 修復：統一使用 G_userAnswers
        if (!window.G_userAnswers) {
            window.G_userAnswers = {};
        }
        if (window.G_userAnswers[index] === undefined || window.G_userAnswers[index] === null) {
            window.G_userAnswers[index] = [];
        }

        var saved = window.G_userAnswers[index] || [];
        if (!Array.isArray(saved)) {
            saved = [];
        }

        var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        var totalPoints = q.points || '10%';

        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '（無題目文字）';
            textEl.innerHTML = displayText;
        }

        var pointsEl = document.getElementById('questionPoints');
        if (pointsEl) {
            pointsEl.textContent = '(' + totalPoints + ')';
        }

        if (!container) {
            container = document.getElementById('dropTargetArea') || document.getElementById('options-container');
        }
        if (!container) {
            console.warn('⚠️ 找不到容器');
            return;
        }

        container.innerHTML = '';
        container.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:12px 0;';

        if (q.imageUrl && window.ImageUploadExtension.enabled) {
            var imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'margin-bottom:12px;';
            window.ImageUploadExtension.renderImage(q.imageUrl, imgContainer);
            container.appendChild(imgContainer);
        }

        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:14px;color:#e65100;padding:4px 0 8px 0;font-weight:500;';
        hint.textContent = '⚠️ 複選題須全部選對才給分';
        container.appendChild(hint);

        var options = q.options || [];
        options.forEach(function(opt, i) {
            var label = document.createElement('label');
            label.className = 'multiple-option';
            label.style.cssText = 'display:flex;align-items:center;gap:14px;padding:10px 16px;border-radius:6px;cursor:pointer;font-size:18px;transition:background 0.2s,border-color 0.2s;border:2px solid transparent;';

            var isChecked = saved.includes(i);

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'q_' + index + '[]';
            checkbox.value = i;
            checkbox.checked = isChecked;
            checkbox.style.cssText = 'width:20px;height:20px;cursor:pointer;accent-color:#1a237e;flex-shrink:0;border-radius:2px;';

            var labelSpan = document.createElement('span');
            labelSpan.textContent = '(' + (labels[i] || (i + 1)) + ')';
            labelSpan.style.cssText = 'font-weight:700;color:#1a1a2e;min-width:32px;';

            var textSpan = document.createElement('span');
            textSpan.textContent = opt;
            textSpan.style.cssText = 'color:#1a1a2e;';

            label.appendChild(checkbox);
            label.appendChild(labelSpan);
            label.appendChild(textSpan);

            if (isChecked) {
                label.style.background = '#e8f0fe';
                label.style.borderColor = '#1a237e';
            }

            label.onmouseover = function() {
                if (!this.querySelector('input[type="checkbox"]').checked) {
                    this.style.background = '#f5f7fa';
                    this.style.borderColor = '#b0bec5';
                }
            };
            label.onmouseout = function() {
                if (!this.querySelector('input[type="checkbox"]').checked) {
                    this.style.background = 'transparent';
                    this.style.borderColor = 'transparent';
                }
            };

            checkbox.onchange = function() {
                var val = parseInt(this.value);
                var current = window.G_userAnswers[index] || [];
                if (!Array.isArray(current)) {
                    current = [];
                }
                var idx = current.indexOf(val);
                if (this.checked) {
                    if (idx === -1) current.push(val);
                } else {
                    if (idx !== -1) current.splice(idx, 1);
                }
                current.sort(function(a, b) { return a - b; });
                // ✅ 修復：使用 G_userAnswers
                window.G_userAnswers[index] = current;

                if (typeof updateAnsweredCount === 'function') {
                    updateAnsweredCount();
                }

                var parent = this.closest('label');
                if (this.checked) {
                    if (parent) {
                        parent.style.background = '#e8f0fe';
                        parent.style.borderColor = '#1a237e';
                    }
                } else {
                    if (parent) {
                        parent.style.background = 'transparent';
                        parent.style.borderColor = 'transparent';
                    }
                }
            };

            container.appendChild(label);
        });

        console.log('✅ 複選題渲染完成: 第', index + 1, '題');
    }

    // ============================================================
    // 5. 匯出到全域
    // ============================================================
    window.renderChoice = renderChoice;
    window.renderMultipleChoice = renderMultipleChoice;

    console.log('✅ 30_渲染_單選複選 v10.2.0 已載入');
    console.log('   ○ 單選題: 圓形選鈕');
    console.log('   ☑ 複選題: 方形勾選框');
    console.log('   💾 統一使用 G_userAnswers');

})();