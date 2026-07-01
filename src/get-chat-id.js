import { config } from "./config.js";

if (!config.telegramBotToken) {
  console.error("Set TELEGRAM_BOT_TOKEN in .env first.");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${config.telegramBotToken}/getUpdates`;
const res = await fetch(url);
const data = await res.json();

if (!data.ok) {
  console.error("Telegram API error:", data);
  process.exit(1);
}

const chats = data.result
  .map((update) => update.message?.chat)
  .filter(Boolean);

if (chats.length === 0) {
  console.log(
    "No messages found yet. Send any message to your bot in Telegram, then run this again."
  );
} else {
  console.log("Found chat(s):");
  for (const chat of chats) {
    console.log(`  id=${chat.id} name=${chat.first_name || chat.title || ""}`);
  }
}
