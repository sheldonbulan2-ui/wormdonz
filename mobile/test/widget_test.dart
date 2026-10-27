import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:wormdonz/main.dart';
import 'package:wormdonz/theme/theme_provider.dart';

void main() {
  testWidgets('WormDonz smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => ThemeProvider(),
        child: const WormDonzApp(),
      ),
    );
  });
}
