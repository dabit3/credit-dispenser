import Link from "next/link";

export default function SiteHeader({ admin = false }: { admin?: boolean }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 bg-foreground" />
          <span className="text-sm font-medium tracking-tight">
            Credit Dispenser
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          {admin ? (
            <Link href="/admin" className="transition-colors hover:text-foreground">
              Admin
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
