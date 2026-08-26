export const dynamic = "force-dynamic";

import { AppShell } from "@/components/app-shell";
import { StandingsTable } from "@/components/standings-table";
import { getLeagueOverview } from "@/lib/league";

export default async function StandingsPage() { const overview = await getLeagueOverview(); return <AppShell><div className="page-head"><div><p className="eyebrow">Verified competition record</p><h1>Live points table.</h1><p>Competitive results enter the table only after an administrator confirms the score. Friendlies remain visible in match history but never affect these rankings.</p></div></div><article className="card"><div className="notice">Ranking: points, then goal difference, then goals scored. A win is worth 3 points; a draw is worth 1.</div><div style={{ marginTop: "1rem" }}><StandingsTable standings={overview.standings} /></div></article></AppShell>; }
