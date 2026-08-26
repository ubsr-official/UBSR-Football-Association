import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminWorkspace } from "./admin-workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLeagueIdentity } from "@/lib/league";

export default async function AdminPage() {
  const identity = await getLeagueIdentity();
  if (!identity) redirect("/login");
  if (!identity.isAdmin) return <AppShell><div className="page-head"><div><p className="eyebrow">Protected commissioner area</p><h1>Administrator access required.</h1><p>This workspace is reserved for the UFA League owner and Arish. Your account is active, but it does not hold an administrator seat.</p></div></div><article className="card"><h2>Need to update access?</h2><p>The owner can link accounts and assign the Arish administrator seat after the relevant email has first signed in.</p><Link href="/dashboard" className="button">Return to your dashboard</Link></article></AppShell>;
  const admin = createSupabaseAdminClient();
  const [{ data: members }, { data: teams }, { data: settings }, { data: seats }, { data: fixtures }, { data: auction }, { data: audit }] = await Promise.all([
    admin.from("league_members").select("id,full_name,member_code,league_role,base_price,auth_user_id").order("full_name"),
    admin.from("teams").select("id,name").order("name"),
    admin.from("market_settings").select("*").eq("id", 1).single(),
    admin.from("admin_seats").select("seat,display_name,user_id"),
    admin.from("fixtures").select("id,match_day,competition_class,status,home:teams!fixtures_home_team_id_fkey(name),away:teams!fixtures_away_team_id_fkey(name)").order("match_day", { ascending: false }),
    admin.from("auction_records").select("status"),
    admin.from("audit_events").select("action,entity_type,detail,created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const operations = {
    unlinkedMembers: (members ?? []).filter(member => !member.auth_user_id).length,
    awaitingAuction: (auction ?? []).filter(entry => ["unsold", "not_called", "auction_in_progress", "unassigned"].includes(entry.status)).length,
    publishedFixtures: (fixtures ?? []).filter(fixture => ["scheduled", "completed", "postponed"].includes(fixture.status)).length,
    audit: audit ?? [],
  };
  return <AppShell><div className="page-head"><div><p className="eyebrow">Owner and Arish controls</p><h1>Commissioner workspace.</h1><p>Every material league decision is role-gated, recorded, and visible through the secure operational trail.</p></div></div><AdminWorkspace members={members ?? []} teams={teams ?? []} market={settings} seats={seats ?? []} fixtures={fixtures ?? []} operations={operations} /></AppShell>;
}
