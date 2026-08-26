import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(new URL("../supabase/migrations/0006_grant_authenticated_rls_helpers.sql", import.meta.url), "utf8");
await writeFile(new URL("../supabase/ufa-rls-helper-grant-input.json", import.meta.url), `${JSON.stringify({ project_id: "arysutfctdzxppmmemtt", name: "ufa_grant_authenticated_rls_helpers", query })}\n`, "utf8");
