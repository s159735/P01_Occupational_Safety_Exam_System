// ============================================================
// 📝 答案驗證器.js - 答案驗證邏輯 v10.2.0
// 職責：驗證各題型的答案（含配合題、排序題、連連看）
// 更新日期：2026-07-17
// ============================================================

console.log('📝 03_答案正確性驗證器 v10.2.0 載入中...');

window.AnswerValidator = {
    // ============================================================
    // 1. 標準化字串（去除特殊字符）
    // ============================================================
    normalize: function(str) {
        if (!str) return '';
        return String(str).replace(/[、，,.\s「」『』]/g, '').trim();
    },

    // ============================================================
    // 2. 標準化陣列（排序 + 轉字串）
    // ============================================================
    normalizeArray: function(arr) {
        if (!arr || !Array.isArray(arr)) return [];
        return arr.map(function(item) {
            return String(item).trim();
        }).sort();
    },

    // ============================================================
    // 3. 驗證填充題答案
    // ============================================================
    validateFillAnswer: function(userAnswer, correctAnswer) {
        if (Array.isArray(correctAnswer)) {
            if (!Array.isArray(userAnswer)) {
                userAnswer = String(userAnswer).split(/[、，,、\s]+/);
            }
            if (userAnswer.length !== correctAnswer.length) return false;
            for (var i = 0; i < userAnswer.length; i++) {
                if (this.normalize(userAnswer[i]) !== this.normalize(correctAnswer[i])) {
                    return false;
                }
            }
            return true;
        }
        return this.normalize(userAnswer) === this.normalize(correctAnswer);
    },

    // ============================================================
    // 4. 驗證排序題答案
    // ============================================================
    validateSortAnswer: function(userOrder, correctSteps) {
        if (!userOrder || !correctSteps) return false;
        if (!Array.isArray(userOrder) || !Array.isArray(correctSteps)) return false;
        if (userOrder.length !== correctSteps.length) return false;
        for (var i = 0; i < userOrder.length; i++) {
            if (this.normalize(userOrder[i]) !== this.normalize(correctSteps[i])) {
                return false;
            }
        }
        return true;
    },

    // ============================================================
    // 5. 驗證計算題答案（使用公式引擎或容差比對）
    // ============================================================
    validateCalcAnswer: function(userAnswer, correctAnswer, formulaKey, formulaParams) {
        // 1. 如果傳入了 formulaKey，使用公式引擎驗證
        if (formulaKey && window.executeFormula) {
            var result = window.executeFormula(formulaKey, formulaParams);
            if (result !== null) {
                var engine = window.formulaEngine;
                if (engine && engine.validateAnswer) {
                    return engine.validateAnswer(userAnswer, result, 0.01);
                }
                var numUser = parseFloat(userAnswer);
                var numCorrect = parseFloat(result);
                if (isNaN(numUser) || isNaN(numCorrect)) return false;
                return Math.abs(numUser - numCorrect) <= 0.01;
            }
        }
        
        // 2. 靜態比對（支援陣列和字串）
        if (Array.isArray(correctAnswer)) {
            if (!Array.isArray(userAnswer)) {
                userAnswer = String(userAnswer).split(/[、，,、\s]+/);
            }
            if (userAnswer.length !== correctAnswer.length) return false;
            for (var i = 0; i < userAnswer.length; i++) {
                if (this.normalize(userAnswer[i]) !== this.normalize(correctAnswer[i])) {
                    return false;
                }
            }
            return true;
        }
        return String(userAnswer).trim() === String(correctAnswer).trim();
    },

    // ============================================================
    // 6. 驗證選擇題答案（單選）
    // ============================================================
    validateChoiceAnswer: function(userAnswer, correctAnswer) {
        return String(userAnswer) === String(correctAnswer);
    },

    // ============================================================
    // 7. 驗證是非題答案
    // ============================================================
    validateTrueFalseAnswer: function(userAnswer, correctAnswer) {
        return String(userAnswer) === String(correctAnswer);
    },

    // ============================================================
    // 8. 驗證複選題答案
    // ============================================================
    validateMultipleAnswer: function(userAnswers, correctAnswers) {
        if (!userAnswers || !correctAnswers) return false;
        if (!Array.isArray(userAnswers) || !Array.isArray(correctAnswers)) return false;
        if (userAnswers.length !== correctAnswers.length) return false;
        var sorted1 = this.normalizeArray(userAnswers);
        var sorted2 = this.normalizeArray(correctAnswers);
        return JSON.stringify(sorted1) === JSON.stringify(sorted2);
    },

    // ============================================================
    // 9. 驗證連連看答案（字串陣列比對）
    // ============================================================
    validateLinkAnswer: function(userSelections, correctPairs) {
        if (!userSelections || !correctPairs) return false;
        if (!Array.isArray(userSelections) || !Array.isArray(correctPairs)) return false;
        if (userSelections.length !== correctPairs.length) return false;
        for (var i = 0; i < userSelections.length; i++) {
            if (this.normalize(userSelections[i]) !== this.normalize(correctPairs[i])) {
                return false;
            }
        }
        return true;
    },

    // ============================================================
    // 10. 驗證配合題答案（每個子題獨立計分）
    // ============================================================
    validateMatchAnswer: function(userSelections, correctAnswers) {
        if (!userSelections || !correctAnswers) {
            return { correct: 0, total: 0, details: [], message: '無作答資料' };
        }
        
        if (!Array.isArray(userSelections) || !Array.isArray(correctAnswers)) {
            return { correct: 0, total: 0, details: [], message: '資料格式錯誤' };
        }
        
        var correctCount = 0;
        var details = [];
        var total = Math.min(userSelections.length, correctAnswers.length);
        
        for (var i = 0; i < total; i++) {
            var userAnswer = userSelections[i] || '';
            var isCorrect = this.normalize(userAnswer) === this.normalize(correctAnswers[i]);
            if (isCorrect) correctCount++;
            details.push({
                index: i,
                userAnswer: userAnswer,
                correctAnswer: correctAnswers[i],
                isCorrect: isCorrect
            });
        }
        
        return {
            correct: correctCount,
            total: correctAnswers.length,
            percentage: Math.round((correctCount / correctAnswers.length) * 100),
            details: details,
            allCorrect: correctCount === correctAnswers.length
        };
    },

    // ============================================================
    // 11. 驗證單一題目（根據題型自動選擇驗證方式）
    // ============================================================
    validateQuestion: function(question, userAnswer) {
        if (!question) return { isCorrect: false, message: '題目不存在' };
        
        var type = question.type || 'single';
        var correct = question.answer;
        
        switch (type) {
            case 'single':
            case 'choice':
                return {
                    isCorrect: this.validateChoiceAnswer(userAnswer, correct),
                    correctAnswer: correct,
                    userAnswer: userAnswer
                };
                
            case 'multiple':
                if (!Array.isArray(userAnswer)) {
                    userAnswer = [];
                }
                return {
                    isCorrect: this.validateMultipleAnswer(userAnswer, correct),
                    correctAnswer: correct,
                    userAnswer: userAnswer
                };
                
            case 'truefalse':
            case 'boolean':
                return {
                    isCorrect: this.validateTrueFalseAnswer(userAnswer, correct),
                    correctAnswer: correct,
                    userAnswer: userAnswer
                };
                
            case 'fill':
            case 'blank':
                return {
                    isCorrect: this.validateFillAnswer(userAnswer, correct),
                    correctAnswer: correct,
                    userAnswer: userAnswer
                };
                
            case 'calc':
            case 'calculation':
                var isCorrect = this.validateCalcAnswer(
                    userAnswer,
                    correct,
                    question.formulaKey,
                    question.formulaParams
                );
                return {
                    isCorrect: isCorrect,
                    correctAnswer: correct,
                    userAnswer: userAnswer,
                    formulaKey: question.formulaKey
                };
                
            case 'sequencing':
            case 'sort':
                if (!Array.isArray(userAnswer)) {
                    userAnswer = String(userAnswer).split(/[、，,、\s]+/);
                }
                return {
                    isCorrect: this.validateSortAnswer(userAnswer, correct),
                    correctAnswer: correct,
                    userAnswer: userAnswer
                };
                
            case 'match':
            case 'matching':
                if (!Array.isArray(userAnswer)) {
                    userAnswer = String(userAnswer).split(/[、，,、\s]+/);
                }
                var result = this.validateMatchAnswer(userAnswer, correct);
                return {
                    isCorrect: result.allCorrect === true,
                    correctAnswer: correct,
                    userAnswer: userAnswer,
                    details: result.details,
                    correctCount: result.correct,
                    totalCount: result.total
                };
                
            case 'link':
            case 'connection':
                if (!Array.isArray(userAnswer)) {
                    userAnswer = String(userAnswer).split(/[、，,、\s]+/);
                }
                return {
                    isCorrect: this.validateLinkAnswer(userAnswer, correct),
                    correctAnswer: correct,
                    userAnswer: userAnswer
                };
                
            default:
                return {
                    isCorrect: String(userAnswer).trim() === String(correct).trim(),
                    correctAnswer: correct,
                    userAnswer: userAnswer
                };
        }
    },

    // ============================================================
    // 12. 批量驗證（回傳統計）
    // ============================================================
    validateAll: function(questionData, userAnswers) {
        var results = [];
        var totalCorrect = 0;
        var totalQuestions = questionData.length;
        
        for (var i = 0; i < totalQuestions; i++) {
            var q = questionData[i];
            var userAnswer = userAnswers[i];
            var result = this.validateQuestion(q, userAnswer);
            results.push(result);
            if (result.isCorrect) totalCorrect++;
        }
        
        return {
            total: totalQuestions,
            correct: totalCorrect,
            incorrect: totalQuestions - totalCorrect,
            percentage: Math.round((totalCorrect / totalQuestions) * 100),
            details: results
        };
    }
};

console.log('✅ AnswerValidator v10.2.0 已載入');
console.log('   📝 支援 8 大題型驗證');
console.log('   📊 包含配合題子題獨立計分');