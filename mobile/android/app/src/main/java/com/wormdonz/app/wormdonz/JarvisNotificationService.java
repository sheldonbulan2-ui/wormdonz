package com.wormdonz.app.wormdonz;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.RemoteInput;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;

/**
 * Intercepts incoming notifications and executes remote background inline replies.
 */
public class JarvisNotificationService extends NotificationListenerService {
    private static final String TAG = "JarvisNotification";
    private static JarvisNotificationService sInstance;
    private static final int MAX_BUFFER_SIZE = 40;

    public static class CachedNotification {
        public String key;
        public String packageName;
        public String appName;
        public String title;
        public String text;
        public long postTime;
        public Notification.Action replyAction;
        public RemoteInput remoteInput;
    }

    private final List<CachedNotification> mRecentNotifications = Collections.synchronizedList(new LinkedList<>());

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        sInstance = this;
        Log.i(TAG, "JarvisNotificationService listener connected.");
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        sInstance = null;
        Log.w(TAG, "JarvisNotificationService listener disconnected.");
    }

    @Override
    public boolean onUnbind(Intent intent) {
        sInstance = null;
        return super.onUnbind(intent);
    }

    public static JarvisNotificationService getInstance() {
        return sInstance;
    }

    public static boolean isRunning() {
        return sInstance != null;
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;

        // Skip our own persistent HUD service notification
        if (getPackageName().equals(sbn.getPackageName())) return;

        Notification n = sbn.getNotification();
        Bundle extras = n.extras;
        if (extras == null) return;

        CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigTextCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

        String title = titleCs != null ? titleCs.toString() : "";
        String text = bigTextCs != null ? bigTextCs.toString() : (textCs != null ? textCs.toString() : "");

        if (title.isEmpty() && text.isEmpty()) return;

        CachedNotification item = new CachedNotification();
        item.key = sbn.getKey();
        item.packageName = sbn.getPackageName();
        item.appName = resolveAppLabel(sbn.getPackageName());
        item.title = title;
        item.text = text;
        item.postTime = sbn.getPostTime();

        // Extract direct reply RemoteInput action
        if (n.actions != null) {
            for (Notification.Action action : n.actions) {
                if (action != null && action.getRemoteInputs() != null) {
                    for (RemoteInput ri : action.getRemoteInputs()) {
                        if (ri.getAllowFreeFormInput()) {
                            item.replyAction = action;
                            item.remoteInput = ri;
                            break;
                        }
                    }
                }
                if (item.replyAction != null) break;
            }
        }

        synchronized (mRecentNotifications) {
            mRecentNotifications.add(0, item);
            while (mRecentNotifications.size() > MAX_BUFFER_SIZE) {
                mRecentNotifications.remove(mRecentNotifications.size() - 1);
            }
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        if (sbn == null) return;
        synchronized (mRecentNotifications) {
            for (int i = 0; i < mRecentNotifications.size(); i++) {
                if (sbn.getKey().equals(mRecentNotifications.get(i).key)) {
                    mRecentNotifications.remove(i);
                    break;
                }
            }
        }
    }

    private String resolveAppLabel(String packageName) {
        try {
            PackageManager pm = getPackageManager();
            ApplicationInfo ai = pm.getApplicationInfo(packageName, 0);
            return pm.getApplicationLabel(ai).toString();
        } catch (Exception e) {
            return packageName;
        }
    }

    /**
     * Returns JSON list of recent intercepted notifications.
     */
    public String getRecentNotificationsJson() {
        JsonArray array = new JsonArray();
        synchronized (mRecentNotifications) {
            for (CachedNotification item : mRecentNotifications) {
                JsonObject obj = new JsonObject();
                obj.addProperty("packageName", item.packageName);
                obj.addProperty("appName", item.appName);
                obj.addProperty("title", item.title);
                obj.addProperty("text", item.text);
                obj.addProperty("timestamp", item.postTime);
                obj.addProperty("canReplyDirectly", item.replyAction != null && item.remoteInput != null);
                array.add(obj);
            }
        }
        JsonObject res = new JsonObject();
        res.addProperty("status", "success");
        res.addProperty("count", array.size());
        res.add("notifications", array);
        return res.toString();
    }

    /**
     * Replies to a notification using its RemoteInput action without opening the app.
     */
    public String replyToNotification(String senderOrApp, String replyText) {
        if (senderOrApp == null || replyText == null) {
            JsonObject err = new JsonObject();
            err.addProperty("status", "error");
            err.addProperty("message", "Target app/sender and reply text are required.");
            return err.toString();
        }

        String query = senderOrApp.trim().toLowerCase();
        CachedNotification target = null;

        synchronized (mRecentNotifications) {
            for (CachedNotification item : mRecentNotifications) {
                if (item.replyAction != null && item.remoteInput != null) {
                    if (item.appName.toLowerCase().contains(query)
                            || item.title.toLowerCase().contains(query)
                            || item.packageName.toLowerCase().contains(query)) {
                        target = item;
                        break;
                    }
                }
            }
        }

        if (target == null) {
            JsonObject err = new JsonObject();
            err.addProperty("status", "error");
            err.addProperty("message", "No replyable notification found matching '" + senderOrApp + "'");
            return err.toString();
        }

        try {
            Intent replyIntent = new Intent();
            Bundle bundle = new Bundle();
            bundle.putCharSequence(target.remoteInput.getResultKey(), replyText);
            RemoteInput.addResultsToIntent(new RemoteInput[]{target.remoteInput}, replyIntent, bundle);

            target.replyAction.actionIntent.send(this, 0, replyIntent);

            JsonObject success = new JsonObject();
            success.addProperty("status", "success");
            success.addProperty("repliedTo", target.appName + " (" + target.title + ")");
            success.addProperty("messageSent", replyText);
            return success.toString();
        } catch (PendingIntent.CanceledException e) {
            Log.e(TAG, "Reply PendingIntent was canceled: " + e.getMessage());
            JsonObject err = new JsonObject();
            err.addProperty("status", "error");
            err.addProperty("message", "Notification reply failed: PendingIntent was canceled.");
            return err.toString();
        } catch (Exception e) {
            Log.e(TAG, "Reply failed: " + e.getMessage());
            JsonObject err = new JsonObject();
            err.addProperty("status", "error");
            err.addProperty("message", "Notification reply failed: " + e.getMessage());
            return err.toString();
        }
    }
}
