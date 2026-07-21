// ============================================================
// convert_rtf_to_txt_direct.js
// 直接用 Node.js 讀取 RTF，不經過 Word/VBS
// ============================================================

const fs = require('fs');
const path = require('path');
const { Parser } = require('rtf-parser');

const CONFIG = {
    inputFolder: path.join(__dirname, '20260709220422584'),
    outputFolder: path.join(__dirname, '20260709220422584_txt')
};

if (!fs.existsSync(CONFIG.outputFolder)) {
    fs.mkdirSync(CONFIG.outputFolder, { recursive: true });
}

const files = fs.readdirSync(CONFIG.inputFolder).filter(f => f.endsWith('.rtf'));

console.log(`📄 找到 ${files.length} 個 RTF 檔案`);
console.log('');

let successCount = 0;
let failCount = 0;

for (const file of files) {
    const inputPath = path.join(CONFIG.inputFolder, file);
    const outputPath = path.join(CONFIG.outputFolder, file.replace(/\.rtf$/, '.txt'));

    try {
        const rtfContent = fs.readFileSync(inputPath);
        const parser = new Parser();
        const parsed = parser.parse(rtfContent);
        
        // 提取純文字
        let text = '';
        if (parsed && parsed.content) {
            // 遞迴提取文字
            const extractText = (node) => {
                if (typeof node === 'string') {
                    text += node;
                } else if (Array.isArray(node)) {
                    for (const item of node) {
                        extractText(item);
                    }
                } else if (node && typeof node === 'object') {
                    if (node.text) {
                        text += node.text;
                    }
                    if (node.children) {
                        extractText(node.children);
                    }
                    if (node.content) {
                        extractText(node.content);
                    }
                }
            };
            extractText(parsed);
        }

        // 如果提取的文字太少，改用 backup 方法（直接過濾控制碼）
        if (!text || text.length < 50) {
            const raw = rtfContent.toString('utf8');
            text = raw
                .replace(/\{[^}]*\}/g, ' ')
                .replace(/\\[a-zA-Z]+/g, ' ')
                .replace(/[{}]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        if (text && text.length > 50) {
            fs.writeFileSync(outputPath, text, 'utf8');
            successCount++;
            console.log(`  ✅ ${file} (${text.length} 字元)`);
        } else {
            failCount++;
            console.log(`  ⚠️ ${file} (無法提取文字)`);
        }
    } catch (err) {
        failCount++;
        console.log(`  ❌ ${file} (錯誤: ${err.message})`);
    }
}

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('   ✅ 轉換完成！');
console.log('════════════════════════════════════════════════════════');
console.log(`   📊 成功：${successCount} 個`);
console.log(`   📊 失敗：${failCount} 個`);
console.log(`   📁 輸出資料夾: ${CONFIG.outputFolder}`);
console.log('');
console.log('📋 下一步：執行 node 01_法規轉換器.js');