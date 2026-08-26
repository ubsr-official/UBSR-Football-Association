import LeagueNav from "@/components/LeagueNav";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatPoints, statusLabel } from "@/lib/league";
import { AlertTriangle, ArrowRight, Landmark, LockKeyhole, ShieldCheck, Trophy, UsersRound } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data, isLoading, error } = trpc.league.overview.useQuery();
  if (isLoading) return <div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">Loading league record…</div>;
  if (error) return <LeagueNav><div className="mx-auto max-w-2xl py-16"><div className="league-card p-8"><AlertTriangle className="size-7 text-[#C2871F]" /><h1 className="mt-4 font-display text-3xl text-[#153126]">Account approval pending</h1><p className="mt-3 leading-7 text-slate-600">Your secure account has not yet been linked to a UBSR member record. Ask the owner or Arish to complete the profile link in Commissioner controls.</p></div></div></LeagueNav>;
  if (!data) return <div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">Preparing league record…</div>;

  const { counts, market, recentActivity } = data.summary;
  const { dashboard, identity } = data;
  const metricItems = [
    { label: "League members", value: counts.members, note: "54 registered records", icon: UsersRound },
    { label: "Auctioned players", value: counts.sold, note: `${counts.unsold} unsold · ${counts.notCalled} still to call`, icon: Trophy },
    { label: "Your balance", value: dashboard.manager ? formatPoints(dashboard.manager.currentBalance) : "—", note: dashboard.manager ? "From 2,000 pts opening budget" : "Available for manager accounts", icon: Landmark },
  ];

  return (
    <LeagueNav>
      <div className="mx-auto max-w-7xl space-y-7">
        <PageHeader eyebrow="Season control centre" title={`Welcome${identity.memberName ? `, ${identity.memberName.split(" ")[0]}` : " to UBSR"}.`} description="A live record of the auction, league squads, fixtures, and controlled transfer activity." action={<Badge className={market.isOpen ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-[#153126] text-white hover:bg-[#153126]"}>{market.isOpen ? "Market open" : "Market closed"}</Badge>} />

        <section className="grid gap-4 md:grid-cols-3">
          {metricItems.map(item => <article key={item.label} className="league-card p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{item.label}</p><p className="mt-3 font-display text-3xl text-[#153126]">{item.value}</p><p className="mt-2 text-xs text-slate-500">{item.note}</p></div><div className="grid size-10 place-items-center rounded-xl bg-[#1B4332]/8"><item.icon className="size-5 text-[#1B4332]" /></div></div></article>)}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.32fr_.68fr]">
          <article className="league-card overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#1B4332]/10 bg-[#153126] px-6 py-6 text-white sm:flex-row sm:items-center"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E0A02C]">Your team record</p><h2 className="mt-1 font-display text-2xl">{dashboard.team?.teamName ?? "Team placement pending"}</h2></div><div className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/75">{dashboard.roster.length} players recorded</div></div>
            <div className="p-6">
              {dashboard.roster.length ? <div className="divide-y divide-[#1B4332]/8">{dashboard.roster.map(player => <div key={player.memberCode} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium text-[#153126]">{player.fullName}</p><p className="mt-0.5 text-xs text-slate-500">{player.memberCode} · {player.positions}</p></div><span className="font-mono text-xs text-slate-600">{formatPoints(player.acquiredPrice)}</span></div>)}</div> : <div className="rounded-xl border border-dashed border-[#1B4332]/20 p-7 text-sm leading-6 text-slate-500">Your profile will show a team roster once the auction records you to a manager. No unassigned player is available for transfer.</div>}
              <Link href="/rosters" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1B4332] hover:text-[#C2871F]">View all league rosters <ArrowRight className="size-4" /></Link>
            </div>
          </article>

          <article className="league-card p-6">
            <div className="flex items-start gap-3"><div className={`grid size-10 place-items-center rounded-xl ${market.isOpen ? "bg-emerald-100" : "bg-[#E0A02C]/15"}`}>{market.isOpen ? <ShieldCheck className="size-5 text-emerald-700" /> : <LockKeyhole className="size-5 text-[#B47711]" />}</div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Transfer market</p><h2 className="mt-1 font-display text-2xl text-[#153126]">{market.isOpen ? "Negotiation is live" : "Safeguarded and closed"}</h2></div></div>
            <p className="mt-5 text-sm leading-6 text-slate-600">{market.isOpen ? "Managers may publish public listings, receive bids, and manually accept or reject offers." : "Listings and public discussions stay disabled until both the owner and Arish independently approve opening the market."}</p>
            <Link href="/market"><Button variant="outline" className="mt-6 border-[#1B4332]/20 text-[#153126] hover:bg-[#1B4332]/6">Open transfer desk</Button></Link>
          </article>
        </section>

        <section className="league-card p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2871F]">League activity</p><h2 className="mt-1 font-display text-2xl text-[#153126]">Latest operations</h2></div></div><div className="mt-5 divide-y divide-[#1B4332]/8">{recentActivity.length ? recentActivity.map(activity => <div key={activity.id} className="flex items-start gap-4 py-4"><span className="mt-1 size-2 rounded-full bg-[#E0A02C]" /><div><p className="text-sm font-semibold text-[#153126]">{activity.headline}</p><p className="mt-1 text-sm text-slate-500">{activity.detail ?? statusLabel(activity.category)}</p></div></div>) : <p className="py-6 text-sm text-slate-500">League activity will appear here as auction and fixture records are entered.</p>}</div></section>
      </div>
    </LeagueNav>
  );
}
