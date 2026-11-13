package com.wormdonz.app.wormdonz;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

/**
 * Declares all OS automation tools and function schemas for Google Gemini function calling.
 */
public class ToolRegistry {

    public static JsonArray getGeminiTools() {
        JsonArray toolsArray = new JsonArray();
        JsonObject toolWrapper = new JsonObject();
        JsonArray functionDeclarations = new JsonArray();

        // 1. read_screen_context
        functionDeclarations.add(createFunction(
                "read_screen_context",
                "Reads all visible text, interactive buttons, input fields, coordinates, and view hierarchy from the current foreground window.",
                new JsonObject(),
                new String[]{}
        ));

        // 2. click_element
        JsonObject clickProps = new JsonObject();
        clickProps.add("textOrId", createStringProperty("Text, label, or view ID of the element to click on screen."));
        functionDeclarations.add(createFunction(
                "click_element",
                "Clicks an element on the screen matching the specified text, description, or view ID. Dispatches direct action or simulated tap.",
                clickProps,
                new String[]{"textOrId"}
        ));

        // 3. input_text
        JsonObject inputProps = new JsonObject();
        inputProps.add("targetFieldHint", createStringProperty("Hint, label, or ID of the input field. If empty, focuses current/first editable field."));
        inputProps.add("textToType", createStringProperty("The exact text string to type into the field."));
        functionDeclarations.add(createFunction(
                "input_text",
                "Types text into an editable text field on the screen.",
                inputProps,
                new String[]{"textToType"}
        ));

        // 4. scroll_screen
        JsonObject scrollProps = new JsonObject();
        scrollProps.add("direction", createStringProperty("Scroll direction: UP, DOWN, LEFT, or RIGHT."));
        functionDeclarations.add(createFunction(
                "scroll_screen",
                "Scrolls or swipes the active screen in the specified direction.",
                scrollProps,
                new String[]{"direction"}
        ));

        // 5. perform_global_action
        JsonObject navProps = new JsonObject();
        navProps.add("action", createStringProperty("Global action: back, home, recents, notifications, quick_settings, take_screenshot, or lock_screen."));
        functionDeclarations.add(createFunction(
                "perform_global_action",
                "Executes system-level Android navigation actions.",
                navProps,
                new String[]{"action"}
        ));

        // 6. open_app
        JsonObject appProps = new JsonObject();
        appProps.add("appName", createStringProperty("The name of the application to open (e.g., 'WhatsApp', 'YouTube', 'Settings', 'GCash')."));
        functionDeclarations.add(createFunction(
                "open_app",
                "Searches installed applications and launches the requested app.",
                appProps,
                new String[]{"appName"}
        ));

        // 7. make_phone_call
        JsonObject callProps = new JsonObject();
        callProps.add("contactNameOrNumber", createStringProperty("The contact name (e.g. 'Mom') or direct phone number to call."));
        functionDeclarations.add(createFunction(
                "make_phone_call",
                "Initiates an outgoing phone call to a contact or phone number.",
                callProps,
                new String[]{"contactNameOrNumber"}
        ));

        // 8. send_sms
        JsonObject smsProps = new JsonObject();
        smsProps.add("recipient", createStringProperty("Contact name or phone number of recipient."));
        smsProps.add("message", createStringProperty("The SMS message text body to send."));
        functionDeclarations.add(createFunction(
                "send_sms",
                "Sends a direct text message (SMS) to the specified recipient.",
                smsProps,
                new String[]{"recipient", "message"}
        ));

        // 9. toggle_hardware
        JsonObject hardProps = new JsonObject();
        hardProps.add("setting", createStringProperty("Hardware feature: flashlight, volume, dnd, wifi, bluetooth, or brightness."));
        hardProps.add("state", createBooleanProperty("true to enable/turn on, false to disable/turn off."));
        hardProps.add("level", createIntegerProperty("Numeric level for volume (0-15) or brightness (0-255). Pass -1 if not applicable."));
        functionDeclarations.add(createFunction(
                "toggle_hardware",
                "Controls hardware features including flashlight torch, volume levels, Do Not Disturb, and settings panels.",
                hardProps,
                new String[]{"setting"}
        ));

        // 10. set_alarm_or_timer
        JsonObject alarmProps = new JsonObject();
        alarmProps.add("hour", createIntegerProperty("Alarm hour in 24-hour format (0-23). Pass 0 for timers."));
        alarmProps.add("minute", createIntegerProperty("Alarm minute (0-59). Pass 0 for timers."));
        alarmProps.add("seconds", createIntegerProperty("Timer duration in seconds. Pass 0 if setting an alarm."));
        alarmProps.add("label", createStringProperty("Label or description for the alarm/timer."));
        functionDeclarations.add(createFunction(
                "set_alarm_or_timer",
                "Sets a system clock alarm for a specific time or starts a countdown timer.",
                alarmProps,
                new String[]{"label"}
        ));

        // 11. get_device_telemetry
        functionDeclarations.add(createFunction(
                "get_device_telemetry",
                "Retrieves device battery level, charging state, network type, free RAM, available storage, and audio volume.",
                new JsonObject(),
                new String[]{}
        ));

        // 12. reply_to_notification
        JsonObject replyProps = new JsonObject();
        replyProps.add("senderOrApp", createStringProperty("Name of sender or application whose notification to reply to."));
        replyProps.add("replyText", createStringProperty("The reply message to submit."));
        functionDeclarations.add(createFunction(
                "reply_to_notification",
                "Replies directly to an incoming notification in the background without launching the app.",
                replyProps,
                new String[]{"senderOrApp", "replyText"}
        ));

        toolWrapper.add("function_declarations", functionDeclarations);
        toolsArray.add(toolWrapper);
        return toolsArray;
    }

    private static JsonObject createFunction(String name, String description, JsonObject properties, String[] required) {
        JsonObject fn = new JsonObject();
        fn.addProperty("name", name);
        fn.addProperty("description", description);

        JsonObject parameters = new JsonObject();
        parameters.addProperty("type", "OBJECT");
        parameters.add("properties", properties);

        JsonArray requiredArray = new JsonArray();
        for (String req : required) {
            requiredArray.add(req);
        }
        parameters.add("required", requiredArray);

        fn.add("parameters", parameters);
        return fn;
    }

    private static JsonObject createStringProperty(String description) {
        JsonObject prop = new JsonObject();
        prop.addProperty("type", "STRING");
        prop.addProperty("description", description);
        return prop;
    }

    private static JsonObject createBooleanProperty(String description) {
        JsonObject prop = new JsonObject();
        prop.addProperty("type", "BOOLEAN");
        prop.addProperty("description", description);
        return prop;
    }

    private static JsonObject createIntegerProperty(String description) {
        JsonObject prop = new JsonObject();
        prop.addProperty("type", "INTEGER");
        prop.addProperty("description", description);
        return prop;
    }
}
