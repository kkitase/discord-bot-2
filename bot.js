// ライブラリのインポート
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const express = require("express");

// Discordボットのクライアント設定
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Gemini APIのクライアント設定
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-pro";
const model = genAI.getGenerativeModel({ model: modelName });
console.log(`Using Gemini model: ${modelName}`);

// ★★★ ボットの状態管理 ★★★
let isMuted = false;
let remindersEnabled = false; // デフォルトはオフ

// ★★★ rule.mdを起動時に読み込む ★★★
let ruleMarkdown;
try {
  ruleMarkdown = fs.readFileSync("rule.md", "utf8");
} catch (error) {
  console.error("rule.mdの読み込みに失敗しました:", error);
  // ファイルが読めなくてもボットは起動させるが、ルールに関する機能は使えなくなる
  ruleMarkdown = "ルールのファイルが読めなかったんだな。ごめんなさいなんだな。";
}

// --- ★★★ ここからリマインダー機能のコード ★★★ ---

// リマインダーを最後に送信した日付を記録する変数
let lastReminderSentDate = null;
let reminderInterval;

/**
 * スケジュールをチャンネルにリマインドする関数
 */
async function sendScheduleReminder() {
  try {
    // 指定されたチャンネルIDからチャンネルオブジェクトを取得
    const channelId = process.env.DISCORD_REMINDER_CHANNEL_ID;
    if (!channelId) {
      console.error("リマインダー用のチャンネルIDが設定されていません。");
      return;
    }
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.error("リマインダー用のチャンネルが見つかりません。");
      return;
    }

    // rule.mdを読み込み、正規表現で「スケジュール」セクションを抽出
    const ruleContent = fs.readFileSync("rule.md", "utf8");
    const scheduleRegex = /## スケジュール([\s\S]*?)(?=\n## |$)/;
    const match = ruleContent.match(scheduleRegex);

    if (match && match[1]) {
      const scheduleText = match[1].trim();

      try {
        await channel.sendTyping();
        const prompt = `
          あなたは、ハンズオンの熱血指導者「ビリー隊長」だよ！
          新しい一日の始まりだね！参加者に向けて、今日のスケジュールを知らせるよ！
          元気いっぱい、明るく、そしてフレンドリーに！「一緒に頑張ろう！」の精神で励ましてね！
          以下のスケジュール情報を必ず含めてメッセージを作ってね！
          【重要】メッセージは全体で3行以内で、短く元気に！

          ---
          今日のスケジュール:
          ${scheduleText}
          ---
        `;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedMessage = response.text();
        await channel.send(generatedMessage);
        console.log("Geminiによるスケジュールリマインダーを送信しました。");
      } catch (geminiError) {
        console.error("Geminiでのリマインダー生成に失敗しました:", geminiError);
        // エラー時は、以前の固定メッセージを送信する
        const scheduleMessage = `ビリー隊長だよ！みんな、集合！今日のスケジュールを発表するね！\n\n## スケジュール\n${scheduleText}\n\n一緒に頑張ろう！`;
        await channel.send(scheduleMessage);
        console.log("静的なスケジュールリマインダーを送信しました。");
      }
    } else {
      console.log("rule.mdからスケジュールが見つかりませんでした。");
    }
  } catch (error) {
    console.error("スケジュールリマインダーの送信に失敗しました:", error);
  }
}

/**
 * リマインダーの定期実行を開始/停止する関数
 */
function setReminderInterval() {
  if (remindersEnabled) {
    if (reminderInterval) clearInterval(reminderInterval); // 既存のインターバルをクリア
    reminderInterval = setInterval(() => {
      const today = new Date().toLocaleDateString();
      if (lastReminderSentDate !== today) {
        console.log("本日まだリマインダーを送信していません。送信を試みます。");
        sendScheduleReminder();
        lastReminderSentDate = today;
      }
    }, 3600000); // 1時間
    console.log("スケジュールリマインダー機能が有効です。");
  } else {
    if (reminderInterval) clearInterval(reminderInterval);
    console.log("スケジュールリマインダー機能は無効です。");
  }
}

// --- ★★★ リマインダー機能のコードここまで ★★★ ---

// ボット起動時の処理
client.once("clientReady", () => {
  const serverNames = client.guilds.cache.map((guild) => guild.name).join(", ");
  const serverCount = client.guilds.cache.size;
  console.log(`${client.user.tag} としてログインしました！`);
  console.log(`参加サーバー数: ${serverCount}`);
  console.log(`参加サーバー: ${serverNames}`);
  // リマインダーの初期設定
  setReminderInterval();
});

// ★★★ スラッシュコマンドの処理 ★★★
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "mute") {
    const status = interaction.options.getString("status");
    isMuted = status === "on";
    await interaction.reply({
      content: `ボットのミュートは現在 ${isMuted ? "オン" : "オフ"} です。`,
      ephemeral: true, // コマンド実行者のみに見えるメッセージ
    });
  } else if (commandName === "reminders") {
    const status = interaction.options.getString("status");
    remindersEnabled = status === "on";
    setReminderInterval(); // 設定を即時反映
    await interaction.reply({
      content: `リマインダーは現在 ${
        remindersEnabled ? "オン" : "オフ"
      } です。`,
      ephemeral: true,
    });
  }
});

// ★★★ 新規メンバー参加時の処理 ★★★
client.on("guildMemberAdd", async (member) => {
  // isMutedがtrueでも、この機能は常に動作する
  const channelId = process.env.DISCORD_WELCOME_CHANNEL_ID;
  if (!channelId) {
    console.error("ウェルカムメッセージ用のチャンネルIDが設定されていません。");
    return;
  }
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) {
    console.error(`チャンネル ID ${channelId} が見つかりません。`);
    return;
  }

  try {
    // Geminiが応答を考えているように見せる
    await channel.sendTyping();

    const prompt = `
      あなたは、ハンズオンの熱血指導者「ビリー隊長」だよ！
      新しい参加者、<@${member.id}>が入隊してくれたね！
      最高の気合と歓迎の気持ちを込めて、元気でフレンドリーなウェルカムメッセージを送ってね！
      「一緒に頑張ろう！」の精神だよ！
      【重要】メッセージは3行以内で、短く元気に！
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    await channel.send(text);
  } catch (error) {
    console.error("新規メンバー参加時のメッセージ生成に失敗しました:", error);
    // エラーが発生した場合は、固定のメッセージを送信する
    const welcomeMessage = `よく来たね、<@${member.id}>！ビリー隊長だよ！このハンズオンで一緒に鍛えよう！分からないことがあったら、いつでも聞いてね！`;
    channel.send(welcomeMessage);
  }
});

// メッセージ受信時の処理
client.on("messageCreate", async (message) => {
  // ミュート中は、メンションと自己紹介以外には反応しない
  const introChannelId = process.env.DISCORD_INTRO_CHANNEL_ID;
  if (
    isMuted &&
    !message.mentions.has(client.user) &&
    (!introChannelId || message.channel.id !== introChannelId)
  ) {
    return;
  }

  if (message.author.bot) return;

  // ★★★ 自己紹介への返信 ★★★
  // introChannelId is already defined above
  if (introChannelId && message.channel.id === introChannelId) {
    try {
      await message.channel.sendTyping();
      const prompt = `
        あなたは、ハンズオンの熱血指導者「ビリー隊長」だよ！
        新しい参加者が自己紹介してくれたね！いいぞ！
        元気で、フレンドリーに、歓迎の気持ちを込めて返信してね！ビリー隊長らしく！
        【一番大事なこと】3行以内で、短く元気に！
        
        自己紹介メッセージ：
        "${message.content}"
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      await message.reply(text);
    } catch (error) {
      console.error("自己紹介への返信生成に失敗しました:", error);
      // エラーが起きても、何か一言返しておく
      message.reply("よく来たね！ビリー隊長だよ！一緒に頑張ろう！");
    }
    // 自己紹介に返信したので、以降の処理はしない
    return;
  }

  if (message.mentions.has(client.user)) {
    try {
      const userMessage = message.content.replace(/<@!?\\d+>/, "").trim();
      await message.channel.sendTyping();

      const prompt = `
        あなたは、ハンズオンの熱血指導者「ビリー隊長」だよ！
        参加者がハンズオンで困っている時は、元気で、分かりやすく、そしてフレンドリーにサポートしてね！
        技術的な質問でも、ビリー隊長らしく明るく答えてね！「できるよ！」「いいぞ！」の精神だよ！
        もし、ユーザーがハンズオンのルールやスケジュール、仕様について質問してきたら、以下の情報を参考に答えてね！
        【一番大事なこと】3行以内で、短く元気に！
        【一番大事なこと】より詳しい情報が必要なら、運営スタッフに聞くよう案内してね！
        ---
        ${ruleMarkdown}
        ---
        それ以外の質問の場合は、以下のビリー隊長スタイルで対応してね：
        1. 参加者を元気に励まそう！「できるよ！」「いいぞ！」だよ！
        2. 技術的な質問には、分かりやすく、そして明るく答えてね！
        3. トラブルは一緒に解決しよう！「一緒に頑張ろう！」の精神で！
        4. いつも正直に、明るく、前向きに！
        5. 【一番大事なこと】3行以内で、短く元気に！
        この設定で、次のメッセージに返事してね！

        ユーザーのメッセージ: "${userMessage}"
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      await message.reply(text);
    } catch (error) {
      console.error("Gemini APIとの連携でエラーが発生しました:", error);
      message.reply(
        "ごめんね！今ちょっと調子が悪いんだ。もう一回試してみて！\nミュート中はメンションでのみ応答するよ！"
      );
    }
    return;
  }

  // isMutedがtrueなら、相槌やリアクションは行わない
  if (isMuted) return;

  // ★★★ ここからが新しいロジック ★★★
  try {
    // 50%の確率で絵文字リアクション、50%の確率で相槌メッセージ
    if (Math.random() < 0.5) {
      // ★★★ 絵文字リアクション ★★★
      const reactionEmojis = [
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
      const shuffledEmojis = reactionEmojis.sort(() => 0.5 - Math.random());
      const reactionsToAdd = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < reactionsToAdd && i < shuffledEmojis.length; i++) {
        await message.react(shuffledEmojis[i]);
      }
    } else {
      // ★★★ Geminiを使った相槌 ★★★
      await message.channel.sendTyping();
      const prompt = `
        あなたは、ハンズオンの熱血指導者「ビリー隊長」だよ！
        参加者の会話を温かく、そして元気に見守っているよ！
        以下のメッセージに、短く、明るく、元気な相槌を打ってね！「いいぞ！」「その調子！」だよ！
        【一番大事なこと】3行以内で、短く元気に！

        メッセージ：
        "${message.content}"
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      await message.channel.send(text);
    }
  } catch (error) {
    console.error("ランダムリアクションまたは相槌の送信に失敗しました:", error);
  }
});

// --- ★★★ ここからWebサーバーのコードを追加 ★★★ ---
// Cloud Runが要求するヘルスチェックに応答するためのWebサーバー
const app = express();
const port = process.env.PORT || 8080; // Cloud Runから提供されるポート、またはデフォルト8080

app.get("/", (req, res) => {
  // ヘルスチェック用のエンドポイント: Cloud RunなどがこのURLにアクセスして、ボットが正常に起動しているかを確認します。
  res.send("Discord bot is running and healthy!");
});

app.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});
// --- Webサーバーのコードここまで ---

// Discordにログイン
client.login(process.env.DISCORD_BOT_TOKEN);
