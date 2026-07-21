// ============================================================
// 🔄 系統_導航控制 v10.2.1
// 職責：上一題/下一題/跳題/作答總覽
// 區塊：C（20~29）
// 編號：23
// 更新日期：2026-07-21
// 修復：跳題下拉選單只顯示題號 1~10
// ============================================================

console.log('🔄 23_系統_導航控制 v10.2.1 載入中...');

(function() {
    'use strict';

    // ============================================================
    // 1. 更新跳題下拉選單（✅ 只顯示題號 1~10）
    // ============================================================
    function updateJumpSelect(currentIndex) {
        var select = document.getElementById('jumpSelect');
        if (!select) return;

        var total = window.G_totalQuestions || 0;
        if (total === 0) {
            select.innerHTML = '<option value="0">1</option>';
            return;
        }

        // 清空下拉選單
        select.innerHTML = '';

        // ✅ 只顯示題號 1~10（根據目前題號自動選中）
        for (var i = 0; i < total; i++) {
            var option = document.createElement('option');
            option.value = i;
            option.textContent = (i + 1);
            if (i === currentIndex) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    }

    // ============================================================
    // 2. 下一題
    // ============================================================
    function nextQuestion() {
        if (window.G_currentQuestionIndex < window.G_totalQuestions - 1) {
            window.G_currentQuestionIndex++;
            if (typeof renderQuestion === 'function') {
                renderQuestion(window.G_currentQuestionIndex);
            } else {
                console.error('❌ renderQuestion 未定義');
            }
            if (typeof updateJumpSelect === 'function') {
                updateJumpSelect(window.G_currentQuestionIndex);
            }
        } else {
            console.log('📌 已是最後一題');
        }
    }

    // ============================================================
    // 3. 上一題
    // ============================================================
    function prevQuestion() {
        if (window.G_currentQuestionIndex > 0) {
            window.G_currentQuestionIndex--;
            if (typeof renderQuestion === 'function') {
                renderQuestion(window.G_currentQuestionIndex);
            } else {
                console.error('❌ renderQuestion 未定義');
            }
            if (typeof updateJumpSelect === 'function') {
                updateJumpSelect(window.G_currentQuestionIndex);
            }
        } else {
            console.log('📌 已是第一題');
        }
    }

    // ============================================================
    // 4. 跳題
    // ============================================================
    function jumpToQuestion(value) {
        var idx = parseInt(value);
        if (isNaN(idx) || idx < 0) {
            return;
        }
        if (idx >= 0 && idx < window.G_totalQuestions) {
            window.G_currentQuestionIndex = idx;
            if (typeof renderQuestion === 'function') {
                renderQuestion(window.G_currentQuestionIndex);
            } else {
                console.error('❌ renderQuestion 未定義');
            }
            if (typeof updateJumpSelect === 'function') {
                updateJumpSelect(window.G_currentQuestionIndex);
            }
        } else {
            console.warn('⚠️ 無效的題號: ' + value);
        }
    }

    // ============================================================
    // 5. 開啟作答總覽
    // ============================================================
    function openOverview() {
        var grid = document.getElementById('overviewGrid');
        if (!grid) {
            console.warn('⚠️ overviewGrid 不存在');
            return;
        }
        grid.innerHTML = '';

        for (var i = 0; i < window.G_totalQuestions; i++) {
            var div = document.createElement('div');
            div.className = 'overview-item';

            var val = window.G_userAnswers[i];
            if (val !== undefined && val !== '' && val !== null) {
                if (typeof val === 'string' && val.indexOf(',') !== -1) {
                    var parts = val.split(',').filter(function(v) { return v.trim() !== ''; });
                    if (parts.length > 0) div.classList.add('answered');
                } else if (Array.isArray(val) && val.length > 0) {
                    div.classList.add('answered');
                } else if (typeof val === 'object' && Object.keys(val).length > 0) {
                    div.classList.add('answered');
                } else {
                    div.classList.add('answered');
                }
            }

            if (i === window.G_currentQuestionIndex) div.classList.add('current');
            if (window.G_markedQuestions[i]) div.classList.add('marked');

            div.textContent = i + 1;
            (function(idx) {
                div.onclick = function() {
                    window.G_currentQuestionIndex = idx;
                    if (typeof renderQuestion === 'function') {
                        renderQuestion(window.G_currentQuestionIndex);
                    }
                    if (typeof updateJumpSelect === 'function') {
                        updateJumpSelect(window.G_currentQuestionIndex);
                    }
                    closeOverview();
                };
            })(i);

            grid.appendChild(div);
        }

        var overlay = document.getElementById('overlay');
        if (overlay) overlay.classList.add('active');
    }

    // ============================================================
    // 6. 關閉作答總覽
    // ============================================================
    function closeOverview() {
        var overlay = document.getElementById('overlay');
        if (overlay) overlay.classList.remove('active');
    }

    // ============================================================
    // 7. 切換頂部面板顯示
    // ============================================================
    function toggleTopRows() {
        var btn = document.querySelector('.toggle-btn');
        var row1 = document.getElementById('topRow1');
        var row2 = document.getElementById('toppanel');
        var row3 = document.getElementById('toppanel2');
        var middle = document.getElementById('id_middle');

        window.G_topRowsHidden = !window.G_topRowsHidden;

        if (window.G_topRowsHidden) {
            if (row1) row1.style.display = 'none';
            if (row2) row2.style.display = 'none';
            if (row3) row3.style.display = 'none';
            if (btn) btn.textContent = '🔼 展開';
            if (middle) middle.style.top = '120px';
        } else {
            if (row1) row1.style.display = 'flex';
            if (row2) row2.style.display = 'flex';
            if (row3) row3.style.display = 'flex';
            if (btn) btn.textContent = '🔽 隱藏 / 展開';
            if (middle) middle.style.top = '173px';
        }
    }

    // ============================================================
    // 8. 在 renderQuestion 中自動更新跳題選單
    // ============================================================
    var originalRenderQuestion = window.renderQuestion;

    if (typeof originalRenderQuestion === 'function') {
        window.renderQuestion = function(index) {
            originalRenderQuestion(index);
            updateJumpSelect(index);
        };
    }

    // ============================================================
    // 9. 鍵盤快捷鍵支援
    // ============================================================
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            prevQuestion();
        }
        if (e.key === 'ArrowRight' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            nextQuestion();
        }
        if (e.key === 'Escape') {
            closeOverview();
        }
        if (e.key === 'g' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            openOverview();
        }
    });

    // ============================================================
    // 10. 匯出到全域
    // ============================================================
    window.nextQuestion = nextQuestion;
    window.prevQuestion = prevQuestion;
    window.jumpToQuestion = jumpToQuestion;
    window.openOverview = openOverview;
    window.closeOverview = closeOverview;
    window.toggleTopRows = toggleTopRows;
    window.updateJumpSelect = updateJumpSelect;

    console.log('✅ 23_系統_導航控制 v10.2.1 已載入');
    console.log('   ⌨️ 快捷鍵: ← 上一題 | → 下一題 | ESC 關閉 | G 總覽');
    console.log('   📋 跳題下拉選單只顯示題號 1~10');

})();