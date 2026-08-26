import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publishableKey || !serviceKey) throw new Error("Supabase verification environment variables are unavailable.");

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `Ufa-${stamp}-Validation!`;
const managerEmail = `ufa-manager-validation-${stamp}@example.test`;
const administratorEmail = `ufa-admin-validation-${stamp}@example.test`;
let managerUserId;
let administratorUserId;
let managerMemberId;
let priorMemberUserId;
let priorArishUserId;
let priorArishApproval;

try {
  const { data: team, error: teamError } = await admin.from("teams").select("id,manager_member_id").eq("is_active", true).limit(1).maybeSingle();
  if (teamError || !team?.manager_member_id) throw new Error(teamError?.message || "No active managed team is available for authorization validation.");
  managerMemberId = team.manager_member_id;
  const { data: member, error: memberError } = await admin.from("league_members").select("auth_user_id").eq("id", managerMemberId).single();
  if (memberError) throw new Error(memberError.message);
  priorMemberUserId = member.auth_user_id;
  const { data: arishSeat, error: arishError } = await admin.from("admin_seats").select("user_id").eq("seat", "arish").single();
  if (arishError) throw new Error(arishError.message);
  priorArishUserId = arishSeat.user_id;
  const { data: market, error: marketError } = await admin.from("market_settings").select("arish_enabled").eq("id", 1).single();
  if (marketError) throw new Error(marketError.message);
  priorArishApproval = market.arish_enabled;

  const { data: managerUser, error: createManagerError } = await admin.auth.admin.createUser({ email: managerEmail, password, email_confirm: true });
  if (createManagerError || !managerUser.user) throw new Error(createManagerError?.message || "Could not create disposable manager account.");
  managerUserId = managerUser.user.id;
  const { data: administratorUser, error: createAdministratorError } = await admin.auth.admin.createUser({ email: administratorEmail, password, email_confirm: true });
  if (createAdministratorError || !administratorUser.user) throw new Error(createAdministratorError?.message || "Could not create disposable administrator account.");
  administratorUserId = administratorUser.user.id;

  const { error: managerLinkError } = await admin.from("league_members").update({ auth_user_id: managerUserId }).eq("id", managerMemberId);
  if (managerLinkError) throw new Error(managerLinkError.message);
  const { error: seatLinkError } = await admin.from("admin_seats").update({ user_id: administratorUserId }).eq("seat", "arish");
  if (seatLinkError) throw new Error(seatLinkError.message);

  const managerClient = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: managerLoginError } = await managerClient.auth.signInWithPassword({ email: managerEmail, password });
  if (managerLoginError) throw new Error(managerLoginError.message);
  const { data: managerTeam, error: managerTeamError } = await managerClient.from("teams").select("id").eq("id", team.id).limit(1);
  if (managerTeamError || managerTeam?.length !== 1) throw new Error(managerTeamError?.message || "Linked manager could not read their own team.");
  const { error: managerMarketError } = await managerClient.rpc("set_market_approval", { enabled: priorArishApproval });
  if (!managerMarketError) throw new Error("Manager unexpectedly received administrator market control.");

  const administratorClient = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: administratorLoginError } = await administratorClient.auth.signInWithPassword({ email: administratorEmail, password });
  if (administratorLoginError) throw new Error(administratorLoginError.message);
  const { error: administratorMarketError } = await administratorClient.rpc("set_market_approval", { enabled: priorArishApproval });
  if (administratorMarketError) throw new Error(administratorMarketError.message);

  console.log(JSON.stringify({ managerCanReadOwnTeam: true, managerCannotControlMarket: true, arishCanControlOwnApproval: true }));
} finally {
  if (managerMemberId) await admin.from("league_members").update({ auth_user_id: priorMemberUserId ?? null }).eq("id", managerMemberId);
  if (priorArishUserId !== undefined) await admin.from("admin_seats").update({ user_id: priorArishUserId ?? null }).eq("seat", "arish");
  if (priorArishApproval !== undefined) await admin.from("market_settings").update({ arish_enabled: priorArishApproval }).eq("id", 1);
  if (managerUserId) await admin.auth.admin.deleteUser(managerUserId);
  if (administratorUserId) await admin.auth.admin.deleteUser(administratorUserId);
}
