#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全系統健康檢查器
用法: python 02_系統檢查.py
"""

from pathlib import Path

def check_system():
    root = Path(__file__).parent.parent.parent
    results = {'total': 0, 'missing': [], 'bom': []}
    
    core_files = [
        '06_前端應用層/系統主頁面.html',
        '05_前端核心邏輯/04_作答記錄管理器.js',
        '05_前端核心邏輯/21_系統_初始化.js',
        '05_前端核心邏輯/36_渲染_主入口.js'
    ]
    
    for f in core_files:
        path = root / f
        if path.exists():
            results['total'] += 1
        else:
            results['missing'].append(f)
    
    for ext in ['*.html', '*.js', '*.py', '*.json']:
        for f in root.rglob(ext):
            try:
                with open(f, 'rb') as fp:
                    if fp.read(3) == b'\xef\xbb\xbf':
                        results['bom'].append(str(f.relative_to(root)))
            except:
                pass
    
    print('')
    print('╔══════════════════════════════════════════════════════╗')
    print('║     🔍 全系統健康檢查報告                           ║')
    print('╚══════════════════════════════════════════════════════╝')
    print('')
    print(f'  檢查核心檔案 : {results["total"]} 個')
    print(f'  遺失檔案     : {len(results["missing"])} 個')
    print(f'  BOM 問題     : {len(results["bom"])} 個')
    print('')
    
    if results['missing']:
        print('⚠️ 遺失檔案：')
        for f in results['missing']:
            print(f'    ❌ {f}')
    
    if results['bom']:
        print('⚠️ 有 BOM 的檔案：')
        for f in results['bom']:
            print(f'    ❌ {f}')
    
    if not results['missing'] and not results['bom']:
        print('✅ 系統健康狀態：良好')
    else:
        print('⚠️ 系統健康狀態：需要修復')

if __name__ == '__main__':
    check_system()
