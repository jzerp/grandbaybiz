# Grand Bay Biz: project reference

*Written 2026-10-16, the day the site went live. Keep this offline as your reference. It contains no passwords or keys, only the names of where they are stored.*

## 1. What it is

A public directory where neighbors of the Grand Bay gated community list their small businesses.

- Site: **https://grandbaybiz.com** (tagline: "Support our local businesses. Grow the community.")
- Neighbors submit a listing at `/add`. You review it at `/admin` and approve it. Approved listings go live, each on its own shareable page (`grandbaybiz.com/<business-name>`).
- Owners edit through a private link sent by email (no accounts or passwords). Edits to a live listing wait for your approval, and the old version stays public until then. "Hide my listing" is immediate.
- Seven categories: Home services, Childcare & Tutoring, Beauty, Food & Catering, Pets, Events, Professional Services.
- Each listing: business name, what they do (30 to 500 characters), 1 to 3 photos, contact person, phone, email, optional website, optional Instagram.
- Distribution: the community WhatsApp group. Every business page has a "Share on WhatsApp" button.

## 2. Accounts and where things live

| What | Where | Notes |
|---|---|---|
| Domain name | Squarespace (bought there) | Renews yearly. DNS is managed in Cloudflare, not Squarespace. |
| Hosting, database, photo storage, DNS | Cloudflare (Free plan), login grandbaybiz@gmail.com | Worker `grandbaybiz`, database `grandbaybiz`, photo bucket `grandbaybiz-photos` |
| Code | GitHub: `jzerp/grandbaybiz`, branch `main` | A push to `main` redeploys the site automatically |
| Outgoing email | Resend (free plan), login grandbaybiz@gmail.com | Sends from `hello@grandbaybiz.com`; replies go to grandbaybiz@gmail.com |
| Notification and contact inbox | grandbaybiz@gmail.com | New-listing alerts arrive here |
| Admin page | https://grandbaybiz.com/admin | Password stored as a Cloudflare secret (`ADMIN_PASSWORD`) |
| Design mockup (reference only) | https://claude.ai/artifact/BeJSbkZ4EiR5hu6QJthzMi | Placeholder content; not the live site |
| Project notes | Claude project "Business Directory Grand Bay" | Status doc `grand-bay-directory-status.md` |

Cloudflare resource IDs (not secret): D1 database id `c4a89753-abd6-4b23-bcc2-612d8b35e96e`.

## 3. Tech stack

| Layer | Technology |
|---|---|
| Runtime and hosting | Cloudflare Workers (JavaScript, ES modules). Free plan. |
| Static files | Workers static assets (`public/`: CSS, JS, images, robots.txt) |
| Database | Cloudflare D1 (SQLite). Binding `DB`. Schema changes are numbered files in `migrations/`. |
| Photo storage | Cloudflare R2. Binding `PHOTOS`. Photos are served by the Worker at `/photos/<id>.<ext>`. |
| Pages | Server-rendered HTML from the Worker. No front-end framework and no build step. A little plain JavaScript runs in the browser for the forms, photo picker and admin screen. |
| Email | Resend HTTP API |
| Spam protection | Hidden honeypot field, per-IP and per-email rate limits stored in D1, optional Cloudflare Turnstile (off by default) |
| Source control and deploys | GitHub plus Cloudflare Workers Builds (Git-connected) |
| Command-line tool | `wrangler` (Cloudflare's CLI), version 4.151.x, Node.js 22 |
| Tests | Node's built-in test runner (`npm test`, 9 tests covering the validation rules) |

## 4. Dependencies

- **Runtime dependencies: none.** The site code uses no third-party packages.
- **Dev dependency: `wrangler` only** (see `package.json`). Used to run the site locally, apply database migrations and deploy.
- **External services the site relies on:** Cloudflare (Workers, D1, R2, DNS), Resend (email), GitHub (code and deploy trigger), Squarespace (domain registration), Gmail (the grandbaybiz@gmail.com inbox).
- If any of those accounts is closed or unpaid, the matching feature stops (domain renewal lapsing takes the whole site offline).

## 5. How it works

**Submitting.** A neighbor fills in `/add` and ticks three acknowledgements (public display of everything submitted; permission to use photos and text; owner responsible for licenses, insurance, taxes and HOA rules, and the directory does not endorse any business). Photos are resized in the browser (max 1600 px, about 450 KB each), then the Worker checks the file type by its contents (JPG, PNG or WebP, at most 2.5 MB). The listing is saved as *pending* and you get an email.

**Approving.** In `/admin` you open the Pending tab, review, and Approve or Reject (with an optional note). Approval emails the owner the business link and their private edit link.

**Editing.** The edit link is `grandbaybiz.com/edit/<token>`. The token is `<listing id>.<HMAC signature>`, signed with the `SESSION_SECRET` secret, so nothing secret is stored in the database. Edits to a live listing are held as a proposal until you approve them. Photos that are no longer used are deleted from storage.

**Lost link.** `/resend` emails the link again to the address on file. Rate limited.

**Admin sign-in.** One password. It sets a cookie that lasts 7 days (HttpOnly, SameSite=Strict). Admin actions also check the request origin.

**Safety rules built in.** Security headers and a content security policy on pages; edit pages send no referrer; `robots.txt` blocks search engines from `/admin`, `/edit/` and `/api/`; rate limits per hour: submit 15, edit 30, resend 8 per IP (plus 3 per email), admin login 10.

## 6. Data (one table plus a rate-limit table)

`listings`: id, slug (stable URL), token_ver, status (pending / approved / rejected), hidden, name, category, description, contact_name, phone, email, website, instagram (stored without the @), photos (list of storage keys), pending_json (an edit waiting for approval), pending_at, admin_note, ack_version and ack_at (which acknowledgement wording was accepted, and when), created_at, approved_at, updated_at.

`rate_limits`: counters used to throttle abuse.

Category keys (never rename): home, kids, beauty, food, pets, events, pro.

## 7. Configuration

Plain variables (in `wrangler.jsonc`): SITE_URL, SITE_NAME, ADMIN_EMAIL, CONTACT_EMAIL, MAIL_FROM.

Secrets (set in Cloudflare, Workers → grandbaybiz → Settings → Variables and Secrets, type Secret; they survive deploys):
- `ADMIN_PASSWORD`: the /admin password.
- `SESSION_SECRET`: signs admin sessions and edit links. **Do not change it casually: every edit link already emailed to owners stops working.**
- `RESEND_API_KEY`: lets the site send email. Without it, emails are only logged.
- Optional: `TURNSTILE_SECRET_KEY` plus the variable `TURNSTILE_SITE_KEY` to switch on Turnstile.

Store the secret values in your password manager. They cannot be read back from Cloudflare once saved.

## 8. Steps taken, in order

1. **Idea and viability.** Public directory for the community, cost and alternatives compared (Nextdoor, HOA portals, directory builders, no-code tools). Chose a small custom site on Cloudflare (domain about $12 to $20 per year, everything else free).
2. **Design.** Built a clickable mockup (home, category tiles, business page, add form, admin queue, phone view, owner edit page, lost-link page). Settled name, categories, fields, acknowledgements, edit-and-re-approve flow.
3. **Decisions.** Public site; name Grand Bay Biz; domain grandbaybiz.com; 3 acknowledgements; private edit links; WhatsApp as the distribution channel.
4. **Build.** Wrote the full site (pages, forms, admin, edit links, email, spam protection, legal page drafts, CSV/JSON export), tested it locally, and pushed it to GitHub.
5. **Accounts.** Bought the domain at Squarespace; created the Cloudflare account and moved the domain's nameservers to Cloudflare; created the GitHub account and installed the Claude GitHub app; created grandbaybiz@gmail.com as the notification inbox.
6. **Cloudflare setup.** Created the D1 database and R2 bucket; put the database id into `wrangler.jsonc`; connected the GitHub repo to Workers Builds with the deploy command `npx wrangler d1 migrations apply DB --remote && npx wrangler deploy`; added the variables and secrets.
7. **Custom domain.** Deleted the old Squarespace `A` records and the `_domainconnect` record in Cloudflare DNS (kept the three TXT email records), then connected `grandbaybiz.com` to the Worker.
8. **Email.** Created the Resend account, verified `grandbaybiz.com` (DNS records set to "DNS only"), created a Sending-access API key and saved it as `RESEND_API_KEY`.
9. **End-to-end test (passed).** Submit, both emails received, approve, edit link, public page.
10. **Changes after launch.** Minimum photos lowered from 2 to 1; description must be at least 30 characters; optional Instagram field added (new migration `0002_instagram.sql`, applied automatically on deploy).

## 9. Running it day to day

- **Every few days:** open `/admin`, review the Pending tab (new listings and edits), approve or reject.
- **Backup:** `/admin` has CSV and JSON export. It saves the listing text, not the photos (photos live in R2).
- **Change the code:** the code is on GitHub. Make or request the change, commit to `main`, and Cloudflare rebuilds and deploys by itself in a minute or two (Workers → grandbaybiz → Deployments shows progress). Do not paste code into Cloudflare by hand.
- **Database changes:** add a new numbered file in `migrations/` (never edit an old one). The deploy command applies it.
- **See what went wrong:** Cloudflare → Workers → grandbaybiz → Observability / Logs (may need to be switched on first). Email problems: Resend → Logs.
- **Local testing (optional):** `npm install`, put test values in a `.dev.vars` file (never commit it), then `npm run dev`.

## 10. Costs and renewals

- Domain: about $12 to $20 per year, renewed at Squarespace. Turn on auto-renew.
- Cloudflare Free plan, GitHub free, Resend free plan: $0 at this size. Free-plan limits change, so check current limits on each provider's pricing page if the directory grows to hundreds of listings or heavy traffic.
- Rough scale: 100 businesses with 3 photos each is about 90 MB of photo storage.

## 11. If something looks wrong

| Symptom | First thing to check |
|---|---|
| Site is down or shows an error | Cloudflare → Workers → grandbaybiz → Deployments (did the last build fail?), and that the domain has not expired |
| Emails not arriving | Spam folder; Resend → Logs; Resend domain still "Verified"; `RESEND_API_KEY` secret present |
| Can't sign in to /admin | Reset `ADMIN_PASSWORD` in Cloudflare secrets |
| Owner lost the edit link | They use the "Lost your link?" page (`/resend`), which emails it to the address on file |
| Spam listings appearing | Reject them; turn on Turnstile (see SETUP.md, "Optional: stronger spam protection") |
| A new deploy broke something | In GitHub, revert the last commit on `main`; Cloudflare redeploys the previous version |

## 12. Still to do before announcing

1. Delete the test listing(s) in `/admin`.
2. Have a lawyer or the HOA review `/terms`, `/privacy` and the acknowledgement wording (they are drafts).
3. Add 5 to 10 real businesses so the directory is not empty.
4. Confirm you may post in the WhatsApp group (or get the admin's OK) and that the HOA has no objection to the Grand Bay name and home-based businesses.
5. Post the announcement.

## 13. Files in the repo

`src/index.js` (routes and handlers) · `src/layout.js` · `src/categories.js` · `src/pages/*` (home, business, forms, admin, legal) · `src/lib/*` (validate, db, auth, email, photos, ratelimit, turnstile, util) · `public/` (CSS, browser JS, images, robots.txt) · `migrations/` · `test/` · `wrangler.jsonc` · `README.md` · `SETUP.md` (setup checklist) · `OWNERS-GUIDE.md` (day-to-day guide) · `docs/PROJECT-REFERENCE.md` (this file).

## 14. Rebuilding from scratch (if you ever have to)

1. Clone the repo from GitHub. 2. Create a Cloudflare D1 database and R2 bucket and put their names and ids in `wrangler.jsonc`. 3. Connect the repo to Workers Builds with the deploy command above. 4. Add the secrets. 5. Attach the domain. 6. Re-verify the domain in Resend. 7. Import listings from your latest CSV/JSON export if the database was lost (photos need their own backup).
