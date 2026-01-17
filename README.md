# ビリー隊長: ハンズオンサポート Discord Bot

> 「一緒に頑張ろう！💪」 --- ハンズオンを熱血指導で支える、AIアシスタント。

## 概要

**ビリー隊長**は、ハンズオンセミナーの参加者をサポートするために設計された Discord ボットです。Google Cloud の Gemini API を活用し、手元の資料（PDF、Markdown）に基づいた正確で熱血なアドバイスを提供します。

---

## � システムアーキテクチャ

本ボットは Google Cloud Run 上で動作し、コンテナ起動時にローカル資料をインデックス化します。ユーザーからのインタラクションに対し、Gemini 3 Pro が適切な文脈を判断して応答します。

```mermaid
graph TB
    subgraph Users ["Client Side"]
        U["参加者 (User)"]
    end

    subgraph Discord_Gateway ["Discord API"]
        Events["Interaction / Message Events"]
    end

    subgraph Bot_Instance ["Cloud Run (Node.js Container)"]
        direction TB
        
        subgraph Core ["Service Logic"]
            Entry["index.js / bot.js"]
            H_Event["Event Handlers"]
            C_Loader["Command Loader"]
        end

        subgraph Brain ["Gemini AI Integration"]
            S_Gemini["Gemini Service"]
            S_KB["KnowledgeBase Service"]
            P_Billy["Billy Persona Prompt"]
        end

        subgraph Local_Storage ["Container FS"]
            F_Docs["labs/*.md, *.pdf"]
            F_Rule["rule.md"]
        end
    end

        direction LR
        G_AI["Google Gemini API"]
        G_SM["Secret Manager"]
    end

    %% --- Sequence Flow ---

    %% 1. Startup
    Entry -- "1. Load Secrets" --> G_SM
    Entry -- "2. Scan & Parse" --> F_Docs
    Entry -- "3. Register" --> Discord_Gateway

    %% 2. Interaction
    U -- "4. Mention / Command" --> Events
    Events -- "5. Trigger" --> H_Event

    %% 3. AI Process (RAG)
    H_Event -- "6. Query Context" --> S_KB
    S_KB -- "7. Fetch Relevant Info" --> F_Docs
    S_KB -- "7. Fetch Relevant Info" --> F_Rule
    
    H_Event -- "8. Compose Prompt" --> P_Billy
    H_Event -- "9. Request (Persona + Context + Message)" --> S_Gemini
    S_Gemini -- "10. Generation" --> G_AI
    
    %% 4. Response
    G_AI -- "11. Result" --> S_Gemini
    S_Gemini -- "12. Final Answer" --> H_Event
    H_Event -- "13. Reply (Thread)" --> Events
    Events -- "14. Notification" --> U

    %% --- Styling ---
    style U fill:#ff9,stroke:#333,stroke-width:2px
    style G_AI fill:#4285F4,stroke:#fff,stroke-width:2px,color:#fff
    style G_SM fill:#34A853,stroke:#fff,stroke-width:2px,color:#fff
    style Bot_Instance fill:#f9f9f9,stroke:#666,stroke-width:2px
    style Brain fill:#e1f5fe,stroke:#01579b
    style Core fill:#fff9c4,stroke:#fbc02d
```

---

## �🌸 主な機能

### 1. 熱血メンション応答
`@ビリー隊長` で呼びかけると、Gemini がスレッドを立てて回答します。既存の資料（`labs/` フォルダ）を熟知しているため、具体的な手順まで教えてくれます。

### 2. インコンテキスト・ナレッジ
`labs/` フォルダに資料を置くだけで、ボットがそれを学習します。
- **対応形式**: Markdown (`.md`), Plain Text (`.txt`), PDF (`.pdf`)
- **動的パース**: PDF 内容も自動でテキスト化して参照します。

### 3. 個別歓迎・自己紹介応答
新しいメンバーが参加したときや、自己紹介チャンネルに投稿があったとき、一人ひとりに熱いメッセージを届けます。

### 4. 詳細な機能制御 (`/config`)
ボットの振る舞いを細かくカスタマイズできます。
- `/config` コマンドで「メンション応答」「ウェルカムメッセージ」「自己紹介返信」「相槌・リアクション」を個別に ON/OFF 可能。

---

## 🛠 スラッシュコマンド

ボットの機能を直感的に操作できるスラッシュコマンドを提供しています。

| コマンド | 説明 |
|----------|------|
| `"/config:mention stauts:on/off"` | メンション時のみ反応するモードの切り替え |
| `"/config:welcome stauts:on/off"` | 新規入隊者へのウェルカムメッセージ |
| `"/config:intro stauts:on/off"` | 自己紹介チャンネルへの熱血レスポンス |
| `"/config:reaction stauts:on/off"` | 普段の会話へのランダムな相槌・リアクション |
| `"/config"` | 現在の設定を一覧表示 |

### `/config` オプション詳細

設定を変更する際は、以下の組み合わせで実行してください。

| `feature` (機能名) | `stauts` (状態) | 内容 |
|-------------------|----------------|------|
| `mention` | `on` / `off` | メンション応答設定 |
| `welcome` | `on` / `off` | ウェルカムメッセージ設定 |
| `intro` | `on` / `off` | 自己紹介返信設定 |
| `reaction` | `on` / `off` | 相槌・リアクション設定 |

**実行例:**
- `/config` (現在の設定を一覧表示)
- `/config feature:mentions status:off` (メンション応答を一時停止)


---

## 🚀 セットアップ

### 必要条件
- Node.js v18.0 以上
- Google Cloud Gemini API キー
- Discord Bot トークン & クライアント ID

### ローカル開発
1. 依存関係のインストール
   ```bash
   npm install
   ```
2. 環境変数の設定
   `.env.example` を `.env` にコピーし、必要事項を記入します。
3. スラッシュコマンドの登録
   ```bash
   npm run deploy
   ```
4. ボットの起動
   ```bash
   npm start
   ```

### ☁️ Cloud Run へのデプロイ
```bash
gcloud run deploy discord-bot-2 --source . --region asia-northeast1
```

---

## 📂 構成とナレッジベース

### ナレッジベースの更新
`src/labs/` ディレクトリにセミナー資料を追加するだけで、ボットの知識をアップデートできます。
---

## 📄 ライセンス
ISC License

---

*Presented by Sunwood AI Labs*
