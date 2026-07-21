# -*- coding: utf-8 -*-
"""
⚖️ 04_匯入法規.py
功能：將 07_法規資料庫 中的法規匯入 Supabase
版本：v10.1.0 - 支援 ChLaw_完整版.json 完整結構
更新日期：2026-07-17
"""

import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import psycopg2
    from psycopg2.extras import execute_values
    from config import DATABASE_URL, LAW_BASE_PATH, LAW_FILES, BATCH_SIZE
except ImportError as e:
    print(f"❌ 導入失敗: {e}")
    print("請先安裝 psycopg2-binary: pip install psycopg2-binary")
    sys.exit(1)


def load_json_file(filepath):
    """讀取 JSON 檔案"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_laws(data):
    """從 JSON 結構中提取 laws 陣列（支援多種格式）"""
    if isinstance(data, dict):
        # 優先檢查 Laws 欄位（大寫 L）
        if 'Laws' in data and isinstance(data['Laws'], list):
            return data['Laws']
        # 其他可能的 key
        for key in ['laws', 'data', 'items', 'list', 'records', '法規', 'LawList']:
            if key in data and isinstance(data[key], list):
                return data[key]
        # 如果是單一物件，包裝成陣列
        if 'PCode' in data or 'pcode' in data:
            return [data]
    if isinstance(data, list):
        return data
    return []


def import_laws(conn, laws):
    """匯入法規到 laws 資料表（v10.1.0 支援 ChLaw_完整版）"""
    cursor = conn.cursor()

    records = []
    for law in laws:
        if not isinstance(law, dict):
            continue

        # 獲取 pcode（優先大寫 PCode）
        pcode = law.get('PCode', '')
        if not pcode:
            pcode = law.get('pcode', '')
        if not pcode:
            pcode = law.get('code', '')
        if not pcode:
            continue

        # 獲取名稱（優先大寫 LawName）
        name = law.get('LawName', '')
        if not name:
            name = law.get('name', '')
        if not name:
            name = law.get('title', '')
        if not name:
            name = pcode

        # 獲取顯示名稱
        display_name = law.get('LawDisplayName', '')
        if not display_name:
            display_name = law.get('display_name', '')
        if not display_name:
            display_name = law.get('DisplayName', '')
        if not display_name:
            display_name = name

        # 獲取層級和分類
        level = law.get('LawLevel', '')
        if not level:
            level = law.get('level', '')
        if not level:
            level = '法規命令'

        category = law.get('LawCategory', '')
        if not category:
            category = law.get('category', '')
        if not category:
            category = '行政＞勞動部＞職業安全衛生目'

        # 獲取 URL
        url = law.get('LawURL', '')
        if not url:
            url = law.get('url', '')
        if not url:
            url = f"https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode={pcode}"

        # 儲存完整法規資料（保留所有原始欄位）
        law_data = {}
        for key, value in law.items():
            # 排除已提取的欄位，避免重複
            excluded_keys = ['PCode', 'pcode', 'code', 'LawName', 'name',
                             'LawDisplayName', 'display_name', 'DisplayName',
                             'LawLevel', 'level', 'LawCategory', 'category',
                             'LawURL', 'url', 'link']
            if key not in excluded_keys:
                law_data[key] = value

        record = {
            'pcode': pcode,
            'name': name,
            'display_name': display_name,
            'level': level,
            'category': category,
            'url': url,
            'law_data': json.dumps(law_data, ensure_ascii=False) if law_data else '{}',
            'created_at': datetime.now()
        }
        records.append(record)

    if not records:
        print("⚠️ 沒有法規可匯入")
        return 0

    # 批次插入 SQL
    sql = """
        INSERT INTO laws (
            pcode, name, display_name, level, category, url, law_data, created_at
        ) VALUES %s
        ON CONFLICT (pcode) DO UPDATE SET
            name = EXCLUDED.name,
            display_name = EXCLUDED.display_name,
            level = EXCLUDED.level,
            category = EXCLUDED.category,
            url = EXCLUDED.url,
            law_data = EXCLUDED.law_data,
            created_at = EXCLUDED.created_at
    """

    values = [(
        r['pcode'], r['name'], r['display_name'],
        r['level'], r['category'], r['url'],
        r['law_data'], r['created_at']
    ) for r in records]

    # 分批匯入
    total = len(values)
    for i in range(0, total, BATCH_SIZE):
        batch = values[i:i + BATCH_SIZE]
        try:
            execute_values(cursor, sql, batch)
            print(f"   📥 已匯入 {min(i + BATCH_SIZE, total)}/{total} 部")
        except Exception as e:
            print(f"   ❌ 批次匯入失敗: {e}")

    conn.commit()
    cursor.close()

    print(f"   ✅ 共匯入 {len(records)} 部法規")
    return len(records)


def main():
    """主程式"""
    print("=" * 60)
    print("⚖️ 匯入法規到 Supabase (v10.1.0)")
    print("=" * 60)

    # 連線到資料庫
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("✅ 資料庫連線成功")
    except Exception as e:
        print(f"❌ 資料庫連線失敗: {e}")
        return

    total_laws = 0
    used_file = None

    # 嘗試所有法規檔案
    for filename in LAW_FILES:
        filepath = os.path.join(LAW_BASE_PATH, filename)
        if os.path.exists(filepath):
            print(f"\n📖 讀取: {filename}")
            print(f"   📁 {filepath}")
            try:
                data = load_json_file(filepath)
                laws = extract_laws(data)
                if laws:
                    print(f"   📊 找到 {len(laws)} 部法規")
                    count = import_laws(conn, laws)
                    if count > 0:
                        total_laws = count
                        used_file = filename
                        break
                else:
                    print(f"   ⚠️ 無法解析法規資料")
                    if isinstance(data, dict):
                        print(f"   📋 資料結構 keys: {list(data.keys())}")
                        # 嘗試顯示前幾筆資料結構
                        for key in data.keys():
                            if isinstance(data[key], list) and len(data[key]) > 0:
                                print(f"   📋 {key} 第一筆 keys: {list(data[key][0].keys()) if isinstance(data[key][0], dict) else 'not dict'}")
                                break
            except json.JSONDecodeError as e:
                print(f"   ❌ JSON 解析失敗: {e}")
            except Exception as e:
                print(f"   ❌ 匯入失敗: {e}")
        else:
            print(f"   ⚠️ 找不到檔案: {filepath}")

    conn.close()

    print("\n" + "=" * 60)
    if total_laws > 0:
        print(f"✅ 匯入完成！使用檔案: {used_file}")
        print(f"   共匯入 {total_laws} 部法規")
    else:
        print("❌ 無法匯入法規，請檢查法規檔案是否存在")
        print("   預期路徑: ", LAW_BASE_PATH)
        print("   預期檔案: ", LAW_FILES)
    print("=" * 60)


if __name__ == "__main__":
    main()