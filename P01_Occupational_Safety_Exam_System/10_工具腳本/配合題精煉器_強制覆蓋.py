#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================
# 📚 配合題精煉器 v10.7.0 (強制覆蓋版)
# 職責：強制覆蓋配合題 leftItems / rightItems（含干擾選項）
# 格式：國家考試標準格式
# ============================================================

import json
import re
import random
from pathlib import Path
from datetime import datetime

CONFIG = {
    "INPUT_FILE": "06_資料庫/06_完整題庫/配合題.json",
    "OUTPUT_MODE": "overwrite",
    "DISTRACTORS_COUNT": 3,
}

# ============================================================
# 📋 完整對照表（P0 ~ P51）
# ============================================================

MATCH_DATA = {
    "P0": {
        "leftItems": ["開口邊緣", "合梯上", "屋頂", "鋼構上", "施工架上"],
        "rightItems": ["無護欄防護", "重心不穩易傾倒", "斜屋頂易滑落", "踏空風險高", "墜落高度2公尺以上"],
        "distractors": ["平面道路", "樓梯間", "電梯口"]
    },
    "P1": {
        "leftItems": ["勞動場所", "工作場所", "作業場所"],
        "rightItems": ["廠區全部", "廠房內部", "操作區"],
        "distractors": ["辦公室", "會議室", "休息區"]
    },
    "P2": {
        "leftItems": ["過氧化氫", "丙酮", "乙炔", "黃磷", "硝化甘油"],
        "rightItems": ["氧化性物質", "易燃液體", "可燃性氣體", "著火性物質", "爆炸性物質"],
        "distractors": ["毒性物質", "放射性物質", "腐蝕性物質"]
    },
    "P3": {
        "leftItems": ["氧化性氣體", "有機過氧化物(A型)", "金屬腐蝕物", "致癌物質", "急毒性1級"],
        "rightItems": ["氧化性氣體", "有機過氧化物(A型)", "金屬腐蝕物", "致癌物質", "急毒性1級"],
        "distractors": ["易燃氣體", "加壓氣體", "水環境危害"]
    },
    "P4": {
        "leftItems": ["一眼失明", "一手喪失", "一手拇指喪失", "一手食指喪失", "腳趾骨折", "小腿擦傷"],
        "rightItems": ["永久全失能", "永久部分失能", "永久部分失能", "永久部分失能", "暫時全失能", "輕傷害"],
        "distractors": ["永久全失能", "死亡"]
    },
    "P5": {
        "leftItems": ["正己烷", "甲醛", "甲苯", "石綿", "鉻酸"],
        "rightItems": ["矽膠管", "吸收液", "活性碳吸附管", "PVC濾紙", "纖維素酯濾紙"],
        "distractors": ["玻璃纖維濾紙", "不鏽鋼採樣管", "石英濾紙"]
    },
    "P6": {
        "leftItems": ["清洗冷卻水塔", "清掃倉庫", "針扎", "清除積水", "接觸體液"],
        "rightItems": ["退伍軍人症", "漢他病毒症候群", "病毒性肝炎", "登革熱", "後天免疫缺乏症候群"],
        "distractors": ["流感", "肺結核", "麻疹"]
    },
    "P7": {
        "leftItems": ["粉塵", "燻煙", "霧滴", "纖維", "燻煙(金屬)"],
        "rightItems": ["固體微粒(機械方法產生)", "金屬蒸氣冷凝產生之固體微粒", "燃燒產生之固體微粒", "液體微粒(懸浮於空氣中)", "長徑比大於3:1之微粒"],
        "distractors": ["氣體微粒", "凝膠微粒", "泡沫微粒"]
    },
    "P8": {
        "leftItems": ["巴金森氏症", "肝血管肉瘤", "多發性神經病變", "白血病", "鼻中隔穿孔"],
        "rightItems": ["錳", "氯乙烯", "正己烷", "苯", "鉻酸"],
        "distractors": ["汞", "鉛", "鎘"]
    },
    "P9": {
        "leftItems": ["失誤樹分析(FTA)", "事件樹分析(ETA)", "檢核表"],
        "rightItems": ["由初始事件推導後果", "由事故結果推導原因", "系統性檢查項目"],
        "distractors": ["風險矩陣", "層級分析法", "德爾菲法"]
    },
    "P10": {
        "leftItems": ["吊舉物掉落", "人員從高處墜落", "吊臂碰觸高壓線", "起重機翻覆", "人員被夾傷"],
        "rightItems": ["物體飛落", "墜落", "感電", "倒塌", "被夾"],
        "distractors": ["火災", "爆炸", "中毒"]
    },
    "P11": {
        "leftItems": ["體溫>40℃、皮膚發紅", "體溫<40℃、皮膚蒼白"],
        "rightItems": ["中暑", "熱衰竭"],
        "distractors": ["熱暈厥", "熱痙攣", "熱疲勞"]
    },
    "P12": {
        "leftItems": ["以低噪音設備取代高噪音設備", "使用不同製程", "設置隔音罩", "縮短作業時間", "佩戴耳塞"],
        "rightItems": ["工程控制(消除)", "工程控制(替代)", "工程控制(隔離)", "行政管理", "個人防護具"],
        "distractors": ["工程控制(減量)", "行政管理", "個人防護具"]
    },
    "P13": {
        "leftItems": ["現場觀察員", "分析主持人", "核定主管"],
        "rightItems": ["現場觀察與記錄", "確認分析完整性", "核定安全作業標準"],
        "distractors": ["安全衛生管理員", "作業主管", "監工"]
    },
    "P14": {
        "leftItems": ["職業安全衛生法第6條第1項", "職業安全衛生法第6條第2項", "職業安全衛生法第23條"],
        "rightItems": ["3年以下有期徒刑或併科30萬元以下罰金", "1年以下有期徒刑或併科18萬元以下罰金", "3萬元以上30萬元以下罰鍰"],
        "distractors": ["5年以下有期徒刑", "10萬元以上50萬元以下罰鍰", "停工處分"]
    },
    "P15": {
        "leftItems": ["有機溶劑", "粉塵", "缺氧", "化學品噴濺"],
        "rightItems": ["整體換氣裝置", "局部排氣裝置", "空氣呼吸器", "化學防護衣"],
        "distractors": ["防護眼鏡", "安全帽", "安全鞋"]
    },
    "P16": {
        "leftItems": ["易燃液體", "急毒性物質", "腐蝕性物質", "刺激性物質"],
        "rightItems": ["易燃液體", "急毒性物質", "腐蝕性物質", "刺激性物質"],
        "distractors": ["爆炸性物質", "氧化性物質", "加壓氣體"]
    },
    "P17": {
        "leftItems": ["鉛", "汞", "鎘", "錳", "鉻"],
        "rightItems": ["鉛中毒", "水俁病", "痛痛病", "巴金森氏症", "鼻中隔穿孔"],
        "distractors": ["職業性氣喘", "職業性皮膚炎", "職業性聽力損失"]
    },
    "P18": {
        "leftItems": ["熱燒燙傷", "火燒傷", "化學灼傷", "電擊傷"],
        "rightItems": ["沖脫泡蓋送", "停止倒下滾動", "大量清水沖洗", "斷電後急救"],
        "distractors": ["冰敷", "塗抹藥膏", "刺破水泡"]
    },
    "P19": {
        "leftItems": ["氣體測定", "通風換氣", "進入許可申請", "監視人員監視", "人員進入作業"],
        "rightItems": ["氣體測定", "通風換氣", "進入許可申請", "監視人員監視", "人員進入作業"],
        "distractors": ["危害確認", "救援三腳架設置", "緊急應變"]
    },
    "P20": {
        "leftItems": ["地面作業", "護欄護蓋", "安全網", "安全帶", "警示線系統"],
        "rightItems": ["地面作業", "護欄護蓋", "安全網", "安全帶", "警示線系統"],
        "distractors": ["安全母索", "安全梯", "施工架"]
    },
    "P21": {
        "leftItems": ["普通火災", "油類火災", "電氣火災", "金屬火災"],
        "rightItems": ["水", "泡沫", "乾粉", "金屬滅火劑"],
        "distractors": ["二氧化碳", "海龍", "惰性氣體"]
    },
    "P22": {
        "leftItems": ["禁止、危險", "警告、注意", "安全、急救", "強制、指示"],
        "rightItems": ["紅色", "黃色", "綠色", "藍色"],
        "distractors": ["橘色", "紫色", "棕色"]
    },
    "P23": {
        "leftItems": ["吸入", "皮膚接觸", "食入", "眼睛接觸"],
        "rightItems": ["呼吸防護具", "化學防護衣", "禁止飲食標示", "洗眼設備"],
        "distractors": ["防護面罩", "安全鞋", "耳塞"]
    },
    "P24": {
        "leftItems": ["戶外有日曬", "室內無日曬", "戶外無日曬"],
        "rightItems": ["WBGT = 0.7Tw + 0.2Tg + 0.1Td", "WBGT = 0.7Tw + 0.3Tg", "WBGT = 0.7Tw + 0.3Tg"],
        "distractors": ["WBGT = 0.5Tw + 0.5Tg", "WBGT = Tw + Tg"]
    },
    "P25": {
        "leftItems": ["新僱勞工", "業務主管", "急救人員", "一般勞工"],
        "rightItems": ["3小時", "6小時/2年", "3小時/2年", "3小時/年"],
        "distractors": ["6小時/年", "12小時/年", "18小時/年"]
    },
    "P26": {
        "leftItems": ["冷卻法", "窒息法", "隔離法", "抑制法"],
        "rightItems": ["用水降低溫度", "覆蓋滅火毯", "移除可燃物", "使用乾粉滅火器"],
        "distractors": ["通風換氣", "灑水系統", "消防栓"]
    },
    "P27": {
        "leftItems": ["失能傷害頻率(FR)", "失能傷害嚴重率(SR)", "總合傷害指數(FSI)"],
        "rightItems": ["(失能傷害人次數 × 10⁶) ÷ 總經歷工時", "(總損失日數 × 10⁶) ÷ 總經歷工時", "√(FR × SR ÷ 1000)"],
        "distractors": ["失能傷害頻率 = 失能傷害人次數/總經歷工時", "失能傷害嚴重率 = 總損失日數/總經歷工時"]
    },
    "P28": {
        "leftItems": ["耐壓防爆(d)", "油浸防爆(o)", "正壓防爆(p)", "增加安全(e)", "本質安全(i)"],
        "rightItems": ["d", "o", "p", "e", "i"],
        "distractors": ["n", "m", "q"]
    },
    "P29": {
        "leftItems": ["外裝式氣罩", "接收式氣罩", "包圍式氣罩", "側吸式氣罩", "下吸式氣罩"],
        "rightItems": ["Q = V × A", "Q = V(10X² + A)", "Q = 0.75V(10X² + A)", "Q = 1.4P V X", "Q = 3.7L V X"],
        "distractors": ["Q = V × A × 1.5", "Q = V(5X² + A)"]
    },
    "P30": {
        "leftItems": ["變電所接地", "高壓設備接地", "低壓設備接地", "一般設備接地"],
        "rightItems": ["接地電阻10Ω以下", "接地電阻25Ω以下", "接地電阻50Ω以下", "接地電阻100Ω以下"],
        "distractors": ["接地電阻5Ω以下", "接地電阻200Ω以下"]
    },
    "P31": {
        "leftItems": ["安全帽", "安全帶", "安全眼鏡", "化學防護衣"],
        "rightItems": ["頭部防護", "墜落防止", "飛屑防護", "化學品防護"],
        "distractors": ["聽力防護", "呼吸防護", "手部防護"]
    },
    "P32": {
        "leftItems": ["苯", "甲苯", "汽油", "乙醚"],
        "rightItems": ["第一種", "第二種", "第三種", "第二種"],
        "distractors": ["第四種", "第五種"]
    },
    "P33": {
        "leftItems": ["氯", "氨", "氟化氫", "硫酸"],
        "rightItems": ["甲類物質", "丙類第1種物質", "丙類第1種物質", "丁類物質"],
        "distractors": ["乙類物質", "丙類第2種物質"]
    },
    "P34": {
        "leftItems": ["活性碳管", "矽膠管", "吸收液", "濾紙"],
        "rightItems": ["有機溶劑蒸氣", "極性化合物", "酸性氣體", "重金屬粉塵"],
        "distractors": ["氣體採樣袋", "不鏽鋼採樣管"]
    },
    "P35": {
        "leftItems": ["矽肺症", "多氯聯苯中毒", "巴金森氏症", "鼻中隔穿孔"],
        "rightItems": ["游離二氧化矽", "多氯聯苯", "錳", "鉻酸"],
        "distractors": ["鉛", "汞", "鎘"]
    },
    "P36": {
        "leftItems": ["噪音作業", "粉塵作業", "有機溶劑作業", "鉛作業"],
        "rightItems": ["每年1次", "每年1次", "每年1次", "每2年1次"],
        "distractors": ["每半年1次", "每3年1次"]
    },
    "P37": {
        "leftItems": ["5公尺以上未滿15公尺", "15公尺以上未滿30公尺", "30公尺以上"],
        "rightItems": ["每連續作業2小時休息20分鐘", "每連續作業2小時休息25分鐘", "每連續作業2小時休息35分鐘"],
        "distractors": ["每連續作業2小時休息15分鐘", "每連續作業2小時休息30分鐘"]
    },
    "P38": {
        "leftItems": ["協議組織", "告知義務", "教育訓練協助", "共同作業管制"],
        "rightItems": ["職業安全衛生法第23條", "職業安全衛生法第26條", "職業安全衛生法第28條", "職業安全衛生法第27條"],
        "distractors": ["職業安全衛生法第24條", "職業安全衛生法第25條"]
    },
    "P39": {
        "leftItems": ["消防法", "職業安全衛生法", "職業安全衛生法", "空氣污染防制法", "工廠管理輔導法"],
        "rightItems": ["內政部", "勞動部", "勞動部", "環境部", "經濟部"],
        "distractors": ["交通部", "衛生福利部"]
    },
    "P40": {
        "leftItems": ["主要通道", "機械間通道", "車輛出入口", "車輛交會處"],
        "rightItems": ["1公尺", "80公分", "最大車寬+1公尺", "最大車寬×2+1公尺"],
        "distractors": ["1.5公尺", "2公尺"]
    },
    "P41": {
        "leftItems": ["營造業", "製造業", "服務業", "批發零售業"],
        "rightItems": ["第一類(具顯著風險)", "第一類(具顯著風險)", "第三類(具低度風險)", "第二類(具中度風險)"],
        "distractors": ["第一類(具顯著風險)", "第二類(具中度風險)"]
    },
    "P42": {
        "leftItems": ["氫氣", "汽油", "過氧化氫", "硝化甘油", "黃磷"],
        "rightItems": ["可燃性氣體", "易燃液體", "氧化性物質", "爆炸性物質", "著火性物質"],
        "distractors": ["毒性物質", "放射性物質"]
    },
    "P43": {
        "leftItems": ["CNS 45001", "ISO 45001", "TOSHMS"],
        "rightItems": ["CNS 45001", "ISO 45001", "TOSHMS"],
        "distractors": ["OHSAS 18001", "ISO 14001", "ISO 9001"]
    },
    "P44": {
        "leftItems": ["墜落", "感電", "倒塌", "缺氧"],
        "rightItems": ["人體因重力落下撞擊地面或物體", "人體接觸電流引起之傷害", "建築物或構造物失去支撐而倒下", "空氣中氧氣濃度未滿18%"],
        "distractors": ["火災", "爆炸", "中毒"]
    },
    "P45": {
        "leftItems": ["粉塵作業", "有機溶劑作業", "噪音作業", "鉛作業"],
        "rightItems": ["塵肺症", "有機溶劑中毒", "聽力損失", "鉛中毒"],
        "distractors": ["皮膚炎", "氣喘", "心臟病"]
    },
    "P46": {
        "leftItems": ["健康危害", "加壓氣體", "急毒性", "易燃", "氧化性", "水環境危害", "爆炸", "腐蝕"],
        "rightItems": ["健康危害性物質", "加壓氣體", "急毒性物質", "易燃物質", "氧化性物質", "水環境危害", "爆炸性物質", "腐蝕性物質"],
        "distractors": ["放射性物質", "生物危害", "物理危害"]
    },
    "P47": {
        "leftItems": ["破窗理論", "乳酪理論", "冰山理論", "小花理論", "木桶理論", "莫非定律"],
        "rightItems": ["不良現象不改善會逐漸擴大", "事故是巧合穿過所有防護漏洞", "事故隱藏的損失比表面看到的更大", "劣勢中找到亮點，影響整個環境", "團隊表現由能力最低的人決定", "所有可能會出錯的事情都會出錯"],
        "distractors": ["蝴蝶效應", "馬太效應", "霍桑效應"]
    },
    "P48": {
        "leftItems": ["感電", "崩塌", "墜落", "中毒", "爆炸", "機械夾傷"],
        "rightItems": ["接地/漏電斷路器", "擋土支撐", "護欄/安全網", "通風系統", "防爆電氣設備", "雙手操作式安全裝置"],
        "distractors": ["安全標示", "教育訓練", "定期檢查"]
    },
    "P49": {
        "leftItems": ["人員進入作業區域", "人員誤入旋轉範圍", "碰觸高壓電線", "吊具強度不足", "過負荷", "高處未佩帶安全帶"],
        "rightItems": ["人員擅自進入作業區域", "人員誤入上部旋轉體作業區", "伸臂碰觸高壓電路線", "吊具或鋼索強度不足、吊掛不當", "吊升超過額定荷重、地面不平", "高處作業未佩帶安全帶"],
        "distractors": ["操作人員未受訓", "吊掛信號不明", "風力過大"]
    },
    "P50": {
        "leftItems": ["健康危害", "易燃", "爆炸", "腐蝕", "加壓氣體"],
        "rightItems": ["人體胸廓圖式", "火焰圖式", "爆炸圖式", "腐蝕圖式", "鋼瓶圖式"],
        "distractors": ["氧化圖式", "急毒性圖式", "水環境圖式"]
    },
    "P51": {
        "leftItems": ["冰山理論", "木桶理論", "小花理論", "破窗理論", "乳酪理論"],
        "rightItems": ["事故損失僅為冰山一角，隱藏損失更大", "團隊表現取決於最弱的一環", "在劣勢中找到突破口，改變整體", "小問題不處理會擴大惡化", "意外是多重防護漏洞同時穿過"],
        "distractors": ["蝴蝶效應", "月暈效應", "霍桑效應"]
    }
}

# ============================================================
# 🔧 核心類別（強制覆蓋版）
# ============================================================

class MatchRefiner:
    def __init__(self, config):
        self.config = config
        self.input_file = Path(config["INPUT_FILE"])
        self.distractors_count = config["DISTRACTORS_COUNT"]
        self.match_data = MATCH_DATA
        self.stats = {"processed": 0, "matched": 0, "fallback": 0, "errors": []}
    
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
    
    def build_images_structure(self, q, left_items, right_items):
        images = {
            "question": None,
            "leftItems": {},
            "rightItems": {},
            "background": None,
            "extra": []
        }
        for item in left_items:
            images["leftItems"][item] = None
        for item in right_items:
            images["rightItems"][item] = None
        return images
    
    def refine_question(self, q):
        q_type = q.get("type", "")
        if q_type not in ["match", "matching"]:
            return q
        
        answer = q.get("answer", [])
        if not answer or not isinstance(answer, list) or len(answer) == 0:
            self.stats["errors"].append(f"{q.get('id')}: answer 為空")
            return q
        
        q_id = q.get("id", "")
        
        # 從對照表取得資料
        if q_id in self.match_data:
            data = self.match_data[q_id]
            left_items = data.get("leftItems", [])
            right_items = data.get("rightItems", [])
            distractors = data.get("distractors", [])
            self.stats["matched"] += 1
        else:
            # 使用備用標籤
            labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
            left_items = labels[:len(answer)]
            right_items = answer[:]
            distractors = []
            self.stats["fallback"] += 1
        
        # 處理干擾選項
        if distractors:
            selected_distractors = distractors[:self.distractors_count]
        else:
            fallback = ["干擾選項A", "干擾選項B", "干擾選項C"]
            random.shuffle(fallback)
            selected_distractors = fallback[:self.distractors_count]
        
        # 合併並隨機排列
        final_right_items = right_items[:] + selected_distractors
        random.shuffle(final_right_items)
        
        # ✅ 強制覆蓋
        q["leftItems"] = left_items
        q["rightItems"] = final_right_items
        
        if "images" not in q or q["images"] is None:
            q["images"] = self.build_images_structure(q, left_items, final_right_items)
        
        self.stats["processed"] += 1
        return q
    
    def run(self):
        print("\n" + "=" * 70)
        print("📚 配合題精煉器 v10.7.0 (強制覆蓋版)")
        print("   職責：強制覆蓋 leftItems / rightItems（含干擾選項）")
        print("=" * 70)
        print(f"\n🎯 干擾選項數量: {self.distractors_count} 個")
        print("⚠️ 將會強制覆蓋所有 existing leftItems / rightItems")
        
        if not self.input_file.exists():
            print(f"❌ 找不到檔案: {self.input_file}")
            return
        
        data = self.load_json(self.input_file)
        if data is None:
            return
        
        questions = data.get("questions", [])
        print(f"\n📄 共 {len(questions)} 題")
        
        for i, q in enumerate(questions):
            questions[i] = self.refine_question(q)
        
        data["TotalQuestions"] = len(questions)
        data["UpdateDate"] = datetime.now().strftime("%Y-%m-%d")
        data["Version"] = "10.7.0"
        
        self.save_json(data, self.input_file)
        
        print("\n" + "=" * 70)
        print("📊 精煉統計")
        print("=" * 70)
        print(f"總處理: {self.stats['processed']} 題")
        print(f"  ├─ 對照表匹配: {self.stats['matched']} 題")
        print(f"  └─ 使用備用標籤: {self.stats['fallback']} 題")
        print(f"✅ 輸出: {self.input_file}")
        
        if self.stats["errors"]:
            print(f"\n⚠️ 錯誤: {len(self.stats['errors'])} 個")
            for err in self.stats["errors"][:5]:
                print(f"   - {err}")
        
        print("\n✅ 精煉完成！")


if __name__ == "__main__":
    refiner = MatchRefiner(CONFIG)
    refiner.run()