/**
 * アプリケーション全体で使用する定数
 */

// 絵文字リアクション
const REACTION_EMOJIS = [
  "👍",
  "🎉",
  "🔥",
  "🚀",
  "🤩",
  "💯",
  "👏",
  "✨",
  "🤖",
  "💪",
];

// 確率・間隔
const REACTION_CHANCE = 0.5;
const STATUS_ROTATION_INTERVAL_MS = 10 * 60 * 1000; // 10分
const REMINDER_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1時間

// ステータスメッセージ
const STATUS_UPDATES = [
  "みんなのコードを見守り中",
  "ハンズオンの準備運動中",
  "質問いつでもドントコイ！",
  "Geminiと作戦会議中",
];

module.exports = {
  REACTION_EMOJIS,
  REACTION_CHANCE,
  STATUS_ROTATION_INTERVAL_MS,
  STATUS_UPDATES,
  REMINDER_CHECK_INTERVAL_MS,
};
