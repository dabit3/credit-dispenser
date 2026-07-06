# Credit Dispenser

Dispense credit codes to event participants (hackathons, conferences, meetups). Admins create events with a list of eligible emails and a pool of unique codes; attendees visit the event's URL (e.g. `/hackathon-1`), enter their email, and receive a code if their email is on the list.

## Stack

- [Next.js](https://nextjs.org) (App Router) — deployed on Vercel
- [Convex](https://convex.dev) — database & realtime backend
- [Clerk](https://clerk.com) — admin authentication
- Tailwind CSS — monochromatic dark theme

## How it works

1. Admin creates an event (slug auto-generated from the name, or set/edited manually).
2. Admin pastes in the list of eligible emails and the pool of unique codes.
3. Attendees visit `/<slug>` and enter their email.
4. If the email is on the list, they're assigned an unclaimed code (idempotent — the same email always gets the same code back).
5. If not, they can't claim.

## Routes

- `/` — public list of events (newest first)
- `/<slug>` — public claim page for an event
- `/admin` — admin dashboard (Clerk-protected): create events
- `/admin/events/<id>` — manage an event: edit name/slug/description, emails, codes, see claim stats

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Convex + Clerk keys
npx convex dev               # in one terminal
npm run dev                  # in another
```

### Clerk + Convex auth

1. In Clerk, create a JWT template named `convex` (see [Convex Clerk docs](https://docs.convex.dev/auth/clerk)).
2. Set the issuer domain on your Convex deployment:
   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
   ```

Any signed-in Clerk user is treated as an admin — restrict sign-ups in the Clerk dashboard (e.g. invite-only) to control who can administer events.

## Deploy (Vercel)

Set `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` in Vercel, and use `npx convex deploy --cmd 'npm run build'` as the build command (with `CONVEX_DEPLOY_KEY` set) per the [Convex Vercel guide](https://docs.convex.dev/production/hosting/vercel).
