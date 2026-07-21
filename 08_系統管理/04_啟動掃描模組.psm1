# ============================================================
# 🔍 啟動掃描模組 v1.0.0
# ============================================================
# 職責：執行啟動掃描，檢查系統完整性
# ============================================================

function Start-FullScan {
    Write-Log -Message "========================================" -Level "PHASE"
    Write-Log -Message "🔍 啟動完整掃描" -Level "PHASE"
    Write-Log -Message "========================================" -Level "PHASE"
    
    $root = Get-ProjectRoot
    $results = @()
    
    $scanDirs = @(
        "00_核心引擎",
        "01_系統管理工具",
        "02_後端伺服器",
        "03_前端資源庫",
        "04_前端服務模組",
        "05_前端核心邏輯",
        "06_前端應用層",
        "07_執行期設定",
        "08_文件與規範",
        "09_工具腳本集",
        "10_資料庫"
    )
    
    $missing = 0
    foreach ($dir in $scanDirs) {
        $path = Join-Path $root $dir
        if (Test-Path $path) {
            Write-Log -Message "  ✅ $dir" -Level "OK"
            $results += [PSCustomObject]@{ Directory = $dir; Status = "存在" }
        } else {
            Write-Log -Message "  ❌ $dir" -Level "ERROR"
            $results += [PSCustomObject]@{ Directory = $dir; Status = "遺失" }
            $missing++
        }
    }
    
    Write-Log -Message "========================================" -Level "PHASE"
    Write-Log -Message "📊 掃描完成: 遺失 $missing 個目錄" -Level "PHASE"
    Write-Log -Message "========================================" -Level "PHASE"
    
    return $results
}

Export-ModuleMember -Function Start-FullScan
