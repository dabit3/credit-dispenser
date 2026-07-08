"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export default function AdminNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const access = useQuery(
    api.admins.accessLevel,
    isAuthenticated ? {} : "skip"
  );

  // The global admin list is only relevant (and only accessible) to global admins.
  const links = [
    { href: "/admin", label: "Events" },
    ...(access?.isGlobalAdmin
      ? [{ href: "/admin/admins", label: "Admins" }]
      : []),
  ];

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin" || pathname.startsWith("/admin/events")
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
