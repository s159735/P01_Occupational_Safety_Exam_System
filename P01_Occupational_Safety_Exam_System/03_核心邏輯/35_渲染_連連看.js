// ============================================================
// 🎯 渲染_連連看 v10.18.0 (格子大小 + 間距修正版)
// 特色：左欄/右欄固定寬度 40%，間距 80px，格子高度 70px
// ============================================================

(function() {
    'use strict';

    console.log('🎯 渲染_連連看 v10.18.0 載入中...');

    function getImagePath(imageUrl) {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        var basePath = '../01_前端資源/06_題庫圖片/';
        if (imageUrl.startsWith('01_前端資源/') || imageUrl.startsWith('../01_前端資源/')) {
            return imageUrl;
        }
        return basePath + imageUrl;
    }

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
        var leftItems = [];
        var rightItems = [];

        if (pairs.length > 0) {
            leftItems = pairs.map(function(p) { return p.left; });
            rightItems = pairs.map(function(p) { return p.right; });
        } else if (q.answer && Array.isArray(q.answer) && q.answer.length > 0) {
            var answerList = q.answer;
            var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            leftItems = answerList.map(function(item, i) {
                return labels[i] || '項目' + (i + 1);
            });
            rightItems = answerList;
        }

        if (q.leftItems && q.leftItems.length > 0) {
            leftItems = q.leftItems;
        }

        var correctAnswers = rightItems.slice();

        if (leftItems.length === 0 || correctAnswers.length === 0) {
            if (container) container.innerHTML = '<div style="padding:10px;color:#999;">此題暫無連連看資料</div>';
            return;
        }

        var totalPoints = q.points || '10%';
        var numSlots = leftItems.length;
        var pointsPerItem = q.pointsPerItem || Math.round(parseFloat(totalPoints) / numSlots) + '%';

        var saved = window.G_userAnswers[index] || {};

        var textEl = document.getElementById('questionText');
        if (textEl) {
            var displayText = q.text || '請進行配對：';
            textEl.innerHTML = displayText + ' <span style="font-size:16px;color:#e65100;font-weight:600;">(' + totalPoints + ')</span>';
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
        container.style.cssText = 'display:flex;flex-direction:column;gap:16px;padding:16px 0;position:relative;';

        if (q.imageUrl) {
            var imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'margin-bottom:8px;text-align:center;';
            var img = document.createElement('img');
            img.src = getImagePath(q.imageUrl);
            img.style.cssText = 'max-width:100%;max-height:250px;border-radius:4px;border:1px solid #ddd;';
            img.onerror = function() {
                this.style.display = 'none';
                var fallback = document.createElement('div');
                fallback.textContent = '📷 圖片無法顯示';
                fallback.style.cssText = 'padding:12px;color:#999;text-align:center;border:1px dashed #ddd;border-radius:4px;';
                imgContainer.appendChild(fallback);
            };
            imgContainer.appendChild(img);
            container.appendChild(imgContainer);
        }

        // ============================================================
        // ✅ 主區域 - 固定高度，讓 Canvas 能正確定位
        // ============================================================
        var mainDiv = document.createElement('div');
        mainDiv.id = 'link-main-' + index;
        mainDiv.style.cssText = 'position:relative;background:#fcfaf7;border:2px solid #d5c8a8;border-radius:8px;min-height:350px;overflow:hidden;padding:20px 30px;';

        // ============================================================
        // ✅ 內容區域（左右欄並排）
        // ============================================================
        var contentDiv = document.createElement('div');
        contentDiv.id = 'link-content-' + index;
        contentDiv.style.cssText = 'display:flex;gap:330px;align-items:flex-start;';

        // ----- 左欄（固定寬度 40%）-----
        var leftCol = document.createElement('div');
        leftCol.id = 'link-left-' + index;
        leftCol.style.cssText = 'display:flex;flex-direction:column;gap:14px;flex:0 0 20%;';

        var leftTitle = document.createElement('div');
        leftTitle.textContent = '📌 左欄';
        leftTitle.style.cssText = 'font-weight:700;font-size:18px;color:#1a1a2e;padding-bottom:8px;border-bottom:2px solid #1a1a2e;margin-bottom:4px;';
        leftCol.appendChild(leftTitle);

        leftItems.forEach(function(item, i) {
            var card = document.createElement('div');
            card.className = 'link-left-item';
            card.dataset.index = i;
            card.dataset.value = item;
            card.id = 'link-left-item-' + index + '-' + i;

            var isMatched = saved[i] !== undefined && saved[i] !== null && saved[i] !== '';

            card.textContent = item;
            // ✅ 固定高度 100px
            card.style.cssText = 'padding:14px 20px;background:' + (isMatched ? '#e8f5e9' : '#ffffff') + ';border:2px solid ' + (isMatched ? '#2e7d32' : '#b5a88a') + ';border-radius:8px;font-size:18px;font-weight:600;cursor:pointer;transition:all 0.2s;text-align:center;height:100px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.06);';

            if (isMatched) {
                card.textContent = item + ' ✅';
                card.style.color = '#2e7d32';
            }

            card.onclick = (function(leftIdx) {
                return function() {
                    handleLeftClick(leftIdx, index);
                };
            })(i);

            leftCol.appendChild(card);
        });
        contentDiv.appendChild(leftCol);

        // ----- 右欄（固定寬度 40%）-----
        var rightCol = document.createElement('div');
        rightCol.id = 'link-right-' + index;
        rightCol.style.cssText = 'display:flex;flex-direction:column;gap:14px;flex:0 0 20%;';

        var rightTitle = document.createElement('div');
        rightTitle.textContent = '🎯 右欄';
        rightTitle.style.cssText = 'font-weight:700;font-size:18px;color:#1a1a2e;padding-bottom:8px;border-bottom:2px solid #1a1a2e;margin-bottom:4px;';
        rightCol.appendChild(rightTitle);

        // 隨機排列右欄
        var shuffleKey = 'link_shuffle_' + index;
        var shuffledRight = window[shuffleKey];
        if (!shuffledRight) {
            shuffledRight = correctAnswers.slice();
            for (var i = shuffledRight.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = shuffledRight[i];
                shuffledRight[i] = shuffledRight[j];
                shuffledRight[j] = temp;
            }
            window[shuffleKey] = shuffledRight;
        }

        shuffledRight.forEach(function(item, idx) {
            var isUsed = Object.values(saved).includes(item);

            var card = document.createElement('div');
            card.className = 'link-right-item';
            card.dataset.value = item;
            card.dataset.index = idx;
            card.id = 'link-right-item-' + index + '-' + idx;

            card.textContent = item;
            // ✅ 固定高度 100px
            card.style.cssText = 'padding:14px 20px;background:' + (isUsed ? '#e8f5e9' : '#ffffff') + ';border:2px solid ' + (isUsed ? '#2e7d32' : '#b5a88a') + ';border-radius:8px;font-size:17px;font-weight:500;cursor:' + (isUsed ? 'default' : 'pointer') + ';transition:all 0.2s;text-align:center;height:100px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.06);' + (isUsed ? 'opacity:0.8;' : '');

            if (isUsed) {
                card.textContent = item + ' ✅';
                card.style.color = '#2e7d32';
            }

            card.onclick = (function(rightValue) {
                return function() {
                    handleRightClick(rightValue, index);
                };
            })(item);

            rightCol.appendChild(card);
        });
        contentDiv.appendChild(rightCol);

        mainDiv.appendChild(contentDiv);
        container.appendChild(mainDiv);

        // ============================================================
        // ✅ Canvas 畫線層
        // ============================================================
        var canvas = document.createElement('canvas');
        canvas.id = 'link-canvas-' + index;
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;touch-action:none;';
        mainDiv.appendChild(canvas);

        // ============================================================
        // ✅ 核心邏輯函數
        // ============================================================

        function getMatcherArray() {
            var matcher = [];
            for (var i = 0; i < leftItems.length; i++) {
                if (saved[i] !== undefined && saved[i] !== null && saved[i] !== '') {
                    var rightIdx = -1;
                    for (var j = 0; j < shuffledRight.length; j++) {
                        if (shuffledRight[j] === saved[i]) {
                            rightIdx = j;
                            break;
                        }
                    }
                    matcher.push([i, rightIdx]);
                } else {
                    matcher.push([-1, -1]);
                }
            }
            return matcher;
        }

        function drawLines() {
            var canvasEl = document.getElementById('link-canvas-' + index);
            if (!canvasEl) return;

            var mainDivEl = document.getElementById('link-main-' + index);
            if (!mainDivEl) return;

            var rect = mainDivEl.getBoundingClientRect();
            var dpr = window.devicePixelRatio || 1;
            canvasEl.width = rect.width * dpr;
            canvasEl.height = rect.height * dpr;
            canvasEl.style.width = rect.width + 'px';
            canvasEl.style.height = rect.height + 'px';

            var ctx = canvasEl.getContext('2d');
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, rect.width, rect.height);

            var matcher = getMatcherArray();
            var colors = ['#2e7d32', '#0d47a1', '#e65100', '#6a1b9a', '#c62828', '#00838f', '#4e342e', '#827717'];

            matcher.forEach(function(pair, idx) {
                var leftIdx = pair[0];
                var rightIdx = pair[1];

                if (leftIdx === -1 || rightIdx === -1) return;

                var leftEl = document.getElementById('link-left-item-' + index + '-' + leftIdx);
                var rightEl = document.getElementById('link-right-item-' + index + '-' + rightIdx);

                if (!leftEl || !rightEl) return;

                var leftRect = leftEl.getBoundingClientRect();
                var rightRect = rightEl.getBoundingClientRect();
                var mainRect = mainDivEl.getBoundingClientRect();

                var x1 = leftRect.right - mainRect.left;
                var y1 = leftRect.top + leftRect.height / 2 - mainRect.top;
                var x2 = rightRect.left - mainRect.left;
                var y2 = rightRect.top + rightRect.height / 2 - mainRect.top;

                var color = colors[idx % colors.length];

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(x1, y1, 6, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x2, y2, 6, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                var midX = (x1 + x2) / 2;
                var midY = (y1 + y2) / 2;
                ctx.beginPath();
                ctx.arc(midX, midY, 7, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            });
        }

        function handleLeftClick(leftIdx, qIndex) {
            if (saved[leftIdx] !== undefined && saved[leftIdx] !== null && saved[leftIdx] !== '') {
                delete saved[leftIdx];
                window.G_userAnswers[qIndex] = saved;
                window._linkSelectedLeft = null;
                renderQuestion(qIndex);
                return;
            }

            document.querySelectorAll('#link-left-' + qIndex + ' .link-left-item').forEach(function(el) {
                el.style.borderColor = '#b5a88a';
                el.style.background = '#ffffff';
            });

            window._linkSelectedLeft = leftIdx;
            var el = document.getElementById('link-left-item-' + qIndex + '-' + leftIdx);
            if (el) {
                el.style.borderColor = '#067ae0';
                el.style.background = '#e8f0fe';
            }
        }

        function handleRightClick(rightValue, qIndex) {
            var isUsed = Object.values(saved).includes(rightValue);
            if (isUsed) return;

            var leftIdx = window._linkSelectedLeft;
            if (leftIdx === null || leftIdx === undefined) {
                var statusEl = document.getElementById('link-status-' + qIndex);
                if (statusEl) {
                    statusEl.textContent = '⚠️ 請先點選左欄項目';
                    statusEl.style.color = '#e65100';
                    setTimeout(function() {
                        updateStatus(qIndex);
                    }, 2000);
                }
                return;
            }

            if (saved[leftIdx] !== undefined && saved[leftIdx] !== null && saved[leftIdx] !== '') {
                delete saved[leftIdx];
            }

            for (var key in saved) {
                if (saved[key] === rightValue) {
                    delete saved[key];
                    break;
                }
            }

            saved[leftIdx] = rightValue;
            window.G_userAnswers[qIndex] = saved;
            window._linkSelectedLeft = null;

            renderQuestion(qIndex);
        }

        function updateStatus(qIndex) {
            var statusEl = document.getElementById('link-status-' + qIndex);
            if (!statusEl) return;
            var matchedCount = Object.keys(saved).filter(function(k) { return saved[k] !== undefined && saved[k] !== null && saved[k] !== ''; }).length;
            if (matchedCount === numSlots) {
                statusEl.innerHTML = '✅ 已完成所有配對！ (' + matchedCount + '/' + numSlots + ')';
                statusEl.style.color = '#2e7d32';
                statusEl.style.fontWeight = '600';
            } else {
                statusEl.textContent = '已配對 ' + matchedCount + '/' + numSlots + ' 組';
                statusEl.style.color = '#666';
            }
        }

        // ============================================================
        // ✅ 畫線排程
        // ============================================================
        setTimeout(drawLines, 100);
        setTimeout(drawLines, 300);
        setTimeout(drawLines, 600);
        setTimeout(drawLines, 1000);

        var resizeHandler = function() {
            drawLines();
        };
        window.addEventListener('resize', resizeHandler);
        window['_linkResizeHandler_' + index] = resizeHandler;

        // ============================================================
        // ✅ 狀態與操作按鈕
        // ============================================================
        var statusRow = document.createElement('div');
        statusRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:10px 16px;background:#f5f0e8;border-radius:6px;';

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

        var btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;';
        var clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑️ 清除所有配對';
        clearBtn.style.cssText = 'padding:8px 20px;background:#fff;border:2px solid #e05046;border-radius:6px;color:#e05046;font-size:15px;cursor:pointer;';
        clearBtn.onclick = function() {
            if (matchedCount === 0) return;
            if (confirm('確定要清除所有配對嗎？')) {
                window.G_userAnswers[index] = {};
                window._linkSelectedLeft = null;
                delete window['link_shuffle_' + index];
                if (typeof renderQuestion === 'function') {
                    renderQuestion(index);
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

    window.renderLink = renderLink;

    console.log('✅ 35_渲染_連連看 v10.18.0 已載入');
    console.log('   🔗 連連看: 格子高度 70px，左右寬度 40%，間距 80px');

})();