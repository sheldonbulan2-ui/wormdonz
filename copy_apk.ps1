$sourceApk = "mobile\build\app\outputs\flutter-apk\app-debug.apk"
$destBackend = "backend\public\downloads\wormdonz.apk"
$destAdmin = "admin\public\downloads\wormdonz.apk"

if (Test-Path $sourceApk) {
    Copy-Item -Force $sourceApk $destBackend
    Copy-Item -Force $sourceApk $destAdmin
    Write-Host "✅ Successfully copied APK to $destBackend and $destAdmin"
    $file = Get-Item $destBackend
    Write-Host "📦 APK Size: $([math]::Round($file.Length / 1MB, 2)) MB"
} else {
    Write-Host "⏳ APK not yet ready at $sourceApk"
}
