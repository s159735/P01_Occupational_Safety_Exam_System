#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
法規 ASPX 完整提取器 v5.0
功能：從所有 ASPX 檔案中提取法規名稱和 PCode
支援：LawAll.aspx（單一法規）+ LawSearchLaw.aspx（法規列表）
輸出格式：{ PCode, LawName, LawURL }
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Set
from bs4 import BeautifulSoup


class LawListExtractor:
    """ASPX 法規清單完整提取器"""

    def __init__(self):
        self.laws = []
        self.pcode_set = set()
        self.stats = {"total": 0, "success": 0, "failed": 0, "skipped": 0}

    def extract_pcode_from_filename(self, filename: str) -> str:
        """從檔名提取 PCode"""
        match = re.search(r'pcode=([A-Z0-9]+)', filename)
        if match:
            return match.group(1)
        match = re.search(r'([A-Z][0-9]{7})', filename)
        if match:
            return match.group(1)
        return ""

    def extract_from_law_all(self, soup: BeautifulSoup, filename: str) -> Optional[Dict]:
        """從 LawAll.aspx 提取單一法規"""
        # 提取法規名稱
        law_name = None
        
        # 方法1：從法規名稱連結
        law_link = soup.find("a", {"id": "hlLawName"})
        if law_link:
            law_name = law_link.text.strip()
        
        # 方法2：從標題
        if not law_name:
            title = soup.find("title")
            if title:
                title_text = title.text.strip()
                if "-全國法規資料庫" in title_text:
                    title_text = title_text.replace("-全國法規資料庫", "").strip()
                if title_text and "中央法規" not in title_text:
                    law_name = title_text
        
        # 方法3：從 h2
        if not law_name:
            h2 = soup.find("h2")
            if h2:
                law_name = h2.text.strip()
                if "中央法規" in law_name:
                    law_name = None

        if not law_name:
            return None

        pcode = self.extract_pcode_from_filename(filename)
        if not pcode:
            return None

        return {
            "PCode": pcode,
            "LawName": law_name,
            "LawURL": f"https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode={pcode}"
        }

    def extract_from_search_page(self, soup: BeautifulSoup, filename: str) -> List[Dict]:
        """從 LawSearchLaw.aspx 提取法規列表"""
        laws = []
        
        # 尋找法規表格
        table = soup.find("table", {"class": "tab-list"})
        if not table:
            table = soup.find("table", {"class": "table table-hover tab-list tab-central"})
        if not table:
            return laws

        tbody = table.find("tbody")
        if not tbody:
            return laws

        rows = tbody.find_all("tr")
        for row in rows:
            try:
                # 提取 PCode（從 checkbox 的 span id）
                pcode = None
                checkbox_td = row.find("td")
                if checkbox_td:
                    span = checkbox_td.find("span")
                    if span:
                        pcode = span.get("id", "")
                    if not pcode:
                        # 嘗試從第二個 td 找 span
                        tds = row.find_all("td")
                        if len(tds) >= 2:
                            span = tds[1].find("span")
                            if span:
                                pcode = span.get("id", "")

                # 如果沒有找到 PCode，嘗試從連結提取
                if not pcode:
                    links = row.find_all("a")
                    for link in links:
                        href = link.get("href", "")
                        match = re.search(r'pcode=([A-Z0-9]+)', href)
                        if match:
                            pcode = match.group(1)
                            break

                # 提取法規名稱（最後一個 td）
                law_name = None
                tds = row.find_all("td")
                if tds:
                    name_td = tds[-1]
                    # 找法規連結
                    link = name_td.find("a", {"id": "hlkLawName"})
                    if link:
                        law_name = link.text.strip()
                    else:
                        # 直接取文字並清理
                        law_name = name_td.text.strip()
                        # 移除廢止標籤
                        for span in name_td.find_all("span", {"class": "label-fei"}):
                            law_name = law_name.replace(span.text.strip(), "").strip()
                        # 移除 EN 標籤
                        for span in name_td.find_all("span", {"class": "label-eng"}):
                            law_name = law_name.replace(span.text.strip(), "").strip()
                        # 移除附件圖標
                        for i in name_td.find_all("i"):
                            law_name = law_name.replace(i.text.strip(), "").strip()
                        # 移除 extra 文字
                        for span in name_td.find_all("span", {"class": "label-extra"}):
                            law_name = law_name.replace(span.text.strip(), "").strip()
                        # 清理多餘空白和括號內容（保留法規名稱）
                        law_name = re.sub(r'\s+', ' ', law_name).strip()
                        # 如果名稱包含 "("，只取括號前的部分
                        if "(" in law_name and "法" in law_name:
                            parts = law_name.split("(")
                            if parts:
                                law_name = parts[0].strip()

                # 驗證並加入
                if pcode and law_name and re.match(r'^[A-Z][0-9]{7}$', pcode):
                    # 檢查是否為重複
                    if pcode not in self.pcode_set:
                        laws.append({
                            "PCode": pcode,
                            "LawName": law_name,
                            "LawURL": f"https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode={pcode}"
                        })

            except Exception as e:
                continue

        return laws

    def extract_from_title(self, soup: BeautifulSoup, filename: str) -> Optional[Dict]:
        """從頁面標題提取（備用方法）"""
        title = soup.find("title")
        if not title:
            return None
        
        title_text = title.text.strip()
        if "-全國法規資料庫" in title_text:
            title_text = title_text.replace("-全國法規資料庫", "").strip()
        
        if not title_text or "中央法規" in title_text:
            return None

        pcode = self.extract_pcode_from_filename(filename)
        if not pcode:
            return None

        return {
            "PCode": pcode,
            "LawName": title_text,
            "LawURL": f"https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode={pcode}"
        }

    def parse_aspx_file(self, file_path: str) -> List[Dict]:
        """解析單一 ASPX 檔案"""
        file_path = Path(file_path)
        filename = file_path.name
        laws = []

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            soup = BeautifulSoup(content, "html.parser")

            # 判斷檔案類型
            if "LawAll" in filename:
                # 法規頁面
                law = self.extract_from_law_all(soup, filename)
                if law:
                    print(f"  ✅ {law['LawName']} ({law['PCode']})")
                    self.stats["success"] += 1
                    return [law]
                else:
                    # 嘗試從標題提取
                    law = self.extract_from_title(soup, filename)
                    if law:
                        print(f"  ✅ {law['LawName']} ({law['PCode']})")
                        self.stats["success"] += 1
                        return [law]

            elif "LawSearchLaw" in filename:
                # 搜尋頁面
                laws = self.extract_from_search_page(soup, filename)
                if laws:
                    print(f"  ✅ {filename} - 提取 {len(laws)} 筆法規")
                    self.stats["success"] += len(laws)
                    return laws
                else:
                    # 嘗試從標題提取
                    law = self.extract_from_title(soup, filename)
                    if law:
                        print(f"  ✅ {law['LawName']} ({law['PCode']})")
                        self.stats["success"] += 1
                        return [law]

            else:
                # 其他類型，嘗試從標題提取
                law = self.extract_from_title(soup, filename)
                if law:
                    print(f"  ✅ {law['LawName']} ({law['PCode']})")
                    self.stats["success"] += 1
                    return [law]

            print(f"  ⚠️ 無法提取: {filename}")
            self.stats["skipped"] += 1
            return []

        except Exception as e:
            print(f"  ❌ 解析失敗 {filename}: {e}")
            self.stats["failed"] += 1
            return []

    def process_directory(self, dir_path: str, output_file: str):
        """處理目錄中的所有 ASPX 檔案"""
        dir_path = Path(dir_path)
        if not dir_path.exists():
            print(f"❌ 目錄不存在: {dir_path}")
            return

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        aspx_files = list(dir_path.glob("*.aspx"))
        print(f"📁 找到 {len(aspx_files)} 個 ASPX 檔案\n")

        if not aspx_files:
            print("⚠️ 沒有找到任何 ASPX 檔案")
            return

        self.stats["total"] = len(aspx_files)

        # 處理每個檔案
        for file_path in aspx_files:
            print(f"📄 處理: {file_path.name}")
            laws = self.parse_aspx_file(str(file_path))
            
            for law in laws:
                pcode = law.get("PCode")
                if pcode and pcode not in self.pcode_set:
                    self.pcode_set.add(pcode)
                    self.laws.append(law)

        # 依 PCode 排序
        self.laws.sort(key=lambda x: x.get("PCode", ""))

        # 生成輸出
        self.generate_output(output_file)

    def generate_output(self, output_file: str):
        """生成 JSON 輸出"""
        output = {
            "UpdateDate": datetime.now().strftime("%Y-%m-%d"),
            "Version": "1.0",
            "TotalLaws": len(self.laws),
            "Laws": self.laws
        }

        output_path = Path(output_file)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print("\n" + "=" * 60)
        print(f"📊 處理完成！")
        print(f"   📁 輸入檔案: {self.stats['total']} 個")
        print(f"   ✅ 成功提取: {self.stats['success']} 筆法規")
        print(f"   ❌ 失敗: {self.stats['failed']}")
        print(f"   ⏭️ 跳過: {self.stats['skipped']}")
        print(f"   📊 去重後總法規: {len(self.laws)}")
        print(f"   📁 輸出: {output_path.absolute()}")
        print("=" * 60)

    def export_to_csv(self, output_file: str):
        """匯出法規清單為 CSV"""
        import csv

        with open(output_file, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["序號", "PCode", "法規名稱", "連結"])

            for idx, law in enumerate(self.laws, 1):
                writer.writerow([
                    idx,
                    law.get("PCode", ""),
                    law.get("LawName", ""),
                    law.get("LawURL", "")
                ])

        print(f"   📊 CSV 輸出: {output_file}")


# ============================================================================
# 主程式
# ============================================================================

if __name__ == "__main__":
    SCRIPT_DIR = Path(__file__).parent.absolute()

    INPUT_DIR = SCRIPT_DIR / "20260709220422584"
    OUTPUT_FILE = SCRIPT_DIR / "職安衛法規清單.json"
    CSV_FILE = SCRIPT_DIR / "法規清單.csv"

    print("=" * 60)
    print("  法規清單完整提取器 v5.0")
    print("  從 44 個檔案提取法規名稱 + PCode")
    print("=" * 60)
    print(f"\n📂 輸入目錄: {INPUT_DIR}")
    print(f"📁 輸出檔案: {OUTPUT_FILE}")

    extractor = LawListExtractor()
    extractor.process_directory(str(INPUT_DIR), str(OUTPUT_FILE))

    if extractor.laws:
        extractor.export_to_csv(str(CSV_FILE))