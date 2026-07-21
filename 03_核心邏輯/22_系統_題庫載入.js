// ============================================================
// 📚 22_系統_題庫載入.js (API 版本) v10.2.1
// 職責：從後端 API 載入題目
// 版本：10.2.1
// 更新日期：2026-07-20
// 修復：API 路徑改為 /api/questions?mode=xxx
// ============================================================

(function() {
    'use strict';

    console.log('📚 22_系統_題庫載入 v10.2.1 載入中...');

    // ============================================================
    // 1. 從統一設定取得 API 網址
    // ============================================================

    var API_BASE_URL = (function() {
        if (typeof window.API_CONFIG !== 'undefined' && window.API_CONFIG) {
            return window.API_CONFIG.baseURL || 'http://localhost:8001/api';
        }
        if (typeof window.API_BASE_URL !== 'undefined' && window.API_BASE_URL) {
            return window.API_BASE_URL;
        }
        if (typeof window.G_API_BASE !== 'undefined' && window.G_API_BASE) {
            return window.G_API_BASE;
        }
        console.warn('⚠️ 無法從統一設定取得 API 網址，使用備用值');
        return 'http://localhost:8001/api';
    })();

    // ============================================================
    // 2. 題型對應表
    // ============================================================

    var TYPE_LABEL_MAP = {
        'single': '選擇題(單選題)',
        'multiple': '選擇題(複選題)',
        'truefalse': '是非題',
        'fill': '填空題',
        'calc': '計算題',
        'match': '配合題',
        'sequencing': '排序題',
        'link': '連連看'
    };

    var TYPE_PREFIX_MAP = {
        'single': 'S',
        'multiple': 'M',
        'truefalse': 'T',
        'fill': 'F',
        'calc': 'C',
        'match': 'P',
        'sequencing': 'Q',
        'link': 'L'
    };

    // ============================================================
    // 3. 題目欄位驗證與修復
    // ============================================================

    function validateAndFixQuestion(q, index) {
        if (!q) return q;

        var type = q.type || 'single';
        
        if (!q.typeLabel || q.typeLabel === '') {
            q.typeLabel = TYPE_LABEL_MAP[type] || '';
        }
        if (!q.typePrefix || q.typePrefix === '') {
            q.typePrefix = TYPE_PREFIX_MAP[type] || '';
        }
        if (!q.stem || q.stem === '') {
            q.stem = '試回答下列問題：';
        }
        if (!q.group || q.group === undefined) {
            q.group = 1;
        }
        if (!q.pointsPerItem && q.answer && Array.isArray(q.answer) && q.answer.length > 1) {
            var totalPoints = parseFloat(q.points || '10');
            if (!isNaN(totalPoints)) {
                q.pointsPerItem = (totalPoints / q.answer.length).toFixed(2) + '%';
            }
        }
        if (type === 'single' || type === 'truefalse') {
            if (typeof q.answer === 'string' && !isNaN(q.answer)) {
                q.answer = parseInt(q.answer);
            }
        }
        if (type === 'multiple') {
            if (typeof q.answer === 'string') {
                try {
                    q.answer = JSON.parse(q.answer);
                } catch (e) {
                    q.answer = q.answer.split(',').map(function(s) { return parseInt(s.trim()); });
                }
            }
            if (!Array.isArray(q.answer)) {
                q.answer = [];
            }
        }
        if (!q.options) {
            q.options = [];
        }
        if (!q.law) {
            q.law = {};
        }
        if (!q.law.pcode) {
            q.law.pcode = '';
        }
        if (!q.law.name) {
            q.law.name = '';
        }
        if (!q.law.article) {
            q.law.article = {};
        }
        if (!q.explanation) q.explanation = {};
        if (!q.tips) q.tips = {};
        if (!q.logic) q.logic = [];
        if (!q.spec) q.spec = {};
        
        return q;
    }

    function checkMissingFields(questions) {
        var result = [];
        var requiredFields = ['id', 'type', 'typeLabel', 'text', 'answer', 'points', 'law', 'law.pcode'];
        
        questions.forEach(function(q, idx) {
            var missing = [];
            requiredFields.forEach(function(field) {
                var parts = field.split('.');
                var value = q;
                for (var i = 0; i < parts.length; i++) {
                    if (value === undefined || value === null) {
                        value = undefined;
                        break;
                    }
                    value = value[parts[i]];
                }
                if (value === undefined || value === null || value === '') {
                    missing.push(field);
                }
            });
            if (missing.length > 0) {
                result.push({
                    index: idx,
                    id: q.id || 'unknown',
                    missing: missing
                });
            }
        });
        
        if (result.length > 0) {
            console.warn('⚠️ 以下題目缺少必要欄位:', result);
        }
        
        return result;
    }

    // ============================================================
    // 4. 依模式載入題目（✅ 修正 API 路徑）
    // ============================================================

    function loadQuestionsByMode(mode) {
        console.log('📚 載入模式:', mode);

        var loadingEl = document.getElementById('loadingMessage');
        var cardEl = document.getElementById('questionCard');

        if (loadingEl) loadingEl.style.display = 'block';
        if (cardEl) cardEl.style.display = 'none';

        // ✅ 修正：使用正確的 query parameter 格式
        var apiUrl = API_BASE_URL + '/questions?mode=' + encodeURIComponent(mode);
        console.log('📡 請求網址:', apiUrl);

        fetch(apiUrl)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return response.json();
            })
            .then(function(result) {
                if (!result.success) {
                    throw new Error(result.error || 'API 回傳錯誤');
                }
                var questions = result.data || [];
                questions = questions.map(function(q, idx) {
                    return validateAndFixQuestion(q, idx);
                });
                console.log('✅ 從 API 載入 ' + questions.length + ' 題（已驗證欄位）');
                checkMissingFields(questions);
                processLoadedQuestions(questions, mode);
            })
            .catch(function(error) {
                console.error('❌ API 載入失敗:', error);
                console.warn('⚠️ 使用離線備用資料');
                loadFallbackQuestions(mode);
            });
    }

    // ============================================================
    // 5. 處理載入成功的題目
    // ============================================================

    function processLoadedQuestions(questions, mode) {
        if (questions.length === 0) {
            console.warn('⚠️ 無題目資料，使用離線備用資料');
            loadFallbackQuestions(mode);
            return;
        }

        window.G_questionData = questions;
        window.G_totalQuestions = questions.length;
        window.G_currentQuestionIndex = 0;
        window.G_userAnswers = {};
        window.G_markedQuestions = {};

        var event = new CustomEvent('questionsLoaded', {
            detail: { mode: mode, count: questions.length }
        });
        document.dispatchEvent(event);

        if (typeof renderQuestion === 'function') {
            renderQuestion(0);
        } else {
            console.warn('⚠️ renderQuestion 未定義');
        }

        if (typeof updateAnsweredCount === 'function') {
            updateAnsweredCount();
        }

        var loadingEl = document.getElementById('loadingMessage');
        var cardEl = document.getElementById('questionCard');
        if (loadingEl) loadingEl.style.display = 'none';
        if (cardEl) cardEl.style.display = 'block';

        console.log('✅ 最終載入 ' + questions.length + ' 題 (' + mode + ')');
    }

    // ============================================================
    // 6. 離線備用資料
    // ============================================================

    function loadFallbackQuestions(mode) {
        var loadingEl = document.getElementById('loadingMessage');
        var cardEl = document.getElementById('questionCard');

        var sampleQuestions = {
            academic: [
                {
                    id: 'S0',
                    type: 'single',
                    typeLabel: '選擇題(單選題)',
                    typePrefix: 'S',
                    text: '未滿18歲可以從事下列那一項工作？',
                    options: ['220伏特以下電力線之銜接', '起重機運轉工作', '坑內工作', '鍋爐操作'],
                    answer: 0,
                    points: '10%',
                    group: 1,
                    stem: '試回答下列問題：',
                    law: { pcode: 'N0030025', name: '勞動基準法', article: { 條: '第 44 條' } }
                }
            ],
            technical: [
                {
                    id: 'T48',
                    type: 'truefalse',
                    typeLabel: '是非題',
                    typePrefix: 'T',
                    text: '雇主對於噪音超過90分貝之工作場所，應標示並公告噪音危害之預防事項。',
                    options: ['是', '否'],
                    answer: 0,
                    points: '10%',
                    group: 1,
                    stem: '試回答下列問題：',
                    law: { pcode: 'N0060009', name: '職業安全衛生設施規則', article: { 條: '第 300 條' } }
                }
            ],
            calc: [
                {
                    id: 'C0',
                    type: 'calc',
                    typeLabel: '計算題',
                    typePrefix: 'C',
                    text: '某勞工身高165公分，體重57公斤，其BMI為何？',
                    options: [],
                    answer: '20.9',
                    points: '10%',
                    group: 1,
                    stem: '試回答下列問題：',
                    law: { pcode: 'N0060022', name: '勞工健康保護規則', article: { 條: '第 12 條' } },
                    formulaKey: 'BMI',
                    formulaParams: { 體重: 57, 身高: 1.65 }
                }
            ]
        };

        var questions = sampleQuestions[mode] || sampleQuestions.academic;
        console.log('⚠️ 使用離線備用資料: ' + questions.length + ' 題 (' + mode + ')');

        window.G_questionData = questions;
        window.G_totalQuestions = questions.length;
        window.G_currentQuestionIndex = 0;
        window.G_userAnswers = {};
        window.G_markedQuestions = {};

        if (typeof renderQuestion === 'function') {
            renderQuestion(0);
        }

        if (typeof updateAnsweredCount === 'function') {
            updateAnsweredCount();
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (cardEl) cardEl.style.display = 'block';
    }

    // ============================================================
    // 7. 匯出到全域
    // ============================================================

    window.loadQuestionsByMode = loadQuestionsByMode;
    window.loadQuestions = loadQuestionsByMode;

    console.log('✅ 22_系統_題庫載入 v10.2.1 已載入');
    console.log('   📡 API 網址:', API_BASE_URL);
    console.log('   📚 支援 3 種載入模式: academic, technical, calc');
    console.log('   ✅ API 路徑格式: /questions?mode=xxx');

})();