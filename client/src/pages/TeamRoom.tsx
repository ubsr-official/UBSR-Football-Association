import LeagueNav from "@/components/LeagueNav";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { LockKeyhole, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TeamRoom() {
  const utils = trpc.useUtils();
  const { data: overview, isLoading } = trpc.league.overview.useQuery();
  const teamId = overview?.dashboard.team?.id;
  const { data: messages = [] } = trpc.chat.privateMessages.useQuery({ managerId: teamId ?? 0 }, { enabled: Boolean(teamId) });
  const [body, setBody] = useState("");
  const post = trpc.chat.postPrivateMessage.useMutation({ onSuccess: () => { setBody(""); if (teamId) utils.chat.privateMessages.invalidate({ managerId: teamId }); }, onError: error => toast.error(error.message) });
  return <LeagueNav><div className="mx-auto max-w-4xl space-y-7"><PageHeader eyebrow="Team communication" title="Private team room" description="This room is distinct from the public transfer desk. It is visible only to your manager and players currently recorded on this team." />
    {isLoading ? <p className="text-sm text-slate-500">Loading team access…</p> : !teamId ? <div className="league-card p-8"><LockKeyhole className="size-7 text-[#C2871F]" /><h2 className="mt-4 font-display text-2xl text-[#153126]">No team room available yet.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Your member record has not yet been attached to a roster. A private room will appear automatically once the auction assigns you to a team.</p></div> : <section className="league-card overflow-hidden"><div className="border-b border-[#1B4332]/10 bg-[#153126] px-6 py-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#E0A02C]">Restricted room</p><h2 className="mt-1 font-display text-2xl">{overview?.dashboard.team?.teamName}</h2></div><div className="min-h-80 space-y-4 p-6">{messages.length ? messages.map(message => <div key={message.id} className="max-w-2xl rounded-xl bg-[#F5F7F3] px-4 py-3"><p className="text-xs font-semibold text-[#153126]">{message.authorName ?? "Team member"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{message.body}</p></div>) : <p className="pt-8 text-center text-sm text-slate-500">No private messages yet. Start a team conversation.</p>}</div><div className="flex gap-3 border-t border-[#1B4332]/10 bg-[#FBFBF8] p-4"><Textarea value={body} onChange={event => setBody(event.target.value)} placeholder="Message your team" className="min-h-11 resize-none bg-white" /><Button size="icon" onClick={() => post.mutate({ managerId: teamId, body })} disabled={!body.trim() || post.isPending} className="size-11 bg-[#1B4332] hover:bg-[#153126]"><Send className="size-4" /></Button></div></section>}
  </div></LeagueNav>;
}
