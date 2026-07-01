import { checkOnce } from "./check.js";

const MIN_MS = 2.5 * 60 * 1000;
const MAX_MS = 7.5 * 60 * 1000;

function randomDelayMs() {
  return MIN_MS + Math.random() * (MAX_MS - MIN_MS);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loop() {
  while (true) {
    try {
      await checkOnce();
    } catch (err) {
      console.error("job-watch check failed:", err);
    }
    const delay = randomDelayMs();
    console.log(`Next check in ${Math.round(delay / 1000)}s`);
    await sleep(delay);
  }
}

loop();
