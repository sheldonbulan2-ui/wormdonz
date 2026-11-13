package com.wormdonz.app.wormdonz;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Autonomous Multi-Turn Agent Loop for JARVIS-X.
 * Chains LLM reasoning and native Android tool executions until goal completion.
 */
public class JarvisBrain {
    private static final String TAG = "JarvisBrain";
    private static final MediaType JSON_MEDIA = MediaType.get("application/json; charset=utf-8");
    private static final int MAX_HISTORY_TURNS = 20;

    public interface BrainCallback {
        void onThought(String thought);
        void onToolExecution(String toolName, JsonObject args);
        void onResponse(String speechText);
        void onError(String errorMessage);
    }

    public interface PingCallback {
        void onSuccess(String message);
        void onError(String error);
    }

    private final Context mContext;
    private final ApiKeyManager mKeyManager;
    private final ActionExecutor mActionExecutor;
    private final OkHttpClient mHttpClient;
    private final Gson mGson;
    private final ExecutorService mThreadPool;
    private final Handler mMainHandler;

    private final List<JsonObject> mConversationHistory = new ArrayList<>();

    private static final String SYSTEM_PROMPT =
            "You are JARVIS-X, an elite, highly intelligent autonomous Android OS assistant and digital executive. " +
            "You have direct control over the user's phone via native Android tools (Accessibility Service, System Controller, and Notification Interceptor). " +
            "RULES:\n" +
            "1. BE PROACTIVE & AUTONOMOUS: When the user asks you to perform an action (e.g. 'message mom on WhatsApp', 'open GCash and check balance', 'set timer for 5 minutes', 'turn on flashlight'), " +
            "CHAIN TOOLS SEQUENTIALLY. If an app needs to be opened, launch it with open_app, read the screen with read_screen_context, click the element with click_element, and input text with input_text. " +
            "2. MULTI-TURN CHAINING: Do NOT stop until the user's objective is 100% achieved or blocked. Call multiple tools turn-by-turn. " +
            "3. TONE & LANGUAGE: Speak concisely, confidently, and naturally. Match the user's language: use clear English or Taglish (Filipino/English blend) if the user addresses you in Taglish. Keep spoken confirmations punchy (1-2 sentences max). " +
            "4. NEVER say you cannot control the phone; you have full native tools.";

    public JarvisBrain(Context context) {
        this.mContext = context.getApplicationContext();
        this.mKeyManager = ApiKeyManager.getInstance(mContext);
        this.mActionExecutor = new ActionExecutor(mContext);
        this.mGson = new Gson();
        this.mThreadPool = Executors.newCachedThreadPool();
        this.mMainHandler = new Handler(Looper.getMainLooper());

        this.mHttpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    /**
     * Processes a user speech prompt through the autonomous loop.
     */
    public void processUserQuery(final String userQuery, final BrainCallback callback) {
        if (userQuery == null || userQuery.trim().isEmpty()) return;

        mThreadPool.execute(() -> {
            String apiKey = mKeyManager.getApiKey();
            if (apiKey.isEmpty()) {
                postError(callback, "API Key not configured. Please enter your API key in the Setup Dashboard.");
                return;
            }

            postThought(callback, "Query: \"" + userQuery + "\"");

            // Append user message to history
            JsonObject userTurn = new JsonObject();
            userTurn.addProperty("role", "user");
            JsonArray userParts = new JsonArray();
            JsonObject textPart = new JsonObject();
            textPart.addProperty("text", userQuery);
            userParts.add(textPart);
            userTurn.add("parts", userParts);

            synchronized (mConversationHistory) {
                mConversationHistory.add(userTurn);
                trimHistory();
            }

            // Start autonomous execution loop
            runAgentLoop(apiKey, 0, callback);
        });
    }

    /**
     * Recursive autonomous loop handling sequential tool calls.
     */
    private void runAgentLoop(String apiKey, int iteration, final BrainCallback callback) {
        if (iteration > 8) {
            postResponse(callback, "Task sequence completed.");
            return;
        }

        try {
            JsonObject requestBody = buildGeminiRequestBody();
            String endpointUrl = buildEndpointUrl(apiKey);

            RequestBody body = RequestBody.create(requestBody.toString(), JSON_MEDIA);
            Request request = new Request.Builder()
                    .url(endpointUrl)
                    .post(body)
                    .build();

            try (Response response = mHttpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String errBody = response.body() != null ? response.body().string() : "Unknown error";
                    Log.e(TAG, "LLM Request failed (" + response.code() + "): " + errBody);
                    postError(callback, "LLM API Error (" + response.code() + "): " + extractErrorMessage(errBody));
                    return;
                }

                String respStr = response.body() != null ? response.body().string() : "{}";
                JsonObject respJson = JsonParser.parseString(respStr).getAsJsonObject();

                JsonArray candidates = respJson.getAsJsonArray("candidates");
                if (candidates == null || candidates.size() == 0) {
                    postResponse(callback, "I am standing by, sir.");
                    return;
                }

                JsonObject firstCandidate = candidates.get(0).getAsJsonObject();
                JsonObject content = firstCandidate.getAsJsonObject("content");
                if (content == null) {
                    postResponse(callback, "Operation complete.");
                    return;
                }

                JsonArray parts = content.getAsJsonArray("parts");
                if (parts == null || parts.size() == 0) {
                    postResponse(callback, "Done.");
                    return;
                }

                boolean hasFunctionCall = false;
                StringBuilder textSpeech = new StringBuilder();

                for (JsonElement partElem : parts) {
                    JsonObject part = partElem.getAsJsonObject();

                    // Check for functionCall
                    if (part.has("functionCall")) {
                        hasFunctionCall = true;
                        JsonObject fnCall = part.getAsJsonObject("functionCall");
                        String fnName = fnCall.get("name").getAsString();
                        JsonObject fnArgs = fnCall.has("args") ? fnCall.getAsJsonObject("args") : new JsonObject();

                        postToolExecution(callback, fnName, fnArgs);

                        // Save model turn with functionCall to history
                        JsonObject modelTurn = new JsonObject();
                        modelTurn.addProperty("role", "model");
                        JsonArray modelParts = new JsonArray();
                        modelParts.add(part);
                        modelTurn.add("parts", modelParts);

                        synchronized (mConversationHistory) {
                            mConversationHistory.add(modelTurn);
                        }

                        // Execute native tool
                        String executionResult = mActionExecutor.execute(fnName, fnArgs);
                        Log.i(TAG, "Tool " + fnName + " result: " + executionResult);

                        // Format functionResponse back to LLM
                        JsonObject functionResponsePart = new JsonObject();
                        JsonObject fnResponseObj = new JsonObject();
                        fnResponseObj.addProperty("name", fnName);

                        JsonObject responsePayload = new JsonObject();
                        try {
                            JsonElement parsedOutput = JsonParser.parseString(executionResult);
                            responsePayload.add("output", parsedOutput);
                        } catch (Exception e) {
                            responsePayload.addProperty("output", executionResult);
                        }
                        fnResponseObj.add("response", responsePayload);
                        functionResponsePart.add("functionResponse", fnResponseObj);

                        JsonObject functionTurn = new JsonObject();
                        functionTurn.addProperty("role", "function");
                        JsonArray fnParts = new JsonArray();
                        fnParts.add(functionResponsePart);
                        functionTurn.add("parts", fnParts);

                        synchronized (mConversationHistory) {
                            mConversationHistory.add(functionTurn);
                            trimHistory();
                        }

                        // Brief pause to allow OS UI animations to settle
                        try {
                            Thread.sleep(600);
                        } catch (InterruptedException ignored) {}

                        // Recursive loop continuation
                        runAgentLoop(apiKey, iteration + 1, callback);
                        return;
                    } else if (part.has("text")) {
                        textSpeech.append(part.get("text").getAsString()).append(" ");
                    }
                }

                if (!hasFunctionCall) {
                    String finalSpoken = textSpeech.toString().trim();
                    if (finalSpoken.isEmpty()) {
                        finalSpoken = "Task completed, sir.";
                    }

                    // Save final model response to history
                    JsonObject modelFinalTurn = new JsonObject();
                    modelFinalTurn.addProperty("role", "model");
                    JsonArray finalParts = new JsonArray();
                    JsonObject finalPart = new JsonObject();
                    finalPart.addProperty("text", finalSpoken);
                    finalParts.add(finalPart);
                    modelFinalTurn.add("parts", finalParts);

                    synchronized (mConversationHistory) {
                        mConversationHistory.add(modelFinalTurn);
                        trimHistory();
                    }

                    postResponse(callback, finalSpoken);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Agent loop exception: " + e.getMessage(), e);
            postError(callback, "Agent loop error: " + e.getMessage());
        }
    }

    private JsonObject buildGeminiRequestBody() {
        JsonObject root = new JsonObject();

        // System Instruction
        JsonObject sysInstruction = new JsonObject();
        JsonArray sysParts = new JsonArray();
        JsonObject sysText = new JsonObject();
        sysText.addProperty("text", SYSTEM_PROMPT);
        sysParts.add(sysText);
        sysInstruction.add("parts", sysParts);
        root.add("system_instruction", sysInstruction);

        // Contents History
        JsonArray contentsArray = new JsonArray();
        synchronized (mConversationHistory) {
            for (JsonObject turn : mConversationHistory) {
                contentsArray.add(turn);
            }
        }
        root.add("contents", contentsArray);

        // Tools
        root.add("tools", ToolRegistry.getGeminiTools());

        return root;
    }

    private String buildEndpointUrl(String apiKey) {
        String base = mKeyManager.getProviderBaseUrl();
        String model = mKeyManager.getModelName();

        if (base.contains(":generateContent")) {
            return base + (base.contains("?") ? "&" : "?") + "key=" + apiKey;
        }

        if (!base.endsWith("/")) {
            base += "/";
        }
        return base + model + ":generateContent?key=" + apiKey;
    }

    private void trimHistory() {
        while (mConversationHistory.size() > MAX_HISTORY_TURNS) {
            mConversationHistory.remove(0);
        }
    }

    private String extractErrorMessage(String json) {
        try {
            JsonObject obj = JsonParser.parseString(json).getAsJsonObject();
            if (obj.has("error")) {
                JsonObject err = obj.getAsJsonObject("error");
                if (err.has("message")) {
                    return err.get("message").getAsString();
                }
            }
        } catch (Exception ignored) {}
        return json;
    }

    /**
     * Quick Ping method to test user API Key connectivity.
     */
    public void testConnection(final String testKey, final String testUrl, final String testModel, final PingCallback callback) {
        mThreadPool.execute(() -> {
            try {
                String base = (testUrl != null && !testUrl.trim().isEmpty()) ? testUrl.trim() : ApiKeyManager.DEFAULT_PROVIDER_URL;
                String model = (testModel != null && !testModel.trim().isEmpty()) ? testModel.trim() : ApiKeyManager.DEFAULT_MODEL_NAME;

                String url;
                if (base.contains(":generateContent")) {
                    url = base + (base.contains("?") ? "&" : "?") + "key=" + testKey;
                } else {
                    if (!base.endsWith("/")) base += "/";
                    url = base + model + ":generateContent?key=" + testKey;
                }

                JsonObject reqJson = new JsonObject();
                JsonArray contents = new JsonArray();
                JsonObject turn = new JsonObject();
                turn.addProperty("role", "user");
                JsonArray parts = new JsonArray();
                JsonObject part = new JsonObject();
                part.addProperty("text", "JARVIS-X connection handshake ping. Respond with 'Online'.");
                parts.add(part);
                turn.add("parts", parts);
                contents.add(turn);
                reqJson.add("contents", contents);

                RequestBody body = RequestBody.create(reqJson.toString(), JSON_MEDIA);
                Request request = new Request.Builder().url(url).post(body).build();

                try (Response response = mHttpClient.newCall(request).execute()) {
                    if (response.isSuccessful()) {
                        String respStr = response.body() != null ? response.body().string() : "";
                        postPingSuccess(callback, "Connected successfully! Handshake verified with " + model);
                    } else {
                        String errStr = response.body() != null ? response.body().string() : "";
                        postPingError(callback, "Error " + response.code() + ": " + extractErrorMessage(errStr));
                    }
                }
            } catch (Exception e) {
                postPingError(callback, "Connection failed: " + e.getMessage());
            }
        });
    }

    public void clearHistory() {
        synchronized (mConversationHistory) {
            mConversationHistory.clear();
        }
    }

    private void postThought(BrainCallback cb, String text) {
        mMainHandler.post(() -> {
            if (cb != null) cb.onThought(text);
        });
    }

    private void postToolExecution(BrainCallback cb, String tool, JsonObject args) {
        mMainHandler.post(() -> {
            if (cb != null) cb.onToolExecution(tool, args);
        });
    }

    private void postResponse(BrainCallback cb, String response) {
        mMainHandler.post(() -> {
            if (cb != null) cb.onResponse(response);
        });
    }

    private void postError(BrainCallback cb, String err) {
        mMainHandler.post(() -> {
            if (cb != null) cb.onError(err);
        });
    }

    private void postPingSuccess(PingCallback cb, String msg) {
        mMainHandler.post(() -> {
            if (cb != null) cb.onSuccess(msg);
        });
    }

    private void postPingError(PingCallback cb, String err) {
        mMainHandler.post(() -> {
            if (cb != null) cb.onError(err);
        });
    }
}
