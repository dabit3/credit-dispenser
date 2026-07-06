"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import SiteHeader from "@/components/SiteHeader";

type ClaimResult =
  | { ok: true; code: string; alreadyClaimed: boolean }
  | { ok: false; error: string };

export default function ClaimPage({ slug }: { slug: string }) {
  const event = useQuery(api.events.getBySlug, { slug });
  const claim = useMutation(api.claims.claim);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await claim({ slug, email });
      setResult(res);
    } catch {
      setResult({ ok: false, error: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        {event === undefined ? (
          <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />
        ) : event === null ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Event not found
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              There is no event at <span className="font-mono">/{slug}</span>.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-10 text-center">
              <div className="mb-4 inline-block rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
                /{event.slug}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {event.name}
              </h1>
              {event.description ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
              {event.creditAmount ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Credit: <span className="text-foreground">{event.creditAmount}</span>
                </p>
              ) : null}
            </div>

            {result?.ok ? (
              <div className="rounded-lg border border-border bg-surface p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {result.alreadyClaimed
                    ? "You already claimed a code. Here it is again:"
                    : "Your credit code:"}
                </p>
                <div className="mt-4 rounded-md border border-border-strong bg-background px-4 py-4 font-mono text-lg tracking-wider">
                  {result.code}
                </div>
                <button
                  onClick={() => copyCode(result.code)}
                  className="mt-4 rounded-md border border-border-strong px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  {copied ? "Copied" : "Copy code"}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-lg border border-border bg-surface p-8"
              >
                <label
                  htmlFor="email"
                  className="block text-sm font-medium tracking-tight"
                >
                  Enter your email to claim your code
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use the email address you registered with.
                </p>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-4 w-full rounded-md border border-border-strong bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-dim focus:border-foreground"
                />
                {result && !result.ok ? (
                  <p className="mt-3 text-sm text-muted-foreground">{result.error}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Checking..." : "Claim code"}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
