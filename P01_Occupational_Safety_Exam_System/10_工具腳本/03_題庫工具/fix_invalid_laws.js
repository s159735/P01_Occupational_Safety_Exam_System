// ============================================================
// fix_invalid_laws.js - 修復 36 筆無效引用
// 執行：node fix_invalid_laws.js
// ============================================================

const fs = require('fs');
const path = require('path');

// 法規名稱對應表（錯誤名稱 → 正確名稱 + PCode）
const LAW_MAPPING = {
    // 非職安衛法規（從法規清單.csv 取得 PCode）
    '菸害防制法': { name: '菸害防制法', pcode: 'L0040001' },
    '公職人員利益衝突迴避法': { name: '公職人員利益衝突迴避法', pcode: 'I0020007' },
    '證券交易法': { name: '證券交易法', pcode: 'J0080001' },
    '貪污治罪條例': { name: '貪污治罪條例', pcode: 'C0000007' },
    '公務員廉政倫理規範': { name: '公務員廉政倫理規範', pcode: 'I0020027' },
    '證人保護法': { name: '證人保護法', pcode: 'A0030161' },
    '性別工作平等法': { name: '性別平等工作法', pcode: 'N0030014' },
    '消除對婦女一切形式歧視公約': { name: '消除對婦女一切形式歧視公約', pcode: 'Y0000001' },
    
    // 職安衛法規（名稱修正）
    '鉻酸及鉻酸鹽安全規則': { name: '鉻酸及其鹽類危害預防標準', pcode: 'N0060015' },
    
    // 非法規名稱 → 正確法規
    '應置有自動體外心臟電擊去顫器之公共場所': { 
        name: '公共場所必要緊急救護設備管理辦法', 
        pcode: 'D0120046' 
    }
};

// 題庫路徑
const QUESTION_TYPES = ['單選題', '複選題', '是非題', '填空題', '計算題', '配合題', '排序題', '連連看'];
const QUESTION_FOLDER = path.join(__dirname, '..', '..', '10_資料庫', '06_完整題庫');

let fixedCount = 0;

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('   🔧 無效引用批次修復工具');
console.log('════════════════════════════════════════════════════════');
console.log('');

for (const typeName of QUESTION_TYPES) {
    const filePath = path.join(QUESTION_FOLDER, `${typeName}.json`);
    if (!fs.existsSync(filePath)) continue;
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const questions = data.questions || [];
    let fileFixed = 0;
    
    for (const q of questions) {
        if (!q.law || !q.law.name) continue;
        
        const originalName = q.law.name;
        if (LAW_MAPPING[originalName]) {
            const mapping = LAW_MAPPING[originalName];
            q.law.name = mapping.name;
            q.law.pcode = mapping.pcode;
            
            // 如果有 article，保留
            if (!q.law.article) {
                q.law.article = { full: '', 條: '', 項: null, 款: null, 目: null };
            }
            
            fileFixed++;
            fixedCount++;
            console.log(`   ✅ ${q.id}：${originalName} → ${mapping.name} (${mapping.pcode})`);
        }
    }
    
    if (fileFixed > 0) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`   📁 已更新：${typeName}.json (修正 ${fileFixed} 題)`);
        console.log('');
    }
}

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log(`   ✅ 修復完成！共修正 ${fixedCount} 題`);
console.log('════════════════════════════════════════════════════════');