# Flutter Proguard Rules for WormDonz
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Flutter Image Compress & Image Picker
-dontwarn com.flutter_image_compress.**
-keep class com.flutter_image_compress.** { *; }
-keep class io.flutter.plugins.imagepicker.** { *; }

# Google Play Core split install warnings suppression
-dontwarn com.google.android.play.core.**

# Preserve native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
