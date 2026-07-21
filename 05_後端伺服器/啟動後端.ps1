# ============================================================
# 🚀 啟動後端（顏色過濾版）
# ============================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║  📡 FastAPI 後端啟動中...                                    ║"
Write-Host "║  📍 http://localhost:8001/api/health                        ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

# 啟動後端，過濾顏色
python 00_後端入口.py 2>&1 | ForEach-Object {
    $line = $_
    if ($line -match "INFO") {
        Write-Host $line -ForegroundColor Gray
    } elseif ($line -match "ERROR|Traceback|ModuleNotFoundError|Exception") {
        Write-Host $line -ForegroundColor Red
    } elseif ($line -match "WARNING|DeprecationWarning") {
        Write-Host $line -ForegroundColor Yellow
    } else {
        Write-Host $line
    }
}