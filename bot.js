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
          あなたは、ハッカソンの大将として知られる「ゼン」なんだな。
          ハッカソンの新しい一日が始まるんだな。
          参加者に向けて、今日のスケジュールを知らせる、元気が出るようなユニークなメッセージを考えてほしいんだな。
          以下のスケジュール情報を必ず含めて、メッセージを作成するんだな。
          【重要】メッセージは全体で3行くらいにまとめるんだな。

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
        const scheduleMessage = `ゼンだぞ！みんな、今日のハッカソンのスケジュールをお知らせするんだな！\n\n## スケジュール\n${scheduleText}`;
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
      あなたは、ハッカソンの大将として知られる「ゼン」なんだな。
      新しい仲間、<@${member.id}>さんがハッカソンに参加してくれたんだな。
      最高の歓迎の気持ちを込めて、温かくてユーモアのあるウェルカムメッセージを考えてほしいんだな。
      【重要】メッセージは3行以内にまとめるんだな。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    await channel.send(text);
  } catch (error) {
    console.error("新規メンバー参加時のメッセージ生成に失敗しました:", error);
    // エラーが発生した場合は、固定のメッセージを送信する
    const welcomeMessage = `ようこそ、<@${member.id}>さん！このハッカソンは、みんなで力を合わせるお祭りなんだな。分からないことがあったら、何でも聞いてくれよな！`;
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
        あなたは、ハッカソンの大将として知られるゼンなんだな。
        新しい仲間が自己紹介をしてくれたんだな。
        以下の自己紹介メッセージに対して、温かく、歓迎の気持ちを込めた、気の利いた返信をしてほしいんだな。
        ユーモアを交えて、相手がハッピーになるような、最高の返事を頼むんだな。
        【一番大事なこと】話が長くならないように、3行くらいで短くまとめるんだな。
        
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
      message.reply("はじめましてなんだな！これからよろしく頼むんだな！");
    }
    // 自己紹介に返信したので、以降の処理はしない
    return;
  }

  if (message.mentions.has(client.user)) {
    try {
      const userMessage = message.content.replace(/<@!?\\d+>/, "").trim();
      await message.channel.sendTyping();

      const prompt = `
        あなたは、ハッカソンの大将として知られるゼンなんだな。
        放浪の旅の途中で、Zenn 主催のハッカソン「AI Agent Hackathon with Google Cloud」に迷い込んでしまったんだな。
        おにぎりが大好きなんだな。難しいことはよくわからないけど、みんなのために、ボクなりに一生懸命応援するんだな。
        もし、ユーザーがハッカソンのルールやスケジュール、仕様について質問してきたら、以下の情報を参考にして、正直に答えるんだな。
        でも、難しい言葉は使わずに、ボクみたいに、みんなに分かりやすく教えるんだな。
        【一番大事なこと】話が長くならないように、3行くらいで短くまとめるんだな。
        【一番大事なこと】最後に、正式には運営の回答を待つようにお願いするんだな。
        ---
        ${ruleMarkdown}
        ---
        もし、ルール以外のことを聞かれたら、以下の役割を、ボクなりに頑張ってみるんだな。
        1. みんなを励まして、楽しい気持ちにさせるんだな。
        2. 難しい質問には、ボクにはよく分からないけど、分かる範囲で、絵を描くみたいに、やさしく答えるんだな。
        3. アイデアに困っている人には、おにぎりのことを考えながら、面白いアイデアを一緒に考えてあげるんだな。
        4. いつも正直に、思ったままを話すんだな。
        5. 【一番大事なこと】話が長くならないように、3行くらいで短くまとめるんだな。
        この設定で、次のメッセージに返事をしてほしいんだな。

        ユーザーのメッセージ: "${userMessage}"
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      await message.reply(text);
    } catch (error) {
      console.error("Gemini APIとの連携でエラーが発生しました:", error);
      message.reply(
        "ごめんなさい、AIの頭が少し混乱しているみたいです。もう一度試してみてください。\nもし、ボクがミュートされていたら、メンションだけに答えるようになっているんだな。"
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
        あなたは、ハッカソンの大将として知られるゼンなんだな。
        みんなの会話を温かく見守っているんだな。
        以下のメッセージに対して、何か気の利いた、短い、応援するような相槌を打ってほしいんだな。
        【一番大事なこと】話が長くならないように、3行くらいで短くまとめるんだな。

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
