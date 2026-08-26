"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireLeagueAdmin, requireLeagueIdentity } from "@/lib/league";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const id = z.string().uuid();
const integer = z.coerce.number().int();
const text = z.string().trim();
const refresh = (...paths: string[]) => paths.forEach(path => revalidatePath(path));

export async function signOut() { const supabase = await createSupabaseServerClient(); await supabase.auth.signOut(); redirect("/"); }

export async function updateTeamIdentity(formData: FormData) {
  const identity = await requireLeagueIdentity(); if (!identity.teamId) throw new Error("Only a manager can update a team identity.");
  const name = text.min(3).max(60).parse(formData.get("name")); const shortName = text.max(12).optional().parse(formData.get("shortName") || undefined);
  const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("teams").update({ name, short_name: shortName ?? null }).eq("id", identity.teamId); if (error) throw new Error(error.message); refresh("/dashboard", "/rosters", "/team-room");
}

export async function uploadTeamLogo(formData: FormData) {
  const identity = await requireLeagueIdentity(); if (!identity.teamId) throw new Error("Only a manager can upload a team logo.");
  const file = formData.get("logo"); if (!(file instanceof File) || file.size === 0) throw new Error("Choose an image file to upload.");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error("Use PNG, JPEG, or WebP under 2 MB.");
  const supabase = await createSupabaseServerClient(); const extension = file.name.split(".").pop()?.toLowerCase() || "png"; const path = `${identity.teamId}/crest.${extension}`;
  const { error: uploadError } = await supabase.storage.from("team-logos").upload(path, file, { upsert: true, contentType: file.type }); if (uploadError) throw new Error(uploadError.message);
  const { error } = await supabase.from("teams").update({ logo_path: path }).eq("id", identity.teamId); if (error) throw new Error(error.message); refresh("/dashboard", "/rosters", "/team-room");
}

export async function submitAvailability(windowId: string, dayValues: string[]) {
  await requireLeagueIdentity(); const parsedWindow = id.parse(windowId); const days = z.array(z.string().date()).min(1).max(31).parse(dayValues);
  const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("submit_manager_days", { target_window: parsedWindow, selected_days: days }); if (error) throw new Error(error.message); refresh("/fixtures", "/dashboard");
}

export async function respondToFixtureProposal(proposalId: string, accepted: boolean) {
  await requireLeagueIdentity(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("accept_fixture_proposal", { target_proposal: id.parse(proposalId), accepted }); if (error) throw new Error(error.message); refresh("/fixtures");
}

export async function createFixtureWindow(input: { homeTeamId: string; awayTeamId: string; startDay: string; endDay: string }) {
  await requireLeagueAdmin(); const parsed = z.object({ homeTeamId: id, awayTeamId: id, startDay: z.string().date(), endDay: z.string().date() }).parse(input); if (parsed.homeTeamId === parsed.awayTeamId) throw new Error("A team cannot play itself."); if (parsed.endDay < parsed.startDay) throw new Error("The final permitted day cannot precede the first.");
  const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("fixture_windows").insert({ home_team_id: parsed.homeTeamId, away_team_id: parsed.awayTeamId, start_day: parsed.startDay, end_day: parsed.endDay, status: "collecting_days" }); if (error) throw new Error(error.message); refresh("/fixtures", "/admin");
}

export async function publishFixtureProposal(proposalId: string, classification: "competitive" | "friendly") {
  await requireLeagueAdmin(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("publish_fixture_proposal", { target_proposal: id.parse(proposalId), classification }); if (error) throw new Error(error.message); refresh("/fixtures", "/dashboard", "/standings", "/admin");
}

export async function confirmMatchResult(input: { fixtureId: string; homeScore: number; awayScore: number; playerOfMatchId?: string; note?: string }) {
  await requireLeagueAdmin(); const parsed = z.object({ fixtureId: id, homeScore: integer.min(0).max(99), awayScore: integer.min(0).max(99), playerOfMatchId: id.optional(), note: text.max(1000).optional() }).parse(input);
  const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("confirm_fixture_result", { target_fixture: parsed.fixtureId, home_goals: parsed.homeScore, away_goals: parsed.awayScore, nominated_player_of_match: parsed.playerOfMatchId ?? null, note: parsed.note ?? null }); if (error) throw new Error(error.message); refresh("/fixtures", "/standings", "/dashboard", "/admin");
}

export async function addMatchEvent(input: { fixtureId: string; eventType: "goal" | "yellow_card" | "red_card" | "player_of_the_match" | "committee_note"; minute?: number; playerId?: string; assistId?: string; note?: string }) {
  await requireLeagueAdmin(); const parsed = z.object({ fixtureId: id, eventType: z.enum(["goal", "yellow_card", "red_card", "player_of_the_match", "committee_note"]), minute: integer.min(0).max(150).optional(), playerId: id.optional(), assistId: id.optional(), note: text.max(1000).optional() }).parse(input);
  const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("match_events").insert({ fixture_id: parsed.fixtureId, event_type: parsed.eventType, minute: parsed.minute ?? null, player_member_id: parsed.playerId ?? null, assist_member_id: parsed.assistId ?? null, note: parsed.note ?? null }); if (error) throw new Error(error.message); refresh("/fixtures", "/admin");
}

export async function setMarketApproval(enabled: boolean) { await requireLeagueAdmin(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("set_market_approval", { enabled }); if (error) throw new Error(error.message); refresh("/market", "/dashboard", "/admin"); }
export async function createTradeListing(playerId: string, basePrice: number) { await requireLeagueIdentity(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("create_trade_listing", { target_player: id.parse(playerId), price: integer.min(0).parse(basePrice) }); if (error) throw new Error(error.message); refresh("/market"); }
export async function createTradeOffer(threadId: string, bid: number, note?: string) { await requireLeagueIdentity(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("place_trade_offer", { target_thread: id.parse(threadId), bid: integer.min(0).parse(bid), note: text.max(600).optional().parse(note || undefined) ?? null }); if (error) throw new Error(error.message); refresh("/market"); }
export async function resolveTradeOffer(offerId: string, accepted: boolean) { await requireLeagueIdentity(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("resolve_trade_offer", { target_offer: id.parse(offerId), accepted }); if (error) throw new Error(error.message); refresh("/market", "/rosters", "/dashboard"); }
export async function postTradeMessage(threadId: string, body: string) { await requireLeagueIdentity(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("post_trade_message", { target_thread: id.parse(threadId), message_body: text.min(1).max(1200).parse(body) }); if (error) throw new Error(error.message); refresh("/market"); }

export async function sendTeamMessage(body: string) { const identity = await requireLeagueIdentity(); if (!identity.teamId) throw new Error("Only a manager can use a team room."); const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("private_team_messages").insert({ team_id: identity.teamId, author_id: identity.userId, body: text.min(1).max(1200).parse(body) }); if (error) throw new Error(error.message); refresh("/team-room"); }

export async function linkMemberAccount(input: { memberId: string; email: string }) {
  await requireLeagueAdmin(); const parsed = z.object({ memberId: id, email: z.string().email() }).parse(input); const admin = createSupabaseAdminClient(); const { data, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }); if (listError) throw new Error(listError.message); const user = data.users.find(candidate => candidate.email?.toLowerCase() === parsed.email.toLowerCase()); if (!user) throw new Error("That email has not signed in yet. Ask the member to request a secure sign-in link first."); const { error } = await admin.from("league_members").update({ auth_user_id: user.id, account_status: "active" }).eq("id", parsed.memberId); if (error) throw new Error(error.message); refresh("/admin", "/league");
}

export async function assignAdminSeat(seat: "owner" | "arish", email: string) {
  const identity = await requireLeagueAdmin(); if (identity.adminSeat !== "owner") throw new Error("Only the owner can assign administrator seats."); const admin = createSupabaseAdminClient(); const { data, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }); if (listError) throw new Error(listError.message); const user = data.users.find(candidate => candidate.email?.toLowerCase() === email.toLowerCase()); if (!user) throw new Error("That email has not signed in yet."); const { error } = await admin.from("admin_seats").update({ user_id: user.id }).eq("seat", seat); if (error) throw new Error(error.message); refresh("/admin", "/dashboard");
}

export async function recordAuctionOutcome(input: { playerId: string; status: "auction_in_progress" | "sold" | "unsold" | "not_called" | "unassigned"; buyerTeamId?: string; finalPrice?: number; note?: string }) {
  await requireLeagueAdmin(); const parsed = z.object({ playerId: id, status: z.enum(["auction_in_progress", "sold", "unsold", "not_called", "unassigned"]), buyerTeamId: id.optional(), finalPrice: integer.min(0).optional(), note: text.max(500).optional() }).parse(input); if (parsed.status === "sold" && (!parsed.buyerTeamId || parsed.finalPrice === undefined)) throw new Error("A sold result requires both a buyer team and a final price.");
  const admin = createSupabaseAdminClient(); const { data: existing, error: existingError } = await admin.from("auction_records").select("id,player_member_id,buyer_team_id").eq("player_member_id", parsed.playerId).single(); if (existingError) throw new Error(existingError.message);
  await admin.from("roster_entries").delete().eq("player_member_id", parsed.playerId);
  const buyer = parsed.status === "sold" ? parsed.buyerTeamId! : null; const finalPrice = parsed.status === "sold" ? parsed.finalPrice! : null;
  const { error } = await admin.from("auction_records").update({ status: parsed.status, buyer_team_id: buyer, final_bought_price: finalPrice, note: parsed.note ?? null, resolved_at: ["sold", "unsold"].includes(parsed.status) ? new Date().toISOString() : null }).eq("id", existing.id); if (error) throw new Error(error.message);
  if (buyer) { const { error: rosterError } = await admin.from("roster_entries").insert({ team_id: buyer, player_member_id: parsed.playerId, acquired_price: finalPrice, source: "auction" }); if (rosterError) throw new Error(rosterError.message); }
  for (const teamId of [existing.buyer_team_id, buyer].filter(Boolean)) await admin.rpc("recalculate_team_balance", { target_team: teamId });
  await admin.from("audit_events").insert({ action: "auction_record_updated", entity_type: "auction_record", entity_id: existing.id, detail: parsed.note ?? "Administrator updated an auction outcome." }); refresh("/admin", "/rosters", "/dashboard", "/league");
}
