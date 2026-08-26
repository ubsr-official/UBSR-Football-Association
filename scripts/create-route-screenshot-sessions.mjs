import { writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const redirectTo = process.argv[2];
const statePath = "/tmp/ufa-route-screenshot-sessions.json";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey || !redirectTo) throw new Error("Provide a redirect URL and configured Supabase service credentials.");

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `Ufa-${stamp}-Screenshot!`;
const managerEmail = `ufa-manager-screenshot-${stamp}@example.test`;
const adminEmail = `ufa-admin-screenshot-${stamp}@example.test`;
let managerUserId; let adminUserId; let managerMemberId; let originalMemberUserId; let originalArishUserId;

try {
  const { data: team, error: teamError } = await admin.from("teams").select("manager_member_id").eq("is_active", true).limit(1).single();
  if (teamError || !team?.manager_member_id) throw new Error(teamError?.message || "No active manager team is available.");
  managerMemberId = team.manager_member_id;
  const { data: member, error: memberError } = await admin.from("league_members").select("auth_user_id").eq("id", managerMemberId).single();
  if (memberError) throw new Error(memberError.message);
  originalMemberUserId = member.auth_user_id;
  const { data: arish, error: arishError } = await admin.from("admin_seats").select("user_id").eq("seat", "arish").single();
  if (arishError) throw new Error(arishError.message);
  originalArishUserId = arish.user_id;
  const { data: managerUser, error: managerError } = await admin.auth.admin.createUser({ email: managerEmail, password, email_confirm: true });
  if (managerError || !managerUser.user) throw new Error(managerError?.message || "Could not create disposable manager.");
  managerUserId = managerUser.user.id;
  const { data: administratorUser, error: administratorError } = await admin.auth.admin.createUser({ email: adminEmail, password, email_confirm: true });
  if (administratorError || !administratorUser.user) throw new Error(administratorError?.message || "Could not create disposable administrator.");
  adminUserId = administratorUser.user.id;
  const { error: memberUpdateError } = await admin.from("league_members").update({ auth_user_id: managerUserId }).eq("id", managerMemberId);
  if (memberUpdateError) throw new Error(memberUpdateError.message);
  const { error: arishUpdateError } = await admin.from("admin_seats").update({ user_id: adminUserId }).eq("seat", "arish");
  if (arishUpdateError) throw new Error(arishUpdateError.message);
  const { data: managerLink, error: managerLinkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: managerEmail, options: { redirectTo } });
  if (managerLinkError || !managerLink.properties?.action_link) throw new Error(managerLinkError?.message || "Could not generate manager session link.");
  const { data: adminLink, error: adminLinkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: adminEmail, options: { redirectTo: redirectTo.replace("/dashboard", "/admin") } });
  if (adminLinkError || !adminLink.properties?.action_link) throw new Error(adminLinkError?.message || "Could not generate administrator session link.");
  await writeFile(statePath, JSON.stringify({ managerUserId, adminUserId, managerMemberId, originalMemberUserId, originalArishUserId }));
  console.log(JSON.stringify({ managerActionLink: managerLink.properties.action_link, administratorActionLink: adminLink.properties.action_link }));
} catch (error) {
  if (managerMemberId) await admin.from("league_members").update({ auth_user_id: originalMemberUserId ?? null }).eq("id", managerMemberId);
  if (originalArishUserId !== undefined) await admin.from("admin_seats").update({ user_id: originalArishUserId ?? null }).eq("seat", "arish");
  if (managerUserId) await admin.auth.admin.deleteUser(managerUserId);
  if (adminUserId) await admin.auth.admin.deleteUser(adminUserId);
  throw error;
}
