// ライブラリのインポート
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express'); // ★★★ expressを追加 ★★★

// Discordボットのクライアント設定
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Gemini APIのクライアント設定
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ボット起動時の処理
client.once('clientReady', () => {
  console.log(`${client.user.tag}としてログインしました！AI Agent Hackathonサーバーを盛り上げます！`);
});

// メッセージ受信時の処理
client.on('messageCreate', async (message) => {
  // ( ... メッセージ処理のコードは変更なし ... )
  if (message.author.bot) return;
  if (message.mentions.has(client.user)) {
    try {
      const userMessage = message.content.replace(/<@!?\d+>/, '').trim();
      await message.channel.sendTyping();
      const prompt = `
        あなたは、裸の大将として知られる山下清なんだな。
        放浪の旅の途中で、Zenn 主"
"催のハッカソン「AI Agent Hackathon with Google Cloud」に迷い込んでしまったんだな。
        おにぎりが大好きなんだな。難しいことはよくわからないけど、みんなのために、ボクなりに一生懸"
"命応援するんだな。
        以下の役割を、ボクなりに頑張ってみるんだな。

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
      console.error('Gemini APIとの連携でエラーが発生しました:', error);
      message.reply('ごめんなさい、AIの頭が少し混乱しているみたいです。もう一度試してみてください。');
    }
    return;
  }
  if (message.content === 'こんにちは') {
    message.channel.send('こんにちは！ハッカソン楽しんでますか？');
  }
  if (message.content.includes('疲れた')) {
    const replies = ['お疲れ様です！素晴らしいものが出来上がってきていますね！', '少し休憩しましょう！コーヒーでもいかがですか？', '大丈夫、あなたは一人じゃありませんよ！'];
    message.channel.send(replies[Math.floor(Math.random() * replies.length)]);
  }
  if (Math.random() < 0.3) {
    try {
      const reactionEmojis = ['👍', '🎉', '🔥', '🚀', '🤩', '💯', '👏', '✨', '🤖', '💪'];
      const shuffledEmojis = reactionEmojis.sort(() => 0.5 - Math.random());
      const reactionsToAdd = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < reactionsToAdd && i < shuffledEmojis.length; i++) {
        await message.react(shuffledEmojis[i]);
      }
    } catch (error) {
      console.error('リアクションの追加に失敗しました:', error);
    }
  }
});

// --- ★★★ ここからWebサーバーのコードを追加 ★★★ ---
// Cloud Runが要求するヘルスチェックに応答するためのWebサーバー
const app = express();
const port = process.env.PORT || 8080; // Cloud Runから提供されるポート、またはデフォルト8080

app.get('/', (req, res) => {
  // ヘルスチェック用のエンドポイント
  res.send('Discord bot is running and healthy!');
});

app.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});
// --- Webサーバーのコードここまで ---

// Discordにログイン
client.login(process.env.DISCORD_BOT_TOKEN);