package com.wormdonz.app.wormdonz;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Setup and Control Dashboard for JARVIS-X Autonomous Operating System Assistant.
 */
public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";

    private View viewHeaderStatusDot;
    private TextView tvHeaderSubtitle;
    private MaterialButton btnToggleVoiceService;

    // API Vault inputs
    private TextInputEditText etApiKey;
    private TextInputEditText etProviderUrl;
    private TextInputEditText etModelName;
    private TextInputEditText etWakeWord;
    private MaterialButton btnTestPing;
    private MaterialButton btnSaveConfig;
    private TextView tvPingResult;

    // Permission status dots & buttons
    private View dotAccessibility;
    private MaterialButton btnGrantAccessibility;

    private View dotNotification;
    private MaterialButton btnGrantNotification;

    private View dotOverlay;
    private MaterialButton btnGrantOverlay;

    private View dotRuntime;
    private MaterialButton btnGrantRuntime;

    // Terminal
    private TextView tvTerminalOutput;
    private ScrollView scrollTerminal;
    private TextView btnClearLogs;

    private ApiKeyManager mKeyManager;
    private JarvisBrain mBrain;

    private final SimpleDateFormat mTimeFormat = new SimpleDateFormat("HH:mm:ss", Locale.getDefault());

    private final ActivityResultLauncher<String[]> mPermissionRequestLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), result -> {
                logToTerminal("Runtime permissions updated: " + result.toString());
                refreshPermissionStates();
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mKeyManager = ApiKeyManager.getInstance(this);
        mBrain = new JarvisBrain(this);

        initViews();
        loadSavedConfig();
        setupListeners();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshPermissionStates();
        updateServiceStateButton();
    }

    private void initViews() {
        viewHeaderStatusDot = findViewById(R.id.viewHeaderStatusDot);
        tvHeaderSubtitle = findViewById(R.id.tvHeaderSubtitle);
        btnToggleVoiceService = findViewById(R.id.btnToggleVoiceService);

        etApiKey = findViewById(R.id.etApiKey);
        etProviderUrl = findViewById(R.id.etProviderUrl);
        etModelName = findViewById(R.id.etModelName);
        etWakeWord = findViewById(R.id.etWakeWord);
        btnTestPing = findViewById(R.id.btnTestPing);
        btnSaveConfig = findViewById(R.id.btnSaveConfig);
        tvPingResult = findViewById(R.id.tvPingResult);

        dotAccessibility = findViewById(R.id.dotAccessibility);
        btnGrantAccessibility = findViewById(R.id.btnGrantAccessibility);

        dotNotification = findViewById(R.id.dotNotification);
        btnGrantNotification = findViewById(R.id.btnGrantNotification);

        dotOverlay = findViewById(R.id.dotOverlay);
        btnGrantOverlay = findViewById(R.id.btnGrantOverlay);

        dotRuntime = findViewById(R.id.dotRuntime);
        btnGrantRuntime = findViewById(R.id.btnGrantRuntime);

        tvTerminalOutput = findViewById(R.id.tvTerminalOutput);
        scrollTerminal = findViewById(R.id.scrollTerminal);
        btnClearLogs = findViewById(R.id.btnClearLogs);

        logToTerminal("JARVIS-X OS Core initialized.");
    }

    private void loadSavedConfig() {
        etApiKey.setText(mKeyManager.getApiKey());
        etProviderUrl.setText(mKeyManager.getProviderBaseUrl());
        etModelName.setText(mKeyManager.getModelName());
        etWakeWord.setText(mKeyManager.getWakeWord());
    }

    private void setupListeners() {
        btnSaveConfig.setOnClickListener(v -> saveConfiguration());
        btnTestPing.setOnClickListener(v -> testConnectionPing());

        btnToggleVoiceService.setOnClickListener(v -> toggleVoiceService());

        btnGrantAccessibility.setOnClickListener(v -> {
            logToTerminal("Redirecting to Accessibility Settings...");
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            startActivity(intent);
        });

        btnGrantNotification.setOnClickListener(v -> {
            logToTerminal("Redirecting to Notification Access Settings...");
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            startActivity(intent);
        });

        btnGrantOverlay.setOnClickListener(v -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                logToTerminal("Requesting Display Overlay Permission...");
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName())
                );
                startActivity(intent);
            }
        });

        btnGrantRuntime.setOnClickListener(v -> requestMissingRuntimePermissions());

        btnClearLogs.setOnClickListener(v -> tvTerminalOutput.setText(""));
    }

    private void saveConfiguration() {
        String key = etApiKey.getText() != null ? etApiKey.getText().toString().trim() : "";
        String url = etProviderUrl.getText() != null ? etProviderUrl.getText().toString().trim() : "";
        String model = etModelName.getText() != null ? etModelName.getText().toString().trim() : "";
        String wakeWord = etWakeWord.getText() != null ? etWakeWord.getText().toString().trim() : "";

        mKeyManager.setApiKey(key);
        mKeyManager.setProviderBaseUrl(url);
        mKeyManager.setModelName(model);
        mKeyManager.setWakeWord(wakeWord);

        logToTerminal("Saved settings: Model=" + mKeyManager.getModelName() + " | WakeWord='" + mKeyManager.getWakeWord() + "'");
        Toast.makeText(this, "Configuration secured in Android Keystore.", Toast.LENGTH_SHORT).show();
    }

    private void testConnectionPing() {
        String key = etApiKey.getText() != null ? etApiKey.getText().toString().trim() : "";
        String url = etProviderUrl.getText() != null ? etProviderUrl.getText().toString().trim() : "";
        String model = etModelName.getText() != null ? etModelName.getText().toString().trim() : "";

        if (key.isEmpty()) {
            tvPingResult.setVisibility(View.VISIBLE);
            tvPingResult.setTextColor(ContextCompat.getColor(this, R.color.jarvis_red));
            tvPingResult.setText("Error: Enter an API Key first.");
            return;
        }

        tvPingResult.setVisibility(View.VISIBLE);
        tvPingResult.setTextColor(ContextCompat.getColor(this, R.color.jarvis_amber));
        tvPingResult.setText("Pinging LLM endpoint...");
        logToTerminal("Testing API handshake with " + model + "...");

        mBrain.testConnection(key, url, model, new JarvisBrain.PingCallback() {
            @Override
            public void onSuccess(String message) {
                tvPingResult.setTextColor(ContextCompat.getColor(MainActivity.this, R.color.jarvis_green));
                tvPingResult.setText(message);
                logToTerminal("[SUCCESS] " + message);
            }

            @Override
            public void onError(String error) {
                tvPingResult.setTextColor(ContextCompat.getColor(MainActivity.this, R.color.jarvis_red));
                tvPingResult.setText(error);
                logToTerminal("[ERROR] " + error);
            }
        });
    }

    private void toggleVoiceService() {
        if (!mKeyManager.isConfigured()) {
            Toast.makeText(this, "Please configure your API Key before starting JARVIS.", Toast.LENGTH_LONG).show();
            return;
        }

        if (JarvisVoiceService.isRunning()) {
            Intent stopIntent = new Intent(this, JarvisVoiceService.class);
            stopService(stopIntent);
            logToTerminal("Stopping JARVIS-X Voice Service...");
        } else {
            if (!Settings.canDrawOverlays(this)) {
                Toast.makeText(this, "Grant 'Draw Over Other Apps' permission for the floating HUD.", Toast.LENGTH_SHORT).show();
            }

            Intent startIntent = new Intent(this, JarvisVoiceService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(startIntent);
            } else {
                startService(startIntent);
            }
            logToTerminal("JARVIS-X Voice Service started in foreground.");
        }

        btnToggleVoiceService.postDelayed(this::updateServiceStateButton, 500);
    }

    private void updateServiceStateButton() {
        boolean running = JarvisVoiceService.isRunning();
        if (running) {
            btnToggleVoiceService.setText("STOP JARVIS-X SERVICE");
            btnToggleVoiceService.setBackgroundColor(ContextCompat.getColor(this, R.color.jarvis_red));
            viewHeaderStatusDot.setBackgroundResource(R.drawable.bg_status_dot_active);
            tvHeaderSubtitle.setText("SYSTEM ONLINE • LISTENING FOR '" + mKeyManager.getWakeWord().toUpperCase() + "'");
        } else {
            btnToggleVoiceService.setText("START JARVIS-X SERVICE");
            btnToggleVoiceService.setBackgroundColor(ContextCompat.getColor(this, R.color.jarvis_cyan));
            viewHeaderStatusDot.setBackgroundResource(R.drawable.bg_status_dot_inactive);
            tvHeaderSubtitle.setText("STANDBY • SERVICE STOPPED");
        }
    }

    private void refreshPermissionStates() {
        // 1. Accessibility Service
        boolean accEnabled = isAccessibilityServiceEnabled(this, JarvisAccessibilityService.class);
        updatePermissionIndicator(dotAccessibility, btnGrantAccessibility, accEnabled);

        // 2. Notification Listener
        boolean notifEnabled = isNotificationListenerEnabled();
        updatePermissionIndicator(dotNotification, btnGrantNotification, notifEnabled);

        // 3. Overlay
        boolean overlayEnabled = Settings.canDrawOverlays(this);
        updatePermissionIndicator(dotOverlay, btnGrantOverlay, overlayEnabled);

        // 4. Runtime
        boolean runtimeEnabled = areRuntimePermissionsGranted();
        updatePermissionIndicator(dotRuntime, btnGrantRuntime, runtimeEnabled);
    }

    private void updatePermissionIndicator(View dot, MaterialButton btn, boolean isGranted) {
        dot.setBackgroundResource(isGranted ? R.drawable.bg_status_dot_active : R.drawable.bg_status_dot_inactive);
        if (isGranted) {
            btn.setText("ACTIVE");
            btn.setEnabled(false);
            btn.setTextColor(ContextCompat.getColor(this, R.color.jarvis_green));
            btn.setStrokeColorResource(R.color.jarvis_green);
        } else {
            btn.setText("GRANT");
            btn.setEnabled(true);
            btn.setTextColor(ContextCompat.getColor(this, R.color.jarvis_cyan));
            btn.setStrokeColorResource(R.color.jarvis_cyan);
        }
    }

    private boolean isAccessibilityServiceEnabled(Context context, Class<?> serviceClass) {
        String expectedService = context.getPackageName() + "/" + serviceClass.getName();
        String enabledServices = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        if (enabledServices == null) return false;

        TextUtils.SimpleStringSplitter colonSplitter = new TextUtils.SimpleStringSplitter(':');
        colonSplitter.setString(enabledServices);
        while (colonSplitter.hasNext()) {
            String componentName = colonSplitter.next();
            if (componentName.equalsIgnoreCase(expectedService)
                    || componentName.endsWith(serviceClass.getSimpleName())) {
                return true;
            }
        }
        return false;
    }

    private boolean isNotificationListenerEnabled() {
        return NotificationManagerCompat.getEnabledListenerPackages(this).contains(getPackageName());
    }

    private boolean areRuntimePermissionsGranted() {
        String[] permissions = getRequiredPermissions();
        for (String perm : permissions) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    private String[] getRequiredPermissions() {
        List<String> list = new ArrayList<>();
        list.add(Manifest.permission.RECORD_AUDIO);
        list.add(Manifest.permission.CALL_PHONE);
        list.add(Manifest.permission.READ_CONTACTS);
        list.add(Manifest.permission.SEND_SMS);
        list.add(Manifest.permission.RECEIVE_SMS);
        list.add(Manifest.permission.READ_SMS);
        list.add(Manifest.permission.CAMERA);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            list.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        return list.toArray(new String[0]);
    }

    private void requestMissingRuntimePermissions() {
        List<String> needed = new ArrayList<>();
        for (String perm : getRequiredPermissions()) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                needed.add(perm);
            }
        }
        if (!needed.isEmpty()) {
            logToTerminal("Requesting runtime permissions: " + needed);
            mPermissionRequestLauncher.launch(needed.toArray(new String[0]));
        } else {
            Toast.makeText(this, "All runtime permissions already granted.", Toast.LENGTH_SHORT).show();
        }
    }

    private void logToTerminal(String text) {
        String time = mTimeFormat.format(new Date());
        String logLine = "[" + time + "] " + text + "\n";
        tvTerminalOutput.append(logLine);
        scrollTerminal.post(() -> scrollTerminal.fullScroll(View.FOCUS_DOWN));
    }
}
