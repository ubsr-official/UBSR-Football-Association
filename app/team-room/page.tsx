import { AppShell } from "@/components/app-shell";
import { TeamRoom } from "./team-room";
import { getLeagueIdentity } from "@/lib/league";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TeamRoomPage() { const identity = await getLeagueIdentity(); const supabase = await createSupabaseServerClient(); const [{ data: team }, { data: messages }] = identity?.teamId ? await Promise.all([supabase.from("teams").select("name,short_name,logo_path").eq("id", identity.teamId).single(), supabase.from("private_team_messages").select("id,body,created_at,author:profiles!private_team_messages_author_id_fkey(display_name)").eq("team_id", identity.teamId).order("created_at", { ascending: true })]) : [{ data: null }, { data: [] }]; return <AppShell><div className="page-head"><div><p className="eyebrow">Private manager space</p><h1>Your team room.</h1><p>This channel is separate from public trade threads. Only the manager team’s authenticated accounts can read it; administrators do not have access unless they are part of that team.</p></div></div><TeamRoom team={team} messages={messages ?? []} isManager={Boolean(identity?.teamId)} /></AppShell>; }
