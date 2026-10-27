import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/theme_provider.dart';

class ProgressiveMarkdownView extends StatefulWidget {
  final String content;
  final bool isStreaming;
  final bool isDark;
  final VoidCallback? onRegenerate;

  const ProgressiveMarkdownView({
    Key? key,
    required this.content,
    required this.isStreaming,
    required this.isDark,
    this.onRegenerate,
  }) : super(key: key);

  @override
  State<ProgressiveMarkdownView> createState() => _ProgressiveMarkdownViewState();
}

class _ProgressiveMarkdownViewState extends State<ProgressiveMarkdownView> {
  bool _isLiked = false;
  bool _isPlayingSpeech = false;

  void _copyToClipboard(BuildContext context, String text, {String label = 'Text'}) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard'),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textColor = widget.isDark ? WormDonzColors.primaryTextDark : WormDonzColors.primaryTextLight;
    final mutedColor = widget.isDark ? WormDonzColors.secondaryTextDark : WormDonzColors.secondaryTextLight;

    final segments = _parseContentSegments(widget.content);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...segments.map((seg) {
          if (seg.isCode) {
            return _buildCodeBlock(context, seg);
          } else {
            return _buildMarkdownText(seg.text, textColor, mutedColor);
          }
        }),

        // Persistent 4 Action Row Directly Beneath Content
        const SizedBox(height: 12),
        _buildBottomActionRow(context, mutedColor),
      ],
    );
  }

  Widget _buildMarkdownText(String text, Color textColor, Color mutedColor) {
    if (text.trim().isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: MarkdownBody(
        data: text,
        selectable: true,
        styleSheet: MarkdownStyleSheet(
          p: TextStyle(
            fontSize: 14.5,
            color: textColor,
            height: 1.55,
            letterSpacing: -0.1,
          ),
          h1: TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.w800,
            color: textColor,
            height: 1.4,
          ),
          h2: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: textColor,
            height: 1.35,
          ),
          h3: TextStyle(
            fontSize: 15.5,
            fontWeight: FontWeight.w700,
            color: textColor,
            height: 1.3,
          ),
          strong: TextStyle(
            fontWeight: FontWeight.w700,
            color: textColor,
          ),
          listBullet: TextStyle(color: textColor, fontSize: 14),
          code: GoogleFonts.jetBrainsMono(
            backgroundColor: widget.isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE5E5EA),
            color: widget.isDark ? const Color(0xFF64D2FF) : const Color(0xFF007AFF),
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildCodeBlock(BuildContext context, _ContentSegment seg) {
    final language = seg.language.isNotEmpty ? seg.language.toUpperCase() : 'CODE';
    final lines = seg.text.split('\n');
    final lineCount = lines.isEmpty ? 1 : lines.length;

    final headerBg = widget.isDark ? const Color(0xFF242426) : const Color(0xFFE5E5EA);
    final bodyBg = widget.isDark ? const Color(0xFF141416) : const Color(0xFFF2F2F7);
    final borderColor = widget.isDark ? const Color(0xFF2C2C2E) : const Color(0xFFD1D1D6);
    final codeTextColor = widget.isDark ? Colors.white.withOpacity(0.92) : const Color(0xFF1C1C1E);
    final lineNumColor = widget.isDark ? const Color(0xFF636366) : const Color(0xFF8E8E93);

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: bodyBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: headerBg,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(9)),
              border: Border(bottom: BorderSide(color: borderColor, width: 0.8)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  language,
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: widget.isDark ? const Color(0xFF8E8E93) : const Color(0xFF636366),
                    letterSpacing: 0.5,
                  ),
                ),
                InkWell(
                  borderRadius: BorderRadius.circular(6),
                  onTap: () => _copyToClipboard(context, seg.text, label: '$language code'),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.copy_rounded,
                          size: 13,
                          color: widget.isDark ? const Color(0xFF8E8E93) : const Color(0xFF636366),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Copy',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: widget.isDark ? const Color(0xFF8E8E93) : const Color(0xFF636366),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Numbered Code Body with Horizontal Scroll
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Line Numbers Gutter
                Container(
                  width: 36,
                  padding: const EdgeInsets.only(right: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(lineCount, (index) {
                      return Text(
                        '${index + 1}',
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 12.5,
                          height: 1.5,
                          color: lineNumColor,
                        ),
                      );
                    }),
                  ),
                ),

                // Vertical Separator
                Container(
                  width: 1,
                  height: lineCount * 18.8,
                  color: borderColor.withOpacity(0.5),
                ),
                const SizedBox(width: 10),

                // Monospace Code Lines
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: SelectableText(
                      seg.text,
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 12.5,
                        height: 1.5,
                        color: codeTextColor,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActionRow(BuildContext context, Color mutedColor) {
    return Row(
      children: [
        // 1. Copy Full Response
        _buildActionIconButton(
          icon: Icons.copy_rounded,
          tooltip: 'Copy response',
          onTap: () => _copyToClipboard(context, widget.content, label: 'Response'),
          color: mutedColor,
        ),
        const SizedBox(width: 12),

        // 2. Thumbs Up
        _buildActionIconButton(
          icon: _isLiked ? Icons.thumb_up_rounded : Icons.thumb_up_outlined,
          tooltip: 'Good response',
          onTap: () {
            setState(() => _isLiked = !_isLiked);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(_isLiked ? 'Feedback saved! Thanks.' : 'Feedback cleared'),
                duration: const Duration(seconds: 1),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
          color: _isLiked ? const Color(0xFF0A84FF) : mutedColor,
        ),
        const SizedBox(width: 12),

        // 3. Text-to-Speech Speaker
        _buildActionIconButton(
          icon: _isPlayingSpeech ? Icons.volume_up_rounded : Icons.volume_up_outlined,
          tooltip: 'Read aloud',
          onTap: () {
            setState(() => _isPlayingSpeech = !_isPlayingSpeech);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(_isPlayingSpeech ? 'Reading message aloud...' : 'Voice stopped'),
                duration: const Duration(seconds: 1),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
          color: _isPlayingSpeech ? const Color(0xFF34C759) : mutedColor,
        ),
        const SizedBox(width: 12),

        // 4. Regenerate Response
        if (widget.onRegenerate != null)
          _buildActionIconButton(
            icon: Icons.autorenew_rounded,
            tooltip: 'Regenerate response',
            onTap: widget.isStreaming ? null : widget.onRegenerate,
            color: mutedColor,
          ),
      ],
    );
  }

  Widget _buildActionIconButton({
    required IconData icon,
    required String tooltip,
    required VoidCallback? onTap,
    required Color color,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(6),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Icon(icon, size: 16, color: color),
      ),
    );
  }

  List<_ContentSegment> _parseContentSegments(String raw) {
    final List<_ContentSegment> segments = [];
    final pattern = RegExp(r'```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)(?:```|$)');
    int lastIndex = 0;

    for (final match in pattern.allMatches(raw)) {
      if (match.start > lastIndex) {
        final textBefore = raw.substring(lastIndex, match.start);
        if (textBefore.isNotEmpty) {
          segments.add(_ContentSegment(text: textBefore, isCode: false));
        }
      }

      final lang = match.group(1)?.trim() ?? '';
      final codeContent = match.group(2) ?? '';
      segments.add(_ContentSegment(
        text: codeContent.endsWith('\n') ? codeContent.substring(0, codeContent.length - 1) : codeContent,
        isCode: true,
        language: lang,
      ));

      lastIndex = match.end;
    }

    if (lastIndex < raw.length) {
      final trailing = raw.substring(lastIndex);
      if (trailing.isNotEmpty) {
        segments.add(_ContentSegment(text: trailing, isCode: false));
      }
    }

    if (segments.isEmpty) {
      segments.add(_ContentSegment(text: raw, isCode: false));
    }

    return segments;
  }
}

class _ContentSegment {
  final String text;
  final bool isCode;
  final String language;

  _ContentSegment({
    required this.text,
    required this.isCode,
    this.language = '',
  });
}
