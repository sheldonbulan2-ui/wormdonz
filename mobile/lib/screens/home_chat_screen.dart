import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme/theme_provider.dart';
import '../widgets/custom_drawer.dart';
import '../widgets/redeem_code_modal.dart';
import 'subscription_screen.dart';

class HomeChatScreen extends StatefulWidget {
  const HomeChatScreen({Key? key}) : super(key: key);

  @override
  State<HomeChatScreen> createState() => _HomeChatScreenState();
}

class _HomeChatScreenState extends State<HomeChatScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  UserModel _currentUser = UserModel(
    id: 'user-001',
    email: 'dj@wormdonz.ai',
    displayName: 'DJ',
    credits: 10,
    tier: 'free',
  );

  List<ChatModel> _chats = [];
  String? _activeChatId;
  List<ChatMessage> _messages = [];
  bool _isLoading = false;
  String _currentModel = 'WormDonz Base';

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
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final user = await ApiService.fetchUserProfile();
    final chats = await ApiService.fetchUserChats(userId: user.id);

    setState(() {
      _currentUser = user;
      _chats = chats;
    });

    if (chats.isNotEmpty) {
      _selectChat(chats.first);
    }
  }

  Future<void> _selectChat(ChatModel chat) async {
    setState(() {
      _activeChatId = chat.id;
      _isLoading = true;
    });

    final msgs = await ApiService.fetchChatMessages(chat.id);
    setState(() {
      _messages = msgs;
      _isLoading = false;
    });

    _scrollToBottom();
  }

  void _startNewChat() {
    setState(() {
      _activeChatId = null;
      _messages = [];
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showModelPicker() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? WormDonzColors.darkCharcoal : WormDonzColors.pureWhite,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Select AI Engine',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                ),
                const SizedBox(height: 12),
                ListTile(
                  leading: const Icon(Icons.bolt_rounded, color: WormDonzColors.electricBlue),
                  title: const Text('WormDonz Base'),
                  subtitle: const Text('Standard velocity • Low latency • 1 credit'),
                  trailing: _currentModel == 'WormDonz Base' ? const Icon(Icons.check, color: WormDonzColors.electricBlue) : null,
                  onTap: () {
                    setState(() => _currentModel = 'WormDonz Base');
                    Navigator.pop(ctx);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.speed_rounded, color: Colors.orange),
                  title: const Text('WormDonz Fast & Vision'),
                  subtitle: const Text('High throughput • Vision uploads • 1 credit'),
                  trailing: _currentModel == 'WormDonz Fast & Vision' ? const Icon(Icons.check, color: WormDonzColors.electricBlue) : null,
                  onTap: () {
                    setState(() => _currentModel = 'WormDonz Fast & Vision');
                    Navigator.pop(ctx);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.psychology_rounded, color: Colors.purpleAccent),
                  title: const Text('WormDonz Reason Pro (o3-mini)'),
                  subtitle: const Text('Deep CoT reasoning • Pro Tier Exclusive'),
                  trailing: _currentModel.contains('Pro') ? const Icon(Icons.check, color: WormDonzColors.electricBlue) : null,
                  onTap: () {
                    setState(() => _currentModel = 'WormDonz Reason Pro');
                    Navigator.pop(ctx);
                  },
                ),
              ],
            ),
          ),
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
    final prompt = (directText ?? _inputController.text).trim();
    if (prompt.isEmpty) return;

    if (_currentUser.credits <= 0 && _currentUser.tier != 'pro') {
      _showZeroCreditSheet();
      return;
    }

    _inputController.clear();

    // Optimistically add user message
    final tempUserMsg = ChatMessage(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      chatId: _activeChatId ?? 'new',
      role: 'user',
      content: prompt,
      createdAt: DateTime.now(),
    );

    setState(() {
      _messages.add(tempUserMsg);
      _isLoading = true;
    });
    _scrollToBottom();

    // Call failover endpoint
    final res = await ApiService.sendPrompt(
      prompt: prompt,
      chatId: _activeChatId,
      userId: _currentUser.id,
      model: _currentModel.toLowerCase().replaceAll(' ', '-'),
    );

    if (res['isQuotaBlocked'] == true) {
      setState(() {
        _isLoading = false;
        _currentUser.credits = 0;
      });
      _showZeroCreditSheet();
      return;
    }

    if (res['success'] == true) {
      setState(() {
        _activeChatId = res['chatId'];
        _messages.add(res['message'] as ChatMessage);
        _currentUser.credits = res['remainingCredits'] ?? (_currentUser.credits - 1);
        _isLoading = false;
      });

      // Refresh chat list title
      final chats = await ApiService.fetchUserChats(userId: _currentUser.id);
      setState(() => _chats = chats);

      _scrollToBottom();
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['error'] ?? 'Execution failed')),
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
          setState(() => _chats = updated);
        },
      ),

      // 1. Top App Bar
      appBar: AppBar(
        backgroundColor: bgColor,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: Builder(
          builder: (ctx) => IconButton(
            // Staggered two-line hamburger icon as requested
            icon: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(width: 18, height: 2.2, decoration: BoxDecoration(color: textColor, borderRadius: BorderRadius.circular(1))),
                const SizedBox(height: 5),
                Container(width: 12, height: 2.2, decoration: BoxDecoration(color: textColor, borderRadius: BorderRadius.circular(1))),
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
                  'WormDonz',
                  style: TextStyle(
                    fontSize: 17,
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
          // Live Credit Pill Badge (e.g. ⚡ 10)
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
                  Text(
                    '${_currentUser.credits}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: textColor,
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
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Invite link copied to clipboard!')),
              );
            },
          ),

          // New Temporary Chat / Clear context icon (dashed circle)
          IconButton(
            icon: Icon(Icons.replay_circle_filled_outlined, size: 22, color: textColor),
            onPressed: _startNewChat,
          ),
          const SizedBox(width: 6),
        ],
      ),

      // 2. Chat Canvas & Empty State
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _messages.isEmpty
                  ? _buildEmptyState(textColor, mutedColor, surfaceColor, isDark)
                  : _buildMessagesList(textColor, mutedColor, surfaceColor, isDark),
            ),

            // Horizontal Prompt Suggestions (Visible on empty or idle chat)
            if (_messages.isEmpty)
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
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: surfaceColor,
              border: Border.all(
                color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                width: 0.8,
              ),
            ),
            child: const Center(
              child: Icon(Icons.auto_awesome, color: WormDonzColors.electricBlue, size: 28),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Where knowledge begins.',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: textColor,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Select a suggestion or ask WormDonz anything.',
            style: TextStyle(fontSize: 13, color: mutedColor),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestedPromptCards(Color textColor, Color mutedColor, Color surfaceColor, bool isDark) {
    return Container(
      height: 76,
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
              width: 190,
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
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      itemCount: _messages.length + (_isLoading ? 1 : 0),
      itemBuilder: (ctx, idx) {
        if (idx == _messages.length && _isLoading) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: WormDonzColors.electricBlue,
                  ),
                  child: const Center(
                    child: Icon(Icons.auto_awesome, color: Colors.white, size: 14),
                  ),
                ),
                const SizedBox(width: 12),
                const Text('WormDonz is thinking...', style: TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
          );
        }

        final msg = _messages[idx];
        final isUser = msg.role == 'user';

        if (isUser) {
          return Align(
            alignment: Alignment.centerRight,
            child: Container(
              margin: const EdgeInsets.only(bottom: 16, left: 48),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                  width: 0.6,
                ),
              ),
              child: Text(
                msg.content,
                style: TextStyle(fontSize: 15, color: textColor, height: 1.4),
              ),
            ),
          );
        }

        // Assistant Message with Markdown & Code formatting
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
                      child: Icon(Icons.auto_awesome, color: Colors.white, size: 13),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'WormDonz',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                margin: const EdgeInsets.only(left: 30),
                child: MarkdownBody(
                  data: msg.content,
                  selectable: true,
                  styleSheet: MarkdownStyleSheet(
                    p: TextStyle(fontSize: 14.5, color: textColor, height: 1.5),
                    h1: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textColor),
                    h2: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: textColor),
                    h3: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textColor),
                    code: TextStyle(
                      backgroundColor: isDark ? WormDonzColors.activePillDark : WormDonzColors.activePillLight,
                      color: WormDonzColors.electricBlue,
                      fontSize: 13,
                    ),
                    codeblockDecoration: BoxDecoration(
                      color: isDark ? const Color(0xFF161618) : const Color(0xFFE5E5EA),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                        width: 0.6,
                      ),
                    ),
                  ),
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
                const SnackBar(content: Text('File & Vision attachments available on Basic & Pro tiers.')),
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
                      maxLines: null,
                      style: TextStyle(color: textColor, fontSize: 14.5),
                      decoration: InputDecoration(
                        hintText: 'Ask WormDonz...',
                        hintStyle: TextStyle(color: mutedColor, fontSize: 14.5),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onSubmitted: (val) => _handleSendMessage(),
                    ),
                  ),

                  // Microphone Icon (Voice-to-text toggle)
                  IconButton(
                    icon: Icon(Icons.mic_none_rounded, color: mutedColor, size: 21),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Microphone voice mode active.')),
                      );
                    },
                  ),
                  const SizedBox(width: 6),

                  // Circular Blue Waveform / Send Action Button
                  GestureDetector(
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
