import LeagueNav from "@/components/LeagueNav";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { formatPoints, statusLabel } from "@/lib/league";
import { Search } from "lucide-react";
import { useState } from "react";

export default function Directory() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = trpc.league.directory.useQuery({ search: search || undefined });
  return <LeagueNav><div className="mx-auto max-w-7xl space-y-7"><PageHeader eyebrow="League intelligence" title="Player & league directory" description="Search every registered member by name, UBSR ID, or position. Auction state, value, ownership, and availability are shown from the live database." />
    <div className="league-card p-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search player, UBSR ID, or position" className="h-11 border-[#1B4332]/15 pl-10" /></div></div>
    <div className="league-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[830px] text-left"><thead className="bg-[#153126] text-xs uppercase tracking-[0.12em] text-white/75"><tr><th className="px-5 py-4">Member</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Positions</th><th className="px-5 py-4">Base value</th><th className="px-5 py-4">Auction</th><th className="px-5 py-4">Current team</th></tr></thead><tbody className="divide-y divide-[#1B4332]/8">{isLoading ? <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">Loading members…</td></tr> : data.map(member => <tr key={member.memberCode} className="text-sm"><td className="px-5 py-4"><p className="font-semibold text-[#153126]">{member.fullName}</p><p className="mt-1 font-mono text-xs text-slate-500">{member.memberCode} · {member.section}</p></td><td className="px-5 py-4"><Badge variant="outline" className="border-[#1B4332]/15 bg-[#F6F5F0] text-[#153126]">{member.leagueRole}</Badge></td><td className="max-w-52 px-5 py-4 text-slate-600">{member.positions}</td><td className="px-5 py-4 font-mono text-xs text-slate-600">{formatPoints(member.basePrice)}</td><td className="px-5 py-4"><p className="font-medium text-[#153126]">{member.auctionStatus ? statusLabel(member.auctionStatus) : "Manager"}</p><p className="mt-1 font-mono text-xs text-slate-500">{member.finalBoughtPrice ? formatPoints(member.finalBoughtPrice) : "—"}</p></td><td className="px-5 py-4 text-slate-600">{member.ownerTeamName ?? (member.leagueRole === "manager" ? "Manager account" : "Unassigned")}</td></tr>)}</tbody></table></div></div>
  </div></LeagueNav>;
}
