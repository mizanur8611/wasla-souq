"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@waslasouq.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Login failed");
      if (body.role !== "admin") {
        throw new Error("This login belongs to a different panel.");
      }
      router.push("/admin-panel/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm rounded-2xl bg-paper p-7">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck size={22} className="text-gold" />
          <div>
            <div className="font-display text-lg font-bold text-ink">Admin Panel</div>
            <div className="text-xs text-muted">Wasla Souq</div>
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>

        <label className="mb-1 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <p className="mb-4 text-[11px] text-muted">Demo password from seed data: admin123</p>

        {error && <p className="mb-3 text-sm font-semibold text-clay">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-xl bg-ink py-3 text-sm font-bold text-sand disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
