/**
 * イベントローダー
 * 全てのイベントハンドラを集約
 */

const ready = require("./ready");
const interactionCreate = require("./interactionCreate");
const guildMemberAdd = require("./guildMemberAdd");
const messageCreate = require("./messageCreate");

const events = [ready, interactionCreate, guildMemberAdd, messageCreate];

/**
 * イベントをクライアントに登録
 * @param {Client} client - Discordクライアント
 * @param {Object} state - ボットの状態オブジェクト
 * @param {Object} services - サービスオブジェクト
 * @param {Object} config - 設定オブジェクト
 * @param {string} knowledgeBaseContent - ナレッジベースの内容（rule.md + labs/）
 */
function registerEvents(client, state, services, config, knowledgeBaseContent) {
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) =>
        event.execute(
          ...args,
          state,
          services,
          config,
          knowledgeBaseContent,
          client
        )
      );
    } else {
      client.on(event.name, (...args) =>
        event.execute(
          ...args,
          state,
          services,
          config,
          knowledgeBaseContent,
          client
        )
      );
    }
  }
}

module.exports = {
  events,
  registerEvents,
};
