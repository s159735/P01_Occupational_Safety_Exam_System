#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================
# 📚 精煉_題庫格式 v10.4.0
# 職責：補齊配合題 leftItems / 連連看 pairs + 預留多圖片格式
# 版本：10.4.0
# 更新日期：2026-07-21
# ============================================================

import json
import os
import re
from pathlib import Path
from datetime import datetime

# ============================================================
# 🎯 設定區
# ============================================================

CONFIG = {
    "MATCH_FILE": "06_資料庫/06_完整題庫/配合題.json",
    "LINK_FILE": "06_資料庫/06_完整題庫/連連看.json",
    "OUTPUT_MODE": "overwrite",  # 或 'new'
    "OUTPUT_SUFFIX": "_精煉",
    "EXTRACT_CONFIG": {
        "stop_words": ["下列", "以上", "以下", "等", "之", "其", "與", "及", "和",
                       "進行", "配對", "對應", "正確", "請將", "請依", "依序",
                       "由", "至", "高低", "大小", "先後", "順序"],
        "delimiters": ["、", "，", ",", "及", "和", "與"],
        "fallback_labels": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
    }
}

# ============================================================
# 🔧 核心類別
# ============================================================

class QuestionRefiner:
    def __init__(self, config):
        self.config = config
        self.match_file = Path(config["MATCH_FILE"])
        self.link_file = Path(config["LINK_FILE"])
        self.output_mode = config["OUTPUT_MODE"]
        self.output_suffix = config["OUTPUT_SUFFIX"]
        self.stop_words = config["EXTRACT_CONFIG"]["stop_words"]
        self.delimiters = config["EXTRACT_CONFIG"]["delimiters"]
        self.fallback_labels = config["EXTRACT_CONFIG"]["fallback_labels"]
        
        self.stats = {
            "match": {"processed": 0, "extracted": 0, "fallback": 0, "errors": 0},
            "link": {"processed": 0, "extracted": 0, "fallback": 0, "errors": 0},
            "errors": []
        }
    
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
    
    def extract_left_items_from_text(self, text, expected_count):
        if not text or not expected_count or expected_count <= 0:
            return None
        
        cleaned = text
        for word in self.stop_words:
            cleaned = cleaned.replace(word, "")
        
        patterns = [
            r"左側[（(]?([^）)]+)[）)]?與右側",
            r"左欄[（(]?([^）)]+)[）)]?與右欄",
            r"左邊[（(]?([^）)]+)[）)]?與右邊",
            r"下列[（(]?([^）)]+)[）)]?與其對應",
            r"下列[（(]?([^）)]+)[）)]?與",
            r"請將[（(]?([^）)]+)[）)]?與",
            r"請依序排列[（(]?([^）)]+)[）)]?",
            r"左側[（(]?([^）)]+)[）)]?",
            r"「([^」]+)」與「([^」]+)」",
        ]
        
        extracted = None
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                extracted = match.group(1)
                break
        
        if not extracted:
            for delim in self.delimiters:
                if delim in text:
                    parts = text.split(delim)
                    if len(parts) >= expected_count:
                        candidates = []
                        for p in parts[:expected_count + 2]:
                            p = p.strip()
                            if p and len(p) >= 2 and not re.match(r'^[\d\W]+$', p):
                                candidates.append(p)
                        if len(candidates) >= expected_count:
                            return candidates[:expected_count]
            return None
        
        for delim in self.delimiters:
            if delim in extracted:
                items = [item.strip() for item in extracted.split(delim) if item.strip()]
                items = [item for item in items if item and len(item) >= 2]
                if len(items) >= expected_count:
                    return items[:expected_count]
        
        return None
    
    def generate_fallback_labels(self, count):
        labels = []
        for i in range(count):
            if i < len(self.fallback_labels):
                labels.append(self.fallback_labels[i])
            else:
                labels.append(f"項目{i+1}")
        return labels
    
    def build_images_structure(self, q, left_items, right_items):
        """建立多圖片支援的 images 結構（預留）"""
        q_id = q.get("id", "")
        images = {
            "question": None,
            "leftItems": {},
            "rightItems": {},
            "background": None,
            "extra": []
        }
        
        if left_items:
            for item in left_items:
                safe_name = re.sub(r'[^\w\u4e00-\u9fff]', '_', item)
                images["leftItems"][item] = None
        
        if right_items:
            for item in right_items:
                safe_name = re.sub(r'[^\w\u4e00-\u9fff]', '_', item)
                images["rightItems"][item] = None
        
        return images
    
    def refine_match_question(self, q, index):
        q_type = q.get("type", "")
        if q_type not in ["match", "matching"]:
            return q
        
        if q.get("leftItems") and len(q.get("leftItems", [])) > 0:
            self.stats["match"]["processed"] += 1
            return q
        
        answer = q.get("answer", [])
        if not answer or not isinstance(answer, list) or len(answer) == 0:
            self.stats["match"]["errors"] += 1
            return q
        
        expected_count = len(answer)
        text = q.get("text", "")
        
        left_items = self.extract_left_items_from_text(text, expected_count)
        
        if left_items and len(left_items) == expected_count:
            self.stats["match"]["extracted"] += 1
        else:
            left_items = self.generate_fallback_labels(expected_count)
            self.stats["match"]["fallback"] += 1
        
        q["leftItems"] = left_items
        q["rightItems"] = answer[:]
        
        if "images" not in q or q["images"] is None:
            q["images"] = self.build_images_structure(q, left_items, answer)
        
        self.stats["match"]["processed"] += 1
        return q
    
    def refine_link_question(self, q, index):
        q_type = q.get("type", "")
        if q_type not in ["link", "connection"]:
            return q
        
        if q.get("pairs") and len(q.get("pairs", [])) > 0:
            self.stats["link"]["processed"] += 1
            return q
        
        answer = q.get("answer", [])
        if not answer or not isinstance(answer, list) or len(answer) == 0:
            self.stats["link"]["errors"] += 1
            return q
        
        expected_count = len(answer)
        text = q.get("text", "")
        
        left_items = self.extract_left_items_from_text(text, expected_count)
        
        if left_items and len(left_items) == expected_count:
            self.stats["link"]["extracted"] += 1
        else:
            left_items = self.generate_fallback_labels(expected_count)
            self.stats["link"]["fallback"] += 1
        
        pairs = []
        for i in range(expected_count):
            pairs.append({
                "left": left_items[i] if i < len(left_items) else f"項目{i+1}",
                "right": answer[i] if i < len(answer) else ""
            })
        
        q["pairs"] = pairs
        q["leftItems"] = left_items[:]
        
        if "images" not in q or q["images"] is None:
            q["images"] = self.build_images_structure(q, left_items, answer)
        
        self.stats["link"]["processed"] += 1
        return q
    
    def refine_file(self, filepath, refine_func):
        print(f"\n📖 處理: {filepath}")
        
        data = self.load_json(filepath)
        if data is None:
            return False
        
        questions = data.get("questions", [])
        if not questions:
            print(f"   ⚠️ 無題目，跳過")
            return False
        
        print(f"   📄 共 {len(questions)} 題")
        
        refined_count = 0
        for i, q in enumerate(questions):
            refined = refine_func(q, i)
            if refined != q:
                refined_count += 1
            questions[i] = refined
        
        data["TotalQuestions"] = len(questions)
        data["UpdateDate"] = datetime.now().strftime("%Y-%m-%d")
        data["Version"] = "10.4.0"
        
        if self.output_mode == "new":
            stem = filepath.stem
            output_path = filepath.parent / f"{stem}{self.output_suffix}.json"
        else:
            output_path = filepath
        
        self.save_json(data, output_path)
        print(f"   ✅ 精煉完成: {refined_count} 題 → {output_path.name}")
        return True
    
    def run(self):
        print("\n" + "=" * 70)
        print("📚 精煉_題庫格式 v10.4.0")
        print("   職責：補齊 leftItems / pairs + 預留多圖片格式")
        print("=" * 70)
        
        if not self.match_file.exists():
            print(f"❌ 找不到配合題檔案: {self.match_file}")
        else:
            self.refine_file(self.match_file, self.refine_match_question)
        
        if not self.link_file.exists():
            print(f"❌ 找不到連連看檔案: {self.link_file}")
        else:
            self.refine_file(self.link_file, self.refine_link_question)
        
        print("\n" + "=" * 70)
        print("📊 精煉統計")
        print("=" * 70)
        print(f"配合題: 處理 {self.stats['match']['processed']} 題")
        print(f"  ├─ 語意提取成功: {self.stats['match']['extracted']} 題")
        print(f"  └─ 使用備用標籤: {self.stats['match']['fallback']} 題")
        print(f"連連看: 處理 {self.stats['link']['processed']} 題")
        print(f"  ├─ 語意提取成功: {self.stats['link']['extracted']} 題")
        print(f"  └─ 使用備用標籤: {self.stats['link']['fallback']} 題")
        print(f"\n✅ 每題已預留 images 結構（支援多張圖片）")
        
        if self.stats["errors"]:
            print(f"\n⚠️ 錯誤: {len(self.stats['errors'])} 個")
            for err in self.stats["errors"][:5]:
                print(f"   - {err}")
        
        print("\n✅ 精煉完成！")


if __name__ == "__main__":
    refiner = QuestionRefiner(CONFIG)
    refiner.run()