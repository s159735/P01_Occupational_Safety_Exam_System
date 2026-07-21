// ============================================================
// 04_作答記錄管理器.js
// 職責：管理使用者作答記錄、儲存、讀取、匯出/匯入
// 版本：10.2.0
// 更新日期：2026-07-17
// ============================================================

(function() {
    'use strict';

    console.log('📝 04_作答記錄管理器 v10.2.0 載入中...');

    // ============================================================
    // 1. 核心功能：儲存答案
    // ============================================================

    function saveAnswer(questionId, answer) {
        try {
            if (!window.G_userAnswers) {
                window.G_userAnswers = {};
            }

            window.G_userAnswers[questionId] = answer;

            // 觸發儲存事件
            var event = new CustomEvent('answerSaved', {
                detail: {
                    questionId: questionId,
                    answer: answer,
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);

            // 同步更新 localStorage（可選）
            try {
                localStorage.setItem('exam_answers', JSON.stringify(window.G_userAnswers));
            } catch (e) {
                // 忽略 localStorage 錯誤
            }

            console.log('📝 儲存答案: ' + questionId + ' =', answer);
            return true;
        } catch (e) {
            console.error('❌ 儲存答案失敗:', e);
            return false;
        }
    }

    // ============================================================
    // 2. 核心功能：讀取答案
    // ============================================================

    function getAnswer(questionId) {
        try {
            if (!window.G_userAnswers) {
                return undefined;
            }
            return window.G_userAnswers[questionId];
        } catch (e) {
            console.error('❌ 讀取答案失敗:', e);
            return undefined;
        }
    }

    // ============================================================
    // 3. 核心功能：清除所有答案
    // ============================================================

    function clearAllAnswers() {
        try {
            window.G_userAnswers = {};
            try {
                localStorage.removeItem('exam_answers');
            } catch (e) {}
            console.log('🗑️ 已清除所有答案');
            return true;
        } catch (e) {
            console.error('❌ 清除答案失敗:', e);
            return false;
        }
    }

    // ============================================================
    // 4. 核心功能：清除單一答案
    // ============================================================

    function clearAnswer(questionId) {
        try {
            if (window.G_userAnswers) {
                delete window.G_userAnswers[questionId];
                try {
                    localStorage.setItem('exam_answers', JSON.stringify(window.G_userAnswers));
                } catch (e) {}
                console.log('🗑️ 已清除答案: ' + questionId);
                return true;
            }
            return false;
        } catch (e) {
            console.error('❌ 清除答案失敗:', e);
            return false;
        }
    }

    // ============================================================
    // 5. 核心功能：獲取所有答案
    // ============================================================

    function getAllAnswers() {
        try {
            return window.G_userAnswers || {};
        } catch (e) {
            console.error('❌ 獲取答案失敗:', e);
            return {};
        }
    }

    // ============================================================
    // 6. 核心功能：獲取已作答數量
    // ============================================================

    function getAnsweredCount() {
        try {
            var answers = window.G_userAnswers || {};
            var count = 0;
            for (var key in answers) {
                var val = answers[key];
                if (val !== undefined && val !== null && val !== '') {
                    if (Array.isArray(val) && val.length === 0) continue;
                    if (typeof val === 'object' && Object.keys(val).length === 0) continue;
                    count++;
                }
            }
            return count;
        } catch (e) {
            console.error('❌ 計算答題數失敗:', e);
            return 0;
        }
    }

    // ============================================================
    // 7. 核心功能：匯出答案（JSON 格式）
    // ============================================================

    function exportAnswers() {
        try {
            return JSON.stringify(window.G_userAnswers || {}, null, 2);
        } catch (e) {
            console.error('❌ 匯出答案失敗:', e);
            return '{}';
        }
    }

    // ============================================================
    // 8. 核心功能：匯入答案
    // ============================================================

    function importAnswers(jsonStr) {
        try {
            var data = JSON.parse(jsonStr);
            window.G_userAnswers = data;
            try {
                localStorage.setItem('exam_answers', JSON.stringify(data));
            } catch (e) {}
            console.log('📥 已匯入答案:', Object.keys(data).length, '筆');
            return true;
        } catch (e) {
            console.error('❌ 匯入答案失敗:', e);
            return false;
        }
    }

    // ============================================================
    // 9. 核心功能：從 localStorage 恢復答案
    // ============================================================

    function restoreAnswers() {
        try {
            var saved = localStorage.getItem('exam_answers');
            if (saved) {
                var data = JSON.parse(saved);
                window.G_userAnswers = data;
                console.log('🔄 已從 localStorage 恢復答案:', Object.keys(data).length, '筆');
                return true;
            }
            return false;
        } catch (e) {
            console.warn('⚠️ 無法從 localStorage 恢復答案:', e);
            return false;
        }
    }

    // ============================================================
    // 10. 註冊到全域
    // ============================================================

    window.saveAnswer = saveAnswer;
    window.getAnswer = getAnswer;
    window.clearAllAnswers = clearAllAnswers;
    window.clearAnswer = clearAnswer;
    window.getAllAnswers = getAllAnswers;
    window.getAnsweredCount = getAnsweredCount;
    window.exportAnswers = exportAnswers;
    window.importAnswers = importAnswers;
    window.restoreAnswers = restoreAnswers;

    // 初始化
    if (!window.userAnswers) {
        window.userAnswers = {};
    }
    if (!window.G_userAnswers) {
        window.G_userAnswers = {};
    }

    // 自動從 localStorage 恢復
    restoreAnswers();

    console.log('✅ 04_作答記錄管理器 v10.2.0 已載入');
    console.log('   📝 saveAnswer 已註冊到全域');
    console.log('   💾 自動從 localStorage 恢復答案');

})();