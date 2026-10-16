# Grand Bay Biz

A community business directory for Grand Bay (grandbaybiz.com). Neighbors submit a listing, the owner reviews and approves it, and approved listings appear on the public site.

- **Runtime:** one Cloudflare Worker (`src/index.js`) serving server-rendered pages and a small JSON API, with static files from `public/`.
- **Data:** Cloudflare D1 (`migrations/`), photos in R2 (`PHOTOS` binding). No framework, no build step.
- **Email:** Resend (`RESEND_API_KEY`). Without a key, emails are printed to the log (handy locally).
- **Access:** public site; `/admin` is protected by `ADMIN_PASSWORD` and a signed cookie (`SESSION_SECRET`).
- **Edit links:** stateless and signed: `/edit/<id>.<hmac>`; nothing secret is stored. Bump `token_ver` on a row to revoke its link.
- **Photos:** 1 to 3 per listing, resized in the browser before upload (`public/js/photopicker.js`), type/size checked in the Worker.

See `SETUP.md` (first-time setup) and `OWNERS-GUIDE.md` (running it day to day).

## Local development
```
npm install
echo "ADMIN_PASSWORD=test-password
SESSION_SECRET=any-long-random-string" > .dev.vars
npm run dev          # applies migrations locally, then serves http://localhost:8787
npm test
```

## Layout
```
src/index.js        routes and handlers (submit, edit, hide, resend, admin actions)
src/pages/*.js      HTML for each page      src/layout.js  shared header/footer/shell
src/lib/*.js        db, email, auth, photos, validation, rate limiting
public/             css, browser scripts, images, robots.txt
migrations/         D1 schema
```

Categories live in `src/categories.js`. Never change a category `key` once listings exist (names and blurbs are safe to edit).
