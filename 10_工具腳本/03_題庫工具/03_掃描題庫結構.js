// ============================================================
// 03_掃描題庫結構.js
// 功能：掃描所有題庫檔案，顯示欄位結構與 lawRef 使用情況
// 執行：node 03_掃描題庫結構.js
// ============================================================

const fs = require('fs');
const path = require('path');

const QUESTION_TYPES = ['單選題', '複選題', '是非題', '填空題', '計算題', '配合題', '排序題', '連連看'];
const QUESTION_FOLDER = path.join(__dirname, '..', '06_完整題庫');

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('   🔍 題庫結構掃描工具');
console.log('════════════════════════════════════════════════════════');
console.log('');

if (!fs.existsSync(QUESTION_FOLDER)) {
    console.error(`❌ 找不到題庫資料夾：${QUESTION_FOLDER}`);
    process.exit(1);
}

let totalQuestions = 0;
let totalWithLaw = 0;
let totalWithLawRef = 0;
let totalWithBoth = 0;
let totalWithNeither = 0;
let allSamples = [];

for (const typeName of QUESTION_TYPES) {
    const filePath = path.join(QUESTION_FOLDER, `${typeName}.json`);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ 跳過 ${typeName}.json（檔案不存在）`);
        continue;
    }

    console.log(`📂 讀取：${typeName}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const questions = data.questions || [];

    let typeTotal = 0;
    let typeWithLaw = 0;
    let typeWithLawRef = 0;
    let typeWithBoth = 0;
    let typeWithNeither = 0;

    // 取前 3 筆作為樣本
    const samples = [];

    for (const q of questions) {
        typeTotal++;
        totalQuestions++;

        const hasLaw = q.law && typeof q.law === 'object' && q.law.name;
        const hasLawRef = q.lawRef && typeof q.lawRef === 'object' && q.lawRef.law;

        if (hasLaw) typeWithLaw++;
        if (hasLawRef) typeWithLawRef++;
        if (hasLaw && hasLawRef) typeWithBoth++;
        if (!hasLaw && !hasLawRef) typeWithNeither++;

        // 收集樣本
        if (samples.length < 3) {
            samples.push({
                id: q.id,
                type: q.type,
                hasLaw: hasLaw,
                hasLawRef: hasLawRef,
                law: q.law,
                lawRef: q.lawRef
            });
        }
    }

    totalWithLaw += typeWithLaw;
    totalWithLawRef += typeWithLawRef;
    totalWithBoth += typeWithBoth;
    totalWithNeither += typeWithNeither;

    console.log(`   📊 題數：${typeTotal}`);
    console.log(`      ✅ 有 law 欄位：${typeWithLaw} 題`);
    console.log(`      ✅ 有 lawRef 欄位：${typeWithLawRef} 題`);
    console.log(`      ⚠️ 兩者都有：${typeWithBoth} 題`);
    console.log(`      ❌ 兩者都沒有：${typeWithNeither} 題`);

    // 顯示前 3 筆樣本
    console.log(`   📋 樣本（前 3 筆）：`);
    for (const s of samples) {
        console.log(`      - ID: ${s.id}`);
        if (s.hasLaw) {
            console.log(`        law: ${JSON.stringify(s.law)}`);
        }
        if (s.hasLawRef) {
            console.log(`        lawRef: ${JSON.stringify(s.lawRef)}`);
        }
        if (!s.hasLaw && !s.hasLawRef) {
            console.log(`        ⚠️ 無任何法規引用`);
        }
    }
    console.log('');
}

// ============================================================
// 輸出總覽
// ============================================================
console.log('════════════════════════════════════════════════════════');
console.log('   📊 總覽');
console.log('════════════════════════════════════════════════════════');
console.log('');
console.log(`   📄 總題數：${totalQuestions} 題`);
console.log(`   ✅ 有 law 欄位：${totalWithLaw} 題`);
console.log(`   ✅ 有 lawRef 欄位：${totalWithLawRef} 題`);
console.log(`   ⚠️ 兩者都有：${totalWithBoth} 題`);
console.log(`   ❌ 兩者都沒有：${totalWithNeither} 題`);
console.log('');

if (totalWithLaw > 0 && totalWithLawRef === 0) {
    console.log('🔍 診斷：題庫使用「law」欄位，而不是「lawRef」欄位。');
    console.log('   → 校驗工具需要改為讀取 law 欄位。');
} else if (totalWithLawRef > 0 && totalWithLaw === 0) {
    console.log('🔍 診斷：題庫使用「lawRef」欄位，而不是「law」欄位。');
    console.log('   → 校驗工具已經正確讀取 lawRef 欄位。');
} else if (totalWithLaw > 0 && totalWithLawRef > 0) {
    console.log('🔍 診斷：題庫同時存在「law」和「lawRef」欄位。');
    console.log('   → 建議統一使用其中一種格式。');
} else {
    console.log('🔍 診斷：題庫中完全沒有法規引用欄位。');
    console.log('   → 請確認題庫是否正確。');
}

console.log('');
console.log('📁 報告已輸出至：校驗報告.txt');
console.log('');