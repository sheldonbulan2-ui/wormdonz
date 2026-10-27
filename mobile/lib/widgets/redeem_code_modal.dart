import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/theme_provider.dart';

class RedeemCodeModal extends StatefulWidget {
  final Function(int newCreditBalance) onRedeemed;

  const RedeemCodeModal({Key? key, required this.onRedeemed}) : super(key: key);

  static void show(BuildContext context, {required Function(int newCreditBalance) onRedeemed}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => RedeemCodeModal(onRedeemed: onRedeemed),
    );
  }

  @override
  State<RedeemCodeModal> createState() => _RedeemCodeModalState();
}

class _RedeemCodeModalState extends State<RedeemCodeModal> {
  final TextEditingController _codeController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  final List<String> _quickCodes = ['WORMDONZ2026', 'WELCOME50', 'VIPLAUNCH'];

  Future<void> _handleRedeem([String? directCode]) async {
    final code = (directCode ?? _codeController.text).trim();
    if (code.isEmpty) {
      setState(() => _errorMessage = 'Please enter a valid code');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final result = await ApiService.redeemPromoCode(code);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _successMessage = result.message;
        });

        widget.onRedeemed(result.newBalance);

        // Auto close after brief celebration
        Future.delayed(const Duration(milliseconds: 1600), () {
          if (mounted) Navigator.of(context).pop();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? WormDonzColors.darkCharcoal : WormDonzColors.softGray;
    final textColor = isDark ? WormDonzColors.primaryTextDark : WormDonzColors.primaryTextLight;
    final mutedColor = isDark ? WormDonzColors.secondaryTextDark : WormDonzColors.secondaryTextLight;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(
            color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
            width: 0.8,
          ),
        ),
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: mutedColor.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Header Row
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: WormDonzColors.electricBlue.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.confirmation_num_rounded,
                    color: WormDonzColors.electricBlue,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Redeem Promo Code',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Enter alphanumeric code for instant credits',
                      style: TextStyle(fontSize: 13, color: mutedColor),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Input Field
            Container(
              decoration: BoxDecoration(
                color: isDark ? WormDonzColors.oledBlack : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                ),
              ),
              child: TextField(
                controller: _codeController,
                textCapitalization: TextCapitalization.characters,
                style: TextStyle(
                  color: textColor,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                ),
                decoration: InputDecoration(
                  hintText: 'e.g. WORMDONZ2026',
                  hintStyle: TextStyle(
                    color: mutedColor.withOpacity(0.6),
                    fontWeight: FontWeight.normal,
                    letterSpacing: 0,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.clear, size: 18),
                    onPressed: () => _codeController.clear(),
                    color: mutedColor,
                  ),
                ),
              ),
            ),

            // Quick select chips
            const SizedBox(height: 14),
            Row(
              children: [
                Text('Popular codes: ', style: TextStyle(fontSize: 12, color: mutedColor)),
                const SizedBox(width: 6),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _quickCodes.map((code) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () {
                              _codeController.text = code;
                              _handleRedeem(code);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isDark ? WormDonzColors.activePillDark : Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isDark ? WormDonzColors.borderDark : WormDonzColors.borderLight,
                                  width: 0.6,
                                ),
                              ),
                              child: Text(
                                code,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: WormDonzColors.electricBlue,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),

            // Feedback alerts
            if (_errorMessage != null) ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.red.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.redAccent, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            if (_successMessage != null) ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.green.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline, color: Colors.greenAccent, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _successMessage!,
                        style: const TextStyle(color: Colors.greenAccent, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Redeem Action Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isLoading ? null : () => _handleRedeem(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: WormDonzColors.electricBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Apply Code',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
