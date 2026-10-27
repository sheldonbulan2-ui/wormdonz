import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WormDonzColors {
  // OLED Dark Palette (Default)
  static const Color oledBlack = Color(0xFF000000);
  static const Color darkCharcoal = Color(0xFF1C1C1E);
  static const Color surfaceCharcoal = Color(0xFF212121);
  static const Color activePillDark = Color(0xFF2C2C2E);
  static const Color borderDark = Color(0xFF38383A);
  static const Color primaryTextDark = Color(0xFFFFFFFF);
  static const Color secondaryTextDark = Color(0xFF8E8E93);
  static const Color electricBlue = Color(0xFF0A84FF);

  // Clean Light Palette
  static const Color pureWhite = Color(0xFFFFFFFF);
  static const Color softGray = Color(0xFFF2F2F7);
  static const Color activePillLight = Color(0xFFE5E5EA);
  static const Color borderLight = Color(0xFFD1D1D6);
  static const Color primaryTextLight = Color(0xFF1C1C1E);
  static const Color secondaryTextLight = Color(0xFF636366);
  static const Color accentLight = Color(0xFF007AFF);
}

class ThemeProvider extends ChangeNotifier {
  static const String _themePrefKey = 'wormdonz_theme_mode';
  ThemeMode _themeMode = ThemeMode.dark; // Dark by default as requested

  ThemeProvider() {
    _loadThemeFromPrefs();
  }

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  void toggleTheme() async {
    _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themePrefKey, _themeMode == ThemeMode.dark ? 'dark' : 'light');
  }

  void setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themePrefKey, mode == ThemeMode.dark ? 'dark' : 'light');
  }

  Future<void> _loadThemeFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedTheme = prefs.getString(_themePrefKey);
      if (savedTheme == 'light') {
        _themeMode = ThemeMode.light;
      } else {
        _themeMode = ThemeMode.dark; // Default OLED Black
      }
      notifyListeners();
    } catch (_) {
      // SharedPreferences fallback
    }
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: WormDonzColors.oledBlack,
      canvasColor: WormDonzColors.oledBlack,
      cardColor: WormDonzColors.darkCharcoal,
      colorScheme: const ColorScheme.dark(
        background: WormDonzColors.oledBlack,
        surface: WormDonzColors.darkCharcoal,
        primary: WormDonzColors.electricBlue,
        secondary: WormDonzColors.activePillDark,
        onBackground: WormDonzColors.primaryTextDark,
        onSurface: WormDonzColors.primaryTextDark,
        outline: WormDonzColors.borderDark,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme.copyWith(
          titleLarge: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: WormDonzColors.primaryTextDark,
            letterSpacing: -0.3,
          ),
          titleMedium: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: WormDonzColors.primaryTextDark,
          ),
          bodyLarge: const TextStyle(
            fontSize: 15,
            color: WormDonzColors.primaryTextDark,
            height: 1.45,
          ),
          bodyMedium: const TextStyle(
            fontSize: 14,
            color: WormDonzColors.primaryTextDark,
            height: 1.4,
          ),
          bodySmall: const TextStyle(
            fontSize: 12,
            color: WormDonzColors.secondaryTextDark,
          ),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: WormDonzColors.oledBlack,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: WormDonzColors.primaryTextDark),
      ),
      dividerTheme: const DividerThemeData(
        color: WormDonzColors.borderDark,
        thickness: 0.6,
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: WormDonzColors.pureWhite,
      canvasColor: WormDonzColors.pureWhite,
      cardColor: WormDonzColors.softGray,
      colorScheme: const ColorScheme.light(
        background: WormDonzColors.pureWhite,
        surface: WormDonzColors.softGray,
        primary: WormDonzColors.accentLight,
        secondary: WormDonzColors.activePillLight,
        onBackground: WormDonzColors.primaryTextLight,
        onSurface: WormDonzColors.primaryTextLight,
        outline: WormDonzColors.borderLight,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.light().textTheme.copyWith(
          titleLarge: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: WormDonzColors.primaryTextLight,
            letterSpacing: -0.3,
          ),
          titleMedium: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: WormDonzColors.primaryTextLight,
          ),
          bodyLarge: const TextStyle(
            fontSize: 15,
            color: WormDonzColors.primaryTextLight,
            height: 1.45,
          ),
          bodyMedium: const TextStyle(
            fontSize: 14,
            color: WormDonzColors.primaryTextLight,
            height: 1.4,
          ),
          bodySmall: const TextStyle(
            fontSize: 12,
            color: WormDonzColors.secondaryTextLight,
          ),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: WormDonzColors.pureWhite,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: WormDonzColors.primaryTextLight),
      ),
      dividerTheme: const DividerThemeData(
        color: WormDonzColors.borderLight,
        thickness: 0.6,
      ),
    );
  }
}
