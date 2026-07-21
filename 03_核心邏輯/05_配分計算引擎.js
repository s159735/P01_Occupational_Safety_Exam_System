// ============================================================
// 📊 計分引擎 v10.2.0 - 國家考試規格
// 檔案位置：03_核心邏輯/05_配分計算引擎.js
// 職責：根據模式與題型計算配分
// 更新日期：2026-07-18
// 修復項目：新增 window.calculateScore 全域函數
// ============================================================

console.log('📊 05_配分計算引擎 v10.2.0 載入中...');

var ScoreEngine = {

    rules: {
        academic: {
            totalQuestions: 80,
            fullScore: 100,
            passScore: 60,
            getScore: function(q, index, total) {
                return Math.round((100 / total) * 100) / 100;
            },
            getDisplay: function(score) {
                return score + '%';
            }
        },
        technical: {
            totalQuestions: 10,
            fullScore: 100,
            passScore: 60,
            getScore: function(q, index, total) {
                return Math.round((100 / total) * 100) / 100;
            },
            getDisplay: function(score) {
                return score + '%';
            }
        },
        calc: {
            totalQuestions: 0,
            fullScore: 0,
            passScore: 0,
            getScore: function(q, index, total) {
                return 0;
            },
            getDisplay: function(score) {
                return '';
            }
        }
    },

    getScore: function(q, index, mode, total) {
        var rule = this.rules[mode];
        if (!rule) return 10;
        
        if (q.points) {
            var points = parseFloat(q.points);
            if (!isNaN(points)) return points;
        }
        
        if (q.pointsPerItem && q.answer && Array.isArray(q.answer)) {
            return parseFloat(q.pointsPerItem) * q.answer.length;
        }
        
        if (typeof rule.getScore === 'function') {
            return rule.getScore(q, index, total || 0);
        }
        return 10;
    },

    getDisplay: function(q, index, mode, total) {
        var rule = this.rules[mode];
        if (!rule) return '10%';
        var score = this.getScore(q, index, mode, total);
        if (typeof rule.getDisplay === 'function') {
            return rule.getDisplay(score);
        }
        return score + '%';
    },

    getFullScore: function(mode) {
        var rule = this.rules[mode];
        return rule ? rule.fullScore : 0;
    },

    getPassScore: function(mode) {
        var rule = this.rules[mode];
        return rule ? rule.passScore : 0;
    },

    calculateTotal: function(mode, userAnswers, questionData) {
        if (mode === 'calc') return { score: 0, total: 0, passed: false };
        
        var totalScore = 0;
        var maxScore = 0;
        
        questionData.forEach(function(q, index) {
            var score = ScoreEngine.getScore(q, index, mode, questionData.length);
            maxScore += score;
            
            var userAnswer = userAnswers[index];
            var isCorrect = ScoreEngine.checkAnswer(q, userAnswer);
            if (isCorrect) {
                totalScore += score;
            }
        });
        
        var rule = ScoreEngine.rules[mode];
        var passed = totalScore >= (rule ? rule.passScore : 60);
        
        return {
            score: Math.round(totalScore * 100) / 100,
            total: Math.round(maxScore * 100) / 100,
            passed: passed,
            percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
        };
    },

    checkAnswer: function(q, userAnswer) {
        if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
            return false;
        }
        
        var correct = q.answer;
        var type = q.type || 'single';
        
        if (window.AnswerValidator) {
            var result = window.AnswerValidator.validateQuestion(q, userAnswer);
            return result.isCorrect || false;
        }
        
        if (type === 'single' || type === 'choice' || type === 'truefalse') {
            return String(userAnswer) === String(correct);
        }
        
        if (type === 'multiple') {
            if (!Array.isArray(userAnswer) || !Array.isArray(correct)) return false;
            if (userAnswer.length !== correct.length) return false;
            var sorted1 = [...userAnswer].sort();
            var sorted2 = [...correct].sort();
            return JSON.stringify(sorted1) === JSON.stringify(sorted2);
        }
        
        if (type === 'fill' || type === 'blank') {
            if (typeof userAnswer === 'string' && Array.isArray(correct)) {
                var parts = userAnswer.split(/[、，,、\s]+/).filter(function(s) { return s.trim() !== ''; });
                if (parts.length !== correct.length) return false;
                for (var i = 0; i < parts.length; i++) {
                    if (String(parts[i]).trim() !== String(correct[i]).trim()) return false;
                }
                return true;
            }
            return String(userAnswer).trim() === String(correct).trim();
        }
        
        if (type === 'calc' || type === 'calculation') {
            if (Array.isArray(correct)) {
                if (!Array.isArray(userAnswer)) {
                    userAnswer = String(userAnswer).split(/[、，,、\s]+/);
                }
                if (userAnswer.length !== correct.length) return false;
                for (var i = 0; i < userAnswer.length; i++) {
                    if (String(userAnswer[i]).trim() !== String(correct[i]).trim()) return false;
                }
                return true;
            }
            return String(userAnswer).trim() === String(correct).trim();
        }
        
        if (type === 'sequencing' || type === 'sort' || type === 'match' || type === 'link') {
            if (!Array.isArray(userAnswer) || !Array.isArray(correct)) return false;
            if (userAnswer.length !== correct.length) return false;
            for (var i = 0; i < userAnswer.length; i++) {
                if (String(userAnswer[i]).trim() !== String(correct[i]).trim()) {
                    return false;
                }
            }
            return true;
        }
        
        return false;
    },

    getTypeStats: function(mode, userAnswers, questionData) {
        var stats = {};
        var typeGroups = {};
        
        questionData.forEach(function(q, index) {
            var type = q.type || 'single';
            if (!typeGroups[type]) {
                typeGroups[type] = [];
            }
            typeGroups[type].push(index);
        });
        
        for (var type in typeGroups) {
            var indices = typeGroups[type];
            var correct = 0;
            var total = indices.length;
            
            indices.forEach(function(idx) {
                var q = questionData[idx];
                var userAnswer = userAnswers[idx];
                if (ScoreEngine.checkAnswer(q, userAnswer)) {
                    correct++;
                }
            });
            
            stats[type] = {
                total: total,
                correct: correct,
                percentage: Math.round((correct / total) * 100)
            };
        }
        
        return stats;
    }
};

// ============================================================
// ✅ 修復：將 calculateScore 註冊到全域
// ============================================================

window.calculateScore = function(mode, answers, questionData) {
    try {
        if (!mode) {
            mode = typeof window.G_currentMode !== 'undefined' 
                ? window.G_currentMode 
                : 'academic';
        }
        
        if (!answers) {
            answers = typeof window.G_userAnswers !== 'undefined' 
                ? window.G_userAnswers 
                : {};
        }
        
        if (!questionData) {
            questionData = typeof window.G_questionData !== 'undefined' 
                ? window.G_questionData 
                : [];
        }
        
        if (!questionData || questionData.length === 0) {
            console.warn('⚠️ calculateScore: 題庫為空，無法計分');
            return { score: 0, total: 0, passed: false, percentage: 0 };
        }
        
        if (mode === 'calc') {
            return { score: 0, total: 0, passed: false, percentage: 0 };
        }
        
        var result = ScoreEngine.calculateTotal(mode, answers, questionData);
        
        return {
            score: result.score || 0,
            total: result.total || 0,
            passed: result.passed || false,
            percentage: result.percentage || 0
        };
        
    } catch (e) {
        console.error('❌ calculateScore 執行錯誤:', e);
        return { score: 0, total: 0, passed: false, percentage: 0 };
    }
};

console.log('✅ calculateScore 已註冊到全域（使用 ScoreEngine）');

window.ScoreEngine = ScoreEngine;

console.log('✅ 05_配分計算引擎 v10.2.0 已載入');
console.log('   📊 支援 3 種模式: academic, technical, calc');
console.log('   📋 支援 8 大題型計分');