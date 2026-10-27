import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../screens/subscription_screen.dart';
import '../screens/auth_screen.dart';
import '../theme/theme_provider.dart';
import 'redeem_code_modal.dart';

class CustomDrawer extends StatefulWidget {
  final UserModel currentUser;
  final List<ChatModel> chats;
  final String? activeChatId;
  final Function(ChatModel chat) onChatSelected;
  final VoidCallback onNewChat;
  final Function(UserModel updatedUser) onUserUpdated;
  final VoidCallback onChatsRefreshed;

  const CustomDrawer({
    Key? key,
    required this.currentUser,
    required this.chats,
    this.activeChatId,
    required this.onChatSelected,
    required this.onNewChat,
    required this.onUserUpdated,
    required this.onChatsRefreshed,
  }) : super(key: key);

  @override
  State<CustomDrawer> createState() => _CustomDrawerState();
}

class _CustomDrawerState extends State<CustomDrawer> {
  void _handleNewChat() {
    Navigator.of(context).pop();
    widget.onNewChat();
  }

  void _showReferralModal() {
    Navigator.of(context).pop();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final refLink = 'https://wormdonz.onrender.com/invite?ref=${widget.currentUser.id}';

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF141416) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: const [
                  Icon(Icons.card_giftcard_rounded, color: Color(0xFF0A84FF), size: 26),
                  SizedBox(width: 12),
                  Text(
                    'Invite Friends & Earn Credits',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'Share your referral link. You and your friend each receive 50 bonus credits when they sign up and verify.',
                style: TextStyle(
                  color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF636366),
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF2F2F7),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE5E5EA)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        refLink,
                        style: TextStyle(
                          color: isDark ? Colors.white : Colors.black87,
                          fontSize: 12.5,
                          fontFamily: 'monospace',
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy_rounded, color: Color(0xFF0A84FF), size: 20),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: refLink));
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('🎉 Sharable referral link copied to clipboard!'),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.share_rounded, size: 18),
                  label: const Text('Copy & Share Link'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0A84FF),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: refLink));
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('🎉 Sharable referral link copied to clipboard!'),
                        behavior: SnackBarBehavior.floating,
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

  void _showClearAllConfirm() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1C1C1E) : Colors.white,
        title: Text(
          'Clear All Conversations?',
          style: TextStyle(color: isDark ? Colors.white : Colors.black87),
        ),
        content: Text(
          'This will permanently delete all chat history. This action cannot be undone.',
          style: TextStyle(color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF636366)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: isDark ? Colors.white70 : Colors.black54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF3B30)),
            onPressed: () async {
              Navigator.pop(ctx);
              Navigator.pop(context); // Close drawer
              for (final chat in widget.chats) {
                await ApiService.deleteChat(chat.id);
              }
              widget.chats.clear();
              widget.onNewChat();
              widget.onChatsRefreshed();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('All conversations cleared.')),
              );
            },
            child: const Text('Clear All', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _deleteSingleChat(ChatModel chat) async {
    await ApiService.deleteChat(chat.id);
    setState(() {
      widget.chats.removeWhere((c) => c.id == chat.id);
    });
    if (widget.activeChatId == chat.id) {
      widget.onNewChat();
    }
    widget.onChatsRefreshed();
  }

  void _handleLogout() async {
    Navigator.of(context).pop();
    await ApiService.clearUserSession();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const AuthScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeProvider = Provider.of<ThemeProvider>(context);

    final drawerBg = isDark ? const Color(0xFF000000) : const Color(0xFFFFFFFF);
    final cardBg = isDark ? const Color(0xFF141416) : const Color(0xFFF2F2F7);
    final borderCol = isDark ? const Color(0xFF26262B) : const Color(0xFFE5E5EA);
    final primaryText = isDark ? Colors.white : const Color(0xFF1C1C1E);
    final subText = isDark ? const Color(0xFF8E8E93) : const Color(0xFF636366);

    return Drawer(
      width: MediaQuery.of(context).size.width * 0.82,
      backgroundColor: drawerBg,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Brand & Quick Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5EA),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.bolt_rounded, size: 20, color: Color(0xFF0A84FF)),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'WormDonz AI',
                        style: TextStyle(
                          color: primaryText,
                          fontSize: 16.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.4,
                        ),
                      ),
                    ],
                  ),

                  // Dark / Light Mode Switcher Icon
                  IconButton(
                    icon: Icon(
                      themeProvider.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                      color: themeProvider.isDarkMode ? const Color(0xFFFFD60A) : const Color(0xFF5856D6),
                      size: 22,
                    ),
                    tooltip: themeProvider.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
                    onPressed: () {
                      themeProvider.toggleTheme();
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // + New Chat Button
              InkWell(
                onTap: _handleNewChat,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderCol, width: 0.8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.add_rounded, color: Color(0xFF0A84FF), size: 20),
                      const SizedBox(width: 10),
                      Text(
                        'New Chat',
                        style: TextStyle(
                          color: primaryText,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Chat History Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'CHAT HISTORY',
                      style: TextStyle(
                        color: subText,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.0,
                      ),
                    ),
                    Text(
                      '${widget.chats.length} chats',
                      style: TextStyle(color: subText, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Scrollable Chat History List
              Expanded(
                child: widget.chats.isEmpty
                    ? Center(
                        child: Text(
                          'No chat history yet.\nStart asking WormDonz!',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: subText, fontSize: 12.5),
                        ),
                      )
                    : ListView.builder(
                        itemCount: widget.chats.length,
                        itemBuilder: (context, index) {
                          final chat = widget.chats[index];
                          final isActive = chat.id == widget.activeChatId;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 4),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5EA))
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                              border: isActive
                                  ? Border.all(color: const Color(0xFF0A84FF).withOpacity(0.4), width: 0.8)
                                  : null,
                            ),
                            child: ListTile(
                              dense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                              leading: Icon(
                                isActive ? Icons.chat_bubble_rounded : Icons.chat_bubble_outline_rounded,
                                size: 16,
                                color: isActive ? const Color(0xFF0A84FF) : subText,
                              ),
                              title: Text(
                                chat.title,
                                style: TextStyle(
                                  color: isActive
                                      ? primaryText
                                      : (isDark ? Colors.white70 : Colors.black87),
                                  fontSize: 13,
                                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: IconButton(
                                icon: Icon(Icons.close_rounded, size: 15, color: subText),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                onPressed: () => _deleteSingleChat(chat),
                              ),
                              onTap: () {
                                Navigator.of(context).pop();
                                widget.onChatSelected(chat);
                              },
                            ),
                          );
                        },
                      ),
              ),

              const Divider(height: 16),

              // Quick Tools Menu
              _buildCompactMenuItem(
                icon: Icons.card_giftcard_rounded,
                title: 'Referral (Earn +50 Credits)',
                iconColor: const Color(0xFF0A84FF),
                onTap: _showReferralModal,
              ),
              _buildCompactMenuItem(
                icon: Icons.credit_card_rounded,
                title: 'Upgrade Subscription',
                iconColor: const Color(0xFF00F5A0),
                onTap: () {
                  Navigator.of(context).pop();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => SubscriptionScreen(
                        currentUser: widget.currentUser,
                        onUpgraded: (user) => widget.onUserUpdated(user),
                      ),
                    ),
                  );
                },
              ),
              _buildCompactMenuItem(
                icon: Icons.confirmation_num_outlined,
                title: 'Redeem Promo Code',
                iconColor: const Color(0xFFFF9500),
                onTap: () {
                  Navigator.of(context).pop();
                  RedeemCodeModal.show(
                    context,
                    onRedeemed: (newBalance) {
                      widget.currentUser.credits = newBalance;
                      widget.onUserUpdated(widget.currentUser);
                    },
                  );
                },
              ),
              _buildCompactMenuItem(
                icon: Icons.delete_outline_rounded,
                title: 'Clear All History',
                iconColor: const Color(0xFFFF3B30),
                onTap: _showClearAllConfirm,
              ),
              _buildCompactMenuItem(
                icon: Icons.logout_rounded,
                title: 'Log Out',
                iconColor: subText,
                onTap: _handleLogout,
              ),

              const SizedBox(height: 10),

              // Live Server Cluster Status
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: borderCol, width: 0.8),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Color(0xFF00F5A0),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Render Cloud: wormdonz.onrender.com',
                        style: TextStyle(color: subText, fontSize: 10.5, fontFamily: 'monospace'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),

              // User Info Footer
              Container(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFD1D1D6),
                      child: Text(
                        widget.currentUser.displayName.isNotEmpty
                            ? widget.currentUser.displayName[0].toUpperCase()
                            : 'U',
                        style: TextStyle(
                          color: isDark ? Colors.white : Colors.black87,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.currentUser.displayName,
                            style: TextStyle(color: primaryText, fontSize: 13, fontWeight: FontWeight.w600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '⚡ ${widget.currentUser.credits} credits • ${widget.currentUser.tier.toUpperCase()}',
                            style: TextStyle(color: subText, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompactMenuItem({
    required IconData icon,
    required String title,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 6.0),
        child: Row(
          children: [
            Icon(icon, size: 17, color: iconColor),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  color: isDark ? const Color(0xFFD1D1D6) : const Color(0xFF3A3A3C),
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
