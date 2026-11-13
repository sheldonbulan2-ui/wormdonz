package com.wormdonz.app.wormdonz;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;

import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.Locale;

/**
 * Always-On Foreground Voice Pipeline and Floating Cybernetic HUD Overlay.
 */
public class JarvisVoiceService extends Service {
    private static final String TAG = "JarvisVoiceService";
    private static final String CHANNEL_ID = "jarvis_x_voice_channel";
    private static final int NOTIF_ID = 1001;

    private static JarvisVoiceService sInstance;

    private WindowManager mWindowManager;
    private View mFloatingHudView;
    private ImageView mOrbView;
    private LinearLayout mBannerLayout;
    private TextView mTvStatus;
    private TextView mTvDetail;

    private SpeechRecognizer mSpeechRecognizer;
    private Intent mSpeechIntent;
    private TextToSpeech mTextToSpeech;

    private JarvisBrain mBrain;
    private ApiKeyManager mKeyManager;
    private Handler mHandler;

    private boolean mIsListening = false;
    private boolean mIsSpeaking = false;
    private boolean mIsInActiveSession = false;
    private long mLastSpeechEndTime = 0;
    private static final long ACTIVE_CONVERSATION_WINDOW_MS = 15000;

    private enum HudState {
        IDLE, LISTENING, THINKING, SPEAKING
    }

    @Override
    public void onCreate() {
        super.onCreate();
        sInstance = this;
        mHandler = new Handler(Looper.getMainLooper());
        mKeyManager = ApiKeyManager.getInstance(this);
        mBrain = new JarvisBrain(this);

        createNotificationChannel();
        startForeground(NOTIF_ID, buildForegroundNotification("Standing by..."));

        initTts();
        initSpeechRecognizer();

        if (Settings.canDrawOverlays(this)) {
            initFloatingHud();
        }

        mHandler.postDelayed(this::startListeningSafely, 1000);
        Log.i(TAG, "JarvisVoiceService started successfully.");
    }

    public static JarvisVoiceService getInstance() {
        return sInstance;
    }

    public static boolean isRunning() {
        return sInstance != null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            if ("ACTION_STOP_SERVICE".equals(intent.getAction())) {
                stopSelf();
                return START_NOT_STICKY;
            } else if ("ACTION_TRIGGER_LISTEN".equals(intent.getAction())) {
                triggerManualListen();
            }
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        sInstance = null;
        stopListening();

        if (mSpeechRecognizer != null) {
            try {
                mSpeechRecognizer.destroy();
            } catch (Exception ignored) {}
            mSpeechRecognizer = null;
        }

        if (mTextToSpeech != null) {
            try {
                mTextToSpeech.stop();
                mTextToSpeech.shutdown();
            } catch (Exception ignored) {}
            mTextToSpeech = null;
        }

        removeFloatingHud();
        super.onDestroy();
        Log.i(TAG, "JarvisVoiceService destroyed.");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "JARVIS-X Autonomous Engine",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Maintains always-on voice recognition and HUD overlay");
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildForegroundNotification(String statusText) {
        Intent openAppIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingOpen = PendingIntent.getActivity(
                this, 0, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent stopIntent = new Intent(this, JarvisVoiceService.class);
        stopIntent.setAction("ACTION_STOP_SERVICE");
        PendingIntent pendingStop = PendingIntent.getService(
                this, 1, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("JARVIS-X OS Controller")
                .setContentText(statusText)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingOpen)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop Service", pendingStop)
                .setOngoing(true)
                .build();
    }

    private void updateNotification(String status) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIF_ID, buildForegroundNotification(status));
        }
    }

    // ==================== FLOATING HUD OVERLAY ====================

    private void initFloatingHud() {
        mWindowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        LayoutInflater inflater = LayoutInflater.from(this);
        mFloatingHudView = inflater.inflate(R.layout.layout_floating_hud, null);

        mOrbView = mFloatingHudView.findViewById(R.id.hudOrbView);
        mBannerLayout = mFloatingHudView.findViewById(R.id.hudBannerLayout);
        mTvStatus = mFloatingHudView.findViewById(R.id.tvHudStatus);
        mTvDetail = mFloatingHudView.findViewById(R.id.tvHudDetail);

        int layoutType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 40;
        params.y = 200;

        // Draggable and touch handler
        mFloatingHudView.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;
            private long touchStartTime;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        touchStartTime = System.currentTimeMillis();
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        mWindowManager.updateViewLayout(mFloatingHudView, params);
                        return true;

                    case MotionEvent.ACTION_UP:
                        long duration = System.currentTimeMillis() - touchStartTime;
                        float deltaX = Math.abs(event.getRawX() - initialTouchX);
                        float deltaY = Math.abs(event.getRawY() - initialTouchY);

                        if (duration < 300 && deltaX < 15 && deltaY < 15) {
                            // Tap event
                            onOrbTapped();
                        } else if (duration >= 800 && deltaX < 15 && deltaY < 15) {
                            // Long press event: open dashboard
                            Intent dashIntent = new Intent(JarvisVoiceService.this, MainActivity.class);
                            dashIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(dashIntent);
                        }
                        return true;
                }
                return false;
            }
        });

        try {
            mWindowManager.addView(mFloatingHudView, params);
            setHudState(HudState.IDLE, "Standby", "Ready for commands");
        } catch (Exception e) {
            Log.e(TAG, "Failed to attach floating HUD window: " + e.getMessage());
        }
    }

    private void removeFloatingHud() {
        if (mWindowManager != null && mFloatingHudView != null) {
            try {
                mWindowManager.removeView(mFloatingHudView);
            } catch (Exception ignored) {}
            mFloatingHudView = null;
        }
    }

    private void onOrbTapped() {
        if (mIsSpeaking) {
            // Cancel TTS speech immediately
            if (mTextToSpeech != null) {
                mTextToSpeech.stop();
            }
            mIsSpeaking = false;
            triggerManualListen();
        } else {
            triggerManualListen();
        }
    }

    public void triggerManualListen() {
        mIsInActiveSession = true;
        mLastSpeechEndTime = System.currentTimeMillis();
        stopListening();
        mHandler.postDelayed(this::startListeningSafely, 200);
    }

    private void setHudState(HudState state, String title, String detail) {
        mHandler.post(() -> {
            if (mOrbView == null) return;

            switch (state) {
                case IDLE:
                    mOrbView.setImageResource(R.drawable.bg_orb_idle);
                    break;
                case LISTENING:
                    mOrbView.setImageResource(R.drawable.bg_orb_listening);
                    break;
                case THINKING:
                    mOrbView.setImageResource(R.drawable.bg_orb_thinking);
                    break;
                case SPEAKING:
                    mOrbView.setImageResource(R.drawable.bg_orb_speaking);
                    break;
            }

            if (mTvStatus != null) mTvStatus.setText(title);
            if (mTvDetail != null) mTvDetail.setText(detail);

            if (mBannerLayout != null) {
                if (state == HudState.IDLE) {
                    mHandler.postDelayed(() -> {
                        if (mBannerLayout != null && !mIsListening && !mIsSpeaking) {
                            mBannerLayout.setVisibility(View.GONE);
                        }
                    }, 4000);
                } else {
                    mBannerLayout.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    // ==================== TEXT TO SPEECH (TTS) ====================

    private void initTts() {
        mTextToSpeech = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                mTextToSpeech.setLanguage(Locale.US);
                mTextToSpeech.setPitch(0.95f);
                mTextToSpeech.setSpeechRate(1.05f);

                mTextToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override
                    public void onStart(String utteranceId) {
                        mIsSpeaking = true;
                        setHudState(HudState.SPEAKING, "SPEAKING", "Responding to user");
                    }

                    @Override
                    public void onDone(String utteranceId) {
                        mIsSpeaking = false;
                        mLastSpeechEndTime = System.currentTimeMillis();
                        mIsInActiveSession = true;
                        setHudState(HudState.IDLE, "READY", "Awaiting reply");
                        updateNotification("Standby");
                        mHandler.postDelayed(JarvisVoiceService.this::startListeningSafely, 300);
                    }

                    @Override
                    public void onError(String utteranceId) {
                        mIsSpeaking = false;
                        setHudState(HudState.IDLE, "READY", "Standing by");
                        mHandler.postDelayed(JarvisVoiceService.this::startListeningSafely, 300);
                    }
                });
            }
        });
    }

    private void speakResponse(String text) {
        if (text == null || text.trim().isEmpty()) return;

        mIsSpeaking = true;
        stopListening();
        setHudState(HudState.SPEAKING, "JARVIS", text);
        updateNotification("Speaking: " + text);

        Bundle params = new Bundle();
        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "JARVIS_RESPONSE_" + System.currentTimeMillis());

        if (mTextToSpeech != null) {
            mTextToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, params, "JARVIS_RESPONSE_" + System.currentTimeMillis());
        }
    }

    // ==================== SPEECH RECOGNIZER ====================

    private void initSpeechRecognizer() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            Log.e(TAG, "Speech recognition is not available on this device.");
            return;
        }

        mSpeechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
        mSpeechIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        mSpeechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        mSpeechIntent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        mSpeechIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        mSpeechIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);

        mSpeechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {
                mIsListening = true;
                setHudState(HudState.LISTENING, "LISTENING", mIsInActiveSession ? "Speak your command" : "Say '" + mKeyManager.getWakeWord() + "'");
            }

            @Override
            public void onBeginningOfSpeech() {}

            @Override
            public void onRmsChanged(float rmsdB) {}

            @Override
            public void onBufferReceived(byte[] buffer) {}

            @Override
            public void onEndOfSpeech() {
                mIsListening = false;
            }

            @Override
            public void onError(int error) {
                mIsListening = false;
                // Auto-restart listening loop if not speaking
                if (!mIsSpeaking) {
                    mHandler.postDelayed(JarvisVoiceService.this::startListeningSafely, 1200);
                }
            }

            @Override
            public void onResults(Bundle results) {
                mIsListening = false;
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    String recognizedText = matches.get(0);
                    handleRecognizedSpeech(recognizedText);
                } else {
                    if (!mIsSpeaking) {
                        mHandler.postDelayed(JarvisVoiceService.this::startListeningSafely, 500);
                    }
                }
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                ArrayList<String> partials = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (partials != null && !partials.isEmpty()) {
                    String partial = partials.get(0);
                    if (mTvDetail != null) {
                        mTvDetail.setText(partial);
                    }
                }
            }

            @Override
            public void onEvent(int eventType, Bundle params) {}
        });
    }

    private void handleRecognizedSpeech(String speech) {
        if (speech == null || speech.trim().isEmpty()) {
            restartListeningCycle();
            return;
        }

        String wakeWord = mKeyManager.getWakeWord().toLowerCase().trim();
        String lowerSpeech = speech.toLowerCase().trim();

        // Check if session is currently active (within 15s after last response)
        boolean isWindowActive = mIsInActiveSession && (System.currentTimeMillis() - mLastSpeechEndTime < ACTIVE_CONVERSATION_WINDOW_MS);

        String promptToExecute = null;

        if (lowerSpeech.contains(wakeWord)) {
            // Wake word detected!
            int idx = lowerSpeech.indexOf(wakeWord);
            promptToExecute = speech.substring(idx + wakeWord.length()).trim();
            if (promptToExecute.isEmpty()) {
                // User only said "Jarvis"
                mIsInActiveSession = true;
                mLastSpeechEndTime = System.currentTimeMillis();
                speakResponse("Yes, I am here. How can I assist you?");
                return;
            }
        } else if (isWindowActive) {
            // In continuous active conversation mode
            promptToExecute = speech;
        }

        if (promptToExecute != null && !promptToExecute.isEmpty()) {
            mIsInActiveSession = true;
            mLastSpeechEndTime = System.currentTimeMillis();
            executeAutonomousCommand(promptToExecute);
        } else {
            restartListeningCycle();
        }
    }

    private void executeAutonomousCommand(String command) {
        setHudState(HudState.THINKING, "THINKING", command);
        updateNotification("Processing: " + command);

        mBrain.processUserQuery(command, new JarvisBrain.BrainCallback() {
            @Override
            public void onThought(String thought) {
                setHudState(HudState.THINKING, "REASONING", thought);
            }

            @Override
            public void onToolExecution(String toolName, JsonObject args) {
                setHudState(HudState.THINKING, "EXECUTING TOOL", toolName);
            }

            @Override
            public void onResponse(String speechText) {
                speakResponse(speechText);
            }

            @Override
            public void onError(String errorMessage) {
                speakResponse(errorMessage);
            }
        });
    }

    private synchronized void startListeningSafely() {
        if (mIsListening || mIsSpeaking || mSpeechRecognizer == null) return;

        try {
            mSpeechRecognizer.startListening(mSpeechIntent);
        } catch (Exception e) {
            Log.e(TAG, "Start listening error: " + e.getMessage());
            mHandler.postDelayed(this::startListeningSafely, 2000);
        }
    }

    private synchronized void stopListening() {
        if (mSpeechRecognizer != null && mIsListening) {
            try {
                mSpeechRecognizer.stopListening();
            } catch (Exception ignored) {}
            mIsListening = false;
        }
    }

    private void restartListeningCycle() {
        if (!mIsSpeaking) {
            setHudState(HudState.IDLE, "STANDBY", "Listening for '" + mKeyManager.getWakeWord() + "'");
            mHandler.postDelayed(this::startListeningSafely, 600);
        }
    }
}
