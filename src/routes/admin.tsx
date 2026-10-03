import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Astra Music" },
      { name: "description", content: "Private admin area for Astra Music." },
      { property: "og:title", content: "Admin — Astra Music" },
      { property: "og:description", content: "Private admin area for Astra Music." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Row = { id: string; message: string; rating: number | null; status: string; created_at: string };
type Stats = { today_visitors: number; total_visitors: number; total_visits: number };

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <main className="admin-page">
      <header className="admin-top">
        <Link to="/" className="admin-brand">ASTRA <span>admin</span></Link>
        {session && <button className="admin-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>}
      </header>
      {!ready ? <p className="admin-muted">Loading…</p>
        : !session ? <AuthForm />
        : isAdmin === null ? <p className="admin-muted">Checking access…</p>
        : !isAdmin ? <div className="admin-card admin-center"><h1>This page is private</h1><p className="admin-muted">Your account doesn't have access.</p></div>
        : <Dashboard />}
    </main>
  );
}

function AuthForm() {
  const [mode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ ok: false, text: error.message.includes("confirm") ? "Please confirm your email first (check your inbox)." : "Wrong email or password." });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      if (error) setMsg({ ok: false, text: error.message });
      else { setMsg({ ok: true, text: "Check your email and click the confirmation link, then sign in here." }); }
    }
    setBusy(false);
  };

  return (
    <form className="admin-card admin-auth" onSubmit={submit}>
      <h1>{mode === "in" ? "Admin sign in" : "Create owner account"}</h1>
      <label>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className="admin-primary" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</button>
      {msg && <p className={msg.ok ? "admin-ok" : "admin-err"} role="status">{msg.text}</p>}
    </form>
  );
}

function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [downloads, setDownloads] = useState<number | null>(null);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const [c, s, d] = await Promise.all([
      supabase.from("astra_comments").select("id, message, rating, status, created_at").order("created_at", { ascending: false }).limit(500),
      supabase.rpc("visit_stats"),
      supabase.from("site_downloads").select("id", { count: "exact", head: true }),
    ]);
    if (!d.error) setDownloads(d.count ?? 0);
    if (c.error) setErr("Could not load messages."); else setRows(c.data ?? []);
    const st = Array.isArray(s.data) ? s.data[0] : s.data;
    if (st) setStats({ today_visitors: Number(st.today_visitors), total_visitors: Number(st.total_visitors), total_visits: Number(st.total_visits) });
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    const { error } = await supabase.from("astra_comments").update({ status }).eq("id", id);
    if (error) { setErr("Update failed."); load(); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this message permanently?")) return;
    setRows((r) => r.filter((x) => x.id !== id));
    const { error } = await supabase.from("astra_comments").delete().eq("id", id);
    if (error) { setErr("Delete failed."); load(); }
  };

  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const shown = rows.filter((r) => r.status === tab);
  const rated = rows.filter((r) => r.rating && r.status !== "rejected");
  const ratingTotal = rated.length;
  const ratingAvg = ratingTotal ? rated.reduce((n, r) => n + (r.rating ?? 0), 0) / ratingTotal : 0;
  const perStar = [5, 4, 3, 2, 1].map((n) => ({ n, c: rated.filter((r) => r.rating === n).length }));

  return (
    <div className="admin-dash">
      <section className="admin-stats">
        <div className="admin-stat"><span>People today</span><strong>{stats?.today_visitors ?? "—"}</strong></div>
        <div className="admin-stat"><span>People all time</span><strong>{stats?.total_visitors ?? "—"}</strong></div>
        <div className="admin-stat"><span>Total visits</span><strong>{stats?.total_visits ?? "—"}</strong></div>
      </section>
      <section className="admin-card admin-ratings">
        <div className="admin-rating-head"><strong>{ratingTotal ? ratingAvg.toFixed(1) : "—"}</strong><span>★ average · {ratingTotal} rating{ratingTotal === 1 ? "" : "s"} (rejected not counted)</span></div>
        <div className="admin-rating-head"><strong>{downloads ?? "—"}</strong><span>download clicks (real, from this site)</span></div>
        {perStar.map(({ n, c }) => (
          <div key={n} className="admin-bar"><span>{n}★</span><div><i style={{ width: ratingTotal ? `${(c / ratingTotal) * 100}%` : "0%" }} /></div><em>{c}</em></div>
        ))}
      </section>
      <div className="admin-tabs">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "pending" ? "Waiting" : t === "approved" ? "Approved" : "Rejected"} <em>{count(t)}</em>
          </button>
        ))}
        <button className="admin-ghost" onClick={load}>Refresh</button>
      </div>
      {err && <p className="admin-err">{err}</p>}
      <ul className="admin-list">
        {shown.length === 0 ? <li className="admin-muted">No messages here.</li> : shown.map((r) => (
          <li key={r.id} className="admin-card">
            {r.rating ? <p className="admin-stars" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p> : null}
            <p className="admin-msg">{r.message}</p>
            <div className="admin-row">
              <time>{new Date(r.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
              <div className="admin-actions">
                {r.status !== "approved" && <button className="admin-primary" onClick={() => setStatus(r.id, "approved")}>Approve</button>}
                {r.status !== "rejected" && <button className="admin-ghost" onClick={() => setStatus(r.id, "rejected")}>Reject</button>}
                <button className="admin-danger" onClick={() => remove(r.id)}>Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
