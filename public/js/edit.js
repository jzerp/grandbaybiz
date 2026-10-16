(function () {
  var form = document.getElementById('editform');
  if (!form) return;
  var token = form.getAttribute('data-token');
  var approved = form.getAttribute('data-approved') === '1';
  var picker = new GBB.PhotoPicker(document.getElementById('photos'), { min: 2, max: 3, existing: JSON.parse(form.getAttribute('data-photos') || '[]') });
  var btn = document.getElementById('savebtn');

  function showErrors(errors) {
    form.querySelectorAll('[data-err]').forEach(function (e) { e.textContent = ''; });
    form.querySelectorAll('.fld.bad').forEach(function (e) { e.classList.remove('bad'); });
    var first = null;
    Object.keys(errors || {}).forEach(function (k) {
      var e = form.querySelector('[data-err="' + k + '"]'); if (e) e.textContent = errors[k];
      var f = form.querySelector('[data-field="' + k + '"]'); if (f) { f.classList.add('bad'); if (!first) first = f; }
    });
    if (first) first.scrollIntoView({ block: 'center' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var formerr = document.getElementById('formerr'); formerr.textContent = '';
    if (picker.count() < 2) { showErrors({ photos: 'Please keep at least 2 photos.' }); return; }
    showErrors({});
    var label = btn.textContent; btn.disabled = true; btn.textContent = 'Saving...';
    var fd = new FormData(form); picker.appendTo(fd);
    fetch('/api/edit/' + encodeURIComponent(token), { method: 'POST', body: fd }).then(function (r) { return r.json().catch(function () { return { ok: false, message: 'Something went wrong. Please try again.' }; }); })
      .then(function (res) {
        btn.disabled = false; btn.textContent = label;
        if (res.ok) {
          document.getElementById('saved-h').textContent = res.heading;
          document.getElementById('saved-p').textContent = res.message;
          form.hidden = true; document.getElementById('statebanner').hidden = true;
          if (res.statusLabel) { var s = document.getElementById('statuslabel'); s.textContent = res.statusLabel; s.className = 'status ' + res.statusClass; }
          var d = document.getElementById('saved'); d.hidden = false; d.scrollIntoView({ block: 'start' }); return;
        }
        showErrors(res.errors); formerr.textContent = res.message || '';
      }).catch(function () { btn.disabled = false; btn.textContent = label; formerr.textContent = 'We could not reach the server. Please check your connection and try again.'; });
  });

  var again = document.getElementById('editagain');
  if (again) again.addEventListener('click', function () { location.reload(); });

  var hide = document.getElementById('hidebtn');
  if (hide) hide.addEventListener('click', function () {
    var want = hide.getAttribute('data-hidden') !== '1';
    hide.disabled = true;
    fetch('/api/edit/' + encodeURIComponent(token) + '/hide', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hidden: want }) })
      .then(function (r) { return r.json(); }).then(function (res) {
        hide.disabled = false;
        if (!res.ok) { document.getElementById('hideerr').textContent = res.message || 'Something went wrong.'; return; }
        location.reload();
      }).catch(function () { hide.disabled = false; document.getElementById('hideerr').textContent = 'We could not reach the server. Please try again.'; });
  });
})();
