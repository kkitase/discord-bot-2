/**
 * /help コマンド
 * ヘルプメッセージを表示
 */

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("ビリー隊長の使い方を表示します。"),

  /**
   * コマンドを実行
   * @param {CommandInteraction} interaction - インタラクション
   */
  async execute(interaction) {
    const helpMessage = `
**ビリー隊長のハンズオンサポート！**

使えるコマンド:
\`/config\`: View current status of all features.
\`/config feature:[feature] stauts:[on/off]\`: Toggle features.
  - \`mention\`: Respond only when mentioned.
  - \`welcome\`: Welcome message for new members.
  - \`intro\`: Enthusiastic replies to introductions.
  - \`reaction\`: Ambient reactions to chat.
\`/help\`: このヘルプを表示するよ。

困ったときはいつでもメンションしてね！一緒に頑張ろう！
    `.trim();

    await interaction.reply({
      content: helpMessage,
      ephemeral: true,
    });
  },
};
