"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`, shouldCreateUser: false } });
    setBusy(false); setStatus(error ? error.message : "A secure sign-in link has been sent. Check your inbox.");
  }
  return <form className="hero-card form-stack" onSubmit={submit}><p className="eyebrow">Passwordless sign-in</p><h2 style={{ fontSize: "2rem" }}>Member email</h2><label><span className="label">Email address</span><input className="input" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label><button className="button" disabled={busy}>{busy ? "Sending link…" : "Send sign-in link"}</button>{status && <p className={status.includes("sent") ? "notice" : "danger"}>{status}</p>}<p style={{ fontSize: ".78rem", color: "var(--muted)", margin: 0 }}>Only invited and linked members can enter the league workspace.</p></form>;
}
