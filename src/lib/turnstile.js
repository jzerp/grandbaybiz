// Optional spam check. Active only when TURNSTILE_SECRET_KEY (secret) and TURNSTILE_SITE_KEY (var) are set.
export async function turnstileOk(env, req, token) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: req.headers.get('cf-connecting-ip') || '' });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    return !!(await res.json()).success;
  } catch { return false; }
}
