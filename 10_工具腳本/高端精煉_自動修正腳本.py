#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高端精煉_自動修正腳本 v2.1
專案：乙級職安衛模擬測驗系統 (v9.0.0)
功能：
  1. 備份所有 JSON 檔案（加時間戳記）
  2. 自動分類 logic 標籤
  3. 補齊 tips.mnemonic
  4. 補齊 explanation.summary
  5. 驗證修正結果
"""

import os
import json
import re
import shutil
from datetime import datetime
from pathlib import Path

# ============================================================
# 設定區（使用您實際的檔案名稱）
# ============================================================

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent

# JSON 檔案路徑（使用您實際的檔案名稱）
JSON_FILES = {
    '單選題': PROJECT_ROOT / '06_資料庫/06_完整題庫/單選題.json',
    '複選題': PROJECT_ROOT / '06_資料庫/06_完整題庫/複選題.json',
    '是非題': PROJECT_ROOT / '06_資料庫/06_完整題庫/是非題.json',
    '填空題': PROJECT_ROOT / '06_資料庫/06_完整題庫/填空題.json',
    '計算題': PROJECT_ROOT / '06_資料庫/06_完整題庫/計算題.json',
    '配合題': PROJECT_ROOT / '06_資料庫/06_完整題庫/配合題.json',
    '排序題': PROJECT_ROOT / '06_資料庫/06_完整題庫/排序題.json',
    '連連看': PROJECT_ROOT / '06_資料庫/06_完整題庫/連連看.json',
}

# 備份目錄
BACKUP_DIR = PROJECT_ROOT / '11_備份記錄/高端精煉備份'

# ============================================================
# 6 大邏輯標籤定義
# ============================================================

def auto_classify_logic(question):
    """自動分類邏輯標籤"""
    text = question.get('text', '')
    qtype = question.get('type', '')
    tags = []
    
    # 1. 法規數字：包含數字、百分比、單位
    if re.search(r'\d+%', text) or '【___】' in text or re.search(r'第\s*\d+\s*條', text):
        tags.append('法規數字')
    if re.search(r'\d+[公尺公分公斤公噸度小時分鐘秒人年月日]', text):
        tags.append('法規數字')
    
    # 2. 流程操作：排序題或包含順序關鍵字
    if qtype == 'sequencing' or re.search(r'順序|步驟|先後|排列|流程', text):
        tags.append('流程操作')
    
    # 3. 計算應用：計算題或包含計算關鍵字
    if qtype == 'calc' or re.search(r'計算|公式|求|為多少|換算|平均|總和|差|比|比例|速率|濃度|劑量', text):
        tags.append('計算應用')
    
    # 4. 危害辨識：配合/連連看或包含危害關鍵字
    if qtype in ['match', 'link']:
        tags.append('危害辨識')
    if re.search(r'危害|風險|危險|辨識|配對|對應|類型|物質|場所|種類|特性|症狀', text):
        tags.append('危害辨識')
    
    # 5. 法規理解：是非題或包含判斷關鍵字
    if qtype == 'truefalse' or re.search(r'是否正確|敘述|應|不得|可以|必須|禁止|可否|是否', text):
        tags.append('法規理解')
    
    # 6. 法規記憶：其他包含法規關鍵字的
    if re.search(r'法規|規定|條例|規則|標準|辦法|細則|施行細則', text):
        tags.append('法規記憶')
    
    # 7. 去重，如果沒有任何標籤則加入法規記憶
    tags = list(dict.fromkeys(tags))
    if not tags:
        tags = ['法規記憶']
    
    return tags


def generate_mnemonic(question):
    """自動生成口訣"""
    text = question.get('text', '')
    qtype = question.get('type', '')
    answer = question.get('answer', '')
    
    tips = question.get('tips', {})
    if isinstance(tips, dict) and tips.get('mnemonic'):
        return None
    
    mnemonic = ''
    
    if qtype == 'sequencing' and isinstance(answer, list) and answer:
        # 將 answer 中的元素轉為字串
        str_answer = [str(a) for a in answer]
        first_chars = [s[0] if s else '?' for s in str_answer]
        mnemonic = f'📌 口訣：{"→".join(first_chars)}'
    elif qtype == 'truefalse':
        is_true = answer in [0, '0', '是', True]
        mnemonic = '📌 此敘述正確' if is_true else '📌 此敘述錯誤'
    elif qtype == 'match':
        left_items = question.get('leftItems', [])
        if left_items and len(left_items) <= 5:
            keywords = [item[:2] if len(item) >= 2 else item for item in left_items]
            mnemonic = f'📌 關鍵配對：{"、".join(keywords)}'
    elif qtype == 'calc':
        numbers = re.findall(r'\d+', text)
        if numbers:
            mnemonic = f'📌 關鍵數字：{"、".join(numbers[:5])}'
    
    if not mnemonic:
        words = re.findall(r'[\u4e00-\u9fff]{2,4}', text)
        if words:
            mnemonic = f'📌 關鍵詞：{"、".join(words[:3])}'
        else:
            mnemonic = '📌 請參考法規內容'
    
    return mnemonic


def safe_join(arr, separator='、'):
    """安全地將陣列元素轉為字串後合併"""
    if not arr:
        return ''
    return separator.join(str(item) for item in arr)


def generate_explanation_summary(question):
    """自動生成解析摘要"""
    text = question.get('text', '')
    qtype = question.get('type', '')
    answer = question.get('answer', '')
    options = question.get('options', [])
    law = question.get('law', {})
    
    explanation = question.get('explanation', {})
    if isinstance(explanation, dict) and explanation.get('summary'):
        return None
    
    summary = ''
    
    if qtype == 'single' and isinstance(answer, int) and 0 <= answer < len(options):
        label = chr(65 + answer)
        summary = f'正確答案為 {label}. {options[answer]}'
        if law and law.get('name'):
            summary += f'（依據 {law.get("name")} 相關規定）'
    elif qtype == 'multiple' and isinstance(answer, list):
        labels = [chr(65 + i) for i in answer if 0 <= i < len(options)]
        values = [options[i] for i in answer if 0 <= i < len(options)]
        summary = f'正確答案為 {", ".join(labels)}（{", ".join(values)}）'
    elif qtype == 'truefalse':
        is_true = answer in [0, '0', '是', True]
        summary = f'此敘述為 {"正確" if is_true else "錯誤"}'
        if law and law.get('name'):
            summary += f'（依據 {law.get("name")} 相關規定）'
    elif qtype == 'fill':
        if isinstance(answer, list):
            summary = f'填入答案為：{safe_join(answer)}'
        else:
            summary = f'填入答案為：{answer}'
    elif qtype == 'calc':
        summary = f'計算結果為 {answer}'
    elif qtype == 'match':
        left_items = question.get('leftItems', [])
        if isinstance(answer, list) and left_items:
            pairs = [f'{left_items[i]}→{answer[i]}' for i in range(min(len(left_items), len(answer)))]
            summary = '配對結果：' + '；'.join(pairs)
    elif qtype == 'sequencing' and isinstance(answer, list):
        summary = '正確順序：' + ' → '.join(str(a) for a in answer)
    elif qtype == 'link':
        # 連連看：answer 可能是數字陣列或字串陣列
        if isinstance(answer, list):
            # 如果 answer 是數字陣列（索引），轉為字串
            summary = '配對結果：' + safe_join(answer)
        else:
            summary = f'配對結果：{answer}'
    
    if not summary:
        summary = f'解析：{text[:50]}...'
    
    return summary


def process_question(question):
    """處理單一題目"""
    changes = []
    
    # 1. 標準化 logic
    old_logic = question.get('logic', [])
    if not old_logic or (isinstance(old_logic, list) and len(old_logic) <= 1):
        new_logic = auto_classify_logic(question)
        if old_logic != new_logic:
            question['logic'] = new_logic
            changes.append(f'logic: {old_logic} → {new_logic}')
    
    # 2. 標準化 tips
    tips = question.get('tips', {})
    if not isinstance(tips, dict):
        question['tips'] = {'quick': [], 'mnemonic': '', 'story': '', 'commonMistake': []}
        changes.append('tips: 重新格式化為物件')
    
    # 3. 補充 mnemonic
    if not isinstance(question.get('tips'), dict):
        question['tips'] = {'quick': [], 'mnemonic': '', 'story': '', 'commonMistake': []}
    
    if not question['tips'].get('mnemonic'):
        new_mnemonic = generate_mnemonic(question)
        if new_mnemonic:
            question['tips']['mnemonic'] = new_mnemonic
            changes.append('mnemonic: 已自動生成')
    
    # 4. 補充 explanation.summary
    if not isinstance(question.get('explanation'), dict):
        question['explanation'] = {'summary': ''}
    if not question['explanation'].get('summary'):
        new_summary = generate_explanation_summary(question)
        if new_summary:
            question['explanation']['summary'] = new_summary
            changes.append('summary: 已自動生成')
    
    return changes


def backup_json_files():
    """備份所有 JSON 檔案"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = BACKUP_DIR / timestamp
    backup_path.mkdir(parents=True, exist_ok=True)
    
    print(f'📁 備份目錄: {backup_path}')
    
    for key, filepath in JSON_FILES.items():
        if filepath.exists():
            shutil.copy2(filepath, backup_path / filepath.name)
            print(f'   ✅ 備份: {filepath.name}')
        else:
            print(f'   ⚠️ 檔案不存在: {filepath.name}')
    
    return backup_path


def process_json_file(filepath):
    """處理單個 JSON 檔案"""
    print(f'\n📄 處理: {filepath.name}')
    
    if not filepath.exists():
        print(f'   ⚠️ 檔案不存在，跳過')
        return {'total': 0, 'modified': 0}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', [])
    total = len(questions)
    modified = 0
    
    for question in questions:
        changes = process_question(question)
        if changes:
            modified += 1
    
    # 寫回檔案
    if modified > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f'   ✅ 總題數: {total}, 修正: {modified} 題')
    return {'total': total, 'modified': modified}


def verify_results():
    """驗證修正結果"""
    print('\n' + '='*60)
    print('🔍 驗證修正結果')
    print('='*60)
    
    results = {}
    
    for key, filepath in JSON_FILES.items():
        if not filepath.exists():
            results[key] = {'total': 0, 'issues': ['檔案不存在'], 'status': '⚠️ 檔案不存在'}
            continue
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            questions = data.get('questions', [])
            issues = []
            
            for q in questions:
                logic = q.get('logic', [])
                if not isinstance(logic, list):
                    issues.append(f'[{q.get("id")}] logic 不是陣列')
                elif not logic:
                    issues.append(f'[{q.get("id")}] logic 為空')
                
                tips = q.get('tips', {})
                if not isinstance(tips, dict):
                    issues.append(f'[{q.get("id")}] tips 不是物件')
                
                exp = q.get('explanation', {})
                if not isinstance(exp, dict):
                    issues.append(f'[{q.get("id")}] explanation 不是物件')
                elif not exp.get('summary'):
                    issues.append(f'[{q.get("id")}] explanation.summary 為空')
            
            results[key] = {
                'total': len(questions),
                'issues': issues,
                'status': '✅ 通過' if not issues else f'⚠️ {len(issues)} 個問題'
            }
        except Exception as e:
            results[key] = {'total': 0, 'issues': [f'讀取失敗: {str(e)}'], 'status': '❌ 錯誤'}
    
    print(f'\n{"題型":<10} {"總題數":<10} {"狀態":<30}')
    print('-'*55)
    for key, result in results.items():
        print(f'{key:<10} {result["total"]:<10} {result["status"]}')
        if result.get('issues'):
            for issue in result['issues'][:3]:
                print(f'      ⚠️ {issue}')
    
    return results


def main():
    print('='*60)
    print('🚀 高端精煉_自動修正腳本 v2.1')
    print('='*60)
    print(f'📅 執行時間: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'📁 專案根目錄: {PROJECT_ROOT}')
    
    # 檢查 JSON 檔案
    print(f'\n📁 檢查 JSON 檔案:')
    for key, filepath in JSON_FILES.items():
        exists = '✅' if filepath.exists() else '❌'
        size = filepath.stat().st_size if filepath.exists() else 0
        print(f'   {exists} {filepath.name} ({size:,} bytes)' if filepath.exists() else f'   {exists} {filepath.name}')
    
    # 1. 備份
    print('\n' + '='*60)
    print('📦 步驟 1：備份原始檔案')
    print('='*60)
    backup_path = backup_json_files()
    
    # 2. 處理 JSON
    print('\n' + '='*60)
    print('🔧 步驟 2：處理 JSON 檔案')
    print('='*60)
    
    total_processed = 0
    total_modified = 0
    
    for key, filepath in JSON_FILES.items():
        result = process_json_file(filepath)
        total_processed += result['total']
        total_modified += result['modified']
    
    print(f'\n📊 總計: {total_processed} 題, 修正 {total_modified} 題')
    
    # 3. 驗證
    print('\n' + '='*60)
    print('🔍 步驟 3：驗證結果')
    print('='*60)
    verify_results()
    
    print('\n' + '='*60)
    print('✅ 高端精煉自動修正完成！')
    print('='*60)
    print(f'📁 備份位置: {backup_path}')
    print('='*60)


if __name__ == '__main__':
    main()