import { XMLParser } from "fast-xml-parser";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { config } from "./config.js";
import { sendMessage } from "./telegram.js";

async function fetchFeedItems() {
  const res = await fetch(config.douFeedUrl);
  if (!res.ok) throw new Error(`Failed to fetch DOU feed: ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser();
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.map((item) => ({
    guid: String(item.guid),
    title: String(item.title),
    link: String(item.link),
  }));
}

async function loadSeenGuids() {
  try {
    const raw = await readFile(config.stateFilePath, "utf-8");
    return { guids: new Set(JSON.parse(raw)), isFirstRun: false };
  } catch (err) {
    if (err.code === "ENOENT") return { guids: new Set(), isFirstRun: true };
    throw err;
  }
}

async function saveSeenGuids(guidsSet) {
  const guids = Array.from(guidsSet).slice(-config.maxSeenEntries);
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(config.stateFilePath, JSON.stringify(guids, null, 2));
}

export async function checkOnce() {
  const items = await fetchFeedItems();
  const { guids: seenGuids, isFirstRun } = await loadSeenGuids();

  if (isFirstRun) {
    for (const item of items) seenGuids.add(item.guid);
    await saveSeenGuids(seenGuids);
    console.log(
      `Seeded ${items.length} vacancies, no notifications on first run.`
    );
    return;
  }

  const newItems = items.filter((item) => !seenGuids.has(item.guid));

  for (const item of newItems) {
    await sendMessage(`${item.title}\n${item.link}`);
    seenGuids.add(item.guid);
  }

  if (newItems.length > 0) {
    await saveSeenGuids(seenGuids);
    console.log(`Sent ${newItems.length} notification(s).`);
  } else {
    console.log("No new vacancies.");
  }
}
