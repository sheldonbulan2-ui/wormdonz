import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme/theme_provider.dart';

class SubscriptionScreen extends StatefulWidget {
  final UserModel currentUser;
  final Function(UserModel updatedUser) onUpgraded;

  const SubscriptionScreen({
    Key? key,
    required this.currentUser,
    required this.onUpgraded,
  }) : super(key: key);

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _isAnnual = false;
  bool _isLoading = false;

  final List<Map<String, dynamic>> _tiers = [
    {
      'id': 'start',
      'name': 'Start Tier',
      'monthlyPrice': 4.99,
      'annualPrice': 3.99,
      'credits': '150 Credits / mo',
      'tagline': 'Ideal for individual exploration & steady queries',
      'isPopular': false,
      'features': [
        '150 monthly credit pool',
        'Standard WormDonz AI model',
        'Standard latency & processing',
        'Complete chat history sync',
        'Single device access',
      ],
    },
    {
      'id': 'basic',
      'name': 'Basic Tier',
      'monthlyPrice': 14.99,
      'annualPrice': 11.99,
      'credits': '600 Credits / mo',
      'tagline': 'Maximum velocity for builders & daily engineers',
      'isPopular': true,
      'features': [
        '600 monthly credit pool',
        'Priority multi-key routing queue',
        'Image & document attachments',
        'Fast & Vision multimodal models',
        'Syntax-highlighted code exporter',
        'Zero queue delay',
      ],
    },
    {
      'id': 'pro',
      'name': 'Pro Tier',
      'monthlyPrice': 29.99,
      'annualPrice': 23.99,
      'credits': 'Unlimited Credits',
      'tagline': 'Enterprise compute with top-tier reasoning engines',
      'isPopular': false,
      'features': [
        'Unlimited compute allowance',
        'Instant dedicated API key allocation',
        'Advanced reasoning (o-series / Claude 3.7)',
        'Live waveform voice conversation',
        'Custom instructions & Knowledge base',
        'Unlimited project workspaces',
      ],
    },
  ];

  Future<void> _handleUpgrade(String tierId) async {
    setState(() => _isLoading = true);

    try {
      final updatedUser = await ApiService.upgradeTier(tierId, userId: widget.currentUser.id);
      if (mounted) {
        setState(() => _isLoading = false);
        widget.onUpgraded(updatedUser);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: WormDonzColors.electricBlue,
            content: Text(
              '🎉 Upgraded to ${tierId.toUpperCase()} Tier successfully!',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        );

        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Failed to upgrade: $e'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? WormDonzColors.oledBlack : WormDonzColors.pureWhite;
    final textColor = isDark ? WormDonzColors.primaryTextDark : WormDonzColors.primaryTextLight;
    final mutedColor = isDark ? WormDonzColors.secondaryTextDark : WormDonzColors.secondaryTextLight;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: bgColor,
        leading: IconButton(
          icon: Icon(Icons.close_rounded, color: textColor),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Subscription Plans',
          style: TextStyle(color: textColor, fontWeight: FontWeight.w700, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              // Header Badge & Title
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: WormDonzColors.electricBlue.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: WormDonzColors.electricBlue.withOpacity(0.3)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.workspace_premium_rounded, color: WormDonzColors.electricBlue, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'WORMDONZ PREMIUM ACCESS',
                      style: TextStyle(
                        color: WormDonzColors.electricBlue,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Unlock True Model Velocity',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: textColor,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Switch plans anytime. Zero disruption to ongoing chats.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: mutedColor),
              ),
              const SizedBox(height: 20),

              // Billing Cycle Switcher (Monthly vs Annual)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark ? WormDonzColors.darkCharcoal : WormDonzColors.softGray,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildCycleButton('Monthly', !_isAnnual, () => setState(() => _isAnnual = false)),
                    _buildCycleButton('Annual (Save 20%)', _isAnnual, () => setState(() => _isAnnual = true)),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Tier Cards List
              ..._tiers.map((tier) => _buildTierCard(tier, isDark, textColor, mutedColor)),

              const SizedBox(height: 24),

              // Enterprise notice
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? WormDonzColors.darkCharcoal : WormDonzColors.softGray,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                    width: 0.6,
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.bolt_rounded, color: WormDonzColors.electricBlue, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Need custom enterprise API quotas?',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: textColor),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Reach out to enterprise@wormdonz.ai for dedicated cluster setups.',
                            style: TextStyle(fontSize: 12, color: mutedColor),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCycleButton(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? WormDonzColors.electricBlue : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildTierCard(
    Map<String, dynamic> tier,
    bool isDark,
    Color textColor,
    Color mutedColor,
  ) {
    final isCurrent = widget.currentUser.tier == tier['id'];
    final isPopular = tier['isPopular'] as bool;
    final price = _isAnnual ? tier['annualPrice'] : tier['monthlyPrice'];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? WormDonzColors.darkCharcoal : WormDonzColors.softGray,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isPopular
              ? WormDonzColors.electricBlue
              : (isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight),
          width: isPopular ? 1.8 : 0.8,
        ),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      tier['name'],
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '\$$price',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: textColor,
                          ),
                        ),
                        Text(
                          '/mo',
                          style: TextStyle(fontSize: 12, color: mutedColor),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  tier['tagline'],
                  style: TextStyle(fontSize: 12, color: mutedColor),
                ),
                const SizedBox(height: 12),

                // Credit badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: WormDonzColors.electricBlue.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '⚡ ${tier['credits']}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: WormDonzColors.electricBlue,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 14),

                // Features list
                ...((tier['features'] as List<String>).map((feat) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          color: WormDonzColors.electricBlue,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            feat,
                            style: TextStyle(fontSize: 13, color: textColor),
                          ),
                        ),
                      ],
                    ),
                  );
                })),

                const SizedBox(height: 16),

                // Action Button
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    onPressed: isCurrent || _isLoading ? null : () => _handleUpgrade(tier['id']),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isPopular
                          ? WormDonzColors.electricBlue
                          : (isDark ? WormDonzColors.activePillDark : Colors.white),
                      foregroundColor: isPopular
                          ? Colors.white
                          : (isDark ? WormDonzColors.primaryTextDark : WormDonzColors.primaryTextLight),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(
                          color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                          width: 0.6,
                        ),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      isCurrent ? 'Current Plan' : 'Select ${tier['name']}',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: isCurrent ? mutedColor : null,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Most popular badge
          if (isPopular)
            Positioned(
              top: -10,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: WormDonzColors.electricBlue,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'MOST POPULAR',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
