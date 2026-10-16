// Photo picker: shows existing and new photos, resizes new ones in the browser before upload.
(function () {
  var MAX_SIDE = 1600, TARGET_BYTES = 450 * 1024;

  function resize(file) {
    return new Promise(function (resolve, reject) {
      var bmpPromise = window.createImageBitmap ? createImageBitmap(file, { imageOrientation: 'from-image' }) : loadImg(file);
      bmpPromise.then(function (img) {
        var w = img.width, h = img.height, s = Math.min(1, MAX_SIDE / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
        var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        var q = 0.85;
        (function attempt() {
          c.toBlob(function (blob) {
            if (!blob) return reject(new Error('This photo could not be processed. Try a different one.'));
            if (blob.size > TARGET_BYTES && q > 0.5) { q -= 0.1; attempt(); } else resolve(blob);
          }, 'image/jpeg', q);
        })();
      }).catch(function () { reject(new Error('This photo could not be read. Please use a JPG or PNG.')); });
    });
  }
  function loadImg(file) {
    return new Promise(function (res, rej) {
      var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = URL.createObjectURL(file);
    });
  }

  function PhotoPicker(root, opts) {
    this.root = root; this.max = opts.max; this.min = opts.min;
    this.items = (opts.existing || []).map(function (p) { return { kind: 'existing', key: p.key, url: p.url }; });
    this.onChange = opts.onChange || function () {};
    this.input = document.createElement('input');
    this.input.type = 'file'; this.input.accept = 'image/jpeg,image/png,image/webp'; this.input.multiple = true; this.input.className = 'sr'; this.input.tabIndex = -1;
    var self = this;
    this.input.addEventListener('change', function () { self.addFiles(Array.prototype.slice.call(self.input.files)); self.input.value = ''; });
    root.appendChild(this.input);
    this.msg = document.createElement('div'); this.msg.className = 'err'; this.msg.setAttribute('role', 'alert'); root.appendChild(this.msg);
    this.grid = document.createElement('div'); this.grid.className = 'slots'; root.insertBefore(this.grid, this.msg);
    this.render();
  }
  PhotoPicker.prototype.error = function (t) { this.msg.textContent = t || ''; };
  PhotoPicker.prototype.addFiles = function (files) {
    var self = this; self.error('');
    var room = self.max - self.items.length;
    if (files.length > room) { self.error('You can have up to ' + self.max + ' photos. Remove one to add another.'); files = files.slice(0, Math.max(0, room)); }
    files.reduce(function (p, f) {
      return p.then(function () {
        return resize(f).then(function (blob) { self.items.push({ kind: 'new', blob: blob, url: URL.createObjectURL(blob) }); self.render(); }).catch(function (e) { self.error(e.message); });
      });
    }, Promise.resolve());
  };
  PhotoPicker.prototype.render = function () {
    var self = this, g = this.grid; g.innerHTML = '';
    this.items.forEach(function (it, i) {
      var d = document.createElement('div'); d.className = 'slot';
      var im = document.createElement('img'); im.src = it.url; im.alt = 'Photo ' + (i + 1); d.appendChild(im);
      var tag = document.createElement('span'); tag.className = 'tag' + (it.kind === 'new' && i > 0 ? ' new' : '');
      tag.textContent = i === 0 ? 'Cover' : (it.kind === 'new' ? 'New' : ''); if (tag.textContent) d.appendChild(tag);
      var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'rm'; rm.setAttribute('aria-label', 'Remove photo ' + (i + 1));
      rm.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      rm.addEventListener('click', function () { self.items.splice(i, 1); self.error(''); self.render(); });
      d.appendChild(rm);
      if (i > 0) {
        var mk = document.createElement('button'); mk.type = 'button'; mk.className = 'mk'; mk.textContent = 'Make cover';
        mk.addEventListener('click', function () { var x = self.items.splice(i, 1)[0]; self.items.unshift(x); self.render(); });
        d.appendChild(mk);
      }
      g.appendChild(d);
    });
    if (this.items.length < this.max) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'addslot';
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Add photo';
      b.addEventListener('click', function () { self.input.click(); });
      g.appendChild(b);
    }
    this.onChange(this);
  };
  PhotoPicker.prototype.count = function () { return this.items.length; };
  PhotoPicker.prototype.appendTo = function (fd) {
    var order = [], n = 0;
    this.items.forEach(function (it) {
      if (it.kind === 'existing') order.push(it.key);
      else { order.push('new:' + n++); fd.append('photos', it.blob, 'photo.jpg'); }
    });
    fd.append('order', JSON.stringify(order));
  };

  window.GBB = window.GBB || {};
  window.GBB.PhotoPicker = PhotoPicker;
})();
