import { hmacB64, parseCookies, timingSafeEqual } from './util.js';

const COOKIE = 'gbb_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function makeSession(env) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const sig = await hmacB64(env.SESSION_SECRET, `admin.${exp}`);
  return `${exp}.${sig}`;
}

export async function isAdmin(env, req) {
  if (!env.SESSION_SECRET || !env.ADMIN_PASSWORD) return false;
  const v = parseCookies(req)[COOKIE];
  if (!v) return false;
  const [exp, sig] = v.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return timingSafeEqual(sig, await hmacB64(env.SESSION_SECRET, `admin.${exp}`));
}

export function sessionCookie(value, req, clear = false) {
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${clear ? '' : value}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${clear ? 0 : MAX_AGE}`;
}

export function passwordOk(env, given) {
  if (!env.ADMIN_PASSWORD) return false;
  return timingSafeEqual(String(given || ''), env.ADMIN_PASSWORD);
}

// Private edit links: `${id}.${hmac}`. Nothing secret is stored; bump token_ver to revoke a link.
export async function editToken(env, listing) {
  return `${listing.id}.${await hmacB64(env.SESSION_SECRET, `edit.${listing.id}.${listing.token_ver}`)}`;
}

export async function editUrl(env, listing) {
  return `${env.SITE_URL}/edit/${await editToken(env, listing)}`;
}

export async function listingFromToken(env, token, getById) {
  const m = /^(\d{1,9})\.([A-Za-z0-9_-]{43})$/.exec(String(token || ''));
  if (!m || !env.SESSION_SECRET) return null;
  const listing = await getById(env, Number(m[1]));
  if (!listing) return null;
  const expected = await hmacB64(env.SESSION_SECRET, `edit.${listing.id}.${listing.token_ver}`);
  return timingSafeEqual(m[2], expected) ? listing : null;
}
