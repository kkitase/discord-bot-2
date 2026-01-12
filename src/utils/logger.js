/**
 * 構造化ログユーティリティ
 * ログレベルに応じた出力制御を提供
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || "info"];

/**
 * タイムスタンプを生成
 * @returns {string} ISO形式のタイムスタンプ
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * ログメッセージをフォーマット
 * @param {string} level - ログレベル
 * @param {string} message - メッセージ
 * @param {*} data - 追加データ
 * @returns {string} フォーマット済みメッセージ
 */
function formatMessage(level, message, data) {
  const timestamp = getTimestamp();
  const levelStr = level.toUpperCase().padEnd(5);
  let output = `[${timestamp}] [${levelStr}] ${message}`;
  if (data !== undefined) {
    if (data instanceof Error) {
      output += `\n${data.stack || data.message}`;
    } else if (typeof data === "object") {
      output += ` ${JSON.stringify(data)}`;
    } else {
      output += ` ${data}`;
    }
  }
  return output;
}

const logger = {
  debug(message, data) {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.log(formatMessage("debug", message, data));
    }
  },

  info(message, data) {
    if (currentLevel <= LOG_LEVELS.info) {
      console.log(formatMessage("info", message, data));
    }
  },

  warn(message, data) {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(formatMessage("warn", message, data));
    }
  },

  error(message, data) {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(formatMessage("error", message, data));
    }
  },
};

module.exports = logger;
