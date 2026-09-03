. (Join-Path $PSScriptRoot "_common.ps1")
$folder = Get-AccountValue "YC_FOLDER_ID" "b1g07nbj3q7ccru38on0"
$gwName = Get-AccountValue "API_GATEWAY_NAME" "pharma-api-gateway"

Write-Host "Discovering folder $folder"

$zones = yc dns zone list --folder-id $folder --format json | ConvertFrom-Json
$zone = $zones | Where-Object { $_.zone.TrimEnd(".") -eq "sinoptics.ru" } | Select-Object -First 1
if ($zone) {
    Set-AccountValue "DNS_ZONE_SINOPTICS_RU_ID" $zone.id
    Write-Host "dns zone $($zone.id) $($zone.zone)"
} else {
    Write-Host "WARNING: public zone sinoptics.ru not found in folder $folder"
}

$certs = yc certificate-manager certificate list --folder-id $folder --format json | ConvertFrom-Json
$wildcards = $certs | Where-Object { $_.domains -contains "*.sinoptics.ru" -and $_.status -eq "ISSUED" }
# В каталоге лежат и самоподписанные IMPORTED сертификаты: браузер их отвергнет,
# поэтому берём только managed (Let's Encrypt), как orders и verify.
$wild = $wildcards | Where-Object { $_.type -eq "MANAGED" } | Select-Object -First 1
if (-not $wild) {
    $wild = $wildcards | Select-Object -First 1
    if ($wild) { Write-Host "WARNING: no MANAGED wildcard, falling back to $($wild.type) $($wild.name)" }
}
if ($wild) {
    Set-AccountValue "CERT_WILDCARD_SINOPTICS_RU_ID" $wild.id
    Write-Host "cert $($wild.id) $($wild.name) [$($wild.type)] [$($wild.domains -join ', ')]"
} else {
    Write-Host "WARNING: no ISSUED certificate covering *.sinoptics.ru"
}

$gws = yc serverless api-gateway list --folder-id $folder --format json | ConvertFrom-Json
$gw = $gws | Where-Object { $_.name -eq $gwName } | Select-Object -First 1
if ($gw) {
    Set-AccountValue "API_GATEWAY_ID" $gw.id
    if ($gw.domain) { Set-AccountValue "API_GATEWAY_DOMAIN" $gw.domain }
    Write-Host "gateway $($gw.id) $($gw.domain)"
} else {
    Write-Host "gateway $gwName not created yet"
}

Write-Host "Wrote $AccountEnv"
