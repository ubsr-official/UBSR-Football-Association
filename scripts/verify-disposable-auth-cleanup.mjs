import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Supabase service credentials are unavailable.");

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) throw new Error(error.message);
const disposableUsers = data.users.filter(user => /^ufa-(manager|admin)-(validation|route|evidence)-.+@example\.test$/.test(user.email ?? "")).length;
if (disposableUsers !== 0) throw new Error(`${disposableUsers} disposable verification accounts remain.`);
console.log(JSON.stringify({ disposableAuthUsers: 0 }));
