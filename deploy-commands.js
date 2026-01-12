/**
 * スラッシュコマンドの登録スクリプト
 * Discord APIにコマンドを登録します
 */

require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { commandsData } = require("./src/commands");

// コマンドデータをJSON形式に変換
const commands = commandsData.map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN
);

(async () => {
  try {
    console.log("スラッシュコマンドの登録を開始します...");
    console.log(`登録するコマンド: ${commands.map((c) => c.name).join(", ")}`);

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log("スラッシュコマンドの登録が正常に完了しました。");
  } catch (error) {
    console.error("スラッシュコマンドの登録中にエラーが発生しました:", error);
    process.exit(1);
  }
})();
