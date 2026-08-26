import { AppShell } from "@/components/app-shell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { points } from "@/lib/league";

export const dynamic = "force-dynamic";

export default async function LeaguePage() { const admin = createSupabaseAdminClient(); const { data: members } = await admin.from("league_members").select("id, member_code, full_name, section, league_role, positions, rating, base_price, account_status").order("member_code"); return <AppShell><div className="page-head"><div><p className="eyebrow">Secure league directory</p><h1>Members and player records.</h1><p>Base prices come from the provided member list. Account access stays linked only by the owner or Arish.</p></div></div><article className="card table-wrap"><table className="table"><thead><tr><th>Member</th><th>Role</th><th>Positions</th><th>Rating</th><th className="number">Base</th><th>Account</th></tr></thead><tbody>{members?.map(member => <tr key={member.id}><td><strong>{member.full_name}</strong><br /><small style={{ color: "var(--muted)" }}>{member.member_code} · {member.section}</small></td><td>{member.league_role}</td><td>{member.positions ?? "—"}</td><td>{member.rating ?? "—"}</td><td className="number">{points(member.base_price)}</td><td><span className="status">{member.account_status}</span></td></tr>)}</tbody></table></article></AppShell>; }
