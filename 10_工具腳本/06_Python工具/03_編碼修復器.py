#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
編碼修復器 - 移除 BOM
用法: python 03_編碼修復器.py
"""

from pathlib import Path

def fix_bom(file_path):
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        if content.startswith(b'\xef\xbb\xbf'):
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content[3:].decode('utf-8', errors='ignore'))
            return True
        return False
    except Exception as e:
        return False

if __name__ == '__main__':
    root = Path(__file__).parent.parent.parent
    print('🔧 開始修復編碼 (移除 BOM)...')
    fixed = 0
    
    for ext in ['*.html', '*.js', '*.json', '*.py', '*.md', '*.txt']:
        for f in root.rglob(ext):
            if fix_bom(f):
                print(f'  ✅ {f.relative_to(root)}')
                fixed += 1
    
    print('')
    print(f'✅ 完成！共修復 {fixed} 個檔案')
