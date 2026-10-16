(function () {
  var form = document.getElementById('addform');
  if (!form) return;
  var picker = new GBB.PhotoPicker(document.getElementById('photos'), { min: 2, max: 3, existing: [] });
  var btn = document.getElementById('sendbtn'), hint = document.getElementById('sendhint');
  var acks = Array.prototype.slice.call(form.querySelectorAll('.ack input'));

  function sync() {
    var all = acks.every(function (a) { return a.checked; });
    btn.disabled = !all;
    hint.textContent = all ? '' : 'Check all three boxes above to continue.';
  }
  acks.forEach(function (a) { a.addEventListener('change', sync); });
  sync();

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
    var errs = {};
    if (picker.count() < 2) errs.photos = 'Please add at least 2 photos.';
    if (Object.keys(errs).length) { showErrors(errs); return; }
    showErrors({});
    btn.disabled = true; btn.textContent = 'Sending...';
    var fd = new FormData(form); picker.appendTo(fd);
    fetch('/api/submit', { method: 'POST', body: fd }).then(function (r) { return r.json().catch(function () { return { ok: false, message: 'Something went wrong. Please try again.' }; }); })
      .then(function (res) {
        if (res.ok) { form.hidden = true; var t = document.getElementById('thanks'); t.hidden = false; t.scrollIntoView({ block: 'start' }); return; }
        showErrors(res.errors); formerr.textContent = res.message || '';
        btn.textContent = 'Send for review'; sync();
        if (window.turnstile) try { window.turnstile.reset(); } catch (x) {}
      }).catch(function () { formerr.textContent = 'We could not reach the server. Please check your connection and try again.'; btn.textContent = 'Send for review'; sync(); });
  });

  document.getElementById('again').addEventListener('click', function () { location.reload(); });
})();
