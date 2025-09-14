# AI Agent Hackathon Discord Bot

Zenn 主催の「AI Agent Hackathon with Google Cloud」をサポートするために作られた、フレンドリーな Discord ボット「ゼン」です。
Google の Gemini API と連携し、参加者との対話を盛り上げます。

この README では、ローカルでの開発方法と、本番環境である Google Cloud へのデプロイ方法を説明します。

## ✨ 主な機能

- **Gemini との対話:** ボットにメンションすると、Gemini がハッカソンの大将「ゼン」として応答します。ルールやスケジュールに関する質問にも答えます。
- **キーワード応答:** 「こんにちは」や「疲れた」などのキーワードに反応します。
- **自動リアクションと相槌:** サーバー内の投稿にランダムで絵文字でリアクションしたり、Gemini を使って短い応援メッセージを送ったりして、場を盛り上げます。

## 🛠️ 必要なもの

### ローカルでの開発
- [Node.js](https://nodejs.org/) (v18.0 以上)

### Google Cloud へのデプロイ
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install)
- Google Cloud プロジェクト
- GitHub リポジトリ

### 共通で必要なキー
- [Discord Bot Token](https://discord.com/developers/docs/topics/oauth2#bots)
- [Google Gemini API Key](https://ai.google.dev/gemini-api/docs/api-key)

## 🚀 セットアップ手順

### Step 1: Discord Bot の準備

まず、Discord 上でボットを作成し、必要なキーと権限を設定します。

1.  **Discord Developer Portal にアクセスし、アプリケーションを新規作成します。**
2.  左側のメニューから「**Bot**」タブを選択し、「**Add Bot**」をクリックしてボットを作成します。
3.  「**Reset Token**」ボタンをクリックし、表示された**トークンをコピー**します。これが `DISCORD_BOT_TOKEN` になります。
    - **注意:** このトークンは絶対に他人に教えたり、公開したりしないでください。
4.  Bot ページを下にスクロールし、「**Privileged Gateway Intents**」セクションにある「**MESSAGE CONTENT INTENT**」を有効にします。
5.  左側のメニュー「**OAuth2**」→「**URL Generator**」で、「SCOPES」は `bot`、「BOT PERMISSIONS」は `Send Messages`, `Read Message History`, `Add Reactions` を選択し、生成された URL でボットをサーバーに招待します。

---


### Step 2: ローカルでの実行

ボットの動作をローカル PC で確認する手順です。

1.  **リポジトリをクローンします:**
    ```bash
    git clone https://github.com/kkitase/discord-bot.git
    cd discord-bot
    ```

2.  **必要なパッケージをインストールします:**
    ```bash
    npm install
    ```

3.  **環境変数を設定します:**
    プロジェクトのルートに `.env` ファイルを作成し、以下を記述します。
    ```env
    DISCORD_BOT_TOKEN=ここにDiscordボットのトークンを入力
    GEMINI_API_KEY=ここにGemini APIキーを入力
    ```

4.  **ボットを起動します:**
    ```bash
    node bot.js
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
    ```bash
    # Discord トークン用のシークレットを作成
    gcloud secrets create discord-bot-token --replication-policy="automatic"
    # Gemini API キー用のシークレットを作成
    gcloud secrets create gemini-api-key --replication-policy="automatic"
    ```
    次に、それぞれのシークレットに値を設定します。（`printf` コマンドを使うと安全です）
    ```bash
    # YOUR_DISCORD_TOKEN_HERE を実際のトークンに置き換えてください
    printf "YOUR_DISCORD_TOKEN_HERE" | gcloud secrets versions add discord-bot-token --data-file=-

    # YOUR_GEMINI_API_KEY_HERE を実際のキーに置き換えてください
    printf "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add gemini-api-key --data-file=-
    ```

3.  **Cloud Run へのデプロイ:**
    プロジェクトのルートで以下のコマンドを実行します。
    ```bash
    gcloud run deploy discord-bot \
      --source . \
      --region asia-northeast1 \
      --no-allow-unauthenticated \
      --min-instances=1 \
      --update-secrets=DISCORD_BOT_TOKEN=discord-bot-token:latest \
      --update-secrets=GEMINI_API_KEY=gemini-api-key:latest
    ```
    デプロイが完了すると、ボットはクラウド上で稼働を開始します。

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
    - **ブランチ:** `^main
    - **構成:** 「Cloud Build 構成ファイル (YAML または JSON)」
    - **サービス アカウント:** `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com` を選択します。（もし表示されない場合は、一度手動ビルドを実行して生成する必要があります）
    - **詳細設定 > ロギング:** 「**Cloud Logging のみ**」を選択します。
    - トリガーを保存します。

これで、`main` ブランチにプッシュするたびに、`cloudbuild.yaml` の内容に従って自動でビルドとデプロイが実行されます。
