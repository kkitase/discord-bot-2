/**
 * ready イベント
 * ボットが起動したときに実行されます
 */

const logger = require("../utils/logger");
const os = require("os");

module.exports = {
  name: "ready",
  once: true,
  /**
   * イベント実行
   * @param {Client} client - Discordクライアント
   */
  execute(client) {
    const hostname = os.hostname();
    const platform = os.platform();
    const isCloudRun = process.env.K_SERVICE !== undefined;

    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    logger.info(`🤖 ボットがオンラインになりました！`);
    logger.info(`👤 ログインユーザー: ${client.user.tag}`);
    logger.info(`🏠 実行環境: ${isCloudRun ? "Cloud Run" : "Local/Other"}`);
    logger.info(`💻 ホスト名: ${hostname} (${platform})`);
    if (isCloudRun) {
      logger.info(`🚀 サービス名: ${process.env.K_SERVICE}`);
      logger.info(`🆔 リビジョン: ${process.env.K_REVISION}`);
    }
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  },
};
