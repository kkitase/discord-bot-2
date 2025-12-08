# Project Overview

This project is a Discord bot named "Zen" created for the "AI Agent Hackathon with Google Cloud". It uses the Gemini API to interact with users, answer questions about the hackathon, and generally create a friendly and engaging atmosphere in the Discord server. The bot is built with Node.js and the `discord.js` library.

## Key Features

- **Gemini Integration:** The bot uses the Gemini API to generate responses to user messages, especially when mentioned. It adopts the persona of "Zen," the hackathon's leader.
- **Rule-Based Responses:** The bot can answer questions about the hackathon's rules and schedule by referring to the `rule.md` file.
- **Automated Engagement:** The bot automatically welcomes new members, reacts to messages with emojis, and sends encouraging "aizuchi" (short, supportive interjections).
- **Cloud Native:** The project is designed to be deployed on Google Cloud Run, with a `Dockerfile` for containerization and a `cloudbuild.yaml` for CI/CD.

# Building and Running

## Local Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env` file in the project root and add the following, replacing the placeholder values with your actual keys:
    ```env
    DISCORD_BOT_TOKEN=your_discord_bot_token
    GEMINI_API_KEY=your_gemini_api_key
    ```

3.  **Run the Bot:**
    ```bash
    npm start
    ```
    or
    ```bash
    node bot.js
    ```

## Deployment to Google Cloud Run

The project is configured for continuous deployment to Google Cloud Run using Cloud Build. The deployment process is defined in `cloudbuild.yaml`. When changes are pushed to the `main` branch of the GitHub repository, a new version of the bot will be automatically built and deployed.

For manual deployment, you can use the following `gcloud` command:

```bash
gcloud run deploy discord-bot-2 \
  --source . \
  --region asia-northeast1 \
  --no-allow-unauthenticated \
  --min-instances=1 \
  --update-secrets=DISCORD_BOT_TOKEN=discord-bot-token:latest \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest
```

# Development Conventions

- **Code Style:** The code follows standard JavaScript conventions.
- **Dependencies:** All dependencies are listed in `package.json`.
- **Configuration:** Application configuration is managed through environment variables, as defined in `.env.example`.
- **CI/CD:** The CI/CD pipeline is defined in `cloudbuild.yaml`.
- **Containerization:** The application is containerized using the provided `Dockerfile`.
