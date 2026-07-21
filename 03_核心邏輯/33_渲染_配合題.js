// ============================================================
// 🎯 渲染_配合題 v10.2.0 (完整版)
// 職責：配合題渲染（拖曳卡片至作答區）
// 格式依據：乙級術科電腦測驗官方模擬格式
// 更新日期：2026-07-17
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_配合題 v10.2.0 載入中...');

    // ============================================================
    // 1. 配合題渲染
    // ============================================================
    function renderMatch(q, index, cardArea, dropArea) {
        if (!q) {
            if (dropArea) dropArea.innerHTML = '<div style="padding:10px;color:#999;">題目資料不存在</div>';
            return;
        }

        if (!window.G_userAnswers) {
            window.G_userAnswers = [];
        }
        if (window.G_userAnswers[index] === undefined || window.G_userAnswers[index] === null) {
            window.G_userAnswers[index] = '';
        }

        var saved = String(window.G_userAnswers[index] || '').split(',');
        if (!Array.isArray(saved)) {
            saved = [];
        }
        saved = saved.filter(function(s) { return s && s.trim() !== ''; });

        var leftItems = q.leftItems || [];
        var rightItems = q.rightItems || [];

        if (leftItems.length === 0) {
            var options = q.options || [];
            if (options.length === 0) {
                if (dropArea) dropArea.innerHTML = '<div style="padding:10px;color:#999;">此題無配合選項</div>';
                return;
            }
            if (typeof options[0] === 'string') {
                leftItems = options.map(function(opt, i) {
                    return '項目 ' + String.fromCharCode(65 + i);
                });
                rightItems = options;
            }
        }

        var numSlots = leftItems.length;
        var totalPoints = q.points || '10%';
        var pointsPerItem = q.pointsPerItem || Math.round(parseFloat(totalPoints) / numSlots) + '%';

        var totalPointsDisplay = totalPoints;
        if (typeof totalPoints === 'string' && totalPoints.indexOf('%') === -1) {
            totalPointsDisplay = totalPoints + '%';
        }

        // 更新題幹區
        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '請進行配對：';
            displayText += ' <span style="font-size:16px;color:#e65100;font-weight:600;">(' + totalPointsDisplay + ')</span>';
            textEl.innerHTML = displayText;
        }

        var pointsEl = document.getElementById('questionPoints');
        if (pointsEl) {
            pointsEl.textContent = '(' + totalPointsDisplay + ')';
        }

        // 建立右欄選項（隨機排序）
        var shuffledRight = rightItems.slice();
        for (var i = shuffledRight.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffledRight[i];
            shuffledRight[i] = shuffledRight[j];
            shuffledRight[j] = temp;
        }

        // 渲染作答區
        if (dropArea) {
            dropArea.innerHTML = '';
            dropArea.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:16px 20px;background:#faf8f5;border:2px solid #d5c8a8;border-radius:8px;min-height:80px;';

            // 標題列
            var headerRow = document.createElement('div');
            headerRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;';
            
            var headerTitle = document.createElement('span');
            headerTitle.textContent = '作答區（將下方選項拖曳至對應空格）';
            headerTitle.style.cssText = 'font-size:16px;font-weight:600;color:#555;';
            headerRow.appendChild(headerTitle);
            
            var statusText = document.createElement('span');
            statusText.id = 'match-status-' + index;
            statusText.style.cssText = 'font-size:14px;color:#666;';
            var matchedCount = saved.filter(function(s) { return s && s.trim() !== ''; }).length;
            if (matchedCount === numSlots) {
                statusText.innerHTML = '✅ 已完成 ' + matchedCount + '/' + numSlots + ' 組配對';
                statusText.style.color = '#2e7d32';
            } else {
                statusText.textContent = '已配對 ' + matchedCount + '/' + numSlots + ' 組';
            }
            headerRow.appendChild(statusText);
            dropArea.appendChild(headerRow);

            // 渲染每個配對欄位
            for (var i = 0; i < numSlots; i++) {
                var val = (saved && saved.length > i && saved[i]) ? saved[i] : '';
                var label = String.fromCharCode(65 + i);

                var row = document.createElement('div');
                row.className = 'match-row';
                row.dataset.slot = i;
                row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:6px 8px;border-bottom:1px solid #eee;';

                var labelSpan = document.createElement('span');
                labelSpan.textContent = '(' + label + ')';
                labelSpan.style.cssText = 'font-weight:700;color:#1a1a2e;min-width:40px;font-size:18px;';
                row.appendChild(labelSpan);

                var zone = document.createElement('div');
                zone.className = 'match-drop-zone';
                zone.dataset.slot = i;
                zone.style.cssText = 'flex:1;min-width:150px;padding:6px 14px;background:#fff;border:none;border-bottom:3px solid #888;font-size:18px;text-align:center;min-height:40px;color:#1a1a2e;transition:all 0.2s;font-weight:500;cursor:pointer;';

                if (val) {
                    zone.textContent = val;
                    zone.style.borderBottom = '3px solid #2e7d32';
                    zone.style.background = '#e8f5e9';
                    zone.classList.add('filled');
                    zone.draggable = true;
                    zone.dataset.value = val;

                    zone.addEventListener('dragstart', function(e) {
                        e.dataTransfer.setData('text/plain', 'match-slot-' + this.dataset.slot + '-' + this.dataset.value);
                        this.style.borderBottom = '3px solid #067ae0';
                        this.style.background = 'rgba(6,122,224,0.08)';
                    });
                    zone.addEventListener('dragend', function(e) {
                        this.style.borderBottom = '3px solid #2e7d32';
                        this.style.background = '#e8f5e9';
                    });
                } else {
                    zone.innerHTML = '<span style="color:#bbb;letter-spacing:4px;">＿＿＿＿</span>';
                    zone.draggable = false;
                }

                zone.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    this.style.borderBottom = '3px solid #067ae0';
                    this.style.background = 'rgba(6,122,224,0.05)';
                });
                zone.addEventListener('dragleave', function(e) {
                    this.style.borderBottom = '3px solid #888';
                    this.style.background = '#fff';
                });
                zone.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.style.borderBottom = '3px solid #888';
                    this.style.background = '#fff';

                    var data = e.dataTransfer.getData('text/plain');
                    if (!data) return;

                    var targetSlot = parseInt(this.dataset.slot);
                    var current = window.G_userAnswers[index] ? window.G_userAnswers[index].split(',') : [];
                    if (!Array.isArray(current)) {
                        current = [];
                    }
                    while (current.length < numSlots) {
                        current.push('');
                    }

                    if (data.startsWith('match-opt-')) {
                        var value = data.replace('match-opt-', '');
                        var existingIdx = current.indexOf(value);
                        if (existingIdx !== -1 && existingIdx !== targetSlot) {
                            current[existingIdx] = '';
                        }
                        current[targetSlot] = value;
                        current = current.filter(function(v) { return v && v.trim() !== ''; });
                        while (current.length < numSlots) {
                            current.push('');
                        }
                        window.G_userAnswers[index] = current.join(',');
                        if (typeof renderQuestion === 'function') {
                            renderQuestion(index);
                        }
                        return;
                    }

                    if (data.startsWith('match-slot-')) {
                        var parts = data.split('-');
                        var fromSlot = parseInt(parts[2]);
                        var value = parts.slice(3).join('-');
                        var targetValue = current[targetSlot];
                        current[fromSlot] = targetValue || '';
                        current[targetSlot] = value;
                        current = current.filter(function(v) { return v && v.trim() !== ''; });
                        while (current.length < numSlots) {
                            current.push('');
                        }
                        window.G_userAnswers[index] = current.join(',');
                        if (typeof renderQuestion === 'function') {
                            renderQuestion(index);
                        }
                    }
                });

                row.appendChild(zone);

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
                        var current = window.G_userAnswers[index] ? window.G_userAnswers[index].split(',') : [];
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
                        window.G_userAnswers[index] = current.join(',');
                        if (typeof renderQuestion === 'function') {
                            renderQuestion(index);
                        }
                    };
                })(i);

                row.appendChild(clearBtn);
                dropArea.appendChild(row);
            }

            var statusEl = document.getElementById('match-status-' + index);
            if (statusEl) {
                var newMatchedCount = saved.filter(function(s) { return s && s.trim() !== ''; }).length;
                if (newMatchedCount === numSlots) {
                    statusEl.innerHTML = '✅ 已完成所有配對！';
                    statusEl.style.color = '#2e7d32';
                } else {
                    statusEl.textContent = '已配對 ' + newMatchedCount + '/' + numSlots + ' 組';
                    statusEl.style.color = '#666';
                }
            }
        }

        // 渲染選項卡片區
        if (cardArea) {
            cardArea.innerHTML = '';
            cardArea.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px 16px;padding:16px 20px;background:#f5f0e8;border:2px solid #d5c8a8;border-radius:8px;min-height:60px;margin-top:16px;';

            var optTitle = document.createElement('div');
            optTitle.textContent = '選項區（拖曳至上方作答區）';
            optTitle.style.cssText = 'font-size:16px;font-weight:600;color:#555;width:100%;margin-bottom:4px;';
            cardArea.appendChild(optTitle);

            var usedValues = saved.filter(function(s) { return s && s.trim() !== ''; });
            var availableOptions = shuffledRight.filter(function(opt) {
                return !usedValues.includes(opt);
            });

            if (availableOptions.length === 0 && usedValues.length === numSlots) {
                var doneMsg = document.createElement('div');
                doneMsg.textContent = '✅ 所有選項已使用完畢';
                doneMsg.style.cssText = 'text-align:center;color:#2e7d32;font-size:16px;padding:8px 0;width:100%;font-weight:600;';
                cardArea.appendChild(doneMsg);
            } else if (availableOptions.length === 0) {
                var warnMsg = document.createElement('div');
                warnMsg.textContent = '⚠️ 尚有空格未填入，請檢查配對';
                warnMsg.style.cssText = 'text-align:center;color:#e65100;font-size:16px;padding:8px 0;width:100%;';
                cardArea.appendChild(warnMsg);
            } else {
                var shuffledAvailable = availableOptions.slice();
                for (var i = shuffledAvailable.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var temp = shuffledAvailable[i];
                    shuffledAvailable[i] = shuffledAvailable[j];
                    shuffledAvailable[j] = temp;
                }

                shuffledAvailable.forEach(function(opt) {
                    var card = document.createElement('div');
                    card.className = 'match-option-card';
                    card.textContent = opt;
                    card.draggable = true;
                    card.dataset.value = opt;
                    card.style.cssText = 'padding:8px 20px;background:#fff;border:2px solid #1a1a2e;border-radius:6px;font-size:17px;font-weight:500;cursor:grab;user-select:none;transition:all 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.06);';

                    card.addEventListener('dragstart', function(e) {
                        e.dataTransfer.setData('text/plain', 'match-opt-' + this.dataset.value);
                        this.style.borderColor = '#067ae0';
                        this.style.background = '#e8f0fe';
                        this.style.boxShadow = '0 4px 12px rgba(6,122,224,0.2)';
                    });
                    card.addEventListener('dragend', function(e) {
                        this.style.borderColor = '#1a1a2e';
                        this.style.background = '#fff';
                        this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
                    });
                    cardArea.appendChild(card);
                });
            }
        }

        console.log('✅ 配合題渲染完成: 第', index + 1, '題');
    }

    // ============================================================
    // 2. 匯出到全域
    // ============================================================
    window.renderMatch = renderMatch;

    console.log('✅ 33_渲染_配合題 v10.2.0 已載入');
    console.log('   🔗 配合題: 拖曳卡片配對');

})();