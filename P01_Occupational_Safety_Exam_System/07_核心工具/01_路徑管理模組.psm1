# ============================================================
# 🧭 路徑管理模組 v1.0.1
# ============================================================
# 職責：動態偵測專案根目錄
# ============================================================

$script:CachedProjectRoot = $null
$script:RootMarkers = @(
    "一鍵啟動.ps1",
    "環境變數設定.env",
    "00_核心引擎",
    "02_後端伺服器",
    "06_前端應用層"
)

function Get-ProjectRoot {
    if ($script:CachedProjectRoot -and (Test-Path $script:CachedProjectRoot)) {
        return $script:CachedProjectRoot
    }
    
    $currentDir = (Get-Location).Path
    $searchDir = $currentDir
    
    for ($i = 0; $i -lt 10; $i++) {
        foreach ($marker in $script:RootMarkers) {
            $testPath = Join-Path $searchDir $marker
            if (Test-Path $testPath) {
                $script:CachedProjectRoot = $searchDir
                return $searchDir
            }
        }
        $parent = Split-Path $searchDir -Parent
        if ($parent -eq $searchDir) { break }
        $searchDir = $parent
    }
    
    $script:CachedProjectRoot = $currentDir
    return $currentDir
}

function Clear-ProjectRootCache {
    $script:CachedProjectRoot = $null
}

Export-ModuleMember -Function Get-ProjectRoot, Clear-ProjectRootCache
