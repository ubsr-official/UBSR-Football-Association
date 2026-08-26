import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LeagueIdentity = { userId: string; memberId: string | null; teamId: string | null; isAdmin: boolean; adminSeat: "owner" | "arish" | null };
export type Standing = { team_id: string; team_name: string; logo_path: string | null; played: number; wins: number; draws: number; losses: number; goals_for: number; goals_against: number; goal_difference: number; points: number };

export const points = (amount: number | null | undefined) => amount === null || amount === undefined ? "—" : `${amount.toLocaleString("en-IN")} pts`;
export const day = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${value}T00:00:00`)) : "To be confirmed";

export async function getLeagueIdentity(): Promise<LeagueIdentity | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: member }, { data: seat }] = await Promise.all([
    supabase.from("league_members").select("id").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("admin_seats").select("seat").eq("user_id", user.id).maybeSingle(),
  ]);
  const memberId = member?.id ?? null;
  const { data: team } = memberId ? await supabase.from("teams").select("id").eq("manager_member_id", memberId).maybeSingle() : { data: null };
  return { userId: user.id, memberId, teamId: team?.id ?? null, isAdmin: Boolean(seat), adminSeat: (seat?.seat as "owner" | "arish" | undefined) ?? null };
}

export async function getLeagueOverview() {
  const admin = createSupabaseAdminClient();
  const [members, teams, auction, market, standings, fixtures] = await Promise.all([
    admin.from("league_members").select("id", { count: "exact", head: true }),
    admin.from("teams").select("id", { count: "exact", head: true }),
    admin.from("auction_records").select("status"),
    admin.from("market_settings").select("is_open, owner_enabled, arish_enabled").eq("id", 1).single(),
    admin.from("live_standings").select("*").order("points", { ascending: false }).order("goal_difference", { ascending: false }).order("goals_for", { ascending: false }),
    admin.from("fixtures").select("id, match_day, competition_class, status, home:teams!fixtures_home_team_id_fkey(name), away:teams!fixtures_away_team_id_fkey(name)").in("status", ["scheduled", "postponed"]).order("match_day", { ascending: true }).limit(5),
  ]);
  const auctionCounts = { sold: 0, unsold: 0, notCalled: 0, inProgress: 0 };
  auction.data?.forEach(record => { if (record.status === "sold") auctionCounts.sold += 1; if (record.status === "unsold") auctionCounts.unsold += 1; if (record.status === "not_called") auctionCounts.notCalled += 1; if (record.status === "auction_in_progress") auctionCounts.inProgress += 1; });
  return { memberCount: members.count ?? 0, teamCount: teams.count ?? 0, auctionCounts, market: market.data, standings: (standings.data ?? []) as Standing[], fixtures: fixtures.data ?? [] };
}

export async function requireLeagueIdentity() {
  const identity = await getLeagueIdentity();
  if (!identity?.memberId && !identity?.isAdmin) throw new Error("Your account is not yet linked to a UFA League member record.");
  return identity;
}

export async function requireLeagueAdmin() {
  const identity = await getLeagueIdentity();
  if (!identity?.isAdmin) throw new Error("This action is reserved for the league owner or Arish.");
  return identity;
}
