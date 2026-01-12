/**
 * チャンネル操作ユーティリティ
 */

const logger = require("../utils/logger");

/**
 * チャンネルIDからチャンネルオブジェクトを取得
 * @param {Client} client - Discordクライアント
 * @param {string|null} channelId - チャンネルID
 * @param {string} purpose - チャンネルの用途（ログ用）
 * @returns {Promise<Channel|null>} チャンネルオブジェクトまたはnull
 */
async function getChannel(client, channelId, purpose) {
  if (!channelId) {
    logger.warn(`${purpose}用のチャンネルIDが設定されていません`);
    return null;
  }

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      logger.error(`${purpose}用チャンネル (ID: ${channelId}) が見つかりません`);
      return null;
    }
    return channel;
  } catch (error) {
    logger.error(`${purpose}用チャンネルの取得に失敗しました`, error);
    return null;
  }
}

/**
 * ギルドのチャンネルキャッシュから取得（非同期fetch不要の場合）
 * @param {Guild} guild - Discordギルド
 * @param {string|null} channelId - チャンネルID
 * @param {string} purpose - チャンネルの用途（ログ用）
 * @returns {Channel|null} チャンネルオブジェクトまたはnull
 */
function getChannelFromCache(guild, channelId, purpose) {
  if (!channelId) {
    logger.warn(`${purpose}用のチャンネルIDが設定されていません`);
    return null;
  }

  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    logger.error(`${purpose}用チャンネル (ID: ${channelId}) が見つかりません`);
    return null;
  }
  return channel;
}

module.exports = {
  getChannel,
  getChannelFromCache,
};
