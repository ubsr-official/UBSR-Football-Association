import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(new URL("../supabase/migrations/0003_ufa_trade_workflow.sql", import.meta.url), "utf8");
await writeFile(new URL("../supabase/ufa-trade-workflow-input.json", import.meta.url), `${JSON.stringify({ project_id: "arysutfctdzxppmmemtt", name: "ufa_trade_workflow", query })}\n`, "utf8");
