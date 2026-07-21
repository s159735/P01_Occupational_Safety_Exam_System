# ============================================================
# 🛡️ 目錄保護模組 v1.0.0
# ============================================================
# 職責：保護重要目錄防止未授權修改
# ============================================================

$script:ProtectedDirs = @(
    "00_核心引擎",
    "02_後端伺服器",
    "06_前端應用層",
    "10_資料庫"
)

function Protect-SystemDirectories {
    $root = Get-ProjectRoot
    Write-Log -Message "啟用系統目錄保護..." -Level "INFO"
    $count = 0
    
    foreach ($dir in $script:ProtectedDirs) {
        $path = Join-Path $root $dir
        if (Test-Path $path -PathType Container) {
            $acl = Get-Acl -Path $path -ErrorAction SilentlyContinue
            if ($acl) {
                $acl.SetAccessRuleProtection($true, $false)
                Set-Acl -Path $path -AclObject $acl -ErrorAction SilentlyContinue
                Write-Log -Message "  保護: $dir" -Level "OK"
                $count++
            }
        }
    }
    Write-Log -Message "已保護 $count 個目錄" -Level "OK"
    return $count
}

function Unprotect-SystemDirectories {
    $root = Get-ProjectRoot
    Write-Log -Message "解除系統目錄保護..." -Level "INFO"
    $count = 0
    
    foreach ($dir in $script:ProtectedDirs) {
        $path = Join-Path $root $dir
        if (Test-Path $path -PathType Container) {
            $acl = Get-Acl -Path $path -ErrorAction SilentlyContinue
            if ($acl) {
                $acl.SetAccessRuleProtection($false, $false)
                Set-Acl -Path $path -AclObject $acl -ErrorAction SilentlyContinue
                Write-Log -Message "  解除保護: $dir" -Level "OK"
                $count++
            }
        }
    }
    Write-Log -Message "已解除 $count 個目錄保護" -Level "OK"
    return $count
}

Export-ModuleMember -Function Protect-SystemDirectories, Unprotect-SystemDirectories
