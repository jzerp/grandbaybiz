(function () {
  var main = document.getElementById('mainphoto');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.thumbs button'));
  thumbs.forEach(function (b, i) {
    b.addEventListener('click', function () {
      if (main) { main.src = b.getAttribute('data-src'); main.alt = 'Photo ' + (i + 1) + ' of ' + thumbs.length; }
      thumbs.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
    });
  });
  var copy = document.getElementById('copybtn');
  if (copy) copy.addEventListener('click', function () {
    var url = copy.getAttribute('data-url');
    var label = copy.querySelector('span');
    function done() { label.textContent = 'Link copied'; setTimeout(function () { label.textContent = 'Copy link'; }, 2000); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, fallback); else fallback();
    function fallback() {
      var t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { window.prompt('Copy this link:', url); }
      document.body.removeChild(t);
    }
  });
})();
