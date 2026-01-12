/**
 * messageCreate イベントハンドラ
 * メッセージ受信時の処理
 */

const logger = require("../utils/logger");
const { REACTION_EMOJIS, REACTION_CHANCE } = require("../config");

module.exports = {
  name: "messageCreate",
  once: false,

  /**
   * イベント実行
   * @param {Message} message - 受信したメッセージ
   * @param {Object} state - ボットの状態オブジェクト
   * @param {Object} services - サービスオブジェクト
   * @param {Object} config - 設定オブジェクト
   * @param {string} knowledgeBaseContent - ナレッジベースの内容（rule.md + labs/）
   * @param {Client} client - Discordクライアント
   */
  async execute(
    message,
    state,
    services,
    config,
    knowledgeBaseContent,
    client
  ) {
    if (message.author.bot) return;

    const introChannelId = config.introChannelId;
    const isMentioned = message.mentions.has(client.user);

    // 自己紹介への返信
    if (introChannelId && message.channel.id === introChannelId) {
      if (state.introEnabled) {
        await this.handleIntroduction(message, services);
      }
      return;
    }

    // メンションへの応答
    if (isMentioned) {
      if (state.mentionsEnabled) {
        await this.handleMention(message, services, knowledgeBaseContent);
      }
      return;
    }

    // 相槌・リアクション
    if (state.reactionsEnabled) {
      await this.handleRandomResponse(message, services);
    }
  },

  /**
   * 自己紹介への返信を処理
   * @param {Message} message - メッセージ
   * @param {Object} services - サービスオブジェクト
   */
  async handleIntroduction(message, services) {
    try {
      await message.channel.sendTyping();

      const text = await services.geminiService.generateIntroResponse(
        message.content
      );
      await message.reply(text);

      logger.info(`自己紹介に返信: ${message.author.tag}`);
    } catch (error) {
      logger.error("自己紹介への返信生成に失敗しました", error);
      await message.reply("よく来たね！ビリー隊長だよ！一緒に頑張ろう！");
    }
  },

  /**
   * メンションへの応答を処理
   * @param {Message} message - メッセージ
   * @param {Object} services - サービスオブジェクト
   * @param {string} knowledgeBaseContent - ナレッジベースの内容
   */
  async handleMention(message, services, knowledgeBaseContent) {
    try {
      const userMessage = message.content.replace(/<@!?\d+>/g, "").trim();
      await message.channel.sendTyping();

      const text = await services.geminiService.generateMentionResponse(
        userMessage,
        knowledgeBaseContent
      );

      // すでにスレッド内かチェック
      if (message.channel.isThread()) {
        await message.reply(text);
      } else {
        // スレッドを作成して回答を投稿
        const thread = await message.startThread({
          name: `ビリー隊長への質問: ${message.author.username}`,
          autoArchiveDuration: 60, // 1時間でアーカイブ
        });
        await thread.send(text);
      }

      logger.info(`メンションに応答 (スレッド): ${message.author.tag}`);
    } catch (error) {
      logger.error(
        "Gemini APIとの連携またはスレッド作成でエラーが発生しました",
        error
      );
      await message.reply(
        "ごめんね！今ちょっと調子が悪いんだ。もう一回試してみて！\nミュート中はメンションでのみ応答するよ！"
      );
    }
  },

  /**
   * ランダム相槌またはリアクションを処理
   * @param {Message} message - メッセージ
   * @param {Object} services - サービスオブジェクト
   */
  async handleRandomResponse(message, services) {
    try {
      if (Math.random() < REACTION_CHANCE) {
        // 絵文字リアクション
        const shuffledEmojis = [...REACTION_EMOJIS].sort(
          () => 0.5 - Math.random()
        );
        const reactionsToAdd = Math.floor(Math.random() * 4) + 2;

        for (let i = 0; i < reactionsToAdd && i < shuffledEmojis.length; i++) {
          await message.react(shuffledEmojis[i]);
        }
      } else {
        // Geminiを使った相槌
        await message.channel.sendTyping();

        const text = await services.geminiService.generateRandomEncouragement(
          message.content
        );
        await message.channel.send(text);
      }
    } catch (error) {
      logger.error("ランダムリアクションまたは相槌の送信に失敗しました", error);
    }
  },
};
