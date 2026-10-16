import { page, ICON } from '../layout.js';
import { CATEGORIES } from '../categories.js';
import { ACK_TEXTS, MIN_PHOTOS, MAX_PHOTOS } from '../lib/validate.js';
import { esc } from '../lib/util.js';
import { photoUrl } from '../lib/photos.js';

function fields(v = {}) {
  const f = (name, label, input, hint = '') => `<div class="fld" data-field="${name}"><label for="f-${name}">${label}</label>${input}${hint}<span class="err" data-err="${name}" role="alert"></span></div>`;
  const inp = (name, type, extra = '') => `<input id="f-${name}" name="${name}" type="${type}" value="${esc(v[name] || '')}" ${extra}>`;
  return `
${f('name', 'Business name', inp('name', 'text', 'maxlength="80" required autocomplete="organization" placeholder="For example, Bayside Handyman Co."'))}
${f('category', 'Category', `<select id="f-category" name="category" required><option value="">Choose a category</option>${CATEGORIES.map((c) => `<option value="${c.key}"${v.category === c.key ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`)}
${f('description', 'What do you do?', `<textarea id="f-description" name="description" rows="5" maxlength="500" required placeholder="A few sentences about what you offer and who it is for.">${esc(v.description || '')}</textarea>`, '<span class="hint">Up to 500 characters.</span>')}
<div class="grid2">
${f('contact_name', 'Contact person', inp('contact_name', 'text', 'maxlength="80" required autocomplete="name"'))}
${f('phone', 'Phone', inp('phone', 'tel', 'maxlength="30" required autocomplete="tel" placeholder="(305) 555-0100"'))}
${f('email', 'Email', inp('email', 'email', 'maxlength="120" required autocomplete="email" placeholder="you@example.com"'))}
${f('website', 'Website <span class="opt">(optional)</span>', inp('website', 'text', 'maxlength="200" inputmode="url" autocomplete="url" placeholder="www.example.com"'))}
</div>`;
}

function photosBlock(label, help) {
  return `<div class="fld" data-field="photos"><span class="lbl">Photos <span class="opt">${label}</span></span><div id="photos"></div><span class="hint">${help}</span><span class="err" data-err="photos" role="alert"></span></div>`;
}

export function renderAdd(env) {
  const acks = ACK_TEXTS.map((t, i) => `<div class="ack"><input id="ack-${i + 1}" name="ack${i + 1}" type="checkbox" value="1"><label for="ack-${i + 1}">${esc(t)}</label></div>`).join('');
  const turnstile = env.TURNSTILE_SITE_KEY ? `<div class="cf-turnstile" data-sitekey="${esc(env.TURNSTILE_SITE_KEY)}"></div>` : '';
  const body = `<main id="main" class="page"><div class="wrap">
<div class="page-title"><h1>Add your business</h1><p>Tell your Grand Bay neighbors what you offer. It takes about five minutes.</p></div>
<div class="formwrap">
<div class="formcol">
<form id="addform" class="panel" novalidate>
<noscript><div class="banner warn">This form needs JavaScript to resize your photos. Please turn it on, or try another browser.</div></noscript>
${fields()}
${photosBlock(`(add ${MIN_PHOTOS} to ${MAX_PHOTOS})`, 'JPG or PNG. Photos are resized automatically. The first one is your cover photo.')}
<fieldset class="acks"><legend>Before you submit</legend>${acks}
<p class="small" style="margin:4px 0 12px">Please read the <a class="link ul" href="/terms" target="_blank">Terms of use</a> and <a class="link ul" href="/privacy" target="_blank">Privacy notice</a>. Listings are reviewed and may be edited, declined or removed at any time.</p>
<span class="err" data-err="acks" role="alert"></span></fieldset>
<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="company_url" tabindex="-1" autocomplete="off"></label></div>
${turnstile}
<div class="actions"><button type="submit" class="btn btn-teal" id="sendbtn" disabled>Send for review</button><a class="link" style="padding:10px 4px" href="/">Cancel</a><span class="hint" id="sendhint">Check all three boxes above to continue.</span></div>
<div class="err" id="formerr" role="alert"></div>
</form>
<div class="done" id="thanks" role="status" hidden><span class="ok">${ICON.check}</span><h2>Thank you, we got it.</h2><p>Your listing is waiting for review. We just emailed you a private link so you can update your details or photos at any time. When your listing goes live we will email you again.</p><div class="actions"><a class="btn btn-teal" href="/">Back to the directory</a><button type="button" class="btn-ghost" id="again">Add another business</button></div></div>
</div>
<aside class="aside"><div class="how"><h2>How it works</h2>
<div class="step"><span class="n">1</span><div><b>Send your details</b><span>Fill in the form and add a few photos.</span></div></div>
<div class="step"><span class="n">2</span><div><b>We review it</b><span>Every listing is checked before it appears.</span></div></div>
<div class="step"><span class="n">3</span><div><b>You are live</b><span>Neighbors find you by category, and you get a private link to edit your listing.</span></div></div></div></aside>
</div></div></main>`;
  return page(env, { title: 'Add your business', canonical: '/add', body, scripts: [...(env.TURNSTILE_SITE_KEY ? ['https://challenges.cloudflare.com/turnstile/v0/api.js'] : []), '/js/photopicker.js', '/js/add.js'] });
}

const STATUS = {
  live: ['Live', 'st-live'], hidden: ['Paused (hidden)', 'st-hidden'], pending: ['Waiting for review', 'st-pending'],
  edit: ['Changes waiting for review', 'st-pending'], rejected: ['Not published', 'st-rejected'],
};

export function listingState(l) {
  if (l.status === 'approved') return l.hidden ? 'hidden' : (l.pending ? 'edit' : 'live');
  return l.status === 'rejected' ? 'rejected' : 'pending';
}

export function renderEdit(env, l, values, token) {
  const state = listingState(l);
  const [label, cls] = STATUS[state];
  const approved = l.status === 'approved';
  const banners = {
    live: '<strong>Your listing is live.</strong> Changes you save here are sent for review, and your current listing stays public until they are approved.',
    hidden: '<strong>Your listing is paused.</strong> It is hidden from the directory. Use the button on the right to show it again.',
    edit: '<strong>Your changes are waiting for review.</strong> Your current listing stays public until they are approved. You can still change them below.',
    pending: '<strong>Your listing is waiting for review.</strong> You can still make changes below. We will email you when it goes live.',
    rejected: `<strong>Your listing was not published.</strong>${l.admin_note ? ' Note from the reviewer: ' + esc(l.admin_note) : ''} Update it below and send it again.`,
  };
  const existing = values.photos.map((k) => ({ key: k, url: photoUrl(k) }));
  const publicLink = approved && !l.hidden ? `<a class="plain" href="/${esc(l.slug)}">View my public page</a>` : '';
  const body = `<main id="main" class="page"><div class="wrap">
<div class="page-title"><h1>Edit your listing</h1><p>Update your details or photos any time. You are editing ${esc(l.name)}.</p></div>
<div class="banner${state === 'rejected' ? ' warn' : ''}" id="statebanner">${banners[state]}</div>
<div class="formwrap"><div class="formcol">
<form id="editform" class="panel" novalidate data-token="${esc(token)}" data-photos='${esc(JSON.stringify(existing))}' data-approved="${approved ? 1 : 0}">
${fields(values)}
${photosBlock(`(${MIN_PHOTOS} to ${MAX_PHOTOS})`, `JPG or PNG. Photos are resized automatically. The first one is your cover photo. You can have up to ${MAX_PHOTOS}.`)}
<p class="small">By saving, you confirm the acknowledgements you accepted when you first submitted your listing.</p>
<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="company_url" tabindex="-1" autocomplete="off"></label></div>
<div class="actions"><button type="submit" class="btn btn-teal" id="savebtn">${approved ? 'Save changes for review' : 'Save changes'}</button>${approved && !l.hidden ? `<a class="link" style="padding:10px 4px" href="/${esc(l.slug)}">Cancel</a>` : ''}</div>
<div class="err" id="formerr" role="alert"></div>
</form>
<div class="done" id="saved" role="status" hidden><span class="ok">${ICON.check}</span><h2 id="saved-h">Changes sent for review.</h2><p id="saved-p">Your current listing stays public while we review them. We will email you as soon as your changes are approved.</p><div class="actions">${approved && !l.hidden ? `<a class="btn btn-teal" href="/${esc(l.slug)}">View my public page</a>` : '<a class="btn btn-teal" href="/">Back to the directory</a>'}<button type="button" class="btn-ghost" id="editagain">Make more changes</button></div></div>
</div>
<aside class="aside"><div class="box2"><span class="status ${cls}" id="statuslabel">${label}</span><h2>How edits work</h2><p>Your current listing stays public while your changes are reviewed. You will get an email when they are approved.</p></div>
${approved ? `<div class="card2"><h2>Pause your listing</h2><p>Taking a break? Hide your listing from the directory right away, and turn it back on whenever you are ready.</p><button type="button" class="btn btn-line" id="hidebtn" data-hidden="${l.hidden ? 1 : 0}" style="align-self:flex-start">${l.hidden ? 'Show my listing again' : 'Hide my listing'}</button><span class="err" id="hideerr" role="alert"></span></div>` : ''}
</aside></div></div></main>`;
  return page(env, { title: 'Edit your listing', body, noindex: true, nav: publicLink, scripts: ['/js/photopicker.js', '/js/edit.js'] });
}

export function renderResend(env) {
  const body = `<main id="main" class="page"><div class="wrap narrow">
<form id="resendform" class="panel" novalidate>
<h1 style="font-weight:800;font-size:clamp(30px,5vw,40px)">Lost your edit link?</h1>
<p style="margin:0;font-size:17.5px;line-height:1.55;color:#2B454D">Enter the email address you used when you added your business. If it matches a listing, we will send you your private link to edit it.</p>
<div class="fld"><label for="r-email">Email</label><input id="r-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="company_url" tabindex="-1" autocomplete="off"></label></div>
<div class="actions"><button type="submit" class="btn btn-teal" id="rbtn">Email me my link</button><a class="link" style="padding:10px 4px" href="/">Cancel</a></div>
<div class="err" id="formerr" role="alert"></div>
</form>
<div class="done" id="rdone" role="status" hidden><span class="ok">${ICON.envelope}</span><h2>Check your email.</h2><p>If that address matches a listing, your edit link is on its way. It can take a few minutes. Look in your spam folder if you do not see it.</p><a class="btn btn-teal" href="/">Back to the directory</a></div>
</div></main>`;
  return page(env, { title: 'Lost your edit link', body, noindex: true, scripts: ['/js/resend.js'] });
}
