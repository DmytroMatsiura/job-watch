import "dotenv/config";

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, DOU_SEARCH_QUERY } = process.env;

export const config = {
  telegramBotToken: TELEGRAM_BOT_TOKEN,
  telegramChatId: TELEGRAM_CHAT_ID,
  douFeedUrl: `https://jobs.dou.ua/vacancies/feeds/?search=${encodeURIComponent(
    DOU_SEARCH_QUERY || "vue"
  )}`,
  stateFilePath: new URL("../data/seen.json", import.meta.url),
  maxSeenEntries: 300,
};
