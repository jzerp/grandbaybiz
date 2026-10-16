# Owner's guide: running Grand Bay Biz

## Every few days (5 minutes)
1. You get an email at grandbaybiz@gmail.com when a neighbor sends a new listing or an edit.
2. Open https://grandbaybiz.com/admin and sign in.
3. Pick the item in **Pending**. Read it and look at the photos.
   - **Approve and publish** (or **Approve changes** for an edit): it goes live and the owner is emailed.
   - **Edit details**: fix a typo or tighten wording before approving.
   - **Reject**: add an optional note, which is included in the email so the neighbor can fix and resend.
4. Edits to a live listing show a "Changed:" summary and the old and new text side by side. The old version stays public until you approve.

## Other things you can do in the admin page
- **Approved** tab: take down a listing (**Take down**), or fix details.
- **Rejected** tab: move a listing back to pending.
- **Delete forever**: removes the listing and its photos (asked to confirm).
- **Backup**: the links at the bottom download every listing as CSV or JSON. Do this now and then and keep the file somewhere safe.

## What neighbors can do
- Each approved business gets a private edit link by email. Edits wait for your approval.
- **Hide my listing** on the edit page pauses it right away (no approval needed) and they can turn it back on.
- **Lost your link?** (footer link /resend) emails it again to the address on the listing.

## Yearly
- Renew the domain at Squarespace (turn on auto-renew). It is about the only cost.

## If something looks wrong
- Site down or error page: open the Cloudflare dashboard > Workers & Pages > grandbaybiz > Deployments. The last working version can be restored with one click.
- Emails not arriving: check Resend (resend.com) > Logs, and that the domain still shows **Verified**.
- Forgot the admin password: Cloudflare > Workers & Pages > grandbaybiz > Settings > Variables and secrets, change `ADMIN_PASSWORD`, and redeploy.
- Anything else: open a Claude session, attach the `jzerp/grandbaybiz` repository and describe the problem.

## Changing the site
Ask Claude. Changes are made on a separate branch, you review a private preview, and approving it (merging in GitHub) publishes it.
Your listings are stored in the database and photo storage, not in the code, so updating the code never touches them.
