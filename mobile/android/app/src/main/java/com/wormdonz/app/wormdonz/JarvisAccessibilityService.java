package com.wormdonz.app.wormdonz;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Deep UI Automation engine for JARVIS-X.
 * Reads the active window hierarchy and executes clicks, inputs, gestures, and global navigation.
 */
public class JarvisAccessibilityService extends AccessibilityService {
    private static final String TAG = "JarvisAccessibility";
    private static JarvisAccessibilityService sInstance;

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        sInstance = this;
        Log.i(TAG, "JarvisAccessibilityService connected.");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Active event listening if needed for continuous monitoring
    }

    @Override
    public void onInterrupt() {
        Log.w(TAG, "JarvisAccessibilityService interrupted.");
    }

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        sInstance = null;
        return super.onUnbind(intent);
    }

    public static JarvisAccessibilityService getInstance() {
        return sInstance;
    }

    public static boolean isRunning() {
        return sInstance != null;
    }

    /**
     * Reads current screen hierarchy into a structured JSON representation.
     */
    public String readScreenContext() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) {
            JsonObject err = new JsonObject();
            err.addProperty("status", "error");
            err.addProperty("message", "Unable to retrieve root window. Screen may be locked or secure.");
            return err.toString();
        }

        JsonObject screenObj = new JsonObject();
        screenObj.addProperty("status", "success");
        screenObj.addProperty("packageName", root.getPackageName() != null ? root.getPackageName().toString() : "unknown");

        JsonArray elementsArray = new JsonArray();
        traverseNodeHierarchy(root, elementsArray, 0);
        screenObj.add("elements", elementsArray);
        screenObj.addProperty("totalElements", elementsArray.size());

        root.recycle();
        return screenObj.toString();
    }

    private void traverseNodeHierarchy(AccessibilityNodeInfo node, JsonArray array, int depth) {
        if (node == null || depth > 30) return;

        CharSequence text = node.getText();
        CharSequence desc = node.getContentDescription();
        CharSequence viewId = node.getViewIdResourceName();
        CharSequence className = node.getClassName();

        boolean isClickable = node.isClickable();
        boolean isEditable = node.isEditable();
        boolean isScrollable = node.isScrollable();

        Rect bounds = new Rect();
        node.getBoundsInScreen(bounds);

        boolean hasContent = (text != null && text.length() > 0)
                || (desc != null && desc.length() > 0)
                || (viewId != null && viewId.length() > 0)
                || isClickable
                || isEditable;

        if (hasContent && bounds.width() > 0 && bounds.height() > 0) {
            JsonObject element = new JsonObject();
            if (text != null && text.length() > 0) {
                element.addProperty("text", text.toString().trim());
            }
            if (desc != null && desc.length() > 0) {
                element.addProperty("contentDescription", desc.toString().trim());
            }
            if (viewId != null) {
                element.addProperty("viewId", viewId.toString());
            }
            if (className != null) {
                element.addProperty("className", className.toString());
            }
            element.addProperty("clickable", isClickable);
            element.addProperty("editable", isEditable);
            element.addProperty("scrollable", isScrollable);

            JsonObject rectObj = new JsonObject();
            rectObj.addProperty("left", bounds.left);
            rectObj.addProperty("top", bounds.top);
            rectObj.addProperty("right", bounds.right);
            rectObj.addProperty("bottom", bounds.bottom);
            rectObj.addProperty("centerX", bounds.centerX());
            rectObj.addProperty("centerY", bounds.centerY());
            element.add("bounds", rectObj);

            array.add(element);
        }

        int childCount = node.getChildCount();
        for (int i = 0; i < childCount; i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                traverseNodeHierarchy(child, array, depth + 1);
                child.recycle();
            }
        }
    }

    /**
     * Finds and clicks an element by text, content description, or view ID.
     * Uses AccessibilityNodeInfo.ACTION_CLICK with fallback to simulated touch gesture.
     */
    public String clickElement(String textOrId) {
        if (textOrId == null || textOrId.trim().isEmpty()) {
            return errorJson("Target text or viewId cannot be empty.");
        }

        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) {
            return errorJson("Unable to access current window.");
        }

        List<AccessibilityNodeInfo> matchedNodes = new ArrayList<>();
        findMatchingNodes(root, textOrId.trim().toLowerCase(), matchedNodes);

        if (matchedNodes.isEmpty()) {
            root.recycle();
            return errorJson("Element not found matching: '" + textOrId + "'");
        }

        AccessibilityNodeInfo targetNode = matchedNodes.get(0);
        Rect bounds = new Rect();
        targetNode.getBoundsInScreen(bounds);

        // Try direct click on node or parent
        AccessibilityNodeInfo clickableNode = targetNode;
        int parentHops = 0;
        while (clickableNode != null && !clickableNode.isClickable() && parentHops < 4) {
            clickableNode = clickableNode.getParent();
            parentHops++;
        }

        boolean clickSuccess = false;
        if (clickableNode != null && clickableNode.isClickable()) {
            clickSuccess = clickableNode.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        }

        // If node click failed or wasn't supported, dispatch simulated touch gesture
        if (!clickSuccess && bounds.width() > 0 && bounds.height() > 0) {
            clickSuccess = dispatchTapGesture(bounds.centerX(), bounds.centerY());
        }

        // Cleanup
        for (AccessibilityNodeInfo node : matchedNodes) {
            node.recycle();
        }
        root.recycle();

        JsonObject result = new JsonObject();
        result.addProperty("status", clickSuccess ? "success" : "failed");
        result.addProperty("target", textOrId);
        result.addProperty("clickedCoordinates", bounds.centerX() + "," + bounds.centerY());
        return result.toString();
    }

    private void findMatchingNodes(AccessibilityNodeInfo node, String query, List<AccessibilityNodeInfo> results) {
        if (node == null) return;

        CharSequence text = node.getText();
        CharSequence desc = node.getContentDescription();
        CharSequence viewId = node.getViewIdResourceName();

        boolean match = false;
        if (text != null && text.toString().toLowerCase().contains(query)) {
            match = true;
        } else if (desc != null && desc.toString().toLowerCase().contains(query)) {
            match = true;
        } else if (viewId != null && viewId.toString().toLowerCase().contains(query)) {
            match = true;
        }

        if (match) {
            results.add(AccessibilityNodeInfo.obtain(node));
        }

        int childCount = node.getChildCount();
        for (int i = 0; i < childCount; i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                findMatchingNodes(child, query, results);
                child.recycle();
            }
        }
    }

    /**
     * Focuses and types text into an editable element.
     */
    public String inputText(String targetFieldHint, String textToType) {
        if (textToType == null) textToType = "";

        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) {
            return errorJson("Unable to access current window.");
        }

        AccessibilityNodeInfo targetNode = null;

        if (targetFieldHint != null && !targetFieldHint.trim().isEmpty()) {
            List<AccessibilityNodeInfo> matchedNodes = new ArrayList<>();
            findMatchingNodes(root, targetFieldHint.trim().toLowerCase(), matchedNodes);
            for (AccessibilityNodeInfo node : matchedNodes) {
                if (node.isEditable()) {
                    targetNode = node;
                    break;
                }
            }
        }

        if (targetNode == null) {
            targetNode = findFocusedOrFirstEditableNode(root);
        }

        if (targetNode == null) {
            root.recycle();
            return errorJson("No editable text field found on screen.");
        }

        targetNode.performAction(AccessibilityNodeInfo.ACTION_FOCUS);

        Bundle arguments = new Bundle();
        arguments.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, textToType);
        boolean success = targetNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments);

        targetNode.recycle();
        root.recycle();

        JsonObject result = new JsonObject();
        result.addProperty("status", success ? "success" : "failed");
        result.addProperty("injectedText", textToType);
        return result.toString();
    }

    private AccessibilityNodeInfo findFocusedOrFirstEditableNode(AccessibilityNodeInfo node) {
        if (node == null) return null;

        if (node.isFocused() && node.isEditable()) {
            return AccessibilityNodeInfo.obtain(node);
        }

        if (node.isEditable()) {
            return AccessibilityNodeInfo.obtain(node);
        }

        int count = node.getChildCount();
        for (int i = 0; i < count; i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                AccessibilityNodeInfo found = findFocusedOrFirstEditableNode(child);
                child.recycle();
                if (found != null) return found;
            }
        }
        return null;
    }

    /**
     * Scrolls the screen in the requested direction using GestureDescription.
     */
    public String scrollScreen(String direction) {
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        int width = metrics.widthPixels;
        int height = metrics.heightPixels;

        float startX = width / 2.0f;
        float startY = height / 2.0f;
        float endX = startX;
        float endY = startY;

        String dir = direction != null ? direction.trim().toUpperCase() : "DOWN";

        switch (dir) {
            case "UP": // swipe up, moves content downwards
                startY = height * 0.75f;
                endY = height * 0.25f;
                break;
            case "DOWN": // swipe down, moves content upwards
                startY = height * 0.25f;
                endY = height * 0.75f;
                break;
            case "LEFT":
                startX = width * 0.8f;
                endX = width * 0.2f;
                break;
            case "RIGHT":
                startX = width * 0.2f;
                endX = width * 0.8f;
                break;
            default:
                startY = height * 0.75f;
                endY = height * 0.25f;
                break;
        }

        boolean success = dispatchSwipeGesture(startX, startY, endX, endY, 350);

        JsonObject result = new JsonObject();
        result.addProperty("status", success ? "success" : "failed");
        result.addProperty("direction", dir);
        return result.toString();
    }

    /**
     * Executes global navigation actions.
     */
    public String performGlobal(String action) {
        int globalActionCode = -1;
        String act = action != null ? action.trim().toLowerCase() : "";

        switch (act) {
            case "back":
                globalActionCode = GLOBAL_ACTION_BACK;
                break;
            case "home":
                globalActionCode = GLOBAL_ACTION_HOME;
                break;
            case "recents":
                globalActionCode = GLOBAL_ACTION_RECENTS;
                break;
            case "notifications":
                globalActionCode = GLOBAL_ACTION_NOTIFICATIONS;
                break;
            case "quick_settings":
                globalActionCode = GLOBAL_ACTION_QUICK_SETTINGS;
                break;
            case "take_screenshot":
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    globalActionCode = GLOBAL_ACTION_TAKE_SCREENSHOT;
                }
                break;
            case "lock_screen":
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    globalActionCode = GLOBAL_ACTION_LOCK_SCREEN;
                }
                break;
            default:
                break;
        }

        if (globalActionCode == -1) {
            return errorJson("Unsupported global action: " + action);
        }

        boolean success = performGlobalAction(globalActionCode);

        JsonObject res = new JsonObject();
        res.addProperty("status", success ? "success" : "failed");
        res.addProperty("action", action);
        return res.toString();
    }

    public boolean dispatchTapGesture(float x, float y) {
        Path tapPath = new Path();
        tapPath.moveTo(x, y);

        GestureDescription.StrokeDescription stroke =
                new GestureDescription.StrokeDescription(tapPath, 0, 80);
        GestureDescription.Builder builder = new GestureDescription.Builder();
        builder.addStroke(stroke);

        final AtomicBoolean resultHolder = new AtomicBoolean(false);
        final CountDownLatch latch = new CountDownLatch(1);

        boolean dispatched = dispatchGesture(builder.build(), new GestureResultCallback() {
            @Override
            public void onCompleted(GestureDescription gestureDescription) {
                resultHolder.set(true);
                latch.countDown();
            }

            @Override
            public void onCancelled(GestureDescription gestureDescription) {
                resultHolder.set(false);
                latch.countDown();
            }
        }, null);

        if (!dispatched) return false;

        try {
            latch.await(500, TimeUnit.MILLISECONDS);
        } catch (InterruptedException ignored) {}

        return resultHolder.get();
    }

    public boolean dispatchSwipeGesture(float startX, float startY, float endX, float endY, long durationMs) {
        Path swipePath = new Path();
        swipePath.moveTo(startX, startY);
        swipePath.lineTo(endX, endY);

        GestureDescription.StrokeDescription stroke =
                new GestureDescription.StrokeDescription(swipePath, 0, Math.max(durationMs, 100));
        GestureDescription.Builder builder = new GestureDescription.Builder();
        builder.addStroke(stroke);

        final AtomicBoolean resultHolder = new AtomicBoolean(false);
        final CountDownLatch latch = new CountDownLatch(1);

        boolean dispatched = dispatchGesture(builder.build(), new GestureResultCallback() {
            @Override
            public void onCompleted(GestureDescription gestureDescription) {
                resultHolder.set(true);
                latch.countDown();
            }

            @Override
            public void onCancelled(GestureDescription gestureDescription) {
                resultHolder.set(false);
                latch.countDown();
            }
        }, null);

        if (!dispatched) return false;

        try {
            latch.await(durationMs + 300, TimeUnit.MILLISECONDS);
        } catch (InterruptedException ignored) {}

        return resultHolder.get();
    }

    private String errorJson(String msg) {
        JsonObject err = new JsonObject();
        err.addProperty("status", "error");
        err.addProperty("message", msg);
        return err.toString();
    }
}
