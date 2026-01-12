/**
 * 環境変数のバリデーションと設定オブジェクトの生成
 */

const REQUIRED_VARS = [
  "DISCORD_BOT_TOKEN",
  "GEMINI_API_KEY",
  "DISCORD_CLIENT_ID",
];

const OPTIONAL_VARS = [
  "DISCORD_REMINDER_CHANNEL_ID",
  "DISCORD_WELCOME_CHANNEL_ID",
  "DISCORD_INTRO_CHANNEL_ID",
  "GEMINI_MODEL",
  "PORT",
];

/**
 * 環境変数をバリデーションし、設定オブジェクトを返す
 * @returns {Object} バリデーション済みの設定オブジェクト
 * @throws {Error} 必須の環境変数が不足している場合
 */
function validateEnv() {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `必須の環境変数が設定されていません: ${missing.join(", ")}`
    );
  }

  return {
    // Discord設定
    discordToken: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    reminderChannelId: process.env.DISCORD_REMINDER_CHANNEL_ID || null,
    welcomeChannelId: process.env.DISCORD_WELCOME_CHANNEL_ID || null,
    introChannelId: process.env.DISCORD_INTRO_CHANNEL_ID || null,

    // Gemini設定
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || "gemini-3-flash-preview",

    // サーバー設定
    port: parseInt(process.env.PORT, 10) || 8080,
  };
}

module.exports = { validateEnv, REQUIRED_VARS, OPTIONAL_VARS };
