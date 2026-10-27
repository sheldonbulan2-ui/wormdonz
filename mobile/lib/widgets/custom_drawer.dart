import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../screens/subscription_screen.dart';
import '../screens/telegram_login_screen.dart';
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
  bool _isPrivateChatActive = false;

  void _handleNewChat() {
    Navigator.of(context).pop();
    widget.onNewChat();
  }

  void _togglePrivateChat() {
    setState(() => _isPrivateChatActive = !_isPrivateChatActive);
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isPrivateChatActive
              ? '🕶️ Private Chat active: Messages will not be stored.'
              : 'Standard Chat mode restored.',
        ),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showLeakCheckModal() {
    Navigator.of(context).pop();
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF141416),
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
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: const [
                  Icon(Icons.filter_center_focus_rounded, color: Color(0xFF0A84FF), size: 26),
                  SizedBox(width: 12),
                  Text(
                    'Leak Check Scanner',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Monitor database breaches, compromised tokens, and exposed credentials associated with your account or organization.',
                style: TextStyle(color: Color(0xFF8E8E93), fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 22),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C1C1E),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF2C2C2E)),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.check_circle_rounded, color: Color(0xFF34C759), size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '0 leaks detected. Your keys and sessions are secure.',
                        style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0A84FF),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close Scanner', style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showReferralModal() {
    Navigator.of(context).pop();
    final refLink = 'https://wormdonz.ai/ref/${widget.currentUser.id}';
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF141416),
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
                    color: Colors.white24,
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
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                'Share your referral link. You and your friend each receive 50 bonus credits on their first login.',
                style: TextStyle(color: Color(0xFF8E8E93), fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C1C1E),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF2C2C2E)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        refLink,
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy_rounded, color: Color(0xFF0A84FF), size: 18),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Referral link copied!')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showClearAllConfirm() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1C1C1E),
        title: const Text('Clear All Conversations?', style: TextStyle(color: Colors.white)),
        content: const Text(
          'This will permanently delete all chat history. This action cannot be undone.',
          style: TextStyle(color: Color(0xFF8E8E93)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
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

  void _handleLogout() async {
    Navigator.of(context).pop();
    await ApiService.clearUserSession();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const TelegramLoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      width: MediaQuery.of(context).size.width * 0.78,
      backgroundColor: const Color(0xFF000000), // OLED Pure Black as in screenshot
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),

              // 1. + New Chat
              _buildMenuItem(
                icon: Icons.add,
                title: 'New Chat',
                onTap: _handleNewChat,
              ),

              const SizedBox(height: 28),

              // 2. Private Chat (Hat & Glasses / Incognito)
              _buildMenuItem(
                icon: Icons.security_rounded, // or custom hat icon
                customIcon: _buildIncognitoIcon(),
                title: 'Private Chat',
                isActive: _isPrivateChatActive,
                onTap: _togglePrivateChat,
              ),

              const SizedBox(height: 28),

              // 3. Leak Check
              _buildMenuItem(
                icon: Icons.filter_center_focus_rounded,
                title: 'Leak Check',
                onTap: _showLeakCheckModal,
              ),

              const SizedBox(height: 28),

              // 4. Referral
              _buildMenuItem(
                icon: Icons.card_giftcard_rounded,
                title: 'Referral',
                onTap: _showReferralModal,
              ),

              const SizedBox(height: 28),

              // 5. Upgrade Plan
              _buildMenuItem(
                icon: Icons.credit_card_rounded,
                title: 'Upgrade Plan',
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

              const SizedBox(height: 28),

              // 6. Redeem Code
              _buildMenuItem(
                icon: Icons.confirmation_num_outlined,
                title: 'Redeem Code',
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

              const SizedBox(height: 28),

              // 7. Clear All (Red icon & red text)
              _buildMenuItem(
                icon: Icons.delete_outline_rounded,
                title: 'Clear All',
                color: const Color(0xFFFF3B30),
                onTap: _showClearAllConfirm,
              ),

              const SizedBox(height: 28),

              // 8. Logout
              _buildMenuItem(
                icon: Icons.logout_rounded,
                title: 'Logout',
                onTap: _handleLogout,
              ),

              const Spacer(),

              // User Info Footer
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 15,
                      backgroundColor: const Color(0xFF2C2C2E),
                      child: Text(
                        widget.currentUser.displayName.isNotEmpty
                            ? widget.currentUser.displayName[0].toUpperCase()
                            : 'U',
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.currentUser.displayName,
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '⚡ ${widget.currentUser.credits} credits',
                            style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 11),
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

  Widget _buildMenuItem({
    required IconData icon,
    Widget? customIcon,
    required String title,
    Color color = Colors.white,
    bool isActive = false,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2.0),
        child: Row(
          children: [
            customIcon ??
                Icon(
                  icon,
                  size: 24,
                  color: color,
                ),
            const SizedBox(width: 22),
            Text(
              title,
              style: TextStyle(
                color: color,
                fontSize: 16.5,
                fontWeight: FontWeight.w500,
                letterSpacing: -0.2,
              ),
            ),
            if (isActive) ...[
              const SizedBox(width: 10),
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: Color(0xFF34C759),
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // Exact incognito / private chat hat & glasses icon representation
  Widget _buildIncognitoIcon() {
    return SizedBox(
      width: 24,
      height: 24,
      child: Stack(
        alignment: Alignment.center,
        children: const [
          Positioned(
            top: 2,
            child: Icon(Icons.school_rounded, size: 14, color: Colors.white),
          ),
          Positioned(
            bottom: 3,
            child: Icon(Icons.remove_red_eye_outlined, size: 12, color: Colors.white),
          ),
        ],
      ),
    );
  }
}
