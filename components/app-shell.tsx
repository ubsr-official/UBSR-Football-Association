import Link from "next/link";
import { CalendarDays, Gavel, Goal, House, MessageCircle, ScrollText, ShieldCheck, TableProperties, UsersRound } from "lucide-react";
import { getLeagueIdentity } from "@/lib/league";

const nav = [
  ["Overview", "/dashboard", House], ["Auction log", "/auction-log", ScrollText], ["League directory", "/league", UsersRound], ["Rosters", "/rosters", Goal], ["Fixtures", "/fixtures", CalendarDays], ["Standings", "/standings", TableProperties], ["Market", "/market", Gavel], ["Team room", "/team-room", MessageCircle],
] as const;

export async function AppShell({ children }: { children: React.ReactNode }) {
  const identity = await getLeagueIdentity();
  return <div className="shell"><aside className="sidebar"><Link href="/dashboard" className="wordmark"><span className="mark">U</span><span>UFA League</span></Link><nav className="nav">{nav.map(([label, href, Icon]) => <Link key={href} href={href}><Icon size={16} strokeWidth={2.1} /> <span>{label}</span></Link>)}{identity?.isAdmin && <Link href="/admin"><ShieldCheck size={16} strokeWidth={2.1} /> <span>Commissioner</span></Link>}</nav><div style={{ marginTop: "auto" }}><span className={`status ${identity?.isAdmin ? "" : "closed"}`}>{identity?.isAdmin ? identity.adminSeat === "owner" ? "Owner access" : "Arish admin" : identity?.memberId ? "League member" : "Account pending"}</span></div></aside><main className="shell-main">{children}</main></div>;
}
