import { page, ICON } from '../layout.js';
import { CATEGORIES, CATEGORY_BY_KEY, CATEGORY_ICONS } from '../categories.js';
import { esc } from '../lib/util.js';
import { photoUrl } from '../lib/photos.js';

export function card(l) {
  const cat = CATEGORY_BY_KEY[l.category];
  const cover = l.photos[0];
  return `<a class="card lift" href="/${esc(l.slug)}" data-cat="${esc(l.category)}">
<div class="ph">${cover ? `<img src="${esc(photoUrl(cover))}" alt="" loading="lazy" decoding="async">` : ICON.photo}</div>
<div class="tx"><span class="pill">${esc(cat?.name || '')}</span><span class="nm">${esc(l.name)}</span><span class="ds">${esc(l.description.length > 130 ? l.description.slice(0, 127).trimEnd() + '...' : l.description)}</span>
<div class="who"><span>Contact:</span><b>${esc(l.contact_name)}</b></div><span class="go">View page &rarr;</span></div></a>`;
}

export function renderHome(env, listings, selected) {
  const sel = CATEGORY_BY_KEY[selected] ? selected : '';
  const recent = new Set(listings.slice(0, 6).map((l) => l.id));
  const shown = (l) => (sel ? l.category === sel : recent.has(l.id));
  const cats = CATEGORIES.map((c) => ({ ...c, count: listings.filter((l) => l.category === c.key).length }));
  const tiles = cats.map((c) => `<a class="tile lift${c.key === sel ? ' on' : ''}" href="/?c=${c.key}#directory" data-cat="${c.key}"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">${CATEGORY_ICONS[c.key]}</svg></span><span class="nm">${esc(c.name)}</span></a>`).join('');
  const cur = CATEGORY_BY_KEY[sel];
  const cards = listings.map((l) => {
    const html = card(l);
    return shown(l) ? html : html.replace('<a class="card lift"', '<a class="card lift" hidden');
  }).join('\n');
  const meta = JSON.stringify(Object.fromEntries(cats.map((c) => [c.key, { name: c.name, blurb: c.blurb, count: c.count }])));
  const body = `<main id="main">
<section class="hero dark">
<svg class="wave1" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 C260 10 520 110 800 60 C1060 14 1260 20 1440 70 L1440 120 L0 120Z" fill="#17414D"/></svg>
<svg class="wave2" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 50 C240 90 480 10 720 40 C960 70 1200 80 1440 30 L1440 90 L0 90Z" fill="#F5F8F7"/></svg>
<div class="wrap"><span class="eyebrow">Neighbors serving neighbors</span>
<h1>Support our local businesses. Grow the community.</h1>
<p>Find services and products from neighbors who live right here in Grand Bay</p>
<div class="cta"><a class="btn btn-mango" href="#categories">Browse categories</a><a class="btn btn-outline-w" href="/add">List your business</a></div></div>
</section>
<div class="wrap">
<section id="categories" class="section"><h2 class="title">Browse by category</h2><p class="sub">Tap a category to see who is offering what.</p>
<div class="tiles">${tiles}<a class="tile-cta lift" href="/add">Run a business here? Add yours &rarr;</a></div></section>
<section id="directory" class="section" data-meta="${esc(meta)}" style="padding-top:32px">
<div class="dirhead"><div><h2 id="dir-title">${esc(cur ? cur.name : 'Recently added')}</h2><p id="dir-blurb">${esc(cur ? cur.blurb : 'New neighbors on the directory. Pick a category above to see everyone.')}</p></div>
<button type="button" class="closebtn" id="dir-close"${cur ? '' : ' hidden'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>Close category</button></div>
<div class="cards" id="cards">${cards}</div>
<div class="empty" id="dir-empty"${listings.filter(shown).length ? ' hidden' : ''}>${listings.length ? 'No one has listed in this category yet. ' : 'The directory is new, and the first listings are on their way. '}<a class="link ul" href="/add">Add your business</a></div>
</section>
<section><div class="band dark"><div><h2>Your neighbors are looking for what you do.</h2><p>Tell us about your business, add a few photos and we will review it and put it on the directory.</p></div><a class="btn btn-mango" href="/add">Add your business</a></div></section>
</div></main>`;
  return page(env, { title: '', canonical: '/', body, big: true, bigFooter: true, scripts: ['/js/home.js'] });
}
