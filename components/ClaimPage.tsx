"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Copy,
  LockKeyhole,
  LogIn,
  OctagonX,
  SearchX,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { formatEventDate } from "@/lib/event-date";
import {
  type ClaimWindowStatus,
  formatCountdown,
  formatDateTime,
  getWindowStatus,
} from "@/lib/event-schedule";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

type ClaimResult =
  | {
      ok: true;
      code: string;
      alreadyClaimed: boolean;
      creditAmount?: string;
    }
  | { ok: false; error: string };

// creditAmount is free text; prefix "$" only when it starts with a number
// so already-prefixed values ("$100") or other currencies stay untouched.
function formatCredits(amount: string) {
  const trimmed = amount.trim();
  return /^\d/.test(trimmed) ? `$${trimmed}` : trimmed;
}

function urlLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Ticks every second while `active`, so countdowns stay live and the window
// state flips on its own when a boundary is crossed.
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

export default function ClaimPage({ slug }: { slug: string }) {
  const event = useQuery(api.events.getBySlug, { slug });
  const claim = useMutation(api.claims.claim);
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [copied, setCopied] = useState(false);

  const startTime = event?.startTime;
  const endTime = event?.endTime;
  const hasWindow = startTime !== undefined || endTime !== undefined;
  const now = useNow(hasWindow);
  const windowStatus = getWindowStatus(now, startTime, endTime);
  const canClaim = windowStatus === "open";

  const signedInEmail = user?.primaryEmailAddress?.emailAddress;

  async function handleClaim() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await claim({ slug });
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
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center bg-dotgrid px-4 py-10 sm:px-6 sm:py-16"
      >
        <div className="w-full max-w-md">
          {event === undefined ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : event === null ? (
            <Empty className="border border-dashed border-border-strong py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>Event not found</EmptyTitle>
                <EmptyDescription>
                  There is no event at <span className="font-mono">/{slug}</span>.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : result?.ok ? (
            <Receipt
              eventName={event.name}
              creditAmount={result.creditAmount}
              code={result.code}
              alreadyClaimed={result.alreadyClaimed}
              copied={copied}
              onCopy={copyCode}
            />
          ) : (
            <Card className="gap-0 py-0 [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
              <CardHeader className="gap-4 border-b border-border py-(--card-spacing)">
                <CardTitle className="font-heading text-3xl font-semibold tracking-[-0.02em] text-balance">
                  {event.name}
                </CardTitle>
                {event.description ? (
                  <CardDescription className="text-sm leading-relaxed">
                    {event.description}
                  </CardDescription>
                ) : null}
                {event.eventDate || event.eventUrl ? (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {event.eventDate ? (
                      <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {formatEventDate(event.eventDate)}
                      </span>
                    ) : null}
                    {event.eventUrl ? (
                      <a
                        href={event.eventUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex w-fit items-center gap-1.5 rounded-sm font-mono text-xs text-muted-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                      >
                        {urlLabel(event.eventUrl)}
                        <ArrowUpRight
                          className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden
                        />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-6 py-(--card-spacing)">
                <ClaimWindow
                  status={windowStatus}
                  now={now}
                  startTime={startTime}
                  endTime={endTime}
                />
                {windowStatus === "closed" ? null : authLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-12 rounded-md" />
                    <Skeleton className="h-10 rounded-lg" />
                  </div>
                ) : !isAuthenticated ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Sign in with the email you registered with — codes are
                      only dispensed to verified addresses.
                    </p>
                    <SignInButton mode="modal">
                      <Button variant="brand" size="lg" className="w-full">
                        <LogIn data-icon="inline-start" />
                        Sign in to claim
                      </Button>
                    </SignInButton>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <BadgeCheck
                          className="size-4 shrink-0 text-brand"
                          aria-hidden
                        />
                        <span className="truncate font-mono text-sm">
                          {signedInEmail ?? "Signed in"}
                        </span>
                      </span>
                      <SignOutButton redirectUrl={`/${slug}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground"
                        >
                          Switch account
                        </Button>
                      </SignOutButton>
                    </div>
                    {result && !result.ok ? (
                      <Alert variant="destructive">
                        <OctagonX />
                        <AlertTitle>{result.error}</AlertTitle>
                      </Alert>
                    ) : null}
                    <Button
                      variant="brand"
                      size="lg"
                      disabled={submitting || !canClaim}
                      className="w-full"
                      onClick={handleClaim}
                      aria-busy={submitting}
                      aria-live="polite"
                    >
                      {submitting ? (
                        <>
                          <Spinner data-icon="inline-start" />
                          Checking the list...
                        </>
                      ) : !canClaim ? (
                        "Claiming not open yet"
                      ) : (
                        "Dispense my code"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ClaimWindow({
  status,
  now,
  startTime,
  endTime,
}: {
  status: ClaimWindowStatus;
  now: number;
  startTime?: number;
  endTime?: number;
}) {
  if (status === "before" && startTime !== undefined) {
    return (
      <div
        className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-background px-5 py-6 text-center"
        role="timer"
        aria-live="off"
      >
        <span className="eyebrow flex items-center gap-1.5 text-muted-foreground">
          <Timer className="size-3.5" aria-hidden />
          Claiming opens in
        </span>
        <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
          {formatCountdown(startTime - now)}
        </span>
        <span className="text-xs text-muted-dim">
          {formatDateTime(startTime)}
        </span>
      </div>
    );
  }

  if (status === "open" && endTime !== undefined) {
    return (
      <div className="flex items-center justify-center gap-1.5 font-mono text-xs text-muted-foreground tabular-nums">
        <Clock className="size-3.5" aria-hidden />
        <span>Claiming closes in {formatCountdown(endTime - now)}</span>
      </div>
    );
  }

  if (status === "closed") {
    return (
      <Alert>
        <LockKeyhole />
        <AlertTitle>Claiming has closed for this event.</AlertTitle>
        {endTime !== undefined ? (
          <AlertDescription>Closed {formatDateTime(endTime)}.</AlertDescription>
        ) : null}
      </Alert>
    );
  }

  return null;
}

function Receipt({
  eventName,
  creditAmount,
  code,
  alreadyClaimed,
  copied,
  onCopy,
}: {
  eventName: string;
  creditAmount?: string;
  code: string;
  alreadyClaimed: boolean;
  copied: boolean;
  onCopy: (code: string) => void;
}) {
  return (
    <div
      className="receipt-edge rounded-t-xl border border-border bg-surface pb-10"
      role="status"
    >
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-muted-foreground">
            Code dispensed
          </span>
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:animate-none [animation-duration:2.5s]" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
        </div>

        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
            {eventName}
          </h1>
          {creditAmount ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCredits(creditAmount)} in credits
            </p>
          ) : null}
        </div>

        {alreadyClaimed ? (
          <Badge variant="secondary" className="self-start">
            Already claimed — here it is again
          </Badge>
        ) : null}

        <div className="rounded-lg border border-dashed border-border-strong bg-background px-5 py-6 text-center">
          <div className="eyebrow text-muted-dim">Your credit code</div>
          <div className="mt-3 font-mono text-2xl font-medium tracking-[0.08em] break-all select-all">
            {code}
          </div>
        </div>

        <Button variant="brand" size="lg" onClick={() => onCopy(code)}>
          {copied ? (
            <>
              <Check data-icon="inline-start" />
              Copied
            </>
          ) : (
            <>
              <Copy data-icon="inline-start" />
              Copy code
            </>
          )}
        </Button>

        <div aria-hidden className="flex flex-col gap-2 pt-2">
          <div className="h-8 w-full bg-[repeating-linear-gradient(90deg,var(--color-border-strong)_0_2px,transparent_2px_5px,var(--color-border-strong)_5px_6px,transparent_6px_11px)]" />
          <div className="flex items-center justify-between">
            <span className="eyebrow text-muted-dim">Keep this somewhere safe</span>
            <span className="font-mono text-[10px] text-muted-dim">
              NO.{code.slice(-4).toUpperCase().padStart(4, "0")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
