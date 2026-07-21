# -*- coding: utf-8 -*-
"""
📚 03_匯入題目.py
功能：將 02_種子範本 中的 8 大題型匯入 Supabase
版本：v10.1.0 - 支援完整 8 大題型格式
更新日期：2026-07-17
"""

import sys
import os
import json
import argparse
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import psycopg2
    from psycopg2.extras import execute_values
    from config import DATABASE_URL, QUESTION_BASE_PATH, QUESTION_FILES, TYPE_LABEL_MAP, BATCH_SIZE, DEFAULT_MODE
except ImportError as e:
    print(f"❌ 導入失敗: {e}")
    print("請先安裝 psycopg2-binary: pip install psycopg2-binary")
    sys.exit(1)


def load_json_file(filepath):
    """讀取 JSON 檔案"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_questions(data):
    """從 JSON 結構中提取 questions 陣列"""
    if isinstance(data, dict) and 'questions' in data:
        return data['questions']
    if isinstance(data, list):
        return data
    return []


def import_questions(conn, questions, qtype_label):
    """匯入題目到 questions 資料表（v10.1.0 完整格式）"""
    cursor = conn.cursor()

    records = []
    for q in questions:
        # 基本資訊
        question_id = q.get('id', '')
        if not question_id:
            continue

        qtype = q.get('type', '')
        type_label = q.get('typeLabel', TYPE_LABEL_MAP.get(qtype, qtype))

        # 題目內容
        text = q.get('text', '')
        options = q.get('options', [])
        if not isinstance(options, list):
            options = []

        answer = q.get('answer', '')
        if isinstance(answer, list):
            pass  # 保持陣列
        elif isinstance(answer, (int, float)):
            answer = answer
        else:
            answer = str(answer)

        # 配分與分組
        points = q.get('points', '10%')
        points_per_item = q.get('pointsPerItem', None)
        group_num = q.get('group', 1)
        stem = q.get('stem', '試回答下列問題：')

        # 圖片
        image_url = q.get('imageUrl', None)

        # 法規關聯（v10.1.0 完整格式）
        law = q.get('law', {})
        law_pcode = law.get('pcode', '')
        law_name = law.get('name', '')
        law_ref = {
            'pcode': law_pcode,
            'name': law_name,
            'article': law.get('article', {})
        }
        if not law_ref.get('article'):
            law_ref['article'] = {'full': '', '條': ''}

        # 智慧化解析
        explanation = q.get('explanation', {})
        if isinstance(explanation, str):
            explanation = {'summary': explanation}
        elif not isinstance(explanation, dict):
            explanation = {'summary': str(explanation)}

        tips = q.get('tips', {})
        if isinstance(tips, str):
            tips = {'quick': [tips]}
        elif not isinstance(tips, dict):
            tips = {}

        logic_tags = q.get('logic', [])
        if not isinstance(logic_tags, list):
            logic_tags = [str(logic_tags)]

        # 計算題專用
        formula_key = q.get('formulaKey', '')
        formula_params = q.get('formulaParams', {})
        if not isinstance(formula_params, dict):
            formula_params = {}

        # 配合題專用（v10.1.0 格式）
        match_items = q.get('matchItems', q.get('match_items', []))
        if not isinstance(match_items, list):
            match_items = []

        # 連連看專用（v10.1.0 格式）
        pairs = q.get('pairs', [])
        if not isinstance(pairs, list):
            pairs = []

        # 模式與分類
        mode = q.get('mode', DEFAULT_MODE)
        category = q.get('category', '')
        difficulty = q.get('difficulty', 1)
        source = q.get('source', qtype_label)

        record = {
            'question_id': question_id,
            'type': qtype,
            'type_label': type_label,
            'text': text,
            'options': json.dumps(options, ensure_ascii=False),
            'answer': json.dumps(answer, ensure_ascii=False),
            'points': points,
            'points_per_item': points_per_item,
            'group_num': group_num,
            'stem': stem,
            'image_url': image_url,
            'law_ref': json.dumps(law_ref, ensure_ascii=False),
            'law_pcode': law_pcode,
            'law_name': law_name,
            'explanation': json.dumps(explanation, ensure_ascii=False),
            'tips': json.dumps(tips, ensure_ascii=False),
            'logic_tags': json.dumps(logic_tags, ensure_ascii=False),
            'formula_key': formula_key,
            'formula_params': json.dumps(formula_params, ensure_ascii=False),
            'match_items': json.dumps(match_items, ensure_ascii=False),
            'pairs': json.dumps(pairs, ensure_ascii=False),
            'mode': mode,
            'category': category,
            'difficulty': difficulty,
            'source': source,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        records.append(record)

    if not records:
        print(f"⚠️ 沒有 {qtype_label} 題目可匯入")
        return 0

    # 批次插入 SQL（v10.1.0 完整欄位）
    sql = """
        INSERT INTO questions (
            question_id, type, type_label, text, options, answer,
            points, points_per_item, group_num, stem, image_url,
            law_ref, law_pcode, law_name,
            explanation, tips, logic_tags,
            formula_key, formula_params,
            match_items, pairs,
            mode, category, difficulty, source,
            created_at, updated_at
        ) VALUES %s
        ON CONFLICT (question_id) DO UPDATE SET
            type = EXCLUDED.type,
            type_label = EXCLUDED.type_label,
            text = EXCLUDED.text,
            options = EXCLUDED.options,
            answer = EXCLUDED.answer,
            points = EXCLUDED.points,
            points_per_item = EXCLUDED.points_per_item,
            group_num = EXCLUDED.group_num,
            stem = EXCLUDED.stem,
            image_url = EXCLUDED.image_url,
            law_ref = EXCLUDED.law_ref,
            law_pcode = EXCLUDED.law_pcode,
            law_name = EXCLUDED.law_name,
            explanation = EXCLUDED.explanation,
            tips = EXCLUDED.tips,
            logic_tags = EXCLUDED.logic_tags,
            formula_key = EXCLUDED.formula_key,
            formula_params = EXCLUDED.formula_params,
            match_items = EXCLUDED.match_items,
            pairs = EXCLUDED.pairs,
            mode = EXCLUDED.mode,
            category = EXCLUDED.category,
            difficulty = EXCLUDED.difficulty,
            source = EXCLUDED.source,
            updated_at = EXCLUDED.updated_at
    """

    # 轉換為 tuple 列表（共 27 個欄位）
    values = [(
        r['question_id'], r['type'], r['type_label'], r['text'],
        r['options'], r['answer'], r['points'], r['points_per_item'],
        r['group_num'], r['stem'], r['image_url'],
        r['law_ref'], r['law_pcode'], r['law_name'],
        r['explanation'], r['tips'], r['logic_tags'],
        r['formula_key'], r['formula_params'],
        r['match_items'], r['pairs'],
        r['mode'], r['category'], r['difficulty'], r['source'],
        r['created_at'], r['updated_at']
    ) for r in records]

    # 分批匯入
    total = len(values)
    for i in range(0, total, BATCH_SIZE):
        batch = values[i:i + BATCH_SIZE]
        try:
            execute_values(cursor, sql, batch)
            print(f"   📥 已匯入 {min(i + BATCH_SIZE, total)}/{total} 筆")
        except Exception as e:
            print(f"   ❌ 批次匯入失敗: {e}")
            # 嘗試單筆匯入找問題
            for j, single in enumerate(batch):
                try:
                    execute_values(cursor, sql, [single])
                except Exception as e2:
                    print(f"      ❌ 第 {i+j+1} 筆失敗: {e2}")
            conn.rollback()
            return 0

    conn.commit()
    cursor.close()

    print(f"   ✅ 共匯入 {len(records)} 筆 {qtype_label}")
    return len(records)


def main():
    """主程式"""
    parser = argparse.ArgumentParser(description='匯入題目到 Supabase (v10.1.0)')
    parser.add_argument('--type', help='只匯入指定題型（如：單選題）')
    parser.add_argument('--path', help='指定題庫路徑（預設：02_種子範本）')
    args = parser.parse_args()

    print("=" * 60)
    print("📚 匯入題目到 Supabase (v10.1.0)")
    print("=" * 60)

    # 使用自訂路徑或預設路徑
    base_path = args.path if args.path else QUESTION_BASE_PATH
    print(f"📁 題庫路徑: {base_path}")

    # 連線到資料庫
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("✅ 資料庫連線成功")
    except Exception as e:
        print(f"❌ 資料庫連線失敗: {e}")
        return

    # 決定要匯入的題型
    files_to_import = QUESTION_FILES.items()
    if args.type:
        if args.type in QUESTION_FILES:
            files_to_import = [(args.type, QUESTION_FILES[args.type])]
        else:
            print(f"⚠️ 未知題型: {args.type}")
            print(f"   可用題型: {', '.join(QUESTION_FILES.keys())}")
            return

    total_questions = 0
    type_stats = {}

    for qtype_label, filename in files_to_import:
        filepath = os.path.join(base_path, filename)
        if os.path.exists(filepath):
            print(f"\n📖 處理: {qtype_label}")
            print(f"   📁 {filepath}")
            try:
                data = load_json_file(filepath)
                questions = extract_questions(data)
                if questions:
                    print(f"   📊 找到 {len(questions)} 題")
                    count = import_questions(conn, questions, qtype_label)
                    total_questions += count
                    type_stats[qtype_label] = count
                else:
                    print(f"   ⚠️ 無題目資料")
            except json.JSONDecodeError as e:
                print(f"   ❌ JSON 解析失敗: {e}")
            except Exception as e:
                print(f"   ❌ 匯入失敗: {e}")
        else:
            print(f"   ⚠️ 找不到檔案: {filepath}")

    conn.close()

    print("\n" + "=" * 60)
    print("📊 匯入統計:")
    for qtype, count in type_stats.items():
        print(f"   {qtype}: {count} 筆")
    print("-" * 40)
    print(f"   📝 總計: {total_questions} 筆")
    print("=" * 60)

    if total_questions > 0:
        print("✅ 匯入完成！")
    else:
        print("⚠️ 無題目匯入，請檢查路徑與檔案")


if __name__ == "__main__":
    main()