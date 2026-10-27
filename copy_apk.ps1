$sourceApk = "mobile\build\app\outputs\flutter-apk\app-release.apk"
if (-not (Test-Path $sourceApk)) {
    $sourceApk = "mobile\build\app\outputs\flutter-apk\app-debug.apk"
}

$destBackend = "backend\public\downloads\wormdonz.apk"
$destAdminPublic = "admin\public\downloads\wormdonz.apk"
$destAdminDist = "admin\dist\downloads\wormdonz.apk"

New-Item -ItemType Directory -Force -Path "backend\public\downloads" | Out-Null
New-Item -ItemType Directory -Force -Path "admin\public\downloads" | Out-Null
New-Item -ItemType Directory -Force -Path "admin\dist\downloads" | Out-Null

if (Test-Path $sourceApk) {
    Copy-Item -Force $sourceApk $destBackend
    Copy-Item -Force $sourceApk $destAdminPublic
    Copy-Item -Force $sourceApk $destAdminDist
    Write-Host "✅ Successfully copied APK to $destBackend, $destAdminPublic, and $destAdminDist"
    $file = Get-Item $destBackend
    Write-Host "📦 APK Size: $([math]::Round($file.Length / 1MB, 2)) MB"
} else {
    Write-Host "⏳ APK not yet ready at $sourceApk"
}
