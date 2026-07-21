// ============================================================
// 📤 系統_提交功能 v10.2.1
// 職責：作答提交、提前結束、標記與清除
// 區塊：C（20~29）
// 編號：25
// 更新日期：2026-07-21
// 修復：提交後跳轉到結果頁面
// ============================================================

console.log('📤 25_系統_提交功能 v10.2.1 載入中...');

(function() {
    'use strict';

    // ============================================================
    // 1. 標記/取消標記題目
    // ============================================================
    function toggleMark() {
        var idx = window.G_currentQuestionIndex;
        if (typeof window.toggleMark === 'function') {
            window.toggleMark();
            return;
        }
        
        if (window.G_markedQuestions[idx]) {
            delete window.G_markedQuestions[idx];
            console.log('📌 取消標記: 第 ' + (idx + 1) + ' 題');
        } else {
            window.G_markedQuestions[idx] = true;
            console.log('📌 標記: 第 ' + (idx + 1) + ' 題');
        }
        
        if (typeof renderQuestion === 'function') {
            renderQuestion(idx);
        }
        updateMarkCount();
    }

    // ============================================================
    // 2. 更新標記數量
    // ============================================================
    function updateMarkCount() {
        var count = 0;
        for (var key in window.G_markedQuestions) {
            if (window.G_markedQuestions[key]) count++;
        }
        var el = document.getElementById('markCount');
        if (el) {
            el.textContent = '標記: ' + count + ' 題';
        }
        return count;
    }

    // ============================================================
    // 3. 清除答案
    // ============================================================
    function clearAnswer() {
        var idx = window.G_currentQuestionIndex;
        if (typeof window.clearAnswer === 'function') {
            window.clearAnswer();
            return;
        }
        
        if (window.G_userAnswers[idx] !== undefined) {
            delete window.G_userAnswers[idx];
            console.log('🗑️ 清除答案: 第 ' + (idx + 1) + ' 題');
        }
        
        if (typeof renderQuestion === 'function') {
            renderQuestion(idx);
        }
        if (typeof updateAnsweredCount === 'function') {
            updateAnsweredCount();
        }
    }

    // ============================================================
    // 4. 清除所有答案
    // ============================================================
    function clearAllAnswers() {
        if (!confirm('⚠️ 確定要清除所有答案嗎？')) {
            return;
        }
        
        var count = 0;
        for (var key in window.G_userAnswers) {
            count++;
        }
        
        window.G_userAnswers = {};
        console.log('🗑️ 清除所有答案: ' + count + ' 筆');
        
        if (typeof renderQuestion === 'function') {
            renderQuestion(window.G_currentQuestionIndex);
        }
        if (typeof updateAnsweredCount === 'function') {
            updateAnsweredCount();
        }
    }

    // ============================================================
    // 5. 提交測驗（✅ 修改：跳轉到結果頁面）
    // ============================================================
    function submitExam() {
        var answered = 0;
        var total = window.G_totalQuestions || 0;

        for (var i = 0; i < total; i++) {
            var val = window.G_userAnswers[i];
            if (val !== undefined && val !== '' && val !== null) {
                if (Array.isArray(val) && val.length > 0) {
                    answered++;
                } else if (typeof val === 'string' && val.trim() !== '') {
                    answered++;
                } else if (typeof val === 'number' && !isNaN(val)) {
                    answered++;
                } else if (typeof val === 'object' && Object.keys(val).length > 0) {
                    answered++;
                }
            }
        }

        var unanswered = total - answered;
        if (unanswered > 0) {
            if (!confirm('您還有 ' + unanswered + ' 題未作答，確定要送出嗎？')) {
                return;
            }
        }

        // ✅ 儲存結果資料到 localStorage
        try {
            var resultData = {
                score: 0,
                total: total,
                mode: window.G_currentMode || 'academic',
                answers: window.G_userAnswers || {},
                questions: window.G_questionData || []
            };

            // 計算分數（如果有 ScoreEngine）
            if (typeof window.ScoreEngine !== 'undefined') {
                var mode = window.G_currentMode || 'academic';
                var calcResult = window.ScoreEngine.calculateTotal(mode, window.G_userAnswers, window.G_questionData);
                if (calcResult) {
                    resultData.score = calcResult.score || 0;
                }
            }

            localStorage.setItem('exam_result', JSON.stringify(resultData));

            // 儲存考生資訊
            var nameEl = document.querySelector('#toppanel2 .value');
            var idEl = document.querySelector('#toppanel .toppanel-right .value');
            var examNumEl = document.getElementById('examNumber');
            var seatEl = document.getElementById('id_seat');
            var jobEl = document.querySelector('#toppanel .toppanel-center .value');

            var userInfo = {
                name: nameEl ? nameEl.textContent.replace('：', '').trim() : '王小明',
                idNumber: idEl ? idEl.textContent.replace('：', '').trim() : 'A123456789',
                examNumber: examNumEl ? examNumEl.textContent : 'B123456789',
                ticketNumber: 'G123456789',
                seatNumber: seatEl ? seatEl.textContent : '01',
                jobLevel: jobEl ? jobEl.textContent.replace('：', '').trim() : '練習題'
            };
            localStorage.setItem('exam_user_info', JSON.stringify(userInfo));

        } catch (e) {
            console.warn('⚠️ 儲存結果失敗:', e);
        }

        // ✅ 跳轉到結果頁面
        window.location.href = '提交結果頁面.html';

        // 觸發提交事件
        var event = new CustomEvent('examSubmitted', {
            detail: { answered: answered, total: total }
        });
        document.dispatchEvent(event);
    }

    // ============================================================
    // 6. 提前結束測驗
    // ============================================================
    function confirmEndExam() {
        var answered = 0;
        var total = window.G_totalQuestions || 0;
        for (var key in window.G_userAnswers) {
            var val = window.G_userAnswers[key];
            if (val !== undefined && val !== '' && val !== null) {
                if (Array.isArray(val) && val.length > 0) answered++;
                else if (typeof val === 'string' && val.trim() !== '') answered++;
                else if (typeof val === 'number' && !isNaN(val)) answered++;
                else if (typeof val === 'object' && Object.keys(val).length > 0) answered++;
            }
        }
        
        if (!confirm('⚠️ 確定要提前結束測驗嗎？\n\n已作答 ' + answered + ' / ' + total + ' 題')) {
            return;
        }
        
        if (!confirm('請再次確定是否要結束測驗？')) {
            return;
        }
        
        // 提前結束也儲存結果
        try {
            var resultData = {
                score: 0,
                total: total,
                mode: window.G_currentMode || 'academic',
                answers: window.G_userAnswers || {},
                questions: window.G_questionData || []
            };
            if (typeof window.ScoreEngine !== 'undefined') {
                var mode = window.G_currentMode || 'academic';
                var calcResult = window.ScoreEngine.calculateTotal(mode, window.G_userAnswers, window.G_questionData);
                if (calcResult) {
                    resultData.score = calcResult.score || 0;
                }
            }
            localStorage.setItem('exam_result', JSON.stringify(resultData));
        } catch (e) {}

        window.location.href = '提交結果頁面.html';
        
        var event = new CustomEvent('examEnded', {
            detail: { answered: answered, total: total }
        });
        document.dispatchEvent(event);
    }

    // ============================================================
    // 7. 更新答題計數
    // ============================================================
    function updateAnsweredCount() {
        var count = 0;
        var total = window.G_totalQuestions || 0;
        
        for (var i = 0; i < total; i++) {
            var val = window.G_userAnswers[i];
            if (val !== undefined && val !== '' && val !== null) {
                if (Array.isArray(val) && val.length > 0) count++;
                else if (typeof val === 'string' && val.trim() !== '') count++;
                else if (typeof val === 'number' && !isNaN(val)) count++;
                else if (typeof val === 'object' && Object.keys(val).length > 0) count++;
            }
        }
        
        var el = document.getElementById('answeredCount');
        if (el) {
            el.textContent = '已答: ' + count + '/' + total + ' 題';
        }
        
        return count;
    }

    // ============================================================
    // 8. 匯出到全域
    // ============================================================
    window.toggleMark = toggleMark;
    window.updateMarkCount = updateMarkCount;
    window.clearAnswer = clearAnswer;
    window.clearAllAnswers = clearAllAnswers;
    window.submitExam = submitExam;
    window.confirmEndExam = confirmEndExam;
    window.updateAnsweredCount = updateAnsweredCount;

    console.log('✅ 25_系統_提交功能 v10.2.1 已載入');
    console.log('   📤 提交後跳轉到結果頁面');

})();