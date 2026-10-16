(function () {
  var state = { data: [], tab: 'pending', sel: null, editing: false, rejecting: false };
  var tabsEl = document.getElementById('tabs'), queueEl = document.getElementById('queue'), detailEl = document.getElementById('detail'), toastEl = document.getElementById('toast');
  var CATS = {};
  var TABS = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']];

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' })
      .then(function (r) { if (r.status === 401) { location.href = '/admin'; throw new Error('auth'); } return r.json(); });
  }
  function toast(msg, bad) { toastEl.hidden = false; toastEl.className = 'toast' + (bad ? ' bad' : ''); toastEl.textContent = msg; clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 6000); }
  function tabOf(l) { return l.status === 'approved' && !l.pending ? 'approved' : (l.status === 'rejected' ? 'rejected' : 'pending'); }
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 3600) { var m = Math.max(1, Math.round(s / 60)); return m + (m === 1 ? ' minute ago' : ' minutes ago'); }
    if (s < 86400) { var h = Math.round(s / 3600); return h + (h === 1 ? ' hour ago' : ' hours ago'); }
    var d = Math.round(s / 86400); return d === 1 ? 'yesterday' : d + ' days ago';
  }

  function load(keep) {
    return api('/api/admin/listings').then(function (res) {
      state.data = res.listings; CATS = res.categories;
      if (!keep || !state.data.some(function (l) { return l.id === state.sel; })) state.sel = null;
      render();
    });
  }

  function render() {
    tabsEl.innerHTML = '';
    TABS.forEach(function (t) {
      var n = state.data.filter(function (l) { return tabOf(l) === t[0]; }).length;
      var b = el('button', '', t[1] + ' (' + n + ')'); b.type = 'button'; b.setAttribute('aria-pressed', String(state.tab === t[0]));
      b.onclick = function () { state.tab = t[0]; state.sel = null; state.editing = false; state.rejecting = false; render(); };
      tabsEl.appendChild(b);
    });
    var list = state.data.filter(function (l) { return tabOf(l) === state.tab; });
    if (!state.sel && list.length) state.sel = list[0].id;
    queueEl.innerHTML = '';
    list.forEach(function (l) {
      var b = el('button', 'qi'); b.type = 'button'; b.setAttribute('aria-pressed', String(l.id === state.sel));
      b.appendChild(el('span', 'nm', l.name));
      var meta = (CATS[l.category] || l.category) + ' · ' + (l.pending ? 'Edit submitted ' + ago(l.pending_at) : (l.status === 'approved' ? 'Published ' + ago(l.approved_at) : 'Submitted ' + ago(l.created_at)));
      if (l.hidden) meta += ' · hidden by owner';
      b.appendChild(el('span', 'mt', meta));
      b.onclick = function () { state.sel = l.id; state.editing = false; state.rejecting = false; render(); };
      queueEl.appendChild(b);
    });
    if (!list.length) queueEl.appendChild(el('div', 'empty', 'Nothing here. New submissions show up as soon as a neighbor sends one.'));
    var cur = list.filter(function (l) { return l.id === state.sel; })[0];
    detailEl.hidden = !cur; detailEl.innerHTML = '';
    if (cur) renderDetail(cur);
  }

  function kv(label, value) { var d = el('div'); d.appendChild(el('small', '', label)); d.appendChild(el('span', '', value || 'Not provided')); return d; }

  function renderDetail(l) {
    var p = l.pending, v = p || l;
    var meta = el('div', 'meta');
    meta.appendChild(el('span', 'pill', CATS[v.category] || v.category));
    var label = l.status === 'approved' ? (p ? 'Edit pending review' : (l.hidden ? 'Live, paused by owner' : 'Live')) : (l.status === 'rejected' ? 'Rejected' : 'Pending review');
    meta.appendChild(el('span', 'status ' + (l.status === 'approved' && !p ? 'st-live' : (l.status === 'rejected' ? 'st-rejected' : 'st-pending')), label));
    detailEl.appendChild(meta);
    var h = el('h2', '', v.name); detailEl.appendChild(h);
    if (l.status === 'approved' && !l.hidden) { var a = el('a', 'link', 'View public page →'); a.href = '/' + l.slug; a.target = '_blank'; a.rel = 'noopener'; detailEl.appendChild(a); }

    if (p) {
      var box = el('div', 'banner warn'); box.style.margin = '0';
      box.appendChild(el('strong', '', 'Edit to a live listing')); box.appendChild(el('div', '', 'The current version stays public until you approve these changes.'));
      var ch = el('div', '', 'Changed: ' + (l.changes.length ? l.changes.join(', ') : 'nothing visible')); ch.style.fontWeight = '600'; box.appendChild(ch);
      detailEl.appendChild(box);
      var labels = { name: 'Business name', category: 'Category', description: 'What they do', contact_name: 'Contact person', phone: 'Phone', email: 'Email', website: 'Website' };
      Object.keys(labels).forEach(function (f) {
        if ((l[f] || '') === (p[f] || '')) return;
        var row = el('div', 'cmp');
        var o = el('div', 'old'); o.appendChild(el('b', '', 'Live: ' + labels[f])); o.appendChild(document.createTextNode(f === 'category' ? CATS[l[f]] : (l[f] || '(empty)')));
        var n = el('div', 'new'); n.appendChild(el('b', '', 'New: ' + labels[f])); n.appendChild(document.createTextNode(f === 'category' ? CATS[p[f]] : (p[f] || '(empty)')));
        row.appendChild(o); row.appendChild(n); detailEl.appendChild(row);
      });
    }
    if (l.status === 'rejected' && l.admin_note) { var nb = el('div', 'banner bad'); nb.style.margin = '0'; nb.textContent = 'Reason sent to the owner: ' + l.admin_note; detailEl.appendChild(nb); }

    if (state.editing) { renderEditForm(l, v); return; }

    var grid = el('div', 'kv');
    grid.appendChild(kv('Contact person', v.contact_name)); grid.appendChild(kv('Phone', v.phone)); grid.appendChild(kv('Email', v.email)); grid.appendChild(kv('Website', v.website));
    detailEl.appendChild(grid);
    var d = el('div'); d.appendChild(el('small', '', 'What they do')); var dp = el('p', '', v.description); dp.style.cssText = 'margin:6px 0 0;font-size:17px;line-height:1.6;color:#2B454D;white-space:pre-wrap'; d.appendChild(dp); d.firstChild.style.cssText = 'display:block;font-size:13.5px;color:#4A6169'; detailEl.appendChild(d);
    var ph = el('div'); var pl = el('small', '', 'Photos (click to enlarge)'); pl.style.cssText = 'display:block;font-size:13.5px;color:#4A6169;margin-bottom:8px'; ph.appendChild(pl);
    var g = el('div', 'photos-adm');
    v.photos.forEach(function (k) { var a = el('a'); a.href = '/photos/' + k.slice(2); a.target = '_blank'; a.rel = 'noopener'; var im = el('img'); im.src = '/photos/' + k.slice(2); im.alt = ''; im.loading = 'lazy'; a.appendChild(im); g.appendChild(a); });
    ph.appendChild(g); detailEl.appendChild(ph);
    detailEl.appendChild(el('small', '', 'Submitted ' + new Date(l.created_at).toLocaleString() + ' · acknowledgements accepted ' + (l.ack_at ? new Date(l.ack_at).toLocaleString() : 'n/a'))).style.cssText = 'color:#4A6169;font-size:13.5px';

    var bar = el('div', 'decide');
    function btn(text, cls, fn) { var b = el('button', 'btn ' + cls, text); b.type = 'button'; b.onclick = fn; bar.appendChild(b); return b; }
    var needsDecision = l.status === 'pending' || p;
    if (needsDecision) {
      btn(p ? 'Approve changes' : 'Approve and publish', 'btn-teal', function () { act(l, 'approve'); });
      btn('Edit details', 'btn-line', function () { state.editing = true; render(); });
      btn(p ? 'Reject changes' : 'Reject', 'btn-danger', function () { state.rejecting = true; render(); });
    } else if (l.status === 'approved') {
      btn('Edit details', 'btn-line', function () { state.editing = true; render(); });
      btn('Take down', 'btn-danger', function () { state.rejecting = true; render(); });
    } else {
      btn('Move back to pending', 'btn-line', function () { act(l, 'reopen'); });
    }
    btn('Delete forever', 'btn-danger', function () { if (confirm('Delete "' + v.name + '" and its photos forever? This cannot be undone.')) act(l, 'delete'); });
    detailEl.appendChild(bar);

    if (state.rejecting) {
      var box2 = el('div'); box2.style.cssText = 'display:flex;flex-direction:column;gap:10px';
      var lbl = el('label', '', l.status === 'approved' && !p ? 'Take this listing down. Optional note (not emailed):' : 'Optional note to the owner (included in the email):'); lbl.style.fontWeight = '700'; lbl.htmlFor = 'rejnote'; box2.appendChild(lbl);
      var ta = el('textarea', 'note'); ta.id = 'rejnote'; ta.maxLength = 500; box2.appendChild(ta);
      var row2 = el('div', 'actions');
      var ok = el('button', 'btn btn-danger', p ? 'Reject changes' : (l.status === 'approved' ? 'Take down' : 'Reject listing')); ok.type = 'button'; ok.onclick = function () { act(l, 'reject', { note: ta.value }); };
      var no = el('button', 'btn-ghost', 'Cancel'); no.type = 'button'; no.onclick = function () { state.rejecting = false; render(); };
      row2.appendChild(ok); row2.appendChild(no); box2.appendChild(row2); detailEl.appendChild(box2); ta.focus();
    }
  }

  function renderEditForm(l, v) {
    var form = el('form'); form.style.cssText = 'display:flex;flex-direction:column;gap:16px';
    var inputs = {};
    function field(name, label, tag, opts) {
      var w = el('div', 'fld'); var lb = el('label', '', label); lb.htmlFor = 'ae-' + name; w.appendChild(lb);
      var i;
      if (tag === 'select') { i = el('select'); Object.keys(CATS).forEach(function (k) { var o = el('option', '', CATS[k]); o.value = k; i.appendChild(o); }); }
      else if (tag === 'textarea') { i = el('textarea'); i.rows = 5; i.maxLength = 500; } else { i = el('input'); i.type = 'text'; }
      i.id = 'ae-' + name; i.value = v[name] || ''; inputs[name] = i; w.appendChild(i);
      var er = el('span', 'err'); er.setAttribute('data-err', name); w.appendChild(er); form.appendChild(w);
    }
    field('name', 'Business name'); field('category', 'Category', 'select'); field('description', 'What they do', 'textarea');
    field('contact_name', 'Contact person'); field('phone', 'Phone'); field('email', 'Email'); field('website', 'Website');
    var row = el('div', 'actions'); var save = el('button', 'btn btn-teal', 'Save details'); save.type = 'submit'; var cancel = el('button', 'btn-ghost', 'Cancel'); cancel.type = 'button';
    cancel.onclick = function () { state.editing = false; render(); }; row.appendChild(save); row.appendChild(cancel); form.appendChild(row);
    form.onsubmit = function (e) {
      e.preventDefault(); var body = { id: l.id, action: 'update' };
      Object.keys(inputs).forEach(function (k) { body[k] = inputs[k].value; });
      api('/api/admin/action', body).then(function (res) {
        if (res.ok) { state.editing = false; toast('Details saved.'); load(true); return; }
        form.querySelectorAll('[data-err]').forEach(function (x) { x.textContent = (res.errors && res.errors[x.getAttribute('data-err')]) || ''; });
        if (res.message) toast(res.message, true);
      });
    };
    detailEl.appendChild(form);
  }

  function act(l, action, extra) {
    var body = Object.assign({ id: l.id, action: action }, extra || {});
    api('/api/admin/action', body).then(function (res) {
      if (!res.ok) { toast(res.message || 'Something went wrong.', true); return; }
      state.rejecting = false; state.editing = false;
      toast(res.message); state.sel = null; load(false);
    }).catch(function (e) { if (e.message !== 'auth') toast('Could not reach the server.', true); });
  }

  load(false);
})();
