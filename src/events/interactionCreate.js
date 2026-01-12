/**
 * interactionCreate イベントハンドラ
 * スラッシュコマンドの処理
 */

const logger = require("../utils/logger");
const { commands } = require("../commands");

module.exports = {
  name: "interactionCreate",
  once: false,

  /**
   * イベント実行
   * @param {Interaction} interaction - インタラクション
   * @param {Object} state - ボットの状態オブジェクト
   * @param {Object} services - サービスオブジェクト
   */
  async execute(interaction, state, services) {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const command = commands.get(commandName);

    if (!command) {
      logger.warn(`不明なコマンド: ${commandName}`);
      return;
    }

    try {
      await command.execute(interaction, state, services);
      logger.info(`コマンド実行: /${commandName}`);
    } catch (error) {
      logger.error(`コマンド実行エラー: /${commandName}`, error);

      const errorMessage = "コマンドの実行中にエラーが発生しました。";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  },
};
