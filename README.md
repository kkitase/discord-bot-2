![billy_captain_miyabi_header](header.png)

# ビリー隊長: 雅なるハンズオンサポート Discord Bot

> 「共に高みを目指そうぞ！🌸」 --- 重力から解放された熱き指導。

## 🌙 概要

**ビリー隊長**は、ハンズオンセミナーの参加者を雅に、かつ熱くサポートするために生まれた AI アシスタントです。Google Cloud の最新鋭モデル **Gemini 3 Flash Preview** と **Context Caching** 技術を駆使し、膨大な資料から瞬時に正解を導き出します。

---

## 🏛️ システムアーキテクチャ

Google Cloud Run 上で動作し、**Context Caching** を活用してナレッジベースを効率的に管理します。質問のたびに資料を読み直す必要がなく、極めて高速な応答を実現しています。

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
        end

        subgraph Brain ["Gemini AI Integration"]
            S_Gemini["Gemini Service"]
            S_KB["KnowledgeBase Service"]
            P_Billy["Billy Persona Prompt"]
        end

        subgraph Context_Layer ["Context Caching"]
            Cache["GoogleAICacheManager"]
            Cached_Data["Cached Knowledge & Persona"]
        end

        subgraph Local_Storage ["Container FS"]
            F_Docs["labs/*.md, *.pdf"]
            F_Rule["overview.md"]
        end
    end

    subgraph Google_Cloud ["Google Cloud API"]
        direction LR
        G_AI["Gemini 3 Flash Preview"]
        G_SM["Secret Manager"]
    end

    %% --- Sequence Flow ---

    %% 1. Startup & Caching
    Entry -- "1. Load Secrets" --> G_SM
    Entry -- "2. Scan & Parse" --> F_Docs
    Entry -- "3. Register Cache" --> S_Gemini
    S_Gemini -- "4. Create Context Cache" --> G_AI
    G_AI -- "5. Cache Name" --> S_Gemini

    %% 2. Interaction
    U -- "6. Mention / Command" --> Events
    Events -- "7. Trigger" --> H_Event

    %% 3. AI Process (Cached)
    H_Event -- "8. Request (Query + CacheName)" --> S_Gemini
    S_Gemini -- "9. Fast Generation" --> G_AI
    
    %% 4. Response
    G_AI -- "10. Result" --> S_Gemini
    S_Gemini -- "11. Final Answer" --> H_Event
    H_Event -- "12. Reply (Thread)" --> Events
    Events -- "13. Notification" --> U

    %% --- Styling ---
    style U fill:#fff9c4,stroke:#333
    style G_AI fill:#4285F4,stroke:#fff,color:#fff
    style Context_Layer fill:#e1f5fe,stroke:#01579b
    style Bot_Instance fill:#f9f9f9,stroke:#666
```

---

## 💠 主な特長

### 1. 瞬速の Context Caching
Gemini 1.5/3 の **Context Caching** を導入。32kトークンを超える大規模なハンズオン資料も、一度キャッシュすれば次回以降は爆速で回答します。

### 2. 雅なる「ビリースタイル」
「熱血」と「和」が融合した独自のペルソナ。参加者を励まし、共に歩む姿勢を崩しません。

### 3. マルチモーダル・ナレッジ
`labs/` 内の Markdown, Text はもちろん、**PDF** も自動でパースして知識として取り込みます。

---

## 🛠️ スラッシュコマンド

| コマンド | 内容 |
|----------|------|
| `"/config"` | 動作モードを雅に調整（メンション、ウェルカム、相槌など） |
| `"/status"` | キャッシュ状態やナレッジベースの統計を表示 |

---

## 🚀 はじめかた

### 1. 水（依存関係）を引く
```bash
npm install
```

### 2. 言の葉（環境変数）を綴る
`.env` に `GEMINI_API_KEY`, `DISCORD_BOT_TOKEN`, `GEMINI_MODEL=gemini-3-flash-preview` を設定。

### 3. 開陣（起動）
```bash
npm run deploy  # コマンド登録
npm start       # 出陣！
```

---

*Presented with Miyabi Passion by Sunwood AI Labs*
