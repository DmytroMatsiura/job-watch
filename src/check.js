import { XMLParser } from "fast-xml-parser";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { config } from "./config.js";
import { sendMessage } from "./telegram.js";

function extractVacancyId(url) {
  const match = String(url).match(/\/vacancies\/(\d+)\//);
  return match ? match[1] : String(url);
}

async function fetchFeedItems(feedUrl) {
  const res = await fetch(feedUrl);
  if (!res.ok)
    throw new Error(`Failed to fetch DOU feed (${feedUrl}): ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser();
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.map((item) => ({
    id: extractVacancyId(item.link ?? item.guid),
    title: String(item.title),
    link: String(item.link),
  }));
}

async function fetchAllFeedItems() {
  const itemsByFeed = await Promise.all(
    config.douFeedUrls.map((feedUrl) => fetchFeedItems(feedUrl))
  );

  const itemsById = new Map();
  for (const item of itemsByFeed.flat()) {
    itemsById.set(item.id, item);
  }
  return Array.from(itemsById.values());
}

async function loadSeenIds() {
  try {
    const raw = await readFile(config.stateFilePath, "utf-8");
    return { ids: new Set(JSON.parse(raw)), isFirstRun: false };
  } catch (err) {
    if (err.code === "ENOENT") return { ids: new Set(), isFirstRun: true };
    throw err;
  }
}

async function saveSeenIds(idsSet) {
  const ids = Array.from(idsSet).slice(-config.maxSeenEntries);
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(config.stateFilePath, JSON.stringify(ids, null, 2));
}

export async function checkOnce() {
  const items = await fetchAllFeedItems();
  const { ids: seenIds, isFirstRun } = await loadSeenIds();

  if (isFirstRun) {
    for (const item of items) seenIds.add(item.id);
    await saveSeenIds(seenIds);
    console.log(
      `Seeded ${items.length} vacancies, no notifications on first run.`
    );
    return;
  }

  const newItems = items.filter((item) => !seenIds.has(item.id));

  for (const item of newItems) {
    await sendMessage(`${item.title}\n${item.link}`);
    seenIds.add(item.id);
  }

  if (newItems.length > 0) {
    await saveSeenIds(seenIds);
    console.log(`Sent ${newItems.length} notification(s).`);
  } else {
    console.log("No new vacancies.");
  }
}
