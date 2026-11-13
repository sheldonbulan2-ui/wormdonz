package com.wormdonz.app.wormdonz;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * Secure dynamic vault for API credentials and runtime configurations.
 * Uses EncryptedSharedPreferences with automatic hardware keystore fallback.
 */
public class ApiKeyManager {
    private static final String TAG = "ApiKeyManager";
    private static final String PREF_FILE_NAME = "jarvis_x_secure_vault";
    private static final String FALLBACK_PREF_NAME = "jarvis_x_vault_fallback";

    private static final String KEY_API_KEY = "jarvis_api_key";
    private static final String KEY_PROVIDER_URL = "jarvis_provider_url";
    private static final String KEY_MODEL_NAME = "jarvis_model_name";
    private static final String KEY_WAKE_WORD = "jarvis_wake_word";

    public static final String DEFAULT_PROVIDER_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    public static final String DEFAULT_MODEL_NAME = "gemini-2.5-flash";
    public static final String DEFAULT_WAKE_WORD = "Jarvis";

    private static ApiKeyManager sInstance;
    private final SharedPreferences mPreferences;

    private ApiKeyManager(Context context) {
        SharedPreferences prefs = null;
        try {
            MasterKey masterKey = new MasterKey.Builder(context.getApplicationContext())
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();

            prefs = EncryptedSharedPreferences.create(
                    context.getApplicationContext(),
                    PREF_FILE_NAME,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (GeneralSecurityException | IOException | RuntimeException e) {
            Log.e(TAG, "EncryptedSharedPreferences initialization failed, falling back to standard prefs: " + e.getMessage());
            prefs = context.getApplicationContext().getSharedPreferences(FALLBACK_PREF_NAME, Context.MODE_PRIVATE);
        }
        mPreferences = prefs;
    }

    public static synchronized ApiKeyManager getInstance(Context context) {
        if (sInstance == null) {
            sInstance = new ApiKeyManager(context.getApplicationContext());
        }
        return sInstance;
    }

    public String getApiKey() {
        return mPreferences.getString(KEY_API_KEY, "");
    }

    public void setApiKey(String apiKey) {
        mPreferences.edit().putString(KEY_API_KEY, apiKey != null ? apiKey.trim() : "").apply();
    }

    public String getProviderBaseUrl() {
        String url = mPreferences.getString(KEY_PROVIDER_URL, DEFAULT_PROVIDER_URL);
        if (url == null || url.trim().isEmpty()) {
            return DEFAULT_PROVIDER_URL;
        }
        return url.trim();
    }

    public void setProviderBaseUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            url = DEFAULT_PROVIDER_URL;
        }
        mPreferences.edit().putString(KEY_PROVIDER_URL, url.trim()).apply();
    }

    public String getModelName() {
        String model = mPreferences.getString(KEY_MODEL_NAME, DEFAULT_MODEL_NAME);
        if (model == null || model.trim().isEmpty()) {
            return DEFAULT_MODEL_NAME;
        }
        return model.trim();
    }

    public void setModelName(String modelName) {
        if (modelName == null || modelName.trim().isEmpty()) {
            modelName = DEFAULT_MODEL_NAME;
        }
        mPreferences.edit().putString(KEY_MODEL_NAME, modelName.trim()).apply();
    }

    public String getWakeWord() {
        String wakeWord = mPreferences.getString(KEY_WAKE_WORD, DEFAULT_WAKE_WORD);
        if (wakeWord == null || wakeWord.trim().isEmpty()) {
            return DEFAULT_WAKE_WORD;
        }
        return wakeWord.trim();
    }

    public void setWakeWord(String wakeWord) {
        if (wakeWord == null || wakeWord.trim().isEmpty()) {
            wakeWord = DEFAULT_WAKE_WORD;
        }
        mPreferences.edit().putString(KEY_WAKE_WORD, wakeWord.trim()).apply();
    }

    public boolean isConfigured() {
        String key = getApiKey();
        return key != null && !key.trim().isEmpty();
    }
}
