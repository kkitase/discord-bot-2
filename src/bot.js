/**
 * Discordボットのメインモジュール
 * クライアントの初期化とサービスの設定
 */

const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const logger = require("./utils/logger");
const GeminiService = require("./services/gemini");
const KnowledgeBaseService = require("./services/knowledgeBase");
const { registerEvents } = require("./events");

/**
 * Discordクライアントを作成
 * @returns {Client} Discordクライアント
 */
function createClient() {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });
}

/**
 * Expressサーバーを起動（ヘルスチェック用）
 * @param {number} port - ポート番号
 */
function startHealthCheckServer(port) {
  const app = express();

  app.get("/", (_req, res) => {
    res.send("Discord bot is running and healthy!");
  });

  app.listen(port, () => {
    logger.info(`Webサーバーがポート ${port} で起動しました`);
  });
}

/**
 * グレースフルシャットダウンを設定
 * @param {Client} client - Discordクライアント
 * @param {ReminderService} reminderService - リマインダーサービス
 */
function setupGracefulShutdown(client) {
  const shutdown = () => {
    logger.info("シャットダウンを開始します...");
    client.destroy();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

/**
 * ボットを起動
 * @param {Object} config - バリデーション済みの設定オブジェクト
 */
async function startBot(config) {
  // クライアント作成
  const client = createClient();

  // ナレッジベース初期化（rule.md + labs/）
  const knowledgeBase = new KnowledgeBaseService();
  await knowledgeBase.initialize();

  // ナレッジベースのサマリーをログ出力
  const summary = knowledgeBase.getSummary();
  logger.info(
    `ナレッジベース: rule.md (${summary.ruleMarkdownLength}文字), labs/ (${summary.labsFilesCount}ファイル, ${summary.labsContentLength}文字)`,
  );

  // サービス初期化
  const geminiService = new GeminiService(
    config.geminiApiKey,
    config.geminiModel,
  );

  // Context Cache の初期化
  const knowledgeContent = knowledgeBase.getAllKnowledge();
  if (knowledgeContent) {
    await geminiService.initializeCache(knowledgeContent);
  }

  // 状態オブジェクト
  const state = {
    mentionsEnabled: true,
    welcomeEnabled: true,
    introEnabled: true,
    reactionsEnabled: true,
  };

  // サービスオブジェクト
  const services = {
    geminiService,
    knowledgeBase,
  };

  // イベント登録（ナレッジベースの内容を渡す）
  registerEvents(
    client,
    state,
    services,
    config,
    knowledgeBase.getAllKnowledge(),
  );

  // ヘルスチェックサーバー起動
  startHealthCheckServer(config.port);

  // グレースフルシャットダウン設定
  setupGracefulShutdown(client);

  // Discordにログイン
  await client.login(config.discordToken);
}

module.exports = { startBot, createClient };
