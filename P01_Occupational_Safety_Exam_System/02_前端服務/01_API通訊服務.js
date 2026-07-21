// ============================================================
// 🌐 API 服務層 - v10.2.0 (修復版)
// 職責：提供 API 連線功能，使用統一設定
// 檔案位置：02_前端服務/01_API通訊服務.js
// 更新日期：2026-07-18
// 修復項目：
//   1. 延長超時時間至 15 秒
//   2. 指數退避重試機制
//   3. 延遲初始連線至 2 秒
// ============================================================

(function() {
    'use strict';

    console.log('🌐 API 服務層 v10.2.0 載入中...');

    var API_BASE_URL = window.API_BASE_URL || 'http://localhost:8001/api';

    if (window.API_CONFIG) {
        API_BASE_URL = window.API_CONFIG.baseURL || API_BASE_URL;
    }

    var API_PORTS = [8001, 8002, 8003, 8080];
    var apiConnected = false;
    var connectionAttempts = 0;
    var MAX_RETRIES = 5;

    async function findAvailableAPI(retries, delay) {
        retries = retries || MAX_RETRIES;
        delay = delay || 500;
        connectionAttempts = 0;

        console.log('🔍 尋找可用 API 服務...');

        try {
            var response = await fetch(API_BASE_URL + '/health', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(15000)
            });
            if (response.ok) {
                console.log('✅ API 連線成功: ' + API_BASE_URL);
                apiConnected = true;
                return true;
            }
        } catch (e) {
            console.warn('⚠️ 主要 API 連線失敗:', e.message);
        }

        for (var attempt = 1; attempt <= retries; attempt++) {
            for (var i = 0; i < API_PORTS.length; i++) {
                var port = API_PORTS[i];
                try {
                    var response = await fetch('http://localhost:' + port + '/api/health', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        signal: AbortSignal.timeout(8000)
                    });
                    if (response.ok) {
                        console.log('✅ API 連線成功: 埠號 ' + port);
                        API_BASE_URL = 'http://localhost:' + port + '/api';
                        window.API_BASE_URL = API_BASE_URL;
                        if (window.API_CONFIG) {
                            window.API_CONFIG.setBaseURL(API_BASE_URL);
                        }
                        apiConnected = true;
                        return true;
                    }
                } catch (e) {
                    // 繼續嘗試下一個埠號
                }
            }
            
            if (attempt < retries) {
                var waitTime = delay * Math.pow(2, attempt - 1);
                console.log('⏳ 等待 ' + waitTime + 'ms 後重試 (第 ' + (attempt + 1) + '/' + retries + ' 次)...');
                await new Promise(function(resolve) { 
                    setTimeout(resolve, waitTime); 
                });
            }
        }

        apiConnected = false;
        console.warn('⚠️ 無法連線到 API 服務，將使用離線模式');
        return false;
    }

    async function apiRequest(endpoint, options) {
        options = options || {};

        var url = API_BASE_URL + endpoint;
        var headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        var config = {
            method: options.method || 'GET',
            headers: headers,
            signal: AbortSignal.timeout(options.timeout || 30000)
        };

        if (options.body) {
            config.body = typeof options.body === 'string' ?
                options.body : JSON.stringify(options.body);
        }

        try {
            var response = await fetch(url, config);
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            return await response.json();
        } catch (error) {
            console.error('❌ API 請求失敗 [' + endpoint + ']:', error.message);
            throw error;
        }
    }

    function getQuestions(mode) {
        return apiRequest('/questions?mode=' + encodeURIComponent(mode));
    }

    function getLaws(pcode) {
        var url = '/laws';
        if (pcode) url += '?pcode=' + encodeURIComponent(pcode);
        return apiRequest(url);
    }

    function submitExam(mode, answers, timeSpent) {
        var body = {
            mode: mode,
            answers: answers || {},
            time_spent: timeSpent || null
        };
        return apiRequest('/submit-exam', {
            method: 'POST',
            body: body
        });
    }

    function getHealth() {
        return apiRequest('/health');
    }

    function getModes() {
        return apiRequest('/modes');
    }

    function getStats() {
        return apiRequest('/stats');
    }

    window.apiFindAvailable = findAvailableAPI;
    window.apiRequest = apiRequest;
    window.apiGetQuestions = getQuestions;
    window.apiGetLaws = getLaws;
    window.apiSubmitExam = submitExam;
    window.apiGetHealth = getHealth;
    window.apiGetModes = getModes;
    window.apiGetStats = getStats;

    window.API_BASE_URL = API_BASE_URL;
    window.apiConnected = apiConnected;

    console.log('✅ API 服務層 v10.2.0 已載入');
    console.log('   📡 目標 API:', API_BASE_URL);

    setTimeout(function() {
        findAvailableAPI().then(function(connected) {
            if (connected) {
                console.log('✅ API 連線已建立');
            } else {
                console.log('⚠️ 離線模式運作中（部分功能受限）');
            }
        });
    }, 2000);

})();