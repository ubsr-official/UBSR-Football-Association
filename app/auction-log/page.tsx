import { AppShell } from "@/components/app-shell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { points } from "@/lib/league";

export const dynamic = "force-dynamic";

export default async function AuctionLogPage() {
  const admin = createSupabaseAdminClient();
  const { data: entries } = await admin.from("auction_log_entries").select("id,auction_round,player_code_snapshot,player_name_snapshot,section_snapshot,positions_snapshot,base_price,final_bought_price,buyer_manager_snapshot,outcome,logged_at").order("buyer_manager_snapshot", { ascending: true }).order("final_bought_price", { ascending: false });
  const rows = entries ?? [];
  const totalSpent = rows.reduce((sum, entry) => sum + entry.final_bought_price, 0);
  const managerCount = new Set(rows.map(entry => entry.buyer_manager_snapshot)).size;
  return <AppShell><div className="page-head"><div><p className="eyebrow">Public historical record</p><h1>Finalized auction log.</h1><p>Round 2 is complete. This public record preserves the exact base prices, final auction prices, player details, and buying manager for every sold player. Historical entries cannot be edited or deleted.</p></div><span className="status">Immutable record</span></div><section className="grid grid-3"><article className="card"><span className="label">Players sold</span><h2>{rows.length}</h2><p>All players called · 0 unsold</p></article><article className="card"><span className="label">Total auction spend</span><h2>{points(totalSpent)}</h2><p>Recorded across the completed round</p></article><article className="card"><span className="label">Manager rosters</span><h2>{managerCount}</h2><p>Five players recorded per manager</p></article></section><article className="card table-wrap" style={{ marginTop: "1rem" }}><table className="table"><thead><tr><th>Player</th><th>Section</th><th>Position(s)</th><th>Manager</th><th className="number">Base</th><th className="number">Auction</th></tr></thead><tbody>{rows.map(entry => <tr key={entry.id}><td><strong>{entry.player_name_snapshot}</strong><br /><small style={{ color: "var(--muted)" }}>{entry.player_code_snapshot}</small></td><td>{entry.section_snapshot ?? "—"}</td><td>{entry.positions_snapshot ?? "—"}</td><td>{entry.buyer_manager_snapshot}</td><td className="number">{points(entry.base_price)}</td><td className="number"><strong>{points(entry.final_bought_price)}</strong></td></tr>)}</tbody></table>{!rows.length && <div className="empty">The finalized auction log is awaiting its first completed round.</div>}</article></AppShell>;
}
