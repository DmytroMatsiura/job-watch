import { checkOnce } from "./check.js";

checkOnce().catch((err) => {
  console.error("job-watch failed:", err);
  process.exit(1);
});
