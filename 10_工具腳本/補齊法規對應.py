# 10_工具腳本/補齊法規對應.py
# 根據瘦身後的 JSON 重新建立 law_ref 對應

import json
from pathlib import Path
from supabase import create_client

PROJECT_ROOT = Path(__file__).parent.parent
JSON_DIR = PROJECT_ROOT / "06_資料庫" / "06_完整題庫"

# Supabase 連線（請填入您的實際值）
SUPABASE_URL = "https://zbajabhiewzciqnbajnn.supabase.co"
SUPABASE_KEY = "your_anon_key"  # 請修改

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

json_files = [
    "單選題.json", "複選題.json", "是非題.json",
    "填空題.json", "計算題.json", "配合題.json",
    "排序題.json", "連連看.json"
]

total_updated = 0

for filename in json_files:
    filepath = JSON_DIR / filename
    if not filepath.exists():
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', [])
    for q in questions:
        qid = q.get('id')
        law = q.get('law', {})
        if not law:
            continue
        
        law_ref = {
            'pcode': law.get('pcode', ''),
            'article': law.get('article', {'條': ''})
        }
        
        if law_ref['pcode']:
            supabase.table('questions').update({
                'law_ref': law_ref
            }).eq('question_id', qid).execute()
            total_updated += 1
            print(f"✅ 更新 {qid}: {law_ref['pcode']}")

print(f"\n✅ 共更新 {total_updated} 題")