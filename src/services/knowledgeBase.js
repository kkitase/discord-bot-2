/**
 * ナレッジベースサービス
 * rule.md と labs/ ディレクトリの資料を管理
 */

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const logger = require("../utils/logger");

// プロジェクトルートディレクトリ（src の親）
const PROJECT_ROOT = path.resolve(__dirname, "../..");

class KnowledgeBaseService {
  constructor() {
    this.ruleMarkdown = "";
    this.labsContent = "";
    this.labsFiles = [];
  }

  /**
   * ナレッジベースを初期化（rule.md と labs/ を読み込み）
   */
  async initialize() {
    await Promise.all([this.loadRuleMarkdown(), this.loadLabsContent()]);
    logger.info("ナレッジベースの初期化が完了しました");
  }

  /**
   * rule.md を読み込む
   */
  async loadRuleMarkdown() {
    try {
      const rulePath = path.join(PROJECT_ROOT, "labs", "overview.md");
      this.ruleMarkdown = fs.readFileSync(rulePath, "utf8");
      logger.info("labs/overview.md (旧 rule.md) を読み込みました");
    } catch (error) {
      logger.error("labs/overview.md の読み込みに失敗しました", error);
      this.ruleMarkdown =
        "スケジュールのファイルが読めなかったんだな。ごめんなさいなんだな。";
    }
  }

  /**
   * labs/ ディレクトリの全ファイルを読み込む
   */
  async loadLabsContent() {
    const labsDir = path.join(PROJECT_ROOT, "labs");

    if (!fs.existsSync(labsDir)) {
      logger.warn("labs/ ディレクトリが見つかりません");
      return;
    }

    try {
      const files = fs.readdirSync(labsDir);
      const contentParts = [];

      for (const file of files) {
        // overview.md は Rule として個別に読み込むため、ここではスキップ
        if (file === "overview.md") continue;

        const filePath = path.join(labsDir, file);
        const stat = fs.statSync(filePath);

        if (!stat.isFile()) continue;

        const ext = path.extname(file).toLowerCase();
        let content = null;

        if (ext === ".pdf") {
          content = await this.readPdfFile(filePath, file);
        } else if (ext === ".md" || ext === ".txt") {
          content = this.readTextFile(filePath, file);
        }

        if (content) {
          this.labsFiles.push(file);
          contentParts.push(content);
        }
      }

      this.labsContent = contentParts.join("\n\n---\n\n");
      logger.info(
        `labs/ から ${this.labsFiles.length} ファイルを読み込みました`
      );
    } catch (error) {
      logger.error("labs/ ディレクトリの読み込みに失敗しました", error);
    }
  }

  /**
   * PDFファイルを読み込む
   * @param {string} filePath - ファイルパス
   * @param {string} fileName - ファイル名（ログ用）
   * @returns {Promise<string|null>} 抽出されたテキスト
   */
  async readPdfFile(filePath, fileName) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      // PDFのテキストを整形（余分な空白を削除）
      const text = data.text
        .replace(/\n{3,}/g, "\n\n") // 3つ以上の改行を2つに
        .trim();

      logger.info(`PDF を読み込みました: ${fileName} (${text.length} 文字)`);

      return `## ハンズオン資料: ${fileName}\n\n${text}`;
    } catch (error) {
      logger.error(`PDF の読み込みに失敗しました: ${fileName}`, error);
      return null;
    }
  }

  /**
   * テキスト/Markdownファイルを読み込む
   * @param {string} filePath - ファイルパス
   * @param {string} fileName - ファイル名（ログ用）
   * @returns {string|null} ファイル内容
   */
  readTextFile(filePath, fileName) {
    try {
      const content = fs.readFileSync(filePath, "utf8").trim();
      logger.info(
        `テキストファイルを読み込みました: ${fileName} (${content.length} 文字)`
      );
      return `## ハンズオン資料: ${fileName}\n\n${content}`;
    } catch (error) {
      logger.error(`ファイルの読み込みに失敗しました: ${fileName}`, error);
      return null;
    }
  }

  /**
   * rule.md の内容を取得
   * @returns {string}
   */
  getRuleMarkdown() {
    return this.ruleMarkdown;
  }

  /**
   * labs/ の内容を取得
   * @returns {string}
   */
  getLabsContent() {
    return this.labsContent;
  }

  /**
   * 全てのナレッジ（rule.md + labs/）を取得
   * @returns {string}
   */
  getAllKnowledge() {
    const parts = [];

    if (this.ruleMarkdown) {
      parts.push("# ハンズオンのルール\n\n" + this.ruleMarkdown);
    }

    if (this.labsContent) {
      parts.push("# ハンズオン資料\n\n" + this.labsContent);
    }

    return parts.join("\n\n---\n\n");
  }

  /**
   * ナレッジベースの概要を取得
   * @returns {Object}
   */
  getSummary() {
    return {
      hasRuleMarkdown: this.ruleMarkdown.length > 0,
      ruleMarkdownLength: this.ruleMarkdown.length,
      labsFilesCount: this.labsFiles.length,
      labsFiles: this.labsFiles,
      labsContentLength: this.labsContent.length,
      totalLength: this.ruleMarkdown.length + this.labsContent.length,
    };
  }
}

module.exports = KnowledgeBaseService;
