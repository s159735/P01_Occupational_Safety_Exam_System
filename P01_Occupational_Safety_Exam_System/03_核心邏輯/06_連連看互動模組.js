// ============================================================
// 📝 連連看模組.js - 連連看互動邏輯 v10.2.0
// 職責：左欄/右欄選擇、配對狀態管理、配對驗證
// 更新日期：2026-07-17
// ============================================================

console.log('📝 06_連連看互動模組 v10.2.0 載入中...');

window.LinkModule = {
    // ============================================================
    // 狀態變數
    // ============================================================
    selectedLeft: null,
    pairCount: 0,
    matchedPairs: {},

    // ============================================================
    // 選擇左欄項目
    // ============================================================
    selectLeft: function(index) {
        this.selectedLeft = index;
        var items = document.querySelectorAll('.link-left-item');
        items.forEach(function(el, i) {
            if (i === index) {
                el.style.border = '3px solid #1a237e';
                el.style.background = '#e8eaf6';
                el.classList.add('selected');
            } else {
                el.style.border = '2px solid #e8e8e8';
                el.style.background = '#fafafa';
                el.classList.remove('selected');
            }
        });
        
        // 更新狀態提示
        var status = document.getElementById('link-status');
        if (status) {
            status.textContent = '已選取左欄項目，請點選右欄配對';
            status.style.color = '#1a237e';
        }
    },

    // ============================================================
    // 選擇右欄項目（配對）
    // ============================================================
    selectRight: function(index, appContext) {
        if (this.selectedLeft === null) {
            var status = document.getElementById('link-status');
            if (status) {
                status.textContent = '⚠️ 請先點選左欄項目';
                status.style.color = '#e65100';
                setTimeout(function() {
                    status.textContent = '請點選左欄項目，再點選右欄進行配對';
                    status.style.color = '#666';
                }, 2000);
            }
            return;
        }
        
        var leftIdx = this.selectedLeft;
        
        // 儲存配對
        if (!appContext.userAnswers[appContext.currentIndex]) {
            appContext.userAnswers[appContext.currentIndex] = {};
        }
        appContext.userAnswers[appContext.currentIndex][leftIdx] = index;
        this.matchedPairs[leftIdx] = index;
        
        // 更新左欄樣式（已配對）
        var leftItems = document.querySelectorAll('.link-left-item');
        leftItems.forEach(function(el, i) {
            if (i === leftIdx) {
                el.style.border = '2px solid #2e7d32';
                el.style.background = '#c8e6c9';
                el.classList.remove('selected');
                el.classList.add('matched');
            }
        });
        
        // 更新右欄樣式（已配對）
        var rightItems = document.querySelectorAll('.link-right-item');
        rightItems.forEach(function(el, i) {
            if (i === index) {
                el.style.border = '2px solid #2e7d32';
                el.style.background = '#c8e6c9';
                el.classList.add('matched');
                el.dataset.matched = 'true';
            }
        });
        
        // 重置選中狀態
        this.selectedLeft = null;
        this.pairCount = Object.keys(appContext.userAnswers[appContext.currentIndex]).length;
        
        // 更新狀態
        var totalPairs = leftItems.length;
        var status = document.getElementById('link-status');
        if (status) {
            if (this.pairCount === totalPairs) {
                status.innerHTML = '✅ 所有項目已配對完成！';
                status.style.background = '#c8e6c9';
                status.style.color = '#2e7d32';
                status.style.padding = '8px 12px';
                status.style.borderRadius = '4px';
            } else {
                status.textContent = '已配對 ' + this.pairCount + ' / ' + totalPairs + ' 組';
                status.style.background = 'transparent';
                status.style.color = '#666';
            }
        }
        
        // 重新渲染題目（更新 UI）
        appContext.renderQuestion();
    },

    // ============================================================
    // 清除所有配對
    // ============================================================
    clearAll: function(appContext) {
        if (this.pairCount === 0) return;
        
        if (!confirm('確定要清除所有配對嗎？')) return;
        
        this.selectedLeft = null;
        this.pairCount = 0;
        this.matchedPairs = {};
        delete appContext.userAnswers[appContext.currentIndex];
        
        document.querySelectorAll('.link-left-item, .link-right-item').forEach(function(el) {
            el.style.border = '2px solid #e8e8e8';
            el.style.background = '#fafafa';
            el.classList.remove('selected', 'matched');
            el.dataset.matched = 'false';
        });
        
        var status = document.getElementById('link-status');
        if (status) {
            status.textContent = '請點選左欄項目，再點選右欄進行配對';
            status.style.background = 'transparent';
            status.style.color = '#666';
            status.style.padding = '0';
        }
        
        appContext.renderQuestion();
    },

    // ============================================================
    // 驗證配對是否正確
    // ============================================================
    verifyMatch: function(leftIndex, rightIndex) {
        // 由外部驗證器處理
        return true;
    },

    // ============================================================
    // 檢查是否全部配對完成
    // ============================================================
    isComplete: function() {
        var rightItems = document.querySelectorAll('.link-right-item');
        var allMatched = true;
        rightItems.forEach(function(el) {
            if (!el.dataset.matched || el.dataset.matched === 'false') {
                allMatched = false;
            }
        });
        return allMatched;
    },

    // ============================================================
    // 獲取配對結果
    // ============================================================
    getMatchResult: function() {
        return this.matchedPairs;
    },

    // ============================================================
    // 重置模組
    // ============================================================
    reset: function() {
        this.selectedLeft = null;
        this.pairCount = 0;
        this.matchedPairs = {};
    }
};

console.log('✅ LinkModule v10.2.0 已載入');