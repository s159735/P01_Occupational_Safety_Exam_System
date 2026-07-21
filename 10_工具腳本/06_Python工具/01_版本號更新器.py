#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
版本號更新器 v2.0
用法: python 01_版本號更新器.py [新版本號]
範例: python 01_版本號更新器.py 9.0.1
"""

import sys
from pathlib import Path

def update_version(file_path, old_ver, new_ver):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        new_content = content.replace(f'?v={old_ver}', f'?v={new_ver}')
        new_content = new_content.replace(f'v={old_ver}', f'v={new_ver}')
        new_content = new_content.replace(f'版本：{old_ver}', f'版本：{new_ver}')
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('用法: python 01_版本號更新器.py [新版本號]')
        sys.exit(1)
    
    new_ver = sys.argv[1]
    old_ver = '9.0.0'
    root = Path(__file__).parent.parent.parent
    
    print(f'🚀 版本號更新: {old_ver} → {new_ver}')
    print(f'📁 專案目錄: {root}')
    print('')
    
    updated = 0
    for ext in ['*.html', '*.js', '*.json', '*.md', '*.txt']:
        for f in root.rglob(ext):
            if update_version(f, old_ver, new_ver):
                print(f'  ✅ {f.relative_to(root)}')
                updated += 1
    
    print('')
    print(f'✅ 完成！共更新 {updated} 個檔案')
