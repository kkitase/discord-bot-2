# AI Agent Hackathon Discord Bot

Zenn 主催の「AI Agent Hackathon with Google Cloud」をサポートするために作られた、熱血指導者「ビリー隊長」こと Discord ボットです。
Google の Gemini API と連携し、参加者との対話を盛り上げます。

この README では、ローカルでの開発方法と、本番環境である Google Cloud へのデプロイ方法を説明します。

## ✨ 主な機能

- **Gemini との対話:** ボットにメンションすると、Gemini がハンズオンの熱血指導者「ビリー隊長」として応答します。ルールやスケジュールに関する質問にも答えます。
- **自動リアクションと相槌:** サーバー内の投稿にランダムで絵文字でリアクションしたり、Gemini を使って短い応援メッセージ（相槌）を送ったりして、場を盛り上げます。
- **スケジュールリマインダー:** 今日のスケジュールを自動でチャンネルにお知らせします。
- **スラッシュコマンド:** ボットの動作をコマンドで制御できます。

## 🤖 スラッシュコマンド

- `/mute status:<On|Off>`: ボットの自動応答（相槌やリアクション）をオン/オフします。メンションへの返信、ウェルカムメッセージ、自己紹介への返信はミュート中も機能します。
- `/reminders status:<On|Off>`: スケジュールリマインダー機能のオン/オフを切り替えます。
- `/help`: ボットの使い方と利用可能なコマンドを表示します。

## 🛠️ 必要なもの

### ローカルでの開発
- [Node.js](https://nodejs.org/) (v18.0 以上)

### Google Cloud へのデプロイ
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install)
- Google Cloud プロジェクト
- GitHub リポジトリ

### 共通で必要なキー
- Discord Bot Token
- Discord Application (Client) ID
- Google Gemini API Key
- **チャンネルID:**
    - リマインダー用チャンネルID
    - ウェルカムメッセージ用チャンネルID
    - 自己紹介用チャンネルID

## 🚀 セットアップ手順

### Step 1: Discord Bot の準備

まず、Discord 上でボットを作成し、必要なキーと権限を設定します。

1.  **Discord Developer Portal にアクセスし、アプリケーションを新規作成します。**
2.  左側のメニューから「**Bot**」タブを選択し、「**Add Bot**」をクリックしてボットを作成します。
3.  「**Reset Token**」ボタンをクリックし、表示された**トークンをコピー**します。これが `DISCORD_BOT_TOKEN` になります。
    - **注意:** このトークンは絶対に他人に教えたり、公開したりしないでください。
4.  Bot ページを下にスクロールし、「**Privileged Gateway Intents**」セクションにある「**MESSAGE CONTENT INTENT**」を有効にします。
5.  左側のメニュー「**General Information**」ページで、「**APPLICATION ID**」をコピーします。これが `DISCORD_CLIENT_ID` になります。
6.  左側のメニュー「**OAuth2**」→「**URL Generator**」で、以下の2つの SCOPE を選択します。
    - `bot`
    - `applications.commands`
7.  表示された「**BOT PERMISSIONS**」で、`Send Messages`, `Read Message History`, `Add Reactions` を選択し、生成された URL でボットをサーバーに招待します。

---


### Step 2: ローカルでの実行

ボットの動作をローカル PC で確認する手順です。

1.  **リポジトリをクローンします:**
    ```bash
    git clone https://github.com/kkitase/discord-bot-2.git
    cd discord-bot-2
    ```

2.  **必要なパッケージをインストールします:**
    ```bash
    npm install
    ```

3.  **環境変数を設定します:**
    プロジェクトのルートに `.env` ファイルを作成し、以下を記述します。
    ```env
    DISCORD_BOT_TOKEN=ここにDiscordボットのトークンを入力
    DISCORD_CLIENT_ID=ここにアプリケーションIDを入力
    GEMINI_API_KEY=ここにGemini APIキーを入力
    GEMINI_MODEL=gemini-2.5-pro (使用するGeminiモデル名。デフォルトは gemini-2.5-pro)
    DISCORD_REMINDER_CHANNEL_ID=ここにリマインダー用チャンネルIDを入力
    DISCORD_WELCOME_CHANNEL_ID=ここにウェルカムメッセージ用チャンネルIDを入力
    DISCORD_INTRO_CHANNEL_ID=ここに自己紹介用チャンネルIDを入力
    PORT=8080 (Cloud Run用のポート。ローカルでは省略可)
    ```
    ※ チャンネルIDは、Discordの設定で「開発者モード」をONにし、チャンネル名を右クリックして「IDをコピー」で取得できます。

4.  **スラッシュコマンドを登録します:**
    以下のコマンドを実行して、`/mute` や `/reminders` などのコマンドを Discord サーバーに登録します。
    ```bash
    npm run deploy
    ```

5.  **ボットを起動します:**
    ```bash
    npm start
    ```
    コンソールに「ログインしました！」と表示されれば成功です。

---


### Step 3: Google Cloud Run へのデプロイ

ボットを 24 時間安定して稼働させるための手順です。

1.  **Google Cloud プロジェクトの準備:**
    `gcloud` CLI でご自身のプロジェクトにログインしておきます。
    デプロイには、以下の API を有効にする必要があります。
    - Cloud Run API (`run.googleapis.com`)
    - Cloud Build API (`cloudbuild.googleapis.com`)
    - Secret Manager API (`secretmanager.googleapis.com`)
    - Artifact Registry API (`artifactregistry.googleapis.com`)

    次のコマンドを実行すると、これらの API がまとめて有効になります。
    ```bash
    gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com
    ```

2.  **シークレットの保管:**
    `.env` ファイルの情報を、安全な Secret Manager に保管します。
    
    **方法1: .env ファイルから一括設定（推奨）**
    ```bash
    # プロジェクトのディレクトリに移動
    cd /path/to/discord-bot-2
    
    # .env ファイルから環境変数を読み込む
    source .env
    
    # シークレットを作成（初回のみ）
    gcloud secrets create discord-bot-2-token --replication-policy="automatic"
    gcloud secrets create discord-bot-2-client-id --replication-policy="automatic"
    gcloud secrets create gemini-api-key-2 --replication-policy="automatic"
    gcloud secrets create discord-bot-2-reminder-channel-id --replication-policy="automatic"
    gcloud secrets create discord-bot-2-welcome-channel-id --replication-policy="automatic"
    gcloud secrets create discord-bot-2-intro-channel-id --replication-policy="automatic"
    gcloud secrets create gemini-model-2 --replication-policy="automatic"
    
    # .env から読み込んだ値をシークレットに設定
    printf "$DISCORD_BOT_TOKEN" | gcloud secrets versions add discord-bot-2-token --data-file=-
    printf "$DISCORD_CLIENT_ID" | gcloud secrets versions add discord-bot-2-client-id --data-file=-
    printf "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key-2 --data-file=-
    printf "$DISCORD_REMINDER_CHANNEL_ID" | gcloud secrets versions add discord-bot-2-reminder-channel-id --data-file=-
    printf "$DISCORD_WELCOME_CHANNEL_ID" | gcloud secrets versions add discord-bot-2-welcome-channel-id --data-file=-
    printf "$DISCORD_INTRO_CHANNEL_ID" | gcloud secrets versions add discord-bot-2-intro-channel-id --data-file=-
    printf "${GEMINI_MODEL:-gemini-2.5-pro}" | gcloud secrets versions add gemini-model-2 --data-file=-
    ```
    
    **方法2: 手動で1つずつ設定**
    ```bash
    # シークレットを作成（初回のみ）
    gcloud secrets create discord-bot-2-token --replication-policy="automatic"
    gcloud secrets create discord-bot-2-client-id --replication-policy="automatic"
    gcloud secrets create gemini-api-key-2 --replication-policy="automatic"
    
    # 各シークレットに値を設定（YOUR_XXX_HERE を実際の値に置き換えてください）
    printf "YOUR_DISCORD_TOKEN_HERE" | gcloud secrets versions add discord-bot-2-token --data-file=-
    printf "YOUR_DISCORD_CLIENT_ID_HERE" | gcloud secrets versions add discord-bot-2-client-id --data-file=-
    printf "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add gemini-api-key-2 --data-file=-
    
    # チャンネルID（オプション）
    gcloud secrets create discord-bot-2-reminder-channel-id --replication-policy="automatic"
    gcloud secrets create discord-bot-2-welcome-channel-id --replication-policy="automatic"
    gcloud secrets create discord-bot-2-intro-channel-id --replication-policy="automatic"
    gcloud secrets create gemini-model-2 --replication-policy="automatic"
    
    printf "YOUR_REMINDER_CHANNEL_ID" | gcloud secrets versions add discord-bot-2-reminder-channel-id --data-file=-
    printf "YOUR_WELCOME_CHANNEL_ID" | gcloud secrets versions add discord-bot-2-welcome-channel-id --data-file=-
    printf "YOUR_INTRO_CHANNEL_ID" | gcloud secrets versions add discord-bot-2-intro-channel-id --data-file=-
    printf "gemini-2.5-pro" | gcloud secrets versions add gemini-model-2 --data-file=-
    ```

3.  **Cloud Run へのデプロイ:**
    プロジェクトのルートで以下のコマンドを実行します。
    ```bash
    gcloud run deploy discord-bot-2 \
      --source . \
      --region asia-northeast1 \
      --no-allow-unauthenticated \
      --min-instances=1 \
      --update-secrets=DISCORD_BOT_TOKEN=discord-bot-2-token:latest \
      --update-secrets=DISCORD_CLIENT_ID=discord-bot-2-client-id:latest \
      --update-secrets=GEMINI_API_KEY=gemini-api-key-2:latest \
      --update-secrets=DISCORD_REMINDER_CHANNEL_ID=discord-bot-2-reminder-channel-id:latest \
      --update-secrets=DISCORD_WELCOME_CHANNEL_ID=discord-bot-2-welcome-channel-id:latest \
      --update-secrets=DISCORD_INTRO_CHANNEL_ID=discord-bot-2-intro-channel-id:latest \
      --update-secrets=GEMINI_MODEL=gemini-model-2:latest
    ```

---


### Step 4: 自動デプロイの設定 (CI/CD)

GitHub の main ブランチにプッシュするだけで、自動的に最新版が Cloud Run にデプロイされるように設定します。

1.  **Cloud Build と GitHub の連携:**
    - Google Cloud コンソールの「Cloud Build」→「トリガー」に移動します。
    - 「リポジトリを接続」を選択し、画面の指示に従ってこの GitHub リポジトリを接続します。

2.  **Cloud Build への権限付与:**
    Cloud Build がデプロイを実行できるように、ターミナルで以下のコマンドを実行します。 `[PROJECT_NUMBER]` と `[PROJECT_ID]` はご自身のものに置き換えてください。
    ```bash
    # Cloud Run へのデプロイ権限を付与
    gcloud projects add-iam-policy-binding [PROJECT_ID] \
        --member="serviceAccount:[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com" \
        --role="roles/run.admin"

    # サービスアカウントの利用権限を付与
    gcloud projects add-iam-policy-binding [PROJECT_ID] \
        --member="serviceAccount:[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com" \
        --role="roles/iam.serviceAccountUser"

    # Secret Manager へのアクセス権限を付与
    gcloud projects add-iam-policy-binding [PROJECT_ID] \
        --member="serviceAccount:[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
    ```

3.  **トリガーの作成:**
    - Cloud Build の「トリガー」画面で「トリガーを作成」をクリックします。
    - **イベント:** 「ブランチにプッシュ」
    - **リポジトリ:** 接続したリポジトリ
    - **ブランチ:** `^main$`
    - **構成:** 「Cloud Build 構成ファイル (YAML または JSON)」
    - **サービス アカウント:** `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com` を選択します。
    - トリガーを保存します。

これで、`main` ブランチにプッシュするたびに、`cloudbuild.yaml` の内容に従って自動でビルドとデプロイが実行されます。