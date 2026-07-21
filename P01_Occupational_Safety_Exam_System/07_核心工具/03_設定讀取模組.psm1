# ============================================================
# ⚙️ 設定讀取模組 v1.0.0
# ============================================================
# 職責：讀取環境變數與設定檔
# ============================================================

function Get-EnvVariable {
    param([string]$Key, [string]$Default = "")
    $value = [Environment]::GetEnvironmentVariable($Key)
    if ($value) { return $value }
    if (Test-Path "環境變數設定.env") {
        $lines = Get-Content "環境變數設定.env" -Encoding UTF8 -ErrorAction SilentlyContinue
        foreach ($line in $lines) {
            if ($line -match "^$Key=(.*)") {
                return $matches[1]
            }
        }
    }
    return $Default
}

function Get-ConfigValue {
    param(
        [string]$ConfigPath,
        [string]$Key,
        [string]$Default = ""
    )
    if (Test-Path $ConfigPath) {
        try {
            $json = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $parts = $Key.Split('.')
            $value = $json
            foreach ($part in $parts) {
                $value = $value.$part
                if ($value -eq $null) { break }
            }
            if ($value -ne $null) { return $value }
        } catch {
            Write-Log -Message "讀取設定檔失敗: $ConfigPath" -Level "WARN"
        }
    }
    return $Default
}

Export-ModuleMember -Function Get-EnvVariable, Get-ConfigValue
