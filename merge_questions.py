#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================
# 📚 智慧化題庫合併器 v10.1.0
# ============================================================

import json
import os
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# ============================================================
# 🎯 設定區（根據您實際的目錄結構）
# ============================================================

CONFIG = {
    # 輸入目錄：題庫檔案位置（根據您的實際結構調整）
    # 請確認題庫檔案在哪個資料夾
    "INPUT_DIR": "./06_資料庫/03_分類題庫",  # ← 改為有底線的版本
    
    # 輸出目錄：合併後輸出位置
    "OUTPUT_DIR": "./06_資料庫/06_完整題庫",  # ← 改為有底線的版本
    
    # 各題型 ID 起始編號（從 500 開始）
    "START_ID": 500,
    
    # 排除的檔案（不納入合併）
    "EXCLUDE_FILES": ["計算題C.json"],
    
    # 輸出檔名對應表
    "OUTPUT_NAMES": {
        "單選題": "單選題_加強擴充版.json",
        "複選題": "複選題_完整版.json",
        "是非題": "是非題_完整版.json",
        "填空題": "填空題_完整版.json",
        "計算題": "計算題_完整版.json",
        "配合題": "配合題_完整版.json",
        "排序題": "排序題_完整版.json",
        "連連看": "連連看_完整版.json",
    },
    
    # 題型代碼對應
    "TYPE_PREFIX": {
        "單選題": "S",
        "複選題": "M",
        "是非題": "T",
        "填空題": "F",
        "計算題": "C",
        "配合題": "P",
        "排序題": "Q",
        "連連看": "L",
    },
    
    "REQUIRED_FIELDS": [
        "id", "type", "typeLabel", "text", "answer", "points"
    ],
}

# ============================================================
# 🔧 核心類別
# ============================================================

class QuestionMerger:
    def __init__(self, config):
        self.config = config
        self.input_dir = Path(config["INPUT_DIR"])
        self.output_dir = Path(config["OUTPUT_DIR"])
        self.start_id = config["START_ID"]
        self.exclude_files = config["EXCLUDE_FILES"]
        self.output_names = config["OUTPUT_NAMES"]
        self.type_prefix = config["TYPE_PREFIX"]
        self.required_fields = config["REQUIRED_FIELDS"]
        
        self.stats = {"errors": [], "warnings": [], "source_files": []}
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def load_json(self, filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            self.stats["errors"].append(f"讀取失敗: {filepath} - {str(e)}")
            return None
    
    def save_json(self, data, filepath):
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            self.stats["errors"].append(f"儲存失敗: {filepath} - {str(e)}")
            return False
    
    def detect_type_name(self, filename):
        for type_name in self.output_names.keys():
            if type_name in filename:
                return type_name
        return None
    
    def get_type_prefix(self, type_name):
        return self.type_prefix.get(type_name, "X")
    
    def normalize_answer(self, answer):
        if answer is None:
            return None
        if isinstance(answer, list):
            return sorted([str(a) for a in answer])
        if isinstance(answer, (int, float)):
            return answer
        if isinstance(answer, str):
            return answer.strip()
        return answer
    
    def find_question_files(self):
        """尋找所有題庫檔案（支援多個可能的目錄）"""
        possible_dirs = [
            self.input_dir,
            Path("./06_資料庫/03_分類題庫"),
            Path("./06資料庫/03_分類題庫"),
            Path("./03_分類題庫"),
        ]
        
        for dir_path in possible_dirs:
            if dir_path.exists():
                print(f"✅ 找到輸入目錄: {dir_path}")
                return dir_path
        
        return None
    
    def merge_questions(self, type_name, file_list):
        all_questions = []
        id_counter = self.start_id
        prefix = self.get_type_prefix(type_name)
        seen_ids = set()
        source_stats = {}
        
        for filename in file_list:
            filepath = self.input_dir / filename
            if not filepath.exists():
                self.stats["errors"].append(f"檔案不存在: {filename}")
                continue
            
            data = self.load_json(filepath)
            if data is None:
                continue
            
            questions = data.get("questions", [])
            if not questions:
                continue
            
            source_stats[filename] = len(questions)
            
            for q in questions:
                new_id = f"{prefix}{id_counter:03d}"
                q["id"] = new_id
                
                if new_id in seen_ids:
                    self.stats["errors"].append(f"ID 重複: {new_id}")
                    continue
                seen_ids.add(new_id)
                
                if "answer" in q:
                    q["answer"] = self.normalize_answer(q["answer"])
                
                all_questions.append(q)
                id_counter += 1
            
            self.stats["source_files"].append(filename)
        
        return all_questions, source_stats
    
    def run(self):
        print("\n" + "=" * 70)
        print("📚 智慧化題庫合併器 v10.1.0")
        print("=" * 70)
        
        # 自動尋找正確的輸入目錄
        found_dir = self.find_question_files()
        if found_dir:
            self.input_dir = found_dir
            print(f"📂 輸入: {self.input_dir}")
        else:
            print(f"❌ 找不到輸入目錄！")
            print("請確認以下任一目錄存在：")
            print("  - ./06_資料庫/03_分類題庫")
            print("  - ./06資料庫/03_分類題庫")
            print("  - ./03_分類題庫")
            return
        
        print(f"📂 輸出: {self.output_dir}")
        print("=" * 70)
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        all_files = [f.name for f in self.input_dir.glob("*.json")]
        all_files = [f for f in all_files if f not in self.exclude_files]
        
        if not all_files:
            print("❌ 找不到任何 JSON 檔案！")
            print(f"請確認 {self.input_dir} 內有題庫檔案")
            return
        
        print(f"\n📄 找到 {len(all_files)} 個 JSON 檔案")
        
        groups = defaultdict(list)
        for filename in all_files:
            type_name = self.detect_type_name(filename)
            if type_name:
                groups[type_name].append(filename)
            else:
                print(f"⚠️ 無法分類: {filename}")
        
        total_merged = 0
        
        for type_name, file_list in groups.items():
            print(f"\n📖 處理: {type_name}")
            print(f"   📄 {', '.join(file_list)}")
            
            questions, source_stats = self.merge_questions(type_name, file_list)
            
            if not questions:
                print(f"   ⚠️ 無題目，跳過")
                continue
            
            output_data = {
                "UpdateDate": datetime.now().strftime("%Y-%m-%d"),
                "Version": "10.1.0",
                "TotalQuestions": len(questions),
                "Type": questions[0].get("type", ""),
                "TypeLabel": questions[0].get("typeLabel", type_name),
                "TypePrefix": self.get_type_prefix(type_name),
                "source": {
                    "classified": True,
                    "breed": True,
                    "merged": True,
                    "merge_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "source_stats": source_stats,
                    "source_files": list(source_stats.keys()),
                },
                "questions": questions,
            }
            
            output_filename = self.output_names.get(type_name, f"{type_name}_完整版.json")
            output_path = self.output_dir / output_filename
            self.save_json(output_data, output_path)
            
            total_merged += len(questions)
            print(f"   ✅ {len(questions)} 題 → {output_filename}")
            print(f"   📊 ID: {questions[0]['id']} ~ {questions[-1]['id']}")
        
        print("\n" + "=" * 70)
        print(f"✅ 完成！共 {total_merged} 題")
        print(f"📁 輸出目錄: {self.output_dir}")
        print("=" * 70)


# ============================================================
# 🚀 執行
# ============================================================

if __name__ == "__main__":
    merger = QuestionMerger(CONFIG)
    merger.run()