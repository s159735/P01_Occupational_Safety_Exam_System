#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PCode 回填工具 v1.0
功能：從法規清單.csv 比對法規名稱，回填 PCode 到 ChLaw_完整版.json
執行：python 04_回填PCode.py
"""

import json
import csv
import re
from pathlib import Path
from typing import Dict, Optional


class PCodeBackfiller:
    """PCode 回填器"""

    def __init__(self):
        self.pcode_map = {}  # 法規名稱 → PCode
        self.match_stats = {"total": 0, "matched": 0, "unmatched": 0}

    def load_csv(self, csv_path: Path):
        """載入法規清單 CSV"""
        print(f"📂 載入 CSV: {csv_path}")

        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            header = next(reader)  # 跳過標題列

            for row in reader:
                if len(row) >= 3:
                    pcode = row[1].strip()
                    law_name = row[2].strip()
                    if pcode and law_name:
                        self.pcode_map[law_name] = pcode

        print(f"   ✅ 載入 {len(self.pcode_map)} 筆 PCode 對照")

    def normalize_name(self, name: str) -> str:
        """標準化法規名稱（用於比對）"""
        if not name:
            return ""
        # 移除多餘空白
        name = re.sub(r'\s+', ' ', name).strip()
        # 移除備註（如（111.03.31訂定））
        name = re.sub(r'[（(]\s*\d+\.\d+\.\d+.*?[）)]', '', name)
        name = re.sub(r'[（(].*?訂定.*?[）)]', '', name)
        name = re.sub(r'[（(].*?修正.*?[）)]', '', name)
        name = re.sub(r'[（(].*?公告.*?[）)]', '', name)
        # 移除版本標示
        name = re.sub(r'（新\s*\d+\.\d+\.\d+\s*訂定）', '', name)
        name = re.sub(r'（\d+\.\d+\.\d+\s*訂定）', '', name)
        # 移除多餘空白
        name = re.sub(r'\s+', ' ', name).strip()
        return name

    def match_pcode(self, law_name: str) -> Optional[str]:
        """比對法規名稱，回傳 PCode"""
        if not law_name:
            return None

        # 1. 精確比對
        if law_name in self.pcode_map:
            return self.pcode_map[law_name]

        # 2. 標準化後比對
        normalized = self.normalize_name(law_name)
        if normalized in self.pcode_map:
            return self.pcode_map[normalized]

        # 3. 反過來：用 map 的 key 去比對
        for csv_name, pcode in self.pcode_map.items():
            csv_normalized = self.normalize_name(csv_name)
            if csv_normalized == normalized:
                return pcode

        # 4. 部分比對（包含）
        for csv_name, pcode in self.pcode_map.items():
            if csv_name in law_name or law_name in csv_name:
                return pcode

        # 5. 部分比對（標準化後）
        for csv_name, pcode in self.pcode_map.items():
            csv_normalized = self.normalize_name(csv_name)
            if csv_normalized in normalized or normalized in csv_normalized:
                return pcode

        return None

    def process_json(self, json_path: Path, output_path: Path):
        """處理 JSON 檔案，回填 PCode"""
        print(f"\n📂 載入 JSON: {json_path}")

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.match_stats["total"] = len(data.get("Laws", []))

        print(f"   📊 法規總數: {self.match_stats['total']}")

        matched_count = 0
        unmatched_list = []

        for law in data.get("Laws", []):
            law_name = law.get("LawName", "")
            current_pcode = law.get("PCode", "")

            # 如果已有 PCode 且不為空，跳過
            if current_pcode:
                matched_count += 1
                continue

            # 比對 PCode
            pcode = self.match_pcode(law_name)

            if pcode:
                law["PCode"] = pcode
                # 同時更新 LawURL
                law["LawURL"] = f"https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode={pcode}"
                matched_count += 1
                print(f"   ✅ {law_name} → {pcode}")
            else:
                unmatched_list.append(law_name)

        self.match_stats["matched"] = matched_count
        self.match_stats["unmatched"] = len(unmatched_list)

        # 儲存結果
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\n💾 已儲存: {output_path}")

        # 輸出統計
        print("\n" + "=" * 60)
        print("📊 PCode 回填統計")
        print("=" * 60)
        print(f"   📊 法規總數: {self.match_stats['total']}")
        print(f"   ✅ 已匹配: {self.match_stats['matched']}")
        print(f"   ⚠️ 未匹配: {self.match_stats['unmatched']}")

        if unmatched_list:
            print("\n⚠️ 未匹配的法規（請手動檢查）：")
            for name in unmatched_list[:20]:  # 只顯示前 20 筆
                print(f"   - {name}")
            if len(unmatched_list) > 20:
                print(f"   ... 還有 {len(unmatched_list) - 20} 筆")

        print("=" * 60)


# ============================================================================
# 主程式
# ============================================================================

if __name__ == "__main__":
    SCRIPT_DIR = Path(__file__).parent.absolute()
    PROJECT_ROOT = SCRIPT_DIR.parent.parent

    CSV_PATH = PROJECT_ROOT / "10_資料庫" / "07_法規資料庫" / "法規清單.csv"
    JSON_PATH = PROJECT_ROOT / "10_資料庫" / "07_法規資料庫" / "ChLaw_完整版.json"
    OUTPUT_PATH = PROJECT_ROOT / "10_資料庫" / "07_法規資料庫" / "ChLaw_完整版.json"

    print("=" * 60)
    print("  PCode 回填工具 v1.0")
    print("=" * 60)

    if not CSV_PATH.exists():
        print(f"❌ 找不到 CSV: {CSV_PATH}")
        exit(1)

    if not JSON_PATH.exists():
        print(f"❌ 找不到 JSON: {JSON_PATH}")
        exit(1)

    # 備份
    backup_path = JSON_PATH.with_suffix(".json.backup")
    import shutil
    shutil.copy2(JSON_PATH, backup_path)
    print(f"💾 已備份: {backup_path}")

    backfiller = PCodeBackfiller()
    backfiller.load_csv(CSV_PATH)
    backfiller.process_json(JSON_PATH, OUTPUT_PATH)

    print("\n✅ PCode 回填完成！")