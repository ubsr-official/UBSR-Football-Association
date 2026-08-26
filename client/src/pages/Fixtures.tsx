import LeagueNav from "@/components/LeagueNav";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatDate, statusLabel } from "@/lib/league";
import { CalendarDays } from "lucide-react";

export default function Fixtures() {
  const { data = [], isLoading } = trpc.league.fixtures.useQuery();
  return <LeagueNav><div className="mx-auto max-w-5xl space-y-7"><PageHeader eyebrow="Match centre" title="League fixtures" description="Fixtures are maintained by the commissioners. Dates, venues, and results appear here as soon as they are entered." />
    {isLoading ? <p className="text-sm text-slate-500">Loading fixtures…</p> : data.length ? <div className="space-y-4">{data.map(fixture => <article key={fixture.id} className="league-card p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#1B4332]/8"><CalendarDays className="size-5 text-[#1B4332]" /></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C2871F]">{fixture.matchweek ? `Matchweek ${fixture.matchweek}` : "League fixture"}</p><h2 className="mt-1 font-display text-2xl text-[#153126]">{fixture.homeTeamName} <span className="text-[#C2871F]">vs</span> {fixture.awayTeamName}</h2><p className="mt-1 text-sm text-slate-500">{formatDate(fixture.scheduledFor)} · {fixture.venue ?? "Venue to be confirmed"}</p></div></div><div className="flex items-center gap-3"><Badge variant="outline" className="border-[#1B4332]/15">{statusLabel(fixture.status)}</Badge>{fixture.status === "completed" && <span className="rounded-lg bg-[#153126] px-3 py-2 font-mono text-sm text-white">{fixture.homeScore} — {fixture.awayScore}</span>}</div></div>{fixture.note && <p className="mt-4 border-t border-[#1B4332]/8 pt-4 text-sm text-slate-600">{fixture.note}</p>}</article>)}</div> : <div className="league-card grid min-h-72 place-items-center p-8 text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#1B4332]/8"><CalendarDays className="size-6 text-[#1B4332]" /></div><h2 className="mt-5 font-display text-2xl text-[#153126]">Fixtures will be published here.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">No league fixture has been recorded yet. Commissioners can add the first schedule from their control panel.</p></div></div>}
  </div></LeagueNav>;
}
