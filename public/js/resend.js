(function () {
  var form = document.getElementById('resendform');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('rbtn'), err = document.getElementById('formerr');
    err.textContent = '';
    var email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Please enter a valid email address.'; return; }
    btn.disabled = true;
    fetch('/api/resend', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: email, company_url: form.company_url.value }) })
      .then(function (r) { return r.json(); }).then(function (res) {
        btn.disabled = false;
        if (res.ok) { form.hidden = true; document.getElementById('rdone').hidden = false; } else err.textContent = res.message || 'Something went wrong. Please try again.';
      }).catch(function () { btn.disabled = false; err.textContent = 'We could not reach the server. Please try again.'; });
  });
})();
