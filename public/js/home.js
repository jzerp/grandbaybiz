// Category tiles expand in place. Without JavaScript the tiles are ordinary links (/?c=home#directory).
(function () {
  var dir = document.getElementById('directory');
  if (!dir) return;
  var meta = JSON.parse(dir.getAttribute('data-meta') || '{}');
  var cards = Array.prototype.slice.call(document.querySelectorAll('#cards .card'));
  var recentKeys = cards.filter(function (c) { return !c.hidden; });
  var recent = cards.slice(0, 6);
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile[data-cat]'));
  var title = document.getElementById('dir-title');
  var blurb = document.getElementById('dir-blurb');
  var close = document.getElementById('dir-close');
  var empty = document.getElementById('dir-empty');

  function show(cat, scroll) {
    var list = cat ? cards.filter(function (c) { return c.getAttribute('data-cat') === cat; }) : recent;
    cards.forEach(function (c) { c.hidden = list.indexOf(c) < 0; });
    tiles.forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-cat') === cat); });
    title.textContent = cat ? meta[cat].name : 'Recently added';
    blurb.textContent = cat ? meta[cat].blurb : 'New neighbors on the directory. Pick a category above to see everyone.';
    close.hidden = !cat;
    empty.hidden = list.length > 0;
    if (cat && list.length === 0) empty.firstChild.textContent = 'No one has listed in this category yet. ';
    var url = cat ? '/?c=' + cat + '#directory' : '/';
    try { history.replaceState(null, '', url); } catch (e) {}
    if (scroll) dir.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  tiles.forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      var cat = t.getAttribute('data-cat');
      show(t.classList.contains('on') ? '' : cat, !t.classList.contains('on'));
    });
  });
  close.addEventListener('click', function () { show('', false); document.getElementById('categories').scrollIntoView({ block: 'start' }); });
})();
