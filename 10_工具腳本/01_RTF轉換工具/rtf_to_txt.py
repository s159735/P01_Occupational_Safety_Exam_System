#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RTF 轉 TXT 轉換工具
用法: python rtf_to_txt.py [檔案路徑]
"""

import os
import sys
from pathlib import Path

def convert_rtf_to_txt(rtf_path):
    """將 RTF 檔案轉換為 TXT"""
    if not os.path.exists(rtf_path):
        print(f"❌ 檔案不存在: {rtf_path}")
        return False
    
    # 簡單的 RTF 轉 TXT（去除 RTF 標記）
    with open(rtf_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # 移除 RTF 標記
    import re
    content = re.sub(r'\\[a-z]+', ' ', content)
    content = re.sub(r'\{[^}]*\}', '', content)
    content = re.sub(r'\s+', ' ', content).strip()
    
    txt_path = rtf_path.with_suffix('.txt')
    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ 轉換完成: {txt_path}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python rtf_to_txt.py [RTF檔案路徑]")
        sys.exit(1)
    convert_rtf_to_txt(Path(sys.argv[1]))
