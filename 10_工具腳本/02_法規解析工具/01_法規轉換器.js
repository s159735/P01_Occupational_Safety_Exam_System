// ============================================================
// 01_法規轉換器.js (ASPX + TXT 混合版 - 支援國字數字)
// 位置：10_資料庫/07_法規資料庫/
// 執行：node 01_法規轉換器.js
// ============================================================

const fs = require('fs');
const path = require('path');

const CONFIG = {
    aspxFolder: path.join(__dirname, '20260709220422584'),
    txtFolder: path.join(__dirname, '20260709220422584_txt'),
    outputFolder: __dirname
};

function normalizeArticleNo(articleNo) {
    if (!articleNo) return '';
    articleNo = articleNo.trim();
    const matchDash = articleNo.match(/第\s*(\d+)\s*[-－]\s*(\d+)\s*條/);
    if (matchDash) return `第 ${matchDash[1]}-${matchDash[2]} 條`;
    const matchNormal = articleNo.match(/第\s*(\d+)\s*條/);
    if (matchNormal) return `第 ${matchNormal[1]} 條`;
    return articleNo;
}

function normalizeContent(content) {
    if (!content) return '';
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ============================================================
// 解析 ASPX（支援阿拉伯數字 + 國字數字）
// ============================================================
function parseASPX(filePath) {
    try {
        const html = fs.readFileSync(filePath, 'utf8');
        const articles = [];
        const lawName = path.parse(filePath).name;

        const pattern = /第\s*([一二三四五六七八九十百千\d]+)\s*條/g;
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const articleNo = match[0];
            const startPos = match.index + articleNo.length;
            const endPos = html.indexOf('第', startPos);
            let content = html.substring(startPos, endPos > startPos ? endPos : startPos + 500);
            content = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
            if (content) {
                articles.push({
                    ArticleType: 'A',
                    ArticleNo: normalizeArticleNo(articleNo),
                    ArticleContent: normalizeContent(content)
                });
            }
        }

        if (articles.length === 0) {
            const loosePattern = /第\s*([^第條]+?)\s*條/g;
            while ((match = loosePattern.exec(html)) !== null) {
                const articleNo = '第 ' + match[1].trim() + ' 條';
                const startPos = match.index + articleNo.length;
                const endPos = html.indexOf('第', startPos);
                let content = html.substring(startPos, endPos > startPos ? endPos : startPos + 500);
                content = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
                if (content) {
                    articles.push({
                        ArticleType: 'A',
                        ArticleNo: normalizeArticleNo(articleNo),
                        ArticleContent: normalizeContent(content)
                    });
                }
            }
        }

        return { status: 'success', lawName, articles };
    } catch (err) {
        return { status: 'error', message: err.message };
    }
}

// ============================================================
// 解析 TXT
// ============================================================
function parseTextContent(text) {
    const articles = [];
    const lines = text.split('\n').filter(l => l.trim() !== '');
    let currentTitle = '';
    let currentContent = '';
    
    for (const line of lines) {
        const trimmed = line.trim();
        const isChapter = /^第.*章/.test(trimmed);
        const isArticle = /^第.*條/.test(trimmed);
        
        if (isChapter || isArticle) {
            if (currentTitle) {
                if (/章/.test(currentTitle)) {
                    articles.push({ ArticleType: 'C', ArticleNo: '', ArticleContent: `${currentTitle}\n${currentContent}` });
                } else {
                    articles.push({ ArticleType: 'A', ArticleNo: normalizeArticleNo(currentTitle), ArticleContent: normalizeContent(currentContent) });
                }
            }
            currentTitle = trimmed;
            currentContent = '';
        } else {
            if (currentTitle) currentContent += trimmed + '\n';
        }
    }
    
    if (currentTitle) {
        if (/章/.test(currentTitle)) {
            articles.push({ ArticleType: 'C', ArticleNo: '', ArticleContent: `${currentTitle}\n${currentContent}` });
        } else {
            articles.push({ ArticleType: 'A', ArticleNo: normalizeArticleNo(currentTitle), ArticleContent: normalizeContent(currentContent) });
        }
    }
    
    return articles;
}

// ============================================================
// 主程式
// ============================================================
console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('   📚 法規轉換器 (ASPX + TXT 混合版 - 支援國字數字)');
console.log('════════════════════════════════════════════════════════');
console.log('');

const allLaws = [];
let aspxSuccess = 0, aspxFail = 0;
let txtSuccess = 0, txtFail = 0, txtEmpty = 0;

// 處理 ASPX
console.log('📂 處理 ASPX 檔案...');
if (fs.existsSync(CONFIG.aspxFolder)) {
    const aspxFiles = fs.readdirSync(CONFIG.aspxFolder).filter(f => f.endsWith('.aspx'));
    console.log(`   📄 找到 ${aspxFiles.length} 個 ASPX 檔案`);
    for (const file of aspxFiles) {
        const result = parseASPX(path.join(CONFIG.aspxFolder, file));
        if (result.status === 'success' && result.articles.length > 0) {
            const articleCount = result.articles.filter(a => a.ArticleType === 'A').length;
            allLaws.push({
                LawName: result.lawName,
                LawDisplayName: result.lawName,
                LawLevel: '法規命令',
                LawCategory: '行政＞勞動部＞職業安全衛生目',
                LawURL: '',
                LawModifiedDate: '',
                LawEffectiveStatus: '現行有效',
                LawArticles: result.articles
            });
            aspxSuccess++;
            console.log(`   ✅ ${result.lawName} (ASPX, ${articleCount} 條)`);
        } else {
            aspxFail++;
            console.log(`   ❌ ${file} (ASPX 解析失敗)`);
        }
    }
}

// 處理 TXT
console.log('');
console.log('📂 處理 TXT 檔案...');
if (fs.existsSync(CONFIG.txtFolder)) {
    const txtFiles = fs.readdirSync(CONFIG.txtFolder).filter(f => f.endsWith('.txt'));
    console.log(`   📄 找到 ${txtFiles.length} 個 TXT 檔案`);
    for (const file of txtFiles) {
        const baseName = path.parse(file).name;
        const filePath = path.join(CONFIG.txtFolder, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (!content || content.trim() === '') { txtEmpty++; console.log(`   ⚠️ ${baseName} (檔案為空)`); continue; }
            const articles = parseTextContent(content);
            if (articles.length > 0) {
                const articleCount = articles.filter(a => a.ArticleType === 'A').length;
                const chapterCount = articles.filter(a => a.ArticleType === 'C').length;
                allLaws.push({
                    LawName: baseName,
                    LawDisplayName: baseName,
                    LawLevel: '法規命令',
                    LawCategory: '行政＞勞動部＞職業安全衛生目',
                    LawURL: '',
                    LawModifiedDate: '',
                    LawEffectiveStatus: '現行有效',
                    LawArticles: articles
                });
                txtSuccess++;
                console.log(`   ✅ ${baseName} (TXT, 條文 ${articleCount} 條，章節 ${chapterCount} 章)`);
            } else {
                txtEmpty++;
                console.log(`   ⚠️ ${baseName} (無條文)`);
            }
        } catch (err) {
            txtFail++;
            console.log(`   ❌ ${baseName} (讀取失敗: ${err.message})`);
        }
    }
}

// 輸出 JSON
const output = {
    UpdateDate: new Date().toISOString().slice(0, 10),
    Version: '4.0',
    TotalLaws: allLaws.length,
    PendingLaws: 0,
    Laws: allLaws
};

const outputPath = path.join(CONFIG.outputFolder, 'ChLaw_完整版.json');
if (fs.existsSync(outputPath)) {
    fs.copyFileSync(outputPath, path.join(CONFIG.outputFolder, 'ChLaw_完整版_備份.json'));
}
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('   ✅ 轉換完成！');
console.log('════════════════════════════════════════════════════════');
console.log('');
console.log(`   📊 ASPX 成功：${aspxSuccess} 部`);
console.log(`   📊 ASPX 失敗：${aspxFail} 部`);
console.log(`   📊 TXT 成功：${txtSuccess} 部`);
console.log(`   📊 TXT 無條文：${txtEmpty} 部`);
console.log(`   📊 TXT 失敗：${txtFail} 部`);
console.log(`   📊 法規總數：${allLaws.length} 部`);
console.log('');
console.log(`   📁 輸出：${outputPath}`);
console.log('');