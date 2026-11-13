package com.wormdonz.app.wormdonz;

import android.app.ActivityManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.provider.AlarmClock;
import android.provider.ContactsContract;
import android.provider.Settings;
import android.telephony.SmsManager;
import android.util.Log;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Native Android Hardware & System OS Controller for JARVIS-X.
 */
public class SystemController {
    private static final String TAG = "SystemController";
    private final Context mContext;

    public SystemController(Context context) {
        this.mContext = context.getApplicationContext();
    }

    /**
     * Opens an app by fuzzy-matching its label or package name.
     */
    public String openApp(String appName) {
        if (appName == null || appName.trim().isEmpty()) {
            return errorJson("App name cannot be empty.");
        }

        String query = appName.trim().toLowerCase();
        PackageManager pm = mContext.getPackageManager();

        Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
        mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> activities = pm.queryIntentActivities(mainIntent, 0);

        ResolveInfo bestMatch = null;
        int bestScore = -1;

        for (ResolveInfo ri : activities) {
            String label = ri.loadLabel(pm).toString().toLowerCase();
            String pkg = ri.activityInfo.packageName.toLowerCase();

            if (label.equals(query) || pkg.equals(query)) {
                bestMatch = ri;
                break;
            } else if (label.startsWith(query)) {
                if (bestScore < 3) {
                    bestMatch = ri;
                    bestScore = 3;
                }
            } else if (label.contains(query)) {
                if (bestScore < 2) {
                    bestMatch = ri;
                    bestScore = 2;
                }
            } else if (pkg.contains(query)) {
                if (bestScore < 1) {
                    bestMatch = ri;
                    bestScore = 1;
                }
            }
        }

        if (bestMatch == null) {
            return errorJson("No installed application found matching '" + appName + "'");
        }

        String targetPackage = bestMatch.activityInfo.packageName;
        Intent launchIntent = pm.getLaunchIntentForPackage(targetPackage);
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
            mContext.startActivity(launchIntent);

            JsonObject result = new JsonObject();
            result.addProperty("status", "success");
            result.addProperty("appLaunched", bestMatch.loadLabel(pm).toString());
            result.addProperty("packageName", targetPackage);
            return result.toString();
        } else {
            return errorJson("Unable to obtain launch intent for " + targetPackage);
        }
    }

    /**
     * Initiates a phone call to a contact or direct number.
     */
    public String makePhoneCall(String contactNameOrNumber) {
        if (contactNameOrNumber == null || contactNameOrNumber.trim().isEmpty()) {
            return errorJson("Recipient name or phone number is required.");
        }

        String targetNumber = resolvePhoneNumber(contactNameOrNumber.trim());
        if (targetNumber == null || targetNumber.isEmpty()) {
            return errorJson("Could not find phone number for contact: " + contactNameOrNumber);
        }

        try {
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + Uri.encode(targetNumber)));
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (mContext.checkSelfPermission(android.Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
                mContext.startActivity(callIntent);
            } else {
                Intent dialIntent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + Uri.encode(targetNumber)));
                dialIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(dialIntent);
            }

            JsonObject result = new JsonObject();
            result.addProperty("status", "success");
            result.addProperty("calledNumber", targetNumber);
            result.addProperty("contactRequested", contactNameOrNumber);
            return result.toString();
        } catch (Exception e) {
            Log.e(TAG, "Make call error: " + e.getMessage());
            return errorJson("Failed to place call: " + e.getMessage());
        }
    }

    /**
     * Sends an SMS to a resolved contact or phone number.
     */
    public String sendSms(String recipient, String message) {
        if (recipient == null || message == null || message.trim().isEmpty()) {
            return errorJson("Recipient and message content are required.");
        }

        String targetNumber = resolvePhoneNumber(recipient.trim());
        if (targetNumber == null || targetNumber.isEmpty()) {
            return errorJson("Could not find phone number for: " + recipient);
        }

        try {
            SmsManager smsManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                smsManager = mContext.getSystemService(SmsManager.class);
            } else {
                smsManager = SmsManager.getDefault();
            }

            ArrayList<String> parts = smsManager.divideMessage(message);
            if (parts.size() > 1) {
                smsManager.sendMultipartTextMessage(targetNumber, null, parts, null, null);
            } else {
                smsManager.sendTextMessage(targetNumber, null, message, null, null);
            }

            JsonObject result = new JsonObject();
            result.addProperty("status", "success");
            result.addProperty("recipientNumber", targetNumber);
            result.addProperty("messageLength", message.length());
            return result.toString();
        } catch (Exception e) {
            Log.e(TAG, "Send SMS error: " + e.getMessage());
            return errorJson("Failed to send SMS: " + e.getMessage());
        }
    }

    /**
     * Resolves contact name to telephone number using Contacts Provider, or returns direct digits.
     */
    private String resolvePhoneNumber(String query) {
        String cleaned = query.replaceAll("[\\s\\-\\(\\)]", "");
        if (cleaned.matches("^\\+?[0-9]{3,}$")) {
            return cleaned;
        }

        if (mContext.checkSelfPermission(android.Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            return null;
        }

        Uri uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI;
        String[] projection = {
                ContactsContract.CommonDataKinds.Phone.NUMBER,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME
        };
        String selection = ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " LIKE ?";
        String[] selectionArgs = {"%" + query + "%"};

        try (Cursor cursor = mContext.getContentResolver().query(uri, projection, selection, selectionArgs, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                if (numberIndex >= 0) {
                    return cursor.getString(numberIndex);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Contact resolution error: " + e.getMessage());
        }

        return null;
    }

    /**
     * Controls device hardware toggles (flashlight, volume, DND, settings panels, brightness).
     */
    public String toggleHardware(String setting, boolean state, int level) {
        String target = setting != null ? setting.trim().toLowerCase() : "";

        try {
            switch (target) {
                case "flashlight":
                case "torch":
                    CameraManager cameraManager = (CameraManager) mContext.getSystemService(Context.CAMERA_SERVICE);
                    if (cameraManager != null) {
                        String[] cameraIds = cameraManager.getCameraIdList();
                        if (cameraIds.length > 0) {
                            cameraManager.setTorchMode(cameraIds[0], state);
                            JsonObject res = new JsonObject();
                            res.addProperty("status", "success");
                            res.addProperty("setting", "flashlight");
                            res.addProperty("state", state);
                            return res.toString();
                        }
                    }
                    return errorJson("Flashlight hardware not accessible.");

                case "volume":
                case "media_volume":
                case "ring_volume":
                    AudioManager audioManager = (AudioManager) mContext.getSystemService(Context.AUDIO_SERVICE);
                    if (audioManager != null) {
                        int streamType = target.contains("ring") ? AudioManager.STREAM_RING : AudioManager.STREAM_MUSIC;
                        int maxVol = audioManager.getStreamMaxVolume(streamType);
                        int targetVol = level >= 0 ? Math.min(level, maxVol) : (state ? maxVol / 2 : 0);
                        audioManager.setStreamVolume(streamType, targetVol, AudioManager.FLAG_SHOW_UI);

                        JsonObject res = new JsonObject();
                        res.addProperty("status", "success");
                        res.addProperty("setting", target);
                        res.addProperty("level", targetVol);
                        res.addProperty("maxLevel", maxVol);
                        return res.toString();
                    }
                    return errorJson("Audio manager unavailable.");

                case "dnd":
                case "do_not_disturb":
                    NotificationManager nm = (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
                    if (nm != null && nm.isNotificationPolicyAccessGranted()) {
                        nm.setInterruptionFilter(state ? NotificationManager.INTERRUPTION_FILTER_NONE : NotificationManager.INTERRUPTION_FILTER_ALL);
                        JsonObject res = new JsonObject();
                        res.addProperty("status", "success");
                        res.addProperty("setting", "dnd");
                        res.addProperty("state", state);
                        return res.toString();
                    } else {
                        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        mContext.startActivity(intent);
                        return errorJson("DND permission required. Opening settings page.");
                    }

                case "wifi":
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        Intent panelIntent = new Intent(Settings.Panel.ACTION_WIFI);
                        panelIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        mContext.startActivity(panelIntent);
                    } else {
                        Intent wifiIntent = new Intent(Settings.ACTION_WIFI_SETTINGS);
                        wifiIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        mContext.startActivity(wifiIntent);
                    }
                    JsonObject wifiRes = new JsonObject();
                    wifiRes.addProperty("status", "success");
                    wifiRes.addProperty("setting", "wifi_panel_opened");
                    return wifiRes.toString();

                case "bluetooth":
                    Intent btIntent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
                    btIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    mContext.startActivity(btIntent);
                    JsonObject btRes = new JsonObject();
                    btRes.addProperty("status", "success");
                    btRes.addProperty("setting", "bluetooth_settings_opened");
                    return btRes.toString();

                case "brightness":
                    if (Settings.System.canWrite(mContext)) {
                        int brightVal = Math.max(0, Math.min(level, 255));
                        Settings.System.putInt(mContext.getContentResolver(), Settings.System.SCREEN_BRIGHTNESS, brightVal);
                        JsonObject res = new JsonObject();
                        res.addProperty("status", "success");
                        res.addProperty("setting", "brightness");
                        res.addProperty("level", brightVal);
                        return res.toString();
                    } else {
                        Intent intent = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS, Uri.parse("package:" + mContext.getPackageName()));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        mContext.startActivity(intent);
                        return errorJson("Write settings permission needed for screen brightness. Opening settings.");
                    }

                default:
                    return errorJson("Unknown hardware setting: " + setting);
            }
        } catch (Exception e) {
            Log.e(TAG, "Toggle hardware error: " + e.getMessage());
            return errorJson("Failed to toggle hardware: " + e.getMessage());
        }
    }

    /**
     * Sets an alarm or timer using native AlarmClock provider.
     */
    public String setAlarmOrTimer(int hour, int minute, int seconds, String label) {
        try {
            if (seconds > 0) {
                // Set Timer
                Intent timerIntent = new Intent(AlarmClock.ACTION_SET_TIMER);
                timerIntent.putExtra(AlarmClock.EXTRA_LENGTH, seconds);
                timerIntent.putExtra(AlarmClock.EXTRA_MESSAGE, label != null ? label : "JARVIS-X Timer");
                timerIntent.putExtra(AlarmClock.EXTRA_SKIP_UI, true);
                timerIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(timerIntent);

                JsonObject res = new JsonObject();
                res.addProperty("status", "success");
                res.addProperty("type", "timer");
                res.addProperty("seconds", seconds);
                res.addProperty("label", label);
                return res.toString();
            } else {
                // Set Alarm
                Intent alarmIntent = new Intent(AlarmClock.ACTION_SET_ALARM);
                alarmIntent.putExtra(AlarmClock.EXTRA_HOUR, hour);
                alarmIntent.putExtra(AlarmClock.EXTRA_MINUTES, minute);
                alarmIntent.putExtra(AlarmClock.EXTRA_MESSAGE, label != null ? label : "JARVIS-X Alarm");
                alarmIntent.putExtra(AlarmClock.EXTRA_SKIP_UI, true);
                alarmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(alarmIntent);

                JsonObject res = new JsonObject();
                res.addProperty("status", "success");
                res.addProperty("type", "alarm");
                res.addProperty("hour", hour);
                res.addProperty("minute", minute);
                res.addProperty("label", label);
                return res.toString();
            }
        } catch (Exception e) {
            Log.e(TAG, "Set alarm error: " + e.getMessage());
            return errorJson("Failed to set alarm/timer: " + e.getMessage());
        }
    }

    /**
     * Returns comprehensive device telemetry and resource states.
     */
    public String getDeviceTelemetry() {
        JsonObject telemetry = new JsonObject();
        telemetry.addProperty("status", "success");

        // Battery
        BatteryManager bm = (BatteryManager) mContext.getSystemService(Context.BATTERY_SERVICE);
        if (bm != null) {
            int batteryLevel = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
            boolean isCharging = bm.isCharging();
            telemetry.addProperty("batteryLevel", batteryLevel);
            telemetry.addProperty("isCharging", isCharging);
        }

        // Network
        ConnectivityManager cm = (ConnectivityManager) mContext.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
            if (nc != null) {
                if (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                    telemetry.addProperty("networkType", "WIFI");
                } else if (nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                    telemetry.addProperty("networkType", "CELLULAR");
                } else if (nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                    telemetry.addProperty("networkType", "ETHERNET");
                } else {
                    telemetry.addProperty("networkType", "OTHER");
                }
            } else {
                telemetry.addProperty("networkType", "OFFLINE");
            }
        }

        // RAM
        ActivityManager am = (ActivityManager) mContext.getSystemService(Context.ACTIVITY_SERVICE);
        if (am != null) {
            ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(mi);
            telemetry.addProperty("availableRamMb", mi.availMem / (1024 * 1024));
            telemetry.addProperty("totalRamMb", mi.totalMem / (1024 * 1024));
            telemetry.addProperty("lowMemoryWarning", mi.lowMemory);
        }

        // Storage
        try {
            File dataDir = Environment.getDataDirectory();
            StatFs stat = new StatFs(dataDir.getPath());
            long freeBytes = stat.getAvailableBytes();
            long totalBytes = stat.getTotalBytes();
            telemetry.addProperty("freeInternalStorageGb", freeBytes / (1024 * 1024 * 1024));
            telemetry.addProperty("totalInternalStorageGb", totalBytes / (1024 * 1024 * 1024));
        } catch (Exception ignored) {}

        // Audio
        AudioManager audioManager = (AudioManager) mContext.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            telemetry.addProperty("mediaVolume", audioManager.getStreamVolume(AudioManager.STREAM_MUSIC));
            telemetry.addProperty("ringerMode", audioManager.getRingerMode());
        }

        return telemetry.toString();
    }

    private String errorJson(String msg) {
        JsonObject err = new JsonObject();
        err.addProperty("status", "error");
        err.addProperty("message", msg);
        return err.toString();
    }
}
