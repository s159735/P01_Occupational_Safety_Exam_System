#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新規範文件工具
用法: python 更新規範文件.py
"""

import os
from pathlib import Path

def update_specs():
    print("📄 更新規範文件...")
    root = Path(__file__).parent.parent.parent
    docs_dir = root / "08_文件與規範"
    
    if docs_dir.exists():
        print(f"  ✅ 找到規範目錄: {docs_dir}")
        for f in docs_dir.glob("*.txt"):
            print(f"    📄 {f.name}")
    else:
        print("  ❌ 找不到規範目錄")

if __name__ == "__main__":
    update_specs()
