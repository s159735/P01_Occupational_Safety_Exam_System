# -*- coding: utf-8 -*-
"""
🔗 01_連線測試.py
功能：測試 Supabase 資料庫連線是否正常
版本：v10.1.0
更新日期：2026-07-17
使用方式：python 01_連線測試.py
"""

import sys
import os

# 加入路徑以便導入 config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import psycopg2
    from config import DATABASE_URL
except ImportError as e:
    print(f"❌ 導入失敗: {e}")
    print("請先安裝 psycopg2-binary: pip install psycopg2-binary")
    sys.exit(1)


def test_connection():
    """測試資料庫連線"""
    print("=" * 60)
    print("🔗 測試 Supabase 連線 (v10.1.0)")
    print("=" * 60)

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # 查詢 PostgreSQL 版本
        cursor.execute("SELECT version()")
        version = cursor.fetchone()
        print("✅ 連線成功！")
        print(f"   📦 PostgreSQL 版本: {version[0][:50]}...")

        # 查詢當前資料庫名稱
        cursor.execute("SELECT current_database()")
        db_name = cursor.fetchone()
        print(f"   🗄️  資料庫名稱: {db_name[0]}")

        # 查詢當前使用者
        cursor.execute("SELECT current_user")
        user = cursor.fetchone()
        print(f"   👤 使用者: {user[0]}")

        # 檢查 8 大題型資料表是否存在
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN ('questions', 'laws')
        """)
        table_count = cursor.fetchone()[0]
        print(f"   📊 已存在資料表: {table_count}/2 (questions, laws)")

        # 檢查題目數量（8 大題型）
        cursor.execute("""
            SELECT type, COUNT(*) 
            FROM questions 
            GROUP BY type 
            ORDER BY type
        """)
        type_stats = cursor.fetchall()
        if type_stats:
            print("\n   📚 各題型數量:")
            for qtype, count in type_stats:
                print(f"      - {qtype}: {count} 筆")

        cursor.close()
        conn.close()

        print("\n" + "=" * 60)
        print("✅ 連線測試通過！")
        return True

    except psycopg2.OperationalError as e:
        print(f"❌ 連線失敗（操作錯誤）: {e}")
        print("\n💡 請檢查：")
        print("   1. Supabase 專案是否仍在運行")
        print("   2. 連線字串中的密碼是否正確")
        print("   3. 網路是否可連線到 Supabase")
        return False
    except Exception as e:
        print(f"❌ 連線失敗: {e}")
        return False


if __name__ == "__main__":
    test_connection()