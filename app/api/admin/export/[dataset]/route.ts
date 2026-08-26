import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLeagueIdentity } from "@/lib/league";

type ExportRow = Record<string, string | number | boolean | null | undefined>;

function escapeCsv(value: ExportRow[string]) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows: ExportRow[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  return [headers.join(","), ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(","))].join("\n");
}

export async function GET(_request: Request, context: { params: Promise<{ dataset: string }> }) {
  const identity = await getLeagueIdentity();
  if (!identity) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!identity.isAdmin) return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  const { dataset } = await context.params;
  const admin = createSupabaseAdminClient();
  let rows: ExportRow[] = [];

  if (dataset === "members") {
    const { data, error } = await admin.from("league_members").select("member_code,full_name,league_role,positions,base_price,auth_user_id").order("full_name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows = (data ?? []).map(member => ({ member_code: member.member_code, full_name: member.full_name, league_role: member.league_role, positions: member.positions, base_price: member.base_price, account_linked: Boolean(member.auth_user_id) }));
  } else if (dataset === "rosters") {
    const { data, error } = await admin.from("roster_entries").select("acquired_price,acquired_at,team:teams(name),player:league_members!roster_entries_player_member_id_fkey(member_code,full_name,positions)").order("acquired_at");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows = (data ?? []).map(entry => ({ team: entry.team?.[0]?.name, player_code: entry.player?.[0]?.member_code, player: entry.player?.[0]?.full_name, positions: entry.player?.[0]?.positions, acquired_price: entry.acquired_price, acquired_at: entry.acquired_at }));
  } else if (dataset === "fixtures" || dataset === "results") {
    let query = admin.from("fixtures").select("match_day,competition_class,status,home_score,away_score,result_confirmed_at,committee_note,home:teams!fixtures_home_team_id_fkey(name),away:teams!fixtures_away_team_id_fkey(name)").order("match_day");
    if (dataset === "results") query = query.eq("competition_class", "competitive").eq("status", "completed").not("result_confirmed_at", "is", null);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows = (data ?? []).map(fixture => ({ match_day: fixture.match_day, home_team: fixture.home?.[0]?.name, away_team: fixture.away?.[0]?.name, classification: fixture.competition_class, status: fixture.status, home_score: fixture.home_score, away_score: fixture.away_score, result_confirmed_at: fixture.result_confirmed_at, committee_note: fixture.committee_note }));
  } else {
    return NextResponse.json({ error: "Unknown export dataset." }, { status: 404 });
  }

  return new NextResponse(csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ufa-league-${dataset}.csv"` } });
}
