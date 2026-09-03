# Canon of the static portal deploy. The copy in pharma_cert points here.

. (Join-Path $PSScriptRoot "_common.ps1")
$folder = Get-AccountValue "YC_FOLDER_ID" "b1g07nbj3q7ccru38on0"
$bucket = Get-AccountValue "BUCKET_NAME" "pharma-sinoptics-ru"
$source = $args[0]

if (-not $source) {
    Write-Host "Assembling static bundle"
    node (Join-Path $PSScriptRoot "assemble-static.mjs")
    $source = Join-Path $RepoRoot "out"
}
if (-not (Test-Path $source)) { throw "Source directory $source not found" }
$sourceRoot = (Resolve-Path $source).Path

Write-Host "Ensuring bucket $bucket"
$existing = yc storage bucket list --folder-id $folder --format json | ConvertFrom-Json
if (-not ($existing | Where-Object { $_.name -eq $bucket })) {
    yc storage bucket create --name $bucket --folder-id $folder --max-size 1073741824
}

function Get-ContentType {
    param([string]$Extension)
    switch ($Extension) {
        ".html" { "text/html; charset=utf-8" }
        ".css" { "text/css; charset=utf-8" }
        ".js" { "application/javascript; charset=utf-8" }
        ".mjs" { "text/javascript; charset=utf-8" }
        ".json" { "application/json; charset=utf-8" }
        ".map" { "application/json; charset=utf-8" }
        ".svg" { "image/svg+xml" }
        ".png" { "image/png" }
        ".jpg" { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".webp" { "image/webp" }
        ".ico" { "image/x-icon" }
        ".woff" { "font/woff" }
        ".woff2" { "font/woff2" }
        ".txt" { "text/plain; charset=utf-8" }
        ".xml" { "application/xml; charset=utf-8" }
        default { "" }
    }
}

Write-Host "Uploading from $sourceRoot"
$localKeys = New-Object System.Collections.Generic.HashSet[string]
Get-ChildItem -Path $sourceRoot -Recurse -File | ForEach-Object {
    $key = $_.FullName.Substring($sourceRoot.Length).TrimStart("\", "/").Replace("\", "/")
    [void]$localKeys.Add($key)
    $ext = $_.Extension.ToLowerInvariant()
    # HTML переписывается на каждом деплое, хешированные ассеты Vite — нет.
    $cacheControl = if ($ext -in @(".html", ".txt")) {
        "no-cache, no-store, must-revalidate"
    } else {
        "public, max-age=31536000, immutable"
    }
    $cpArgs = @($_.FullName, "s3://$bucket/$key", "--cache-control", $cacheControl)
    $contentType = Get-ContentType $ext
    if ($contentType) { $cpArgs += @("--content-type", $contentType) }
    yc storage s3 cp @cpArgs
}

Write-Host "Pruning stale objects"
$token = ""
$remoteKeys = @()
while ($true) {
    $listArgs = @("--format", "json", "storage", "s3api", "list-objects-v2", "--bucket", $bucket, "--max-keys", "1000")
    if ($token) { $listArgs += @("--continuation-token", $token) }
    $page = yc @listArgs | ConvertFrom-Json
    if ($page.Contents) { $remoteKeys += $page.Contents.Key }
    if ($page.IsTruncated -and $page.NextContinuationToken) { $token = $page.NextContinuationToken } else { break }
}
foreach ($key in $remoteKeys) {
    if (-not $localKeys.Contains($key)) {
        Write-Host "  delete $key"
        yc storage s3api delete-object --bucket $bucket --key $key | Out-Null
    }
}

Write-Host "Bucket $bucket ready"
