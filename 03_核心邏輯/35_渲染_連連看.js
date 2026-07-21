// ============================================================
// 🎯 渲染_連連看 v10.2.0 (完整版)
// 職責：連連看渲染（點選左欄 → 點選右欄配對）
// 格式依據：乙級術科電腦測驗官方模擬格式
// 更新日期：2026-07-17
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_連連看 v10.2.0 載入中...');

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
    // 2. 連連看渲染
    // ============================================================
    function renderLink(q, index, container) {
        if (!q) {
            if (container) container.innerHTML = '<div style="padding:10px;color:#999;">題目資料不存在</div>';
            return;
        }

        if (!window.G_userAnswers) {
            window.G_userAnswers = [];
        }
        if (window.G_userAnswers[index] === undefined || window.G_userAnswers[index] === null) {
            window.G_userAnswers[index] = {};
        }

        var pairs = q.pairs || [];
        if (!pairs || pairs.length === 0) {
            if (container) container.innerHTML = '<div style="padding:10px;color:#999;">此題暫無連連看資料</div>';
            return;
        }

        var leftItems = [];
        var rightItems = [];

        if (typeof pairs[0] === 'object' && pairs[0].left !== undefined) {
            leftItems = pairs.map(function(p) { return p.left; });
            rightItems = pairs.map(function(p) { return p.right; });
        } else if (typeof pairs[0] === 'string') {
            leftItems = pairs.map(function(item, i) { return String.fromCharCode(65 + i) + '. ' + item; });
            rightItems = pairs.slice();
        } else {
            if (container) container.innerHTML = '<div style="padding:10px;color:#999;">資料格式不支援</div>';
            return;
        }

        var totalPoints = q.points || '10%';
        var numSlots = leftItems.length;
        var pointsPerItem = q.pointsPerItem || Math.round(parseFloat(totalPoints) / numSlots) + '%';

        var saved = window.G_userAnswers[index] || {};

        // 更新題目文字
        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '請進行配對：';
            textEl.innerHTML = displayText;
        }

        var typeBadge = document.getElementById('questionTypeBadge');
        if (typeBadge) {
            var typeLabel = q.typeLabel || '連連看';
            typeBadge.textContent = typeLabel + ' (' + totalPoints + ')';
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
        container.style.cssText = 'display:flex;flex-direction:column;gap:16px;padding:16px 0;';

        if (q.imageUrl && window.ImageUploadExtension.enabled) {
            var imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'margin-bottom:8px;';
            window.ImageUploadExtension.renderImage(q.imageUrl, imgContainer);
            container.appendChild(imgContainer);
        }

        // 右欄隨機排序
        var shuffledRight = rightItems.slice();
        for (var i = shuffledRight.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffledRight[i];
            shuffledRight[i] = shuffledRight[j];
            shuffledRight[j] = temp;
        }

        // 配對區域
        var matchArea = document.createElement('div');
        matchArea.style.cssText = 'display:flex;gap:60px;padding:8px 0;flex-wrap:wrap;';

        // 左欄
        var leftCol = document.createElement('div');
        leftCol.style.cssText = 'display:flex;flex-direction:column;gap:12px;flex:1;min-width:200px;';

        var leftTitle = document.createElement('div');
        leftTitle.textContent = '左欄 (點選項目)';
        leftTitle.style.cssText = 'font-weight:700;font-size:16px;color:#555;margin-bottom:4px;padding-bottom:6px;border-bottom:2px solid #e0e0e0;';
        leftCol.appendChild(leftTitle);

        leftItems.forEach(function(item, i) {
            var card = document.createElement('div');
            card.className = 'link-left-item';
            card.dataset.index = i;
            card.dataset.value = item;

            var isMatched = saved[i] !== undefined && saved[i] !== null && saved[i] !== '';

            var displayText = item;
            if (isMatched && saved[i]) {
                displayText = item + ' → ' + saved[i];
            }

            card.textContent = displayText;
            card.style.cssText = 'padding:12px 20px;background:' + (isMatched ? '#e8f5e9' : '#fff') + ';border:2px solid ' + (isMatched ? '#2e7d32' : '#b5a88a') + ';border-radius:6px;font-size:18px;cursor:pointer;transition:all 0.2s;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04);min-height:52px;display:flex;align-items:center;justify-content:center;';

            if (isMatched) {
                card.classList.add('matched');
            }

            card.onmouseover = function() {
                if (!this.classList.contains('matched')) {
                    this.style.borderColor = '#067ae0';
                    this.style.background = '#e8f0fe';
                    this.style.boxShadow = '0 2px 8px rgba(6,122,224,0.15)';
                }
            };
            card.onmouseout = function() {
                if (!this.classList.contains('matched')) {
                    this.style.borderColor = '#b5a88a';
                    this.style.background = '#fff';
                    this.style.boxShadow = 'none';
                }
            };
            card.onclick = (function(leftIdx) {
                return function() {
                    if (saved[leftIdx] !== undefined && saved[leftIdx] !== null && saved[leftIdx] !== '') {
                        delete saved[leftIdx];
                        window.G_userAnswers[index] = saved;
                        if (typeof renderQuestion === 'function') {
                            renderQuestion(index);
                        }
                        if (typeof updateAnsweredCount === 'function') {
                            updateAnsweredCount();
                        }
                        return;
                    }

                    document.querySelectorAll('.link-left-item').forEach(function(el) {
                        if (!el.classList.contains('matched')) {
                            el.style.borderColor = '#b5a88a';
                            el.style.background = '#fff';
                            el.style.boxShadow = 'none';
                        }
                    });

                    window._linkSelectedLeft = leftIdx;
                    this.style.borderColor = '#067ae0';
                    this.style.background = '#e8f0fe';
                    this.style.boxShadow = '0 2px 8px rgba(6,122,224,0.25)';
                };
            })(i);

            leftCol.appendChild(card);
        });
        matchArea.appendChild(leftCol);

        // 右欄
        var rightCol = document.createElement('div');
        rightCol.style.cssText = 'display:flex;flex-direction:column;gap:12px;flex:1;min-width:200px;';

        var rightTitle = document.createElement('div');
        rightTitle.textContent = '右欄 (點選配對)';
        rightTitle.style.cssText = 'font-weight:700;font-size:16px;color:#555;margin-bottom:4px;padding-bottom:6px;border-bottom:2px solid #e0e0e0;';
        rightCol.appendChild(rightTitle);

        var usedRightItems = Object.values(saved).filter(function(v) { return v !== undefined && v !== null && v !== ''; });

        shuffledRight.forEach(function(item, idx) {
            var isUsed = usedRightItems.includes(item);
            var card = document.createElement('div');
            card.className = 'link-right-item';
            card.dataset.value = item;
            card.textContent = isUsed ? item + ' (已配對)' : item;

            card.style.cssText = 'padding:12px 20px;background:' + (isUsed ? '#e8f5e9' : '#fff') + ';border:2px solid ' + (isUsed ? '#2e7d32' : '#b5a88a') + ';border-radius:6px;font-size:18px;cursor:' + (isUsed ? 'default' : 'pointer') + ';transition:all 0.2s;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04);min-height:52px;display:flex;align-items:center;justify-content:center;' + (isUsed ? 'opacity:0.7;' : '');

            if (isUsed) {
                card.classList.add('matched');
            }

            card.onmouseover = function() {
                if (!this.classList.contains('matched')) {
                    this.style.borderColor = '#067ae0';
                    this.style.background = '#e8f0fe';
                    this.style.boxShadow = '0 2px 8px rgba(6,122,224,0.15)';
                }
            };
            card.onmouseout = function() {
                if (!this.classList.contains('matched')) {
                    this.style.borderColor = '#b5a88a';
                    this.style.background = '#fff';
                    this.style.boxShadow = 'none';
                }
            };
            card.onclick = (function(rightValue) {
                return function() {
                    if (this.classList.contains('matched')) return;

                    var leftIdx = window._linkSelectedLeft;
                    if (leftIdx === null || leftIdx === undefined) {
                        var statusEl = document.getElementById('link-status-' + index);
                        if (statusEl) {
                            statusEl.textContent = '⚠️ 請先點選左欄項目';
                            statusEl.style.color = '#e65100';
                            setTimeout(function() {
                                if (statusEl) {
                                    var count = Object.keys(saved).filter(function(k) { return saved[k] !== undefined && saved[k] !== ''; }).length;
                                    if (count === numSlots) {
                                        statusEl.innerHTML = '✅ 已完成所有配對！';
                                        statusEl.style.color = '#2e7d32';
                                    } else {
                                        statusEl.textContent = '已配對 ' + count + '/' + numSlots + ' 組';
                                        statusEl.style.color = '#666';
                                    }
                                }
                            }, 2000);
                        }
                        return;
                    }

                    if (saved[leftIdx] !== undefined && saved[leftIdx] !== null && saved[leftIdx] !== '') {
                        delete saved[leftIdx];
                    }

                    var existingKey = null;
                    for (var key in saved) {
                        if (saved[key] === rightValue) {
                            existingKey = key;
                            break;
                        }
                    }
                    if (existingKey !== null) {
                        delete saved[existingKey];
                    }

                    saved[leftIdx] = rightValue;
                    window.G_userAnswers[index] = saved;

                    window._linkSelectedLeft = null;
                    document.querySelectorAll('.link-left-item').forEach(function(el) {
                        if (!el.classList.contains('matched')) {
                            el.style.borderColor = '#b5a88a';
                            el.style.background = '#fff';
                            el.style.boxShadow = 'none';
                        }
                    });

                    if (typeof renderQuestion === 'function') {
                        renderQuestion(index);
                    }
                    if (typeof updateAnsweredCount === 'function') {
                        updateAnsweredCount();
                    }
                };
            })(item);

            rightCol.appendChild(card);
        });
        matchArea.appendChild(rightCol);

        container.appendChild(matchArea);

        // 狀態顯示
        var statusRow = document.createElement('div');
        statusRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:10px 16px;background:#f5f0e8;border-radius:6px;';

        var statusEl = document.createElement('span');
        statusEl.id = 'link-status-' + index;
        statusEl.style.cssText = 'font-size:15px;color:#666;';
        var matchedCount = Object.keys(saved).filter(function(k) { return saved[k] !== undefined && saved[k] !== null && saved[k] !== ''; }).length;
        if (matchedCount === numSlots) {
            statusEl.innerHTML = '✅ 已完成所有配對！ (' + matchedCount + '/' + numSlots + ')';
            statusEl.style.color = '#2e7d32';
            statusEl.style.fontWeight = '600';
        } else {
            statusEl.textContent = '已配對 ' + matchedCount + '/' + numSlots + ' 組';
            statusEl.style.color = '#666';
        }
        statusRow.appendChild(statusEl);

        var pointsDisplay = document.createElement('span');
        pointsDisplay.textContent = '每組 ' + pointsPerItem + '，共 ' + totalPoints;
        pointsDisplay.style.cssText = 'font-size:14px;color:#888;';
        statusRow.appendChild(pointsDisplay);

        container.appendChild(statusRow);

        // 操作按鈕
        var btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;';

        var clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑️ 清除所有配對';
        clearBtn.style.cssText = 'padding:8px 20px;background:#fff;border:2px solid #e05046;border-radius:6px;color:#e05046;font-size:15px;cursor:pointer;transition:all 0.2s;';
        clearBtn.onmouseover = function() { this.style.background = '#ffebee'; };
        clearBtn.onmouseout = function() { this.style.background = '#fff'; };
        clearBtn.onclick = function() {
            if (matchedCount === 0) return;
            if (confirm('確定要清除所有配對嗎？')) {
                window.G_userAnswers[index] = {};
                window._linkSelectedLeft = null;
                if (typeof renderQuestion === 'function') {
                    renderQuestion(index);
                }
                if (typeof updateAnsweredCount === 'function') {
                    updateAnsweredCount();
                }
            }
        };
        btnRow.appendChild(clearBtn);

        var hint = document.createElement('span');
        hint.textContent = '💡 點選左欄 → 再點選右欄進行配對，點選已配對的左欄可解除配對';
        hint.style.cssText = 'font-size:14px;color:#999;align-self:center;margin-left:12px;';
        btnRow.appendChild(hint);

        container.appendChild(btnRow);

        console.log('✅ 連連看渲染完成: 第', index + 1, '題');
    }

    // ============================================================
    // 3. 匯出到全域
    // ============================================================
    window.renderLink = renderLink;

    console.log('✅ 35_渲染_連連看 v10.2.0 已載入');
    console.log('   🔗 連連看: 點選左欄 → 點選右欄配對');

})();