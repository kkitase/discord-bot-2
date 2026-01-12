/**
 * Gemini APIサービス
 * AIとの対話処理を一元管理
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");
const prompts = require("../prompts/billy");

class GeminiService {
  /**
   * @param {string} apiKey - Gemini APIキー
   * @param {string} modelName - 使用するモデル名
   */
  constructor(apiKey, modelName) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    this.modelName = modelName;
    logger.info(`Geminiモデルを初期化: ${modelName}`);
  }

  /**
   * コンテンツを生成
   * @param {string} prompt - プロンプト
   * @returns {Promise<string>} 生成されたテキスト
   */
  async generateContent(prompt) {
    const result = await this.model.generateContent(prompt);
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
