# ============================================================
# 🚀 FastAPI 後端入口 - 乙級職安衛模擬測驗系統 v10.2.0
# 技術棧：FastAPI + SQLAlchemy + PostgreSQL (Supabase)
# 版本：10.2.0
# 更新日期：2026-07-18
# 
# ✅ 修復項目：
#   1. 補齊 typeLabel、typePrefix、stem、pointsPerItem
#   2. 完整 law 結構傳遞
#   3. 符合 06_題庫格式規範.txt
#   4. 🆕 完全離線模式：從本地 JSON 檔案載入題目（不依賴 Supabase）
# ============================================================

import os
import json
import random
from datetime import datetime
from typing import Optional, List, Any
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# ✅ SQLAlchemy 2.0 正確導入
from sqlalchemy import create_engine, Column, Integer, String, Text, JSON, DateTime, Float, Boolean, Index, func, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.exc import SQLAlchemyError

# 載入環境變數
load_dotenv()

# ============================================================
# 資料庫連線設定（保留但不強制使用）
# ============================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres.zbajabhiewzciqnbajnn:s0313035S0981716363@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============================================================
# 🆕 題型對應表（符合 06_題庫格式規範.txt）
# ============================================================

TYPE_LABEL_MAP = {
    'single': '選擇題(單選題)',
    'multiple': '選擇題(複選題)',
    'truefalse': '是非題',
    'fill': '填空題',
    'calc': '計算題',
    'match': '配合題',
    'sequencing': '排序題',
    'link': '連連看'
}

TYPE_PREFIX_MAP = {
    'single': 'S',
    'multiple': 'M',
    'truefalse': 'T',
    'fill': 'F',
    'calc': 'C',
    'match': 'P',
    'sequencing': 'Q',
    'link': 'L'
}

# ============================================================
# 資料模型（保留，未來若要切回 Supabase 時使用）
# ============================================================

class QuestionModel(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(String(50), unique=True, index=True)
    type = Column(String(20))
    type_label = Column(String(50))
    type_prefix = Column(String(10))
    text = Column(Text)
    options = Column(JSON)
    answer = Column(JSON)
    group_num = Column(Integer)
    stem = Column(Text)
    mode = Column(String(20))
    category = Column(String(50))
    difficulty = Column(Integer, default=1)
    points = Column(String(20))
    points_per_item = Column(String(20))
    
    # 解析相關
    explanation = Column(JSON)
    law_ref = Column(JSON)
    tips = Column(JSON)
    logic_tags = Column(JSON)
    spec = Column(JSON)
    
    # 計算題專用
    formula_key = Column(String(50))
    formula_params = Column(JSON)
    
    # 配合題/連連看專用
    match_items = Column(JSON)
    pairs = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_question_mode', 'mode'),
        Index('idx_question_type', 'type'),
    )

class LawModel(Base):
    __tablename__ = "laws"
    
    id = Column(Integer, primary_key=True, index=True)
    pcode = Column(String(20), unique=True, index=True)
    name = Column(String(200))
    display_name = Column(String(200))
    level = Column(String(50))
    category = Column(String(200))
    url = Column(String(500))
    law_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class ExamSessionModel(Base):
    __tablename__ = "exam_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), unique=True, index=True)
    mode = Column(String(20))
    user_id = Column(String(50))
    answers = Column(JSON)
    score = Column(Float)
    is_completed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

# ============================================================
# Pydantic 回應模型
# ============================================================

class QuestionResponse(BaseModel):
    id: str
    type: str
    typeLabel: str
    typePrefix: str
    text: str
    options: List[str]
    answer: Any
    points: str
    pointsPerItem: Optional[str] = None
    group: Optional[int] = 1
    stem: Optional[str] = "試回答下列問題："
    imageUrl: Optional[str] = None
    law: Optional[dict] = None
    explanation: Optional[dict] = None
    tips: Optional[dict] = None
    logic: Optional[List] = None
    spec: Optional[dict] = None
    mode: Optional[str] = "academic"
    blanks: Optional[List] = None
    formulaKey: Optional[str] = None
    formulaParams: Optional[dict] = None
    leftItems: Optional[List] = None
    rightItems: Optional[List] = None
    pairs: Optional[List] = None

# ============================================================
# 題型權重定義（用於術科混合題配分）
# ============================================================

TYPE_WEIGHT = {
    'match': 2.0,
    'sequencing': 1.8,
    'fill': 1.5,
    'link': 1.2,
    'multiple': 1.3,
    'truefalse': 0.9,
    'calc': 2.0,
    'single': 1.0,
}

# ============================================================
# 建立 FastAPI 應用
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 應用啟動中...")
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        print("✅ 資料庫連線成功")
        db.close()
    except Exception as e:
        print(f"⚠️ 資料庫連線失敗: {e}")
        print("📌 系統將使用離線模式（從本地 JSON 載入題目）")
    
    print("📊 檢查並建立資料庫表格...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ 資料庫表格已確認")
    except Exception as e:
        print(f"⚠️ 建立表格失敗: {e}")
    
    yield
    
    print("🛑 應用關閉中...")


app = FastAPI(
    title="乙級職安衛模擬測驗系統 API",
    description="國家考試規格模擬測驗系統後端",
    version="10.2.0",
    lifespan=lifespan
)

# ============================================================
# CORS 設定
# ============================================================

ALLOWED_ORIGINS = [
    "http://localhost:8001",
    "http://localhost:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://*.onrender.com",
]

frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 資料庫依賴（保留，未來若要切回 Supabase 時使用）
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================
# ✅ 輔助函數 - 轉換題目格式（完整版）
# ============================================================

def convert_question(q, points="10%"):
    """
    將題目轉換為前端格式（符合 06_題庫格式規範.txt）
    
    修復內容：
    1. typeLabel 從 TYPE_LABEL_MAP 取得
    2. typePrefix 從 TYPE_PREFIX_MAP 取得
    3. stem 預設為「試回答下列問題：」
    4. pointsPerItem 自動計算（多子題時）
    5. 完整 law 結構傳遞
    """
    
    # ---- 1. 處理基本欄位 ----
    
    answer = q.get('answer')
    options = q.get('options', [])
    
    # ---- 2. 獲取題型對應 ----
    
    q_type = q.get('type', 'single')
    type_label = q.get('typeLabel') or TYPE_LABEL_MAP.get(q_type, '')
    type_prefix = q.get('typePrefix') or TYPE_PREFIX_MAP.get(q_type, '')
    
    # ---- 3. 計算子題配分（pointsPerItem） ----
    
    points_per_item = q.get('pointsPerItem')
    if not points_per_item:
        if q.get('answer') and isinstance(q.get('answer'), list) and len(q.get('answer')) > 1:
            total_points = float(points.replace('%', ''))
            points_per_item = str(round(total_points / len(q.get('answer')), 2)) + '%'
        elif q_type in ['match', 'sequencing'] and q.get('options'):
            total_points = float(points.replace('%', ''))
            points_per_item = str(round(total_points / len(q.get('options')), 2)) + '%'
    
    # ---- 4. 處理 stem ----
    
    stem = q.get('stem') or "試回答下列問題："
    
    # ---- 5. 處理 law（完整結構） ----
    
    law = q.get('law') or {}
    if isinstance(law, str):
        try:
            law = json.loads(law)
        except:
            law = {}
    
    # 確保 law 有完整結構
    if not isinstance(law, dict):
        law = {}
    if 'pcode' not in law:
        law['pcode'] = ''
    if 'name' not in law:
        law['name'] = ''
    if 'article' not in law:
        law['article'] = {}
    if 'summary' not in law:
        law['summary'] = ''
    
    # ---- 6. 處理題型專用欄位 ----
    
    blanks = q.get('blanks') or None
    formula_key = q.get('formulaKey') or None
    formula_params = q.get('formulaParams') or {}
    left_items = q.get('leftItems') or None
    right_items = q.get('rightItems') or None
    pairs = q.get('pairs') or None
    
    # ---- 7. 處理解析相關欄位 ----
    
    explanation = q.get('explanation') or {}
    tips = q.get('tips') or {}
    logic = q.get('logic') or []
    spec = q.get('spec') or {}
    
    # ---- 8. 返回完整題目物件 ----
    
    return {
        "id": q.get('id') or "",
        "type": q_type,
        "typeLabel": type_label,
        "typePrefix": type_prefix,
        "text": q.get('text') or "",
        "options": options if options else [],
        "answer": answer,
        "points": points,
        "pointsPerItem": points_per_item,
        "group": q.get('group') or 1,
        "stem": stem,
        "imageUrl": q.get('imageUrl') or None,
        "law": law,
        "explanation": explanation,
        "tips": tips,
        "logic": logic,
        "spec": spec,
        "mode": q.get('mode') or "academic",
        "blanks": blanks,
        "formulaKey": formula_key,
        "formulaParams": formula_params,
        "leftItems": left_items,
        "rightItems": right_items,
        "pairs": pairs
    }

# ============================================================
# 🆕 從本地 JSON 載入題目（完全離線模式）
# ============================================================

def load_questions_from_json(mode: str):
    """從本地 JSON 檔案載入題目（完全離線，不依賴 Supabase）"""
    
    # 1. 定義題庫檔案路徑
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    question_dir = os.path.join(project_root, "06_資料庫", "06_完整題庫")
    
    # 2. 根據 mode 決定要載入哪些題型
    type_mapping = {
        "academic": {
            "files": ["單選題.json", "複選題.json", "是非題.json"],
            "quota": 80,
            "label": "學科"
        },
        "technical": {
            "files": ["計算題.json", "配合題.json", "填空題.json", "排序題.json", "複選題.json", "是非題.json", "連連看.json"],
            "quota": 10,
            "label": "術科"
        },
        "calc": {
            "files": ["計算題.json"],
            "quota": 20,
            "label": "計算練習"
        }
    }
    
    config = type_mapping.get(mode, type_mapping["academic"])
    type_files = config["files"]
    total_quota = config["quota"]
    mode_label = config["label"]
    
    print(f"📚 載入模式: {mode_label} (完全離線模式)")
    print(f"   📂 題庫目錄: {question_dir}")
    print(f"   📋 目標: {total_quota} 題")
    
    all_questions = []
    
    for filename in type_files:
        filepath = os.path.join(question_dir, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    questions = data.get("questions", [])
                    all_questions.extend(questions)
                    print(f"   ✅ {filename}: {len(questions)} 題")
            except Exception as e:
                print(f"   ⚠️ 讀取 {filename} 失敗: {str(e)}")
        else:
            print(f"   ⚠️ 檔案不存在: {filepath}")
    
    if not all_questions:
        print("❌ 沒有載入任何題目，請檢查題庫檔案是否存在")
        return []
    
    print(f"   📊 總共載入: {len(all_questions)} 題")
    
    # 轉換為前端格式
    result = []
    for q in all_questions:
        try:
            converted = convert_question(q)
            result.append(converted)
        except Exception as e:
            print(f"   ⚠️ 轉換題目失敗: {e}")
            continue
    
    # 隨機抽題
    sample_size = min(total_quota, len(result))
    selected = random.sample(result, sample_size)
    
    print(f"   ✅ 隨機抽取 {len(selected)} 題 ({mode_label})")
    
    return selected

# ============================================================
# 🆕 從本地 JSON 載入法規（完全離線模式）
# ============================================================

def load_laws_from_json():
    """從本地 JSON 檔案載入法規（完全離線，不依賴 Supabase）"""
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    law_file = os.path.join(project_root, "06_資料庫", "07_法規資料庫", "ChLaw_完整版.json")
    
    if not os.path.exists(law_file):
        print(f"⚠️ 法規檔案不存在: {law_file}")
        return []
    
    try:
        with open(law_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            laws = data.get("Laws", [])
            print(f"📚 從本地載入法規: {len(laws)} 部")
            return laws
    except Exception as e:
        print(f"⚠️ 讀取法規檔案失敗: {str(e)}")
        return []

# ============================================================
# API 端點
# ============================================================

@app.get("/api/health")
async def health_check():
    """健康檢查端點"""
    return {
        "success": True,
        "status": "ok",
        "version": "10.2.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/questions")
async def get_questions(
    mode: str = Query("academic", description="考試模式: academic/technical/calc"),
    limit: Optional[int] = Query(None, description="限制題數"),
    db: Session = Depends(get_db)
):
    """
    取得題目（完全離線模式 - 從本地 JSON 載入）
    
    此版本不依賴 Supabase 資料庫，直接從本地 JSON 檔案讀取題目。
    優點：開發時完全離線，速度快，不受網路影響。
    """
    try:
        selected = load_questions_from_json(mode)
        
        if not selected:
            return {"success": False, "error": "題庫檔案不存在或為空", "data": []}
        
        return {"success": True, "data": selected, "total": len(selected)}
        
    except Exception as e:
        print(f"❌ 載入題目失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}

@app.get("/api/laws")
async def get_laws(
    pcode: Optional[str] = Query(None, description="法規代碼"),
    db: Session = Depends(get_db)
):
    """
    取得法規資料（完全離線模式 - 從本地 JSON 載入）
    """
    try:
        laws = load_laws_from_json()
        
        if not laws:
            return {"success": True, "data": [], "total": 0}
        
        # 如果指定了 pcode，進行過濾
        if pcode:
            laws = [law for law in laws if law.get("PCode") == pcode]
        
        result = []
        for law in laws:
            law_data = {
                "pcode": law.get("PCode") or "",
                "name": law.get("LawName") or "",
                "display_name": law.get("LawDisplayName") or law.get("LawName") or "",
                "level": law.get("LawLevel") or "",
                "category": law.get("LawCategory") or "",
                "data": law
            }
            result.append(law_data)
        
        return {"success": True, "data": result, "total": len(result)}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}

@app.get("/api/modes")
async def get_modes():
    """取得所有模式及其題型配額說明"""
    return {
        "success": True,
        "data": {
            "academic": {
                "label": "學科",
                "types": ["single", "multiple", "truefalse"],
                "quota": {"single": 50, "multiple": 20, "truefalse": 10},
                "total": 80,
                "description": "單選題 50 題 + 複選題 20 題 + 是非題 10 題"
            },
            "technical": {
                "label": "術科",
                "types": ["calc", "match", "fill", "sequencing", "multiple", "truefalse", "link"],
                "quota": {"calc": 2, "match": "1~2", "fill": "1~2", "sequencing": "1~2", "multiple": "1~2", "truefalse": 1, "link": 1},
                "total": "8~11",
                "description": "計算2 + 配合1~2 + 填空1~2 + 排序1~2 + 複選1~2 + 是非1 + 連連看1"
            },
            "calc": {
                "label": "計算練習",
                "types": ["calc"],
                "quota": {"calc": 20},
                "total": 20,
                "description": "計算題 20 題"
            }
        }
    }

@app.post("/api/submit-exam")
async def submit_exam(
    mode: str = Query(..., description="考試模式"),
    answers: dict = {},
    time_spent: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """提交考試答案（保留原有邏輯）"""
    try:
        # 從本地 JSON 載入題目進行比對
        questions = load_questions_from_json(mode)
        
        if not questions:
            return {"success": False, "error": "無法載入題目"}
        
        total_correct = 0
        total_questions = len(questions)
        
        for i, q in enumerate(questions):
            user_answer = answers.get(str(i))
            if user_answer is not None:
                correct_answer = q.get('answer')
                if isinstance(correct_answer, list):
                    if isinstance(user_answer, list) and sorted(user_answer) == sorted(correct_answer):
                        total_correct += 1
                else:
                    if str(user_answer) == str(correct_answer):
                        total_correct += 1
        
        score = round((total_correct / total_questions) * 100, 1) if total_questions > 0 else 0
        
        return {
            "success": True,
            "data": {
                "mode": mode,
                "total": total_questions,
                "correct": total_correct,
                "score": score,
                "time_spent": time_spent
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================
# 🆕 新增端點：獲取題庫統計
# ============================================================

@app.get("/api/stats")
async def get_stats():
    """取得題庫統計資訊（從本地 JSON 載入）"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(current_dir)
        question_dir = os.path.join(project_root, "06_資料庫", "06_完整題庫")
        
        stats = {}
        total = 0
        
        files = ["單選題.json", "複選題.json", "是非題.json", "填空題.json", 
                 "計算題.json", "配合題.json", "排序題.json", "連連看.json"]
        
        for filename in files:
            filepath = os.path.join(question_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    count = len(data.get("questions", []))
                    type_name = filename.replace(".json", "")
                    stats[type_name] = count
                    total += count
        
        return {
            "success": True,
            "data": {
                "total": total,
                "by_type": stats,
                "source": "本地 JSON 檔案"
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================
# 啟動
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    print("📊 檢查資料庫表格...")
    Base.metadata.create_all(bind=engine)
    print("✅ 資料庫表格已確認")
    
    print("=" * 60)
    print("🚀 FastAPI 後端啟動中...")
    print("📡 http://localhost:8001/api/health")
    print("📚 http://localhost:8001/api/modes")
    print("📋 版本: 10.2.0")
    print("✅ 完全離線模式已啟用（從本地 JSON 載入題目）")
    print("   - 學科: 單選50 + 複選20 + 是非10 = 80 題")
    print("   - 術科: 計算2 + 配合1~2 + 填空1~2 + 排序1~2 + 複選1~2 + 是非1 + 連連看1")
    print("   - 計算: 計算20 題")
    print("=" * 60)
    
    uvicorn.run(
        "00_後端入口:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )