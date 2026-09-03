. (Join-Path $PSScriptRoot "_common.ps1")
$zone = Get-AccountValue "DNS_ZONE_SINOPTICS_RU_ID" "dns5ia445jp8cqmbnnfk"
$fqdn = Get-AccountValue "CUSTOM_DOMAIN" "pharma.sinoptics.ru"
$gwDomain = Get-AccountValue "API_GATEWAY_DOMAIN"
if (-not $gwDomain) { throw "API_GATEWAY_DOMAIN is empty; run deploy-gateway.ps1 first" }
$target = $gwDomain.TrimEnd(".") + "."

Write-Host "CNAME $fqdn. -> $target"
$listed = yc dns zone list-records --id $zone --format json | ConvertFrom-Json
$records = if ($null -ne $listed.record_sets) { $listed.record_sets } else { $listed }
$exists = $records | Where-Object { $_.name -and $_.name.TrimEnd(".") -eq $fqdn }
if ($exists) {
    yc dns zone replace-records --id $zone --record "$fqdn. 600 CNAME $target"
} else {
    yc dns zone add-records --id $zone --record "$fqdn. 600 CNAME $target"
}
Write-Host "DNS updated"
