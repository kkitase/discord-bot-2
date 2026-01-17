/**
 * Gemini APIサービス
 * AIとの対話処理を一元管理
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAICacheManager } = require("@google/generative-ai/server");
const logger = require("../utils/logger");
const prompts = require("../prompts/billy");

class GeminiService {
  /**
   * @param {string} apiKey - Gemini APIキー
   * @param {string} modelName - 使用するモデル名
   */
  constructor(apiKey, modelName) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.cacheManager = new GoogleAICacheManager(apiKey);
    this.modelName = modelName;
    this.cacheName = null;
    this.cachedModel = null;
    logger.info(`Geminiモデル初期化準備 (モデル: ${modelName})`);
  }

  /**
   * ナレッジベースをキャッシュに登録
   * @param {string} knowledgeContent - キャッシュするナレッジベースの内容
   * @param {string} ttlSeconds - キャッシュの有効期間（秒）
   */
  async initializeCache(knowledgeContent, ttlSeconds = 3600) {
    try {
      logger.info("Context Cache を作成しています...");

      const cache = await this.cacheManager.create({
        model: this.modelName,
        displayName: "handson_knowledge_base",
        systemInstruction: prompts.systemInstruction(), // システム指示もキャッシュに含める
        contents: [
          {
            role: "user",
            parts: [{ text: knowledgeContent }],
          },
        ],
        ttlSeconds: ttlSeconds,
      });

      this.cacheName = cache.name;
      this.cachedModel = this.genAI.getGenerativeModelFromCachedContent(cache);

      logger.info(`Context Cache が作成されました: ${this.cacheName}`);
      return this.cacheName;
    } catch (error) {
      logger.error(
        "Context Cache の作成に失敗しました。通常の生成にフォールバックします。",
        error,
      );
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      return null;
    }
  }

  /**
   * コンテンツを生成
   * @param {string} prompt - プロンプト
   * @returns {Promise<string>} 生成されたテキスト
   */
  async generateContent(prompt) {
    // キャッシュがある場合は cachedModel を、ない場合は通常の model を使用
    const targetModel =
      this.cachedModel ||
      this.model ||
      this.genAI.getGenerativeModel({ model: this.modelName });
    const result = await targetModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  /**
   * ウェルカムメッセージを生成
   * @param {string} memberId - メンバーID
   * @returns {Promise<string>} 生成されたメッセージ
   */
  async generateWelcome(memberId) {
    const prompt = prompts.welcome(memberId);
    return this.generateContent(prompt);
  }

  /**
   * 自己紹介への返信を生成
   * @param {string} messageContent - 自己紹介メッセージ
   * @returns {Promise<string>} 生成された返信
   */
  async generateIntroResponse(messageContent) {
    const prompt = prompts.introResponse(messageContent);
    return this.generateContent(prompt);
  }

  /**
   * メンションへの返信を生成
   * @param {string} userMessage - ユーザーのメッセージ
   * @param {string} knowledgeBaseContent - ナレッジベースの内容
   * @returns {Promise<string>} 生成された返信
   */
  async generateMentionResponse(userMessage, knowledgeBaseContent) {
    const prompt = prompts.mentionResponse(userMessage, knowledgeBaseContent);
    return this.generateContent(prompt);
  }

  /**
   * ランダム相槌を生成
   * @param {string} messageContent - メッセージ内容
   * @returns {Promise<string>} 生成された相槌
   */
  async generateRandomEncouragement(messageContent) {
    const prompt = prompts.randomEncouragement(messageContent);
    return this.generateContent(prompt);
  }

  /**
   * スケジュールリマインダーを生成
   * @param {string} scheduleText - スケジュールテキスト
   * @returns {Promise<string>} 生成されたリマインダー
   */
  async generateScheduleReminder(scheduleText) {
    const prompt = prompts.scheduleReminder(scheduleText);
    return this.generateContent(prompt);
  }
}

module.exports = GeminiService;
