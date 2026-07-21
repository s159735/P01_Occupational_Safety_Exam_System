#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
資料庫遷移腳本：JSON → PostgreSQL
執行方式：python 06_資料庫/migrations/migrate_to_postgres.py
"""

import os
import sys
import json
from pathlib import Path

# 加入專案根目錄
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import psycopg2
    from sqlalchemy import create_engine, Column, Integer, String, Text, JSON, DateTime, Boolean, BigInteger
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker
    import pandas as pd
except ImportError as e:
    print(f"❌ 缺少依賴: {e}")
    print("請執行: pip install psycopg2-binary sqlalchemy pandas")
    sys.exit(1)

# ============================================================
# 設定
# ============================================================

DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'cbt_db',
    'user': 'cbt_user',
    'password': 'cbt_pass'
}

# 嘗試從環境變數讀取
DB_CONFIG['host'] = os.getenv('DB_HOST', 'localhost')
DB_CONFIG['port'] = int(os.getenv('DB_PORT', 5432))
DB_CONFIG['database'] = os.getenv('DB_NAME', 'cbt_db')
DB_CONFIG['user'] = os.getenv('DB_USER', 'cbt_user')
DB_CONFIG['password'] = os.getenv('DB_PASS', 'cbt_pass')

Base = declarative_base()

# ============================================================
# 資料模型
# ============================================================

class Question(Base):
    __tablename__ = 'questions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(String(20), unique=True, nullable=False)
    type = Column(String(20), nullable=False)
    type_label = Column(String(50))
    mode = Column(String(20))
    logic_tag = Column(String(50))
    law_pcode = Column(String(20))
    question_data = Column(JSON, nullable=False)
    difficulty = Column(Integer, default=0)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime)

class Law(Base):
    __tablename__ = 'laws'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    pcode = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    display_name = Column(String(200))
    level = Column(String(50))
    category = Column(String(50))
    url = Column(String(500))
    law_data = Column(JSON)
    created_at = Column(DateTime)

class LawArticle(Base):
    __tablename__ = 'law_articles'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    law_id = Column(Integer, nullable=False)
    article_no = Column(String(50), nullable=False)
    article_type = Column(String(10))
    content = Column(Text)
    structured_content = Column(JSON)
    created_at = Column(DateTime)

# ============================================================
# 主要遷移函數
# ============================================================

def get_engine():
    """取得資料庫引擎"""
    return create_engine(
        f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    )

def create_tables():
    """建立資料表"""
    engine = get_engine()
    Base.metadata.create_all(engine)
    print("✅ 資料表已建立")

def migrate_questions():
    """遷移題庫資料"""
    print("📝 遷移題庫資料...")
    
    question_dir = Path(__file__).parent.parent / "06_資料庫" / "06_完整題庫"
    if not question_dir.exists():
        print(f"⚠️ 題庫目錄不存在: {question_dir}")
        return 0
    
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()
    
    count = 0
    mode_map = {
        '單選題': 'academic',
        '複選題': 'academic',
        '是非題': 'academic',
        '計算題': 'technical',
        '配合題': 'technical',
        '排序題': 'technical',
        '連連看': 'technical',
        '填空題': 'technical'
    }
    
    for json_file in question_dir.glob("*.json"):
        mode = mode_map.get(json_file.stem, 'academic')
        print(f"  處理: {json_file.name}")
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            questions = data.get('questions', [])
            for q in questions:
                # 提取 law.pcode
                law_pcode = ''
                if isinstance(q.get('law'), dict):
                    law_pcode = q.get('law', {}).get('pcode', '')
                
                question = Question(
                    question_id=q.get('id', ''),
                    type=q.get('type', 'single'),
                    type_label=q.get('typeLabel', ''),
                    mode=mode,
                    logic_tag=q.get('logicTag', ''),
                    law_pcode=law_pcode,
                    question_data=q,
                    created_at=pd.Timestamp.now()
                )
                session.add(question)
                count += 1
            
            session.commit()
            print(f"    ✅ 已匯入 {len(questions)} 題")
        except Exception as e:
            print(f"    ❌ 錯誤: {e}")
            session.rollback()
    
    session.close()
    print(f"✅ 題庫遷移完成，共 {count} 題")
    return count

def migrate_laws():
    """遷移法規資料"""
    print("📝 遷移法規資料...")
    
    law_file = Path(__file__).parent.parent / "06_資料庫" / "07_法規資料庫" / "法規資料庫.json"
    if not law_file.exists():
        print(f"⚠️ 法規檔案不存在: {law_file}")
        return 0
    
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        with open(law_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        laws = data.get('Laws', [])
        count = 0
        
        for law_data in laws:
            law = Law(
                pcode=law_data.get('PCode', ''),
                name=law_data.get('LawName', ''),
                display_name=law_data.get('LawDisplayName', ''),
                level=law_data.get('LawLevel', ''),
                category=law_data.get('LawCategory', ''),
                url=law_data.get('LawURL', ''),
                law_data=law_data,
                created_at=pd.Timestamp.now()
            )
            session.add(law)
            session.flush()
            
            # 遷移條文
            articles = law_data.get('LawArticles', [])
            for article_data in articles:
                article = LawArticle(
                    law_id=law.id,
                    article_no=article_data.get('ArticleNo', ''),
                    article_type=article_data.get('ArticleType', 'A'),
                    content=article_data.get('ArticleContent', ''),
                    structured_content=article_data.get('StructuredContent', []),
                    created_at=pd.Timestamp.now()
                )
                session.add(article)
            
            count += 1
            if count % 50 == 0:
                print(f"  已處理 {count} 部法規...")
        
        session.commit()
        print(f"✅ 法規遷移完成，共 {count} 部法規")
        return count
    except Exception as e:
        print(f"❌ 錯誤: {e}")
        session.rollback()
        return 0
    finally:
        session.close()

# ============================================================
# 主程式
# ============================================================

def main():
    print("🗄️ 開始資料庫遷移: JSON → PostgreSQL")
    print("=" * 50)
    print(f"📁 專案目錄: {Path(__file__).parent.parent}")
    print(f"📊 資料庫: {DB_CONFIG['database']} @ {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print("=" * 50)
    
    # 建立資料表
    create_tables()
    
    # 遷移題庫
    question_count = migrate_questions()
    
    # 遷移法規
    law_count = migrate_laws()
    
    print("=" * 50)
    print("✅ 遷移完成！")
    print(f"   📚 題庫: {question_count} 題")
    print(f"   📖 法規: {law_count} 部")

if __name__ == "__main__":
    main()
