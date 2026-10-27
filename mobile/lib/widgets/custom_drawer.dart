import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme/theme_provider.dart';
import '../screens/subscription_screen.dart';
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
  final TextEditingController _searchController = TextEditingController();
  String _searchFilter = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showChatOptionsMenu(ChatModel chat) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? WormDonzColors.darkCharcoal : WormDonzColors.softGray,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Icon(
                  chat.isPinned ? Icons.push_pin_outlined : Icons.push_pin_rounded,
                  color: WormDonzColors.electricBlue,
                ),
                title: Text(chat.isPinned ? 'Unpin Conversation' : 'Pin to Top'),
                onTap: () async {
                  Navigator.pop(ctx);
                  await ApiService.togglePinChat(chat.id, !chat.isPinned);
                  chat.isPinned = !chat.isPinned;
                  widget.onChatsRefreshed();
                },
              ),
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('Rename'),
                onTap: () {
                  Navigator.pop(ctx);
                  _showRenameDialog(chat);
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent),
                title: const Text('Delete', style: TextStyle(color: Colors.redAccent)),
                onTap: () async {
                  Navigator.pop(ctx);
                  await ApiService.deleteChat(chat.id);
                  widget.chats.removeWhere((c) => c.id == chat.id);
                  widget.onChatsRefreshed();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showRenameDialog(ChatModel chat) {
    final controller = TextEditingController(text: chat.title);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rename Chat'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Enter new title'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final newTitle = controller.text.trim();
              if (newTitle.isNotEmpty) {
                chat.title = newTitle;
                widget.onChatsRefreshed();
              }
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showSettingsModal() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? WormDonzColors.darkCharcoal : WormDonzColors.pureWhite,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Consumer<ThemeProvider>(
          builder: (context, theme, _) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Settings & Preferences',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 20),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      theme.isDarkMode ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                      color: WormDonzColors.electricBlue,
                    ),
                    title: const Text('Theme Mode', style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(theme.isDarkMode ? 'Pure OLED Black (#000000)' : 'Clean High-Contrast Light'),
                    trailing: Switch.adaptive(
                      value: theme.isDarkMode,
                      activeColor: WormDonzColors.electricBlue,
                      onChanged: (val) => theme.toggleTheme(),
                    ),
                  ),
                  const Divider(),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.bolt_rounded, color: Colors.amber),
                    title: const Text('Remaining Credits', style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${widget.currentUser.credits} credits balance'),
                    trailing: TextButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        RedeemCodeModal.show(
                          context,
                          onRedeemed: (newBalance) {
                            widget.currentUser.credits = newBalance;
                            widget.onUserUpdated(widget.currentUser);
                          },
                        );
                      },
                      child: const Text('Add Credits'),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final drawerBg = isDark ? WormDonzColors.oledBlack : WormDonzColors.pureWhite;
    final cardBg = isDark ? WormDonzColors.darkCharcoal : WormDonzColors.softGray;
    final activeBg = isDark ? WormDonzColors.activePillDark : WormDonzColors.activePillLight;
    final textColor = isDark ? WormDonzColors.primaryTextDark : WormDonzColors.primaryTextLight;
    final mutedColor = isDark ? WormDonzColors.secondaryTextDark : WormDonzColors.secondaryTextLight;

    // Filter chats
    final filtered = widget.chats.where((c) {
      if (_searchFilter.isEmpty) return true;
      return c.title.toLowerCase().contains(_searchFilter.toLowerCase());
    }).toList();

    final pinnedChats = filtered.where((c) => c.isPinned).toList();
    final recentChats = filtered.where((c) => !c.isPinned).toList();

    return Drawer(
      width: MediaQuery.of(context).size.width * 0.85,
      backgroundColor: drawerBg,
      child: SafeArea(
        child: Column(
          children: [
            // 1. Top Header Row: Search Pill + Compose Button
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 42,
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(21),
                        border: Border.all(
                          color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                          width: 0.6,
                        ),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchFilter = val),
                        style: TextStyle(fontSize: 14, color: textColor),
                        decoration: InputDecoration(
                          hintText: 'Search...',
                          hintStyle: TextStyle(fontSize: 14, color: mutedColor),
                          prefixIcon: Icon(Icons.search_rounded, size: 20, color: mutedColor),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Compose Button
                  InkWell(
                    borderRadius: BorderRadius.circular(21),
                    onTap: () {
                      Navigator.of(context).pop();
                      widget.onNewChat();
                    },
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: cardBg,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                          width: 0.6,
                        ),
                      ),
                      child: Icon(Icons.edit_square, size: 20, color: textColor),
                    ),
                  ),
                ],
              ),
            ),

            // 2. Primary Navigation Items
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Column(
                children: [
                  // Active WormDonz Item
                  _buildNavItem(
                    icon: Icons.auto_awesome_rounded,
                    title: 'WormDonz',
                    isActive: true,
                    activeBg: activeBg,
                    textColor: textColor,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(height: 4),

                  // Redeem Code Item
                  _buildNavItem(
                    icon: Icons.card_giftcard_rounded,
                    title: 'Redeem Code',
                    isActive: false,
                    activeBg: activeBg,
                    textColor: textColor,
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: WormDonzColors.electricBlue.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        'Bonus',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: WormDonzColors.electricBlue),
                      ),
                    ),
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
                  const SizedBox(height: 4),

                  // Subscription Plans Item
                  _buildNavItem(
                    icon: Icons.workspace_premium_rounded,
                    title: 'Subscription Plans',
                    isActive: false,
                    activeBg: activeBg,
                    textColor: textColor,
                    trailing: Text(
                      widget.currentUser.tier.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: WormDonzColors.electricBlue,
                      ),
                    ),
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (ctx) => SubscriptionScreen(
                            currentUser: widget.currentUser,
                            onUpgraded: (user) => widget.onUserUpdated(user),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 4),

                  // Projects / Folders Item
                  _buildNavItem(
                    icon: Icons.create_new_folder_outlined,
                    title: 'New project',
                    isActive: false,
                    activeBg: activeBg,
                    textColor: textColor,
                    onTap: () {
                      Navigator.of(context).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Project folders available on Pro Tier.')),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),
            Divider(
              height: 1,
              color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
            ),

            // 3. Pinned & Recent Chats Section
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                children: [
                  if (pinnedChats.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.only(left: 10, top: 8, bottom: 4),
                      child: Text(
                        'PINNED',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: mutedColor,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ),
                    ...pinnedChats.map((chat) => _buildChatRow(chat, textColor, mutedColor, isDark)),
                    const SizedBox(height: 12),
                  ],

                  Padding(
                    padding: const EdgeInsets.only(left: 10, top: 4, bottom: 4),
                    child: Text(
                      'RECENT CONVERSATIONS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: mutedColor,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),

                  if (recentChats.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'No recent conversations yet.',
                        style: TextStyle(fontSize: 13, color: mutedColor),
                      ),
                    )
                  else
                    ...recentChats.map((chat) => _buildChatRow(chat, textColor, mutedColor, isDark)),
                ],
              ),
            ),

            // 4. Sticky Bottom User Footer
            Container(
              decoration: BoxDecoration(
                color: isDark ? WormDonzColors.darkCharcoal : WormDonzColors.softGray,
                border: Border(
                  top: BorderSide(
                    color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                    width: 0.6,
                  ),
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  // User Avatar
                  CircleAvatar(
                    radius: 19,
                    backgroundColor: WormDonzColors.electricBlue,
                    child: Text(
                      widget.currentUser.displayName.isNotEmpty
                          ? widget.currentUser.displayName[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Display Name & Tier
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.currentUser.displayName,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: textColor,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: WormDonzColors.electricBlue.withOpacity(0.18),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                widget.currentUser.tier.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: WormDonzColors.electricBlue,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '⚡ ${widget.currentUser.credits}',
                              style: TextStyle(fontSize: 11, color: mutedColor, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Settings Gear Icon
                  IconButton(
                    icon: Icon(Icons.settings_outlined, color: textColor, size: 22),
                    onPressed: _showSettingsModal,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String title,
    required bool isActive,
    required Color activeBg,
    required Color textColor,
    Widget? trailing,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? activeBg : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isActive ? WormDonzColors.electricBlue : textColor.withOpacity(0.8),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: textColor,
                ),
              ),
            ),
            if (trailing != null) trailing,
          ],
        ),
      ),
    );
  }

  Widget _buildChatRow(ChatModel chat, Color textColor, Color mutedColor, bool isDark) {
    final isSelected = chat.id == widget.activeChatId;
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: () {
        Navigator.of(context).pop();
        widget.onChatSelected(chat);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? WormDonzColors.activePillDark : WormDonzColors.activePillLight)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            if (chat.isPinned) ...[
              const Icon(Icons.push_pin_rounded, size: 14, color: WormDonzColors.electricBlue),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: Text(
                chat.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  color: textColor,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
            IconButton(
              icon: Icon(Icons.more_horiz_rounded, size: 18, color: mutedColor),
              onPressed: () => _showChatOptionsMenu(chat),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
      ),
    );
  }
}
