import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(new URL("../supabase/migrations/0002_ufa_fixture_workflow.sql", import.meta.url), "utf8");
await writeFile(new URL("../supabase/ufa-fixture-workflow-input.json", import.meta.url), `${JSON.stringify({ project_id: "arysutfctdzxppmmemtt", name: "ufa_fixture_workflow", query })}\n`, "utf8");
