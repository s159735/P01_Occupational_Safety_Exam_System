#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
系統測試工具
用法: python 系統測試工具.py
"""

import subprocess
import sys
from pathlib import Path

def test_system():
    print("🧪 執行系統測試...")
    
    # 測試後端
    backend = Path(__file__).parent.parent / "02_後端伺服器" / "後端入口.js"
    if backend.exists():
        print("  ✅ 後端入口存在")
    else:
        print("  ❌ 後端入口不存在")
    
    # 測試前端
    frontend = Path(__file__).parent.parent / "06_前端應用層" / "系統主頁面.html"
    if frontend.exists():
        print("  ✅ 前端入口存在")
    else:
        print("  ❌ 前端入口不存在")
    
    print("✅ 系統測試完成")

if __name__ == "__main__":
    test_system()
