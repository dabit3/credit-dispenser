"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { fileToItems } from "@/lib/spreadsheet";

const inputClass =
  "mt-1.5 w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-dim focus:border-foreground";
const primaryButtonClass =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50";

const UPLOAD_CHUNK_SIZE = 500;

export default function ManageEvent({ id }: { id: Id<"events"> }) {
  const event = useQuery(api.events.get, { id });
  const emails = useQuery(api.emails.list, { eventId: id });
  const codes = useQuery(api.codes.list, { eventId: id });
  const addEmails = useMutation(api.emails.add);
  const removeEmail = useMutation(api.emails.remove);
  const addCodes = useMutation(api.codes.add);
  const removeCode = useMutation(api.codes.remove);

  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [codeStatus, setCodeStatus] = useState<string | null>(null);
  const [emailUploading, setEmailUploading] = useState(false);
  const [codeUploading, setCodeUploading] = useState(false);

  if (event === undefined) {
    return (
      <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />
    );
  }
  if (event === null) {
    return <p className="text-sm text-muted-foreground">Event not found.</p>;
  }

  const claimedCount = codes?.filter((c) => c.claimedBy).length ?? 0;

  async function handleAddEmails(e: React.FormEvent) {
    e.preventDefault();
    const list = emailInput.split(/[\n,;\s]+/).filter(Boolean);
    if (list.length === 0) return;
    const { added, skipped } = await addEmails({ eventId: id, emails: list });
    setEmailStatus(`Added ${added}, skipped ${skipped} (duplicates/invalid).`);
    setEmailInput("");
  }

  async function handleAddCodes(e: React.FormEvent) {
    e.preventDefault();
    const list = codeInput.split(/[\n,;\s]+/).filter(Boolean);
    if (list.length === 0) return;
    const { added, skipped } = await addCodes({ eventId: id, codes: list });
    setCodeStatus(`Added ${added}, skipped ${skipped} (duplicates).`);
    setCodeInput("");
  }

  async function importFile(
    file: File,
    kind: "emails" | "codes",
    send: (items: string[]) => Promise<{ added: number; skipped: number }>,
    setStatus: (status: string | null) => void,
    setUploading: (uploading: boolean) => void,
    skipNote: string
  ) {
    setUploading(true);
    try {
      const items = await fileToItems(file, kind);
      if (items.length === 0) {
        setStatus(`Nothing to import found in ${file.name}.`);
        return;
      }
      let added = 0;
      let skipped = 0;
      for (let i = 0; i < items.length; i += UPLOAD_CHUNK_SIZE) {
        setStatus(`Uploading ${i + 1}–${Math.min(i + UPLOAD_CHUNK_SIZE, items.length)} of ${items.length}...`);
        const res = await send(items.slice(i, i + UPLOAD_CHUNK_SIZE));
        added += res.added;
        skipped += res.skipped;
      }
      setStatus(`Added ${added}, skipped ${skipped} ${skipNote} from ${file.name}.`);
    } catch {
      setStatus(`Could not read ${file.name}. Upload a .csv or .xlsx file, or try again.`);
    } finally {
      setUploading(false);
    }
  }

  function handleEmailFile(file: File) {
    void importFile(
      file,
      "emails",
      (emails) => addEmails({ eventId: id, emails }),
      setEmailStatus,
      setEmailUploading,
      "(duplicates/invalid)"
    );
  }

  function handleCodeFile(file: File) {
    void importFile(
      file,
      "codes",
      (codes) => addCodes({ eventId: id, codes }),
      setCodeStatus,
      setCodeUploading,
      "(duplicates)"
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="text-xs text-muted-dim transition-colors hover:text-foreground"
          >
            ← All events
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {event.name}
          </h1>
        </div>
        <Link
          href={`/${event.slug}`}
          className="rounded-md border border-border-strong px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          /{event.slug} ↗
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-2xl font-semibold">{emails?.length ?? "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Eligible emails</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-2xl font-semibold">{codes?.length ?? "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Codes</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-2xl font-semibold">{codes ? claimedCount : "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Claimed</div>
        </div>
      </div>

      <EventDetailsForm key={event._id} event={event} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium tracking-tight">
              Eligible emails
            </h2>
            <UploadButton uploading={emailUploading} onFile={handleEmailFile} />
          </div>
          <form onSubmit={handleAddEmails} className="mt-4">
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              rows={4}
              placeholder={"one@example.com\ntwo@example.com"}
              className={`${inputClass} resize-y font-mono`}
            />
            {emailStatus ? (
              <p className="mt-2 text-xs text-muted-foreground">{emailStatus}</p>
            ) : null}
            <button type="submit" className={`${primaryButtonClass} mt-3`}>
              Add emails
            </button>
          </form>
          <ul className="mt-5 max-h-72 space-y-1 overflow-y-auto">
            {emails?.map((e) => (
              <li
                key={e._id}
                className="group flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-surface-hover"
              >
                <span className="font-mono text-xs">{e.email}</span>
                <button
                  onClick={() => removeEmail({ id: e._id })}
                  className="text-xs text-muted-dim opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                >
                  Remove
                </button>
              </li>
            ))}
            {emails && emails.length === 0 ? (
              <li className="py-2 text-xs text-muted-dim">No emails yet.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium tracking-tight">Codes</h2>
            <UploadButton uploading={codeUploading} onFile={handleCodeFile} />
          </div>
          <form onSubmit={handleAddCodes} className="mt-4">
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              rows={4}
              placeholder={"CODE-001\nCODE-002"}
              className={`${inputClass} resize-y font-mono`}
            />
            {codeStatus ? (
              <p className="mt-2 text-xs text-muted-foreground">{codeStatus}</p>
            ) : null}
            <button type="submit" className={`${primaryButtonClass} mt-3`}>
              Add codes
            </button>
          </form>
          <ul className="mt-5 max-h-72 space-y-1 overflow-y-auto">
            {codes?.map((c) => (
              <li
                key={c._id}
                className="group flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-surface-hover"
              >
                <span className="font-mono text-xs">{c.code}</span>
                <span className="flex items-center gap-3">
                  {c.claimedBy ? (
                    <span className="font-mono text-xs text-muted-dim">
                      claimed by {c.claimedBy}
                    </span>
                  ) : (
                    <button
                      onClick={() => removeCode({ id: c._id })}
                      className="text-xs text-muted-dim opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  )}
                </span>
              </li>
            ))}
            {codes && codes.length === 0 ? (
              <li className="py-2 text-xs text-muted-dim">No codes yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}

function UploadButton({
  uploading,
  onFile,
}: {
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-md border border-border-strong px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground ${
        uploading ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {uploading ? "Uploading..." : "Upload CSV/XLSX"}
      <input
        type="file"
        accept=".csv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

function EventDetailsForm({ event }: { event: Doc<"events"> }) {
  const updateEvent = useMutation(api.events.update);
  const removeEvent = useMutation(api.events.remove);
  const router = useRouter();

  const [name, setName] = useState(event.name);
  const [slug, setSlug] = useState(event.slug);
  const [description, setDescription] = useState(event.description ?? "");
  const [creditAmount, setCreditAmount] = useState(event.creditAmount ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);
    try {
      await updateEvent({
        id: event._id,
        name,
        slug,
        description: description || undefined,
        creditAmount: creditAmount || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this event and all of its emails and codes?")) return;
    await removeEvent({ id: event._id });
    router.push("/admin");
  }

  return (
    <form
      onSubmit={handleSave}
      className="mb-8 rounded-lg border border-border bg-surface p-6"
    >
      <h2 className="text-sm font-medium tracking-tight">Event details</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-muted-foreground">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Slug</label>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Credit amount</label>
          <input
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            placeholder="$100"
            className={inputClass}
          />
        </div>
      </div>
      {saveError ? <p className="mt-4 text-sm text-muted-foreground">{saveError}</p> : null}
      <div className="mt-5 flex items-center gap-4">
        <button type="submit" className={primaryButtonClass}>
          {saved ? "Saved" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-muted-dim transition-colors hover:text-foreground"
        >
          Delete event
        </button>
      </div>
    </form>
  );
}
