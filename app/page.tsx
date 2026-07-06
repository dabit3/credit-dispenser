"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import SiteHeader from "@/components/SiteHeader";

export default function Home() {
  const events = useQuery(api.events.list);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader admin />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select your event to claim your credit code.
          </p>
        </div>

        {events === undefined ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg border border-border bg-surface"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong p-12 text-center text-sm text-muted-foreground">
            No events yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event._id}>
                <Link
                  href={`/${event.slug}`}
                  className="group flex items-center justify-between rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-hover"
                >
                  <div>
                    <div className="font-medium tracking-tight">
                      {event.name}
                    </div>
                    {event.description ? (
                      <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {event.description}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-muted-dim">
                      /{event.slug}
                    </span>
                    <span className="text-muted-dim transition-transform group-hover:translate-x-0.5 group-hover:text-foreground">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-dim">
        Credit Dispenser
      </footer>
    </div>
  );
}
