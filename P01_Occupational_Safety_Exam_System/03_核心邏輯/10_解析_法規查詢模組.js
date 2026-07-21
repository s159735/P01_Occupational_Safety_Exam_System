// ============================================================
// ⚖️ 10_解析_法規查詢模組.js (API 版本) v10.2.0
// 職責：從後端 API 查詢法規資料
// 版本：10.2.0
// 更新日期：2026-07-18
// ============================================================

(function() {
    'use strict';

    console.log('⚖️ 10_解析_法規查詢模組 v10.2.0 載入中...');

    // ============================================================
    // 1. 使用統一 API 設定
    // ============================================================

    var API_BASE_URL = window.API_BASE_URL || 'http://localhost:8001/api';

    // 如果 API_CONFIG 已載入，優先使用
    if (window.API_CONFIG) {
        API_BASE_URL = window.API_CONFIG.baseURL || API_BASE_URL;
    }

    // 快取法規資料
    var lawCache = null;
    var lawNameIndex = null;
    var isLoading = false;
    var loadPromise = null;

    // ============================================================
    // 2. 從 API 載入法規資料庫（支援快取）
    // ============================================================

    function loadLawDatabase() {
        console.log('🔍 從 API 載入法規資料庫...');

        if (lawCache) {
            console.log('✅ 使用快取法規資料 (' + Object.keys(lawCache).length + ' 部)');
            return Promise.resolve(lawCache);
        }

        if (isLoading && loadPromise) {
            console.log('⏳ 法規資料載入中，等待完成...');
            return loadPromise;
        }

        isLoading = true;
        loadPromise = fetch(API_BASE_URL + '/laws')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function(result) {
                isLoading = false;
                if (result.success && result.data) {
                    var lawMap = {};
                    var nameMap = {};
                    result.data.forEach(function(law) {
                        lawMap[law.pcode] = {
                            name: law.display_name || law.name,
                            pcode: law.pcode,
                            level: law.level,
                            category: law.category,
                            data: law.data || {}
                        };
                        if (law.name) {
                            nameMap[law.name] = law.pcode;
                        }
                        if (law.display_name) {
                            nameMap[law.display_name] = law.pcode;
                        }
                    });
                    lawCache = lawMap;
                    lawNameIndex = nameMap;
                    console.log('✅ 法規資料庫已從 API 載入 (' + Object.keys(lawMap).length + ' 部)');
                    return lawMap;
                } else {
                    throw new Error(result.error || 'API 回傳錯誤');
                }
            })
            .catch(function(error) {
                isLoading = false;
                console.warn('⚠️ 從 API 載入法規失敗:', error.message);
                console.warn('⚠️ 使用備用法規資料');
                lawCache = getFallbackLaws();
                return lawCache;
            });

        return loadPromise;
    }

    // ============================================================
    // 3. 備用法規資料（當 API 不可用時）- 25 部完整法規
    // ============================================================

    function getFallbackLaws() {
        var fallback = {
            'N0010029': { name: '職業安全衛生法', pcode: 'N0010029', level: '法律', category: '行政＞勞動部＞職業安全衛生目' },
            'N0030025': { name: '勞動基準法', pcode: 'N0030025', level: '法律', category: '行政＞勞動部＞勞動關係目' },
            'N0060009': { name: '職業安全衛生設施規則', pcode: 'N0060009', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060014': { name: '營造安全衛生設施標準', pcode: 'N0060014', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060013': { name: '起重升降機具安全規則', pcode: 'N0060013', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060027': { name: '職業安全衛生管理辦法', pcode: 'N0060027', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060022': { name: '勞工健康保護規則', pcode: 'N0060022', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060017': { name: '有機溶劑中毒預防規則', pcode: 'N0060017', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060015': { name: '特定化學物質危害預防標準', pcode: 'N0060015', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060018': { name: '鉛中毒預防規則', pcode: 'N0060018', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060020': { name: '缺氧症預防規則', pcode: 'N0060020', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060030': { name: '高壓氣體勞工安全規則', pcode: 'N0060030', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060034': { name: '機械設備器具安全標準', pcode: 'N0060034', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060004': { name: '勞工作業場所容許暴露標準', pcode: 'N0060004', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060029': { name: '高架作業勞工保護措施標準', pcode: 'N0060029', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060033': { name: '勞工作業環境監測實施辦法', pcode: 'N0060033', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060039': { name: '危險性工作場所審查及檢查辦法', pcode: 'N0060039', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060010': { name: '職業安全衛生教育訓練規則', pcode: 'N0060010', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060007': { name: '高溫作業勞工作息時間標準', pcode: 'N0060007', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060011': { name: '鍋爐及壓力容器安全規則', pcode: 'N0060011', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060054': { name: '危害性化學品標示及通識規則', pcode: 'N0060054', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060041': { name: '職業災害勞工保護法', pcode: 'N0060041', level: '法律', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060065': { name: '女性勞工母性健康保護實施辦法', pcode: 'N0060065', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060069': { name: '新化學物質登記管理辦法', pcode: 'N0060069', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'D0120036': { name: '消防法', pcode: 'D0120036', level: '法律', category: '行政＞內政部＞消防目' },
            'A0000001': { name: '中央法規標準法', pcode: 'A0000001', level: '法律', category: '行政＞法務部＞法規目' }
        };
        console.log('📚 備用法規資料已載入 (' + Object.keys(fallback).length + ' 部)');
        return fallback;
    }

    // ============================================================
    // 4. 查詢法規（依 pcode）
    // ============================================================

    function queryLawByPcode(pcode) {
        if (!pcode) return Promise.resolve(null);
        return loadLawDatabase().then(function(lawDB) {
            return lawDB[pcode] || null;
        });
    }

    // ============================================================
    // 5. 查詢法規（依名稱）- 支援模糊匹配
    // ============================================================

    function queryLawByName(name) {
        if (!name) return Promise.resolve(null);

        return loadLawDatabase().then(function(lawDB) {
            // 精確匹配
            if (lawNameIndex && lawNameIndex[name]) {
                return lawDB[lawNameIndex[name]] || null;
            }

            var lowerName = name.toLowerCase();
            // 部分匹配
            for (var key in lawDB) {
                if (lawDB[key].name && lawDB[key].name.toLowerCase().indexOf(lowerName) !== -1) {
                    return lawDB[key];
                }
            }

            // 關鍵字匹配
            var keywords = name.replace(/[（(].*[）)]/g, '').split(/[、，,、\s]+/).filter(function(k) { return k.length > 1; });
            for (var i = 0; i < keywords.length; i++) {
                for (var key in lawDB) {
                    if (lawDB[key].name && lawDB[key].name.indexOf(keywords[i]) !== -1) {
                        return lawDB[key];
                    }
                }
            }

            return null;
        });
    }

    // ============================================================
    // 6. 生成法規內容 HTML
    // ============================================================

    function generateLawContent(q) {
        if (!q) return '';

        var law = q.law || q.law_ref || {};
        var lawName = law.name || '';
        var article = '';
        var pcode = law.pcode || '';

        if (law.article) {
            article = law.article.full || law.article.條 || '';
        }

        if (lawName || article || pcode) {
            var html = '<div class="law-content" style="padding:8px 14px;background:#e3f2fd;border-radius:6px;border-left:4px solid #0d47a1;margin-bottom:6px;">';
            html += '<strong>⚖️ 法源依據</strong><br>';
            if (lawName) html += '<span style="font-weight:500;">' + lawName + '</span>';
            if (article) html += ' <span style="color:#0d47a1;font-weight:500;">' + article + '</span>';
            if (pcode && !lawName) html += '<span style="color:#666;font-size:13px;"> (pcode: ' + pcode + ')</span>';
            html += '</div>';
            return html;
        }
        return '';
    }

    // ============================================================
    // 7. 匯出到全域
    // ============================================================

    window.loadLawDatabase = loadLawDatabase;
    window.queryLawByPcode = queryLawByPcode;
    window.queryLawByName = queryLawByName;
    window.generateLawContent = generateLawContent;

    window.LawQueryModule = {
        loadLawDatabase: loadLawDatabase,
        queryLawByPcode: queryLawByPcode,
        queryLawByName: queryLawByName,
        generateLawContent: generateLawContent,
        generateLawLink: function(lawName, article) { return '#'; },
        lookupLaw: function(lawName, articleNo) {
            return queryLawByName(lawName);
        }
    };

    console.log('✅ 10_解析_法規查詢模組 v10.2.0 已載入');
    console.log('   📚 支援 25 部法規查詢');
    console.log('   🔍 支援 pcode 和名稱查詢');
    console.log('   💾 快取機制已啟用');

})();