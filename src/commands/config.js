const { SlashCommandBuilder } = require("discord.js");
const logger = require("../utils/logger");

const FEATURE_NAMES = {
  mention: "Mention Response",
  welcome: "Welcome Message",
  intro: "Introduction Reply",
  reaction: "Ambient Reactions",
};

const STATE_KEYS = {
  mention: "mentionsEnabled",
  welcome: "welcomeEnabled",
  intro: "introEnabled",
  reaction: "reactionsEnabled",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Manage or view bot feature settings.")
    .addStringOption((option) =>
      option
        .setName("feature")
        .setDescription(
          "The feature to configure (omit to view current status)."
        )
        .setRequired(false)
        .addChoices(
          { name: "mention", value: "mention" },
          { name: "welcome", value: "welcome" },
          { name: "intro", value: "intro" },
          { name: "reaction", value: "reaction" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("stauts") // User requested "stauts" (likely typo but following exactly)
        .setDescription("The status to set: on or off.")
        .setRequired(false)
        .addChoices({ name: "on", value: "on" }, { name: "off", value: "off" })
    ),

  /**
   * Execute the command
   * @param {Interaction} interaction - The interaction object
   * @param {Object} state - The bot state object
   */
  async execute(interaction, state) {
    logger.info(
      `[config] コマンド実行開始: feature=${interaction.options.getString(
        "feature"
      )}, stauts=${interaction.options.getString("stauts")}`
    );

    try {
      const feature = interaction.options.getString("feature");
      const status = interaction.options.getString("stauts"); // Reading from "stauts"

      // Verify state object
      if (!state) {
        logger.error("[config] state オブジェクトが未定義です");
        throw new Error("Internal State Error");
      }

      // If no feature or no status, show current status list
      if (!feature || !status) {
        logger.info("[config] ステータス一覧を表示します");
        const statusMessage = [
          "**Current Bot Status:**",
          `mention: ${state.mentionsEnabled ? "on" : "off"}`,
          `welcome: ${state.welcomeEnabled ? "on" : "off"}`,
          `intro: ${state.introEnabled ? "on" : "off"}`,
          `reaction: ${state.reactionsEnabled ? "on" : "off"}`,
          "",
          "*To change settings, use `/config feature:[feature] stauts:[on/off]`*",
        ].join("\n");

        await interaction.reply({
          content: statusMessage,
          ephemeral: true,
        });
        return;
      }

      const enabled = status === "on";
      const stateKey = STATE_KEYS[feature];

      if (!stateKey) {
        logger.warn(`[config] 未知の機能が指定されました: ${feature}`);
        await interaction.reply({
          content: `Unknown feature: ${feature}`,
          ephemeral: true,
        });
        return;
      }

      logger.info(`[config] 設定を更新します: ${stateKey} = ${enabled}`);
      state[stateKey] = enabled;

      await interaction.reply({
        content: `Set **${feature}** to **${status}**!`,
        ephemeral: true,
      });
      logger.info("[config] レスポンス送信完了");
    } catch (error) {
      logger.error("[config] 実行中にエラーが発生しました", error);
      throw error;
    }
  },
};
