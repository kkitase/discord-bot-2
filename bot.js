/**
 * レガシーエントリーポイント
 * Dockerfile の CMD ["node", "bot.js"] との後方互換性を維持
 */

require("./src/index");
