import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(new URL("../supabase/migrations/0005_revoke_generated_rls_helper.sql", import.meta.url), "utf8");
await writeFile(new URL("../supabase/ufa-generated-helper-revoke-input.json", import.meta.url), `${JSON.stringify({ project_id: "arysutfctdzxppmmemtt", name: "ufa_revoke_generated_rls_helper", query })}\n`, "utf8");
