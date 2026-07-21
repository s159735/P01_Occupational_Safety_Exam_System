# -*- coding: utf-8 -*-
"""
🔍 05_驗證資料.py
功能：驗證 v10.1.0 資料匯入結果（8 大題型完整檢查）
版本：v10.1.0
更新日期：2026-07-17
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import psycopg2
    from config import DATABASE_URL, TYPE_LABEL_MAP, LOGIC_TAG_MAP
except ImportError as e:
    print(f"❌ 導入失敗: {e}")
    print("請先安裝 psycopg2-binary: pip install psycopg2-binary")
    sys.exit(1)


def verify():
    """驗證匯入結果（v10.1.0 完整檢查）"""
    print("=" * 60)
    print("🔍 驗證匯入結果 (v10.1.0)")
    print("=" * 60)

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # ============================================================
        # 1. 統計題目數量（8 大題型）
        # ============================================================
        print("\n📊 8 大題型統計:")
        print("-" * 40)

        cursor.execute("""
            SELECT type, COUNT(*) 
            FROM questions 
            GROUP BY type 
            ORDER BY type
        """)
        results = cursor.fetchall()

        total = 0
        type_dist = {}

        for qtype, count in results:
            label = TYPE_LABEL_MAP.get(qtype, qtype)
            print(f"   {label}: {count} 筆")
            total += count
            type_dist[qtype] = count

        print("-" * 40)
        print(f"   📝 總計: {total} 筆")

        # ============================================================
        # 2. 檢查 8 大題型是否齊全
        # ============================================================
        print("\n🔍 題型完整性檢查:")
        print("-" * 40)

        expected_types = ['single', 'multiple', 'truefalse', 'fill', 'calc', 'match', 'sequencing', 'link']
        found_types = list(type_dist.keys())

        missing_types = [t for t in expected_types if t not in found_types]
        if missing_types:
            print(f"   ⚠️ 缺少題型: {', '.join([TYPE_LABEL_MAP.get(t, t) for t in missing_types])}")
        else:
            print("   ✅ 所有 8 大題型皆已匯入")

        # ============================================================
        # 3. 檢查欄位完整性（v10.1.0）
        # ============================================================
        print("\n🔍 欄位完整性檢查 (v10.1.0):")
        print("-" * 40)

        # 檢查必填欄位
        required_fields = ['question_id', 'type', 'text', 'points', 'stem']
        for field in required_fields:
            cursor.execute(f"""
                SELECT COUNT(*) FROM questions 
                WHERE {field} IS NULL OR {field} = ''
            """)
            null_count = cursor.fetchone()[0]
            status = "✅" if null_count == 0 else "⚠️"
            print(f"   {status} {field}: {null_count} 筆缺失")

        # 檢查 v10.1.0 新增欄位
        new_fields = ['type_label', 'points_per_item', 'group_num', 'image_url', 'explanation', 'tips', 'logic_tags']
        print("\n   📌 v10.1.0 新增欄位:")
        for field in new_fields:
            cursor.execute(f"""
                SELECT COUNT(*) FROM questions 
                WHERE {field} IS NOT NULL AND {field} != '' AND {field} != 'null'
                  AND {field} != '{}' AND {field} != '[]'
            """)
            has_count = cursor.fetchone()[0]
            pct = (has_count / total * 100) if total > 0 else 0
            status = "✅" if pct > 80 else "⚠️"
            print(f"   {status} {field}: {has_count}/{total} ({pct:.1f}%)")

        # ============================================================
        # 4. 邏輯標籤分布
        # ============================================================
        print("\n🏷️ 邏輯標籤分布:")
        print("-" * 40)

        cursor.execute("""
            SELECT logic_tags, COUNT(*) 
            FROM questions 
            WHERE logic_tags IS NOT NULL AND logic_tags != '[]'
            GROUP BY logic_tags
            ORDER BY COUNT(*) DESC
            LIMIT 10
        """)
        tag_results = cursor.fetchall()

        if tag_results:
            for tags_json, count in tag_results:
                try:
                    import json
                    tags = json.loads(tags_json)
                    tag_str = ', '.join(tags) if tags else '無標籤'
                    print(f"   {tag_str}: {count} 筆")
                except:
                    print(f"   {tags_json[:30]}: {count} 筆")
        else:
            print("   ⚠️ 無邏輯標籤資料")

        # ============================================================
        # 5. 法規關聯統計
        # ============================================================
        print("\n⚖️ 法規關聯統計:")
        print("-" * 40)

        cursor.execute("""
            SELECT COUNT(*) FROM questions 
            WHERE law_ref IS NOT NULL AND law_ref != '{}'
              AND law_ref != 'null'
        """)
        law_ref_count = cursor.fetchone()[0]
        pct = (law_ref_count / total * 100) if total > 0 else 0
        print(f"   有關聯法規: {law_ref_count}/{total} ({pct:.1f}%)")

        cursor.execute("SELECT COUNT(*) FROM laws")
        law_count = cursor.fetchone()[0]
        print(f"   法規總數: {law_count} 部")

        # ============================================================
        # 6. 法規等級分布
        # ============================================================
        if law_count > 0:
            cursor.execute("""
                SELECT level, COUNT(*) 
                FROM laws 
                WHERE level IS NOT NULL AND level != ''
                GROUP BY level 
                ORDER BY COUNT(*) DESC
                LIMIT 5
            """)
            law_levels = cursor.fetchall()
            if law_levels:
                print("\n   📋 法規層級分布:")
                for level, count in law_levels:
                    print(f"      - {level}: {count} 部")

        # ============================================================
        # 7. 最近匯入的題目
        # ============================================================
        print("\n📝 最近匯入的題目 (前 5 筆):")
        print("-" * 40)

        cursor.execute("""
            SELECT question_id, type, LEFT(text, 35) || '...' as q_text
            FROM questions 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        recent = cursor.fetchall()
        for qid, qtype, qtext in recent:
            label = TYPE_LABEL_MAP.get(qtype, qtype)
            print(f"   [{qid}] {label}: {qtext}")

        cursor.close()
        conn.close()

        print("\n" + "=" * 60)
        if total > 0 and law_count > 0:
            print("✅ v10.1.0 資料驗證通過！")
            print(f"   📊 8 大題型: {len(found_types)}/8 種")
            print(f"   📝 題目總數: {total} 筆")
            print(f"   ⚖️ 法規總數: {law_count} 部")
        elif total > 0:
            print("⚠️ 題目已匯入，但法規可能未完整匯入")
            print(f"   📝 題目總數: {total} 筆")
            print(f"   ⚖️ 法規總數: {law_count} 部")
        elif law_count > 0:
            print("⚠️ 法規已匯入，但題目可能未完整匯入")
        else:
            print("❌ 資料庫仍為空，請檢查匯入程序")
        print("=" * 60)

    except Exception as e:
        print(f"❌ 驗證失敗: {e}")


if __name__ == "__main__":
    verify()