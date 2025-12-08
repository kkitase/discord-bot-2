require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commands = [
  {
    name: "mute",
    description: "ボットの相槌やリアクションをオン/オフします。",
    options: [
      {
        name: "status",
        type: 3, // STRING
        description: "OnまたはOffを選択",
        required: true,
        choices: [
          {
            name: "On",
            value: "on",
          },
          {
            name: "Off",
            value: "off",
          },
        ],
      },
    ],
  },
  {
    name: "reminders",
    description: "スケジュールリマインダーのオン/オフを切り替えます。",
    options: [
      {
        name: "status",
        type: 3, // STRING
        description: "OnまたはOffを選択",
        required: true,
        choices: [
          {
            name: "On",
            value: "on",
          },
          {
            name: "Off",
            value: "off",
          },
        ],
      },
    ],
  },
  {
    name: "help",
    description: "ビリー隊長のヘルプを表示します。",
  },
];

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN
);

(async () => {
  try {
    console.log("スラッシュコマンドの登録を開始します...");

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), // .envにDISCORD_CLIENT_IDを追加してください
      { body: commands }
    );

    console.log("スラッシュコマンドの登録が正常に完了しました。");
  } catch (error) {
    console.error("スラッシュコマンドの登録中にエラーが発生しました:", error);
  }
})();
