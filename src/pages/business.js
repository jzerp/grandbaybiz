import { page, ICON } from '../layout.js';
import { CATEGORY_BY_KEY } from '../categories.js';
import { esc, paragraphs, telHref, displayUrl } from '../lib/util.js';
import { photoUrl } from '../lib/photos.js';

export function renderBusiness(env, l, others) {
  const cat = CATEGORY_BY_KEY[l.category];
  const url = `${env.SITE_URL}/${l.slug}`;
  const photos = l.photos.map(photoUrl);
  const main = photos[0] ? `<img id="mainphoto" src="${esc(photos[0])}" alt="Photo 1 of ${photos.length} for ${esc(l.name)}" decoding="async">` : ICON.photo;
  const thumbs = photos.length > 1 ? `<div class="thumbs">${photos.map((p, i) => `<button type="button" data-src="${esc(p)}" aria-label="Show photo ${i + 1} of ${photos.length}" aria-pressed="${i === 0}"><img src="${esc(p)}" alt="" loading="lazy"></button>`).join('')}</div>` : '';
  const row = (icon, label, val, href) => href
    ? `<a class="row" href="${esc(href)}"${href.startsWith('http') ? ' rel="nofollow noopener noreferrer ugc" target="_blank"' : ''}><span class="ri">${icon}</span><div class="rt"><small>${label}</small><span>${esc(val)}</span></div></a>`
    : `<div class="row"><span class="ri">${icon}</span><div class="rt"><small>${label}</small><span>${esc(val)}</span></div></div>`;
  const rows = [
    row(ICON.person, 'Contact person', l.contact_name),
    row(ICON.phone, 'Phone', l.phone, telHref(l.phone)),
    row(ICON.mail, 'Email', l.email, `mailto:${l.email}`),
    l.website ? row(ICON.globe, 'Website', displayUrl(l.website), l.website) : '',
  ].join('');
  const wa = `https://wa.me/?text=${encodeURIComponent(`${l.name} on Grand Bay Biz: ${url}`)}`;
  const more = others.length ? `<section class="more"><h2>More in ${esc(cat.name)}</h2><div class="minis">${others.map((m) => `<a class="mini lift" href="/${esc(m.slug)}"><div class="th">${m.photos[0] ? `<img src="${esc(photoUrl(m.photos[0]))}" alt="" loading="lazy">` : ''}</div><div><span class="nm">${esc(m.name)}</span><div class="wh">${esc(m.contact_name)}</div></div></a>`).join('')}</div></section>` : '';
  const body = `<main id="main" class="page"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/#categories">All categories</a><span aria-hidden="true">/</span><a href="/?c=${esc(l.category)}#directory">${esc(cat.name)}</a><span aria-hidden="true">/</span><span style="color:#0E2B33;font-weight:600">${esc(l.name)}</span></nav>
<div class="split">
<section class="gal" aria-label="Photos"><div class="main">${main}</div>${thumbs}</section>
<section class="info">
<div style="display:flex;flex-direction:column;gap:12px"><span class="pill" style="font-size:13.5px;padding:5px 12px">${esc(cat.name)}</span><h1>${esc(l.name)}</h1></div>
<div class="what"><h2>What we do</h2>${paragraphs(l.description)}</div>
<div class="box"><h2>Contact</h2>${rows}</div>
<div class="linkbox"><div class="t"><small>Link to this page</small><span id="pageurl">${esc(url.replace(/^https?:\/\//, ''))}</span></div>
<div class="acts"><button type="button" class="btn btn-teal" id="copybtn" data-url="${esc(url)}">${ICON.copy}<span>Copy link</span></button><a class="btn btn-wa" href="${esc(wa)}" target="_blank" rel="noopener">${ICON.share}<span>Share on WhatsApp</span></a></div></div>
<p class="small">Business owner? Use the private edit link in your approval email to update this listing. <a class="link ul" href="/resend">Lost your link?</a></p>
</section></div>
${more}
<a class="link" style="display:inline-block;margin-top:24px;font-weight:700;padding:8px 0" href="/?c=${esc(l.category)}#directory">&larr; Back to ${esc(cat.name)}</a>
</div></main>`;
  const desc = l.description.replace(/\s+/g, ' ').slice(0, 180);
  return page(env, { title: l.name, description: desc, image: photos[0] ? photos[0] : '', canonical: `/${l.slug}`, body, big: true, scripts: ['/js/business.js'] });
}
