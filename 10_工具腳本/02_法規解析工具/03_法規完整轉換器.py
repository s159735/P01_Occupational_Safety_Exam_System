#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
法規完整轉換器 v6.0
功能：
  1. 讀取 TXT 法規檔案（已從 RTF 轉換）
  2. 解析條、項、款、目 → StructuredContent
  3. 自動對應 PCode（從檔名或對照表）
  4. 產出符合系統規範的 ChLaw_完整版.json
執行：python 03_法規完整轉換器.py
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Any


class LawParser:
    """法規條文解析器 - 支援條/項/款/目結構化"""

    def __init__(self):
        self.laws = []
        self.stats = {"total": 0, "success": 0, "failed": 0, "empty": 0}

    def normalize_article_no(self, text: str) -> str:
        """標準化條號格式"""
        if not text:
            return ""
        text = text.strip()
        # 第 X 條之 Y → 第 X-Y 條
        match = re.search(r'第\s*(\d+)\s*條\s*之\s*(\d+)', text)
        if match:
            return f"第 {match.group(1)}-{match.group(2)} 條"
        # 第 X 條
        match = re.search(r'第\s*(\d+)\s*條', text)
        if match:
            return f"第 {match.group(1)} 條"
        # 第 X 章
        match = re.search(r'第\s*([一二三四五六七八九十百千]+)\s*章', text)
        if match:
            return f"第 {match.group(1)} 章"
        return text

    def detect_article_type(self, text: str) -> str:
        """判斷條文類型：A=條文，C=章節"""
        if re.search(r'第\s*[一二三四五六七八九十百千]+\s*章', text):
            return "C"
        if re.search(r'第\s*\d+\s*條', text):
            return "A"
        return "A"

    def parse_structured_content(self, content: str) -> List[Dict]:
        """
        解析條文內容，產出 StructuredContent
        支援：項（換行）、款（一、二、三）、目（(一)、(二)）
        """
        if not content or not content.strip():
            return []

        lines = content.strip().split('\n')
        result = []
        current_item = 1
        current_item_content = []
        current_item_fonts = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # 檢查是否為「款」（一、二、三...）
            font_match = re.match(r'^([一二三四五六七八九十百千]+)[、.)）]\s*(.*)', line)
            if font_match:
                # 儲存前一項
                if current_item_content or current_item_fonts:
                    result.append({
                        "項": current_item,
                        "content": "".join(current_item_content).strip(),
                        "款": current_item_fonts if current_item_fonts else None
                    })
                    current_item += 1
                    current_item_content = []
                    current_item_fonts = []

                font_no = font_match.group(1)
                font_content = font_match.group(2).strip()

                # 檢查是否為「目」（(一)、(二) ...）
                mu_match = re.match(r'^[（(]\s*([一二三四五六七八九十百千]+)\s*[）)]\s*(.*)', font_content)
                if mu_match:
                    # 有目，建立款結構
                    mu_no = f"({mu_match.group(1)})"
                    mu_content = mu_match.group(2).strip()
                    current_item_fonts.append({
                        "編號": font_no,
                        "content": "",
                        "目": [{"編號": mu_no, "content": mu_content}]
                    })
                else:
                    # 普通款
                    current_item_fonts.append({
                        "編號": font_no,
                        "content": font_content,
                        "目": None
                    })
                continue

            # 檢查是否為「目」（(一)、(二) ...）
            mu_match = re.match(r'^[（(]\s*([一二三四五六七八九十百千]+)\s*[）)]\s*(.*)', line)
            if mu_match and current_item_fonts:
                mu_no = f"({mu_match.group(1)})"
                mu_content = mu_match.group(2).strip()
                # 加到最後一個款底下
                if current_item_fonts:
                    last_font = current_item_fonts[-1]
                    if last_font.get("目") is None:
                        last_font["目"] = []
                    last_font["目"].append({
                        "編號": mu_no,
                        "content": mu_content
                    })
                continue

            # 一般內容（屬於當前項）
            current_item_content.append(line + " ")

        # 儲存最後一項
        if current_item_content or current_item_fonts:
            result.append({
                "項": current_item,
                "content": "".join(current_item_content).strip(),
                "款": current_item_fonts if current_item_fonts else None
            })

        return result

    def parse_txt_file(self, file_path: Path) -> Optional[Dict]:
        """解析單一 TXT 檔案"""
        try:
            content = file_path.read_text(encoding='utf-8')
            if not content or len(content.strip()) < 10:
                self.stats["empty"] += 1
                return None

            lines = content.split('\n')
            law_name = file_path.stem

            # 先找法規名稱（可能第一行是名稱）
            first_line = lines[0].strip() if lines else ""
            if first_line and len(first_line) < 50 and not re.search(r'第.*[條章]', first_line):
                law_name = first_line
                lines = lines[1:]

            # 解析條文
            articles = []
            current_title = ""
            current_content = []

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # 檢查是否為條號或章節
                is_article = re.match(r'^第\s*(\d+)\s*條', line)
                is_chapter = re.match(r'^第\s*[一二三四五六七八九十百千]+\s*章', line)

                if is_article or is_chapter:
                    # 儲存前一條
                    if current_title:
                        articles.append({
                            "ArticleType": self.detect_article_type(current_title),
                            "ArticleNo": self.normalize_article_no(current_title),
                            "ArticleContent": "\n".join(current_content).strip(),
                            "StructuredContent": self.parse_structured_content("\n".join(current_content))
                        })
                    current_title = line
                    current_content = []
                else:
                    current_content.append(line)

            # 儲存最後一條
            if current_title:
                articles.append({
                    "ArticleType": self.detect_article_type(current_title),
                    "ArticleNo": self.normalize_article_no(current_title),
                    "ArticleContent": "\n".join(current_content).strip(),
                    "StructuredContent": self.parse_structured_content("\n".join(current_content))
                })

            if not articles:
                self.stats["empty"] += 1
                return None

            # 提取 PCode（從檔名）
            pcode = ""
            match = re.search(r'([A-Z][0-9]{7})', file_path.name)
            if match:
                pcode = match.group(1)

            return {
                "PCode": pcode,
                "LawName": law_name,
                "LawDisplayName": law_name,
                "LawLevel": "法規命令",
                "LawCategory": "行政＞勞動部＞職業安全衛生目",
                "LawURL": f"https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode={pcode}" if pcode else "",
                "LawModifiedDate": "",
                "LawEffectiveStatus": "現行有效",
                "LawEffectiveNote": "",
                "LawEffectiveDate": "",
                "LawAbandonNote": "",
                "LawHistories": "",
                "LawForeword": "",
                "LawAttachements": [],
                "LawOriginalArticles": [],
                "LawNewEffectiveDate": "",
                "ComplianceNote": "",
                "PendingArticles": [],
                "LawArticles": articles
            }

        except Exception as e:
            self.stats["failed"] += 1
            print(f"  ❌ 解析失敗: {file_path.name} - {e}")
            return None

    def process_directory(self, input_dir: Path, output_file: Path):
        """處理整個目錄的 TXT 檔案"""
        if not input_dir.exists():
            print(f"❌ 目錄不存在: {input_dir}")
            return

        txt_files = list(input_dir.glob("*.txt"))
        self.stats["total"] = len(txt_files)

        print(f"📁 找到 {len(txt_files)} 個 TXT 檔案\n")

        for file_path in txt_files:
            print(f"📄 處理: {file_path.name}")
            law = self.parse_txt_file(file_path)
            if law:
                self.laws.append(law)
                self.stats["success"] += 1
                article_count = len(law["LawArticles"])
                print(f"  ✅ 提取 {article_count} 條")

        # 依 PCode 排序（無 PCode 的放最後）
        self.laws.sort(key=lambda x: (x.get("PCode", "Z"), x.get("LawName", "")))

        # 生成輸出
        self.generate_output(output_file)

    def generate_output(self, output_file: Path):
        """產出最終 JSON"""
        output = {
            "UpdateDate": datetime.now().strftime("%Y-%m-%d"),
            "Version": "6.0",
            "TotalLaws": len(self.laws),
            "PendingLaws": 0,
            "Laws": self.laws
        }

        output_file.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')

        print("\n" + "=" * 60)
        print("✅ 轉換完成！")
        print("=" * 60)
        print(f"📊 總計: {self.stats['total']} 個檔案")
        print(f"✅ 成功: {self.stats['success']} 部法規")
        print(f"📄 條文總數: {sum(len(l['LawArticles']) for l in self.laws)} 條")
        print(f"❌ 失敗: {self.stats['failed']} 個")
        print(f"📁 輸出: {output_file.absolute()}")
        print("=" * 60)


# ============================================================================
# 主程式
# ============================================================================

if __name__ == "__main__":
    # 設定路徑
    SCRIPT_DIR = Path(__file__).parent.absolute()
    PROJECT_ROOT = SCRIPT_DIR.parent.parent  # 回到 P01 根目錄

    INPUT_DIR = PROJECT_ROOT / "10_資料庫" / "07_法規資料庫" / "20260709220422584"
    OUTPUT_FILE = PROJECT_ROOT / "10_資料庫" / "07_法規資料庫" / "ChLaw_完整版.json"
    BACKUP_FILE = PROJECT_ROOT / "10_資料庫" / "07_法規資料庫" / "ChLaw_完整版_備份.json"

    print("=" * 60)
    print("  法規完整轉換器 v6.0")
    print("  輸入: TXT 檔案 → 輸出: 完整 JSON (含 StructuredContent)")
    print("=" * 60)
    print(f"\n📂 輸入目錄: {INPUT_DIR}")
    print(f"📁 輸出檔案: {OUTPUT_FILE}")

    # 備份現有檔案
    if OUTPUT_FILE.exists():
        import shutil
        shutil.copy2(OUTPUT_FILE, BACKUP_FILE)
        print(f"💾 已備份: {BACKUP_FILE}")

    parser = LawParser()
    parser.process_directory(INPUT_DIR, OUTPUT_FILE)