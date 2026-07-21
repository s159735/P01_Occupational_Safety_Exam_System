#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
目錄驗證工具
用法: python 目錄驗證工具.py
"""

import os
from pathlib import Path

def verify_directories():
    root = Path(__file__).parent.parent
    required = [
        "00_核心引擎", "01_系統管理工具", "02_後端伺服器",
        "03_前端資源庫", "04_前端服務模組", "05_前端核心邏輯",
        "06_前端應用層", "07_資料庫", "08_文件與規範",
        "09_工具腳本集", "11_備份歸檔", "12_日誌記錄"
    ]
    
    print("🔍 驗證目錄結構...")
    for d in required:
        if (root / d).exists():
            print(f"  ✅ {d}")
        else:
            print(f"  ❌ {d} 不存在")

if __name__ == "__main__":
    verify_directories()
