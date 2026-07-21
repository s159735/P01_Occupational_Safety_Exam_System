#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
📚 法規資料庫整合優化器 v10.2.0
功能：以舊版 ChLaw_完整版.json 為基礎，整合 A/B/C/D 的條文，優化格式
輸出：符合 8 大題型 + 智慧化解析引擎格式的 ChLaw_完整版.json

三大系統格式對應：
    題庫 law.pcode      ←→  法規 PCode（首要鍵值）
    題庫 law.name       ←→  法規 LawName（次要鍵值）
    題庫 law.article.條 ←→  法規 ArticleNo
    題庫 law.article.項 ←→  法規 StructuredContent[].level="項"
    題庫 law.article.款 ←→  法規 subItems[].level="款"
    智慧化解析引擎      ←→  法規 LawArticles + StructuredContent
"""

import json
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Set
from collections import defaultdict

# ============================================================
# 🎯 設定區
# ============================================================

BASE_PATH = r"C:\Users\EasonC\Desktop\乙級職安衛模擬測驗系統\P01_Occupational_Safety_Exam_System\06_資料庫\07_法規資料庫"

CONFIG = {
    # 基礎檔案（舊版完整版，34MB，930部法規，26,682條條文）
    "BASE_FILE": os.path.join(BASE_PATH, "ChLaw_完整版.json"),
    
    # 整合來源（A/B/C/D）
    "SOURCE_FILES": [
        os.path.join(BASE_PATH, "ChLaw_完整版A.json"),
        os.path.join(BASE_PATH, "ChLaw_完整版B.json"),
        os.path.join(BASE_PATH, "ChLaw_完整版C.json"),
        os.path.join(BASE_PATH, "ChLaw_完整版D.json"),
    ],
    
    # 法規清單（補充全國法規索引）
    "NATIONAL_CSV": os.path.join(BASE_PATH, "法規清單.csv"),
    
    # 輸出
    "OUTPUT_DIR": BASE_PATH,
    "OUTPUT_FILE": "ChLaw_完整版.json",
}


class LawDatabaseOptimizer:
    def __init__(self, config: Dict):
        self.config = config
        self.base_file = Path(config["BASE_FILE"])
        self.source_files = [Path(f) for f in config["SOURCE_FILES"]]
        self.national_csv = Path(config["NATIONAL_CSV"])
        self.output_dir = Path(config["OUTPUT_DIR"])
        self.output_file = config["OUTPUT_FILE"]
        
        # 資料儲存
        self.base_laws: Dict[str, Dict] = {}      # 基礎法規（舊版完整版）
        self.source_laws: Dict[str, Dict] = {}    # 從 A/B/C/D 提取的條文
        self.national_index: Dict[str, Dict] = {} # 全國法規索引
        self.merged_laws: Dict[str, Dict] = {}    # 最終合併結果
        
        # 統計
        self.stats = {
            "base_count": 0,
            "base_articles": 0,
            "source_count": 0,
            "source_articles": 0,
            "national_count": 0,
            "merged_count": 0,
            "merged_articles": 0,
            "pcode_fixed": 0,
            "errors": [],
            "warnings": [],
        }
        
        # 分類統計
        self.category_stats: Dict[str, int] = defaultdict(int)
        self.level_stats: Dict[str, int] = defaultdict(int)
    
    # ============================================================
    # 1. 載入基礎法規（舊版完整版）
    # ============================================================
    
    def load_base_file(self) -> bool:
        """載入舊版 ChLaw_完整版.json（34MB，930部法規）"""
        if not self.base_file.exists():
            self.stats["errors"].append(f"找不到基礎檔案: {self.base_file}")
            return False
        
        print(f"\n📂 載入基礎法規資料庫...")
        print(f"   📄 {self.base_file.name} ({self.base_file.stat().st_size / 1024 / 1024:.2f} MB)")
        
        try:
            with open(self.base_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            laws = data.get("Laws", [])
            for law in laws:
                pcode = law.get("PCode", "")
                if not pcode:
                    continue
                self.base_laws[pcode] = law
                self.stats["base_count"] += 1
                self.stats["base_articles"] += len(law.get("LawArticles", []))
            
            print(f"   ✅ 載入 {self.stats['base_count']} 部法規")
            print(f"   📖 條文數: {self.stats['base_articles']}")
            return True
            
        except Exception as e:
            self.stats["errors"].append(f"載入基礎檔案失敗: {str(e)}")
            return False
    
    # ============================================================
    # 2. 載入 A/B/C/D 條文
    # ============================================================
    
    def load_source_files(self) -> bool:
        """載入 ChLaw_完整版A/B/C/D.json 的條文"""
        print(f"\n📂 載入條文來源檔案...")
        
        loaded_count = 0
        for file_path in self.source_files:
            if not file_path.exists():
                self.stats["warnings"].append(f"檔案不存在: {file_path.name}")
                continue
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                laws = data.get("Laws", [])
                file_articles = 0
                for law in laws:
                    pcode = law.get("PCode", "")
                    if not pcode:
                        continue
                    
                    articles = law.get("LawArticles", [])
                    if articles:
                        if pcode in self.source_laws:
                            # 合併條文（去重）
                            existing = self.source_laws[pcode]
                            existing_articles = existing.get("LawArticles", [])
                            existing_nos = {a.get("ArticleNo", "") for a in existing_articles}
                            for article in articles:
                                if article.get("ArticleNo") and article["ArticleNo"] not in existing_nos:
                                    existing_articles.append(article)
                                    existing_nos.add(article["ArticleNo"])
                        else:
                            self.source_laws[pcode] = {
                                "PCode": pcode,
                                "LawName": law.get("LawName", law.get("name", pcode)),
                                "LawArticles": articles.copy(),
                                "LawSummary": law.get("LawSummary", law.get("summary", "")),
                                "LawTopics": law.get("LawTopics", law.get("topics", [])),
                            }
                        file_articles += len(articles)
                        loaded_count += 1
                
                print(f"   ✅ {file_path.name}: {len(laws)} 部法規, {file_articles} 條條文")
                
            except Exception as e:
                self.stats["errors"].append(f"讀取 {file_path.name} 失敗: {str(e)}")
        
        self.stats["source_count"] = len(self.source_laws)
        self.stats["source_articles"] = sum(len(l.get("LawArticles", [])) for l in self.source_laws.values())
        
        print(f"\n   ✅ 共載入 {self.stats['source_count']} 部法規條文")
        print(f"   📖 總條文數: {self.stats['source_articles']}")
        
        return True
    
    # ============================================================
    # 3. 載入全國法規索引（補充）
    # ============================================================
    
    def load_national_csv(self) -> bool:
        """載入法規清單.csv 補充索引"""
        if not self.national_csv.exists():
            self.stats["warnings"].append(f"找不到全國法規清單: {self.national_csv}")
            return False
        
        print(f"\n📂 載入全國法規索引...")
        
        try:
            import csv
            with open(self.national_csv, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    pcode = row.get("PCode", "").strip()
                    if not pcode:
                        continue
                    
                    law_name = row.get("法規名稱", "").strip() or pcode
                    law_url = row.get("連結", "").strip()
                    
                    self.national_index[pcode] = {
                        "PCode": pcode,
                        "LawName": law_name,
                        "LawDisplayName": law_name,
                        "LawURL": law_url,
                        "Category": self._detect_category(pcode, law_name),
                    }
                    self.stats["national_count"] += 1
            
            print(f"   ✅ 載入 {self.stats['national_count']} 部法規索引")
            return True
            
        except Exception as e:
            self.stats["errors"].append(f"讀取全國法規清單失敗: {str(e)}")
            return False
    
    def _detect_category(self, pcode: str, law_name: str) -> str:
        """根據 PCode 判斷分類"""
        prefix_map = {
            "A": "憲法/綜合性法律",
            "B": "民事/商事法",
            "C": "刑事法",
            "D": "內政/營建/消防",
            "E": "外交/領務",
            "F": "國防/動員",
            "G": "財政/稅務",
            "H": "教育/文化",
            "I": "司法/法務",
            "J": "經濟/商業/產業",
            "K": "交通/通訊",
            "L": "衛生/社會福利",
            "M": "農業/農田水利",
            "N": "勞動法規",
            "O": "環境保護",
            "P": "科學/技術",
            "Q": "兩岸/港澳",
            "S": "公共工程",
        }
        first = pcode[0] if pcode else "Z"
        return prefix_map.get(first, "其他")
    
    # ============================================================
    # 4. 合併與優化
    # ============================================================
    
    def merge_and_optimize(self):
        """合併並優化格式"""
        print(f"\n🔗 合併與優化法規資料庫...")
        
        # 步驟 1：以基礎法規為起點
        for pcode, law in self.base_laws.items():
            self.merged_laws[pcode] = law.copy()
        
        # 步驟 2：從 A/B/C/D 補充條文
        for pcode, source_law in self.source_laws.items():
            if pcode in self.merged_laws:
                # 補充條文
                existing_articles = self.merged_laws[pcode].get("LawArticles", [])
                new_articles = source_law.get("LawArticles", [])
                
                if new_articles:
                    # 合併條文（去重）
                    existing_nos = {a.get("ArticleNo", "") for a in existing_articles}
                    for article in new_articles:
                        if article.get("ArticleNo") and article["ArticleNo"] not in existing_nos:
                            existing_articles.append(article)
                            existing_nos.add(article["ArticleNo"])
                    
                    self.merged_laws[pcode]["LawArticles"] = existing_articles
                
                # 補充摘要和主題
                if source_law.get("LawSummary") and not self.merged_laws[pcode].get("LawSummary"):
                    self.merged_laws[pcode]["LawSummary"] = source_law["LawSummary"]
                if source_law.get("LawTopics") and not self.merged_laws[pcode].get("LawTopics"):
                    self.merged_laws[pcode]["LawTopics"] = source_law["LawTopics"]
            else:
                # 基礎中沒有，直接新增
                self.merged_laws[pcode] = source_law.copy()
        
        # 步驟 3：從全國法規索引補充缺失的法規
        for pcode, national_law in self.national_index.items():
            if pcode not in self.merged_laws:
                self.merged_laws[pcode] = {
                    "PCode": pcode,
                    "LawName": national_law.get("LawName", pcode),
                    "LawDisplayName": national_law.get("LawDisplayName", pcode),
                    "LawLevel": self._detect_law_level(pcode),
                    "LawCategory": "",
                    "LawURL": national_law.get("LawURL", ""),
                    "LawSummary": "",
                    "LawTopics": [],
                    "Category": national_law.get("Category", "其他"),
                    "LawArticles": [],
                }
        
        self.stats["merged_count"] = len(self.merged_laws)
        self.stats["merged_articles"] = sum(len(l.get("LawArticles", [])) for l in self.merged_laws.values())
        
        print(f"   ✅ 合併後: {self.stats['merged_count']} 部法規")
        print(f"   📖 總條文數: {self.stats['merged_articles']}")
        
        # 統計分類
        for law in self.merged_laws.values():
            category = law.get("Category", "未分類")
            self.category_stats[category] += 1
            level = law.get("LawLevel", "未知")
            self.level_stats[level] += 1
    
    def _detect_law_level(self, pcode: str) -> str:
        if not pcode:
            return "法律"
        if pcode.endswith("0001") or pcode.endswith("0002"):
            return "法律"
        return "法規命令"
    
    # ============================================================
    # 5. 優化條文格式（符合智慧化解析引擎）
    # ============================================================
    
    def optimize_articles(self):
        """優化條文格式，確保符合智慧化解析引擎"""
        print(f"\n🔧 優化條文格式...")
        
        optimized_count = 0
        for pcode, law in self.merged_laws.items():
            articles = law.get("LawArticles", [])
            if not articles:
                continue
            
            optimized = []
            for article in articles:
                if not isinstance(article, dict):
                    continue
                
                # 確保必要欄位存在
                if not article.get("ArticleNo"):
                    continue
                
                # 確保 StructuredContent 存在
                if not article.get("StructuredContent"):
                    if article.get("ArticleContent"):
                        article["StructuredContent"] = [{
                            "level": "項",
                            "number": "1",
                            "content": article["ArticleContent"],
                            "subItems": [],
                        }]
                    else:
                        article["StructuredContent"] = []
                
                # 確保 ArticleContent 存在
                if not article.get("ArticleContent") and article.get("StructuredContent"):
                    article["ArticleContent"] = article["StructuredContent"][0].get("content", "")
                
                # 確保 tags 和 keywords 存在
                if not article.get("tags"):
                    article["tags"] = []
                if not article.get("keywords"):
                    article["keywords"] = []
                
                optimized.append(article)
            
            if optimized:
                law["LawArticles"] = optimized
                optimized_count += 1
        
        print(f"   ✅ 優化 {optimized_count} 部法規的條文格式")
    
    # ============================================================
    # 6. 儲存
    # ============================================================
    
    def save(self) -> bool:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        output_path = self.output_dir / self.output_file
        
        # 備份
        if output_path.exists():
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = output_path.with_suffix(f".json.backup_{timestamp}")
            shutil.copy2(output_path, backup_path)
            print(f"   📦 已備份: {backup_path.name}")
        
        # 排序
        all_laws = list(self.merged_laws.values())
        all_laws.sort(key=lambda x: x.get("PCode", ""))
        
        # 建構最終資料庫
        database = {
            "UpdateDate": datetime.now().strftime("%Y-%m-%d"),
            "Version": "10.2.0",
            "TotalLaws": len(all_laws),
            "TotalArticles": self.stats["merged_articles"],
            "Description": "法規資料庫完整版 - 整合舊版完整版 + A/B/C/D + 全國法規索引",
            "Statistics": {
                "by_category": dict(self.category_stats),
                "by_level": dict(self.level_stats),
            },
            "SourceFiles": [
                "ChLaw_完整版.json (基礎)",
                "ChLaw_完整版A.json",
                "ChLaw_完整版B.json",
                "ChLaw_完整版C.json",
                "ChLaw_完整版D.json",
                "法規清單.csv"
            ],
            "Laws": all_laws,
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(database, f, ensure_ascii=False, indent=2)
        
        file_size = output_path.stat().st_size / 1024 / 1024
        print(f"\n💾 已儲存: {output_path}")
        print(f"   📚 總法規數: {len(all_laws)}")
        print(f"   📖 總條文數: {self.stats['merged_articles']}")
        print(f"   💾 檔案大小: {file_size:.2f} MB")
        
        return True
    
    # ============================================================
    # 7. 報告
    # ============================================================
    
    def print_report(self):
        print("\n" + "=" * 70)
        print("📊 執行報告")
        print("=" * 70)
        print(f"   📋 基礎法規: {self.stats['base_count']} 部, {self.stats['base_articles']} 條條文")
        print(f"   📋 來源 A/B/C/D: {self.stats['source_count']} 部, {self.stats['source_articles']} 條條文")
        print(f"   📋 全國法規索引: {self.stats['national_count']} 部")
        print(f"   ✅ 合併後總數: {self.stats['merged_count']} 部")
        print(f"   📖 總條文數: {self.stats['merged_articles']}")
        
        print("\n   📊 分類統計（前 10）:")
        for cat, count in sorted(self.category_stats.items(), key=lambda x: -x[1])[:10]:
            print(f"      - {cat}: {count} 部")
        
        print("\n   📊 層級統計:")
        for level, count in sorted(self.level_stats.items(), key=lambda x: -x[1]):
            print(f"      - {level}: {count} 部")
        
        if self.stats["warnings"]:
            print(f"\n   ⚠️  警告 ({len(self.stats['warnings'])} 筆):")
            for w in self.stats["warnings"][:5]:
                print(f"      - {w}")
        
        if self.stats["errors"]:
            print(f"\n   ❌ 錯誤 ({len(self.stats['errors'])} 筆):")
            for e in self.stats["errors"]:
                print(f"      - {e}")
        
        print("=" * 70)
    
    # ============================================================
    # 8. 執行
    # ============================================================
    
    def run(self):
        print("\n" + "=" * 70)
        print("📚 法規資料庫整合優化器 v10.2.0")
        print("📌 三大系統格式對應: 題庫 + 法規 + 智慧化解析引擎")
        print("📌 整合: 舊版完整版 + A/B/C/D + 全國法規索引")
        print("=" * 70)
        print(f"\n📂 工作目錄: {self.output_dir}")
        
        # 1. 載入基礎法規
        if not self.load_base_file():
            print("❌ 無法載入基礎法規！")
            return
        
        # 2. 載入 A/B/C/D
        self.load_source_files()
        
        # 3. 載入全國法規索引
        self.load_national_csv()
        
        # 4. 合併與優化
        if self.base_laws:
            self.merge_and_optimize()
            self.optimize_articles()
            self.save()
        else:
            print("\n❌ 沒有可用的法規資料！")
            return
        
        # 5. 報告
        self.print_report()
        
        print("\n✅ 法規資料庫整合優化完成！")


if __name__ == "__main__":
    try:
        optimizer = LawDatabaseOptimizer(CONFIG)
        optimizer.run()
    except KeyboardInterrupt:
        print("\n\n⏹️ 使用者中斷")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 發生錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)