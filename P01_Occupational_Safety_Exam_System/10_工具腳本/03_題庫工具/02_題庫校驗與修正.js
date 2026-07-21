// ============================================================
// 02_題庫校驗與修正.js（修正版 - 支援 law 欄位）
// 功能：
//   1. 讀取 ChLaw_完整版.json（法規資料庫）
//   2. 讀取 8 大題型 JSON 檔案
//   3. 校驗每個題目的 law 欄位是否存在於法規資料庫
//   4. 自動修正可匹配的 law 欄位
//   5. 輸出校驗報告 + 修正後的題庫檔案
// 執行：node 02_題庫校驗與修正.js
// ============================================================

const fs = require('fs');
const path = require('path');

// ============================================================
// 設定（修正：正確指向法規資料庫與題庫）
// ============================================================
const CONFIG = {
    // ✅ 修正：法規資料庫在 10_資料庫/07_法規資料庫/
    lawDatabasePath: path.join(__dirname, '..', '..', '10_資料庫', '07_法規資料庫', 'ChLaw_完整版.json'),
    // ✅ 修正：題庫在 10_資料庫/06_完整題庫/
    questionBankFolder: path.join(__dirname, '..', '..', '10_資料庫', '06_完整題庫'),
    // 輸出報告到工具目錄
    outputFolder: __dirname
};

const QUESTION_TYPES = ['單選題', '複選題', '是非題', '填空題', '計算題', '配合題', '排序題', '連連看'];

// ============================================================
// 載入法規資料庫
// ============================================================
function loadLawDatabase() {
    if (!fs.existsSync(CONFIG.lawDatabasePath)) {
        console.error(`❌ 找不到法規資料庫：${CONFIG.lawDatabasePath}`);
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(CONFIG.lawDatabasePath, 'utf8'));
    console.log(`📚 已載入法規資料庫：${data.TotalLaws} 部法規`);
    return data;
}

// ============================================================
// 建立法規索引
// ============================================================
function buildLawIndex(lawDatabase) {
    const lawNameIndex = {};
    const pcodeIndex = {};
    const articleIndex = {};
    
    for (const law of lawDatabase.Laws) {
        // 用 LawName 建立索引
        lawNameIndex[law.LawName] = law;
        // 用 PCode 建立索引（優先）
        if (law.PCode) {
            pcodeIndex[law.PCode] = law;
        }
        for (const article of law.LawArticles) {
            if (article.ArticleType === 'A' && article.ArticleNo) {
                const key = `${law.LawName}|${article.ArticleNo}`;
                articleIndex[key] = article.ArticleContent;
            }
        }
    }
    
    console.log(`   📊 法規索引：${Object.keys(lawNameIndex).length} 部法規，${Object.keys(articleIndex).length} 條條文`);
    return { lawNameIndex, pcodeIndex, articleIndex };
}

// ============================================================
// 清理法規名稱
// ============================================================
function cleanLawName(name) {
    if (!name) return '';
    return name
        .replace(/[（(].*[）)]/g, '')
        .replace(/法$|規則$|標準$|辦法$|細則$|條例$|準則$/, '')
        .replace(/施行細則$|管理辦法$|實施辦法$/, '')
        .trim();
}

// ============================================================
// 清理條號（移除「第」、「條」、括號備註）
// ============================================================
function cleanArticleNo(article) {
    if (!article) return '';
    return article
        .replace(/[第條\s]/g, '')
        .replace(/[（(].*[）)]/g, '')
        .trim();
}

// ============================================================
// 寬容匹配法規名稱（支援 PCode 與 LawName）
// ============================================================
function fuzzyMatchLaw(lawInput, lawNameIndex, pcodeIndex) {
    if (!lawInput) return null;
    
    // 1. 如果是 PCode 格式，直接用 PCode 索引
    if (lawInput.match(/^[A-Z][0-9]{7}$/)) {
        if (pcodeIndex[lawInput]) {
            return { matchedLaw: pcodeIndex[lawInput].LawName, matchType: 'PCode' };
        }
    }
    
    // 2. 精確比對 LawName
    if (lawNameIndex[lawInput]) {
        return { matchedLaw: lawInput, matchType: 'exact' };
    }
    
    // 3. 標準化後比對
    const cleanTarget = cleanLawName(lawInput);
    for (const key of Object.keys(lawNameIndex)) {
        if (cleanLawName(key) === cleanTarget) {
            return { matchedLaw: key, matchType: 'clean' };
        }
    }
    
    // 4. 包含比對
    for (const key of Object.keys(lawNameIndex)) {
        const cleanKey = cleanLawName(key);
        if (cleanTarget && cleanKey && (cleanTarget.includes(cleanKey) || cleanKey.includes(cleanTarget))) {
            return { matchedLaw: key, matchType: 'contains' };
        }
    }
    
    return null;
}

// ============================================================
// 校驗單一題目（使用 law 欄位）
// ============================================================
function validateQuestion(q, lawNameIndex, pcodeIndex, articleIndex) {
    const result = {
        id: q.id || 'unknown',
        type: q.type || 'unknown',
        hasLaw: false,
        lawName: null,
        pcode: null,
        article: null,
        isValid: false,
        matchedLaw: null,
        matchType: null,
        error: null
    };
    
    if (!q.law) {
        result.error = '無 law 欄位';
        return result;
    }
    
    result.hasLaw = true;
    result.lawName = q.law.name || '';
    result.pcode = q.law.pcode || '';
    result.article = q.law.article || '';
    
    // 優先使用 PCode，其次使用 LawName
    let matchResult = null;
    if (result.pcode) {
        matchResult = fuzzyMatchLaw(result.pcode, lawNameIndex, pcodeIndex);
    }
    if (!matchResult && result.lawName) {
        matchResult = fuzzyMatchLaw(result.lawName, lawNameIndex, pcodeIndex);
    }
    
    if (!matchResult) {
        result.error = `找不到法規：${result.lawName || result.pcode}`;
        return result;
    }
    
    result.matchedLaw = matchResult.matchedLaw;
    result.matchType = matchResult.matchType;
    
    // 檢查條文
    if (result.article && result.article.full) {
        const cleanArticle = cleanArticleNo(result.article.full);
        const law = lawNameIndex[result.matchedLaw];
        let articleFound = false;
        for (const article of law.LawArticles) {
            if (article.ArticleType === 'A' && article.ArticleNo) {
                const cleanNo = cleanArticleNo(article.ArticleNo);
                if (cleanNo === cleanArticle) {
                    articleFound = true;
                    break;
                }
            }
        }
        if (!articleFound) {
            result.error = `找不到條文：${result.article.full}（法規：${result.matchedLaw}）`;
            return result;
        }
    }
    
    result.isValid = true;
    return result;
}

// ============================================================
// 主程式
// ============================================================
console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('   🔍 題庫法規引用校驗與修正工具（law 欄位版 v2.0）');
console.log('════════════════════════════════════════════════════════');
console.log('');

const lawDatabase = loadLawDatabase();
const { lawNameIndex, pcodeIndex, articleIndex } = buildLawIndex(lawDatabase);

if (!fs.existsSync(CONFIG.questionBankFolder)) {
    console.error(`❌ 找不到題庫資料夾：${CONFIG.questionBankFolder}`);
    process.exit(1);
}

const allResults = {
    total: 0,
    withLaw: 0,
    withoutLaw: 0,
    valid: 0,
    invalid: 0,
    fixed: 0,
    details: []
};

const fixedQuestions = [];

for (const typeName of QUESTION_TYPES) {
    const filePath = path.join(CONFIG.questionBankFolder, `${typeName}.json`);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ 跳過 ${typeName}.json（檔案不存在）`);
        continue;
    }
    
    console.log(`📂 校驗：${typeName}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const questions = data.questions || [];
    let fileValid = 0, fileInvalid = 0, fileFixed = 0;
    
    for (const q of questions) {
        allResults.total++;
        const result = validateQuestion(q, lawNameIndex, pcodeIndex, articleIndex);
        
        if (!result.hasLaw) {
            allResults.withoutLaw++;
            continue;
        }
        
        allResults.withLaw++;
        
        if (result.isValid) {
            allResults.valid++;
            fileValid++;
            // 如果匹配的名稱不同，自動修正
            if (result.matchedLaw && result.matchedLaw !== result.lawName) {
                q.law.name = result.matchedLaw;
                allResults.fixed++;
                fileFixed++;
                fixedQuestions.push({
                    id: result.id,
                    type: typeName,
                    original: result.lawName || result.pcode,
                    matched: result.matchedLaw,
                    matchType: result.matchType
                });
            }
            // 如果 PCode 為空但匹配到法規，補上 PCode
            if (!q.law.pcode && result.matchedLaw) {
                const law = lawNameIndex[result.matchedLaw];
                if (law && law.PCode) {
                    q.law.pcode = law.PCode;
                    allResults.fixed++;
                    fileFixed++;
                }
            }
        } else {
            allResults.invalid++;
            fileInvalid++;
            allResults.details.push({
                id: result.id,
                type: typeName,
                lawName: result.lawName,
                pcode: result.pcode,
                article: result.article,
                error: result.error
            });
        }
    }
    
    console.log(`   ✅ 有效：${fileValid} 題，❌ 無效：${fileInvalid} 題，🔧 修正：${fileFixed} 題`);
    
    if (fileFixed > 0) {
        const backupPath = filePath + '.bak';
        fs.copyFileSync(filePath, backupPath);
        console.log(`      📁 已備份：${typeName}.json.bak`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`      ✅ 已修正：${typeName}.json`);
    }
}

// ============================================================
// 輸出報告
// ============================================================
const report = `
════════════════════════════════════════════════════════
   📊 題庫法規引用校驗報告（v2.0）
   日期：${new Date().toISOString().slice(0, 10)}
════════════════════════════════════════════════════════

【題庫統計】
  總題數：${allResults.total} 題
  有 law 欄位的題數：${allResults.withLaw} 題
  無 law 欄位的題數：${allResults.withoutLaw} 題

【校驗結果】
  ✅ 有效引用：${allResults.valid} 題
  ❌ 無效引用：${allResults.invalid} 題
  🔧 自動修正：${allResults.fixed} 題

【自動修正清單】
${fixedQuestions.length > 0 ? fixedQuestions.map(f => `   ${f.type} - ${f.id}：${f.original} → ${f.matched} (${f.matchType})`).join('\n') : '   （無）'}

【無效引用清單（需人工處理）】
${allResults.details.length > 0 ? allResults.details.map(d => `   ${d.type} - ${d.id}：${d.lawName || d.pcode}（${d.article ? d.article.full : ''}）→ ${d.error}`).join('\n') : '   （無）'}

════════════════════════════════════════════════════════
`;

const reportPath = path.join(CONFIG.outputFolder, '校驗報告.txt');
fs.writeFileSync(reportPath, report, 'utf8');

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('   ✅ 校驗與修正完成！');
console.log('════════════════════════════════════════════════════════');
console.log('');
console.log(`   📊 有效引用：${allResults.valid} 題`);
console.log(`   📊 無效引用：${allResults.invalid} 題`);
console.log(`   📊 自動修正：${allResults.fixed} 題`);
console.log('');
console.log(`   📁 報告：${reportPath}`);
console.log('');