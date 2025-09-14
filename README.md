# AI Agent Hackathon Discord Bot

Zenn 主催の「AI Agent Hackathon with Google Cloud」をサポートするために作られた、フレンドリーな Discord ボットです。
Google の Gemini API と連携し、参加者との対話や、ハッカソン情報の自動リマインドを行います。

## ✨ 主な機能

- **Gemini との対話:** ボットにメンションすると、Gemini が応答します。
- **自動リマインダー:** 12時間ごとに、ハッカソンの締め切りやルールに関するリマインダーを自動投稿します。
- **挨拶機能:** `#自己紹介` チャンネルでの挨拶に自動で応答します。
- **キーワード応答:** 「こんにちは」や「疲れた」などのキーワードに反応します。
- **自動リアクション:** サーバー内の投稿にランダムな絵文字でリアクションし、場を盛り上げます。

## 🛠️ 必要なもの

- [Node.js](https://nodejs.org/) (v16.9.0 以上)
- [Discord Bot Token](https://discord.com/developers/docs/topics/oauth2#bots)
- [Google Gemini API Key](https://ai.google.dev/gemini-api/docs/api-key)

## 🤖 Discord アプリケーションのセットアップ

ボットを動作させるには、Discord 上でアプリケーションを作成し、ボットユーザーを設定する必要があります。

1.  **Discord Developer Portal にアクセスします:**
    - [https://discord.com/developers/applications](https://discord.com/developers/applications) を開き、ログインします。

2.  **新規アプリケーションを作成します:**
    - 右上の「**New Application**」ボタンをクリックします。
    - アプリケーションに好きな名前を付けて、「Create」をクリックします。

3.  **ボットを作成します:**
    - 左のメニューから「**Bot**」タブを選択します。
    - 「**Add Bot**」をクリックし、確認画面で「Yes, do it!」を選択します。

4.  **ボットのトークンを取得します:**
    - 「**Reset Token**」ボタンをクリックし、表示されたトークンをコピーします。
    - これが、`.env` ファイルに設定する `DISCORD_BOT_TOKEN` になります。
    - **注意:** このトークンは絶対に他人に教えたり、公開しないでください。

5.  **Privileged Gateway Intents を有効にします:**
    - Bot ページを下にスクロールし、「**Privileged Gateway Intents**」のセクションを見つけます。
    - 「**MESSAGE CONTENT INTENT**」を有効（トグルをオン）にします。これにより、ボットがメッセージの内容を読み取れるようになります。

6.  **ボットをサーバーに招待します:**
    - 左のメニューから「**OAuth2**」→「**URL Generator**」を選択します。
    - 「SCOPES」で「**bot**」にチェックを入れます。
    - 「BOT PERMISSIONS」で以下の権限にチェックを入れます:
        - `Send Messages`
        - `Read Message History`
        - `Add Reactions`
    - 生成された URL をコピーし、ブラウザで開いてボットを招待したいサーバーを選択します。

## 🚀 インストールと設定

1.  **リポジトリをクローンします:**
    ```bash
    git clone https://github.com/kkitase/discord-bot.git
    cd discord-bot
    ```

2.  **必要なパッケージをインストールします:**
    ```bash
    npm install discord.js @google/generative-ai dotenv
    ```
    *(注: `package.json` に記載されていないパッケージも含まれています。プロジェクトを正しく動作させるために、これらのインストールが必要です。)*

3.  **環境変数を設定します:**
    プロジェクトのルートに `.env` という名前のファイルを作成します。`.env.example` を参考に、以下の内容を記述してください。

    ```
    DISCORD_BOT_TOKEN=ここにDiscordボットのトークンを入力
    GEMINI_API_KEY=ここにGemini APIキーを入力
    ```

## ▶️ 実行方法

以下のコマンドでボットを起動します。

```bash
node bot.js
```

ボットが正常にログインすると、コンソールにメッセージが表示されます。
```
<ボット名>としてログインしました！AI Agent Hackathonサーバーを盛り上げます！
```

