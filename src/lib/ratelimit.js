import { clientKey } from './util.js';

async function hit(env, k, limit, perHours) {
  const bucket = Math.floor(Date.now() / (3600000 * perHours));
  const row = await env.DB.prepare(
    'INSERT INTO rate_limits (k, bucket, n) VALUES (?, ?, 1) ON CONFLICT(k, bucket) DO UPDATE SET n = n + 1 RETURNING n'
  ).bind(k, bucket).first();
  if (Math.random() < 0.02) {
    await env.DB.prepare('DELETE FROM rate_limits WHERE bucket < ?').bind(bucket - 48).run().catch(() => {});
  }
  return row.n <= limit;
}

// True if the caller (by hashed network address) is still under the limit; counts this attempt.
export async function underLimit(env, req, action, limit, perHours = 1) {
  return hit(env, `${action}:${await clientKey(req, env.SESSION_SECRET || 'gbb')}`, limit, perHours);
}

// Same, but keyed by an arbitrary string (for example a hashed email address).
export async function underLimitKey(env, key, limit, perHours = 1) {
  return hit(env, key, limit, perHours);
}
