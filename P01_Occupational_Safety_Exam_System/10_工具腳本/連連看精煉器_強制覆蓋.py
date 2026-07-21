#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================
# 📚 連連看精煉器 v10.8.0 (強制覆蓋版)
# 職責：強制覆蓋連連看 leftItems / pairs（含干擾選項）
# 格式：國家考試標準格式
# 更新日期：2026-07-21
# ============================================================

import json
import re
import random
from pathlib import Path
from datetime import datetime

CONFIG = {
    "INPUT_FILE": "06_資料庫/06_完整題庫/連連看.json",
    "OUTPUT_MODE": "overwrite",
    "DISTRACTORS_COUNT": 3,
}

# ============================================================
# 📋 完整對照表（L0 ~ L36）
# ============================================================

LINK_DATA = {
    "L0": {
        "leftItems": ["職業安全衛生法", "工廠管理輔導法", "空氣污染防制法", "消防法"],
        "pairs": [
            {"left": "職業安全衛生法", "right": "勞動部"},
            {"left": "工廠管理輔導法", "right": "經濟部"},
            {"left": "空氣污染防制法", "right": "環境部"},
            {"left": "消防法", "right": "內政部"}
        ],
        "distractors": ["交通部", "衛生福利部", "教育部"]
    },
    "L1": {
        "leftItems": ["破窗理論", "小花理論", "乳酪理論", "木桶理論"],
        "pairs": [
            {"left": "破窗理論", "right": "當環境中的某種不良現象發生後，如果沒有馬上進行改善或修復，這種不良現象便可能會逐漸被接受，且逐漸擴大變嚴重。"},
            {"left": "小花理論", "right": "先堅持某一部分的改善，時間一久整個情況便可能改善。"},
            {"left": "乳酪理論", "right": "導致嚴重事故發生的從來都不是因為某個單獨的原因，而是多個問題恰好同時出現。"},
            {"left": "木桶理論", "right": "決定團隊戰鬥力強弱的不是那個能力最強、表現最好的，而是那個能力最弱、表現最差的落後者。"}
        ],
        "distractors": ["冰山理論", "莫非定律", "蝴蝶效應"]
    },
    "L2": {
        "leftItems": ["汽油", "酒精", "氮氣", "一氧化碳", "硫化氫"],
        "pairs": [
            {"left": "汽油", "right": "易燃液體"},
            {"left": "酒精", "right": "易燃液體"},
            {"left": "氮氣", "right": "單純窒息性氣體"},
            {"left": "一氧化碳", "right": "化學窒息性氣體"},
            {"left": "硫化氫", "right": "化學窒息性氣體"}
        ],
        "distractors": ["易燃氣體", "氧化性物質", "爆炸性物質"]
    },
    "L3": {
        "leftItems": ["正己烷", "氯乙烯", "錳", "苯", "鉻酸"],
        "pairs": [
            {"left": "正己烷", "right": "多發性神經病變"},
            {"left": "氯乙烯", "right": "肝血管肉瘤"},
            {"left": "錳", "right": "巴金森氏症"},
            {"left": "苯", "right": "白血病"},
            {"left": "鉻酸", "right": "鼻中隔穿孔"}
        ],
        "distractors": ["鉛中毒", "水俁病", "痛痛病"]
    },
    "L4": {
        "leftItems": ["正己烷", "甲醛", "甲苯", "石綿", "鉻酸"],
        "pairs": [
            {"left": "正己烷", "right": "矽膠管"},
            {"left": "甲醛", "right": "吸收液"},
            {"left": "甲苯", "right": "活性碳吸附管"},
            {"left": "石綿", "right": "PVC濾紙"},
            {"left": "鉻酸", "right": "纖維素酯濾紙"}
        ],
        "distractors": ["玻璃纖維濾紙", "不鏽鋼採樣管", "石英濾紙"]
    },
    "L5": {
        "leftItems": ["失能傷害頻率(FR)", "失能傷害嚴重率(SR)", "總合傷害指數(FSI)"],
        "pairs": [
            {"left": "失能傷害頻率(FR)", "right": "(失能傷害次數×10⁶)/總工時"},
            {"left": "失能傷害嚴重率(SR)", "right": "(損失日數×10⁶)/總工時"},
            {"left": "總合傷害指數(FSI)", "right": "√(FR×SR/1000)"}
        ],
        "distractors": ["失能傷害頻率 = 失能傷害人次數/總經歷工時", "失能傷害嚴重率 = 總損失日數/總經歷工時"]
    },
    "L6": {
        "leftItems": ["職業災害", "勞工", "雇主"],
        "pairs": [
            {"left": "職業災害", "right": "因勞動場所之建築物、機械、設備等引起之疾病、傷害"},
            {"left": "勞工", "right": "勞工、自營作業者及其他受工作場所負責人指揮之人"},
            {"left": "雇主", "right": "事業主或事業之經營負責人"}
        ],
        "distractors": ["勞動場所", "工作場所", "作業場所"]
    },
    "L7": {
        "leftItems": ["乙醚", "汽油", "酒精", "煤油"],
        "pairs": [
            {"left": "乙醚", "right": "1"},
            {"left": "汽油", "right": "2"},
            {"left": "酒精", "right": "3"},
            {"left": "煤油", "right": "4"}
        ],
        "distractors": ["5", "6", "7"]
    },
    "L8": {
        "leftItems": ["溫度管理", "火源管理", "固定管理", "分區管理", "物品管理"],
        "pairs": [
            {"left": "溫度管理", "right": "保持在40°C以下"},
            {"left": "火源管理", "right": "禁止煙火接近"},
            {"left": "固定管理", "right": "安穩置放並加固定"},
            {"left": "分區管理", "right": "與盛裝容器分區放置"},
            {"left": "物品管理", "right": "不得任意放置其他物品"}
        ],
        "distractors": ["通風管理", "標示管理", "人員管理"]
    },
    "L9": {
        "leftItems": ["苯", "甲苯", "二甲苯", "汽油", "乙醚"],
        "pairs": [
            {"left": "苯", "right": "第一種有機溶劑"},
            {"left": "甲苯", "right": "第二種有機溶劑"},
            {"left": "二甲苯", "right": "第二種有機溶劑"},
            {"left": "汽油", "right": "第三種有機溶劑"},
            {"left": "乙醚", "right": "第二種有機溶劑"}
        ],
        "distractors": ["第四種有機溶劑", "第五種有機溶劑"]
    },
    "L10": {
        "leftItems": ["炸彈爆炸圖式", "火焰圖式", "腐蝕圖式", "健康危害圖式", "骷髏頭圖式"],
        "pairs": [
            {"left": "炸彈爆炸圖式", "right": "有機過氧化物(A型)"},
            {"left": "火焰圖式", "right": "易燃氣體"},
            {"left": "腐蝕圖式", "right": "金屬腐蝕物"},
            {"left": "健康危害圖式", "right": "致癌物質"},
            {"left": "骷髏頭圖式", "right": "急毒性物質"}
        ],
        "distractors": ["氧化性物質", "加壓氣體", "水環境危害"]
    },
    "L11": {
        "leftItems": ["工資補償", "年資計算", "預告期間", "通報時限"],
        "pairs": [
            {"left": "工資補償", "right": "事由發生前6個月"},
            {"left": "年資計算", "right": "繼續工作滿6個月"},
            {"left": "預告期間", "right": "30日前"},
            {"left": "通報時限", "right": "8小時內"}
        ],
        "distractors": ["事由發生後6個月", "繼續工作滿3個月", "15日前"]
    },
    "L12": {
        "leftItems": ["噪音作業", "鉛作業", "有機溶劑作業", "粉塵作業"],
        "pairs": [
            {"left": "噪音作業", "right": "聽力損失"},
            {"left": "鉛作業", "right": "鉛中毒"},
            {"left": "有機溶劑作業", "right": "有機溶劑中毒"},
            {"left": "粉塵作業", "right": "塵肺症"}
        ],
        "distractors": ["皮膚炎", "氣喘", "心臟病"]
    },
    "L13": {
        "leftItems": ["e", "i", "p", "o", "d"],
        "pairs": [
            {"left": "e", "right": "增加安全防爆構造"},
            {"left": "i", "right": "本質安全防爆構造"},
            {"left": "p", "right": "正壓防爆構造"},
            {"left": "o", "right": "油浸防爆構造"},
            {"left": "d", "right": "耐壓防爆構造"}
        ],
        "distractors": ["n", "m", "q"]
    },
    "L14": {
        "leftItems": ["D類火災", "C類火災", "A類火災", "B類火災"],
        "pairs": [
            {"left": "D類火災", "right": "乾砂（隔離法）"},
            {"left": "C類火災", "right": "二氧化碳（窒息法）"},
            {"left": "A類火災", "right": "水（冷卻法）"},
            {"left": "B類火災", "right": "泡沫（窒息法）"}
        ],
        "distractors": ["乾粉滅火器", "海龍滅火器", "惰性氣體"]
    },
    "L15": {
        "leftItems": ["全面罩式", "半面罩式", "防塵口罩", "動力濾淨式", "自給式"],
        "pairs": [
            {"left": "全面罩式", "right": "Full Face"},
            {"left": "半面罩式", "right": "Half Mask"},
            {"left": "防塵口罩", "right": "N95"},
            {"left": "動力濾淨式", "right": "PAPR"},
            {"left": "自給式", "right": "SCBA"}
        ],
        "distractors": ["P100", "HEPA", "活性碳口罩"]
    },
    "L16": {
        "leftItems": ["多氯聯苯", "氯乙烯", "游離二氧化矽", "鉻酸", "錳"],
        "pairs": [
            {"left": "多氯聯苯", "right": "多氯聯苯"},
            {"left": "氯乙烯", "right": "氯乙烯"},
            {"left": "游離二氧化矽", "right": "游離二氧化矽"},
            {"left": "鉻酸", "right": "鉻酸"},
            {"left": "錳", "right": "錳"}
        ],
        "distractors": ["鉛", "汞", "鎘"]
    },
    "L17": {
        "leftItems": ["隔音", "消音", "防振", "隔離", "吸音"],
        "pairs": [
            {"left": "隔音", "right": "以密度較大材料包覆外部"},
            {"left": "消音", "right": "使用消音器或減音器"},
            {"left": "防振", "right": "個別機械基礎或獨立地板"},
            {"left": "隔離", "right": "將噪音機械與一般場所分開"},
            {"left": "吸音", "right": "覆蓋天花板、牆壁、地板"}
        ],
        "distractors": ["通風", "冷卻", "加熱"]
    },
    "L18": {
        "leftItems": ["人因工程", "安全防護", "連鎖裝置", "機械化", "強度設計"],
        "pairs": [
            {"left": "人因工程", "right": "不使勞動量超過生理正常負荷"},
            {"left": "安全防護", "right": "危險區域應予閉鎖防止進入"},
            {"left": "連鎖裝置", "right": "安全裝置與起動裝置強制結合"},
            {"left": "機械化", "right": "應用機械化或自動化減少災害"},
            {"left": "強度設計", "right": "效能維持長久高倍額度"}
        ],
        "distractors": ["標準化", "模組化", "系統化"]
    },
    "L19": {
        "leftItems": ["有機溶劑作業", "粉塵作業", "噪音作業", "高溫作業", "鉛作業"],
        "pairs": [
            {"left": "有機溶劑作業", "right": "每3個月"},
            {"left": "粉塵作業", "right": "每6個月"},
            {"left": "噪音作業", "right": "每6個月"},
            {"left": "高溫作業", "right": "每6個月"},
            {"left": "鉛作業", "right": "每年（12個月）"}
        ],
        "distractors": ["每1個月", "每2個月", "每9個月"]
    },
    "L20": {
        "leftItems": ["氣罩", "排氣管", "風機", "導管", "空氣淨化裝置"],
        "pairs": [
            {"left": "氣罩", "right": "捕捉有害物發生源"},
            {"left": "排氣管", "right": "排出淨化後之空氣"},
            {"left": "風機", "right": "提供動力吸引空氣"},
            {"left": "導管", "right": "輸送含有害物之空氣"},
            {"left": "空氣淨化裝置", "right": "過濾或淨化有害物"}
        ],
        "distractors": ["控制面板", "警報裝置", "監測儀器"]
    },
    "L21": {
        "leftItems": ["警示語", "危害成分", "產品名稱", "危害說明", "安全措施"],
        "pairs": [
            {"left": "警示語", "right": "「危險」或「警告」"},
            {"left": "危害成分", "right": "化學品中具有危害性之成分"},
            {"left": "產品名稱", "right": "化學品之名稱"},
            {"left": "危害說明", "right": "危害類別及級別之說明"},
            {"left": "安全措施", "right": "預防及處置建議"}
        ],
        "distractors": ["製造商資訊", "緊急電話", "保存期限"]
    },
    "L22": {
        "leftItems": ["報警", "疏散", "搶救", "救護", "善後"],
        "pairs": [
            {"left": "報警", "right": "1"},
            {"left": "疏散", "right": "2"},
            {"left": "搶救", "right": "3"},
            {"left": "救護", "right": "4"},
            {"left": "善後", "right": "5"}
        ],
        "distractors": ["0", "6", "7"]
    },
    "L23": {
        "leftItems": ["消防法", "職業安全衛生法", "空氣污染防制法", "工廠管理輔導法"],
        "pairs": [
            {"left": "消防法", "right": "內政部"},
            {"left": "職業安全衛生法", "right": "勞動部"},
            {"left": "空氣污染防制法", "right": "環境部"},
            {"left": "工廠管理輔導法", "right": "經濟部"}
        ],
        "distractors": ["交通部", "衛生福利部", "教育部"]
    },
    "L24": {
        "leftItems": ["主要通道", "機械間通道", "車輛出入口"],
        "pairs": [
            {"left": "主要通道", "right": "1公尺"},
            {"left": "機械間通道", "right": "80公分"},
            {"left": "車輛出入口", "right": "最大車寬+1公尺"}
        ],
        "distractors": ["最大車寬+0.5公尺", "最大車寬+2公尺"]
    },
    "L25": {
        "leftItems": ["氫氣", "過氧化氫", "黃磷"],
        "pairs": [
            {"left": "氫氣", "right": "可燃性氣體"},
            {"left": "過氧化氫", "right": "氧化性物質"},
            {"left": "黃磷", "right": "著火性物質"}
        ],
        "distractors": ["易燃液體", "爆炸性物質", "毒性物質"]
    },
    "L26": {
        "leftItems": ["職業安全衛生業務主管", "職業安全衛生管理員", "職業安全衛生管理師"],
        "pairs": [
            {"left": "職業安全衛生業務主管", "right": "乙級技術士"},
            {"left": "職業安全衛生管理員", "right": "甲級技術士"},
            {"left": "職業安全衛生管理師", "right": "甲級技術士"}
        ],
        "distractors": ["丙級技術士", "高考及格", "普考及格"]
    },
    "L27": {
        "leftItems": ["粉塵作業", "有機溶劑作業", "噪音作業", "鉛作業"],
        "pairs": [
            {"left": "粉塵作業", "right": "塵肺症"},
            {"left": "有機溶劑作業", "right": "有機溶劑中毒"},
            {"left": "噪音作業", "right": "聽力損失"},
            {"left": "鉛作業", "right": "鉛中毒"}
        ],
        "distractors": ["皮膚炎", "氣喘", "心臟病"]
    },
    "L28": {
        "leftItems": ["總合傷害指數(FSI)", "失能傷害頻率(FR)", "失能傷害嚴重率(SR)"],
        "pairs": [
            {"left": "總合傷害指數(FSI)", "right": "√(FR × SR / 1000)"},
            {"left": "失能傷害頻率(FR)", "right": "失能傷害次數×10^6 / 總經歷工時"},
            {"left": "失能傷害嚴重率(SR)", "right": "總損失日數×10^6 / 總經歷工時"}
        ],
        "distractors": ["失能傷害頻率 = 失能傷害人次數/總經歷工時", "失能傷害嚴重率 = 總損失日數/總經歷工時"]
    },
    "L29": {
        "leftItems": ["正己烷", "錳", "苯", "氯乙烯", "鉻酸"],
        "pairs": [
            {"left": "正己烷", "right": "多發性神經病變"},
            {"left": "錳", "right": "巴金森氏症"},
            {"left": "苯", "right": "白血病"},
            {"left": "氯乙烯", "right": "肝血管肉瘤"},
            {"left": "鉻酸", "right": "鼻中隔穿孔"}
        ],
        "distractors": ["鉛中毒", "水俁病", "痛痛病"]
    },
    "L30": {
        "leftItems": ["製造、處置、使用危險物", "製造、處置、使用有害物", "違反一般安全衛生規定", "發生死亡災害"],
        "pairs": [
            {"left": "製造、處置、使用危險物", "right": "3年以下有期徒刑"},
            {"left": "製造、處置、使用有害物", "right": "3年以下有期徒刑"},
            {"left": "違反一般安全衛生規定", "right": "3萬元以上75萬元以下罰鍰"},
            {"left": "發生死亡災害", "right": "5年以下有期徒刑"}
        ],
        "distractors": ["2年以下有期徒刑", "6年以下有期徒刑", "1萬元以上50萬元以下罰鍰"]
    },
    "L31": {
        "leftItems": ["鋼瓶圖式", "骷髏頭圖式", "火焰圖式", "圓圈火焰圖式", "魚和樹圖式", "炸彈爆炸圖式", "健康危害圖式", "腐蝕圖式"],
        "pairs": [
            {"left": "鋼瓶圖式", "right": "加壓氣體"},
            {"left": "骷髏頭圖式", "right": "急毒性物質"},
            {"left": "火焰圖式", "right": "易燃液體"},
            {"left": "圓圈火焰圖式", "right": "氧化性液體"},
            {"left": "魚和樹圖式", "right": "水環境危害"},
            {"left": "炸彈爆炸圖式", "right": "爆炸物"},
            {"left": "健康危害圖式", "right": "致癌物質"},
            {"left": "腐蝕圖式", "right": "金屬腐蝕物"}
        ],
        "distractors": ["放射性圖式", "生物危害圖式", "物理危害圖式"]
    },
    "L32": {
        "leftItems": ["P (Protect)", "O (Offer)", "R (Raise)", "M (Monitor)", "E (Enforce)", "W (Warn)"],
        "pairs": [
            {"left": "P (Protect)", "right": "保護人們免受菸煙危害"},
            {"left": "O (Offer)", "right": "提供戒菸協助"},
            {"left": "R (Raise)", "right": "提高菸稅"},
            {"left": "M (Monitor)", "right": "監測菸品使用和預防政策"},
            {"left": "E (Enforce)", "right": "禁止菸品廣告、促銷和贊助"},
            {"left": "W (Warn)", "right": "警示菸品危害"}
        ],
        "distractors": ["管理菸品銷售", "處罰違規吸菸", "推廣健康生活"]
    },
    "L33": {
        "leftItems": ["安全裝置", "感應裝置", "緊急應變", "掃除裝置", "本質安全", "強度設計", "制動裝置", "護圍護蓋", "防護器具"],
        "pairs": [
            {"left": "安全裝置", "right": "使用夾具、治具或手工具"},
            {"left": "感應裝置", "right": "光電感應式、近接感應式"},
            {"left": "緊急應變", "right": "急救、緊急應變措施"},
            {"left": "掃除裝置", "right": "拉開式、掃除式"},
            {"left": "本質安全", "right": "本質安全、自動進退料"},
            {"left": "強度設計", "right": "正向設計、壓縮彈簧"},
            {"left": "制動裝置", "right": "緊急遮斷（制動）裝置"},
            {"left": "護圍護蓋", "right": "護圍、護蓋"},
            {"left": "防護器具", "right": "防護器具"}
        ],
        "distractors": ["警告標示", "教育訓練", "定期檢查"]
    },
    "L34": {
        "leftItems": ["爆炸範圍", "爆炸下限(LEL)", "爆炸上限(UEL)", "燃燒四面體", "昇華", "火源位置", "閃燃", "BLEVE", "復燃"],
        "pairs": [
            {"left": "爆炸範圍", "right": "可燃性氣體或粉塵在空氣中的燃燒濃度範圍"},
            {"left": "爆炸下限(LEL)", "right": "可燃性氣體或蒸氣之最低濃度界限"},
            {"left": "爆炸上限(UEL)", "right": "可燃性氣體或蒸氣之最高濃度界限"},
            {"left": "燃燒四面體", "right": "可燃物、助燃物、熱能、連續反應"},
            {"left": "昇華", "right": "固態物質直接轉化為氣態的過程"},
            {"left": "火源位置", "right": "室內燃燒產生火引之位置"},
            {"left": "閃燃", "right": "室內起火後一舉引火形成巨大火苗"},
            {"left": "BLEVE", "right": "沸騰液體膨脹蒸氣雲爆炸"},
            {"left": "復燃", "right": "缺氧狀態下持續燃燒，瞬間空氣進入產生爆炸"}
        ],
        "distractors": ["自燃", "引燃", "爆燃"]
    },
    "L35": {
        "leftItems": ["健康危害", "氧化性", "腐蝕性", "易燃", "爆炸", "加壓氣體", "急毒性", "水環境"],
        "pairs": [
            {"left": "健康危害", "right": "人體胸廓圖式"},
            {"left": "氧化性", "right": "圓圈火焰圖式"},
            {"left": "腐蝕性", "right": "手部腐蝕圖式"},
            {"left": "易燃", "right": "火焰圖式"},
            {"left": "爆炸", "right": "炸彈爆炸圖式"},
            {"left": "加壓氣體", "right": "鋼瓶圖式"},
            {"left": "急毒性", "right": "骷髏頭圖式"},
            {"left": "水環境", "right": "魚和樹圖式"}
        ],
        "distractors": ["放射性", "生物危害", "物理危害"]
    },
    "L36": {
        "leftItems": ["正己烷", "錳", "苯", "氯乙烯", "鉻酸"],
        "pairs": [
            {"left": "正己烷", "right": "多發性神經病變"},
            {"left": "錳", "right": "巴金森氏症"},
            {"left": "苯", "right": "白血病"},
            {"left": "氯乙烯", "right": "肝血管肉瘤"},
            {"left": "鉻酸", "right": "鼻中隔穿孔"}
        ],
        "distractors": ["鉛中毒", "水俁病", "痛痛病"]
    }
}

# ============================================================
# 🔧 核心類別
# ============================================================

class LinkRefiner:
    def __init__(self, config):
        self.config = config
        self.input_file = Path(config["INPUT_FILE"])
        self.distractors_count = config["DISTRACTORS_COUNT"]
        self.link_data = LINK_DATA
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
    
    def build_images_structure(self, left_items, right_items):
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
        if q_type not in ["link", "connection"]:
            return q
        
        answer = q.get("answer", [])
        if not answer or not isinstance(answer, list) or len(answer) == 0:
            self.stats["errors"].append(f"{q.get('id')}: answer 為空")
            return q
        
        q_id = q.get("id", "")
        
        if q_id in self.link_data:
            data = self.link_data[q_id]
            left_items = data.get("leftItems", [])
            pairs = data.get("pairs", [])
            distractors = data.get("distractors", [])
            self.stats["matched"] += 1
        else:
            labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
            left_items = labels[:len(answer)]
            pairs = [{"left": left_items[i], "right": answer[i]} for i in range(len(answer))]
            distractors = []
            self.stats["fallback"] += 1
        
        # 收集所有 right 值
        right_values = [p["right"] for p in pairs]
        
        # 加入干擾選項
        if distractors:
            selected_distractors = distractors[:self.distractors_count]
        else:
            fallback = ["干擾選項A", "干擾選項B", "干擾選項C"]
            random.shuffle(fallback)
            selected_distractors = fallback[:self.distractors_count]
        
        # 合併並隨機排列 rightItems
        all_right_items = right_values[:] + selected_distractors
        random.shuffle(all_right_items)
        
        # ✅ 強制覆蓋
        q["leftItems"] = left_items
        q["pairs"] = pairs
        q["rightItems"] = all_right_items
        
        if "images" not in q or q["images"] is None:
            q["images"] = self.build_images_structure(left_items, all_right_items)
        else:
            q["images"]["leftItems"] = {item: None for item in left_items}
            q["images"]["rightItems"] = {item: None for item in all_right_items}
        
        self.stats["processed"] += 1
        return q
    
    def run(self):
        print("\n" + "=" * 70)
        print("📚 連連看精煉器 v10.8.0 (強制覆蓋版)")
        print("   職責：強制覆蓋 leftItems / pairs / rightItems（含干擾選項）")
        print("=" * 70)
        print(f"\n🎯 干擾選項數量: {self.distractors_count} 個")
        print("⚠️ 將會強制覆蓋所有 existing leftItems / pairs / rightItems")
        
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
        data["Version"] = "10.8.0"
        
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
    refiner = LinkRefiner(CONFIG)
    refiner.run()