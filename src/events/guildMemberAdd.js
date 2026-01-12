/**
 * guildMemberAdd イベントハンドラ
 * 新規メンバー参加時のウェルカムメッセージ
 */

const logger = require("../utils/logger");
const { getChannelFromCache } = require("../services/channel");

module.exports = {
  name: "guildMemberAdd",
  once: false,

  /**
   * イベント実行
   * @param {GuildMember} member - 参加したメンバー
   * @param {Object} state - ボットの状態オブジェクト
   * @param {Object} services - サービスオブジェクト
   * @param {Object} config - 設定オブジェクト
   */
  async execute(member, state, services, config) {
    if (!state.welcomeEnabled) return;

    const channel = getChannelFromCache(
      member.guild,
      config.welcomeChannelId,
      "ウェルカムメッセージ"
    );

    if (!channel) return;

    try {
      await channel.sendTyping();

      const text = await services.geminiService.generateWelcome(member.id);
      await channel.send(text);

      logger.info(`ウェルカムメッセージを送信: ${member.user.tag}`);
    } catch (error) {
      logger.error("新規メンバー参加時のメッセージ生成に失敗しました", error);

      // フォールバック: 固定メッセージ
      const fallbackMessage = `よく来たね、<@${member.id}>！ビリー隊長だよ！このハンズオンで一緒に鍛えよう！分からないことがあったら、いつでも聞いてね！`;
      await channel.send(fallbackMessage);
    }
  },
};
