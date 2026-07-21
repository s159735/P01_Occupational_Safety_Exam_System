# ============================================================
# 💾 專案備份模組 v1.0.0
# ============================================================
# 職責：完整專案備份與還原
# ============================================================

function Backup-Project {
    param([string]$BackupName = $null)
    
    $root = Get-ProjectRoot
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupName = if ($BackupName) { $BackupName } else { "backup_$timestamp" }
    $backupPath = Join-Path $root "11_備份歸檔\$backupName"
    
    if (-not (Test-Path "11_備份歸檔")) {
        New-Item -ItemType Directory -Path "11_備份歸檔" -Force | Out-Null
    }
    
    Write-Log -Message "開始備份專案到: $backupPath" -Level "INFO"
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    $excludeDirs = @("11_備份歸檔", "12_日誌記錄", "13_報告輸出", "14_暫存快取", "99_暫時存放檔案區")
    $items = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue
    
    foreach ($item in $items) {
        if ($item.Name -in $excludeDirs) { continue }
        $destPath = Join-Path $backupPath $item.Name
        Write-Log -Message "  備份: $($item.Name)" -Level "OK"
        Copy-Item -Path $item.FullName -Destination $destPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Log -Message "備份完成: $backupPath" -Level "OK"
    return $backupPath
}

function Restore-Project {
    param([string]$BackupPath)
    
    if (-not (Test-Path $BackupPath)) {
        Write-Log -Message "備份路徑不存在: $BackupPath" -Level "ERROR"
        return $false
    }
    
    $root = Get-ProjectRoot
    Write-Log -Message "從備份還原: $BackupPath" -Level "INFO"
    Copy-Item -Path "$BackupPath\*" -Destination $root -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log -Message "還原完成" -Level "OK"
    return $true
}

Export-ModuleMember -Function Backup-Project, Restore-Project
