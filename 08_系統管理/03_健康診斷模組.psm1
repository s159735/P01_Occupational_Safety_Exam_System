# ============================================================
# 🔍 健康診斷模組 v1.0.0
# ============================================================
# 職責：系統健康檢查與診斷
# ============================================================

function Test-SystemHealth {
    Write-Log -Message "========================================" -Level "PHASE"
    Write-Log -Message "🏥 系統健康檢查" -Level "PHASE"
    Write-Log -Message "========================================" -Level "PHASE"
    
    $root = Get-ProjectRoot
    Write-Log -Message "根目錄: $root" -Level "INFO"
    
    $results = @()
    $checkDirs = @(
        "00_核心引擎",
        "02_後端伺服器",
        "06_前端應用層",
        "10_資料庫"
    )
    
    foreach ($dir in $checkDirs) {
        $path = Join-Path $root $dir
        if (Test-Path $path) {
            Write-Log -Message "  ✅ $dir" -Level "OK"
            $results += [PSCustomObject]@{ Directory = $dir; Status = "存在" }
        } else {
            Write-Log -Message "  ❌ $dir" -Level "ERROR"
            $results += [PSCustomObject]@{ Directory = $dir; Status = "遺失" }
        }
    }
    
    Write-Log -Message "========================================" -Level "PHASE"
    return $results
}

Export-ModuleMember -Function Test-SystemHealth
