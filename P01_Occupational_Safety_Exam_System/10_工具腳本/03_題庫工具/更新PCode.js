// ============================================================
// 更新PCode.js - 將查到的 PCode 更新到法規資料庫
// 執行：node 更新PCode.js
// ============================================================

const fs = require('fs');
const path = require('path');

// 法規名稱 → PCode 對應表（您提供的 12 筆）
const LAW_PCODE_MAP = {
    // 兒童及少年保護相關
    '兒童及少年保護通報與分級分類處理及調查辦法': 'D0050009',
    '兒童及少年性剝削行為人輔導教育辦法': 'D0050035',
    '兒童及少年性剝削防制條例': 'D0050023',
    '兒童及少年性剝削防制條例施行細則': 'D0050027',
    
    // 性侵害防治相關
    '性侵害犯罪防治法專業人士資格及協助辦法': 'D0050074',
    '性侵害犯罪防治法施行細則': 'D0050135',
    
    // 性騷擾防治相關
    '性騷擾防治法': 'D0080079',
    '性騷擾防治法施行細則': 'D0080080',
    '性騷擾防治準則': 'D0080220',
    
    // 其他（您提供的額外筆）
    '性騷擾防治法施行細則': 'D0080080',  // 已包含
    '行政訴訟法': 'A0030154',
    '行政訴訟法施行法': 'A0030156'
};

// 法規資料庫路徑
const LAW_DB_PATH = path.join(__dirname, '..', '..', '10_資料庫', '07_法規資料庫', 'ChLaw_完整版.json');

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('   🔧 更新 PCode 到法規資料庫');
console.log('════════════════════════════════════════════════════════');
console.log('');

// 讀取法規資料庫
if (!fs.existsSync(LAW_DB_PATH)) {
    console.error(`❌ 找不到法規資料庫：${LAW_DB_PATH}`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(LAW_DB_PATH, 'utf8'));
let fixedCount = 0;
let notFoundCount = 0;
const notFoundList = [];

// 更新 PCode
for (const law of data.Laws) {
    const lawName = law.LawName;
    if (LAW_PCODE_MAP[lawName]) {
        const pcode = LAW_PCODE_MAP[lawName];
        // 檢查是否已存在且不同
        if (law.PCode !== pcode) {
            law.PCode = pcode;
            law.LawURL = `https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=${pcode}`;
            fixedCount++;
            console.log(`   ✅ ${lawName} → ${pcode}`);
        } else {
            console.log(`   ⏭️ ${lawName} → ${pcode}（已存在）`);
        }
    }
}

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log(`   📊 更新統計：`);
console.log(`   ✅ 已更新：${fixedCount} 筆法規`);
console.log(`   ⚠️ 未找到：${notFoundCount} 筆（請檢查法規名稱是否完全一致）`);
console.log('════════════════════════════════════════════════════════');

// 儲存
fs.writeFileSync(LAW_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
console.log('');
console.log(`💾 已儲存：${LAW_DB_PATH}`);
console.log('');
console.log('✅ 更新完成！');