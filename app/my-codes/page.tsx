"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, Copy, LogIn, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useConvexAuth, useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { formatEventDate } from "@/lib/event-date";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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

// creditAmount is free text; prefix "$" only when it starts with a number
// so already-prefixed values ("$100") or other currencies stay untouched.
function formatCredits(amount: string) {
  const trimmed = amount.trim();
  return /^\d/.test(trimmed) ? `$${trimmed}` : trimmed;
}

export default function MyCodesPage() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const codes = useQuery(api.claims.myCodes, isAuthenticated ? {} : "skip");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="flex-1 bg-dotgrid px-4 py-10 sm:px-6 sm:py-16"
      >
        <div className="mx-auto w-full max-w-2xl">
          <p className="eyebrow text-muted-foreground">Your claims</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            My codes<span className="text-brand">.</span>
          </h1>
          <div className="mt-10">
            {authLoading || (isAuthenticated && codes === undefined) ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            ) : !isAuthenticated ? (
              <Empty className="border border-dashed border-border-strong py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LogIn />
                  </EmptyMedia>
                  <EmptyTitle>Sign in to see your codes</EmptyTitle>
                  <EmptyDescription>
                    Your claimed credit codes are tied to your verified email
                    address.
                  </EmptyDescription>
                </EmptyHeader>
                <SignInButton mode="modal">
                  <Button variant="brand">
                    <LogIn data-icon="inline-start" />
                    Sign in
                  </Button>
                </SignInButton>
              </Empty>
            ) : !codes || codes.length === 0 ? (
              <Empty className="border border-dashed border-border-strong py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Ticket />
                  </EmptyMedia>
                  <EmptyTitle>No codes claimed yet</EmptyTitle>
                  <EmptyDescription>
                    When you claim a credit code for an event, it will show up
                    here.
                  </EmptyDescription>
                </EmptyHeader>
                <Button variant="brand" render={<Link href="/" />} nativeButton={false}>
                  Browse events
                  <ArrowUpRight data-icon="inline-end" />
                </Button>
              </Empty>
            ) : (
              <ul className="flex flex-col gap-4">
                {codes.map((item) => (
                  <li key={item.code}>
                    <ClaimedCodeCard {...item} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ClaimedCodeCard({
  code,
  eventName,
  eventSlug,
  creditAmount,
  eventDate,
}: {
  code: string;
  eventName: string;
  eventSlug?: string;
  creditAmount?: string;
  eventDate?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="gap-2 border-b border-border py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="font-heading text-xl font-semibold tracking-[-0.02em] text-balance">
            {eventSlug ? (
              <Link
                href={`/${eventSlug}`}
                className="rounded-sm transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                {eventName}
              </Link>
            ) : (
              eventName
            )}
          </CardTitle>
          {eventDate ? (
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatEventDate(eventDate)}
            </span>
          ) : null}
        </div>
        {creditAmount ? (
          <CardDescription className="text-sm">
            {formatCredits(creditAmount)} in credits
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
        <span className="font-mono text-lg font-medium tracking-[0.08em] break-all select-all">
          {code}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCode}
          className="shrink-0 text-muted-foreground"
        >
          {copied ? (
            <>
              <Check data-icon="inline-start" />
              Copied
            </>
          ) : (
            <>
              <Copy data-icon="inline-start" />
              Copy
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
