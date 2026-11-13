package com.wormdonz.app.wormdonz;

import android.content.Context;
import android.util.Log;

import com.google.gson.JsonObject;

/**
 * Dispatches LLM tool calls to the native Android OS and Accessibility layers.
 */
public class ActionExecutor {
    private static final String TAG = "ActionExecutor";

    private final Context mContext;
    private final SystemController mSystemController;

    public ActionExecutor(Context context) {
        this.mContext = context.getApplicationContext();
        this.mSystemController = new SystemController(mContext);
    }

    public String execute(String functionName, JsonObject args) {
        Log.i(TAG, "Executing tool: " + functionName + " with args: " + args);
        if (args == null) args = new JsonObject();

        try {
            switch (functionName) {
                // UI AUTOMATION VIA ACCESSIBILITY
                case "read_screen_context":
                    JarvisAccessibilityService accRead = JarvisAccessibilityService.getInstance();
                    if (accRead != null) {
                        return accRead.readScreenContext();
                    } else {
                        return errorResult("Accessibility Service is not enabled. Please enable it in Settings.");
                    }

                case "click_element":
                    String textOrId = getStringArg(args, "textOrId");
                    JarvisAccessibilityService accClick = JarvisAccessibilityService.getInstance();
                    if (accClick != null) {
                        return accClick.clickElement(textOrId);
                    } else {
                        return errorResult("Accessibility Service is not enabled.");
                    }

                case "input_text":
                    String hint = getStringArg(args, "targetFieldHint");
                    String textToType = getStringArg(args, "textToType");
                    JarvisAccessibilityService accInput = JarvisAccessibilityService.getInstance();
                    if (accInput != null) {
                        return accInput.inputText(hint, textToType);
                    } else {
                        return errorResult("Accessibility Service is not enabled.");
                    }

                case "scroll_screen":
                    String direction = getStringArg(args, "direction");
                    JarvisAccessibilityService accScroll = JarvisAccessibilityService.getInstance();
                    if (accScroll != null) {
                        return accScroll.scrollScreen(direction);
                    } else {
                        return errorResult("Accessibility Service is not enabled.");
                    }

                case "perform_global_action":
                    String action = getStringArg(args, "action");
                    JarvisAccessibilityService accNav = JarvisAccessibilityService.getInstance();
                    if (accNav != null) {
                        return accNav.performGlobal(action);
                    } else {
                        return errorResult("Accessibility Service is not enabled.");
                    }

                // HARDWARE & SYSTEM CONTROLS
                case "open_app":
                    String appName = getStringArg(args, "appName");
                    return mSystemController.openApp(appName);

                case "make_phone_call":
                    String contact = getStringArg(args, "contactNameOrNumber");
                    return mSystemController.makePhoneCall(contact);

                case "send_sms":
                    String recipient = getStringArg(args, "recipient");
                    String msg = getStringArg(args, "message");
                    return mSystemController.sendSms(recipient, msg);

                case "toggle_hardware":
                    String setting = getStringArg(args, "setting");
                    boolean state = args.has("state") && args.get("state").getAsBoolean();
                    int level = args.has("level") ? args.get("level").getAsInt() : -1;
                    return mSystemController.toggleHardware(setting, state, level);

                case "set_alarm_or_timer":
                    int hour = args.has("hour") ? args.get("hour").getAsInt() : 0;
                    int minute = args.has("minute") ? args.get("minute").getAsInt() : 0;
                    int seconds = args.has("seconds") ? args.get("seconds").getAsInt() : 0;
                    String label = getStringArg(args, "label");
                    return mSystemController.setAlarmOrTimer(hour, minute, seconds, label);

                case "get_device_telemetry":
                    return mSystemController.getDeviceTelemetry();

                // NOTIFICATION INTERCEPTOR & DIRECT REPLY
                case "reply_to_notification":
                    String senderOrApp = getStringArg(args, "senderOrApp");
                    String replyText = getStringArg(args, "replyText");
                    JarvisNotificationService notifService = JarvisNotificationService.getInstance();
                    if (notifService != null) {
                        return notifService.replyToNotification(senderOrApp, replyText);
                    } else {
                        return errorResult("Notification Listener Service is not enabled.");
                    }

                default:
                    return errorResult("Unrecognized tool: " + functionName);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error executing " + functionName + ": " + e.getMessage(), e);
            return errorResult("Exception during execution: " + e.getMessage());
        }
    }

    private String getStringArg(JsonObject args, String key) {
        if (args.has(key) && !args.get(key).isJsonNull()) {
            return args.get(key).getAsString();
        }
        return "";
    }

    private String errorResult(String message) {
        JsonObject err = new JsonObject();
        err.addProperty("status", "error");
        err.addProperty("message", message);
        return err.toString();
    }
}
