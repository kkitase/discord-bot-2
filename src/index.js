/**
 * アプリケーションエントリーポイント
 * 環境変数の読み込みとボットの起動
 */

require("dotenv").config();

const { validateEnv } = require("./config");
const { startBot } = require("./bot");
const logger = require("./utils/logger");

async function main() {
  try {
    // 環境変数のバリデーション
    const config = validateEnv();
    logger.info("環境変数のバリデーションが完了しました");

    // ボット起動
    await startBot(config);
  } catch (error) {
    logger.error("ボットの起動に失敗しました", error);
    process.exit(1);
  }
}

main();
