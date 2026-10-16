import { esc } from './lib/util.js';

export const ICON = {
  logo: '<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="19" stroke="#F2B33D" stroke-width="2"/><path d="M8 17c4-4 8 4 12 0s8 4 12 0" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/><path d="M8 25c4-4 8 4 12 0s8 4 12 0" stroke="#7FC4CC" stroke-width="2.2" stroke-linecap="round"/></svg>',
  photo: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 9"/></svg>',
  person: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="0.6"/></svg>',
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  envelope: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"/></svg>',
};

export function header(env, { big = false, nav = '', admin = false } = {}) {
  const sub = admin ? '<span class="brand-sub" style="color:#F2B33D">Admin</span>' : '<span class="brand-sub">Business Directory</span>';
  const brand = `${ICON.logo}<span class="brand-text"><span class="brand-name">${esc(env.SITE_NAME)}</span>${sub}</span>`;
  return `<header class="site-header dark${big ? ' big' : ''}"><div class="wrap">
<a class="brand" href="/"${admin ? ' aria-label="Grand Bay Biz home"' : ''}>${brand}</a>
<nav class="nav" aria-label="Main">${nav}</nav>
</div></header>`;
}

export const NAV_PUBLIC = (big) => `<a class="plain" href="/#categories">Browse categories</a>${big ? '<a class="btn btn-mango" href="/add">Add your business</a>' : ''}`;

export function footer(env, { big = false, extra = '' } = {}) {
  return `<footer class="site-footer${big ? ' big' : ''}"><div class="wrap">
<div class="l"><span class="foot-name">${esc(env.SITE_NAME)}</span>
<small>Listings are submitted by residents and reviewed before they go live. A listing is not an endorsement. Each business is responsible for its own licenses and insurance.</small></div>
<div class="r"><a class="link" href="/add">Add your business</a><a class="link" href="/resend">Edit my listing</a>${extra}
<span>Questions? <a class="link ul" href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a></span>
<span><a class="link ul" href="/terms">Terms of use</a> &middot; <a class="link ul" href="/privacy">Privacy notice</a></span></div>
</div></footer>`;
}

// Wraps page content in the full HTML document.
export function page(env, { title, description = '', image = '', canonical = '', body, scripts = [], noindex = false, big = false, nav, bigFooter = false, admin = false, bodyClass = '' }) {
  const fullTitle = title ? `${title} | ${env.SITE_NAME}` : `${env.SITE_NAME} - Support our local businesses. Grow the community.`;
  const desc = description || 'A directory of small businesses run by your Grand Bay neighbors. Support our local businesses. Grow the community.';
  const abs = (u) => (u.startsWith('http') ? u : env.SITE_URL + u);
  const og = image ? abs(image) : abs('/img/og-default.png');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}
${canonical ? `<link rel="canonical" href="${esc(abs(canonical))}">` : ''}
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(env.SITE_NAME)}">
<meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(og)}">${canonical ? `<meta property="og:url" content="${esc(abs(canonical))}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/css/site.css?v=1">
</head><body class="${esc(bodyClass)}">
<a class="skip" href="#main">Skip to content</a>
${header(env, { big, nav: nav ?? NAV_PUBLIC(big), admin })}
${body}
${footer(env, { big: bigFooter })}
${scripts.map((s) => `<script src="${s}?v=1" defer></script>`).join('\n')}
</body></html>`;
}

export function notFound(env) {
  return page(env, {
    title: 'Page not found', noindex: true,
    body: `<main id="main" class="page"><div class="wrap narrow"><div class="done"><h2>We could not find that page.</h2><p>The link may be old, or the listing may be paused. You can look around the directory from the home page.</p><a class="btn btn-teal" href="/">Back to the directory</a></div></div></main>`,
  });
}
