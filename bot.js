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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ★★★ rule.mdを起動時に読み込む ★★★
let ruleMarkdown;
try {
  ruleMarkdown = fs.readFileSync("rule.md", "utf8");
} catch (error) {
  console.error("rule.mdの読み込みに失敗しました:", error);
  // ファイルが読めなくてもボットは起動させるが、ルールに関する機能は使えなくなる
  ruleMarkdown = "ルールのファイルが読めなかったんだな。ごめんなさいなんだな。";
}

// ボット起動時の処理
client.once("clientReady", () => {
  console.log(
    `${client.user.tag}としてログインしました！AI Agent Hackathonサーバーを盛り上げます！`,
  );
});

// ★★★ 新規メンバー参加時の処理 ★★★
client.on("guildMemberAdd", (member) => {
  const channelId = "1361945715072438323";
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) {
    console.error(`チャンネル ID ${channelId} が見つかりません。`);
    return;
  }

  const welcomeMessage = `ようこそ、<@${member.id}>さん！このハッカソンは、みんなで力を合わせるお祭りなんだな。分からないことがあったら、何でも聞いてくれよな！`;
  channel.send(welcomeMessage);
});

// メッセージ受信時の処理
client.on("messageCreate", async (message) => {
  // ( ... メッセージ処理のコードは変更なし ... )
  if (message.author.bot && message.author.id !== "1413098291272618045") return;

  // ★★★ 自己紹介への返信 ★★★
  if (message.channel.id === "1413109378877493338") {
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
        "ごめんなさい、AIの頭が少し混乱しているみたいです。もう一度試してみてください。",
      );
    }
    return;
  }

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
        長文じゃなくて、一言二言でいいんだな。

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
