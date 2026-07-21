# -*- coding: utf-8 -*-
"""
📋 02_建立資料表.py
功能：在 Supabase 中建立 questions 和 laws 資料表（v10.1.0 完整結構）
版本：v10.1.0
更新日期：2026-07-17
使用方式：python 02_建立資料表.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import psycopg2
    from config import DATABASE_URL
except ImportError as e:
    print(f"❌ 導入失敗: {e}")
    print("請先安裝 psycopg2-binary: pip install psycopg2-binary")
    sys.exit(1)


def create_tables():
    """建立資料表（v10.1.0 完整結構）"""
    print("=" * 60)
    print("📋 建立資料表 (v10.1.0)")
    print("=" * 60)

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # ============================================================
        # 1. 建立 questions 資料表（v10.1.0 完整欄位）
        # ============================================================
        print("\n📝 建立 questions 資料表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                -- 基本識別
                question_id VARCHAR(20) PRIMARY KEY,
                type VARCHAR(20) NOT NULL,
                type_label VARCHAR(20),
                
                -- 題目內容
                text TEXT NOT NULL,
                options JSONB,
                answer JSONB,
                
                -- 配分與分組
                points VARCHAR(20) DEFAULT '10%',
                points_per_item VARCHAR(20),
                group_num INTEGER DEFAULT 1,
                stem VARCHAR(200) DEFAULT '試回答下列問題：',
                
                -- 圖片
                image_url VARCHAR(500),
                
                -- 法規關聯
                law_ref JSONB,
                law_pcode VARCHAR(50),
                law_name VARCHAR(200),
                
                -- 智慧化解析
                explanation JSONB,
                tips JSONB,
                logic_tags JSONB,
                
                -- 計算題專用
                formula_key VARCHAR(50),
                formula_params JSONB,
                
                -- 配合題專用
                match_items JSONB,
                
                -- 連連看專用
                pairs JSONB,
                
                -- 系統欄位
                mode VARCHAR(20) DEFAULT 'technical',
                category VARCHAR(100),
                difficulty INTEGER DEFAULT 1,
                source VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   ✅ questions 資料表已建立 (v10.1.0)")

        # ============================================================
        # 2. 建立 laws 資料表（v10.1.0）
        # ============================================================
        print("\n⚖️ 建立 laws 資料表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS laws (
                pcode VARCHAR(50) PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                display_name VARCHAR(200),
                level VARCHAR(50),
                category VARCHAR(200),
                url VARCHAR(500),
                law_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   ✅ laws 資料表已建立 (v10.1.0)")

        # ============================================================
        # 3. 建立索引
        # ============================================================
        print("\n🔍 建立索引...")

        indexes = [
            ("idx_questions_type", "questions", "type"),
            ("idx_questions_mode", "questions", "mode"),
            ("idx_questions_law_pcode", "questions", "law_pcode"),
            ("idx_questions_group", "questions", "group_num"),
            ("idx_laws_pcode", "laws", "pcode"),
            ("idx_laws_name", "laws", "name"),
        ]

        for idx_name, table, column in indexes:
            try:
                cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}({column})")
                print(f"   ✅ {idx_name}")
            except Exception as e:
                print(f"   ⚠️ {idx_name} 建立失敗: {e}")

        # ============================================================
        # 4. 檢查現有資料
        # ============================================================
        cursor.execute("SELECT COUNT(*) FROM questions")
        q_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM laws")
        l_count = cursor.fetchone()[0]

        conn.commit()
        cursor.close()
        conn.close()

        print("\n" + "=" * 60)
        print("📊 當前狀態:")
        print(f"   📝 questions: {q_count} 筆")
        print(f"   ⚖️ laws: {l_count} 筆")
        print("=" * 60)
        print("✅ 資料表建立完成！")

    except Exception as e:
        print(f"❌ 建立失敗: {e}")
        return False


if __name__ == "__main__":
    create_tables()