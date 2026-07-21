# ============================================================
# 🚀 通用型開發啟動器 - 乙級職安衛模擬測驗系統
# 版本：10.3.1 (無虛擬環境版)
# 特色：多重 Python 偵測 / 跨使用者支援 / 自動 Port 管理
# 更新：移除虛擬環境依賴，直接使用系統 Python
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
# 2. 顏色設定
# ============================================================
$colors = @{
    success = "Green"
    error = "Red"
    warning = "Yellow"
    info = "Cyan"
    highlight = "Magenta"
    gray = "Gray"
}

# ============================================================
# 3. 多重 Python 偵測（跨使用者）
# ============================================================
function Find-Python {
    Write-Host "🔍 正在偵測 Python..." -ForegroundColor $colors.warning
    
    $foundPaths = @()
    $pythonPaths = @()
    
    # 【嘗試 1】系統 PATH 中的 python
    $pythonPaths += { 
        try {
            $p = (Get-Command python -ErrorAction SilentlyContinue).Source
            if ($p -and (Test-Path $p)) { return $p }
        } catch {}
        return $null 
    }
    
    # 【嘗試 2】Windows Store Python
    $pythonPaths += { 
        $p = "$env:LOCALAPPDATA\Microsoft\WindowsApps\python.exe"
        if (Test-Path $p) { return $p }
        return $null 
    }
    
    # 【嘗試 3】系統安裝路徑（所有版本）
    $pythonPaths += { 
        $versions = @("313", "312", "311", "310", "39", "38")
        foreach ($ver in $versions) {
            $paths = @(
                "C:\Program Files\Python\Python$ver\python.exe",
                "C:\Program Files (x86)\Python\Python$ver\python.exe",
                "$env:LOCALAPPDATA\Programs\Python\Python$ver\python.exe",
                "$env:USERPROFILE\AppData\Local\Programs\Python\Python$ver\python.exe"
            )
            foreach ($p in $paths) {
                if (Test-Path $p) { return $p }
            }
        }
        return $null 
    }
    
    # 【嘗試 4】Anaconda / Miniconda
    $pythonPaths += { 
        $condaPaths = @(
            "$env:USERPROFILE\anaconda3\python.exe",
            "$env:USERPROFILE\miniconda3\python.exe",
            "C:\ProgramData\Anaconda3\python.exe",
            "C:\ProgramData\Miniconda3\python.exe"
        )
        foreach ($p in $condaPaths) {
            if (Test-Path $p) { return $p }
        }
        # 嘗試萬用字元
        $userConda = Get-ChildItem "C:\Users\*\anaconda3\python.exe" -ErrorAction SilentlyContinue
        if ($userConda) { return $userConda[0].FullName }
        $userMiniconda = Get-ChildItem "C:\Users\*\miniconda3\python.exe" -ErrorAction SilentlyContinue
        if ($userMiniconda) { return $userMiniconda[0].FullName }
        return $null 
    }
    
    # 【嘗試 5】環境變數
    $pythonPaths += { 
        if ($env:PYTHON_HOME) {
            $p = "$env:PYTHON_HOME\python.exe"
            if (Test-Path $p) { return $p }
        }
        return $null 
    }
    
    # 【嘗試 6】py 啟動器
    $pythonPaths += { 
        try {
            $py = (Get-Command py -ErrorAction SilentlyContinue).Source
            if ($py -and (Test-Path $py)) { return $py }
        } catch {}
        return $null 
    }
    
    # 【嘗試 7】where 命令（最後手段）
    $pythonPaths += { 
        try {
            $result = where python 2>$null
            if ($result) {
                $first = ($result -split "`n")[0].Trim()
                if (Test-Path $first) { return $first }
            }
        } catch {}
        return $null 
    }
    
    # 執行所有偵測
    foreach ($pathExpr in $pythonPaths) {
        try {
            $path = & $pathExpr
            if ($path -and (Test-Path $path)) {
                $foundPaths += $path
                Write-Host "   ✅ 找到 Python: $path" -ForegroundColor $colors.success
                break
            }
        } catch {}
    }
    
    # 如果都沒找到
    if (-not $foundPaths) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
        Write-Host "║  ❌ 無法找到 Python！                                      ║" -ForegroundColor Red
        Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Red
        Write-Host "║  📌 請手動安裝 Python 或設定 PATH：                         ║" -ForegroundColor Yellow
        Write-Host "║  1. 下載: https://www.python.org/downloads/                 ║" -ForegroundColor Yellow
        Write-Host "║  2. 安裝時勾選「Add Python to PATH」                        ║" -ForegroundColor Yellow
        Write-Host "║  3. 重新啟動 PowerShell                                     ║" -ForegroundColor Yellow
        Write-Host "║  🔧 或手動輸入 Python 路徑                                 ║" -ForegroundColor Gray
        Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
        Write-Host ""
        
        $manualPath = Read-Host "請輸入 Python 完整路徑（或按 Enter 跳過）"
        if ($manualPath -and (Test-Path $manualPath)) {
            Write-Host "   ✅ 使用手動指定: $manualPath" -ForegroundColor Green
            return $manualPath
        }
        return $null
    }
    
    return $foundPaths[0]
}

# ============================================================
# 4. 檢查依賴套件（直接使用系統 Python）
# ============================================================
function Check-Dependencies {
    param([string]$PythonPath)
    
    Write-Host ""
    Write-Host "📌 檢查依賴套件..." -ForegroundColor $colors.warning
    
    $requirementsPath = "05_後端伺服器\requirements.txt"
    if (-not (Test-Path $requirementsPath)) {
        Write-Host "   ⚠️ 找不到 requirements.txt" -ForegroundColor $colors.warning
        return $true
    }
    
    try {
        # 檢查是否已安裝
        $checkResult = & $PythonPath -c "import fastapi, uvicorn" 2>$null
        if ($checkResult) {
            Write-Host "   ✅ 依賴已安裝" -ForegroundColor $colors.success
            return $true
        }
        
        Write-Host "   📦 安裝依賴套件..." -ForegroundColor Gray
        & $PythonPath -m pip install -r $requirementsPath
        
        # 驗證安裝
        $verifyResult = & $PythonPath -c "import fastapi, uvicorn; print('ok')" 2>$null
        if ($verifyResult -eq "ok") {
            Write-Host "   ✅ 依賴安裝完成" -ForegroundColor $colors.success
            return $true
        } else {
            Write-Host "   ⚠️ 部分依賴安裝失敗" -ForegroundColor $colors.warning
            return $false
        }
    } catch {
        Write-Host "   ⚠️ 依賴檢查失敗: $($_.Exception.Message)" -ForegroundColor $colors.warning
        Write-Host "   💡 請手動執行: pip install -r $requirementsPath" -ForegroundColor $colors.gray
        return $false
    }
}

# ============================================================
# 5. Port 管理
# ============================================================
function Test-Port {
    param([int]$Port = 8001)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

function Kill-Port {
    param([int]$Port = 8001)
    
    Write-Host "📌 檢查 Port $Port..." -ForegroundColor $colors.warning
    
    if (-not (Test-Port -Port $Port)) {
        Write-Host "   ✅ Port $Port 可用" -ForegroundColor $colors.success
        return
    }
    
    Write-Host "   ⚠️ Port $Port 已被佔用" -ForegroundColor $colors.warning
    
    try {
        $netstat = netstat -ano | findstr ":$Port"
        if ($netstat) {
            $pidMatch = [regex]::Match($netstat, '\s+(\d+)$')
            if ($pidMatch.Success) {
                $targetPid = $pidMatch.Groups[1].Value
                try {
                    $process = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
                    $processName = $process.ProcessName
                    Write-Host "   📌 佔用行程: $processName (PID: $targetPid)" -ForegroundColor $colors.gray
                } catch {}
                
                $response = Read-Host "   是否強制終止？(y/n)"
                if ($response -eq "y") {
                    taskkill /PID $targetPid /F 2>$null
                    Start-Sleep -Seconds 2
                    if (-not (Test-Port -Port $Port)) {
                        Write-Host "   ✅ 已終止行程 PID: $targetPid" -ForegroundColor $colors.success
                    } else {
                        Write-Host "   ⚠️ 無法終止行程，請手動處理" -ForegroundColor $colors.warning
                    }
                }
            }
        }
    } catch {
        Write-Host "   ⚠️ Port 檢查異常: $($_.Exception.Message)" -ForegroundColor $colors.warning
    }
}

# ============================================================
# 6. 自動偵測專案根目錄
# ============================================================
function Find-ProjectRoot {
    $currentPath = (Get-Location).Path
    
    for ($i = 0; $i -lt 10; $i++) {
        $markers = @("05_後端伺服器", "04_應用層", "03_核心邏輯")
        $found = $true
        foreach ($marker in $markers) {
            if (-not (Test-Path (Join-Path $currentPath $marker))) {
                $found = $false
                break
            }
        }
        if ($found) { return $currentPath }
        
        $projectDirs = Get-ChildItem -Path $currentPath -Directory | Where-Object { $_.Name -match "^P01_" }
        if ($projectDirs.Count -eq 1) {
            return $projectDirs[0].FullName
        }
        
        $parent = Split-Path $currentPath -Parent
        if ($parent -eq $currentPath) { break }
        $currentPath = $parent
    }
    return $null
}

# ============================================================
# 7. Node.js 偵測
# ============================================================
function Find-Node {
    try {
        $node = (Get-Command node -ErrorAction SilentlyContinue).Source
        if ($node -and (Test-Path $node)) {
            return $node
        }
    } catch {}
    
    $nodePaths = @(
        "C:\Program Files\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
    )
    foreach ($p in $nodePaths) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

# ============================================================
# 8. 主程式
# ============================================================
Clear-Host

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 通用型開發啟動器 - 乙級職安衛模擬測驗系統             ║" -ForegroundColor Cyan
Write-Host "║  📌 版本: 10.3.1 (無虛擬環境版)                            ║" -ForegroundColor Cyan
Write-Host "║  ✅ 自動偵測 Python / Port / 專案路徑                      ║" -ForegroundColor Cyan
Write-Host "║  💡 跨使用者支援 / 多重備用方案                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 【步驟 1】偵測專案根目錄
Write-Host "🔍 正在偵測專案根目錄..." -ForegroundColor $colors.warning
$ScriptPath = Find-ProjectRoot
if (-not $ScriptPath) {
    Write-Host "   ❌ 無法找到專案根目錄" -ForegroundColor $colors.error
    $manualPath = Read-Host "請手動輸入專案根目錄路徑"
    if (Test-Path $manualPath) {
        $ScriptPath = $manualPath
    } else {
        Write-Host "   ❌ 路徑不存在: $manualPath" -ForegroundColor $colors.error
        Read-Host "按 Enter 退出"
        exit 1
    }
}
Write-Host "   ✅ 專案根目錄: $ScriptPath" -ForegroundColor $colors.success
Set-Location $ScriptPath

# 【步驟 2】偵測 Python
$PythonPath = Find-Python
if (-not $PythonPath) {
    Read-Host "按 Enter 退出"
    exit 1
}

# 【步驟 3】檢查依賴
Check-Dependencies -PythonPath $PythonPath

# 【步驟 4】檢查 Port
Kill-Port -Port 8001

# 【步驟 5】啟動後端
Write-Host ""
Write-Host "📌 啟動後端服務..." -ForegroundColor $colors.warning

$BackendPath = Join-Path $ScriptPath "05_後端伺服器"
$BackendFile = Join-Path $BackendPath "00_後端入口.py"

Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$BackendPath'; Write-Host '🚀 後端服務啟動中 (完全離線)...' -ForegroundColor Cyan; Write-Host '📡 http://localhost:8001/api/health' -ForegroundColor Gray; Write-Host '🐍 Python: $PythonPath' -ForegroundColor Gray; & '$PythonPath' 00_後端入口.py`""

Write-Host "   ⏳ 等待後端啟動 (5 秒)..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 【步驟 6】檢查後端狀態
Write-Host ""
Write-Host "📌 檢查後端狀態..." -ForegroundColor $colors.warning
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/api/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ 後端已就緒 (http://localhost:8001)" -ForegroundColor $colors.success
} catch {
    Write-Host "   ⚠️ 後端尚未就緒，請稍後手動刷新" -ForegroundColor $colors.warning
}

# 【步驟 7】啟動 Live Server
Write-Host ""
Write-Host "📌 啟動 Live Server..." -ForegroundColor $colors.warning

$NodePath = Find-Node
if ($NodePath) {
    Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$ScriptPath'; Write-Host '🌐 Live Server 啟動中...' -ForegroundColor Cyan; Write-Host '📁 根目錄: $ScriptPath' -ForegroundColor Gray; npx live-server --port=5500 --no-browser`""
} else {
    Write-Host "   ⚠️ 找不到 Node.js，請手動開啟前端頁面" -ForegroundColor $colors.warning
    Start-Process "$ScriptPath\04_應用層\系統主頁面.html"
}
Write-Host "   ⏳ 等待 Live Server 啟動 (3 秒)..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 【步驟 8】開啟瀏覽器
$frontendUrl = "http://127.0.0.1:5500/04_應用層/系統主頁面.html"
Write-Host "   🌐 開啟: $frontendUrl (Chrome 無痕模式)" -ForegroundColor Gray
try {
    Start-Process "chrome.exe" -ArgumentList "--incognito", $frontendUrl
} catch {
    Start-Process $frontendUrl
}

# 【步驟 9】完成
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ 啟動完成！                                              ║" -ForegroundColor Cyan
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  📡 後端: http://localhost:8001/api/health                  ║" -ForegroundColor Cyan
Write-Host "║  🌐 前端: $frontendUrl ║" -ForegroundColor Cyan
Write-Host "║  🐍 Python: $PythonPath ║" -ForegroundColor Gray
Write-Host "║  📂 專案: $ScriptPath ║" -ForegroundColor Gray
Write-Host "║  📚 模式: 完全離線 (從本地 JSON 載入)                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ 本地開發環境已啟動！" -ForegroundColor Green
Write-Host ""
Write-Host "📌 按任意鍵關閉此視窗（後端和前端會繼續運行）" -ForegroundColor Gray
Read-Host