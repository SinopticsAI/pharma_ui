# Static portal only. Do not update pharma-edge-api-gateway from this repo.

. (Join-Path $PSScriptRoot "_common.ps1")
$folder = Get-AccountValue "YC_FOLDER_ID" "b1g07nbj3q7ccru38on0"
$name = Get-AccountValue "API_GATEWAY_NAME" "pharma-api-gateway"
$bucket = Get-AccountValue "BUCKET_NAME" "pharma-sinoptics-ru"
$sa = Get-AccountValue "SA_API_GATEWAY_ID" "ajera4c2od385cmjh3ms"
$domain = Get-AccountValue "CUSTOM_DOMAIN" "pharma.sinoptics.ru"
$cert = Get-AccountValue "CERT_WILDCARD_SINOPTICS_RU_ID"

$template = Join-Path $InfraDir "gateway\openapi.template.yaml"
$spec = Join-Path $InfraDir "gateway\openapi.yaml"
$text = Get-Content $template -Raw
$text = $text.Replace("__BUCKET_NAME__", $bucket)
$text = $text.Replace("__SA_API_GATEWAY_ID__", $sa)
$text = $text.Replace("__CUSTOM_DOMAIN__", $domain)
Set-Content -Path $spec -Value $text -Encoding utf8

$list = yc serverless api-gateway list --folder-id $folder --format json | ConvertFrom-Json
$gw = $list | Where-Object { $_.name -eq $name } | Select-Object -First 1
if (-not $gw) {
    $created = yc serverless api-gateway create --name $name --description "Pharma portal demo" --spec $spec --folder-id $folder --format json | ConvertFrom-Json
    $gwId = $created.id
    $gwDomain = $created.domain
} else {
    $gwId = $gw.id
    yc serverless api-gateway update --id $gwId --spec $spec
    $got = yc serverless api-gateway get --id $gwId --format json | ConvertFrom-Json
    $gwDomain = $got.domain
}
Set-AccountValue "API_GATEWAY_ID" $gwId
if ($gwDomain) { Set-AccountValue "API_GATEWAY_DOMAIN" $gwDomain }

if ($cert) {
    # yc пишет прогресс в stderr, поэтому вывод не сливаем: под $ErrorActionPreference
    # = Stop любая строка stderr стала бы терминирующей ошибкой.
    $attached = (yc serverless api-gateway get --id $gwId --format json | ConvertFrom-Json).attached_domains
    $current = $attached | Where-Object { $_.domain -eq $domain } | Select-Object -First 1
    if ($current -and $current.certificate_id -eq $cert) {
        Write-Host "Domain $domain already attached with cert $cert"
    } else {
        if ($current) {
            Write-Host "Reattaching $domain : cert $($current.certificate_id) -> $cert"
            yc serverless api-gateway remove-domain --id $gwId --domain-id $current.domain_id
            if ($LASTEXITCODE -ne 0) { throw "remove-domain failed for $domain" }
        } else {
            Write-Host "Attaching domain $domain with cert $cert"
        }
        yc serverless api-gateway add-domain --id $gwId --domain $domain --certificate-id $cert
        if ($LASTEXITCODE -ne 0) { throw "add-domain failed for $domain" }
    }
} else {
    Write-Host "WARNING: CERT_WILDCARD_SINOPTICS_RU_ID is empty; run discover.ps1 before attaching $domain"
}

Write-Host "Gateway $name = $gwId domain=$gwDomain"
