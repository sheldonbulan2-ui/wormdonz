import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme/theme_provider.dart';
import '../widgets/custom_drawer.dart';
import '../widgets/redeem_code_modal.dart';
import '../widgets/progressive_markdown_view.dart';
import 'subscription_screen.dart';
import 'auth_screen.dart';

class HomeChatScreen extends StatefulWidget {
  final UserModel? currentUser;
  const HomeChatScreen({Key? key, this.currentUser}) : super(key: key);

  @override
  State<HomeChatScreen> createState() => _HomeChatScreenState();
}

class _HomeChatScreenState extends State<HomeChatScreen> with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _inputFocusNode = FocusNode();

  final ImagePicker _imagePicker = ImagePicker();
  final List<XFile> _selectedImageFiles = [];
  final List<String> _base64Images = [];
  bool _isCompressingImages = false;

  late UserModel _currentUser;
  List<ChatModel> _chats = [];
  String? _activeChatId;
  List<ChatMessage> _messages = [];
  String _currentModel = 'EvilGPT Coder Pro';
  int _lastSentCreditCost = 2;

  final List<Map<String, dynamic>> _availableAiModels = const [
    {
      'id': 'evilgpt-latest',
      'title': 'EvilGPT Latest',
      'subtitle': 'Fastest flagship — uncensored reasoning',
      'credits': 1,
    },
    {
      'id': 'evilgpt-coder-pro',
      'title': 'EvilGPT Coder Pro',
      'subtitle': 'Long code generation, software architecture',
      'credits': 2,
    },
    {
      'id': 'evilgpt-big',
      'title': 'EvilGPT BIG',
      'subtitle': 'Flagship reasoning powerhouse, deep analysis',
      'credits': 3,
    },
  ];

  int _getModelCreditCost(String modelTitle, bool hasImages) {
    final t = modelTitle.toLowerCase();
    int baseCost = 1;
    if (t.contains('coder') || t.contains('pro')) {
      baseCost = 2;
    } else if (t.contains('big') || t.contains('reasoning')) {
      baseCost = 3;
    } else {
      baseCost = 1;
    }
    return baseCost + (hasImages ? 1 : 0);
  }

  // Streaming & Thinking States
  bool _isStreaming = false;
  bool _isThinking = false;
  int _thinkingDotCount = 1;
  Timer? _thinkingTimer;
  String _streamingText = '';
  StreamSubscription? _streamSub;
  bool _userScrolledUp = false;
  String? _lastUserPrompt;

  @override
  void initState() {
    super.initState();
    _currentUser = widget.currentUser ??
        UserModel(
          id: 'pending',
          email: '',
          displayName: 'User',
          credits: 10,
          tier: 'free',
        );

    _scrollController.addListener(_onScroll);
    _loadInitialData();
  }

  @override
  void dispose() {
    _thinkingTimer?.cancel();
    _streamSub?.cancel();
    _inputController.dispose();
    _scrollController.dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    if (maxScroll - currentScroll > 80) {
      if (!_userScrolledUp) {
        setState(() => _userScrolledUp = true);
      }
    } else {
      if (_userScrolledUp) {
        setState(() => _userScrolledUp = false);
      }
    }
  }

  Future<void> _loadInitialData() async {
    final savedUser = widget.currentUser ?? await ApiService.getSavedUserSession();
    if (savedUser == null) {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const AuthScreen()),
        );
      }
      return;
    }

    final user = await ApiService.fetchUserProfile(userId: savedUser.id);
    final chats = await ApiService.fetchUserChats(userId: user.id);

    if (!mounted) return;
    setState(() {
      _currentUser = user;
      _chats = chats;
    });

    if (chats.isNotEmpty) {
      _selectChat(chats.first);
    }
  }

  Future<void> _selectChat(ChatModel chat) async {
    _streamSub?.cancel();
    _thinkingTimer?.cancel();

    setState(() {
      _activeChatId = chat.id;
      _isStreaming = false;
      _isThinking = false;
      _streamingText = '';
    });

    final msgs = await ApiService.fetchChatMessages(chat.id);
    if (!mounted) return;
    setState(() {
      _messages = msgs;
    });

    _scrollToBottom(force: true);
  }

  void _startNewChat() {
    _streamSub?.cancel();
    _thinkingTimer?.cancel();
    setState(() {
      _activeChatId = null;
      _messages = [];
      _isStreaming = false;
      _isThinking = false;
      _streamingText = '';
      _lastUserPrompt = null;
    });
  }

  void _scrollToBottom({bool force = false}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      if (force || !_userScrolledUp) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 60),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _startThinkingAnimation() {
    _thinkingTimer?.cancel();
    _thinkingDotCount = 1;
    _thinkingTimer = Timer.periodic(const Duration(milliseconds: 300), (timer) {
      if (!mounted || !_isThinking) {
        timer.cancel();
        return;
      }
      setState(() {
        _thinkingDotCount = (_thinkingDotCount % 3) + 1;
      });
    });
  }

  void _showModelPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0A0A0C), // Pure OLED dark container
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final activeModelMeta = _availableAiModels.firstWhere(
              (m) => m['title'] == _currentModel,
              orElse: () => _availableAiModels.first,
            );

            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 14, 18, 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Top drag pill
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Model Selection Options (Exact replica of Image 2)
                    ..._availableAiModels.map((item) {
                      final isSelected = item['title'] == _currentModel;
                      return GestureDetector(
                        onTap: () {
                          setState(() => _currentModel = item['title']!);
                          setModalState(() {});
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Switched engine to ${item['title']}'),
                              duration: const Duration(seconds: 1),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF151518) : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? const Color(0xFFFF3B30) : const Color(0xFF242428),
                              width: isSelected ? 1.4 : 0.8,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    item['title']!,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16.5,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF00F5A0).withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(
                                            color: const Color(0xFF00F5A0).withOpacity(0.35),
                                            width: 0.8,
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.bolt_rounded, size: 12, color: Color(0xFF00F5A0)),
                                            const SizedBox(width: 3),
                                            Text(
                                              '${item['credits']} ${item['credits'] == 1 ? 'credit' : 'credits'}',
                                              style: const TextStyle(
                                                color: Color(0xFF00F5A0),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (isSelected) ...[
                                        const SizedBox(width: 8),
                                        const Icon(
                                          Icons.check,
                                          color: Color(0xFFFF3B30), // Red checkmark as in screenshot
                                          size: 20,
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                item['subtitle']!,
                                style: const TextStyle(
                                  color: Color(0xFF00F5A0), // Mint green italic as in screenshot
                                  fontSize: 13,
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),

                    const SizedBox(height: 10),

                    // Bottom Model Status Banner (as shown at bottom of Image 2)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF141416),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF26262B), width: 0.8),
                      ),
                      child: Text(
                        '${activeModelMeta['title']} — ${activeModelMeta['subtitle']} • ${activeModelMeta['credits']} credit(s)/msg (+1 for image upload)',
                        style: const TextStyle(
                          color: Color(0xFFD1D1D6),
                          fontSize: 12.5,
                          fontWeight: FontWeight.w400,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showZeroCreditSheet([int requiredCredits = 1]) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? WormDonzColors.darkCharcoal : WormDonzColors.pureWhite,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 18),
              const Icon(Icons.bolt_rounded, color: Colors.orangeAccent, size: 48),
              const SizedBox(height: 12),
              const Text(
                'Insufficient Credits',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              Text(
                'This model query requires $requiredCredits credits for $_currentModel, but you currently have ${_currentUser.credits} credits remaining. Redeem a promo code or upgrade your plan.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Colors.grey, height: 1.4),
              ),
              const SizedBox(height: 22),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.confirmation_num_outlined, size: 18),
                      label: const Text('Redeem Code'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: WormDonzColors.electricBlue,
                        side: const BorderSide(color: WormDonzColors.electricBlue),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        RedeemCodeModal.show(
                          context,
                          onRedeemed: (newBalance) {
                            setState(() => _currentUser.credits = newBalance);
                            ApiService.saveUserSession(_currentUser);
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.workspace_premium_rounded, size: 18),
                      label: const Text('Upgrade Plan'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: WormDonzColors.electricBlue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => SubscriptionScreen(
                              currentUser: _currentUser,
                              onUpgraded: (user) => setState(() => _currentUser = user),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  void _showImagePaywallSheet({required String message, bool isLifetime = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1C1C1E) : WormDonzColors.pureWhite,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 34),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.lock_outline_rounded, color: Colors.amberAccent, size: 36),
              ),
              const SizedBox(height: 14),
              Text(
                isLifetime ? 'Free Image Uploads Exhausted' : 'Daily Image Upload Quota Reached',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13.5, color: Colors.grey, height: 1.4),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.workspace_premium_rounded, size: 18),
                  label: const Text('Upgrade Subscription Plan'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: WormDonzColors.electricBlue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => SubscriptionScreen(
                          currentUser: _currentUser,
                          onUpgraded: (user) => setState(() => _currentUser = user),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _openAttachmentPickerModal() {
    // 1. Strict Free Tier Lifetime Quota Check
    if (_currentUser.tier == 'free' && _currentUser.imageUsedLifetime >= 3) {
      _showImagePaywallSheet(
        message: 'You have used all 3 Free Lifetime Image Uploads. Upgrade to Starter (10/day), Basic (20/day), or Pro (50/day) to continue image vision analysis.',
        isLifetime: true,
      );
      return;
    }

    // 2. Paid Daily Quota Check
    if (_currentUser.remainingImageQuota <= 0) {
      _showImagePaywallSheet(
        message: 'Your image upload quota for today has been reached. Daily quotas reset at 4:00 PM Philippine Time, or upgrade to a higher tier.',
        isLifetime: false,
      );
      return;
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isFree = _currentUser.tier == 'free';
    final quotaText = isFree
        ? '🖼️ ${_currentUser.remainingImageQuota}/3 Free Lifetime Image Uploads Left'
        : '🖼️ ${_currentUser.remainingImageQuota}/${_currentUser.maxImageAllowed} Daily Image Uploads Left';

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1C1C1E) : WormDonzColors.pureWhite,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 38,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.35),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Title & Description
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Attach for Vision Analysis',
                      style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w700),
                    ),
                    // Quota Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(
                        color: WormDonzColors.electricBlue.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: WormDonzColors.electricBlue.withOpacity(0.3), width: 0.8),
                      ),
                      child: Text(
                        isFree ? '${_currentUser.remainingImageQuota}/3 Left' : '${_currentUser.remainingImageQuota} Left',
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: WormDonzColors.electricBlue,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Upload photos/screenshots for AI vision analysis. AI replies strictly in streaming text/code (No image generation).',
                  style: TextStyle(fontSize: 12, color: isDark ? Colors.grey[400] : Colors.grey[600]),
                ),
                const SizedBox(height: 14),

                // Live Quota Banner
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFF2F2F7),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, size: 16, color: WormDonzColors.electricBlue),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          quotaText,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Option 1: Take Photo (Camera)
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  leading: Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: WormDonzColors.electricBlue.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.camera_alt_rounded, color: WormDonzColors.electricBlue, size: 22),
                  ),
                  title: const Text('Take Photo', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5)),
                  subtitle: const Text('Capture using device camera', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  trailing: const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.camera);
                  },
                ),

                // Option 2: Upload from Gallery (Photo Library)
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  leading: Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: Colors.purpleAccent.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.photo_library_rounded, color: Colors.purpleAccent, size: 22),
                  ),
                  title: const Text('Upload from Gallery', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5)),
                  subtitle: const Text('Choose screenshot or image from photos', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  trailing: const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.gallery);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    if (_selectedImageFiles.length >= 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Maximum 3 images allowed per message.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (_selectedImageFiles.length >= _currentUser.remainingImageQuota) {
      _showImagePaywallSheet(
        message: 'You have reached your remaining image quota limit.',
        isLifetime: _currentUser.tier == 'free',
      );
      return;
    }

    try {
      final picked = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 85,
      );

      if (picked != null) {
        setState(() => _isCompressingImages = true);

        // Compress image to max 1024x1024 at 75% JPEG quality before Base64 encoding
        final base64Url = await ApiService.compressImageToBase64(picked);

        setState(() {
          _selectedImageFiles.add(picked);
          _base64Images.add(base64Url);
          _isCompressingImages = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isCompressingImages = false);
      debugPrint('[HomeChat] Error picking image: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to load image: $e'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _removeSelectedImage(int index) {
    if (index >= 0 && index < _selectedImageFiles.length) {
      setState(() {
        _selectedImageFiles.removeAt(index);
        if (index < _base64Images.length) {
          _base64Images.removeAt(index);
        }
      });
    }
  }

  void _showImageZoomDialog(String imageStr) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.92),
      builder: (ctx) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(12),
          child: Stack(
            alignment: Alignment.center,
            children: [
              InteractiveViewer(
                panEnabled: true,
                minScale: 0.8,
                maxScale: 4.0,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: _renderImageThumbnail(imageStr, isZoom: true),
                ),
              ),
              Positioned(
                top: 10,
                right: 10,
                child: GestureDetector(
                  onTap: () => Navigator.pop(ctx),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: Color(0x99000000),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close, color: Colors.white, size: 20),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _renderImageThumbnail(String imageStr, {bool isZoom = false}) {
    if (imageStr.startsWith('data:image')) {
      final commaIdx = imageStr.indexOf(',');
      final cleanBase64 = commaIdx != -1 ? imageStr.substring(commaIdx + 1) : imageStr;
      try {
        final bytes = base64Decode(cleanBase64);
        return Image.memory(
          bytes,
          fit: isZoom ? BoxFit.contain : BoxFit.cover,
          errorBuilder: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.grey),
        );
      } catch (_) {}
    } else if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
      return Image.network(
        imageStr,
        fit: isZoom ? BoxFit.contain : BoxFit.cover,
        errorBuilder: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.grey),
      );
    }
    return const Icon(Icons.image, color: Colors.grey);
  }

  Future<void> _handleSendMessage([String? directText]) async {
    if (_isStreaming) return;

    final prompt = (directText ?? _inputController.text).trim();
    final hasImages = _base64Images.isNotEmpty;
    if (prompt.isEmpty && !hasImages) return;

    final requiredCredits = _getModelCreditCost(_currentModel, hasImages);
    _lastSentCreditCost = requiredCredits;

    if (_currentUser.tier != 'pro' && _currentUser.credits < requiredCredits) {
      _showZeroCreditSheet(requiredCredits);
      return;
    }

    if (hasImages) {
      if (_currentUser.tier == 'free' && _currentUser.imageUsedLifetime + _base64Images.length > 3) {
        _showImagePaywallSheet(
          message: 'You have exceeded your 3 Free Lifetime Image Uploads. Upgrade to a paid plan for daily vision analysis.',
          isLifetime: true,
        );
        return;
      }
      if (_currentUser.tier != 'free' && _currentUser.remainingImageQuota < _base64Images.length) {
        _showImagePaywallSheet(
          message: 'Insufficient daily image upload allowance. Quotas reset at 4:00 PM PH Time.',
          isLifetime: false,
        );
        return;
      }
    }

    _lastUserPrompt = prompt;

    // Snapshot attached images
    final attachedImages = List<String>.from(_base64Images);

    // 1. Instantly hide empty state & clear composer & attachments
    _inputController.clear();
    _selectedImageFiles.clear();
    _base64Images.clear();
    _inputFocusNode.unfocus();

    // 2. Append user message bubble (aligned top-right, dark charcoal #1C1C1E, clean white text)
    final userMsg = ChatMessage(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      chatId: _activeChatId ?? 'new',
      role: 'user',
      content: prompt,
      images: attachedImages.isNotEmpty ? attachedImages : null,
      createdAt: DateTime.now(),
    );

    setState(() {
      _messages.add(userMsg);
      _isStreaming = true;
      _isThinking = true;
      _streamingText = '';
      _userScrolledUp = false;

      // Update remaining image quota instantly
      if (attachedImages.isNotEmpty) {
        _currentUser.imageUsedLifetime += attachedImages.length;
        _currentUser.imageUsedToday += attachedImages.length;
        _currentUser.remainingImageQuota = max(0, _currentUser.remainingImageQuota - attachedImages.length);
      }
    });

    _startThinkingAnimation();
    _scrollToBottom(force: true);

    // 3. Initiate SSE / Chunked token streaming with attached images
    try {
      final stream = ApiService.streamPrompt(
        prompt: prompt.isEmpty ? 'Analyze the attached image(s).' : prompt,
        chatId: _activeChatId,
        userId: _currentUser.id,
        model: _currentModel.toLowerCase().replaceAll(' ', '-'),
        images: attachedImages,
      );

      _streamSub = stream.listen(
        (event) {
          final type = event['type'];

          if (type == 'token') {
            final token = event['value'] as String? ?? '';
            if (mounted) {
              setState(() {
                if (_isThinking) {
                  _isThinking = false;
                  _thinkingTimer?.cancel();
                }
                _streamingText += token;
              });
              _scrollToBottom();
            }
          } else if (type == 'done') {
            _handleStreamDone(event);
          } else if (type == 'error') {
            if (event['isImageQuotaBlocked'] == true) {
              _showImagePaywallSheet(
                message: event['message'] ?? 'Image upload quota limit reached.',
                isLifetime: _currentUser.tier == 'free',
              );
            }
            _handleStreamError(event);
          }
        },
        onError: (err) {
          _handleStreamError({'message': err.toString()});
        },
        onDone: () {
          if (_isStreaming) {
            _handleStreamDone({});
          }
        },
      );
    } catch (e) {
      _handleStreamError({'message': e.toString()});
    }
  }

  void _handleStreamDone(Map<String, dynamic> metadata) async {
    _streamSub?.cancel();
    _thinkingTimer?.cancel();

    if (!mounted) return;

    final finalReply = _streamingText.isNotEmpty
        ? _streamingText
        : "I have processed your query through the WormDonz AI cluster.";

    final assistantMsg = ChatMessage(
      id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
      chatId: _activeChatId ?? 'chat',
      role: 'assistant',
      content: finalReply,
      tokensUsed: max(16, finalReply.length ~/ 4),
      createdAt: DateTime.now(),
    );

    setState(() {
      _messages.add(assistantMsg);
      _isStreaming = false;
      _isThinking = false;
      _streamingText = '';

      // Dynamic model-dependent credit deduction (1 for Latest, 2 for Coder Pro, 3 for BIG, +1 for vision)
      if (metadata['remainingCredits'] != null && metadata['remainingCredits'] is int) {
        _currentUser.credits = metadata['remainingCredits'] as int;
      } else if (_currentUser.tier != 'pro') {
        final int costToDeduct = (metadata['creditCost'] is int)
            ? metadata['creditCost'] as int
            : _lastSentCreditCost;
        _currentUser.credits = max(0, _currentUser.credits - costToDeduct);
      }
    });

    ApiService.saveUserSession(_currentUser);

    _scrollToBottom(force: true);

    // Refresh chat list in background
    if (_activeChatId != null) {
      final chats = await ApiService.fetchUserChats(userId: _currentUser.id);
      if (mounted) setState(() => _chats = chats);
    }
  }

  void _handleStreamError(Map<String, dynamic> event) {
    _streamSub?.cancel();
    _thinkingTimer?.cancel();

    if (!mounted) return;

    setState(() {
      _isStreaming = false;
      _isThinking = false;
      _streamingText = '';
    });

    if (event['isQuotaBlocked'] == true) {
      setState(() => _currentUser.credits = 0);
      _showZeroCreditSheet();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(event['message'] ?? 'Network or upstream failover failed'),
          backgroundColor: const Color(0xFFFF3B30),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? WormDonzColors.oledBlack : WormDonzColors.pureWhite;
    final surfaceColor = isDark ? WormDonzColors.darkCharcoal : WormDonzColors.softGray;
    final textColor = isDark ? WormDonzColors.primaryTextDark : WormDonzColors.primaryTextLight;
    final mutedColor = isDark ? WormDonzColors.secondaryTextDark : WormDonzColors.secondaryTextLight;

    final hasContent = _messages.isNotEmpty || _isStreaming;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: bgColor,
      drawer: CustomDrawer(
        currentUser: _currentUser,
        chats: _chats,
        activeChatId: _activeChatId,
        onChatSelected: (chat) => _selectChat(chat),
        onNewChat: _startNewChat,
        onUserUpdated: (u) => setState(() => _currentUser = u),
        onChatsRefreshed: () async {
          final updated = await ApiService.fetchUserChats(userId: _currentUser.id);
          if (mounted) setState(() => _chats = updated);
        },
      ),

      // 1. Top App Bar
      appBar: AppBar(
        backgroundColor: bgColor,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 18,
                  height: 2.2,
                  decoration: BoxDecoration(color: textColor, borderRadius: BorderRadius.circular(1)),
                ),
                const SizedBox(height: 5),
                Container(
                  width: 12,
                  height: 2.2,
                  decoration: BoxDecoration(color: textColor, borderRadius: BorderRadius.circular(1)),
                ),
              ],
            ),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        titleSpacing: 0,
        title: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: _showModelPicker,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _currentModel,
                  style: TextStyle(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(width: 2),
                Icon(Icons.chevron_right_rounded, size: 18, color: mutedColor),
              ],
            ),
          ),
        ),
        actions: [
          // Live Credit Pill Badge with Animated Transition
          GestureDetector(
            onTap: () {
              RedeemCodeModal.show(
                context,
                onRedeemed: (newBalance) {
                  setState(() => _currentUser.credits = newBalance);
                },
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                  width: 0.6,
                ),
              ),
              child: Row(
                children: [
                  const Text('⚡', style: TextStyle(fontSize: 12)),
                  const SizedBox(width: 4),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 320),
                    transitionBuilder: (child, animation) {
                      return ScaleTransition(scale: animation, child: child);
                    },
                    child: Text(
                      '${_currentUser.credits}',
                      key: ValueKey<int>(_currentUser.credits),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 6),

          // User / Invite Icon
          IconButton(
            icon: Icon(Icons.person_add_alt_outlined, size: 20, color: textColor),
            onPressed: () {
              Clipboard.setData(const ClipboardData(text: 'https://wormdonz.ai/invite'));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Invite link copied to clipboard!'),
                  duration: Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),

          // New Chat / Clear context icon (dashed circle)
          IconButton(
            icon: Icon(Icons.replay_circle_filled_outlined, size: 22, color: textColor),
            onPressed: _startNewChat,
          ),
          const SizedBox(width: 6),
        ],
      ),

      // 2. Chat Canvas & Dynamic Empty State
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: !hasContent
                  ? _buildEmptyState(textColor, mutedColor, surfaceColor, isDark)
                  : _buildMessagesList(textColor, mutedColor, surfaceColor, isDark),
            ),

            // 3. Floating Bottom Input Bar
            _buildBottomInputBar(textColor, mutedColor, surfaceColor, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(Color textColor, Color mutedColor, Color surfaceColor, bool isDark) {
    return Center(
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: surfaceColor,
                border: Border.all(
                  color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                  width: 0.8,
                ),
                boxShadow: [
                  BoxShadow(
                    color: WormDonzColors.electricBlue.withOpacity(0.18),
                    blurRadius: 28,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Center(
                child: Icon(Icons.auto_awesome, color: WormDonzColors.electricBlue, size: 30),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Where knowledge begins.',
              style: TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.w700,
                color: textColor,
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Ask WormDonz anything.',
              style: TextStyle(fontSize: 13.5, color: mutedColor),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessagesList(Color textColor, Color mutedColor, Color surfaceColor, bool isDark) {
    final userBubbleColor = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF2F2F7);

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      itemCount: _messages.length + (_isStreaming ? 1 : 0),
      itemBuilder: (ctx, idx) {
        // Active Streaming / Thinking Slot
        if (idx == _messages.length && _isStreaming) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with Small Brand Icon
                Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: WormDonzColors.electricBlue,
                      ),
                      child: const Center(
                        child: Icon(Icons.auto_awesome, color: Colors.white, size: 12),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // "Thinking..." Animated State OR "WormDonz" Header
                    if (_isThinking)
                      Text(
                        'Thinking${'.' * _thinkingDotCount}',
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF34C759), // Green accent as requested
                        ),
                      )
                    else
                      Text(
                        'WormDonz: ',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: textColor,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),

                // Live Token Streaming View
                if (!_isThinking && _streamingText.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(left: 30),
                    child: ProgressiveMarkdownView(
                      content: _streamingText,
                      isStreaming: true,
                      isDark: isDark,
                      onRegenerate: () {
                        if (_lastUserPrompt != null) _handleSendMessage(_lastUserPrompt);
                      },
                    ),
                  ),
              ],
            ),
          );
        }

        final msg = _messages[idx];
        final isUser = msg.role == 'user';

        if (isUser) {
          final hasImages = msg.images != null && msg.images!.isNotEmpty;
          // User Message Bubble (Top-Right aligned, rounded dark charcoal #1C1C1E, clean white text)
          return Align(
            alignment: Alignment.centerRight,
            child: Container(
              margin: const EdgeInsets.only(bottom: 18, left: 54),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: BoxDecoration(
                color: userBubbleColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(18),
                  topRight: Radius.circular(18),
                  bottomLeft: Radius.circular(18),
                  bottomRight: Radius.circular(4),
                ),
                border: Border.all(
                  color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE5E5EA),
                  width: 0.8,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Attached Vision Images preview in chat bubble
                  if (hasImages)
                    Padding(
                      padding: EdgeInsets.only(bottom: msg.content.isNotEmpty ? 8 : 0),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.end,
                        children: msg.images!.map((imgStr) {
                          return GestureDetector(
                            onTap: () => _showImageZoomDialog(imgStr),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                width: 80,
                                height: 80,
                                color: Colors.black26,
                                child: _renderImageThumbnail(imgStr),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  if (msg.content.isNotEmpty)
                    Text(
                      msg.content,
                      style: TextStyle(
                        fontSize: 14.8,
                        color: textColor,
                        height: 1.45,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                ],
              ),
            ),
          );
        }

        // Completed Assistant Message with Progressive Markdown & Numbered Code blocks
        return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: WormDonzColors.electricBlue,
                    ),
                    child: const Center(
                      child: Icon(Icons.auto_awesome, color: Colors.white, size: 12),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'WormDonz',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                margin: const EdgeInsets.only(left: 30),
                child: ProgressiveMarkdownView(
                  content: msg.content,
                  isStreaming: false,
                  isDark: isDark,
                  onRegenerate: () {
                    if (_lastUserPrompt != null) _handleSendMessage(_lastUserPrompt);
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBottomInputBar(Color textColor, Color mutedColor, Color surfaceColor, bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 14),
      decoration: BoxDecoration(
        color: isDark ? WormDonzColors.oledBlack : WormDonzColors.pureWhite,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 2. Attachment Preview Strip (Horizontal row directly above input pill)
          if (_selectedImageFiles.isNotEmpty || _isCompressingImages)
            Container(
              height: 74,
              margin: const EdgeInsets.only(bottom: 8),
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  for (int i = 0; i < _selectedImageFiles.length; i++)
                    Container(
                      width: 62,
                      height: 62,
                      margin: const EdgeInsets.only(right: 10, top: 4),
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          // 60x60 Rounded Thumbnail (borderRadius: 12)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: surfaceColor,
                                border: Border.all(
                                  color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                                  width: 0.8,
                                ),
                              ),
                              child: i < _base64Images.length
                                  ? _renderImageThumbnail(_base64Images[i])
                                  : FutureBuilder<Uint8List>(
                                      future: _selectedImageFiles[i].readAsBytes(),
                                      builder: (ctx, snap) {
                                        if (snap.hasData) {
                                          return Image.memory(snap.data!, fit: BoxFit.cover);
                                        }
                                        return const Center(
                                          child: SizedBox(
                                            width: 16,
                                            height: 16,
                                            child: CircularProgressIndicator(strokeWidth: 2),
                                          ),
                                        );
                                      },
                                    ),
                            ),
                          ),
                          // Top-Right Circular ✕ Button to Remove Image
                          Positioned(
                            top: -4,
                            right: -2,
                            child: GestureDetector(
                              onTap: () => _removeSelectedImage(i),
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF2C2C2E) : Colors.black87,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 1.2),
                                ),
                                child: const Center(
                                  child: Icon(Icons.close, color: Colors.white, size: 12),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Compressing Indicator Chip
                  if (_isCompressingImages)
                    Container(
                      width: 60,
                      height: 60,
                      margin: const EdgeInsets.only(right: 10, top: 4),
                      decoration: BoxDecoration(
                        color: surfaceColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                          width: 0.8,
                        ),
                      ),
                      child: const Center(
                        child: SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: WormDonzColors.electricBlue),
                        ),
                      ),
                    ),
                ],
              ),
            ),

          // Composer Row: [+] | [Ask WormDonz... (Mic) (Send)]
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Left: Circular + Attachment Button
              GestureDetector(
                onTap: _openAttachmentPickerModal,
                child: Container(
                  width: 44,
                  height: 44,
                  margin: const EdgeInsets.only(bottom: 1),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                      width: 0.8,
                    ),
                  ),
                  child: Center(
                    child: Icon(Icons.add_rounded, color: textColor, size: 24),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Center-Right: Floating Pill-shaped Text Field ("Ask WormDonz...")
              Expanded(
                child: Container(
                  constraints: const BoxConstraints(minHeight: 46, maxHeight: 120),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                      width: 0.6,
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _inputController,
                          focusNode: _inputFocusNode,
                          readOnly: _isStreaming,
                          maxLines: null,
                          style: TextStyle(color: textColor, fontSize: 14.5),
                          decoration: InputDecoration(
                            hintText: _selectedImageFiles.isNotEmpty ? 'Add context for image...' : 'Ask WormDonz...',
                            hintStyle: TextStyle(color: mutedColor, fontSize: 14.5),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onSubmitted: (_) => _handleSendMessage(),
                        ),
                      ),

                      // Microphone Icon (Voice-to-text toggle)
                      IconButton(
                        icon: Icon(Icons.mic_none_rounded, color: mutedColor, size: 21),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Microphone voice recognition active.'),
                              duration: Duration(seconds: 1),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 6),

                      // Action Button: Rotating Red Circular Arc Spinner OR Blue Send Button (Strict Zero-Layout-Shift)
                      SizedBox(
                        width: 34,
                        height: 34,
                        child: Center(
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 180),
                            child: _isStreaming
                                ? Container(
                                    key: const ValueKey('streaming_spinner'),
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5EA),
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: const Color(0xFFFF3B30).withOpacity(0.35),
                                        width: 1,
                                      ),
                                    ),
                                    child: const Center(
                                      child: SizedBox(
                                        width: 17,
                                        height: 17,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.2,
                                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF3B30)),
                                        ),
                                      ),
                                    ),
                                  )
                                : GestureDetector(
                                    key: const ValueKey('send_button'),
                                    onTap: () => _handleSendMessage(),
                                    child: Container(
                                      width: 32,
                                      height: 32,
                                      decoration: const BoxDecoration(
                                        color: WormDonzColors.electricBlue,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Center(
                                        child: Icon(
                                          Icons.arrow_upward_rounded,
                                          color: Colors.white,
                                          size: 18,
                                        ),
                                      ),
                                    ),
                                  ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
