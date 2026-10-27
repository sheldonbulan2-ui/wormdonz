class UserModel {
  final String id;
  final String email;
  final String? telegramId;
  final String? telegramUsername;
  final String displayName;
  final String? avatarUrl;
  int credits;
  String tier;
  final bool isBanned;

  UserModel({
    required this.id,
    required this.email,
    this.telegramId,
    this.telegramUsername,
    required this.displayName,
    this.avatarUrl,
    required this.credits,
    required this.tier,
    this.isBanned = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      telegramId: json['telegram_id'],
      telegramUsername: json['telegram_username'],
      displayName: json['display_name'] ?? 'WormDonz User',
      avatarUrl: json['avatar_url'],
      credits: json['credits'] ?? 0,
      tier: json['tier'] ?? 'free',
      isBanned: json['is_banned'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'telegram_id': telegramId,
    'telegram_username': telegramUsername,
    'display_name': displayName,
    'avatar_url': avatarUrl,
    'credits': credits,
    'tier': tier,
    'is_banned': isBanned,
  };
}

class ChatModel {
  final String id;
  String title;
  bool isPinned;
  final String model;
  final DateTime updatedAt;

  ChatModel({
    required this.id,
    required this.title,
    required this.isPinned,
    required this.model,
    required this.updatedAt,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    return ChatModel(
      id: json['id'] ?? '',
      title: json['title'] ?? 'New Chat',
      isPinned: json['is_pinned'] ?? false,
      model: json['model'] ?? 'wormdonz-base',
      updatedAt: DateTime.tryParse(json['updated_at'] ?? '') ?? DateTime.now(),
    );
  }
}

class ChatMessage {
  final String id;
  final String chatId;
  final String role; // 'user' | 'assistant'
  final String content;
  final int tokensUsed;
  final DateTime createdAt;
  final bool isStreaming;

  ChatMessage({
    required this.id,
    required this.chatId,
    required this.role,
    required this.content,
    this.tokensUsed = 0,
    required this.createdAt,
    this.isStreaming = false,
  });

  ChatMessage copyWith({String? content, bool? isStreaming}) {
    return ChatMessage(
      id: id,
      chatId: chatId,
      role: role,
      content: content ?? this.content,
      tokensUsed: tokensUsed,
      createdAt: createdAt,
      isStreaming: isStreaming ?? this.isStreaming,
    );
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] ?? '',
      chatId: json['chat_id'] ?? '',
      role: json['role'] ?? 'user',
      content: json['content'] ?? '',
      tokensUsed: json['tokens_used'] ?? 0,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }
}

class SubscriptionPlanModel {
  final String tierName;
  final String displayName;
  final int priceCents;
  final String billingCycle;
  final int creditAllowance;
  final List<String> features;
  final bool isActive;

  SubscriptionPlanModel({
    required this.tierName,
    required this.displayName,
    required this.priceCents,
    required this.billingCycle,
    required this.creditAllowance,
    required this.features,
    this.isActive = true,
  });

  String get priceFormatted => (priceCents / 100).toStringAsFixed(2);

  factory SubscriptionPlanModel.fromJson(Map<String, dynamic> json) {
    return SubscriptionPlanModel(
      tierName: json['tier_name'] ?? 'free',
      displayName: json['display_name'] ?? '',
      priceCents: json['price_cents'] ?? 0,
      billingCycle: json['billing_cycle'] ?? 'monthly',
      creditAllowance: json['credit_allowance'] ?? 0,
      features: List<String>.from(json['features'] ?? []),
      isActive: json['is_active'] ?? true,
    );
  }
}

class RedeemResult {
  final bool success;
  final int creditsAwarded;
  final int newBalance;
  final String message;

  RedeemResult({
    required this.success,
    required this.creditsAwarded,
    required this.newBalance,
    required this.message,
  });

  factory RedeemResult.fromJson(Map<String, dynamic> json) {
    return RedeemResult(
      success: json['success'] ?? false,
      creditsAwarded: json['creditsAwarded'] ?? 0,
      newBalance: json['newBalance'] ?? 0,
      message: json['message'] ?? '',
    );
  }
}
