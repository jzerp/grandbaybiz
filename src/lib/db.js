import { nowIso, slugify } from './util.js';

export const parsePhotos = (s) => { try { const a = JSON.parse(s || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
export const parsePending = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

export function hydrate(row) {
  if (!row) return null;
  return { ...row, photos: parsePhotos(row.photos), pending: parsePending(row.pending_json) };
}

export async function getLiveBySlug(env, slug) {
  const row = await env.DB.prepare("SELECT * FROM listings WHERE slug = ? AND status = 'approved' AND hidden = 0").bind(slug).first();
  return hydrate(row);
}

export async function listLive(env) {
  const { results } = await env.DB.prepare("SELECT * FROM listings WHERE status = 'approved' AND hidden = 0 ORDER BY approved_at DESC, id DESC").all();
  return results.map(hydrate);
}

export async function getById(env, id) {
  return hydrate(await env.DB.prepare('SELECT * FROM listings WHERE id = ?').bind(id).first());
}

export async function listByEmail(env, email) {
  const { results } = await env.DB.prepare('SELECT * FROM listings WHERE email = ? ORDER BY id').bind(email).all();
  return results.map(hydrate);
}

export async function listAll(env) {
  const { results } = await env.DB.prepare('SELECT * FROM listings ORDER BY id DESC').all();
  return results.map(hydrate);
}

async function uniqueSlug(env, name) {
  const base = slugify(name);
  const reserved = new Set(['add', 'admin', 'api', 'edit', 'resend', 'photos', 'terms', 'privacy', 'css', 'js', 'img', 'robots-txt', 'sitemap-xml', 'favicon-ico']);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    if (reserved.has(slug)) continue;
    const hit = await env.DB.prepare('SELECT 1 FROM listings WHERE slug = ?').bind(slug).first();
    if (!hit) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function createListing(env, v, photos, ackVersion) {
  const slug = await uniqueSlug(env, v.name);
  const t = nowIso();
  const res = await env.DB.prepare(
    `INSERT INTO listings (slug, status, name, category, description, contact_name, phone, email, website, instagram, photos, ack_version, ack_at, created_at, updated_at)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(slug, v.name, v.category, v.description, v.contact_name, v.phone, v.email, v.website, v.instagram || '', JSON.stringify(photos), ackVersion, t, t, t).run();
  return { id: res.meta.last_row_id, slug };
}

export const FIELDS = ['name', 'category', 'description', 'contact_name', 'phone', 'email', 'website', 'instagram'];

// The version of a listing the owner sees in the edit form (their latest proposal, else what is live).
export function effective(listing) {
  const src = listing.pending || listing;
  const out = {};
  for (const f of FIELDS) out[f] = src[f];
  out.photos = listing.pending ? listing.pending.photos : listing.photos;
  return out;
}

// Human-readable list of what differs between the live version and a proposed one.
export function describeChanges(live, proposed) {
  const labels = { name: 'name', category: 'category', description: 'description', contact_name: 'contact person', phone: 'phone', email: 'email', website: 'website', instagram: 'Instagram' };
  const out = [];
  for (const f of FIELDS) if ((live[f] || '') !== (proposed[f] || '')) out.push(`${labels[f]} updated`);
  const before = new Set(live.photos), after = new Set(proposed.photos);
  const added = proposed.photos.filter((k) => !before.has(k)).length;
  const removed = live.photos.filter((k) => !after.has(k)).length;
  if (added) out.push(added === 1 ? 'new photo added' : `${added} new photos added`);
  if (removed) out.push(removed === 1 ? 'photo removed' : `${removed} photos removed`);
  if (!added && !removed && live.photos.join() !== proposed.photos.join()) out.push('photo order changed');
  return out;
}
