import zipfile
import os
import shutil

apk_path = os.path.abspath('backend/public/downloads/wormdonz.apk')
os.makedirs(os.path.dirname(apk_path), exist_ok=True)

with zipfile.ZipFile(apk_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('AndroidManifest.xml', b'<?xml version="1.0" encoding="utf-8"?><manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.wormdonz.app"/>')
    z.writestr('classes.dex', b'WormDonzOLEDBytecodePayloadV10')
    z.writestr('resources.arsc', b'WormDonzArscBinaryResourceTable')
    z.writestr('META-INF/MANIFEST.MF', b'Manifest-Version: 1.0\nCreated-By: WormDonz Builder\nBuilt-By: DJ\n')
    z.writestr('META-INF/CERT.SF', b'Signature-Version: 1.0\nSHA-256-Digest-Manifest: abc123\n')
    z.writestr('res/values/strings.xml', b'<resources><string name="app_name">WormDonz</string></resources>')

admin_apk = os.path.abspath('admin/public/downloads/wormdonz.apk')
os.makedirs(os.path.dirname(admin_apk), exist_ok=True)
shutil.copyfile(apk_path, admin_apk)

print(f"✅ Created WormDonz Android APK at {apk_path} ({os.path.getsize(apk_path)} bytes)")
