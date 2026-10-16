import { page } from '../layout.js';

const NAV = '<span style="color:#BFD8DC;font-size:15px">Signed in as admin</span><a class="outline" href="/">View public site</a><form method="post" action="/admin/logout" style="margin:0"><button class="outline" style="background:transparent;cursor:pointer" type="submit">Sign out</button></form>';

export function renderAdminLogin(env, error = '') {
  const body = `<main id="main" class="page"><div class="wrap narrow">
<form class="panel" method="post" action="/admin/login">
<h1 style="font-weight:800;font-size:clamp(28px,5vw,38px)">Admin sign in</h1>
${error ? `<div class="banner bad" role="alert" style="margin:0">${error}</div>` : ''}
<div class="fld"><label for="pw">Password</label><input id="pw" name="password" type="password" required autocomplete="current-password" autofocus></div>
<div class="actions"><button class="btn btn-teal" type="submit">Sign in</button></div>
</form></div></main>`;
  return page(env, { title: 'Admin', body, noindex: true, nav: '', admin: true });
}

export function renderAdmin(env) {
  const body = `<main id="main" class="page"><div class="wrap">
<div class="page-title" style="margin-bottom:24px"><h1>Review queue</h1><p>Nothing appears on the public site until you approve it.</p></div>
<div class="tabs" role="group" aria-label="Filter submissions" id="tabs"></div>
<div id="toast" role="status" hidden></div>
<div class="admin-grid"><section class="queue" id="queue" aria-label="Submissions"></section><section class="detail" id="detail" aria-label="Submission details" hidden></section></div>
<p class="small" style="margin-top:32px">Backup: <a class="link ul" href="/admin/export.csv">download all listings (CSV)</a> &middot; <a class="link ul" href="/admin/export.json">download all listings (JSON)</a>. Photos stay in storage and are not part of the download.</p>
</div></main>`;
  return page(env, { title: 'Admin: review queue', body, noindex: true, nav: NAV, admin: true, scripts: ['/js/admin.js'] });
}
