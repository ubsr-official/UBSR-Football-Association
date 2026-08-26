import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(new URL("../supabase/migrations/0001_ufa_league_schema.sql", import.meta.url), "utf8");
const payload = {
  project_id: "arysutfctdzxppmmemtt",
  name: "ufa_league_schema",
  query,
};

await writeFile(
  new URL("../supabase/ufa-schema-migration-input.json", import.meta.url),
  `${JSON.stringify(payload)}\n`,
  "utf8"
);
