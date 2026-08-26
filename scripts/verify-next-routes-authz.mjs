import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3000";

if (!url || !publishableKey || !serviceKey) throw new Error("Supabase verification environment variables are unavailable.");

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `Ufa-${stamp}-Route!`;
const managerEmail = `ufa-manager-route-${stamp}@example.test`;
const administratorEmail = `ufa-admin-route-${stamp}@example.test`;
let managerUserId;
let administratorUserId;
let managerMemberId;
let priorMemberUserId;
let priorArishUserId;

async function sessionCookie(email) {
  const browserClient = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await browserClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message || "Disposable session could not be created.");
  const jar = new Map();
  const serverClient = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: items => items.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  await serverClient.auth.setSession(data.session);
  return [...jar.entries()].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; ");
}

async function page(path, cookie, fragment) {
  const response = await fetch(`${appUrl}${path}`, { headers: { Cookie: cookie }, redirect: "manual" });
  const body = await response.text();
  if (response.status !== 200 || !body.includes(fragment)) throw new Error(`Route verification failed for ${path}: ${response.status}`);
}

try {
  const { data: team, error: teamError } = await admin.from("teams").select("id,manager_member_id").eq("is_active", true).limit(1).maybeSingle();
  if (teamError || !team?.manager_member_id) throw new Error(teamError?.message || "No active managed team is available.");
  managerMemberId = team.manager_member_id;
  const { data: member, error: memberError } = await admin.from("league_members").select("auth_user_id").eq("id", managerMemberId).single();
  if (memberError) throw new Error(memberError.message);
  priorMemberUserId = member.auth_user_id;
  const { data: arishSeat, error: arishError } = await admin.from("admin_seats").select("user_id").eq("seat", "arish").single();
  if (arishError) throw new Error(arishError.message);
  priorArishUserId = arishSeat.user_id;

  const { data: managerUser, error: managerError } = await admin.auth.admin.createUser({ email: managerEmail, password, email_confirm: true });
  if (managerError || !managerUser.user) throw new Error(managerError?.message || "Manager test account was not created.");
  managerUserId = managerUser.user.id;
  const { data: administratorUser, error: administratorError } = await admin.auth.admin.createUser({ email: administratorEmail, password, email_confirm: true });
  if (administratorError || !administratorUser.user) throw new Error(administratorError?.message || "Administrator test account was not created.");
  administratorUserId = administratorUser.user.id;
  const { error: linkError } = await admin.from("league_members").update({ auth_user_id: managerUserId }).eq("id", managerMemberId);
  if (linkError) throw new Error(linkError.message);
  const { error: seatError } = await admin.from("admin_seats").update({ user_id: administratorUserId }).eq("seat", "arish");
  if (seatError) throw new Error(seatError.message);

  const managerCookie = await sessionCookie(managerEmail);
  await page("/dashboard", managerCookie, "Welcome to UFA League");
  await page("/fixtures", managerCookie, "Fixtures, agreed by day");
  await page("/market", managerCookie, "Public trade desk");
  await page("/team-room", managerCookie, "Team identity");
  await page("/admin", managerCookie, "Administrator access required");

  const administratorCookie = await sessionCookie(administratorEmail);
  await page("/admin", administratorCookie, "Commissioner workspace");

  console.log(JSON.stringify({ managerRoutesVerified: ["dashboard", "fixtures", "market", "team-room", "admin-access-denied"], administratorRoutesVerified: ["admin"] }));
} finally {
  if (managerMemberId) await admin.from("league_members").update({ auth_user_id: priorMemberUserId ?? null }).eq("id", managerMemberId);
  if (priorArishUserId !== undefined) await admin.from("admin_seats").update({ user_id: priorArishUserId ?? null }).eq("seat", "arish");
  if (managerUserId) await admin.auth.admin.deleteUser(managerUserId);
  if (administratorUserId) await admin.auth.admin.deleteUser(administratorUserId);
}
