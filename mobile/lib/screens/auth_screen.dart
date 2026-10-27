import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'home_chat_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({Key? key}) : super(key: key);

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

enum AuthMode { register, verifyOtp, login, forgotPassword, resetPassword }

class _AuthScreenState extends State<AuthScreen> {
  AuthMode _mode = AuthMode.register;

  // Controllers
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPassController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _referralController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  // OTP Timer
  int _resendCountdown = 60;
  Timer? _countdownTimer;
  String? _registeredEmail;
  String? _previewOtp;

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPassController.dispose();
    _otpController.dispose();
    _referralController.dispose();
    super.dispose();
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    setState(() => _resendCountdown = 60);
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCountdown <= 1) {
        timer.cancel();
        if (mounted) setState(() => _resendCountdown = 0);
      } else {
        if (mounted) setState(() => _resendCountdown -= 1);
      }
    });
  }

  Future<void> _handleRegister() async {
    final username = _usernameController.text.trim();
    final email = _emailController.text.trim().toLowerCase();
    final password = _passwordController.text.trim();
    final confirmPass = _confirmPassController.text.trim();

    if (username.isEmpty || email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please fill in all registration fields.');
      return;
    }

    if (username.length < 3) {
      setState(() => _errorMessage = 'Username must be at least 3 characters.');
      return;
    }

    if (!email.contains('@') || !email.contains('.')) {
      setState(() => _errorMessage = 'Please enter a valid Gmail or Email address.');
      return;
    }

    // Client-side quick check for disposable temporary email domains
    final tempMailKeywords = [
      'tempmail', 'temp-mail', '10minutemail', 'guerrillamail', 'sharklasers',
      'mailinator', 'yopmail', 'trashmail', 'dispostable', 'mohmal', 'maildrop',
      'inboxkitten', 'burnermail', 'generator.email', 'dropmail', 'throwawaymail',
      'mytemp.email', 'tempail', 'tmpmail', 'armyspy', 'cuvox', 'dayrep', 'teleworm'
    ];
    final emailDomain = email.split('@').last.toLowerCase();
    if (tempMailKeywords.any((kw) => emailDomain.contains(kw))) {
      setState(() => _errorMessage = '⚠️ Babala: Bawal ang temporary o disposable email (temp-mail). Mangyaring gumamit ng lehitimong Gmail, Yahoo, o personal email para makatanggap ng OTP.');
      return;
    }

    if (password.length < 6) {
      setState(() => _errorMessage = 'Password must be at least 6 characters.');
      return;
    }

    if (password != confirmPass) {
      setState(() => _errorMessage = 'Passwords do not match.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final res = await ApiService.registerWithEmail(
        username: username,
        email: email,
        password: password,
        referralCode: _referralController.text.trim().toUpperCase(),
      );

      if (!mounted) return;

      setState(() {
        _mode = AuthMode.verifyOtp;
        _registeredEmail = email;
        _previewOtp = res['previewOtp'];
        _successMessage = res['message'] ?? 'Verification code sent to $email';
        _otpController.clear();
      });

      _startCountdown();
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString().replaceAll('Exception:', '').trim());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _otpController.text.trim();
    final email = _registeredEmail ?? _emailController.text.trim().toLowerCase();

    if (otp.length < 6) {
      setState(() => _errorMessage = 'Please enter the complete 6-digit OTP code.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await ApiService.verifyEmailOtp(email: email, otp: otp);
      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => HomeChatScreen(currentUser: user)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString().replaceAll('Exception:', '').trim());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleResendOtp() async {
    if (_resendCountdown > 0) return;
    final email = _registeredEmail ?? _emailController.text.trim().toLowerCase();

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.resendOtp(email: email);
      if (!mounted) return;
      setState(() {
        _previewOtp = res['previewOtp'];
        _successMessage = 'A new 6-digit code has been dispatched to $email';
      });
      _startCountdown();
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString().replaceAll('Exception:', '').trim());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleLogin() async {
    final identifier = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (identifier.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please enter your username/email and password.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await ApiService.loginWithEmailOrUsername(
        identifier: identifier,
        password: password,
      );
      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => HomeChatScreen(currentUser: user)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString().replaceAll('Exception:', '').trim());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleForgotPassword() async {
    final email = _emailController.text.trim().toLowerCase();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _errorMessage = 'Please enter your registered email address.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final res = await ApiService.requestPasswordReset(email: email);
      if (!mounted) return;
      setState(() {
        _mode = AuthMode.resetPassword;
        _registeredEmail = email;
        _previewOtp = res['previewOtp'];
        _successMessage = res['message'] ?? 'Password reset code sent to $email';
        _otpController.clear();
        _passwordController.clear();
        _confirmPassController.clear();
      });
      _startCountdown();
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString().replaceAll('Exception:', '').trim());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleResetPassword() async {
    final email = _registeredEmail ?? _emailController.text.trim().toLowerCase();
    final otp = _otpController.text.trim();
    final newPass = _passwordController.text.trim();
    final confirmPass = _confirmPassController.text.trim();

    if (otp.length < 6) {
      setState(() => _errorMessage = 'Please enter the 6-digit verification code.');
      return;
    }

    if (newPass.length < 6) {
      setState(() => _errorMessage = 'New password must be at least 6 characters.');
      return;
    }

    if (newPass != confirmPass) {
      setState(() => _errorMessage = 'Passwords do not match.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await ApiService.resetPassword(
        email: email,
        otp: otp,
        newPassword: newPass,
      );
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFF00F5A0),
          content: Text(
            '🎉 Password reset successfully! Welcome back.',
            style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
          ),
        ),
      );

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => HomeChatScreen(currentUser: user)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString().replaceAll('Exception:', '').trim());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final bgColor = isDark ? const Color(0xFF000000) : const Color(0xFFFFFFFF);
    final cardColor = isDark ? const Color(0xFF141416) : const Color(0xFFF2F2F7);
    final borderColor = isDark ? const Color(0xFF26262B) : const Color(0xFFE5E5EA);
    final textColor = isDark ? Colors.white : const Color(0xFF1C1C1E);
    final subtextColor = isDark ? const Color(0xFF8E8E93) : const Color(0xFF636366);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Brand Header
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5EA),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF0A84FF).withOpacity(0.4), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0A84FF).withOpacity(0.18),
                          blurRadius: 18,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.bolt_rounded, size: 34, color: Color(0xFF0A84FF)),
                  ),
                ),
                const SizedBox(height: 14),

                Text(
                  'WormDonz AI',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: textColor,
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.6,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Uncensored Neural Intelligence & Vision Engine',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: subtextColor, fontSize: 13),
                ),
                const SizedBox(height: 24),

                // Error / Success Message Banners
                if (_errorMessage != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF3B30).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFF3B30).withOpacity(0.35)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Color(0xFFFF3B30), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Color(0xFFFF453A), fontSize: 12.5),
                          ),
                        ),
                      ],
                    ),
                  ),

                if (_successMessage != null && _mode == AuthMode.verifyOtp)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00F5A0).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF00F5A0).withOpacity(0.35)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF00F5A0), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _successMessage!,
                            style: const TextStyle(color: Color(0xFF00F5A0), fontSize: 12.5),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Form Container
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: borderColor, width: 0.8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Mode Selector Tabs (only when not in OTP mode)
                      if (_mode != AuthMode.verifyOtp) ...[
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0A0A0C) : const Color(0xFFE5E5EA),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: _buildTabButton(
                                  title: 'Create Account',
                                  isActive: _mode == AuthMode.register,
                                  onTap: () {
                                    setState(() {
                                      _mode = AuthMode.register;
                                      _errorMessage = null;
                                    });
                                  },
                                ),
                              ),
                              Expanded(
                                child: _buildTabButton(
                                  title: 'Sign In',
                                  isActive: _mode == AuthMode.login,
                                  onTap: () {
                                    setState(() {
                                      _mode = AuthMode.login;
                                      _errorMessage = null;
                                    });
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // 1. REGISTER VIEW
                      if (_mode == AuthMode.register) ...[
                        _buildInputField(
                          controller: _usernameController,
                          label: 'Username',
                          hint: 'e.g. shadow_coder',
                          icon: Icons.alternate_email_rounded,
                        ),
                        const SizedBox(height: 14),
                        _buildInputField(
                          controller: _emailController,
                          label: 'Gmail / Email Address',
                          hint: 'your.name@gmail.com',
                          icon: Icons.mail_outline_rounded,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 14),
                        _buildInputField(
                          controller: _passwordController,
                          label: 'Password',
                          hint: 'At least 6 characters',
                          icon: Icons.lock_outline_rounded,
                          obscureText: _obscurePassword,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              size: 18,
                              color: Colors.grey,
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                        ),
                        const SizedBox(height: 14),
                        _buildInputField(
                          controller: _confirmPassController,
                          label: 'Confirm Password',
                          hint: 'Re-enter your password',
                          icon: Icons.lock_reset_rounded,
                          obscureText: _obscurePassword,
                        ),
                        const SizedBox(height: 14),
                        _buildInputField(
                          controller: _referralController,
                          label: 'Invitation Code (Optional +10 Credits)',
                          hint: 'e.g. WORM-XXXX',
                          icon: Icons.card_giftcard_rounded,
                        ),
                        const SizedBox(height: 20),

                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleRegister,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0A84FF),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text(
                                  'Send Verification Code 📧',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                                ),
                        ),
                      ],

                      // 2. VERIFY OTP VIEW
                      if (_mode == AuthMode.verifyOtp) ...[
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.arrow_back_rounded, size: 20),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () => setState(() => _mode = AuthMode.register),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Verify Email Address',
                              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'We sent a 6-digit confirmation OTP to:',
                          style: TextStyle(fontSize: 12.5, color: subtextColor),
                        ),
                        Text(
                          _registeredEmail ?? _emailController.text,
                          style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: Color(0xFF0A84FF)),
                        ),
                        const SizedBox(height: 10),

                        Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF9F0A).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFFF9F0A).withOpacity(0.35)),
                          ),
                          child: const Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFFFF9F0A)),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Paalala: Kung wala sa Inbox, pakitingnan din ang iyong Spam o Junk folder.',
                                  style: TextStyle(fontSize: 11, color: Color(0xFFFFD180), height: 1.35),
                                ),
                              ),
                            ],
                          ),
                        ),

                        if (_previewOtp != null)
                          GestureDetector(
                            onTap: () {
                              _otpController.text = _previewOtp!;
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 14),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF00F5A0).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFF00F5A0).withOpacity(0.3)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.touch_app_rounded, size: 14, color: Color(0xFF00F5A0)),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Auto-fill Demo Code: $_previewOtp',
                                    style: const TextStyle(color: Color(0xFF00F5A0), fontSize: 11.5, fontWeight: FontWeight.w700),
                                  ),
                                ],
                              ),
                            ),
                          ),

                        _buildInputField(
                          controller: _otpController,
                          label: 'Enter 6-Digit Code',
                          hint: '••••••',
                          icon: Icons.mark_email_read_outlined,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                        ),
                        const SizedBox(height: 16),

                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleVerifyOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0A84FF),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text(
                                  'Verify & Activate (Claim 10 Credits)',
                                  style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700),
                                ),
                        ),
                        const SizedBox(height: 12),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Didn't receive code? ",
                              style: TextStyle(fontSize: 12, color: subtextColor),
                            ),
                            TextButton(
                              onPressed: _resendCountdown > 0 || _isLoading ? null : _handleResendOtp,
                              child: Text(
                                _resendCountdown > 0 ? 'Resend in ${_resendCountdown}s' : 'Resend Code',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: _resendCountdown > 0 ? Colors.grey : const Color(0xFF0A84FF),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],

                      // 3. LOGIN VIEW
                      if (_mode == AuthMode.login) ...[
                        _buildInputField(
                          controller: _emailController,
                          label: 'Username or Gmail',
                          hint: 'Enter your username or email',
                          icon: Icons.person_outline_rounded,
                        ),
                        const SizedBox(height: 14),
                        _buildInputField(
                          controller: _passwordController,
                          label: 'Password',
                          hint: 'Enter your password',
                          icon: Icons.lock_outline_rounded,
                          obscureText: _obscurePassword,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              size: 18,
                              color: Colors.grey,
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                        ),

                        // Forgot Password Link
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {
                              setState(() {
                                _mode = AuthMode.forgotPassword;
                                _errorMessage = null;
                                _successMessage = null;
                              });
                            },
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                color: Color(0xFF0A84FF),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),

                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleLogin,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0A84FF),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text(
                                  'Log In to WormDonz',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                                ),
                        ),
                      ],

                      // 4. FORGOT PASSWORD VIEW (Step 1: Enter email)
                      if (_mode == AuthMode.forgotPassword) ...[
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.arrow_back_rounded, size: 20),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () => setState(() => _mode = AuthMode.login),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Recover Password',
                              style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Enter your registered email address and we will dispatch a 6-digit password reset code.',
                          style: TextStyle(fontSize: 12.5, color: subtextColor, height: 1.4),
                        ),
                        const SizedBox(height: 16),
                        _buildInputField(
                          controller: _emailController,
                          label: 'Registered Gmail / Email',
                          hint: 'name@gmail.com',
                          icon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleForgotPassword,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0A84FF),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text(
                                  'Send Reset Code',
                                  style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700),
                                ),
                        ),
                      ],

                      // 5. RESET PASSWORD VIEW (Step 2: Enter OTP + New Password)
                      if (_mode == AuthMode.resetPassword) ...[
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.arrow_back_rounded, size: 20),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () => setState(() => _mode = AuthMode.forgotPassword),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Set New Password',
                              style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Enter the 6-digit code sent to ${_registeredEmail ?? _emailController.text} along with your new password.',
                          style: TextStyle(fontSize: 12.5, color: subtextColor, height: 1.4),
                        ),
                        const SizedBox(height: 10),

                        Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF9F0A).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFFF9F0A).withOpacity(0.35)),
                          ),
                          child: const Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFFFF9F0A)),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Paalala: Kung wala sa Inbox, pakitingnan din ang iyong Spam o Junk folder.',
                                  style: TextStyle(fontSize: 11, color: Color(0xFFFFD180), height: 1.35),
                                ),
                              ),
                            ],
                          ),
                        ),

                        if (_previewOtp != null)
                          GestureDetector(
                            onTap: () {
                              _otpController.text = _previewOtp!;
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF00F5A0).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFF00F5A0).withOpacity(0.3)),
                              ),
                              child: Text(
                                'Tap to auto-fill code: $_previewOtp',
                                style: const TextStyle(color: Color(0xFF00F5A0), fontSize: 11.5, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),

                        _buildInputField(
                          controller: _otpController,
                          label: '6-Digit Reset Code',
                          hint: '••••••',
                          icon: Icons.pin_outlined,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          controller: _passwordController,
                          label: 'New Password',
                          hint: 'Minimum 6 characters',
                          icon: Icons.lock_outline_rounded,
                          obscureText: _obscurePassword,
                        ),
                        const SizedBox(height: 12),
                        _buildInputField(
                          controller: _confirmPassController,
                          label: 'Confirm New Password',
                          hint: 'Re-enter your new password',
                          icon: Icons.lock_outline_rounded,
                          obscureText: _obscurePassword,
                        ),
                        const SizedBox(height: 16),

                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleResetPassword,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00F5A0),
                            foregroundColor: Colors.black87,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black87),
                                )
                              : const Text(
                                  'Update Password & Log In',
                                  style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
                                ),
                        ),
                        const SizedBox(height: 10),

                        // Resend countdown
                        Center(
                          child: TextButton(
                            onPressed: _resendCountdown > 0 || _isLoading ? null : _handleForgotPassword,
                            child: Text(
                              _resendCountdown > 0 ? 'Resend code in ${_resendCountdown}s' : 'Resend Code',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _resendCountdown > 0 ? Colors.grey : const Color(0xFF0A84FF),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                const SizedBox(height: 16),
                Center(
                  child: Text(
                    '100% Uncensored • Multi-API Zero Downtime • Pure OLED',
                    style: TextStyle(color: subtextColor, fontSize: 11),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabButton({
    required String title,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isActive
              ? (isDark ? const Color(0xFF1C1C1E) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Text(
          title,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13.5,
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
            color: isActive
                ? (isDark ? Colors.white : Colors.black)
                : (isDark ? Colors.grey[500] : Colors.grey[600]),
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool obscureText = false,
    Widget? suffixIcon,
    TextInputType? keyboardType,
    int? maxLength,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isDark ? const Color(0xFFD1D1D6) : const Color(0xFF3A3A3C),
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          maxLength: maxLength,
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black,
            fontSize: 14.5,
          ),
          decoration: InputDecoration(
            counterText: '',
            hintText: hint,
            hintStyle: TextStyle(
              color: isDark ? const Color(0xFF545458) : const Color(0xFFAAAAAA),
              fontSize: 13.5,
            ),
            prefixIcon: Icon(
              icon,
              size: 19,
              color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF636366),
            ),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: isDark ? const Color(0xFF0A0A0C) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFD1D1D6),
                width: 0.8,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: Color(0xFF0A84FF),
                width: 1.4,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
