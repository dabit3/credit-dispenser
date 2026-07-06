"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdminDashboard() {
  const events = useQuery(api.events.list);
  const createEvent = useMutation(api.events.create);
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await createEvent({
        name,
        slug: slug || undefined,
        description: description || undefined,
        creditAmount: creditAmount || undefined,
      });
      router.push(`/admin/events/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create events and manage their emails and codes.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {showForm ? "Cancel" : "New event"}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="mb-10 rounded-lg border border-border bg-surface p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hackathon 1"
                className="mt-1.5 w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-dim focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Slug{" "}
                <span className="font-normal text-muted-dim">
                  (optional — generated from name)
                </span>
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="hackathon-1"
                className="mt-1.5 w-full rounded-md border border-border-strong bg-background px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-dim focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Description{" "}
                <span className="font-normal text-muted-dim">(optional)</span>
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Shown on the event page"
                className="mt-1.5 w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-dim focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Credit amount{" "}
                <span className="font-normal text-muted-dim">(optional)</span>
              </label>
              <input
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="$100"
                className="mt-1.5 w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-dim focus:border-foreground"
              />
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-muted-foreground">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create event"}
          </button>
        </form>
      ) : null}

      {events === undefined ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong p-12 text-center text-sm text-muted-foreground">
          No events yet. Create your first event to get started.
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event._id}>
              <Link
                href={`/admin/events/${event._id}`}
                className="group flex items-center justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover"
              >
                <div className="font-medium tracking-tight">{event.name}</div>
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
    </div>
  );
}
