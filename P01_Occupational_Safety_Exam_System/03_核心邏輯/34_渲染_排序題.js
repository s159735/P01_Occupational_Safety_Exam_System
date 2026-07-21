// ============================================================
// 🎯 渲染_排序題 v10.5.1 (靠左對齊版)
// 職責：排序題渲染 - 作答區合併為一個大區域
// 特色：選項拖入後自動編號（1、2、3...），可拖回選項區
// 容器：由主入口傳入 answerContainer1（作答區）和 answerContainer2（選項區）
// 更新日期：2026-07-21
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_排序題 v10.5.1 載入中...');

    function renderSort(q, index, dropArea, cardArea) {
        console.log('🔧 renderSort 被呼叫, index:', index);

        // ============================================================
        // 1. 驗證容器
        // ============================================================
        if (!dropArea || !cardArea) {
            console.error('❌ renderSort: 容器缺失');
            return;
        }

        if (!q) {
            dropArea.innerHTML = '<div style="padding:10px;color:#999;">題目資料不存在</div>';
            return;
        }

        if (!q.options || q.options.length === 0) {
            dropArea.innerHTML = '<div style="padding:10px;color:#999;">此題暫無排序選項</div>';
            return;
        }

        // ============================================================
        // 2. 初始化答案
        // ============================================================
        if (!window.G_userAnswers) {
            window.G_userAnswers = {};
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

        console.log('   📊 選項數:', options.length, '已填:', saved.length);

        // ============================================================
        // 3. 更新題目文字
        // ============================================================
        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '請依序排列：';
            textEl.innerHTML = displayText + ' <span style="font-size:16px;color:#e65100;font-weight:600;">(' + totalPoints + ')</span>';
        }

        // ============================================================
        // 4. 渲染作答區（合併成一個大區域）
        // ============================================================
        dropArea.innerHTML = '';
        // ✅ 靠左對齊：移除 max-width 和 margin:0 auto
        dropArea.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:12px 16px;background:#faf8f5;border:2px solid #d5c8a8;border-radius:8px;min-height:120px;width:100%;box-sizing:border-box;';

        // 標題列
        var headerRow = document.createElement('div');
        headerRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;';
        
        var headerTitle = document.createElement('span');
        headerTitle.textContent = '📋 作答區（將下方選項拖曳至此）';
        headerTitle.style.cssText = 'font-size:16px;font-weight:600;color:#555;';
        headerRow.appendChild(headerTitle);
        
        var statusText = document.createElement('span');
        statusText.id = 'sort-status-' + index;
        statusText.style.cssText = 'font-size:14px;color:#666;';
        var matchedCount = saved.length;
        if (matchedCount === numSlots) {
            statusText.innerHTML = '✅ 已完成 (' + matchedCount + '/' + numSlots + ')';
            statusText.style.color = '#2e7d32';
        } else {
            statusText.textContent = '已填 ' + matchedCount + '/' + numSlots + ' 項';
        }
        headerRow.appendChild(statusText);
        dropArea.appendChild(headerRow);

        // ============================================================
        // 作答區：一個大容器，顯示所有已拖入的選項
        // ============================================================
        var dropZone = document.createElement('div');
        dropZone.id = 'sort-drop-zone-' + index;
        dropZone.style.cssText = 'display:flex;flex-direction:column;gap:6px;min-height:80px;padding:8px;border:2px dashed #ccc;border-radius:6px;background:#f5f5f0;transition:all 0.2s;';

        // 如果沒有已儲存的選項，顯示提示文字
        if (saved.length === 0) {
            var placeholder = document.createElement('div');
            placeholder.id = 'sort-placeholder-' + index;
            placeholder.textContent = '⬇️ 將下方選項拖曳到此區域進行排序';
            placeholder.style.cssText = 'text-align:center;color:#999;font-size:16px;padding:20px 0;user-select:none;';
            dropZone.appendChild(placeholder);
        } else {
            // ✅ 顯示已儲存的選項（加上編號）
            saved.forEach(function(item, i) {
                var slot = document.createElement('div');
                slot.className = 'sort-slot';
                slot.dataset.value = item;
                slot.dataset.index = i;
                slot.draggable = true;
                slot.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 14px;background:#fff;border:2px solid #2e7d32;border-radius:6px;cursor:grab;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.08);';

                // 編號
                var numSpan = document.createElement('span');
                numSpan.textContent = (i + 1) + '.';
                numSpan.style.cssText = 'font-weight:700;color:#1a237e;min-width:28px;font-size:16px;';
                slot.appendChild(numSpan);

                // 選項文字
                var textSpan = document.createElement('span');
                textSpan.textContent = item;
                textSpan.style.cssText = 'flex:1;font-size:16px;color:#1a1a2e;';
                slot.appendChild(textSpan);

                // 刪除按鈕
                var delBtn = document.createElement('button');
                delBtn.textContent = '✕';
                delBtn.style.cssText = 'background:none;border:none;color:#e05046;cursor:pointer;font-size:14px;padding:0 6px;opacity:0.4;transition:opacity 0.2s;';
                delBtn.onmouseover = function() { this.style.opacity = '1'; };
                delBtn.onmouseout = function() { this.style.opacity = '0.4'; };
                delBtn.onclick = (function(slotIndex) {
                    return function(e) {
                        e.stopPropagation();
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
                slot.appendChild(delBtn);

                // ✅ 拖曳事件（可拖回選項區）
                slot.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', 'sort-slot-' + this.dataset.value);
                    this.style.borderColor = '#067ae0';
                    this.style.background = '#e8f0fe';
                });
                slot.addEventListener('dragend', function(e) {
                    this.style.borderColor = '#2e7d32';
                    this.style.background = '#fff';
                });

                dropZone.appendChild(slot);
            });
        }

        // ============================================================
        // ✅ 作答區的拖曳目標事件（接收選項卡片）
        // ============================================================
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#067ae0';
            this.style.background = '#e8f0fe';
        });
        dropZone.addEventListener('dragleave', function(e) {
            this.style.borderColor = '#ccc';
            this.style.background = '#f5f5f0';
        });
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ccc';
            this.style.background = '#f5f5f0';

            var data = e.dataTransfer.getData('text/plain');
            if (!data) return;

            var current = window.G_userAnswers[index] ? window.G_userAnswers[index].split(',') : [];
            if (!Array.isArray(current)) {
                current = [];
            }
            current = current.filter(function(s) { return s && s.trim() !== ''; });

            // 從選項區拖曳過來的
            if (data.startsWith('sort-opt-')) {
                var value = data.replace('sort-opt-', '');
                if (!current.includes(value)) {
                    current.push(value);
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

            // 從作答區拖曳過來的（重新排序）
            if (data.startsWith('sort-slot-')) {
                var value = data.replace('sort-slot-', '');
                var fromIdx = current.indexOf(value);
                if (fromIdx === -1) return;
                
                // 計算目標位置
                var targetIdx = current.length;
                var children = dropZone.children;
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (child.className === 'sort-slot') {
                        var rect = child.getBoundingClientRect();
                        var midY = rect.top + rect.height / 2;
                        if (e.clientY < midY) {
                            targetIdx = parseInt(child.dataset.index);
                            break;
                        }
                    }
                }
                if (isNaN(targetIdx) || targetIdx < 0) targetIdx = current.length;
                
                var item = current[fromIdx];
                if (!item) return;
                current.splice(fromIdx, 1);
                if (targetIdx > current.length) targetIdx = current.length;
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

        dropArea.appendChild(dropZone);

        // ============================================================
        // 5. 渲染選項區（下方）
        // ============================================================
        cardArea.innerHTML = '';
        // ✅ 靠左對齊：移除 max-width 和 margin:0 auto
        cardArea.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:12px 16px;background:#f5f0e8;border:2px solid #d5c8a8;border-radius:8px;min-height:60px;width:100%;box-sizing:border-box;margin-top:16px;';

        var optTitle = document.createElement('div');
        optTitle.textContent = '🎯 選項區（拖曳至上方作答區，也可拖回此區）';
        optTitle.style.cssText = 'font-size:16px;font-weight:600;color:#555;width:100%;margin-bottom:6px;';
        cardArea.appendChild(optTitle);

        // 找出尚未使用的選項
        var unusedItems = options.filter(function(opt) {
            return !saved.includes(opt);
        });

        if (unusedItems.length === 0 && saved.length === numSlots) {
            var doneMsg = document.createElement('div');
            doneMsg.textContent = '✅ 所有選項已使用完畢';
            doneMsg.style.cssText = 'text-align:center;color:#2e7d32;font-size:16px;padding:12px 0;width:100%;font-weight:600;';
            cardArea.appendChild(doneMsg);
        } else if (unusedItems.length === 0) {
            var warnMsg = document.createElement('div');
            warnMsg.textContent = '⚠️ 尚有空格未填入，請檢查排序';
            warnMsg.style.cssText = 'text-align:center;color:#e65100;font-size:16px;padding:12px 0;width:100%;';
            cardArea.appendChild(warnMsg);
        } else {
            // 隨機打亂選項順序
            var shuffledUnused = unusedItems.slice();
            for (var i = shuffledUnused.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = shuffledUnused[i];
                shuffledUnused[i] = shuffledUnused[j];
                shuffledUnused[j] = temp;
            }

            // ✅ 垂直排列每個選項卡片（靠左）
            shuffledUnused.forEach(function(opt) {
                var card = document.createElement('div');
                card.className = 'sort-option-card';
                card.textContent = opt;
                card.draggable = true;
                card.dataset.value = opt;
                // ✅ 寬度隨內容，靠左顯示
                card.style.cssText = 'padding:8px 16px;background:#fff;border:2px solid #1a1a2e;border-radius:6px;font-size:16px;font-weight:500;cursor:grab;user-select:none;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.06);width:auto;display:block;box-sizing:border-box;';

                card.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', 'sort-opt-' + this.dataset.value);
                    this.style.borderColor = '#067ae0';
                    this.style.background = '#e8f0fe';
                    this.style.boxShadow = '0 4px 12px rgba(6,122,224,0.2)';
                });
                card.addEventListener('dragend', function(e) {
                    this.style.borderColor = '#1a1a2e';
                    this.style.background = '#fff';
                    this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                });
                cardArea.appendChild(card);
            });
        }

        // ============================================================
        // ✅ 選項區接收拖曳回來的卡片
        // ============================================================
        cardArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#067ae0';
            this.style.background = '#e8f0fe';
        });
        cardArea.addEventListener('dragleave', function(e) {
            this.style.borderColor = '#d5c8a8';
            this.style.background = '#f5f0e8';
        });
        cardArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#d5c8a8';
            this.style.background = '#f5f0e8';

            var data = e.dataTransfer.getData('text/plain');
            if (!data) return;

            // ✅ 從作答區拖曳回來的
            if (data.startsWith('sort-slot-')) {
                var value = data.replace('sort-slot-', '');
                var current = window.G_userAnswers[index] ? window.G_userAnswers[index].split(',') : [];
                if (!Array.isArray(current)) {
                    current = [];
                }
                current = current.filter(function(s) { return s && s.trim() !== ''; });
                var idx = current.indexOf(value);
                if (idx !== -1) {
                    current.splice(idx, 1);
                    current = current.filter(function(s) { return s && s.trim() !== ''; });
                    window.G_userAnswers[index] = current.join(',');
                    if (typeof renderQuestion === 'function') {
                        renderQuestion(index);
                    }
                    if (typeof updateAnsweredCount === 'function') {
                        updateAnsweredCount();
                    }
                }
            }
        });

        // 更新狀態文字
        var statusEl = document.getElementById('sort-status-' + index);
        if (statusEl) {
            var newCount = saved.length;
            if (newCount === numSlots) {
                statusEl.innerHTML = '✅ 已完成 (' + newCount + '/' + numSlots + ')';
                statusEl.style.color = '#2e7d32';
            } else {
                statusEl.textContent = '已填 ' + newCount + '/' + numSlots + ' 項';
                statusEl.style.color = '#666';
            }
        }

        console.log('✅ 排序題渲染完成: 第', index + 1, '題');
    }

    window.renderSort = renderSort;

    console.log('✅ 34_渲染_排序題 v10.5.1 已載入');
    console.log('   🔢 排序題: 合併作答區，拖入後自動編號');
    console.log('   🔄 可拖回選項區');
    console.log('   ◀️ 靠左對齊');

})();