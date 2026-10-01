import "dotenv/config";

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, DOU_SEARCH_QUERIES } =
  process.env;

const searchQueries = (DOU_SEARCH_QUERIES || "vue,react")
  .split(",")
  .map((q) => q.trim())
  .filter(Boolean);

export const config = {
  telegramBotToken: TELEGRAM_BOT_TOKEN,
  telegramChatId: TELEGRAM_CHAT_ID,
  douFeedUrls: searchQueries.map(
    (query) =>
      `https://jobs.dou.ua/vacancies/feeds/?search=${encodeURIComponent(
        query
      )}&descr=1`
  ),
  stateFilePath: new URL("../data/seen.json", import.meta.url),
  maxSeenEntries: 500,
};
