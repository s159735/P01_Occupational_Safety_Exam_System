// ============================================================
// 測試腳本：清理是非題.json
// 執行環境：Node.js
// 執行指令：node scripts/test_cleanup_truefalse.js
// ============================================================

const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================
const CONFIG = {
    // 題庫目錄
    inputDir: './10_資料庫/06_完整題庫（1677 題）',
    // 要測試的檔案
    targetFile: '是非題.json',
    // 備份目錄
    backupDir: './10_資料庫/06_完整題庫（1677 題）/backup_test_' + new Date().toISOString().replace(/[:.]/g, '-'),
    // 法規名稱對應表
    lawNameMapping: {
        '職業安全衛生設施規則第': '職業安全衛生設施規則',
        '職業安全衛生法第': '職業安全衛生法',
        '職業安全衛生法施行細則第': '職業安全衛生法施行細則',
        '勞動基準法第': '勞動基準法',
        '營造安全衛生設施標準第': '營造安全衛生設施標準',
        '起重升降機具安全規則第': '起重升降機具安全規則',
        '高壓氣體勞工安全規則第': '高壓氣體勞工安全規則',
        '職業災害勞工保護法第': '職業災害勞工保護法',
        '危害性化學品標示及通識規則': '危害性化學品標示及通識規則',
        '勞工健康保護規則': '勞工健康保護規則',
        '職業安全衛生管理辦法': '職業安全衛生管理辦法',
        '風險評估技術指引': '風險評估技術指引'
    }
};

// ============================================================
// 工具函數
// ============================================================

// 標準化法規名稱
function normalizeLawName(rawName) {
    if (!rawName) return rawName;
    if (CONFIG.lawNameMapping[rawName]) {
        return CONFIG.lawNameMapping[rawName];
    }
    let name = rawName.replace(/第$/, '').trim();
    name = name.replace(/附表$/, '').trim();
    return name;
}

// 標準化條號
function normalizeArticle(rawArticle) {
    if (!rawArticle) return rawArticle;
    let article = rawArticle.trim();
    if (article && !article.startsWith('第')) {
        article = '第' + article;
    }
    if (article && !article.endsWith('條')) {
        article = article + '條';
    }
    return article;
}

// 處理單一題目
function processQuestion(question, stats) {
    const modifications = [];
    
    // 1. 移除 explanation.detail
    if (question.explanation && question.explanation.detail) {
        const detailLength = question.explanation.detail.length;
        delete question.explanation.detail;
        modifications.push(`✅ 移除 explanation.detail (${detailLength} 字元)`);
        stats.removedDetailCount++;
        stats.removedDetailChars += detailLength;
    }
    
    // 2. 移除 tips
    if (question.tips) {
        const tipsKeys = Object.keys(question.tips);
        delete question.tips;
        modifications.push(`✅ 移除 tips (${tipsKeys.join(', ')})`);
        stats.removedTipsCount++;
    }
    
    // 3. 標準化 law.name
    if (question.law && question.law.name) {
        const oldName = question.law.name;
        const newName = normalizeLawName(oldName);
        if (oldName !== newName) {
            question.law.name = newName;
            modifications.push(`✅ law.name: "${oldName}" → "${newName}"`);
            stats.normalizedNameCount++;
        }
    }
    
    // 4. 標準化 law.article
    if (question.law && question.law.article) {
        const oldArticle = question.law.article;
        const newArticle = normalizeArticle(oldArticle);
        if (oldArticle !== newArticle) {
            question.law.article = newArticle;
            modifications.push(`✅ law.article: "${oldArticle}" → "${newArticle}"`);
            stats.normalizedArticleCount++;
        }
    }
    
    // 5. 確保 law 存在
    if (!question.law || typeof question.law !== 'object') {
        question.law = { name: '', article: '' };
        modifications.push('✅ 初始化 law 為空物件');
    }
    
    // 6. 確保 logic 是陣列
    if (question.logic && !Array.isArray(question.logic)) {
        if (typeof question.logic === 'object') {
            question.logic = Object.values(question.logic);
        } else {
            question.logic = [question.logic];
        }
        modifications.push('✅ logic 轉為陣列');
    }
    
    // 記錄修改
    if (modifications.length > 0) {
        stats.modifiedQuestions.push({
            id: question.id || question._originalId || 'unknown',
            text: (question.text || '').substring(0, 50) + '...',
            modifications: modifications
        });
        stats.totalModified++;
    }
    
    return question;
}

// ============================================================
// 產生報告
// ============================================================

function generateReport(stats, filePath) {
    const reportPath = path.join(CONFIG.backupDir, '修改報告.txt');
    const lines = [];
    
    lines.push('='.repeat(70));
    lines.push('📋 是非題 清理修改報告');
    lines.push('執行時間: ' + new Date().toLocaleString('zh-TW'));
    lines.push('檔案: ' + path.basename(filePath));
    lines.push('='.repeat(70));
    lines.push('');
    lines.push('📊 統計摘要:');
    lines.push(`  📄 總題數: ${stats.totalQuestions}`);
    lines.push(`  ✏️ 修改題數: ${stats.totalModified}`);
    lines.push(`  📝 移除 explanation.detail: ${stats.removedDetailCount} 題`);
    lines.push(`  📝 移除 tips: ${stats.removedTipsCount} 題`);
    lines.push(`  🔧 標準化 law.name: ${stats.normalizedNameCount} 題`);
    lines.push(`  🔧 標準化 law.article: ${stats.normalizedArticleCount} 題`);
    lines.push(`  📉 移除字元總數: ${stats.removedDetailChars} 字元`);
    lines.push('');
    lines.push('='.repeat(70));
    lines.push('📝 詳細修改記錄:');
    lines.push('');
    
    if (stats.modifiedQuestions.length === 0) {
        lines.push('  ✅ 沒有題目需要修改！');
    } else {
        stats.modifiedQuestions.forEach((item, index) => {
            lines.push(`【${index + 1}】ID: ${item.id}`);
            lines.push(`    題目: ${item.text}`);
            item.modifications.forEach(mod => {
                lines.push(`    ${mod}`);
            });
            lines.push('');
        });
    }
    
    lines.push('='.repeat(70));
    lines.push('✅ 報告產生完成');
    
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
    console.log(`\n📋 報告已產生: ${reportPath}`);
}

// ============================================================
// 顯示修改前後對比
// ============================================================

function showSampleComparison(original, modified) {
    console.log('\n📊 修改前後對比（第一題）:');
    console.log('-'.repeat(70));
    console.log('\n【修改前】');
    console.log(JSON.stringify(original, null, 2).substring(0, 500) + '...');
    console.log('\n【修改後】');
    console.log(JSON.stringify(modified, null, 2).substring(0, 500) + '...');
    console.log('-'.repeat(70));
}

// ============================================================
// 主程式
// ============================================================

function main() {
    console.log('='.repeat(70));
    console.log('🧹 測試腳本：清理是非題.json');
    console.log('='.repeat(70));
    
    const filePath = path.join(CONFIG.inputDir, CONFIG.targetFile);
    
    // 檢查檔案是否存在
    if (!fs.existsSync(filePath)) {
        console.error(`❌ 檔案不存在: ${filePath}`);
        return;
    }
    
    // 1. 建立備份
    console.log(`\n📦 建立備份: ${CONFIG.backupDir}`);
    if (!fs.existsSync(CONFIG.backupDir)) {
        fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }
    const backupPath = path.join(CONFIG.backupDir, CONFIG.targetFile);
    fs.copyFileSync(filePath, backupPath);
    console.log(`  ✅ 備份完成: ${backupPath}`);
    
    // 2. 讀取檔案
    console.log(`\n📄 讀取檔案: ${CONFIG.targetFile}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // 3. 提取題目
    let questions = [];
    let fileType = 'unknown';
    if (data.questions && Array.isArray(data.questions)) {
        questions = data.questions;
        fileType = 'container';
    } else if (Array.isArray(data)) {
        questions = data;
        fileType = 'array';
    } else {
        console.error('⚠️ 無法識別檔案格式');
        return;
    }
    console.log(`  📊 題數: ${questions.length} 題`);
    console.log(`  📂 格式: ${fileType}`);
    
    // 4. 統計資料
    const stats = {
        totalQuestions: questions.length,
        totalModified: 0,
        removedDetailCount: 0,
        removedDetailChars: 0,
        removedTipsCount: 0,
        normalizedNameCount: 0,
        normalizedArticleCount: 0,
        modifiedQuestions: []
    };
    
    // 5. 儲存原始第一題（用於對比）
    const originalFirst = JSON.parse(JSON.stringify(questions[0] || {}));
    
    // 6. 處理每題
    console.log(`\n🔧 開始處理...`);
    questions.forEach((question, index) => {
        processQuestion(question, stats);
        // 進度顯示
        if ((index + 1) % 10 === 0 || index === questions.length - 1) {
            console.log(`  處理進度: ${index + 1}/${questions.length}`);
        }
    });
    
    // 7. 寫回檔案
    console.log(`\n💾 寫入檔案...`);
    const output = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, output, 'utf8');
    console.log(`  ✅ 已更新: ${filePath}`);
    
    // 8. 顯示對比
    const modifiedFirst = questions[0] || {};
    showSampleComparison(originalFirst, modifiedFirst);
    
    // 9. 產生報告
    generateReport(stats, filePath);
    
    // 10. 總結
    console.log('\n' + '='.repeat(70));
    console.log('✅ 處理完成！');
    console.log(`📊 總題數: ${stats.totalQuestions}`);
    console.log(`✏️ 修改題數: ${stats.totalModified}`);
    console.log(`📁 備份位置: ${CONFIG.backupDir}`);
    console.log(`📋 修改報告: ${CONFIG.backupDir}/修改報告.txt`);
    console.log('='.repeat(70));
    console.log('\n⚠️ 請檢查修改結果，確認無誤後再處理其他檔案！');
}

// 執行
main();