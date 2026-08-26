import LeagueNav from "@/components/LeagueNav";
import PageHeader from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { formatPoints } from "@/lib/league";
import { UsersRound } from "lucide-react";

export default function Rosters() {
  const { data = [], isLoading } = trpc.league.rosters.useQuery();
  return <LeagueNav><div className="mx-auto max-w-7xl space-y-7"><PageHeader eyebrow="Squad register" title="Teams & rosters" description="Every sold player remains visibly attached to a manager. The auction is still in progress, so unassigned players are not placed in a transfer pool." />
    {isLoading ? <p className="text-sm text-slate-500">Loading team records…</p> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.map(({ manager, players }) => <article key={manager.id} className="league-card overflow-hidden"><div className="border-b border-[#1B4332]/10 bg-[#E8EEE8] px-5 py-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#C2871F]">Manager squad</p><h2 className="mt-1 font-display text-2xl text-[#153126]">{manager.teamName}</h2></div><UsersRound className="mt-1 size-5 text-[#1B4332]" /></div><p className="mt-3 font-mono text-xs text-slate-600">Balance {formatPoints(manager.currentBalance)}</p></div><div className="p-5">{players.length ? <div className="divide-y divide-[#1B4332]/8">{players.map(player => <div key={player.memberCode} className="flex items-start justify-between gap-3 py-3"><div><p className="text-sm font-semibold text-[#153126]">{player.fullName}</p><p className="mt-1 text-xs text-slate-500">{player.memberCode} · {player.positions}</p></div><span className="font-mono text-[11px] text-slate-500">{formatPoints(player.acquiredPrice)}</span></div>)}</div> : <p className="rounded-lg border border-dashed border-[#1B4332]/15 p-4 text-sm leading-6 text-slate-500">No sold players recorded yet.</p>}</div></article>)}</div>}
  </div></LeagueNav>;
}
