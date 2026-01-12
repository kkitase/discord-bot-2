/**
 * コマンドローダー
 * 全てのスラッシュコマンドを集約
 */

const config = require("./config");
const help = require("./help");

// コマンド名をキーとしたMapで管理
const commands = new Map([
  [config.data.name, config],
  [help.data.name, help],
]);

// コマンドデータの配列（登録用）
const commandsData = [config.data, help.data];

module.exports = {
  commands,
  commandsData,
};
