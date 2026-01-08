# Project Overview

This project is a Discord bot named "Billy" (熱血指導者「ビリー隊長」) created for the "AI Agent Hackathon with Google Cloud". It uses the Gemini API to interact with users, answer questions about the hackathon, and generally create a friendly and engaging atmosphere in the Discord server. The bot is built with Node.js and the `discord.js` library.

## Key Features

- **Gemini Integration:** The bot uses the Gemini API to generate responses to user messages, especially when mentioned. It adopts the persona of "Billy," a passionate leader for the hackathon.
- **Rule-Based Responses:** The bot can answer questions about the hackathon's rules and schedule by referring to the `rule.md` file.
- **Automated Engagement:** The bot automatically welcomes new members, reacts to messages with emojis, and sends encouraging "aizuchi" (short, supportive interjections) using Gemini.
- **Cloud Native:** The project is designed to be deployed on Google Cloud Run, with a `Dockerfile` for containerization and a `cloudbuild.yaml` for CI/CD.

# Building and Running

## Local Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env` file in the project root and add the following:
    ```env
    DISCORD_BOT_TOKEN=your_discord_bot_token
    DISCORD_CLIENT_ID=your_discord_client_id
    GEMINI_API_KEY=your_gemini_api_key
    GEMINI_MODEL=gemini-2.5-pro
    DISCORD_REMINDER_CHANNEL_ID=your_reminder_channel_id
    DISCORD_WELCOME_CHANNEL_ID=your_welcome_channel_id
    DISCORD_INTRO_CHANNEL_ID=your_intro_channel_id
    PORT=8080
    ```

3.  **Run the Bot:**
    ```bash
    npm start
    ```

## Deployment to Google Cloud Run

The project is configured for continuous deployment to Google Cloud Run using Cloud Build. When changes are pushed to the `main` branch, a new version will be automatically built and deployed.

For manual deployment, use the following `gcloud` command to ensure all secrets are correctly linked:

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

# Development Conventions

- **Code Style:** The code follows standard JavaScript conventions.
- **Dependencies:** All dependencies (discord.js, @google/generative-ai, express, etc.) are listed in `package.json`.
- **Configuration:** Managed via environment variables and Secret Manager.
- **CI/CD:** Defined in `cloudbuild.yaml`.
- **Containerization:** Handled by `Dockerfile`.
