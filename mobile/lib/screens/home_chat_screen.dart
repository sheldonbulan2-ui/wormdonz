import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme/theme_provider.dart';
import '../widgets/custom_drawer.dart';
import '../widgets/redeem_code_modal.dart';
import '../widgets/progressive_markdown_view.dart';
import 'subscription_screen.dart';
import 'telegram_login_screen.dart';

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

  late UserModel _currentUser;
  List<ChatModel> _chats = [];
  String? _activeChatId;
  List<ChatMessage> _messages = [];
  String _currentModel = 'EvilGPT Coder Pro';

  final List<Map<String, String>> _availableAiModels = const [
    {
      'id': 'evilgpt-coder-pro',
      'title': 'EvilGPT Coder Pro',
      'subtitle': 'Long code generation, truly uncensored',
    },
    {
      'id': 'evilgpt-big',
      'title': 'EvilGPT BIG',
      'subtitle': 'Flagship reasoning powerhouse, deep analysis',
    },
    {
      'id': 'evilgpt-latest',
      'title': 'EvilGPT Latest',
      'subtitle': 'Fastest flagship — long context, uncensored reasoning',
    },
  ];

  // Streaming & Thinking States
  bool _isStreaming = false;
  bool _isThinking = false;
  int _thinkingDotCount = 1;
  Timer? _thinkingTimer;
  String _streamingText = '';
  StreamSubscription? _streamSub;
  bool _userScrolledUp = false;
  String? _lastUserPrompt;

  // Suggested Prompt Cards
  final List<Map<String, String>> _suggestedPrompts = [
    {
      'title': 'Write code',
      'subtitle': 'Sparse mixture of experts router',
      'prompt': 'Write a Python implementation of a sparse mixture of experts router with normalized weights.'
    },
    {
      'title': 'OLED dark mode',
      'subtitle': 'Color tokens & pure black #000000',
      'prompt': 'Explain the exact design tokens and contrast rules for OLED black interfaces.'
    },
    {
      'title': 'Failover strategy',
      'subtitle': 'Zero-downtime multi-key pool',
      'prompt': 'Explain how recursive multi-key failover works when handling HTTP 429 quota exhaustion.'
    },
    {
      'title': 'Brainstorm ideas',
      'subtitle': 'SaaS credit redemption mechanics',
      'prompt': 'Suggest high-retention promo code mechanics for developer-focused AI tools.'
    },
  ];

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
          MaterialPageRoute(builder: (_) => const TelegramLoginScreen()),
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
                                  if (isSelected)
                                    const Icon(
                                      Icons.check,
                                      color: Color(0xFFFF3B30), // Red checkmark as in screenshot
                                      size: 20,
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
                        '${activeModelMeta['title']} — ${activeModelMeta['subtitle']}',
                        style: const TextStyle(
                          color: Color(0xFFD1D1D6),
                          fontSize: 13,
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

  void _showZeroCreditSheet() {
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
              const Icon(Icons.battery_alert_rounded, color: Colors.orangeAccent, size: 48),
              const SizedBox(height: 12),
              const Text(
                'Credit Balance Depleted',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              const Text(
                'You have 0 credits remaining. Redeem a promo code for instant bonus credits, or upgrade your subscription plan.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey),
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

  Future<void> _handleSendMessage([String? directText]) async {
    if (_isStreaming) return;

    final prompt = (directText ?? _inputController.text).trim();
    if (prompt.isEmpty) return;

    if (_currentUser.credits <= 0 && _currentUser.tier != 'pro') {
      _showZeroCreditSheet();
      return;
    }

    _lastUserPrompt = prompt;

    // 1. Instantly hide empty state & unfocus/clear composer
    _inputController.clear();
    _inputFocusNode.unfocus();

    // 2. Append user message bubble (aligned top-right, dark charcoal #1C1C1E, clean white text)
    final userMsg = ChatMessage(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      chatId: _activeChatId ?? 'new',
      role: 'user',
      content: prompt,
      createdAt: DateTime.now(),
    );

    setState(() {
      _messages.add(userMsg);
      _isStreaming = true;
      _isThinking = true;
      _streamingText = '';
      _userScrolledUp = false;
    });

    _startThinkingAnimation();
    _scrollToBottom(force: true);

    // 3. Initiate SSE / Chunked token streaming
    try {
      final stream = ApiService.streamPrompt(
        prompt: prompt,
        chatId: _activeChatId,
        userId: _currentUser.id,
        model: _currentModel.toLowerCase().replaceAll(' ', '-'),
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

      // Live Credit Deduction (e.g. 10 -> 9)
      if (_currentUser.tier != 'pro') {
        _currentUser.credits = max(0, _currentUser.credits - 1);
      }
    });

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

            // Horizontal Prompt Suggestions (Cleanly hidden on active chat)
            if (!hasContent)
              _buildSuggestedPromptCards(textColor, mutedColor, surfaceColor, isDark),

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
              width: 62,
              height: 62,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: surfaceColor,
                border: Border.all(
                  color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                  width: 0.8,
                ),
                boxShadow: [
                  BoxShadow(
                    color: WormDonzColors.electricBlue.withOpacity(0.15),
                    blurRadius: 24,
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
              'Select a suggestion or ask WormDonz anything.',
              style: TextStyle(fontSize: 13.5, color: mutedColor),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestedPromptCards(Color textColor, Color mutedColor, Color surfaceColor, bool isDark) {
    return Container(
      height: 78,
      margin: const EdgeInsets.only(bottom: 12),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _suggestedPrompts.length,
        itemBuilder: (ctx, idx) {
          final item = _suggestedPrompts[idx];
          return GestureDetector(
            onTap: () => _handleSendMessage(item['prompt']!),
            child: Container(
              width: 195,
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                  width: 0.6,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    item['title']!,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item['subtitle']!,
                    style: TextStyle(
                      fontSize: 11,
                      color: mutedColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
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
          // User Message Bubble (Top-Right aligned, rounded dark charcoal #1C1C1E, clean white text)
          return Align(
            alignment: Alignment.centerRight,
            child: Container(
              margin: const EdgeInsets.only(bottom: 18, left: 54),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
              child: Text(
                msg.content,
                style: TextStyle(
                  fontSize: 14.8,
                  color: textColor,
                  height: 1.45,
                  fontWeight: FontWeight.w400,
                ),
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
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 14),
      decoration: BoxDecoration(
        color: isDark ? WormDonzColors.oledBlack : WormDonzColors.pureWhite,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Left: Circular + Attachment Button (#1C1C1E)
          GestureDetector(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('File & Vision attachments available on Basic & Pro tiers.'),
                  duration: Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: Container(
              width: 44,
              height: 44,
              margin: const EdgeInsets.only(bottom: 2),
              decoration: BoxDecoration(
                color: surfaceColor,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                  width: 0.6,
                ),
              ),
              child: Icon(Icons.add, color: textColor, size: 22),
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
                        hintText: 'Ask WormDonz...',
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

                  // Action Button: Rotating Red Circular Arc Spinner OR Blue Send Button
                  _isStreaming
                      ? Container(
                          width: 32,
                          height: 32,
                          padding: const EdgeInsets.all(4),
                          child: const CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF3B30)), // Continuous Red #FF3B30
                          ),
                        )
                      : GestureDetector(
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
                                size: 19,
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
    );
  }
}
