// ============================================================
// 🎯 渲染_排序題 v10.2.0 (完整版)
// 職責：排序題渲染（拖曳卡片至作答區排序）
// 格式依據：乙級術科電腦測驗官方模擬格式
// 更新日期：2026-07-17
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_排序題 v10.2.0 載入中...');

    // ============================================================
    // 1. 排序題渲染
    // ============================================================
    function renderSort(q, index, dropArea, cardArea) {
        if (!q) {
            if (dropArea) dropArea.innerHTML = '<div style="padding:10px;color:#999;">題目資料不存在</div>';
            return;
        }

        if (!q.options || q.options.length === 0) {
            if (dropArea) dropArea.innerHTML = '<div style="padding:10px;color:#999;">此題暫無排序選項</div>';
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

        var options = q.options || [];
        var correctOrder = q.answer || [];
        var totalPoints = q.points || '10%';
        var numSlots = correctOrder.length > 0 ? correctOrder.length : options.length;
        var pointsPerItem = q.pointsPerItem || Math.round(parseFloat(totalPoints) / numSlots) + '%';

        var unusedItems = options.filter(function(opt) {
            return !saved.includes(opt);
        });

        // 更新題目文字
        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '請依序排列：';
            textEl.innerHTML = displayText + ' <span style="font-size:16px;color:#e65100;font-weight:600;">(' + totalPoints + ')</span>';
        }

        var pointsEl = document.getElementById('questionPoints');
        if (pointsEl) {
            pointsEl.textContent = '(' + totalPoints + ')';
        }

        // 渲染作答區
        if (dropArea) {
            dropArea.innerHTML = '';
            dropArea.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:16px 20px;background:#faf8f5;border:2px solid #d5c8a8;border-radius:8px;min-height:80px;';

            var headerRow = document.createElement('div');
            headerRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;';
            
            var headerTitle = document.createElement('span');
            headerTitle.textContent = '作答區（將下方選項拖曳至對應順序位置）';
            headerTitle.style.cssText = 'font-size:16px;font-weight:600;color:#555;';
            headerRow.appendChild(headerTitle);
            
            var statusText = document.createElement('span');
            statusText.id = 'sort-status-' + index;
            statusText.style.cssText = 'font-size:14px;color:#666;';
            var matchedCount = saved.length;
            if (matchedCount === numSlots) {
                statusText.innerHTML = '✅ 已完成排序 (' + matchedCount + '/' + numSlots + ')';
                statusText.style.color = '#2e7d32';
            } else {
                statusText.textContent = '已排序 ' + matchedCount + '/' + numSlots + ' 項';
            }
            headerRow.appendChild(statusText);
            dropArea.appendChild(headerRow);

            var maxSlots = Math.max(numSlots, saved.length);
            for (var i = 0; i < maxSlots; i++) {
                var val = (saved && saved.length > i && saved[i]) ? saved[i] : '';
                var numLabel = i + 1;

                var row = document.createElement('div');
                row.className = 'sort-answer-row';
                row.dataset.index = i;
                row.dataset.value = val;
                row.style.cssText = 'display:flex;align-items:center;gap:14px;padding:8px 12px;background:#fff;border:2px solid #d5c8a8;border-radius:6px;transition:all 0.2s;';

                if (val) {
                    row.style.background = '#e8f5e9';
                    row.style.borderColor = '#2e7d32';
                    row.draggable = true;
                } else {
                    row.draggable = false;
                }

                var numSpan = document.createElement('span');
                numSpan.textContent = numLabel + '.';
                numSpan.style.cssText = 'font-weight:700;color:#1a1a2e;min-width:32px;font-size:18px;';
                row.appendChild(numSpan);

                var contentSpan = document.createElement('span');
                contentSpan.className = 'sort-content';
                contentSpan.style.cssText = 'flex:1;font-size:18px;color:#1a1a2e;min-height:30px;padding:2px 4px;';

                if (val) {
                    contentSpan.textContent = val;
                } else {
                    contentSpan.innerHTML = '<span style="color:#bbb;letter-spacing:2px;">＿＿＿＿</span>';
                }
                row.appendChild(contentSpan);

                var pointsSpan = document.createElement('span');
                pointsSpan.textContent = '(' + pointsPerItem + ')';
                pointsSpan.style.cssText = 'font-size:14px;color:#666;min-width:50px;text-align:right;';
                row.appendChild(pointsSpan);

                var clearBtn = document.createElement('button');
                clearBtn.textContent = '✕';
                clearBtn.style.cssText = 'background:none;border:none;color:#e05046;cursor:pointer;font-size:16px;padding:0 6px;opacity:' + (val ? '0.4' : '0.1') + ';transition:all 0.2s;';
                clearBtn.onmouseover = function() { this.style.opacity = '1'; };
                clearBtn.onmouseout = function() { this.style.opacity = this.dataset.hasValue === 'true' ? '0.4' : '0.1'; };
                clearBtn.dataset.hasValue = val ? 'true' : 'false';

                if (val) {
                    clearBtn.onclick = (function(slotIndex) {
                        return function() {
                            var current = window.G_userAnswers[index] ? window.G_userAnswers[index].split(',') : [];
                            if (!Array.isArray(current)) {
                                current = [];
                            }
                            current = current.filter(function(s) { return s && s.trim() !== ''; });
                            if (slotIndex < current.length) {
                                var removed = current[slotIndex];
                                current.splice(slotIndex, 1);
                                current = current.filter(function(s) { return s && s.trim() !== ''; });
                                window.G_userAnswers[index] = current.join(',');
                                if (typeof renderQuestion === 'function') {
                                    renderQuestion(index);
                                }
                                if (typeof updateAnsweredCount === 'function') {
                                    updateAnsweredCount();
                                }
                            }
                        };
                    })(i);
                } else {
                    clearBtn.onclick = function() { /* 無作用 */ };
                }

                row.appendChild(clearBtn);

                if (val) {
                    row.addEventListener('dragstart', function(e) {
                        e.dataTransfer.setData('text/plain', 'sort-answer-' + this.dataset.index);
                        this.style.borderColor = '#067ae0';
                        this.style.background = '#e8f0fe';
                    });
                    row.addEventListener('dragend', function(e) {
                        this.style.borderColor = '#2e7d32';
                        this.style.background = '#e8f5e9';
                    });
                }

                row.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    this.style.borderColor = '#067ae0';
                    this.style.background = '#e8f0fe';
                });
                row.addEventListener('dragleave', function(e) {
                    this.style.borderColor = val ? '#2e7d32' : '#d5c8a8';
                    this.style.background = val ? '#e8f5e9' : '#fff';
                });
                row.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.style.borderColor = val ? '#2e7d32' : '#d5c8a8';
                    this.style.background = val ? '#e8f5e9' : '#fff';

                    var data = e.dataTransfer.getData('text/plain');
                    if (!data) return;

                    var current = window.G_userAnswers[index] ? window.G_userAnswers[index].split(',') : [];
                    if (!Array.isArray(current)) {
                        current = [];
                    }
                    current = current.filter(function(s) { return s && s.trim() !== ''; });

                    var targetIdx = parseInt(this.dataset.index);

                    if (data.startsWith('sort-opt-')) {
                        var value = data.replace('sort-opt-', '');
                        if (!current.includes(value)) {
                            if (targetIdx < 0) targetIdx = 0;
                            if (targetIdx > current.length) targetIdx = current.length;
                            current.splice(targetIdx, 0, value);
                            window.G_userAnswers[index] = current.join(',');
                            if (typeof renderQuestion === 'function') {
                                renderQuestion(index);
                            }
                            if (typeof updateAnsweredCount === 'function') {
                                updateAnsweredCount();
                            }
                        }
                        return;
                    }

                    if (data.startsWith('sort-answer-')) {
                        var fromIdx = parseInt(data.replace('sort-answer-', ''));
                        if (isNaN(fromIdx) || fromIdx < 0 || fromIdx >= current.length) return;
                        if (fromIdx === targetIdx) return;
                        if (targetIdx < 0) targetIdx = 0;
                        if (targetIdx > current.length) targetIdx = current.length;
                        var item = current[fromIdx];
                        if (!item) return;
                        current.splice(fromIdx, 1);
                        current.splice(targetIdx, 0, item);
                        window.G_userAnswers[index] = current.join(',');
                        if (typeof renderQuestion === 'function') {
                            renderQuestion(index);
                        }
                        if (typeof updateAnsweredCount === 'function') {
                            updateAnsweredCount();
                        }
                    }
                });

                dropArea.appendChild(row);
            }

            var statusEl = document.getElementById('sort-status-' + index);
            if (statusEl) {
                var newCount = saved.filter(function(s) { return s && s.trim() !== ''; }).length;
                if (newCount === numSlots) {
                    statusEl.innerHTML = '✅ 已完成排序 (' + newCount + '/' + numSlots + ')';
                    statusEl.style.color = '#2e7d32';
                } else {
                    statusEl.textContent = '已排序 ' + newCount + '/' + numSlots + ' 項';
                    statusEl.style.color = '#666';
                }
            }
        }

        // 渲染選項卡片區
        if (cardArea) {
            cardArea.innerHTML = '';
            cardArea.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px 16px;padding:16px 20px;background:#f5f0e8;border:2px solid #d5c8a8;border-radius:8px;min-height:60px;margin-top:16px;';

            var optTitle = document.createElement('div');
            optTitle.textContent = '選項區（拖曳至上方作答區進行排序）';
            optTitle.style.cssText = 'font-size:16px;font-weight:600;color:#555;width:100%;margin-bottom:4px;';
            cardArea.appendChild(optTitle);

            var unusedItems = options.filter(function(opt) {
                return !saved.includes(opt);
            });

            if (unusedItems.length === 0 && saved.length === numSlots) {
                var doneMsg = document.createElement('div');
                doneMsg.textContent = '✅ 所有選項已使用完畢';
                doneMsg.style.cssText = 'text-align:center;color:#2e7d32;font-size:16px;padding:8px 0;width:100%;font-weight:600;';
                cardArea.appendChild(doneMsg);
            } else if (unusedItems.length === 0) {
                var warnMsg = document.createElement('div');
                warnMsg.textContent = '⚠️ 尚有空格未填入，請檢查排序';
                warnMsg.style.cssText = 'text-align:center;color:#e65100;font-size:16px;padding:8px 0;width:100%;';
                cardArea.appendChild(warnMsg);
            } else {
                var shuffledUnused = unusedItems.slice();
                for (var i = shuffledUnused.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var temp = shuffledUnused[i];
                    shuffledUnused[i] = shuffledUnused[j];
                    shuffledUnused[j] = temp;
                }

                shuffledUnused.forEach(function(opt) {
                    var card = document.createElement('div');
                    card.className = 'sort-option-card';
                    card.textContent = opt;
                    card.draggable = true;
                    card.dataset.value = opt;
                    card.style.cssText = 'padding:8px 20px;background:#fff;border:2px solid #1a1a2e;border-radius:6px;font-size:17px;font-weight:500;cursor:grab;user-select:none;transition:all 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.06);';

                    card.addEventListener('dragstart', function(e) {
                        e.dataTransfer.setData('text/plain', 'sort-opt-' + this.dataset.value);
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

        console.log('✅ 排序題渲染完成: 第', index + 1, '題');
    }

    // ============================================================
    // 2. 匯出到全域
    // ============================================================
    window.renderSort = renderSort;

    console.log('✅ 34_渲染_排序題 v10.2.0 已載入');
    console.log('   🔢 排序題: 拖曳卡片排列順序');

})();