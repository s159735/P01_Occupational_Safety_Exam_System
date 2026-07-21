# ============================================================
# 📝 日誌記錄模組 v1.0.0
# ============================================================
# 職責：統一日誌寫入
# ============================================================

$script:LogFile = $null

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$LogPath = $null
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    if (-not $LogPath) { 
        try {
            $root = Get-ProjectRoot
            $LogPath = Join-Path $root "12_日誌記錄\system.log"
            $logDir = Split-Path $LogPath -Parent
            if (-not (Test-Path $logDir)) {
                New-Item -ItemType Directory -Path $logDir -Force | Out-Null
            }
        } catch {
            $LogPath = "system.log"
        }
    }
    
    Add-Content -Path $LogPath -Value $LogEntry -Encoding UTF8 -ErrorAction SilentlyContinue
    
    $colorMap = @{
        "INFO" = "White"
        "OK" = "Green"
        "WARN" = "Yellow"
        "ERROR" = "Red"
        "PHASE" = "Cyan"
    }
    $color = $colorMap[$Level] -or "White"
    Write-Host $LogEntry -ForegroundColor $color
}

function Write-Phase {
    param(
        [string]$Phase,
        [string]$Message
    )
    Write-Log -Message "========== 階段 [$Phase] $Message ==========" -Level "PHASE"
}

Export-ModuleMember -Function Write-Log, Write-Phase
