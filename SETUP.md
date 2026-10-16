# Setup checklist: putting Grand Bay Biz online

Do these once, in order. Each step takes a few minutes. Cloudflare sometimes renames menu items; if a screen
does not match, send a screenshot to Claude and it will tell you what to click.

You already have: the domain grandbaybiz.com on Cloudflare (active), a GitHub account and this repository.

## 1. Create the database
Cloudflare dashboard > **Storage & databases** > **D1 SQL database** > **Create database**.
- Name: `grandbaybiz`
- After it is created, copy its **Database ID** (a long code like `3f2a...`). Send it to Claude, who will paste it into `wrangler.jsonc`.

## 2. Create the photo storage
Cloudflare dashboard > **Storage & databases** > **R2 object storage** > **Create bucket**.
- Name: `grandbaybiz-photos` (everything else default)
- R2 may ask you to add a payment card to activate it. The free allowance is far above what this directory needs, and normal use stays at $0.

## 3. Connect the code to Cloudflare
Cloudflare dashboard > **Workers & Pages** > **Create** > **Import a repository** (GitHub) > choose `jzerp/grandbaybiz`.
- Project name: `grandbaybiz`
- Build command: leave empty
- Deploy command: `npx wrangler d1 migrations apply DB --remote && npx wrangler deploy`
- Save and deploy. From now on, every change merged into the main branch goes live by itself within a minute or two.

## 4. Add the secrets
Workers & Pages > `grandbaybiz` > **Settings** > **Variables and secrets** > **Add** (type **Secret**):
| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | A long password only you know (this unlocks the review page) |
| `SESSION_SECRET` | A random string of 40+ characters (use your password manager's generator; never reuse it elsewhere) |
| `RESEND_API_KEY` | From step 6 |

Redeploy after adding secrets (Deployments > the three dots > Retry/Redeploy), or push any change.

## 5. Point the domain at the site
Workers & Pages > `grandbaybiz` > **Settings** > **Domains & routes** > **Add** > **Custom domain**.
- Add `grandbaybiz.com`, then `www.grandbaybiz.com`.
- DNS lives in the same Cloudflare account, so it connects itself. The site is then live at https://grandbaybiz.com.

## 6. Turn on email (so approvals and edit links reach neighbors)
1. Create a free account at resend.com (use grandbaybiz@gmail.com).
2. In Resend: **Domains** > **Add domain** > `grandbaybiz.com`. Resend shows a few DNS records. If it offers
   "Sign in to Cloudflare / Auto configure", use it; otherwise add each record in Cloudflare > **DNS** > **Records**
   exactly as shown (set the proxy to **DNS only**).
3. Wait until Resend shows the domain as **Verified** (usually a few minutes).
4. Resend > **API keys** > **Create** (permission: Sending access). Copy the key into the `RESEND_API_KEY` secret from step 4.
5. Email is sent from `hello@grandbaybiz.com`. Replies go to grandbaybiz@gmail.com.

## 7. Check that it works
1. Open https://grandbaybiz.com/add and add a test business with your own email. You should get the "We got your listing" email,
   and grandbaybiz@gmail.com should get "New listing to review".
2. Open https://grandbaybiz.com/admin, sign in, and approve it. Check that the page appears on the home page.
3. Open the private link from the email and make a small edit. Approve it in the admin page.
4. Delete the test listing in the admin page (Delete forever).

## 8. Before you announce it
- Have the HOA or a lawyer read the Terms of use (/terms) and the Privacy notice (/privacy). They are drafts.
- Invite 5 to 10 neighbors personally first, then post the link in the WhatsApp group.

## Optional: stronger spam protection
The form already has a hidden trap field and rate limits. If spam ever gets through, turn on Cloudflare Turnstile:
Cloudflare > **Turnstile** > add a widget for grandbaybiz.com, put the **site key** in the `TURNSTILE_SITE_KEY` variable
(`wrangler.jsonc`, ask Claude) and the **secret key** in a secret named `TURNSTILE_SECRET_KEY`.
