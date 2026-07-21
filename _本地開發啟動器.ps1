# ============================================================
# 🚀 本地開發啟動器 - 乙級職安衛模擬測驗系統
# 版本：10.2.1 (自動偵測版 + Chrome 無痕 + PID 修正)
# 更新日期：2026-07-20
# 用途：自動偵測專案根目錄，一鍵啟動後端 + Live Server + Chrome 無痕
# ============================================================

# ============================================================
# 1. 設定執行策略
# ============================================================
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "❌ 需要 PowerShell 5.0 或更高版本" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

if ((Get-ExecutionPolicy) -eq "Restricted") {
    Set-ExecutionPolicy RemoteSigned -Scope Process -Force
}

# ============================================================
# 2. 自動偵測專案根目錄
# ============================================================

function Find-ProjectRoot {
    param(
        [string]$StartPath = $PWD.Path,
        [string[]]$SearchPatterns = @(
            "05_後端伺服器",
            "04_應用層",
            "03_核心邏輯",
            "02_前端服務",
            "01_前端資源",
            "06_資料庫"
        )
    )
    
    $currentPath = $StartPath
    
    for ($i = 0; $i -lt 10; $i++) {
        $found = $true
        foreach ($pattern in $SearchPatterns) {
            $testPath = Join-Path $currentPath $pattern
            if (-not (Test-Path $testPath)) {
                $found = $false
                break
            }
        }
        
        if ($found) {
            Write-Host "   ✅ 自動偵測到專案根目錄:" -ForegroundColor Green
            Write-Host "      $currentPath" -ForegroundColor Cyan
            return $currentPath
        }
        
        $possibleProjectDirs = Get-ChildItem -Path $currentPath -Directory | Where-Object { $_.Name -match "^P01_" }
        if ($possibleProjectDirs.Count -eq 1) {
            $projectPath = $possibleProjectDirs[0].FullName
            Write-Host "   ✅ 自動偵測到專案資料夾:" -ForegroundColor Green
            Write-Host "      $projectPath" -ForegroundColor Cyan
            return $projectPath
        }
        
        if ($possibleProjectDirs.Count -gt 1) {
            Write-Host "   ⚠️ 找到多個可能的專案資料夾:" -ForegroundColor Yellow
            for ($j = 0; $j -lt $possibleProjectDirs.Count; $j++) {
                Write-Host "      [$j] $($possibleProjectDirs[$j].Name)"
            }
            $choice = Read-Host "   請選擇編號 (0-$($possibleProjectDirs.Count-1))"
            $selectedIndex = [int]$choice
            if ($selectedIndex -ge 0 -and $selectedIndex -lt $possibleProjectDirs.Count) {
                $projectPath = $possibleProjectDirs[$selectedIndex].FullName
                Write-Host "   ✅ 選擇: $projectPath" -ForegroundColor Cyan
                return $projectPath
            }
        }
        
        $parentPath = Split-Path $currentPath -Parent
        if ($parentPath -eq $currentPath) {
            break
        }
        $currentPath = $parentPath
    }
    
    Write-Host "   ⚠️ 無法自動偵測專案根目錄" -ForegroundColor Yellow
    $manualPath = Read-Host "   請手動輸入專案根目錄的完整路徑"
    if (Test-Path $manualPath) {
        return $manualPath
    } else {
        Write-Host "   ❌ 路徑不存在: $manualPath" -ForegroundColor Red
        exit 1
    }
}

# ============================================================
# 3. 執行自動偵測
# ============================================================

Clear-Host

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 本地開發啟動器 - 乙級職安衛模擬測驗系統              ║" -ForegroundColor Cyan
Write-Host "║  📌 版本: 10.2.1 (自動偵測版 + Chrome 無痕 + PID 修正)    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 正在自動偵測專案根目錄..." -ForegroundColor Yellow

$ScriptPath = Find-ProjectRoot

if (-not $ScriptPath) {
    Write-Host "❌ 無法找到專案根目錄" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

$BackendPath = Join-Path $ScriptPath "05_後端伺服器"
$FrontendFile = Join-Path $ScriptPath "04_應用層\系統主頁面.html"

# ============================================================
# 4. 檢查檔案
# ============================================================
Write-Host ""
Write-Host "📌 檢查檔案..." -ForegroundColor Yellow

if (-not (Test-Path $BackendPath)) {
    Write-Host "   ❌ 後端目錄不存在: $BackendPath" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

if (-not (Test-Path $FrontendFile)) {
    Write-Host "   ❌ 前端檔案不存在: $FrontendFile" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

Write-Host "   ✅ 檔案檢查通過" -ForegroundColor Green

# ============================================================
# 5. 檢查 Port 8001 是否被佔用
# ============================================================
Write-Host ""
Write-Host "📌 檢查 Port 8001..." -ForegroundColor Yellow

$portCheck = netstat -ano | findstr ":8001"
if ($portCheck) {
    Write-Host "   ⚠️ Port 8001 已被佔用" -ForegroundColor Yellow
    $pidMatch = [regex]::Match($portCheck, '\s+(\d+)$')
    if ($pidMatch.Success) {
        # ✅ 修正：將 $pid 改為 $targetPid
        $targetPid = $pidMatch.Groups[1].Value
        Write-Host "   📌 佔用行程 PID: $targetPid" -ForegroundColor Gray
        $response = Read-Host "   是否強制終止？(y/n)"
        if ($response -eq "y") {
            taskkill /PID $targetPid /F
            Write-Host "   ✅ 已終止行程 PID: $targetPid" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ✅ Port 8001 可用" -ForegroundColor Green
}

# ============================================================
# 6. 啟動後端
# ============================================================
Write-Host ""
Write-Host "📌 啟動後端服務 (完全離線模式)..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$BackendPath'; Write-Host '🚀 後端服務啟動中 (完全離線)...' -ForegroundColor Cyan; Write-Host '📡 http://localhost:8001/api/health' -ForegroundColor Gray; Write-Host '📚 從本地 JSON 載入題目' -ForegroundColor Gray; python 00_後端入口.py`""

Write-Host "   ⏳ 等待後端啟動 (5 秒)..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# ============================================================
# 7. 檢查後端
# ============================================================
Write-Host ""
Write-Host "📌 檢查後端狀態..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/api/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ 後端已就緒 (http://localhost:8001)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ 後端尚未就緒，請稍後手動刷新" -ForegroundColor Yellow
}

# ============================================================
# 8. 啟動 Live Server
# ============================================================
Write-Host ""
Write-Host "📌 啟動 Live Server 並開啟瀏覽器..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$ScriptPath'; Write-Host '🌐 Live Server 啟動中...' -ForegroundColor Cyan; Write-Host '📁 根目錄: $ScriptPath' -ForegroundColor Gray; npx live-server --port=5500 --no-browser`""

Write-Host "   ⏳ 等待 Live Server 啟動 (3 秒)..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# ============================================================
# 9. 開啟瀏覽器
# ============================================================
$frontendUrl = "http://127.0.0.1:5500/04_應用層/系統主頁面.html"
Write-Host "   🌐 開啟: $frontendUrl (Chrome 無痕模式)" -ForegroundColor Gray

Start-Process "chrome.exe" -ArgumentList "--incognito", $frontendUrl

# ============================================================
# 10. 完成
# ============================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ 啟動完成！                                              ║" -ForegroundColor Cyan
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  📡 後端: http://localhost:8001/api/health                  ║" -ForegroundColor Cyan
Write-Host "║  🌐 前端: $frontendUrl (無痕模式) ║" -ForegroundColor Cyan
Write-Host "║  📂 專案根目錄: $ScriptPath ║" -ForegroundColor Gray
Write-Host "║  📚 模式: 完全離線 (從本地 JSON 載入)                     ║" -ForegroundColor Green
Write-Host "║  💡 修改程式碼後儲存，瀏覽器會自動刷新                    ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ 本地開發環境已啟動（完全離線模式 + Chrome 無痕）！" -ForegroundColor Green
Write-Host ""
Write-Host "📌 按任意鍵關閉此視窗（後端和前端會繼續運行）" -ForegroundColor Gray
Read-Host