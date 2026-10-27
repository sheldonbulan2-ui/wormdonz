import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/models.dart';
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
  final String _telegramAdminUsername = 'WormDonz';

  final List<Map<String, dynamic>> _tiers = [
    {
      'id': 'start',
      'name': 'Starter Plan',
      'pricePeso': 149,
      'billingCycle': '/month',
      'credits': '150 Credits / mo',
      'tagline': 'Ideal for personal daily exploration & steady queries',
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
      'name': 'Basic Plan',
      'pricePeso': 399,
      'billingCycle': '/month',
      'credits': '600 Credits / mo',
      'tagline': 'Maximum velocity for builders & daily engineers',
      'isPopular': true,
      'features': [
        '600 monthly credit pool',
        'Priority multi-key routing queue',
        'Image vision & document attachments',
        'Fast & Vision multimodal models',
        'Syntax-highlighted code exporter',
        'Zero queue delay',
      ],
    },
    {
      'id': 'pro',
      'name': 'Pro Unlimited Plan',
      'pricePeso': 899,
      'billingCycle': '/month',
      'credits': 'Unlimited Credits',
      'tagline': 'Enterprise compute with top-tier reasoning engines',
      'isPopular': false,
      'features': [
        'Unlimited compute allowance',
        'Dedicated high-priority API allocation',
        'Advanced reasoning (o-series / Claude 3.7)',
        'Fast Mode + Web Search + Thinking toggles',
        'Custom instructions & Knowledge base',
        'Unlimited projects & pinned chats',
      ],
    },
  ];

  Future<void> _handleTelegramRedirect(Map<String, dynamic> tier) async {
    final planName = tier['name'];
    final price = tier['pricePeso'];
    final userId = widget.currentUser.id;
    final userEmail = widget.currentUser.email;
    final userName = widget.currentUser.displayName;

    final prefilledMsg = Uri.encodeComponent(
      'Hello @$_telegramAdminUsername! I want to subscribe to WormDonz AI:\n\n'
      '📦 Plan: $planName (₱$price/month)\n'
      '👤 User: $userName ($userEmail)\n'
      '🆔 User ID: $userId\n\n'
      'Please send the GCash / Maya payment instructions to activate my subscription.',
    );

    final telegramUrl = Uri.parse('https://t.me/$_telegramAdminUsername?text=$prefilledMsg');

    try {
      if (await canLaunchUrl(telegramUrl)) {
        await launchUrl(telegramUrl, mode: LaunchMode.externalApplication);
      } else {
        // Fallback open in web browser
        await launchUrl(telegramUrl, mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Could not open Telegram: $e. You can contact @$_telegramAdminUsername directly.'),
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
        elevation: 0,
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
              const SizedBox(height: 14),
              Text(
                'Unlock Unlimited Intelligence',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: textColor,
                  letterSpacing: -0.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Select a plan below to subscribe via GCash/Maya directly with the admin on Telegram.',
                style: TextStyle(fontSize: 13, color: mutedColor, height: 1.4),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // Pricing Cards
              ..._tiers.map((tier) => _buildTierCard(tier, isDark, textColor, mutedColor)),

              const SizedBox(height: 20),

              // Security & Instant Activation Guarantee
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF141416) : const Color(0xFFF2F2F7),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                    width: 0.8,
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.bolt_rounded, color: Color(0xFF00F5A0), size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Instant Telegram Admin Verification',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: textColor),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Directly connected with @$_telegramAdminUsername. Your credits activate instantly upon payment confirmation.',
                            style: TextStyle(color: mutedColor, fontSize: 11.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
            ],
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
    final isCurrent = widget.currentUser.tier.toLowerCase() == tier['id'];
    final isPopular = tier['isPopular'] == true;
    final price = tier['pricePeso'];

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isPopular
                    ? WormDonzColors.electricBlue
                    : (isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight),
                width: isPopular ? 1.8 : 0.8,
              ),
              boxShadow: isPopular
                  ? [
                      BoxShadow(
                        color: WormDonzColors.electricBlue.withOpacity(0.15),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Tier Name & Credits
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      tier['name'],
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: textColor,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: WormDonzColors.electricBlue.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        tier['credits'],
                        style: const TextStyle(
                          color: WormDonzColors.electricBlue,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  tier['tagline'],
                  style: TextStyle(fontSize: 12, color: mutedColor),
                ),
                const SizedBox(height: 16),

                // Price Section in Philippine Peso (₱)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '₱$price',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: textColor,
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      tier['billingCycle'],
                      style: TextStyle(
                        fontSize: 13,
                        color: mutedColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
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
                          color: Color(0xFF00F5A0),
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

                const SizedBox(height: 18),

                // Action Button -> Direct Telegram Redirection
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: isCurrent ? null : () => _handleTelegramRedirect(tier),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isPopular
                          ? const Color(0xFF0088CC) // Telegram Blue
                          : (isDark ? const Color(0xFF1C1C1E) : Colors.white),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: isPopular ? const Color(0xFF0088CC) : (isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight),
                          width: 1,
                        ),
                      ),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.send_rounded, size: 18, color: Colors.white),
                        const SizedBox(width: 8),
                        Text(
                          isCurrent ? 'Current Active Plan' : 'Subscribe via Telegram (@$_telegramAdminUsername)',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13.5,
                            color: isCurrent ? mutedColor : Colors.white,
                          ),
                        ),
                      ],
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
