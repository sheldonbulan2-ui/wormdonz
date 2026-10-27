import 'package:flutter/material.dart';
import '../services/api_service.dart';

class FeedbackModal extends StatefulWidget {
  final String userId;

  const FeedbackModal({Key? key, required this.userId}) : super(key: key);

  static void show(BuildContext context, {required String userId}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FeedbackModal(userId: userId),
    );
  }

  @override
  State<FeedbackModal> createState() => _FeedbackModalState();
}

class _FeedbackModalState extends State<FeedbackModal> {
  String _selectedType = 'bug'; // 'bug' or 'feature'
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final title = _titleController.text.trim();
    final desc = _descController.text.trim();

    if (title.isEmpty || desc.isEmpty) {
      setState(() => _errorMessage = 'Please provide both a title and description.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final res = await ApiService.submitFeedback(
      userId: widget.userId,
      type: _selectedType,
      title: title,
      description: desc,
    );

    if (!mounted) return;

    if (res['success'] == true) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF00F5A0),
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.black87),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${_selectedType == 'bug' ? 'Bug Report' : 'Feature Request'} submitted! You will receive credits once verified.',
                  style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ),
            ],
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      setState(() {
        _isSubmitting = false;
        _errorMessage = res['error'] ?? 'Submission failed. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF141416) : Colors.white;
    final textColor = isDark ? Colors.white : Colors.black87;
    final mutedColor = isDark ? const Color(0xFF8E8E93) : const Color(0xFF636366);
    final cardBg = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF2F2F7);

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(
          color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE5E5EA),
          width: 0.8,
        ),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top drag pill
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
            const SizedBox(height: 18),

            // Header
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0A84FF).withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.feedback_rounded, color: Color(0xFF0A84FF), size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bug Report & Feature Request',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: textColor,
                          letterSpacing: -0.3,
                        ),
                      ),
                      Text(
                        'Earn 10 credits when verified by admin',
                        style: TextStyle(fontSize: 12, color: const Color(0xFF00F5A0), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Type Selector: [ 🐛 Bug Report ]  [ ✨ Feature Request ]
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedType = 'bug'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _selectedType == 'bug'
                            ? const Color(0xFFFF3B30).withOpacity(0.15)
                            : cardBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _selectedType == 'bug' ? const Color(0xFFFF3B30) : Colors.transparent,
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.bug_report_rounded,
                            size: 18,
                            color: _selectedType == 'bug' ? const Color(0xFFFF3B30) : mutedColor,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Report Bug',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: _selectedType == 'bug' ? const Color(0xFFFF3B30) : mutedColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedType = 'feature'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _selectedType == 'feature'
                            ? const Color(0xFFFF9500).withOpacity(0.15)
                            : cardBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _selectedType == 'feature' ? const Color(0xFFFF9500) : Colors.transparent,
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.auto_awesome,
                            size: 16,
                            color: _selectedType == 'feature' ? const Color(0xFFFF9500) : mutedColor,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Suggest Feature',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: _selectedType == 'feature' ? const Color(0xFFFF9500) : mutedColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Error display
            if (_errorMessage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                ),
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.redAccent, fontSize: 12),
                ),
              ),

            // Title Field
            Text(
              'Summary / Title',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: mutedColor),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _titleController,
              style: TextStyle(color: textColor, fontSize: 14),
              decoration: InputDecoration(
                hintText: _selectedType == 'bug' ? 'e.g. Chat stream freeze when...' : 'e.g. Support PDF export...',
                hintStyle: TextStyle(color: mutedColor, fontSize: 13),
                filled: true,
                fillColor: cardBg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 14),

            // Description Field
            Text(
              'Details & Steps to Reproduce',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: mutedColor),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _descController,
              maxLines: 4,
              style: TextStyle(color: textColor, fontSize: 13.5),
              decoration: InputDecoration(
                hintText: 'Describe the issue or feature in detail so our engineering team can test and verify it...',
                hintStyle: TextStyle(color: mutedColor, fontSize: 13),
                filled: true,
                fillColor: cardBg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 20),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0A84FF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text(
                        'Submit to Admin Team',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
