#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
題庫瘦身工具 v1.0
功能：移除全智慧化不需要的欄位（explanation、tips、logic、spec、stem、typeLabel、typePrefix、points）
保留：id、type、text、options、answer、law.pcode、law.article.條
"""

import json
import shutil
from pathlib import Path
from datetime import datetime

# ============================================================
# 設定區
# ============================================================

PROJECT_ROOT = Path(__file__).parent.parent
JSON_DIR = PROJECT_ROOT / "06_資料庫" / "06_完整題庫"
BACKUP_DIR = PROJECT_ROOT / "11_備份記錄" / f"瘦身備份_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

# 要保留的欄位（白名單）
KEEP_FIELDS = [
    'id', 'type', 'text', 'options', 'answer', 'law'
]

# law 內部要保留的欄位
KEEP_LAW_FIELDS = ['pcode', 'article']

# article 內部要保留的欄位
KEEP_ARTICLE_FIELDS = ['條']

# 可選保留：如果需要精確條文定位，可加入以下欄位
# KEEP_ARTICLE_FIELDS = ['條', '項', '款', '目']

# ============================================================
# 核心函數
# ============================================================

def slim_law(law):
    """瘦身 law 物件：只保留 pcode 和 article.條"""
    if not law:
        return None
    
    slim = {}
    
    # 保留 pcode
    if 'pcode' in law:
        slim['pcode'] = law['pcode']
    
    # 保留 article（只保留「條」）
    if 'article' in law and law['article']:
        article = law['article']
        slim_article = {}
        for key in KEEP_ARTICLE_FIELDS:
            if key in article:
                slim_article[key] = article[key]
        if slim_article:
            slim['article'] = slim_article
    
    return slim


def slim_question(q):
    """瘦身單一題目：只保留白名單欄位"""
    slim = {}
    for key in KEEP_FIELDS:
        if key in q:
            if key == 'law':
                slim['law'] = slim_law(q['law'])
            else:
                slim[key] = q[key]
    return slim


def process_file(filepath):
    """處理單個 JSON 檔案"""
    print(f"\n📄 處理: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 記錄原始題數
    original_count = len(data.get('questions', []))
    print(f"   📊 原始題數: {original_count}")
    
    # 瘦身每個題目
    if 'questions' in data:
        for i, q in enumerate(data['questions']):
            data['questions'][i] = slim_question(q)
    
    # 瘦身元資料（移除不必要的欄位）
    keep_meta = ['type', 'typeLabel', 'typePrefix', 'source', 'questions']
    slim_meta = {k: data[k] for k in keep_meta if k in data}
    
    # 寫回
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(slim_meta, f, ensure_ascii=False, indent=2)
    
    # 計算瘦身後大小
    new_size = filepath.stat().st_size
    print(f"   ✅ 瘦身完成: {original_count} 題")
    print(f"   📦 檔案大小: {new_size:,} bytes")


def main():
    print("=" * 60)
    print("🚀 題庫瘦身工具 v1.0")
    print("📋 將移除全智慧化不需要的欄位")
    print("=" * 60)
    print(f"\n📁 工作目錄: {JSON_DIR}")
    print(f"📁 備份目錄: {BACKUP_DIR}")
    
    # 建立備份目錄
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\n📦 備份原始檔案...")
    
    # 備份並瘦身
    json_files = [
        "單選題.json", "複選題.json", "是非題.json",
        "填空題.json", "計算題.json", "配合題.json",
        "排序題.json", "連連看.json"
    ]
    
    total_questions = 0
    
    for filename in json_files:
        filepath = JSON_DIR / filename
        if not filepath.exists():
            print(f"\n⚠️ 檔案不存在: {filename}")
            continue
        
        # 備份
        backup_path = BACKUP_DIR / filename
        shutil.copy2(filepath, backup_path)
        print(f"\n   ✅ 已備份: {filename}")
        
        # 瘦身
        process_file(filepath)
        
        # 統計
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            total_questions += len(data.get('questions', []))
    
    print("\n" + "=" * 60)
    print(f"✅ 題庫瘦身完成！")
    print(f"📊 總題數: {total_questions} 題")
    print(f"📁 備份位置: {BACKUP_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()