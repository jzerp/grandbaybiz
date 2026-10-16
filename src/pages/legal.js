import { page } from '../layout.js';
import { esc } from '../lib/util.js';

const DRAFT = '<div class="banner warn"><strong>Draft.</strong> This page is a plain-language starting point and has not been reviewed by a lawyer or the HOA. It will be replaced before launch.</div>';

export function renderTerms(env) {
  const body = `<main id="main" class="page"><div class="wrap prose">
<div class="page-title"><h1>Terms of use</h1></div>${DRAFT}
<p>${esc(env.SITE_NAME)} is a free, volunteer-run directory where Grand Bay residents can list their small businesses. By adding a listing or using this site you agree to the points below.</p>
<h2>Who runs this site</h2><p>The directory is run by a resident, not by the homeowners association or any business listed. Questions: <a class="link ul" href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a>.</p>
<h2>Listings are public</h2><p>Everything you submit (business name, description, photos, contact person, phone, email, website and Instagram) is shown publicly on the internet. Anyone may contact you.</p>
<h2>Your content</h2><p>You confirm that you own or have permission to use the photos and text you submit, and you allow the directory to display them. We may edit, decline, hide or remove any listing at any time, for any reason, including listings that are inaccurate, offensive, misleading or unrelated to Grand Bay.</p>
<h2>No endorsement</h2><p>We do not check, endorse or guarantee any business, product or service. A listing is not a recommendation. If you hire a business you are dealing with that business directly. Each business is responsible for its own licenses, permits, insurance, taxes and for following HOA and local rules.</p>
<h2>No warranty</h2><p>The site is provided as is. We are not responsible for losses that result from using the directory or dealing with a listed business.</p>
<h2>Changes</h2><p>We may change these terms or the site at any time.</p>
</div></main>`;
  return page(env, { title: 'Terms of use', canonical: '/terms', body });
}

export function renderPrivacy(env) {
  const body = `<main id="main" class="page"><div class="wrap prose">
<div class="page-title"><h1>Privacy notice</h1></div>${DRAFT}
<h2>What we collect</h2><p>When you add or edit a listing we collect the business name, category, description, photos, contact person, phone, email, website and Instagram handle you enter, and the time you accepted the acknowledgements. We also keep a short-lived, anonymized record of your network address to limit spam. We do not use advertising or tracking cookies.</p>
<h2>What is public</h2><p>Once a listing is approved, everything you entered about the business is shown publicly. Do not enter anything you do not want published, such as a home address.</p>
<h2>How we use your email</h2><p>We use your email address to send you your private edit link and messages about your listing (received, approved, changes approved, or declined). We do not sell your information or use it for marketing.</p>
<h2>Who processes it</h2><p>The site runs on Cloudflare, and email is sent through a transactional email service. These providers handle data on our behalf.</p>
<h2>Your choices</h2><p>You can hide your listing at any time using your private edit link. To have your listing and photos deleted, email <a class="link ul" href="mailto:${esc(env.CONTACT_EMAIL)}">${esc(env.CONTACT_EMAIL)}</a> from the address on the listing.</p>
<h2>Cookies</h2><p>The public pages set no cookies. An administrator sign-in sets a single login cookie.</p>
</div></main>`;
  return page(env, { title: 'Privacy notice', canonical: '/privacy', body });
}
