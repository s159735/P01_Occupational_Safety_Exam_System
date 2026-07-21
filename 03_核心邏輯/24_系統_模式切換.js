// ============================================================
// 🔄 系統_模式切換 v10.2.0
// 職責：學科/術科/計算模式切換
// 區塊：C（20~29）
// 編號：24
// 更新日期：2026-07-18
// ============================================================

console.log('🔄 24_系統_模式切換 v10.2.0 載入中...');

(function() {
    'use strict';

    // ============================================================
    // 1. 模式定義
    // ============================================================

    var MODES = {
        academic: {
            label: '學科',
            description: '一般學科測驗',
            totalQuestions: 80,
            passScore: 60,
            timeSeconds: 6000  // 100 分鐘
        },
        technical: {
            label: '術科',
            description: '術科測驗',
            totalQuestions: 10,
            passScore: 60,
            timeSeconds: 7200  // 120 分鐘
        },
        calc: {
            label: '計算',
            description: '計算題專區',
            totalQuestions: 0,
            passScore: 0,
            timeSeconds: 3600  // 60 分鐘
        }
    };

    // ============================================================
    // 2. 切換模式
    // ============================================================

    function switchMode(mode) {
        if (!mode || !MODES[mode]) {
            console.warn('⚠️ 無效的模式: ' + mode);
            return;
        }

        // 更新按鈕狀態
        var btns = document.querySelectorAll('.mode-btn');
        btns.forEach(function(btn) {
            btn.classList.remove('active');
        });

        var map = { 'academic': 0, 'technical': 1, 'calc': 2 };
        var idx = map[mode];
        if (idx !== undefined && btns[idx]) btns[idx].classList.add('active');

        // 更新全域模式
        window.G_currentMode = mode;
        window.G_examMode = mode;

        var modeInfo = MODES[mode];
        console.log('📚 切換到 ' + modeInfo.label + ' 模式 (v10.2.0)');

        // 更新 UI
        var modeLabel = document.getElementById('modeLabel');
        if (modeLabel) {
            modeLabel.textContent = modeInfo.label + '模式';
        }

        var modeDesc = document.getElementById('modeDescription');
        if (modeDesc) {
            modeDesc.textContent = modeInfo.description;
        }

        // ============================================================
        // 根據模式設定計時器秒數
        // ============================================================

        var newSeconds = modeInfo.timeSeconds || 7200;
        
        // 更新全域計時器
        if (typeof window.G_countdownSeconds !== 'undefined') {
            window.G_countdownSeconds = newSeconds;
        }
        
        // 如果有 ExamController，也更新它
        if (typeof window.ExamController !== 'undefined' && window.ExamController) {
            if (typeof window.ExamController.resetTimer === 'function') {
                window.ExamController.resetTimer(newSeconds);
            } else if (typeof window.ExamController.totalSeconds !== 'undefined') {
                window.ExamController.totalSeconds = newSeconds;
                if (typeof window.ExamController.updateTimerDisplay === 'function') {
                    window.ExamController.updateTimerDisplay();
                }
            }
        }

        // 更新 UI 計時器顯示
        var timerEl = document.getElementById('countdownDisplay');
        if (timerEl) {
            var h = Math.floor(newSeconds / 3600);
            var m = Math.floor((newSeconds % 3600) / 60);
            var s = newSeconds % 60;
            timerEl.textContent = String(h).padStart(2, '0') + ':' +
                String(m).padStart(2, '0') + ':' +
                String(s).padStart(2, '0');
        }

        console.log('⏱️ 計時器已設定: ' + Math.floor(newSeconds / 60) + ' 分鐘 (' + newSeconds + ' 秒)');

        // ============================================================
        // 載入題目（統一使用 22_系統_題庫載入.js）
        // ============================================================

        if (typeof window.loadQuestionsByMode === 'function') {
            window.loadQuestionsByMode(mode);
        } else {
            console.warn('⚠️ loadQuestionsByMode 未定義');
            // 嘗試從全域取得
            if (typeof loadQuestionsByMode === 'function') {
                loadQuestionsByMode(mode);
            } else {
                console.error('❌ loadQuestionsByMode 未載入，請檢查 22_系統_題庫載入.js');
                alert('系統載入中，請重新整理頁面');
            }
        }

        // 更新計分規則
        if (typeof window.ScoreEngine !== 'undefined') {
            var total = modeInfo.totalQuestions || window.G_totalQuestions || 0;
            var pass = modeInfo.passScore || 60;
            console.log('📊 計分規則: 總題數=' + total + ', 及格=' + pass);
        }

        // 觸發模式切換事件
        var event = new CustomEvent('modeChanged', {
            detail: { mode: mode, modeInfo: modeInfo }
        });
        document.dispatchEvent(event);
    }

    // ============================================================
    // 3. 取得目前模式
    // ============================================================

    function getCurrentMode() {
        return window.G_currentMode || 'academic';
    }

    function getModeInfo(mode) {
        return MODES[mode] || MODES.academic;
    }

    // ============================================================
    // 4. 從 API 取得模式資訊（未來擴充）
    // ============================================================

    function fetchModesFromAPI() {
        if (typeof window.apiGetModes === 'function') {
            return window.apiGetModes()
                .then(function(result) {
                    if (result && result.success && result.data) {
                        console.log('📋 從 API 取得模式資訊:', result.data);
                        return result.data;
                    }
                    return null;
                })
                .catch(function(error) {
                    console.warn('⚠️ 從 API 取得模式資訊失敗:', error);
                    return null;
                });
        }
        return Promise.resolve(null);
    }

    // ============================================================
    // 5. 匯出到全域
    // ============================================================

    window.switchMode = switchMode;
    window.getCurrentMode = getCurrentMode;
    window.getModeInfo = getModeInfo;
    window.fetchModesFromAPI = fetchModesFromAPI;
    window.MODES = MODES;

    console.log('✅ 24_系統_模式切換 v10.2.0 已載入');
    console.log('   📚 支援模式: ' + Object.keys(MODES).join(', '));
    console.log('   ⏱️ 計時器會根據模式自動切換');

})();