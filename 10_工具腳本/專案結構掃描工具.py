#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
專案結構掃描工具
用法: python 專案結構掃描工具.py
"""

import os
from pathlib import Path

def scan_structure():
    root = Path(__file__).parent.parent
    print("📊 專案結構掃描...")
    
    for item in sorted(root.iterdir()):
        if item.is_dir():
            count = len(list(item.rglob("*"))) if not item.name.startswith(".") else 0
            print(f"  📁 {item.name}: {count} 個項目")

if __name__ == "__main__":
    scan_structure()
