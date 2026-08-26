import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(new URL("../supabase/migrations/0004_revoke_public_function_execution.sql", import.meta.url), "utf8");
await writeFile(new URL("../supabase/ufa-security-hardening-input.json", import.meta.url), `${JSON.stringify({ project_id: "arysutfctdzxppmmemtt", name: "ufa_revoke_public_function_execution", query })}\n`, "utf8");
