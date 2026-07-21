#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Python 工具選單 - 版本 9.0.0
用法: python 06_工具選單.py
"""

import os
import subprocess
import sys
from pathlib import Path

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def show_menu():
    print('''
╔══════════════════════════════════════════════════════╗
║     🐍 Python 工具選單 - 版本 9.0.0               ║
╠══════════════════════════════════════════════════════╣
║  1. 更新版本號                                      ║
║  2. 全系統健康檢查                                  ║
║  3. 修復編碼 (移除 BOM)                            ║
║  4. 顯示記憶索引                                    ║
║  5. 退出                                            ║
╚══════════════════════════════════════════════════════╝
    ''')

def show_memory_index():
    """顯示記憶索引檔案內容"""
    root = Path(__file__).parent.parent.parent
    index_file = root / "08_文件與規範" / "12_路徑記憶" / "03_快速參照表.md"
    
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
            print('')
            print('═' * 50)
            print(content)
            print('═' * 50)
    else:
        print('⚠️ 記憶索引檔案不存在，請先執行自動檢查偵測記憶系統')
    
    input('\n按 Enter 繼續...')

def main():
    while True:
        clear_screen()
        show_menu()
        choice = input('請選擇 (1-5): ').strip()
        
        if choice == '1':
            v = input('請輸入新版本號 (例如 9.0.1): ')
            if v:
                subprocess.run([sys.executable, '01_版本號更新器.py', v])
            input('按 Enter 繼續...')
        elif choice == '2':
            subprocess.run([sys.executable, '02_系統檢查.py'])
            input('按 Enter 繼續...')
        elif choice == '3':
            subprocess.run([sys.executable, '03_編碼修復器.py'])
            input('按 Enter 繼續...')
        elif choice == '4':
            show_memory_index()
        elif choice == '5':
            print('👋 再見！')
            break
        else:
            print('❌ 無效的選擇')
            input('按 Enter 繼續...')

if __name__ == '__main__':
    main()
