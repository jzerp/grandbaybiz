import { notFound, page } from './layout.js';
import { CATEGORIES, CATEGORY_BY_KEY } from './categories.js';
import { esc, html, json, nowIso, sha256Hex } from './lib/util.js';
import { ACK_VERSION, MIN_PHOTOS, MAX_PHOTOS, validateListing } from './lib/validate.js';
import * as db from './lib/db.js';
import { savePhoto, deletePhotos, keyFromPath } from './lib/photos.js';
import { sendEmail, mails } from './lib/email.js';
import { isAdmin, makeSession, sessionCookie, passwordOk, editUrl, listingFromToken } from './lib/auth.js';
import { underLimit, underLimitKey } from './lib/ratelimit.js';
import { turnstileOk } from './lib/turnstile.js';
import { renderHome } from './pages/home.js';
import { renderBusiness } from './pages/business.js';
import { renderAdd, renderEdit, renderResend, listingState } from './pages/forms.js';
import { renderAdmin, renderAdminLogin } from './pages/admin.js';
import { renderTerms, renderPrivacy } from './pages/legal.js';

const CSP = "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'";

function secure(res) {
  const h = new Headers(res.headers);
  h.set('x-content-type-options', 'nosniff');
  if (!h.has('referrer-policy')) h.set('referrer-policy', 'strict-origin-when-cross-origin');
  if ((h.get('content-type') || '').startsWith('text/html')) { h.set('content-security-policy', CSP); h.set('x-frame-options', 'DENY'); }
  return new Response(res.body, { status: res.status, headers: h });
}

export default {
  async fetch(req, env, ctx) {
    try { return secure(await route(req, env, ctx)); }
    catch (e) {
      console.error('unhandled', e && e.stack || e);
      const wantsJson = new URL(req.url).pathname.startsWith('/api/');
      return secure(wantsJson ? json({ ok: false, message: 'Something went wrong on our side. Please try again in a moment.' }, 500)
        : html(page(env, { title: 'Something went wrong', noindex: true, body: '<main id="main" class="page"><div class="wrap narrow"><div class="done"><h2>Something went wrong.</h2><p>Please try again in a moment.</p><a class="btn btn-teal" href="/">Back to the directory</a></div></div></main>' }), 500));
    }
  },
};

async function route(req, env, ctx) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const m = req.method;
  let r;

  if (m === 'GET' || m === 'HEAD') {
    if (path === '/') return html(renderHome(env, await db.listLive(env), url.searchParams.get('c')), 200, { 'cache-control': 'public, max-age=0, s-maxage=30, must-revalidate' });
    if (path === '/add') return html(renderAdd(env));
    if (path === '/resend') return html(renderResend(env));
    if (path === '/terms') return html(renderTerms(env));
    if (path === '/privacy') return html(renderPrivacy(env));
    if (path === '/sitemap.xml') return sitemap(env);
    if (path === '/admin') return (await isAdmin(env, req)) ? html(renderAdmin(env)) : html(renderAdminLogin(env));
    if (path === '/admin/export.csv' || path === '/admin/export.json') return adminExport(req, env, path.endsWith('csv'));
    if (path === '/api/admin/listings') return adminListings(req, env);
    if ((r = /^\/photos\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/.exec(path))) return servePhoto(env, r[1]);
    if ((r = /^\/edit\/([^/]+)$/.exec(path))) return editPage(req, env, r[1]);
    if (/^\/[a-z0-9][a-z0-9-]{0,79}$/.test(path)) return businessPage(env, path.slice(1));
    return html(notFound(env), 404);
  }

  if (m === 'POST') {
    if (path === '/api/submit') return submit(req, env, ctx);
    if (path === '/api/resend') return resend(req, env, ctx);
    if (path === '/admin/login') return adminLogin(req, env);
    if (path === '/admin/logout') return new Response(null, { status: 303, headers: { location: '/admin', 'set-cookie': sessionCookie('', req, true) } });
    if (path === '/api/admin/action') return adminAction(req, env, ctx);
    if ((r = /^\/api\/edit\/([^/]+)\/hide$/.exec(path))) return hide(req, env, r[1]);
    if ((r = /^\/api\/edit\/([^/]+)$/.exec(path))) return edit(req, env, ctx, r[1]);
  }
  return html(notFound(env), 404);
}

// ---------- public pages ----------

async function businessPage(env, slug) {
  const l = await db.getLiveBySlug(env, slug);
  if (!l) return html(notFound(env), 404);
  const others = (await db.listLive(env)).filter((x) => x.category === l.category && x.id !== l.id).slice(0, 3);
  return html(renderBusiness(env, l, others), 200, { 'cache-control': 'public, max-age=0, s-maxage=30, must-revalidate' });
}

async function servePhoto(env, name) {
  const obj = await env.PHOTOS.get(keyFromPath(name));
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', etag: obj.httpEtag } });
}

async function sitemap(env) {
  const rows = await db.listLive(env);
  const urls = [`${env.SITE_URL}/`, ...rows.map((l) => `${env.SITE_URL}/${l.slug}`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${esc(u)}</loc></url>`).join('')}</urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

// ---------- submitting and editing ----------

function readOrder(fd, files) {
  let order;
  try { order = JSON.parse(String(fd.get('order') || '[]')); } catch { return null; }
  if (!Array.isArray(order) || order.length > 10) return null;
  for (const o of order) {
    if (typeof o !== 'string') return null;
    const n = /^new:(\d+)$/.exec(o);
    if (n && Number(n[1]) >= files.length) return null;
  }
  return order;
}

const uploadedFiles = (fd) => fd.getAll('photos').filter((f) => f && typeof f !== 'string' && f.size > 0);
const fail = (errors, message, status = 400) => json({ ok: false, errors, message }, status);

async function submit(req, env, ctx) {
  if (!(await underLimit(env, req, 'submit', 15))) return fail({}, 'You have sent several listings in a short time. Please try again in an hour.', 429);
  let fd;
  try { fd = await req.formData(); } catch { return fail({}, 'We could not read that form. Please try again.'); }
  if (fd.get('company_url')) return json({ ok: true }); // honeypot: pretend success
  if (!(await turnstileOk(env, req, fd.get('cf-turnstile-response')))) return fail({}, 'We could not confirm you are a person. Please try again.');

  const { ok, errors, values } = validateListing(Object.fromEntries(['name', 'category', 'description', 'contact_name', 'phone', 'email', 'website'].map((k) => [k, fd.get(k)])));
  if (![1, 2, 3].every((i) => fd.get(`ack${i}`))) errors.acks = 'Please check all three boxes to continue.';
  const files = uploadedFiles(fd);
  const order = readOrder(fd, files);
  if (!order || order.some((o) => !o.startsWith('new:'))) errors.photos = 'Please add your photos again.';
  else if (order.length < MIN_PHOTOS || order.length > MAX_PHOTOS) errors.photos = `Please add ${MIN_PHOTOS} to ${MAX_PHOTOS} photos.`;
  if (!ok || Object.keys(errors).length) return fail(errors, 'Please fix the highlighted items.');

  const saved = [];
  try {
    for (const o of order) saved.push(await savePhoto(env, files[Number(o.slice(4))]));
  } catch (e) {
    await deletePhotos(env, saved);
    return fail({ photos: e.message }, e.message);
  }
  const { id } = await db.createListing(env, values, saved, ACK_VERSION);
  const listing = await db.getById(env, id);
  ctx.waitUntil((async () => {
    await sendEmail(env, mails.submitted(env, listing, await editUrl(env, listing)));
    await sendEmail(env, mails.adminNew(env, listing));
  })());
  return json({ ok: true });
}

async function editPage(req, env, token) {
  const l = await listingFromToken(env, token, db.getById);
  const headers = { 'referrer-policy': 'no-referrer' };
  if (!l) {
    return html(page(env, { title: 'Edit link not valid', noindex: true, body: '<main id="main" class="page"><div class="wrap narrow"><div class="done"><h2>This edit link is not valid.</h2><p>It may have been copied incorrectly. You can ask for a new one by email.</p><a class="btn btn-teal" href="/resend">Email me my link</a></div></div></main>' }), 404, headers);
  }
  return html(renderEdit(env, l, db.effective(l), token), 200, headers);
}

const sameFields = (a, b) => db.FIELDS.every((f) => (a[f] || '') === (b[f] || '')) && a.photos.join('|') === b.photos.join('|');

async function edit(req, env, ctx, token) {
  const l = await listingFromToken(env, token, db.getById);
  if (!l) return fail({}, 'This edit link is not valid. Please request a new one.', 404);
  if (!(await underLimit(env, req, 'edit', 30))) return fail({}, 'Too many saves in a short time. Please try again later.', 429);
  let fd;
  try { fd = await req.formData(); } catch { return fail({}, 'We could not read that form. Please try again.'); }
  if (fd.get('company_url')) return json({ ok: true, heading: 'Saved.', message: '' });

  const { ok, errors, values } = validateListing(Object.fromEntries(['name', 'category', 'description', 'contact_name', 'phone', 'email', 'website'].map((k) => [k, fd.get(k)])));
  const files = uploadedFiles(fd);
  const order = readOrder(fd, files);
  const allowedKeys = new Set([...l.photos, ...(l.pending ? l.pending.photos : [])]);
  if (!order || order.some((o) => !o.startsWith('new:') && !allowedKeys.has(o))) errors.photos = 'Please reload the page and try again.';
  else if (order.length < MIN_PHOTOS || order.length > MAX_PHOTOS) errors.photos = `Please keep ${MIN_PHOTOS} to ${MAX_PHOTOS} photos.`;
  if (!ok || Object.keys(errors).length) return fail(errors, 'Please fix the highlighted items.');

  const saved = [];
  let photos;
  try {
    photos = [];
    for (const o of order) {
      if (o.startsWith('new:')) { const k = await savePhoto(env, files[Number(o.slice(4))]); saved.push(k); photos.push(k); } else photos.push(o);
    }
  } catch (e) { await deletePhotos(env, saved); return fail({ photos: e.message }, e.message); }

  const t = nowIso();
  const proposed = { ...values, photos };
  const oldPending = l.pending ? l.pending.photos : [];

  if (l.status !== 'approved') {
    // Not yet live: edits replace the submission directly.
    const wasRejected = l.status === 'rejected';
    await env.DB.prepare(`UPDATE listings SET name=?, category=?, description=?, contact_name=?, phone=?, email=?, website=?, photos=?, status='pending', admin_note=?, updated_at=? WHERE id=?`)
      .bind(values.name, values.category, values.description, values.contact_name, values.phone, values.email, values.website, JSON.stringify(photos), wasRejected ? '' : l.admin_note, t, l.id).run();
    await deletePhotos(env, l.photos.filter((k) => !photos.includes(k)));
    if (wasRejected) ctx.waitUntil(sendEmail(env, mails.adminNew(env, { ...l, ...values })));
    return json({ ok: true, heading: wasRejected ? 'Sent for review.' : 'Changes saved.', message: 'Your listing is waiting for review. We will email you as soon as it is live.', statusLabel: 'Waiting for review', statusClass: 'st-pending' });
  }

  // Live listing: hold the edit for review; the live version stays public.
  if (sameFields({ ...values, photos }, l)) {
    await env.DB.prepare('UPDATE listings SET pending_json=NULL, pending_at=NULL, updated_at=? WHERE id=?').bind(t, l.id).run();
    await deletePhotos(env, oldPending.filter((k) => !l.photos.includes(k)));
    return json({ ok: true, heading: 'Nothing to change.', message: 'Your listing already looks like this, so there is nothing to review.', statusLabel: l.hidden ? 'Paused (hidden)' : 'Live', statusClass: l.hidden ? 'st-hidden' : 'st-live' });
  }
  await env.DB.prepare('UPDATE listings SET pending_json=?, pending_at=?, updated_at=? WHERE id=?').bind(JSON.stringify(proposed), t, t, l.id).run();
  await deletePhotos(env, oldPending.filter((k) => !l.photos.includes(k) && !photos.includes(k)));
  if (!l.pending) {
    ctx.waitUntil((async () => { await sendEmail(env, mails.editReceived(env, l)); await sendEmail(env, mails.adminEdit(env, l)); })());
  }
  return json({ ok: true, heading: 'Changes sent for review.', message: 'Your current listing stays public while we review them. We will email you as soon as your changes are approved.', statusLabel: 'Changes waiting for review', statusClass: 'st-pending' });
}

async function hide(req, env, token) {
  const l = await listingFromToken(env, token, db.getById);
  if (!l) return json({ ok: false, message: 'This edit link is not valid.' }, 404);
  if (l.status !== 'approved') return json({ ok: false, message: 'Your listing is not live yet.' }, 400);
  let body; try { body = await req.json(); } catch { return json({ ok: false, message: 'Bad request.' }, 400); }
  await env.DB.prepare('UPDATE listings SET hidden=?, updated_at=? WHERE id=?').bind(body.hidden ? 1 : 0, nowIso(), l.id).run();
  return json({ ok: true });
}

async function resend(req, env, ctx) {
  let body; try { body = await req.json(); } catch { return json({ ok: false, message: 'Bad request.' }, 400); }
  if (body.company_url) return json({ ok: true });
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, message: 'Please enter a valid email address.' }, 400);
  if (!(await underLimit(env, req, 'resend', 8))) return json({ ok: false, message: 'Too many requests. Please try again in an hour.' }, 429);
  // Same answer whether or not the address matches, so the form cannot be used to look up who is listed.
  if (await underLimitKey(env, `resend-email:${await sha256Hex(email)}`, 3)) {
    const rows = await db.listByEmail(env, email);
    if (rows.length) {
      const withUrls = await Promise.all(rows.map(async (r) => ({ ...r, editUrl: await editUrl(env, r) })));
      ctx.waitUntil(sendEmail(env, mails.resend(env, withUrls)));
    }
  }
  return json({ ok: true });
}

// ---------- admin ----------

const sameOrigin = (req) => { const o = req.headers.get('origin'); return !o || o === new URL(req.url).origin; };

async function adminLogin(req, env) {
  if (!sameOrigin(req)) return new Response('Forbidden', { status: 403 });
  if (!(await underLimit(env, req, 'login', 10))) return html(renderAdminLogin(env, 'Too many attempts. Please try again in an hour.'), 429);
  const fd = await req.formData().catch(() => null);
  if (fd && passwordOk(env, fd.get('password'))) {
    return new Response(null, { status: 303, headers: { location: '/admin', 'set-cookie': sessionCookie(await makeSession(env), req) } });
  }
  return html(renderAdminLogin(env, 'That password did not work.'), 401);
}

function adminView(l) {
  return {
    id: l.id, slug: l.slug, status: l.status, hidden: !!l.hidden,
    name: l.name, category: l.category, description: l.description, contact_name: l.contact_name, phone: l.phone, email: l.email, website: l.website,
    photos: l.photos, pending: l.pending, pending_at: l.pending_at, admin_note: l.admin_note,
    created_at: l.created_at, approved_at: l.approved_at, ack_at: l.ack_at,
    changes: l.pending ? db.describeChanges(l, l.pending) : [],
  };
}

async function adminListings(req, env) {
  if (!(await isAdmin(env, req))) return json({ ok: false }, 401);
  return json({ ok: true, categories: Object.fromEntries(CATEGORIES.map((c) => [c.key, c.name])), listings: (await db.listAll(env)).map(adminView) });
}

async function adminExport(req, env, csv) {
  if (!(await isAdmin(env, req))) return new Response('Sign in at /admin first.', { status: 401 });
  const rows = await db.listAll(env);
  const stamp = new Date().toISOString().slice(0, 10);
  if (!csv) return new Response(JSON.stringify(rows.map((l) => ({ ...adminView(l), url: `${env.SITE_URL}/${l.slug}` })), null, 2), { headers: { 'content-type': 'application/json', 'content-disposition': `attachment; filename="grandbaybiz-listings-${stamp}.json"` } });
  const cols = ['name', 'category', 'contact_name', 'phone', 'email', 'website', 'status', 'hidden', 'created_at', 'approved_at'];
  const q = (v) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const lines = [[...cols, 'url', 'description'].join(',')];
  for (const l of rows) lines.push([...cols.map((c) => q(l[c])), q(`${env.SITE_URL}/${l.slug}`), q(l.description)].join(','));
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="grandbaybiz-listings-${stamp}.csv"` } });
}

async function adminAction(req, env, ctx) {
  if (!(await isAdmin(env, req)) || !sameOrigin(req)) return json({ ok: false, message: 'Please sign in again.' }, 401);
  if (!(req.headers.get('content-type') || '').includes('application/json')) return json({ ok: false, message: 'Bad request.' }, 400);
  const b = await req.json().catch(() => ({}));
  const l = await db.getById(env, Number(b.id));
  if (!l) return json({ ok: false, message: 'Listing not found.' }, 404);
  const t = nowIso();
  const note = String(b.note || '').slice(0, 500).trim();
  const link = () => editUrl(env, l);
  const FIELD_SQL = `name=?, category=?, description=?, contact_name=?, phone=?, email=?, website=?`;

  switch (b.action) {
    case 'approve': {
      if (l.pending) {
        const p = l.pending;
        await env.DB.prepare(`UPDATE listings SET ${FIELD_SQL}, photos=?, pending_json=NULL, pending_at=NULL, updated_at=? WHERE id=?`)
          .bind(p.name, p.category, p.description, p.contact_name, p.phone, p.email, p.website, JSON.stringify(p.photos), t, l.id).run();
        await deletePhotos(env, l.photos.filter((k) => !p.photos.includes(k)));
        ctx.waitUntil(sendEmail(env, mails.editApproved(env, { ...l, ...p })));
        return json({ ok: true, message: `Changes to ${p.name} are live. The owner was emailed.` });
      }
      if (l.status === 'approved') return json({ ok: false, message: 'Already live.' });
      await env.DB.prepare("UPDATE listings SET status='approved', approved_at=?, admin_note='', hidden=0, updated_at=? WHERE id=?").bind(t, t, l.id).run();
      ctx.waitUntil((async () => sendEmail(env, mails.approved(env, l, await link())))());
      return json({ ok: true, message: `${l.name} is live. The owner was emailed.` });
    }
    case 'reject': {
      if (l.pending) {
        await env.DB.prepare('UPDATE listings SET pending_json=NULL, pending_at=NULL, admin_note=?, updated_at=? WHERE id=?').bind(note, t, l.id).run();
        await deletePhotos(env, l.pending.photos.filter((k) => !l.photos.includes(k)));
        ctx.waitUntil((async () => sendEmail(env, mails.editRejected(env, { ...l, admin_note: note }, await link())))());
        return json({ ok: true, message: 'Changes rejected. The listing stays live as it was, and the owner was emailed.' });
      }
      const wasLive = l.status === 'approved';
      await env.DB.prepare("UPDATE listings SET status='rejected', admin_note=?, updated_at=? WHERE id=?").bind(note, t, l.id).run();
      if (!wasLive) ctx.waitUntil((async () => sendEmail(env, mails.rejected(env, { ...l, admin_note: note }, await link())))());
      return json({ ok: true, message: wasLive ? `${l.name} was taken down.` : 'Listing rejected. The owner was emailed.' });
    }
    case 'reopen': {
      await env.DB.prepare("UPDATE listings SET status='pending', updated_at=? WHERE id=?").bind(t, l.id).run();
      return json({ ok: true, message: 'Moved back to pending.' });
    }
    case 'delete': {
      await deletePhotos(env, [...l.photos, ...(l.pending ? l.pending.photos : [])]);
      await env.DB.prepare('DELETE FROM listings WHERE id=?').bind(l.id).run();
      return json({ ok: true, message: `${l.name} was deleted.` });
    }
    case 'update': {
      const { ok, errors, values } = validateListing(b);
      if (!ok) return json({ ok: false, errors, message: 'Please fix the highlighted items.' }, 400);
      if (l.pending) {
        await env.DB.prepare('UPDATE listings SET pending_json=?, updated_at=? WHERE id=?').bind(JSON.stringify({ ...l.pending, ...values }), t, l.id).run();
      } else {
        await env.DB.prepare(`UPDATE listings SET ${FIELD_SQL}, updated_at=? WHERE id=?`).bind(values.name, values.category, values.description, values.contact_name, values.phone, values.email, values.website, t, l.id).run();
      }
      return json({ ok: true, message: 'Details saved.' });
    }
    default: return json({ ok: false, message: 'Unknown action.' }, 400);
  }
}
