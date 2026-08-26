import { readFile, rm } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const statePath = "/tmp/ufa-route-screenshot-sessions.json";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Supabase service credentials are unavailable.");
const state = JSON.parse(await readFile(statePath, "utf8"));
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
await admin.from("league_members").update({ auth_user_id: state.originalMemberUserId ?? null }).eq("id", state.managerMemberId);
await admin.from("admin_seats").update({ user_id: state.originalArishUserId ?? null }).eq("seat", "arish");
await admin.auth.admin.deleteUser(state.managerUserId);
await admin.auth.admin.deleteUser(state.adminUserId);
await rm(statePath);
console.log(JSON.stringify({ cleaned: true }));
