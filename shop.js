/* LCM 4x4 SHOP (v1): fast shop grid + filters that read the hourly product index.
   Put a code block containing  <div data-lcm-shop data-root="Equipment" data-filters="vehicle,brand"></div>
   on a shop page. data-root = top-level category name ("" = whole shop).
   data-filters = any of: vehicle, axle, voltage, brand (category, search and sort are always there).
   If the index can't be loaded, nothing is changed and the page's normal product block stays. */
(function () {
  var INDEX = 'https://madmonky13.github.io/lcm-shop-index/index.json';
  var PAGE = 24;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function gbp(n) { return '\u00a3' + Number(n).toFixed(2); }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
  function byName(a, b) { return a.localeCompare(b, 'en', { numeric: true }); }

  function vehicles() {
    try { var v = JSON.parse(localStorage.getItem('lcm_veh_v1') || 'null'); if (v && v.exp > Date.now()) return Promise.resolve(v.data); } catch (e) {}
    return fetch('/shop-by-vehicle-menu').then(function (r) { return r.text(); }).then(function (h) {
      var d = new DOMParser().parseFromString(h, 'text/html'), map = {};
      d.querySelectorAll('a[href*="Manufacturer="]').forEach(function (a) {
        try {
          var u = new URL(a.getAttribute('href'), location.origin);
          var m = (u.searchParams.get('Manufacturer') || '').replace(/^Manufacturer:\s*/, ''), md = (u.searchParams.get('Model') || '').replace(/^Model:\s*/, '');
          if (!m) return; map[m] = map[m] || []; if (md && map[m].indexOf(md) < 0) map[m].push(md);
        } catch (e) {}
      });
      try { localStorage.setItem('lcm_veh_v1', JSON.stringify({ exp: Date.now() + 864e5, data: map })); } catch (e) {}
      return map;
    }).catch(function () { return {}; });
  }

  /* the index is stored compactly (v2): put the short category numbers, photo and link prefixes back */
  function norm(idx) {
    if (!idx || idx.v < 2 || idx._n) return idx;
    var img = idx.img || '';
    idx.cats = idx.cats.map(function (c, n) { return { id: 'c' + n, n: c.n, p: c.p == null ? null : 'c' + c.p }; });
    idx.items.forEach(function (it) {
      it.c = (it.c || []).map(function (x) { return 'c' + x; });
      if (it.i && !/^https?:/.test(it.i)) it.i = img + it.i;
      if (it.i2 && !/^https?:/.test(it.i2)) it.i2 = img + it.i2;
      if (it.u && it.u.charAt(0) !== '/') it.u = '/store/p/' + it.u;
    });
    idx._n = 1;
    return idx;
  }

  function start(box) {
    if (box.__lcm) return; box.__lcm = 1;
    var rootName = box.getAttribute('data-root') || '';
    var want = (box.getAttribute('data-filters') || 'vehicle,brand').split(',').map(function (s) { return s.trim(); });
    box.innerHTML = '<div class="lcm-shop-loading">Loading products\u2026</div>';
    var idxReq = window.__lcmIdx || fetch(INDEX, { cache: 'default' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    Promise.all([idxReq, vehicles()])
      .then(function (res) { build(box, norm(res[0]), res[1], rootName, want); })
      .catch(function (e) { box.innerHTML = ''; box.style.display = 'none'; if (window.console) console.warn('LCM shop index not available, keeping the normal product block', e); });
  }

  function build(box, idx, vmap, rootName, want) {
    /* ---- category tree ---- */
    var cats = {}, kids = {};
    idx.cats.forEach(function (c) { cats[c.id] = c; (kids[c.p || 'top'] = kids[c.p || 'top'] || []).push(c.id); });
    function path(id) { var p = []; for (var c = cats[id]; c; c = cats[c.p]) p.unshift(c.n); return p; }
    function below(id) { var out = [id]; (kids[id] || []).forEach(function (k) { out = out.concat(below(k)); }); return out; }
    var root = rootName ? idx.cats.filter(function (c) { return !c.p && c.n === rootName; })[0] : null;
    var rootIds = root ? below(root.id) : null;
    var items = idx.items.filter(function (it) { return !rootIds || it.c.some(function (c) { return rootIds.indexOf(c) >= 0; }); });
    items.forEach(function (it) { var all = {}; it.c.forEach(function (c) { for (var k = c; k; k = cats[k] && cats[k].p) all[k] = 1; }); it._cats = all; });

    /* ---- state from the URL (same links as before) ---- */
    var q = new URLSearchParams(location.search);
    function tagVal(k) { return (q.get(k) || '').replace(new RegExp('^' + k + ':\\s*'), ''); }
    var st = { cat: null, mf: tagVal('Manufacturer'), md: tagVal('Model'), b: tagVal('Brand'), ax: tagVal('Axle'), vo: tagVal('Voltage'), s: q.get('q') || '', sort: q.get('sort') || 'best', shown: PAGE };
    if (q.get('category')) {
      var parts = q.get('category').split(','), found = null;
      idx.cats.forEach(function (c) { if (path(c.id).join(',') === parts.join(',')) found = c.id; });
      st.cat = found;
    }

    function match(it, skip) {
      if (skip !== 'cat' && st.cat && !it._cats[st.cat]) return false;
      if (skip !== 'veh' && st.mf && !it.any) {
        if ((it.mf || []).indexOf(st.mf) < 0) return false;
        if (st.md && (it.md || []).indexOf(st.md) < 0) return false;
      }
      if (skip !== 'b' && st.b && (it.b || []).indexOf(st.b) < 0) return false;
      if (skip !== 'ax' && st.ax && (it.ax || []).indexOf(st.ax) < 0) return false;
      if (skip !== 'vo' && st.vo && (it.vo || []).indexOf(st.vo) < 0) return false;
      if (st.s) {
        var hay = (it.t + ' ' + (it.b || []).join(' ')).toLowerCase();
        if (!st.s.toLowerCase().split(/\s+/).every(function (w) { return !w || hay.indexOf(w) >= 0; })) return false;
      }
      return true;
    }
    function sorted(list) {
      var a = list.slice();
      if (st.sort === 'new') a.sort(function (x, y) { return (y.a || 0) - (x.a || 0); });
      else if (st.sort === 'low') a.sort(function (x, y) { return (x.p || 0) - (y.p || 0); });
      else if (st.sort === 'high') a.sort(function (x, y) { return (y.p || 0) - (x.p || 0); });
      else if (st.sort === 'az') a.sort(function (x, y) { return byName(x.t, y.t); });
      else if (st.sort === 'za') a.sort(function (x, y) { return byName(y.t, x.t); });
      else a.sort(function (x, y) { return ((st.mf ? (x.any ? 1 : 0) - (y.any ? 1 : 0) : 0)) || ((y.s - x.s)) || (x.o - y.o); });
      return a;
    }

    /* ---- layout ---- */
    box.innerHTML = '';
    box.classList.add('lcm-newshop');
    var side = el('aside', 'lcm-shop-side'), main = el('div', 'lcm-shop-main');
    var toggle = el('button', 'lcm-shop-toggle', 'Filter'); toggle.type = 'button';
    toggle.onclick = function () { box.classList.toggle('lcm-shop-open'); };
    var bar = el('div', 'lcm-shop-bar'), grid = el('div', 'lcm-shop-grid'), more = el('div', 'lcm-shop-more');
    main.appendChild(bar); main.appendChild(grid); main.appendChild(more);
    box.appendChild(toggle); box.appendChild(side); box.appendChild(main);

    /* ---- filter panel, built to look like the old Universal Filter drop-downs ---- */
    var open = { cat: true };
    function dd(key, name, valueText, active, buildList, onReset) {
      var b = el('div', 'lcm-f-block lcm-f-dd' + (open[key] ? ' open' : '') + (active ? ' active' : ''));
      var lab = el('button', 'lcm-f-label'); lab.type = 'button';
      lab.innerHTML = '<span class="lcm-f-title"><span class="lcm-f-name">' + esc(name) + '</span><span class="lcm-f-val">' + (active ? ' : ' + esc(valueText) : ' : All') + '</span></span>' +
        (active ? '<span class="lcm-f-x" title="Clear">×</span>' : '<span class="lcm-f-chev"></span>');
      lab.onclick = function (e) {
        if (e.target.classList.contains('lcm-f-x')) { onReset(); return; }
        open[key] = !open[key]; b.classList.toggle('open', !!open[key]);
      };
      var ul = el('ul', 'lcm-f-list'); buildList(ul);
      b.appendChild(lab); b.appendChild(ul);
      return b;
    }
    function opt(ul, text, on, depth, onclick) {
      var li = el('li', 'lcm-f-opt d' + depth), a = el('a', on ? 'on' : '', esc(text)); a.href = '#';
      a.onclick = function (e) { e.preventDefault(); onclick(); };
      li.appendChild(a); ul.appendChild(li);
    }
    function buttons(title, opts, val, onclick) {
      var w = el('div', 'lcm-f-block lcm-has-fbtns'), box = el('div', 'lcm-fbtns');
      box.appendChild(el('div', 'lcm-fbtns-h', esc(title)));
      var row = el('div', 'lcm-fbtns-row');
      [['', 'All']].concat(opts).forEach(function (o) {
        var b = el('button', o[0] === val ? 'on' : '', esc(o[1])); b.type = 'button';
        b.onclick = function () { onclick(o[0]); }; row.appendChild(b);
      });
      box.appendChild(row); w.appendChild(box);
      return w;
    }
    function counts(skip, key) {
      var c = {}; items.forEach(function (it) { if (!match(it, skip)) return; (key(it) || []).forEach(function (v) { c[v] = (c[v] || 0) + 1; }); }); return c;
    }

    function drawSide() {
      side.innerHTML = '';
      var wrap = el('div', 'lcm-f-wrap'); side.appendChild(wrap);
      /* category */
      var cc = counts('cat', function (it) { return Object.keys(it._cats); });
      wrap.appendChild(dd('cat', 'Category', st.cat ? path(st.cat).join(', ') : '', !!st.cat, function (ul) {
        function addCat(id, depth) {
          if (!cc[id]) return;
          var on = !!(st.cat && (st.cat === id || (function () { for (var k = cats[st.cat] && cats[st.cat].p; k; k = cats[k].p) if (k === id) return true; return false; })()));
          opt(ul, cats[id].n, on, depth, function () { st.cat = st.cat === id ? (cats[id].p && cats[id].p !== (root && root.id) ? cats[id].p : null) : id; change(); });
          (kids[id] || []).slice().sort(function (x, y) { return byName(cats[x].n, cats[y].n); }).forEach(function (k) { addCat(k, depth + 1); });
        }
        if (root) { opt(ul, root.n, !st.cat, 1, function () { st.cat = null; change(); }); (kids[root.id] || []).slice().sort(function (x, y) { return byName(cats[x].n, cats[y].n); }).forEach(function (k) { addCat(k, 2); }); }
        else (kids.top || []).slice().sort(function (x, y) { return byName(cats[x].n, cats[y].n); }).forEach(function (k) { addCat(k, 1); });
      }, function () { st.cat = null; change(); }));
      /* vehicle: manufacturer + model */
      if (want.indexOf('vehicle') >= 0) {
        var mc = counts('veh', function (it) { return it.mf; });
        var makes = uniq(Object.keys(vmap).concat(Object.keys(mc))).sort(byName);   /* universal kit fits every make, so list them all */
        wrap.appendChild(dd('mf', 'Manufacturer', st.mf, !!st.mf, function (ul) {
          makes.forEach(function (m) { opt(ul, m, st.mf === m, 1, function () { st.mf = st.mf === m ? '' : m; st.md = ''; open.mf = false; if (st.mf) open.md = true; change(); }); });
        }, function () { st.mf = ''; st.md = ''; change(); }));
        var mdc = counts('veh', function (it) { return st.mf && (it.mf || []).indexOf(st.mf) < 0 ? [] : it.md; });
        var allModels = [].concat.apply([], Object.keys(vmap).map(function (k) { return vmap[k]; }));
        var models = uniq((st.mf ? (vmap[st.mf] || []) : allModels).concat(Object.keys(mdc))).sort(byName);
        wrap.appendChild(dd('md', 'Model', st.md, !!st.md, function (ul) {
          models.forEach(function (m) { opt(ul, m, st.md === m, 1, function () { st.md = st.md === m ? '' : m; open.md = false; change(); }); });
        }, function () { st.md = ''; change(); }));
      }
      /* axle / voltage as buttons (same as before) */
      [['axle', 'ax', 'Axle'], ['voltage', 'vo', 'Voltage']].forEach(function (f) {
        if (want.indexOf(f[0]) < 0) return;
        var c = counts(f[1], function (it) { return it[f[1]]; });
        var vals = Object.keys(c).sort(byName); if (!vals.length) return;
        wrap.appendChild(buttons(f[2], vals.map(function (v) { return [v, v]; }), st[f[1]], function (v) { st[f[1]] = v; change(); }));
      });
      /* brand */
      if (want.indexOf('brand') >= 0) {
        var bc = counts('b', function (it) { return it.b; });
        wrap.appendChild(dd('b', 'Brand', st.b, !!st.b, function (ul) {
          Object.keys(bc).sort(byName).forEach(function (b) { opt(ul, b, st.b === b, 1, function () { st.b = st.b === b ? '' : b; open.b = false; change(); }); });
        }, function () { st.b = ''; change(); }));
      }
      /* sort */
      var sorts = [['az', 'A-Z'], ['za', 'Z-A'], ['low', '£-£££'], ['high', '£££-£'], ['new', 'Newest']];
      var cur = sorts.filter(function (x) { return x[0] === st.sort; })[0];
      var sb = dd('sort', 'Sort', cur ? cur[1] : '', !!cur, function (ul) {
        sorts.forEach(function (x) { opt(ul, x[1], st.sort === x[0], 1, function () { st.sort = st.sort === x[0] ? 'best' : x[0]; open.sort = false; change(); }); });
      }, function () { st.sort = 'best'; change(); });
      if (!cur) sb.querySelector('.lcm-f-val').textContent = '';
      wrap.appendChild(sb);
      /* search */
      var sw = el('div', 'lcm-f-block lcm-f-search'), si = el('input'); si.type = 'search'; si.placeholder = 'Search'; si.value = st.s;
      var t; si.oninput = function () { clearTimeout(t); t = setTimeout(function () { st.s = si.value.trim(); change(true); }, 200); };
      sw.appendChild(si); wrap.appendChild(sw);
      /* same help box as before */
      side.appendChild(el('div', 'lcm-help', '<b>Not sure what fits?</b><p>Send us your VIN or a photo and we’ll check before you order.</p><a href="/contact">MESSAGE US →</a>'));
    }

    var list = [];
    function card(it) {
      var a = el('a', 'lcm-card' + (it.s ? '' : ' out')); a.href = it.u;
      var img = it.i ? '<img loading="lazy" decoding="async" src="' + esc(it.i) + '?format=500w" alt="' + esc(it.t) + '">' : '';
      var badge = !it.s ? '<span class="lcm-card-badge out">Out of stock</span>' : it.sale ? '<span class="lcm-card-badge sale">Sale</span>' : '';
      var price = it.p != null ? '<div class="lcm-card-p">' + (it.f ? '<small>from</small> ' : '') + '<b>' + gbp(it.p) + '</b>' + (it.w ? ' <s>' + gbp(it.w) + '</s>' : '') + '</div>' : '';
      var tags = (it.b && it.b[0] ? '<span class="lcm-card-brand">' + esc(it.b[0]) + '</span>' : '') + (it.any && st.mf ? '<span class="lcm-card-any">Fits any vehicle</span>' : '');
      a.innerHTML = '<div class="lcm-card-img">' + img + badge + '</div><div class="lcm-card-body"><div class="lcm-card-tags">' + tags + '</div><div class="lcm-card-t">' + esc(it.t) + '</div>' + price + '</div>';
      return a;
    }
    function drawGrid(reset) {
      if (reset) { grid.innerHTML = ''; grid._n = 0; }
      var upto = Math.min(st.shown, list.length), frag = document.createDocumentFragment();
      var firstAny = -1;
      if (st.mf && st.sort === 'best') for (var i = 0; i < list.length; i++) if (list[i].any) { firstAny = i; break; }
      for (var n = grid._n || 0; n < upto; n++) {
        if (n === firstAny && firstAny > 0) frag.appendChild(el('div', 'lcm-shop-divider', 'Also fits your ' + esc(st.md || st.mf) + ' \u2014 kit that fits any vehicle'));
        frag.appendChild(card(list[n]));
      }
      grid.appendChild(frag); grid._n = upto;
      more.innerHTML = '';
      if (upto < list.length) {
        var b = el('button', 'lcm-shop-morebtn', 'Show more (' + (list.length - upto) + ' left)'); b.type = 'button';
        b.onclick = function () { st.shown += PAGE * 2; drawGrid(); };
        more.appendChild(b);
      }
      if (!list.length) grid.innerHTML = '<div class="lcm-shop-none">No products match these filters. <a href="#" data-clear>Clear filters</a> or <a href="/contact">ask us</a> \u2014 we can often get parts that aren\u2019t listed.</div>';
      var c = grid.querySelector('[data-clear]'); if (c) c.onclick = function (e) { e.preventDefault(); st.cat = null; st.mf = st.md = st.b = st.ax = st.vo = st.s = ''; change(); };
    }
    function drawBar() {
      var chips = [];
      if (st.cat) chips.push(['cat', cats[st.cat].n]);
      if (st.mf) chips.push(['mf', st.md ? st.mf + ' ' + st.md : st.mf]);
      ['b', 'ax', 'vo'].forEach(function (k) { if (st[k]) chips.push([k, st[k]]); });
      if (st.s) chips.push(['s', '\u201c' + st.s + '\u201d']);
      bar.innerHTML = '<span class="lcm-shop-count">' + list.length + ' product' + (list.length === 1 ? '' : 's') + '</span>' +
        chips.map(function (c) { return '<button type="button" data-k="' + c[0] + '">' + esc(c[1]) + ' \u2715</button>'; }).join('');
      bar.querySelectorAll('button').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-k'); if (k === 'cat') st.cat = null; else if (k === 'mf') { st.mf = ''; st.md = ''; } else st[k] = ''; change(); }; });
    }
    function writeUrl() {
      var p = new URLSearchParams();
      if (st.cat) p.set('category', path(st.cat).join(','));
      if (st.mf) p.set('Manufacturer', 'Manufacturer: ' + st.mf);
      if (st.md) p.set('Model', 'Model: ' + st.md);
      if (st.b) p.set('Brand', 'Brand: ' + st.b);
      if (st.ax) p.set('Axle', 'Axle: ' + st.ax);
      if (st.vo) p.set('Voltage', 'Voltage: ' + st.vo);
      if (st.s) p.set('q', st.s);
      if (st.sort !== 'best') p.set('sort', st.sort);
      if (q.get('lcmshop')) p.set('lcmshop', q.get('lcmshop'));
      var s = p.toString().replace(/\+/g, '%20');
      history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
    }
    function change(keepSide) {
      st.shown = PAGE;
      list = sorted(items.filter(function (it) { return match(it); }));
      if (!keepSide) drawSide();
      drawBar(); drawGrid(true); writeUrl();
      try { document.dispatchEvent(new CustomEvent('lcm-shop-change', { detail: st })); } catch (e) {}
    }
    /* load the next batch well before the bottom is reached */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting && grid._n < list.length) { st.shown += PAGE; drawGrid(); } }, { rootMargin: '1200px 0px' }).observe(more);
    }
    /* the page's original product block is now replaced */
    document.querySelectorAll('.sqs-block-summary-v2, .summary-block-wrapper').forEach(function (b) { var blk = b.closest('.fe-block') || b.closest('.sqs-block') || b; blk.classList.add('lcm-shop-replaced'); });
    document.documentElement.classList.add('lcm-shop-ready');
    box.setAttribute('data-built', new Date(idx.built).toISOString());
    change();
  }

  function init() { document.querySelectorAll('[data-lcm-shop]').forEach(start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('mercury:load', init);
})();
