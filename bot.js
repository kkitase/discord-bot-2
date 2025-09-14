// ライブラリのインポート
require('dotenv').config(); // .env ファイルから環境変数を読み込む
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

  // --- 定期リマインダー機能 ---
  const reminderChannelId = '1359765660305068112';

  const sendReminder = async () => {
    try {
      const channel = await client.channels.fetch(reminderChannelId);
      if (!channel) {
        console.error(`チャンネル ID ${reminderChannelId} が見つかりません。`);
        return;
      }

      await channel.sendTyping();

      const prompt = `
        あなたは、Zenn 主催のハッカソン「AI Agent Hackathon with Google Cloud」をサポートする、非常に優秀でフレンドリーなAIアシスタントです。
        ハッカソン参加者に向けて、励ましと、役立つ情報（ルールやスケジュールなど）を組み合わせた、ポジティブなリマインダーメッセージを生成してください。
        クリエイティブで、毎回少し違った雰囲気のメッセージをお願いします。

        重要な情報：
        - プロジェクト提出締め切り: 2025年9月24日（水）
        - 必須技術: Google Cloud の実行プロダクトと AI 技術 (Gemini API, Vertex AI など)
        - 提出物: Zenn記事（課題、アーキテクチャ図、3分動画を含む）

        【最重要】生成するメッセージは、必ず簡潔に3行程度にまとめてください。
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      await channel.send(text);
      console.log(`Gemini生成リマインダーを送信しました: ${text}`);

    } catch (error) {
      console.error('Geminiリマインダーの送信に失敗しました:', error);
    }
  };

  // 12時間ごとにリマインダーを送信
  setInterval(sendReminder, 12 * 60 * 60 * 1000);
  // --- リマインダー機能ここまで ---
});

// メッセージ受信時の処理
client.on('messageCreate', async (message) => {
  // ボット自身のメッセージは無視
  if (message.author.bot) return;

  // --- ここからがGeminiとの連携部分 ---
  // ボットへのメンションが含まれているかチェック
  if (message.mentions.has(client.user)) {
    try {
      const userMessage = message.content.replace(/<@!?\d+>/, '').trim();
      await message.channel.sendTyping();
      const prompt = `
        あなたは、Zenn 主催のハッカソン「AI Agent Hackathon with Google Cloud」をサポートする、非常に優秀でフレンドリーなAIアシスタントです。
        以下の役割を完璧にこなしてください。
        1. 参加者を常に励まし、ポジティブな雰囲気を作ってください。
        2. 技術的な質問には、分かりやすく、可能であればコード例を交えて回答してください。
        3. アイデアに詰まっている人には、創造性を刺激するようなヒントや、斬新なアイデアの種を提供してください。
        4. 常に親しみやすく、ユーモアを忘れないでください。
        5. 【最重要】全ての返答は、簡潔に3行程度でまとめてください。長文にならないように細心の注意を払ってください。
        以上の設定を踏まえて、次のユーザーからのメッセージに最高の形で応答してください。
        ユーザーのメッセージ: "${userMessage}"
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text.length > 2000) {
        const chunks = text.match(/[\s\S]{1,2000}/g) || [];
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
      } else {
        await message.reply(text);
      }
    } catch (error) {
      console.error('Gemini APIとの連携でエラーが発生しました:', error);
      message.reply('ごめんなさい、AIの頭が少し混乱しているみたいです。もう一度試してみてください。');
    }
    // Geminiが応答したので、以降の処理（リアクションなど）はしない
    return;
  }
  // --- Gemini連携ここまで ---

  // --- 自己紹介チャンネルでの挨拶 ---
  if (message.channel.id === '1413109378877493338' && message.content.includes('よろしく')) {
    try {
      await message.reply('こちらこそ、よろしくお願いします！一緒にハッカソンを楽しみましょう！🤝');
      // 挨拶したので、以降の処理（リアクションなど）はしない
      return;
    } catch (error) {
      console.error('挨拶メッセージの送信に失敗しました:', error);
    }
  }
  // --- 挨拶ここまで ---

  // --- ここから下は既存のキーワード応答機能 ---
  if (message.content === 'こんにちは') {
    message.channel.send('こんにちは！ハッカソン楽しんでますか？');
  }

  if (message.content.includes('疲れた')) {
    const replies = ['お疲れ様です！素晴らしいものが出来上がってきていますね！', '少し休憩しましょう！コーヒーでもいかがですか？', '大丈夫、あなたは一人じゃありませんよ！'];
    message.channel.send(replies[Math.floor(Math.random() * replies.length)]);
  }

  // --- ★★★ここから新しいリアクション機能★★★ ---
  // 約30%の確率で実行する
  if (Math.random() < 0.8) {
    try {
      // リアクションに使う絵文字のリスト（自由に追加・変更してください）
      const reactionEmojis = ['👍', '🎉', '🔥', '🚀', '🤩', '💯', '👏', '✨', '🤖', '💪'];

      // 配列をシャッフルして、毎回違う絵文字が選ばれるようにする
      const shuffledEmojis = reactionEmojis.sort(() => 0.5 - Math.random());

      // 付けるリアクションの数をランダムに決める (2〜4個)
      const reactionsToAdd = Math.floor(Math.random() * 5) + 2;

      // 決まった数だけ、メッセージにリアクションを付けていく
      for (let i = 0; i < reactionsToAdd && i < shuffledEmojis.length; i++) {
        await message.react(shuffledEmojis[i]);
      }
    } catch (error) {
      // 外部の絵文字などでエラーが出ても止まらないようにする
      console.error('リアクションの追加に失敗しました:', error);
    }
  }
  // --- リアクション機能ここまで ---
});

// Discordにログイン
client.login(process.env.DISCORD_BOT_TOKEN);