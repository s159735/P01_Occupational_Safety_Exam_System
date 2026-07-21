// ============================================================
// 🌐 API 統一設定 - v10.2.0
// 職責：集中管理所有 API 相關設定
// 檔案位置：02_前端服務/00_API統一設定.js
// 更新日期：2026-07-18
// ============================================================

(function() {
    'use strict';

    console.log('🌐 API 統一設定 v10.2.0 載入中...');

    // ============================================================
    // 1. 環境偵測
    // ============================================================

    var hostname = window.location.hostname;
    var isLocalhost = hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1';
    var isRender = hostname.includes('onrender.com') ||
        hostname.includes('render.com');
    var isProduction = !isLocalhost && !isRender &&
        window.location.protocol === 'https:';

    // ============================================================
    // 2. API 基礎網址（自動偵測）
    // ============================================================

    var API_BASE_URL = (function() {
        // 開發環境：本地後端
        if (isLocalhost) {
            console.log('🔧 開發環境：使用本地 API');

            // 嘗試從 URL 參數取得自訂埠號
            var urlParams = new URLSearchParams(window.location.search);
            var customPort = urlParams.get('apiPort');
            if (customPort) {
                return 'http://localhost:' + customPort + '/api';
            }

            return 'http://localhost:8001/api';
        }

        // Render 部署環境
        if (isRender) {
            console.log('☁️ Render 環境：使用雲端 API');
            // 從全域變數或環境變數取得
            var renderApiUrl = window.__API_BASE_URL ||
                'https://occupational-safety-backend.onrender.com/api';
            return renderApiUrl;
        }

        // 正式環境（自訂網域）
        if (isProduction) {
            console.log('🌍 正式環境：使用正式 API');
            var prodApiUrl = window.__API_BASE_URL ||
                'https://api.your-domain.com/api';
            return prodApiUrl;
        }

        // 備用：預設本地
        console.warn('⚠️ 無法判斷環境，使用預設本地 API');
        return 'http://localhost:8001/api';
    })();

    // ============================================================
    // 3. API 設定物件
    // ============================================================

    var APIConfig = {
        // 基礎設定
        baseURL: API_BASE_URL,
        timeout: 30000,
        retries: 3,
        retryDelay: 500,

        // 環境標記
        env: {
            isLocalhost: isLocalhost,
            isRender: isRender,
            isProduction: isProduction,
            isDevelopment: isLocalhost || !isProduction,
            isCloud: isRender || isProduction
        },

        // API 端點
        endpoints: {
            health: '/health',
            questions: '/questions',
            laws: '/laws',
            stats: '/stats',
            submit: '/submit-exam',
            modes: '/modes',
            sessions: '/exam-sessions'
        },

        // 取得完整 URL
        getURL: function(endpoint) {
            var path = this.endpoints[endpoint];
            if (!path) {
                console.warn('⚠️ 未知端點:', endpoint);
                return this.baseURL + '/' + endpoint;
            }
            return this.baseURL + path;
        },

        // 設定 API 網址（用於部署後動態修改）
        setBaseURL: function(url) {
            if (!url) return;
            this.baseURL = url;
            window.API_BASE_URL = url;
            console.log('🔧 API 網址已更新為:', url);
        },

        // 取得環境名稱
        getEnvironment: function() {
            if (isLocalhost) return 'development';
            if (isRender) return 'render';
            if (isProduction) return 'production';
            return 'unknown';
        },

        // 是否為開發模式
        isDevelopment: function() {
            return isLocalhost;
        },

        // 是否為雲端模式
        isCloud: function() {
            return isRender || isProduction;
        }
    };

    // ============================================================
    // 4. 向後相容：保留舊版全域變數
    // ============================================================

    window.API_BASE_URL = API_BASE_URL;
    window.API_CONFIG = APIConfig;
    window.__API_BASE_URL = API_BASE_URL;

    // 法規查詢模組用
    window.G_API_BASE = API_BASE_URL;

    // ============================================================
    // 5. 觸發設定完成事件
    // ============================================================

    console.log('✅ API 統一設定完成');
    console.log('   📡 API 網址:', API_BASE_URL);
    console.log('   🏷️ 環境:', APIConfig.getEnvironment());
    console.log('   📋 端點:', Object.keys(APIConfig.endpoints).length, '個');

    var event = new CustomEvent('apiConfigReady', {
        detail: { config: APIConfig }
    });
    document.dispatchEvent(event);

})();