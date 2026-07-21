// ============================================================
// 21_系統_初始化.js
// 職責：系統初始化、模組載入檢查、全域設定
// 版本：10.2.0
// 更新日期：2026-07-18
// 修復項目：
//   1. G_questionData 空值警告優化
//   2. 初始化階段不檢查題庫
// ============================================================

(function() {
    'use strict';

    console.log('🚀 系統_初始化 v10.2.0 載入中...');

    function checkRequiredModules() {
        const required = [
            { name: 'saveAnswer', check: () => typeof window.saveAnswer === 'function' },
            { name: 'getAnswer', check: () => typeof window.getAnswer === 'function' },
            { name: 'calculateScore', check: () => typeof window.calculateScore === 'function' },
            { name: 'renderQuestion', check: () => typeof window.renderQuestion === 'function' },
            { name: 'loadQuestionsByMode', check: () => typeof window.loadQuestionsByMode === 'function' },
            { name: 'ScoreEngine', check: () => typeof window.ScoreEngine !== 'undefined' },
            { name: 'AnswerValidator', check: () => typeof window.AnswerValidator !== 'undefined' },
            { name: 'API_CONFIG', check: () => typeof window.API_CONFIG !== 'undefined' },
        ];

        const missing = [];
        const loaded = [];

        required.forEach(mod => {
            if (mod.check()) {
                loaded.push(mod.name);
            } else {
                missing.push(mod.name);
            }
        });

        if (missing.length > 0) {
            console.warn('⚠️ 以下模組尚未載入，將使用內建替代：', missing.join(', '));
        } else {
            console.log('✅ 所有必要模組已載入');
        }

        return { loaded, missing };
    }

    function createFallbackFunctions() {
        if (typeof window.saveAnswer !== 'function') {
            console.warn('⚠️ saveAnswer 未載入，使用內建替代');
            window.saveAnswer = function(questionId, answer) {
                try {
                    if (!window.userAnswers) {
                        window.userAnswers = {};
                    }
                    window.userAnswers[questionId] = answer;
                    console.log('📝 儲存答案 (內建): ' + questionId + ' =', answer);
                    return true;
                } catch (e) {
                    console.error('❌ 儲存答案失敗:', e);
                    return false;
                }
            };
        }

        if (typeof window.getAnswer !== 'function') {
            console.warn('⚠️ getAnswer 未載入，使用內建替代');
            window.getAnswer = function(questionId) {
                try {
                    return window.userAnswers ? window.userAnswers[questionId] : undefined;
                } catch (e) {
                    return undefined;
                }
            };
        }

        if (typeof window.calculateScore !== 'function') {
            console.warn('⚠️ calculateScore 未載入，使用內建替代');
            window.calculateScore = function(mode, answers, questionData) {
                console.log('📊 計算分數 (內建)');
                return { score: 0, total: 0, passed: false, percentage: 0 };
            };
        }

        if (typeof window.renderQuestion !== 'function') {
            console.warn('⚠️ renderQuestion 未載入，使用內建替代');
            window.renderQuestion = function(index) {
                console.log('🎯 渲染題目 (內建): ' + (index + 1));
                var textEl = document.getElementById('questionText');
                if (textEl && window.G_questionData && window.G_questionData[index]) {
                    textEl.textContent = window.G_questionData[index].text || '無題目文字';
                }
                return;
            };
        }

        if (typeof window.loadQuestionsByMode !== 'function') {
            console.warn('⚠️ loadQuestionsByMode 未載入，使用內建替代');
            window.loadQuestionsByMode = function(mode) {
                console.log('📚 載入題目 (內建): ' + mode);
                if (typeof window._loadQuestionsFallback === 'function') {
                    return window._loadQuestionsFallback(mode);
                }
                return Promise.resolve([]);
            };
        }

        if (typeof window.loadQuestions === 'undefined' && typeof window.loadQuestionsByMode === 'function') {
            window.loadQuestions = window.loadQuestionsByMode;
        }
    }

    function setupAPIConfig() {
        if (typeof window.API_CONFIG !== 'undefined' && window.API_CONFIG) {
            var apiUrl = window.API_CONFIG.baseURL || 'http://localhost:8001/api';
            window.G_API_BASE = apiUrl;
            window.API_BASE_URL = apiUrl;
            console.log('✅ API 網址已從統一設定讀取:', apiUrl);
            return;
        }

        if (typeof window.API_BASE_URL !== 'undefined' && window.API_BASE_URL) {
            window.G_API_BASE = window.API_BASE_URL;
            console.log('✅ API 網址已從 API_BASE_URL 讀取:', window.API_BASE_URL);
            return;
        }

        console.warn('⚠️ 無法從統一設定取得 API 網址，使用備用值');
        window.G_API_BASE = 'http://localhost:8001/api';
        window.API_BASE_URL = 'http://localhost:8001/api';
    }

    function checkQuestionData() {
        var currentMode = typeof window.G_currentMode !== 'undefined' 
            ? window.G_currentMode 
            : null;
        
        if (!currentMode) {
            return true;
        }

        if (!window.G_questionData || window.G_questionData.length === 0) {
            console.warn('⚠️ G_questionData 為空，請確保題庫已載入');
            return false;
        }
        
        console.log('✅ G_questionData 已載入 ' + window.G_questionData.length + ' 題');
        return true;
    }

    function systemInit() {
        console.log('🚀 系統初始化中...');

        setupAPIConfig();
        createFallbackFunctions();
        const status = checkRequiredModules();

        if (!window.G_questionData) {
            window.G_questionData = [];
        }
        if (!window.G_userAnswers) {
            window.G_userAnswers = {};
        }
        if (!window.G_markedQuestions) {
            window.G_markedQuestions = {};
        }

        if (!window.G_examDate) {
            const now = new Date();
            window.G_examDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
            console.log('📅 考試日期: ' + window.G_examDate.toLocaleString());
        }

        checkQuestionData();

        window.systemReady = true;

        console.log('✅ 系統初始化完成');
        console.log('   📊 模組狀態: ' + status.loaded.length + '/' + (status.loaded.length + status.missing.length) + ' 已載入');
        console.log('   📡 API 網址: ' + window.G_API_BASE);
        
        const event = new CustomEvent('systemInitialized', {
            detail: { status: status }
        });
        document.dispatchEvent(event);

        return { success: true, status: status };
    }

    window.systemInit = systemInit;
    window._setupAPIConfig = setupAPIConfig;
    window._checkRequiredModules = checkRequiredModules;
    window._checkQuestionData = checkQuestionData;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(systemInit, 100);
        });
    } else {
        setTimeout(systemInit, 100);
    }

    console.log('✅ 21_系統_初始化 v10.2.0 已載入');

})();