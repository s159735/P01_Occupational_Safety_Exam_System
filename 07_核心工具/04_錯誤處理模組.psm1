# ============================================================
# 🛡️ 錯誤處理模組 v1.0.0
# ============================================================
# 職責：統一錯誤處理
# ============================================================

function Invoke-SafeCommand {
    param(
        [ScriptBlock]$ScriptBlock,
        [string]$ErrorMessage = "命令執行失敗"
    )
    try {
        return & $ScriptBlock
    } catch {
        Write-Log -Message "$ErrorMessage : $($_.Exception.Message)" -Level "ERROR"
        return $null
    }
}

function Test-PathSafe {
    param([string]$Path)
    try {
        return Test-Path $Path
    } catch {
        return $false
    }
}

Export-ModuleMember -Function Invoke-SafeCommand, Test-PathSafe
