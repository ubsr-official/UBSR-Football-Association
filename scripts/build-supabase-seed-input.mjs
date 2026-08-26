import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(new URL("../supabase/seed-ufa-league.sql", import.meta.url), "utf8");
await writeFile(
  new URL("../supabase/ufa-seed-input.json", import.meta.url),
  `${JSON.stringify({ project_id: "arysutfctdzxppmmemtt", query })}\n`,
  "utf8"
);
