// ============================================================
// 📌 考試控制器.js - 測驗核心控制器 v10.2.0
// 功能：計時器、字型控制、標記功能
// 更新日期：2026-07-18
// 版本：10.2.0
// ============================================================

console.log('📌 26_系統_考試控制核心 v10.2.0 載入中...');

var ExamController = {
    // ============================================================
    // 1. 資料
    // ============================================================
    data: function() {
        return {
            // ✅ 修復：從全域變數讀取計時器初始值
            totalSeconds: (typeof window.G_countdownSeconds !== 'undefined') 
                ? window.G_countdownSeconds 
                : 7200,
            timerInterval: null,
            timerDisplay: "02:00:00",
            fontSizeLevel: 0,
            markedQuestions: [],
            showOverview: false,
            selectedJumpIndex: 0,
            userInfo: {
                name: "LSH",
                idNumber: "A000000000",
                examNumber: "115N99900034753",
                seatNumber: "0101",
                jobKind: "營造業甲種職業安全衛生業務主管教育訓練"
            }
        };
    },

    // ============================================================
    // 2. 計算屬性
    // ============================================================
    computed: {
        answeredCount: function() {
            if (!this.userAnswers || this.userAnswers.length === 0) return 0;
            return this.userAnswers.filter(function(ans, idx) {
                return this.isAnswered(idx);
            }.bind(this)).length;
        }
    },

    // ============================================================
    // 3. 方法
    // ============================================================

    // ----- 3.1 計時器 -----
    startTimer: function() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        var self = this;
        this.timerInterval = setInterval(function() {
            if (self.totalSeconds <= 0) {
                clearInterval(self.timerInterval);
                self.timerDisplay = "00:00:00";
                alert("⏰ 測驗時間結束！");
                self.submitExam();
                return;
            }
            self.totalSeconds--;
            self.updateTimerDisplay();
            
            // ✅ 同步更新全域計時器
            if (typeof window.G_countdownSeconds !== 'undefined') {
                window.G_countdownSeconds = self.totalSeconds;
            }
        }, 1000);
    },

    updateTimerDisplay: function() {
        var h = Math.floor(this.totalSeconds / 3600);
        var m = Math.floor((this.totalSeconds % 3600) / 60);
        var s = this.totalSeconds % 60;
        this.timerDisplay = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
        
        // 更新 DOM
        var timerEl = document.getElementById('countdownDisplay');
        if (timerEl) timerEl.textContent = this.timerDisplay;
        
        // 同步更新全域變數
        if (typeof window.G_countdownSeconds !== 'undefined') {
            window.G_countdownSeconds = this.totalSeconds;
        }
        
        // 時間不足時變色提醒
        if (this.totalSeconds < 600) {
            if (timerEl) timerEl.style.color = '#e05046';
        } else if (this.totalSeconds < 1800) {
            if (timerEl) timerEl.style.color = '#f7c948';
        } else {
            if (timerEl) timerEl.style.color = '#1a1a2e';
        }
    },

    // ✅ 新增：重置計時器（支援外部設定）
    resetTimer: function(seconds) {
        if (seconds === undefined) {
            seconds = (typeof window.G_countdownSeconds !== 'undefined') 
                ? window.G_countdownSeconds 
                : 7200;
        }
        this.totalSeconds = seconds;
        this.updateTimerDisplay();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.startTimer();
    },

    // ----- 3.2 字型大小控制 -----
    fontSizeChange: function(direction) {
        var baseSize = 1.4;
        var step = 0.1;
        if (direction === 0) {
            this.fontSizeLevel = 0;
        } else {
            this.fontSizeLevel = Math.max(-4, Math.min(4, this.fontSizeLevel + direction));
        }
        var newSize = Math.min(2.0, Math.max(1.0, baseSize + this.fontSizeLevel * step));
        document.documentElement.style.fontSize = newSize + "em";
        try {
            localStorage.setItem("exam_font_size", this.fontSizeLevel);
        } catch (e) {}
    },

    restoreFontSize: function() {
        try {
            var saved = parseInt(localStorage.getItem("exam_font_size"));
            if (!isNaN(saved)) {
                this.fontSizeLevel = Math.max(-4, Math.min(4, saved));
                var baseSize = 1.4;
                document.documentElement.style.fontSize = Math.min(2.0, Math.max(1.0, baseSize + this.fontSizeLevel * 0.1)) + "em";
            }
        } catch (e) {}
    },

    // ----- 3.3 標記功能 -----
    toggleMark: function() {
        var idx = this.currentIndex;
        var pos = this.markedQuestions.indexOf(idx);
        if (pos > -1) {
            this.markedQuestions.splice(pos, 1);
        } else {
            this.markedQuestions.push(idx);
        }
        // ✅ 修復：使用 G_markedQuestions
        if (window.G_markedQuestions) {
            if (pos > -1) {
                delete window.G_markedQuestions[idx];
            } else {
                window.G_markedQuestions[idx] = true;
            }
        }
        this.updateMarkStatus();
    },

    isMarked: function() {
        return this.markedQuestions.indexOf(this.currentIndex) > -1;
    },

    updateMarkStatus: function() {
        var markBtn = document.getElementById('markButton');
        if (markBtn) {
            if (this.isMarked()) {
                markBtn.classList.add('active');
                markBtn.textContent = '★ 標記';
            } else {
                markBtn.classList.remove('active');
                markBtn.textContent = '☆ 標記';
            }
        }
        // 更新標記數量
        var countEl = document.getElementById('markCount');
        if (countEl) {
            countEl.textContent = '標記: ' + this.markedQuestions.length + ' 題';
        }
    },

    // ----- 3.4 取消作答 -----
    cancelAnswer: function() {
        var type = this.currentQuestion ? this.currentQuestion.type : "single";
        // ✅ 修復：使用 G_userAnswers
        if (!window.G_userAnswers) {
            window.G_userAnswers = {};
        }
        
        if (["multiple", "sort", "match", "link"].indexOf(type) !== -1) {
            window.G_userAnswers[this.currentIndex] = [];
        } else if (["single", "truefalse"].indexOf(type) !== -1) {
            window.G_userAnswers[this.currentIndex] = null;
        } else {
            window.G_userAnswers[this.currentIndex] = "";
        }
        
        // 更新本地引用
        this.userAnswers = window.G_userAnswers;
        this.renderQuestion();
        this.updateAnsweredCount();
    },

    // ----- 3.5 作答總覽 -----
    openOverview: function() {
        this.showOverview = true;
        if (typeof window.openOverview === 'function') {
            window.openOverview();
        }
    },

    closeOverview: function() {
        this.showOverview = false;
        if (typeof window.closeOverview === 'function') {
            window.closeOverview();
        }
    },

    jumpToQuestion: function(index) {
        if (index === undefined) {
            index = this.selectedJumpIndex;
        }
        if (index >= 0 && index < this.totalQuestions) {
            this.currentIndex = index;
            this.showQuestion();
            this.closeOverview();
        }
    },

    // ----- 3.6 提前結束測驗 -----
    confirmEndExam: function() {
        if (confirm("⚠️ 確定要提前結束測驗嗎？\n\n已作答 " + this.answeredCount + " / " + this.totalQuestions + " 題")) {
            if (confirm("請再次確定是否要結束測驗？")) {
                this.submitExam();
            }
        }
    },

    // ----- 3.7 檢查是否作答 -----
    isAnswered: function(index) {
        // ✅ 修復：使用 G_userAnswers
        var answers = window.G_userAnswers || {};
        var answer = answers[index];
        if (answer === undefined || answer === null) return false;
        if (Array.isArray(answer)) {
            return answer.length > 0 && answer.some(function(a) {
                return a !== "" && a !== null && a !== undefined;
            });
        }
        if (typeof answer === "object" && answer !== null) {
            var keys = Object.keys(answer);
            return keys.length > 0 && keys.some(function(k) {
                var v = answer[k];
                return v !== "" && v !== null && v !== undefined;
            });
        }
        return answer !== "" && answer !== null && answer !== undefined;
    },

    // ----- 3.8 渲染題目 -----
    renderQuestion: function() {
        var idx = this.currentIndex;
        if (typeof window.renderQuestion === 'function') {
            window.renderQuestion(idx);
        } else {
            console.warn('⚠️ renderQuestion 未定義');
        }
        this.updateMarkStatus();
        this.updateAnsweredCount();
    },

    updateAnsweredCount: function() {
        var count = 0;
        var total = this.totalQuestions || 0;
        // ✅ 修復：使用 G_userAnswers
        var answers = window.G_userAnswers || {};
        for (var i = 0; i < total; i++) {
            if (this.isAnswered(i)) count++;
        }
        var el = document.getElementById('answeredCount');
        if (el) {
            el.textContent = '已答: ' + count + '/' + total + ' 題';
        }
        // 同步更新全域
        if (typeof window._answeredCount !== 'undefined') {
            window._answeredCount = count;
        }
        return count;
    },

    // ----- 3.9 提交測驗 -----
    submitExam: function() {
        if (typeof window.submitExam === 'function') {
            window.submitExam();
        } else {
            alert('✅ 測驗已送出！');
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
};

// ============================================================
// 4. 生命週期鉤子
// ============================================================
ExamController.mounted = function() {
    // 從全域變數同步計時器
    if (typeof window.G_countdownSeconds !== 'undefined') {
        this.totalSeconds = window.G_countdownSeconds;
    }
    this.restoreFontSize();
    this.startTimer();
    console.log("✅ ExamController v10.2.0 已載入");
};

ExamController.beforeDestroy = function() {
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
    }
};

// ============================================================
// 5. 初始化
// ============================================================
if (typeof window.G_userAnswers === 'undefined') {
    window.G_userAnswers = {};
}
if (typeof window.G_markedQuestions === 'undefined') {
    window.G_markedQuestions = {};
}

// 確保 ExamController 的 userAnswers 指向 G_userAnswers
ExamController.userAnswers = window.G_userAnswers;

// ============================================================
// 6. 匯出到全域
// ============================================================
if (typeof Vue !== "undefined") {
    console.log("✅ ExamController v10.2.0 已註冊到 Vue");
}

window.ExamController = ExamController;

console.log('✅ 26_系統_考試控制核心 v10.2.0 已載入');
console.log('   ⏱️ 計時器: ' + (ExamController.totalSeconds || 7200) + ' 秒');
console.log('   🔤 字型大小: 支援調整');
console.log('   💾 統一使用 G_userAnswers');