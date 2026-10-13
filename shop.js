/* LCM 4x4 SHOP (v2): fast shop grid + filters that read the hourly product index.
   Put a code block containing  <div data-lcm-shop data-root="Equipment" data-filters="vehicle,brand"></div>
   on a shop page. data-root = top-level category name ("" = whole shop).
   data-filters = any of: vehicle, axle, voltage, brand (category, search and sort are always there).
   v2 (14 Oct 2026): Land Rover / Range Rover only. The vehicle filter is Model (group) -> version -> engine,
   from window.LCM_VEH below (also used by the By Vehicle menu and the homepage finder).
   Product tags: "Model: <version>" (e.g. Defender 110), "Model: <group tag>" (fits every version, e.g. Defender),
   "Engine: <engine>" only on engine-specific parts.
   If the index can't be loaded, nothing is changed and the page's normal product block stays. */
window.LCM_VEH = {"groups":[{"n":"Series","t":["Series & Lightweight"],"v":[["Series I","1948–58"],["Series II","1958–61"],["Series IIA","1961–71"],["Series III","1971–85"],["Lightweight","1968–84"]]},{"n":"Defender","t":["Defender"],"v":[["Defender 90","1983–2016"],["Defender 110","1983–2016"],["Defender 130","1983–2016"]]},{"n":"New Defender","t":[],"v":[["Defender L663","2020 on"]]},{"n":"Discovery","t":["Discovery"],"v":[["Discovery 1","1989–98"],["Discovery 2","1998–2004"],["Discovery 3","2004–09"],["Discovery 4","2009–16"],["Discovery 5","2017 on"]]},{"n":"Discovery Sport","t":[],"v":[["Discovery Sport","2014 on"]]},{"n":"Freelander","t":["Freelander"],"v":[["Freelander 1","1997–2006"],["Freelander 2","2006–14"]]},{"n":"Range Rover","t":["Range Rover"],"v":[["Range Rover Classic","1970–96"],["Range Rover P38","1994–2002"],["Range Rover L322","2002–12"],["Range Rover L405","2012–21"],["Range Rover L460","2022 on"]]},{"n":"Range Rover Sport","t":["Range Rover Sport"],"v":[["Range Rover Sport L320","2005–13"],["Range Rover Sport L494","2013–22"],["Range Rover Sport L461","2022 on"]]},{"n":"Range Rover Evoque","t":[],"v":[["Range Rover Evoque","2011 on"]]},{"n":"Range Rover Velar","t":[],"v":[["Range Rover Velar","2017 on"]]}],"eng":{"Series I":["1.6 / 2.0 Petrol","2.0 Diesel"],"Series II":["2.25 Petrol","2.0 Diesel"],"Series IIA":["2.25 Petrol","2.25 Diesel","2.6 Petrol"],"Series III":["2.25 Petrol","2.25 Diesel","2.6 Petrol","Rover V8"],"Lightweight":["2.25 Petrol","2.25 Diesel"],"Defender 90":["2.5 Petrol","2.5 Diesel","2.5 Turbo Diesel","200Tdi","300Tdi","Td5","2.4 TDCi (Puma)","2.2 TDCi (Puma)","Rover V8"],"Defender 110":["2.25 Petrol","2.25 Diesel","2.5 Petrol","2.5 Diesel","2.5 Turbo Diesel","200Tdi","300Tdi","Td5","2.4 TDCi (Puma)","2.2 TDCi (Puma)","Rover V8"],"Defender 130":["2.5 Diesel","2.5 Turbo Diesel","200Tdi","300Tdi","Td5","2.4 TDCi (Puma)","2.2 TDCi (Puma)","Rover V8"],"Defender L663":["2.0 Ingenium","3.0 Ingenium (D250/D300)","P400e Hybrid"],"Discovery 1":["200Tdi","300Tdi","Rover V8","2.0 MPi"],"Discovery 2":["Td5","Rover V8"],"Discovery 3":["2.7 TDV6","4.4 V8","4.0 V6"],"Discovery 4":["2.7 TDV6","3.0 TDV6 / SDV6","5.0 V8"],"Discovery 5":["2.0 Ingenium","3.0 TDV6 / SDV6","3.0 Ingenium (D250/D300)"],"Discovery Sport":["2.2 Td4 / SD4","2.0 Ingenium"],"Freelander 1":["2.0 Td4","2.0 L-Series Di","1.8 K-Series","2.5 KV6"],"Freelander 2":["2.2 Td4 / SD4","3.2 i6"],"Range Rover Classic":["200Tdi","300Tdi","Rover V8","2.4 / 2.5 VM Diesel"],"Range Rover P38":["Rover V8","2.5 BMW Diesel"],"Range Rover L322":["3.0 Td6","3.6 TDV8","4.4 TDV8","4.4 V8","4.2 Supercharged V8","5.0 V8"],"Range Rover L405":["3.0 TDV6 / SDV6","4.4 SDV8","5.0 V8","3.0 Ingenium (D250/D300)"],"Range Rover L460":["3.0 Ingenium (D250/D300)","4.4 V8","P440e / P510e Hybrid"],"Range Rover Sport L320":["2.7 TDV6","3.0 TDV6 / SDV6","3.6 TDV8","4.4 V8","4.2 Supercharged V8","5.0 V8"],"Range Rover Sport L494":["3.0 TDV6 / SDV6","4.4 SDV8","5.0 V8","2.0 Ingenium","3.0 Ingenium (D250/D300)"],"Range Rover Sport L461":["3.0 Ingenium (D250/D300)","4.4 V8","P440e / P510e Hybrid"],"Range Rover Evoque":["2.2 Td4 / SD4","2.0 Ingenium"],"Range Rover Velar":["2.0 Ingenium","3.0 TDV6 / SDV6","3.0 Ingenium (D250/D300)"]}};
(function () {
  var INDEX = 'https://madmonky13.github.io/lcm-shop-index/index.json';
  var PAGE = 24;
  var VEH = window.LCM_VEH || { groups: [], eng: {} };
  var V2G = {}, TAG2G = {}, GBYN = {};
  VEH.groups.forEach(function (g) { GBYN[g.n] = g; g.v.forEach(function (v) { V2G[v[0]] = g.n; }); g.t.forEach(function (t) { TAG2G[t] = g.n; }); });
  TAG2G['Freelander'] = 'Freelander'; TAG2G['Discovery'] = 'Discovery';
  /* versions a product fits: version tags, plus every version of a model it is tagged for as a whole */
  function versionsOf(md) {
    var out = {}, named = {};
    (md || []).forEach(function (t) { if (V2G[t]) { out[t] = 1; named[V2G[t]] = 1; } });
    (md || []).forEach(function (t) { var g = TAG2G[t]; if (g && !named[g] && GBYN[g]) GBYN[g].v.forEach(function (v) { out[v[0]] = 1; }); });
    return out;
  }
  function engOf(g, md) {   /* engines that exist for a chosen model / version */
    var vs = md ? [md] : (GBYN[g] ? GBYN[g].v.map(function (v) { return v[0]; }) : []), out = [];
    vs.forEach(function (v) { (VEH.eng[v] || []).forEach(function (e) { if (out.indexOf(e) < 0) out.push(e); }); });
    return out;
  }
  function yearsOf(md) { var g = GBYN[V2G[md]]; if (!g) return ''; var v = g.v.filter(function (x) { return x[0] === md; })[0]; return v ? v[1] : ''; }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function gbp(n) { return '\u00a3' + Number(n).toFixed(2); }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
  function byName(a, b) { return a.localeCompare(b, 'en', { numeric: true }); }

  /* colour names -> a family (to spread colours across the grid) and a dot colour */
  var FAM = [['red', /red|crimson|burgundy/i, '#c8102e'], ['black', /black|ebony|onyx/i, '#111'], ['silver', /silver|polished|chrome|stainless|raw|natural|bare|alloy(?!.*(red|black|grey|gray|blue|gold))/i, 'linear-gradient(135deg,#f4f4f4,#a9a9a9 55%,#e6e6e6)'], ['grey', /grey|gray|titanium|gunmetal|graphite|charcoal/i, '#7d7d7d'],
    ['gold', /gold|bronze|brass|copper|champagne/i, '#c9a227'], ['blue', /blue|navy|teal|cyan/i, '#1f5fbf'], ['green', /green|olive|khaki|od\b/i, '#4f6b2f'],
    ['orange', /orange/i, '#f15f24'], ['purple', /purple|violet|lilac/i, '#6a3fa0'], ['pink', /pink|rose/i, '#e07aa5'], ['white', /white|ivory/i, '#f4f4f4'],
    ['yellow', /yellow|lime/i, '#e5c100'], ['tan', /tan|sand|desert|beige|coyote|brown/i, '#b08d5b']];
  function fam(name) { for (var i = 0; i < FAM.length; i++) if (FAM[i][1].test(name)) return FAM[i]; return [String(name).toLowerCase(), null, null]; }

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
      (it.cv || []).forEach(function (c) { if (c[1] && !/^https?:/.test(c[1])) c[1] = img + c[1]; });
    });
    idx._n = 1;
    return idx;
  }

  function start(box) {
    if (box.__lcm) return; box.__lcm = 1;
    var rootName = box.getAttribute('data-root') || '';
    var want = (box.getAttribute('data-filters') || 'vehicle,brand').split(',').map(function (s) { return s.trim(); });
    var fixedBrand = box.getAttribute('data-brand') || '';   /* brand landing pages: grid fixed to one brand */
    box.innerHTML = '<div class="lcm-shop-loading">Loading products\u2026</div>';
    var idxReq = window.__lcmIdx || fetch(INDEX, { cache: 'default' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    Promise.all([idxReq])
      .then(function (res) {
        try { build(box, norm(res[0]), rootName, want, fixedBrand); }
        catch (e) {
          /* the list loaded but something went wrong drawing it: reload the page with the old shop */
          if (window.console) console.error('LCM shop error, falling back to the old shop', e);
          if (!/[?&]lcmshop=0/.test(location.search)) location.replace(location.pathname + (location.search ? location.search + '&' : '?') + 'lcmshop=0');
        }
      })
      .catch(function (e) {
        /* safety net: if the product list can't be loaded, put the page's normal product block back */
        box.innerHTML = ''; box.style.display = 'none';
        document.documentElement.classList.remove('lcm-newshop-on');
        document.querySelectorAll('.lcm-shop-replaced').forEach(function (x) { x.classList.remove('lcm-shop-replaced'); });
        if (window.console) console.warn('LCM shop index not available, showing the normal product block', e);
      });
  }

  function build(box, idx, rootName, want, fixedBrand) {
    /* ---- category tree ---- */
    var cats = {}, kids = {};
    idx.cats.forEach(function (c) { cats[c.id] = c; (kids[c.p || 'top'] = kids[c.p || 'top'] || []).push(c.id); });
    function path(id) { var p = []; for (var c = cats[id]; c; c = cats[c.p]) p.unshift(c.n); return p; }
    function below(id) { var out = [id]; (kids[id] || []).forEach(function (k) { out = out.concat(below(k)); }); return out; }
    var root = rootName ? idx.cats.filter(function (c) { return !c.p && c.n === rootName; })[0] : null;
    var rootIds = root ? below(root.id) : null;
    var items = idx.items.filter(function (it) { return !rootIds || it.c.some(function (c) { return rootIds.indexOf(c) >= 0; }); });
    if (fixedBrand) items = items.filter(function (it) { return String(it.b || '').split(',').map(function (x) { return x.trim(); }).indexOf(fixedBrand) >= 0; });
    items.forEach(function (it) {
      var all = {}; it.c.forEach(function (c) { for (var k = c; k; k = cats[k] && cats[k].p) all[k] = 1; }); it._cats = all;
      it._v = it.any ? null : versionsOf(it.md);
    });

    /* ---- state from the URL. Old links (?Manufacturer=...&Model=Model: Discovery 1) still work ---- */
    var q = new URLSearchParams(location.search);
    function tagVal(k) { return (q.get(k) || '').replace(new RegExp('^' + k + ':\\s*'), ''); }
    var st = { cat: null, g: '', md: '', en: tagVal('Engine'), b: tagVal('Brand'), ax: tagVal('Axle'), vo: tagVal('Voltage'), s: q.get('q') || '', sort: q.get('sort') || 'best', shown: PAGE };
    (function () {
      var m = tagVal('Model'), g = q.get('Vehicle') || '', mf = tagVal('Manufacturer');
      if (m && V2G[m]) { st.md = m; st.g = V2G[m]; }
      else if (m && TAG2G[m]) st.g = TAG2G[m];
      else if (g && GBYN[g]) st.g = g;
      else if (!m && mf === 'Range Rover') st.g = 'Range Rover';
      if (st.en && st.g && engOf(st.g, st.md).indexOf(st.en) < 0) st.en = '';
    })();
    if (q.get('category')) {
      var parts = q.get('category').split(','), found = null;
      idx.cats.forEach(function (c) { if (path(c.id).join(',') === parts.join(',')) found = c.id; });
      st.cat = found;
      if (root && st.cat === root.id) st.cat = null;
    }

    function match(it, skip) {
      if (skip !== 'cat' && st.cat && !it._cats[st.cat]) return false;
      if (skip !== 'veh' && st.g && !it.any) {
        if (st.md) { if (!it._v[st.md]) return false; }
        else if (!GBYN[st.g].v.some(function (v) { return it._v[v[0]]; })) return false;
      }
      if (skip !== 'veh' && skip !== 'en' && st.en && !engineOk(it)) return false;
      if (skip !== 'b' && st.b && (it.b || []).indexOf(st.b) < 0) return false;
      if (skip !== 'ax' && st.ax && (it.ax || []).indexOf(st.ax) < 0) return false;
      if (skip !== 'vo' && st.vo && (it.vo || []).indexOf(st.vo) < 0) return false;
      if (st.s) {
        var hay = (it.t + ' ' + (it.b || []).join(' ')).toLowerCase();
        if (!st.s.toLowerCase().split(/\s+/).every(function (w) { return !w || hay.indexOf(w) >= 0; })) return false;
      }
      return true;
    }
    /* engine: parts not tagged with an engine of this vehicle fit whatever engine it has */
    function engineOk(it) {
      if (!st.g) return !!(it.en && it.en.indexOf(st.en) >= 0);          /* engine on its own: only parts made for it */
      if (it.any || !it.en || !it.en.length) return true;
      var here = engOf(st.g, st.md), rel = it.en.filter(function (e) { return here.indexOf(e) >= 0; });
      return !rel.length || rel.indexOf(st.en) >= 0;
    }
    function exact(it) { return st.en && it.en && it.en.indexOf(st.en) >= 0 ? 0 : 1; }
    function sorted(list) {
      var a = list.slice();
      if (st.sort === 'new') a.sort(function (x, y) { return (y.a || 0) - (x.a || 0); });
      else if (st.sort === 'low') a.sort(function (x, y) { return (x.p || 0) - (y.p || 0); });
      else if (st.sort === 'high') a.sort(function (x, y) { return (y.p || 0) - (x.p || 0); });
      else if (st.sort === 'az') a.sort(function (x, y) { return byName(x.t, y.t); });
      else if (st.sort === 'za') a.sort(function (x, y) { return byName(y.t, x.t); });
      else a.sort(function (x, y) { return ((st.g ? (x.any ? 1 : 0) - (y.any ? 1 : 0) : 0)) || (exact(x) - exact(y)) || ((y.s - x.s)) || (x.o - y.o); });
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
    var open = { cat: true }, openCat = {}, openVeh = {};
    if (st.g && !st.md) open.veh = true;
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
      return li;
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
      wrap.appendChild(dd('cat', 'Category', st.cat ? cats[st.cat].n : '', !!st.cat, function (ul) {
        function onPath(id) { for (var k = st.cat; k; k = cats[k] && cats[k].p) if (k === id) return true; return false; }
        function sub(id) { return (kids[id] || []).filter(function (k) { return cc[k]; }).sort(function (x, y) { return byName(cats[x].n, cats[y].n); }); }
        function addCat(id, depth) {
          var ks = sub(id), isOpen = ks.length > 0 && (id in openCat ? openCat[id] : onPath(id));
          var li = opt(ul, cats[id].n, onPath(id), depth, function () {
            if (st.cat === id) st.cat = cats[id].p && cats[id].p !== (root && root.id) ? cats[id].p : null;
            else { st.cat = id; delete openCat[id]; }
            change();
          });
          if (ks.length) {
            var tg = el('span', 'lcm-f-tog', isOpen ? '\u2212' : '+'); tg.title = isOpen ? 'Hide' : 'Show more';
            tg.onclick = function (e) { e.preventDefault(); openCat[id] = !isOpen; drawSide(); };
            li.appendChild(tg);
            if (isOpen) ks.forEach(function (k) { addCat(k, depth + 1); });
          }
        }
        sub(root ? root.id : 'top').forEach(function (k) { addCat(k, 1); });
      }, function () { st.cat = null; change(); }));
      /* vehicle: Land Rover / Range Rover model, then version (with years), then engine */
      if (want.indexOf('vehicle') >= 0) {
        var vlabel = st.md || st.g;
        wrap.appendChild(dd('veh', 'Vehicle', vlabel, !!st.g, function (ul) {
          VEH.groups.forEach(function (g) {
            var single = g.v.length === 1, isOpen = single ? false : (g.n in openVeh ? openVeh[g.n] : st.g === g.n);
            var li = opt(ul, g.n, st.g === g.n && (!st.md || single), 1, function () {
              if (st.g === g.n && !st.md) { st.g = ''; } else { st.g = g.n; st.md = single ? g.v[0][0] : ''; }
              st.en = ''; delete openVeh[g.n]; if (st.g && !single) openVeh[g.n] = true; change();
            });
            if (single) { li.firstChild.insertAdjacentHTML('beforeend', ' <small>' + esc(g.v[0][1]) + '</small>'); return; }
            var tg = el('span', 'lcm-f-tog', isOpen ? '−' : '+'); tg.title = isOpen ? 'Hide' : 'Show versions';
            tg.onclick = function (e) { e.preventDefault(); openVeh[g.n] = !isOpen; drawSide(); };
            li.appendChild(tg);
            if (isOpen) g.v.forEach(function (v) {
              var l2 = opt(ul, v[0], st.md === v[0], 2, function () { if (st.md === v[0]) st.md = ''; else { st.g = g.n; st.md = v[0]; } st.en = ''; open.veh = false; if (st.md && engOf(st.g, st.md).length) open.en = true; change(); });
              l2.firstChild.insertAdjacentHTML('beforeend', ' <small>' + esc(v[1]) + '</small>');
            });
          });
        }, function () { st.g = ''; st.md = ''; st.en = ''; change(); }));
        /* engine: only engines with at least one engine-specific part for this vehicle (or all, with no vehicle chosen) */
        var ec = counts('en', function (it) { return it.en; });
        var engs = (st.g ? engOf(st.g, st.md) : Object.keys(ec).sort(byName)).filter(function (e) { return ec[e] || e === st.en; });
        if (engs.length) wrap.appendChild(dd('en', 'Engine', st.en, !!st.en, function (ul) {
          engs.forEach(function (e) { opt(ul, e, st.en === e, 1, function () { st.en = st.en === e ? '' : e; open.en = false; change(); }); });
        }, function () { st.en = ''; change(); }));
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
    /* pick which colour photo each card shows, so neighbouring cards aren't all the same colour */
    var used = {}, recent = [];
    function pickColour(it) {
      var cv = it.cv, pool = cv.filter(function (c) { return c[2]; });
      if (!pool.length) pool = cv;
      var best = null, bestScore = 1e9;
      pool.forEach(function (c, n) {
        var f = fam(c[0])[0], score = (used[f] || 0) * 10 + n;
        if (recent.indexOf(f) >= 0) score += 1000;            /* never the same colour as the last few cards if avoidable */
        if (score < bestScore) { bestScore = score; best = c; }
      });
      var f = fam(best[0])[0]; used[f] = (used[f] || 0) + 1; recent.push(f); if (recent.length > 3) recent.shift();
      return best;
    }
    function card(it) {
      var a = el('a', 'lcm-card' + (it.s ? '' : ' out')); a.href = it.u;
      var show = it.i, alt = it.i2, label = it.t, dots = '';
      if (it.cv) {
        var c = pickColour(it); show = c[1]; label = it.t + ' \u2013 ' + c[0];
        var other = it.cv.filter(function (x) { return x !== c && fam(x[0])[0] !== fam(c[0])[0]; })[0] || it.cv.filter(function (x) { return x !== c; })[0];
        alt = other ? other[1] : it.i2;
      }
      var cnames = it.cn || (it.cv ? it.cv.map(function (x) { return x[0]; }) : []);
      if (cnames.length > 1) {
        var photo = {}; (it.cv || []).forEach(function (x) { photo[x[0]] = x[1]; });
        var shown = 0, ds = '';
        cnames.forEach(function (x) {
          var f = fam(x); if (!f[2] || shown >= 6) return; shown++;
          var out = (it.co || []).indexOf(x) >= 0;
          ds += '<i class="' + (out ? 'x' : '') + '" style="background:' + f[2] + '" title="' + esc(x) + (out ? ' (out of stock)' : '') + '"' + (photo[x] ? ' data-img="' + esc(photo[x]) + '?format=500w"' : '') + '></i>';
        });
        if (shown > 1) dots = '<span class="lcm-card-sw">' + ds + (cnames.length > shown ? '<em>+' + (cnames.length - shown) + '</em>' : '') + '</span>';
      }
      var img = show ? '<img loading="lazy" decoding="async" src="' + esc(show) + '?format=500w" alt="' + esc(label) + '">' : '';
      var altImg = alt && alt !== show ? '<img class="lcm-card-alt" alt="" aria-hidden="true" data-src="' + esc(alt) + '?format=500w">' : '';
      var badge = !it.s ? '<span class="lcm-card-badge out">Out of stock</span>' : it.sale ? '<span class="lcm-card-badge sale">Sale</span>' : '';
      var price = it.p != null ? '<div class="lcm-card-p">' + (it.f ? '<small>from</small> ' : '') + '<b>' + gbp(it.p) + '</b>' + (it.w ? ' <s>' + gbp(it.w) + '</s>' : '') + '</div>' : '';
      var tags = (it.b && it.b[0] ? '<span class="lcm-card-brand">' + esc(it.b[0]) + '</span>' : '') + dots + (it.any && (st.g || st.en) ? '<span class="lcm-card-any">Fits any vehicle</span>' : '');
      a.innerHTML = '<div class="lcm-card-img">' + img + altImg + badge + '</div><div class="lcm-card-body"><div class="lcm-card-tags">' + tags + '</div><div class="lcm-card-t">' + esc(it.t) + '</div>' + price + '</div>';
      return a;
    }
    /* hover photo: only fetched when the mouse first goes over a card */
    var canHover = window.matchMedia && matchMedia('(hover: hover)').matches;
    function overlay(cardEl) {
      var im = cardEl.querySelector('.lcm-card-alt');
      if (!im) { im = el('img', 'lcm-card-alt'); im.alt = ''; im.setAttribute('aria-hidden', 'true'); var box = cardEl.querySelector('.lcm-card-img'); box.insertBefore(im, box.querySelector('.lcm-card-badge')); }
      return im;
    }
    function showOn(im, src) {
      if (im.getAttribute('src') === src) { im.classList.add('ok'); return; }
      im.classList.remove('ok'); im.onload = function () { im.classList.add('ok'); }; im.src = src;
    }
    grid.addEventListener('mouseover', function (e) {
      if (!canHover || !e.target.closest) return;
      var c = e.target.closest('.lcm-card'); if (!c) return;
      var dot = e.target.closest('.lcm-card-sw i[data-img]');
      var im = overlay(c);
      if (!im.hasAttribute('data-def')) im.setAttribute('data-def', im.getAttribute('data-src') || '');
      if (dot) { c.classList.add('lcm-dot'); showOn(im, dot.getAttribute('data-img')); return; }
      c.classList.remove('lcm-dot');
      var def = im.getAttribute('data-def'); if (def) showOn(im, def); else im.classList.remove('ok');
    });
    grid.addEventListener('mouseout', function (e) {
      var c = e.target.closest && e.target.closest('.lcm-card');
      if (c && !c.contains(e.relatedTarget)) c.classList.remove('lcm-dot');
    });
    function drawGrid(reset) {
      if (reset) { grid.innerHTML = ''; grid._n = 0; used = {}; recent = []; }
      var upto = Math.min(st.shown, list.length), frag = document.createDocumentFragment();
      var firstAny = -1;
      if (st.g && st.sort === 'best') for (var i = 0; i < list.length; i++) if (list[i].any) { firstAny = i; break; }
      for (var n = grid._n || 0; n < upto; n++) {
        if (n === firstAny && firstAny > 0) frag.appendChild(el('div', 'lcm-shop-divider', 'Also fits your ' + esc(st.md || st.g) + ' \u2014 kit that fits any vehicle'));
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
      var c = grid.querySelector('[data-clear]'); if (c) c.onclick = function (e) { e.preventDefault(); st.cat = null; st.g = st.md = st.en = st.b = st.ax = st.vo = st.s = ''; change(); };
    }
    function drawBar() {
      var chips = [];
      if (st.cat) chips.push(['cat', cats[st.cat].n]);
      if (st.g) chips.push(['veh', st.md || st.g]);
      if (st.en) chips.push(['en', st.en]);
      ['b', 'ax', 'vo'].forEach(function (k) { if (st[k]) chips.push([k, st[k]]); });
      if (st.s) chips.push(['s', '\u201c' + st.s + '\u201d']);
      bar.innerHTML = '<span class="lcm-shop-count">' + list.length + ' product' + (list.length === 1 ? '' : 's') + '</span>' +
        chips.map(function (c) { return '<button type="button" data-k="' + c[0] + '">' + esc(c[1]) + ' \u2715</button>'; }).join('');
      bar.querySelectorAll('button').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-k'); if (k === 'cat') st.cat = null; else if (k === 'veh') { st.g = ''; st.md = ''; st.en = ''; } else st[k] = ''; change(); }; });
    }
    function writeUrl() {
      var p = new URLSearchParams();
      if (st.cat) p.set('category', path(st.cat).join(','));
      if (st.md) p.set('Model', 'Model: ' + st.md);
      else if (st.g) p.set('Vehicle', st.g);
      if (st.en) p.set('Engine', 'Engine: ' + st.en);
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
      drawBar(); drawGrid(true); writeUrl(); syncChips();
      try { document.dispatchEvent(new CustomEvent('lcm-shop-change', { detail: st })); } catch (e) {}
    }
    /* the orange category buttons in the page band: switch category in place, and keep their highlight in step */
    function here(u) { return u.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, ''); }
    var catCount = {}, byPath = {};
    items.forEach(function (it) { Object.keys(it._cats).forEach(function (k) { catCount[k] = (catCount[k] || 0) + 1; }); });
    idx.cats.forEach(function (c) { byPath[path(c.id).join(',').toLowerCase()] = c.id; });
    function syncChips() {
      var cur = st.cat ? path(st.cat).join(',').toLowerCase() : '';
      document.querySelectorAll('.lcm-chips a').forEach(function (a) {
        var u; try { u = new URL(a.getAttribute('href'), location.origin); } catch (e) { return; }
        /* the numbers on the buttons come from the same product list as the grid, so they always agree */
        var target = (u.searchParams.get('category') || '').toLowerCase(), n = a.querySelector('.n');
        var top = { '/shop/accessories': 'accessories', '/shop/body': 'body', '/shop/chassis': 'chassis', '/shop/axles-suspension': 'axles & suspension', '/shop/brake-clutch': 'brakes & clutches', '/shop/electrical': 'electrical', '/shop/equipment': 'equipment' }[u.pathname.replace(/\/$/, '')];
        var num = target ? catCount[byPath[target]] : here(u) ? items.length : top ? catCount[byPath[top]] : null;
        if (n && num != null) n.textContent = num;
        if (!here(u)) return;
        var v = target;
        a.classList.toggle('on', v ? (cur === v || cur.indexOf(v + ',') === 0) : (!cur || (root && cur === root.n.toLowerCase())));
      });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.lcm-chips a');
      if (!a || !document.body.contains(box) || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var u; try { u = new URL(a.getAttribute('href'), location.origin); } catch (x) { return; }
      if (!here(u)) return;
      e.preventDefault(); e.stopPropagation();
      var v = u.searchParams.get('category'); st.cat = null;
      if (v) idx.cats.forEach(function (c) { if (path(c.id).join(',') === v) st.cat = c.id; });
      if (st.cat && root && st.cat === root.id) st.cat = null;
      change();
    }, true);
    if ('MutationObserver' in window) {
      var chipWatch = new MutationObserver(function () { if (document.querySelector('.lcm-chips a')) { chipWatch.disconnect(); syncChips(); } });
      if (document.querySelector('.lcm-chips a')) setTimeout(syncChips, 0); else { chipWatch.observe(document.body, { childList: true, subtree: true }); setTimeout(function () { chipWatch.disconnect(); }, 15000); }
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
