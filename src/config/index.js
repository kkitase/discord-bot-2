/**
 * 設定モジュールのエントリーポイント
 */

const constants = require("./constants");
const { validateEnv, REQUIRED_VARS, OPTIONAL_VARS } = require("./env");

module.exports = {
  ...constants,
  validateEnv,
  REQUIRED_VARS,
  OPTIONAL_VARS,
};
