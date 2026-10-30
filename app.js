/* KLIKI Supplier Check - UI */
(function () {
  'use strict';
  var L = window.KlikiLogic, C = window.KLIKI_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var h = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ---------- storan ---------- */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('ksp.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('ksp.' + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('ksp.' + k); } catch (e) {} }
  };

  var cache = LS.get('cache', null);
  var data = cache && cache.data ? cache.data : L.clone(L.SEED);
  ['suppliers', 'priority', 'jarak', 'ada', 'stok', 'harga'].forEach(function (k) { if (!data[k]) data[k] = L.clone(L.SEED[k] || []); });
  if (!data.outletNota) data.outletNota = L.clone(L.SEED.outletNota);

  var state = {
    tab: 'semak',
    outlet: LS.get('outlet', 'Kulim'),
    kat: LS.get('kat', 'iP Used'),
    model: '',
    skips: new Set(),
    cart: LS.get('cart', []),
    urgent: false,
    admin: false, adminTab: 'prioriti', br: { outlet: '', kat: 'iP Used' },
    ed: { kat: 'iP Used', outlet: '', model: '', list: [], notes: [], loadedKey: '' },
    source: cache ? 'cache' : 'seed', syncedAt: cache ? cache.ts : null, syncErr: ''
  };
  var adminPin = '';

  function sheetId() { return LS.get('sheetId', '') || C.SHEET_ID || ''; }
  function appsUrl() { return LS.get('appsUrl', '') || C.APPS_SCRIPT_URL || ''; }

  function persistCart() { LS.set('cart', state.cart); }
  function persistCache(src) {
    LS.set('cache', { data: data, ts: Date.now() });
    if (src) { state.source = src; state.syncedAt = Date.now(); }
  }

  /* ---------- toast ---------- */
  var toastT;
  function toast(msg) {
    var old = $('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(function () { t.remove(); }, 2600);
  }

  /* ---------- sheet ---------- */
  function fetchTab(id, tab) {
    var url = 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(id) +
      '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tab) + '&_=' + Date.now();
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(tab + ': HTTP ' + r.status);
      return r.text();
    });
  }

  function loadSheet(manual) {
    var id = sheetId();
    if (!id) { if (manual) toast('Sheet ID belum diisi (tab HQ > Sambungan)'); return Promise.resolve(false); }
    var tabs = ['Prioriti', 'Supplier', 'Jarak', 'Brand', 'Stok', 'Harga', 'Outlet'];
    return Promise.all(tabs.map(function (t) {
      return fetchTab(id, t).then(function (x) { return { t: t, csv: x }; }, function (e) { return { t: t, err: e }; });
    })).then(function (res) {
      var by = {}; res.forEach(function (r) { by[r.t] = r; });
      if (by.Prioriti.err) throw by.Prioriti.err;
      var p = L.parsePriority(by.Prioriti.csv);
      if (!p.length) throw new Error('Tab Prioriti kosong atau format salah');
      var s = by.Supplier.csv ? L.parseSuppliers(by.Supplier.csv) : [];
      var j = by.Jarak.csv ? L.parseJarak(by.Jarak.csv) : [];
      var on = by.Outlet.csv ? L.parseOutlet(by.Outlet.csv) : {};
      var ad = by.Brand.csv ? L.parseBrand(by.Brand.csv) : [];
      data = {
        categories: L.CATEGORIES,
        priority: p,
        suppliers: s.length ? s : L.clone(L.SEED.suppliers),
        jarak: j.length ? j : L.clone(L.SEED.jarak),
        ada: ad.length ? ad : L.clone(L.SEED.ada),
        outletNota: Object.keys(on).length ? on : L.clone(L.SEED.outletNota),
        stok: by.Stok.csv ? L.parseStok(by.Stok.csv) : [],
        harga: by.Harga.csv ? L.parseHarga(by.Harga.csv) : []
      };
      persistCache('sheet'); state.syncErr = '';
      if (manual) toast('Data dimuat semula dari sheet');
      return true;
    }).catch(function (e) {
      state.syncErr = String(e && e.message || e);
      if (state.source === 'sheet') state.source = 'cache';
      if (manual) toast('Gagal muat sheet: ' + state.syncErr);
      return false;
    }).then(function (ok) { paintStatus(); refreshView(); return ok; });
  }

  function paintStatus() {
    var el = $('#status'); if (!el) return;
    var m = { sheet: ['Sheet live', 'pill live'], cache: ['Simpanan peranti', 'pill'], seed: ['Data asas', 'pill'] }[state.source] || ['', 'pill'];
    el.textContent = m[0]; el.className = m[1];
    el.title = state.syncedAt ? 'Kemas kini ' + new Date(state.syncedAt).toLocaleString('ms-MY') : '';
  }

  /* ---------- backend (Apps Script) ---------- */
  function api(action, payload) {
    var url = appsUrl();
    if (!url) return Promise.resolve({ ok: false, local: true });
    return fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: action, pin: adminPin }, payload))
    }).then(function (r) { return r.json(); }).catch(function (e) { return { ok: false, error: String(e) }; });
  }
  function reportApi(r, okMsg) {
    if (r.ok) { toast(okMsg + ' (disimpan ke sheet)'); setTimeout(function () { loadSheet(false); }, 1200); }
    else if (r.local) toast(okMsg + ' (dalam peranti ini sahaja, belum sambung sheet)');
    else toast('Gagal simpan ke sheet: ' + (r.error || 'tidak diketahui'));
  }

  /* ---------- pembantu UI ---------- */
  function outletChips(act) {
    return '<div class="chips">' + L.OUTLETS.map(function (o) {
      return '<button class="chip' + (o === state.outlet ? ' on' : '') + '" data-act="' + act + '" data-v="' + h(o) + '">' + h(o) + '</button>';
    }).join('') + '</div>';
  }

  function katOptions(sel, withGroup, withAll) {
    var o = '';
    if (withAll) o += '<option value="">Semua kategori</option>';
    o += '<optgroup label="iPhone / iPad">' + L.IPHONE_IPAD.map(function (k) {
      return '<option' + (k === sel ? ' selected' : '') + '>' + h(k) + '</option>';
    }).join('') + '</optgroup>';
    o += '<optgroup label="Android (brand)">' + L.ANDROID_BRANDS.map(function (k) {
      return '<option' + (k === sel ? ' selected' : '') + '>' + h(k) + '</option>';
    }).join('') + '</optgroup>';
    if (withGroup) o += '<optgroup label="Kumpulan"><option value="' + L.GROUP_NAME + '"' + (sel === L.GROUP_NAME ? ' selected' : '') +
      '>' + L.GROUP_NAME + ' (semua brand Android)</option></optgroup>';
    return o;
  }

  function supOptions(sel, blank) {
    var names = data.suppliers.map(function (s) { return s.name; });
    return (blank ? '<option value="">' + h(blank) + '</option>' : '') + names.map(function (n) {
      return '<option' + (n === sel ? ' selected' : '') + '>' + h(n) + '</option>';
    }).join('');
  }

  function modelList() {
    var set = {};
    data.priority.forEach(function (r) { if (r.model) set[r.model] = 1; });
    data.harga.forEach(function (r) { if (r.model) set[r.model] = 1; });
    return Object.keys(set).sort();
  }

  /* Kesan kategori/brand daripada nama model yang ditaip. Pulangkan senarai kategori calon ([] = tak dikenali). */
  var IP_NEW_USED = ['iP Used', 'iP New', 'iP eSIM', 'iP CPO'];
  var BRAND_RULES = [
    ['iPad', /ipad/],
    ['iPhone', /iphone|\bip\s?\d|^(1[0-9]|x[rs]?|se)\b/],
    ['Poco', /poco/],
    ['Redmagic', /red\s?magic/],
    ['Iqoo', /iqoo/],
    ['Samsung', /samsung|galaxy|\b[asmf]\d{2}\b|\bz\s?(fold|flip)|\bfold\b|\bflip\b|\bs2\d\b/],
    ['Infinix', /infinix|\bhot\s?\d|\bzero\b|\bsmart\s?\d|\bnote\s?4\d/],
    ['Redmi/Xiaomi', /redmi|xiaomi|\bmi\s?\d|\bnote\s?\d+/],
    ['Tecno', /tecno|\bspark\b|camon|pova|phantom|pop\s?\d/],
    ['Nothing', /nothing|\bcmf\b/],
    ['Oneplus', /one\s?plus|\bnord\b/],
    ['Google Pixel', /pixel/],
    ['Realme', /realme|narzo|\bgt\s?\d|\bc\d{2}\b/],
    ['Oppo', /oppo|\breno\s?\d|find\s?x/],
    ['Vivo', /vivo|\b[yvx]\d{2}\b/],
    ['Honor', /honor|\bmagic\s?\d|\bx\d\w?\b/]
  ];
  function detectKats(text) {
    var t = String(text || '').toLowerCase().trim();
    if (!t) return [];
    for (var i = 0; i < BRAND_RULES.length; i++) {
      if (BRAND_RULES[i][1].test(t)) {
        var b = BRAND_RULES[i][0];
        if (b === 'iPhone') return IP_NEW_USED;
        if (b === 'iPad') return ['iPad New', 'iPad Used'];
        return [b];
      }
    }
    return [];
  }
  function pickKind(text, c) {
    var t = ' ' + String(text || '').toLowerCase() + ' ', want = '';
    if (/\bcpo\b/.test(t)) want = 'CPO';
    else if (/e-?sim/.test(t)) want = 'eSIM';
    else if (/\b(new|baru|sealed)\b/.test(t)) want = 'New';
    else if (/\b(used|second|terpakai|2nd|preloved)\b/.test(t)) want = 'Used';
    if (!want) return '';
    return c.filter(function (k) { return k.indexOf(want) >= 0; })[0] || '';
  }
  function kondisiHint(text) {
    if (!String(text || '').trim()) return '<div class="muted" style="margin-top:6px">Kategori semasa: <b>' + h(state.kat) + '</b>. Taip model untuk kesan automatik.</div>';
    var c = detectKats(text);
    if (!c.length) return '<div class="callout warn" style="margin-top:8px">Brand tak dikenali. Pilih kategori di bawah.</div>';
    return '<div class="muted" style="margin-top:6px">Dikesan: <b>' + h(state.kat) + '</b>' +
      (c.length > 1 ? ' · tambah "used", "new", "esim" atau "cpo" pada carian untuk tukar jenis' : '') + '</div>';
  }
  function applyDetect() {
    var c = detectKats(state.model), unknown = !!String(state.model || '').trim() && !c.length;
    if (c.length) {
      var k = pickKind(state.model, c);
      if (k) state.kat = k; else if (c.indexOf(state.kat) < 0) state.kat = c[0];
      LS.set('kat', state.kat);
    }
    var sel = $('#kat'); if (sel) sel.value = state.kat;
    var hint = $('#qhint'); if (hint) hint.innerHTML = kondisiHint(state.model);
    var box = $('#katbox'); if (box && unknown) box.open = true;
  }

  /* ---------- tab SEMAK ---------- */
  function renderSemak() {
    $('#view').innerHTML =
      '<h2>Order untuk outlet</h2>' + outletChips('outlet') +
      '<h2>Apa nak order?</h2><div class="card">' +
      '<label class="l" for="model" style="margin-top:0">Cari model (taip terus, brand dikesan automatik)</label>' +
      '<input type="text" id="model" list="mlist" placeholder="cth: iPhone 15 Pro Max, Galaxy A55, Redmi Note 13" value="' + h(state.model) + '" autocomplete="off">' +
      '<datalist id="mlist">' + modelList().map(function (m) { return '<option value="' + h(m) + '">'; }).join('') + '</datalist>' +
      '<div id="qhint"></div>' +
      '<details id="katbox" style="margin-top:10px"><summary class="muted" style="cursor:pointer">Tukar kategori manual</summary>' +
      '<select id="kat" style="margin-top:6px">' + katOptions(state.kat, false, false) + '</select></details>' +
      '</div><div id="results"></div>';
    applyDetect();
    renderResults();
  }

  function scopeLabel(R) {
    var t = { model: 'Senarai khas model ini', outlet: 'Senarai khas ' + state.outlet, umum: 'Senarai umum HQ' }[R.scope] || '';
    if (R.scope === 'umum') t += ' (' + state.outlet + ' tiada senarai sendiri)';
    if (R.viaGroup) t += ' · ikut senarai ' + L.GROUP_NAME;
    return t;
  }

  function supCard(it, R) {
    var cls = 'card sup' + (it.pick ? ' pick' : '') + ((it.habis || it.skipped) ? ' off' : '');
    var tags = '';
    if (it.pick) tags += '<span class="tag pickt">ORDER DARI SINI</span>';
    if (it.extra) tags += '<span class="tag">Luar susunan HQ</span>';
    if (it.habis) tags += '<span class="tag habis">HABIS (HQ)</span>';
    if (it.skipped) tags += '<span class="tag habis">DILANGKAU</span>';
    if (it.ada === true) tags += '<span class="tag near">✓ Ada ' + h(state.kat) + (it.adaNota ? ' · ' + h(it.adaNota) : '') + '</span>';
    if (it.cawangan) tags += '<span class="tag">' + h(it.cawangan) + '</span>';
    if (it.jauh === true) tags += '<span class="tag far">JAUH · postage / by hand</span>';
    else if (it.jauh === false) tags += '<span class="tag near">DEKAT · hari sama</span>';
    if (it.runner) tags += '<span class="tag run">* ada runner</span>';
    tags += it.hantar.map(function (x) { return '<span class="tag">' + h(x) + '</span>'; }).join('');
    var kos = it.kos != null ? '<div class="note">Kos: <span class="kos">RM ' + it.kos.toLocaleString('ms-MY') + '</span></div>' : '';
    var note = it.note ? '<div class="note">📝 ' + h(it.note) + '</div>' : '';
    var callout = '';
    if (it.pick) {
      if (it.jauh === true) callout = '<div class="callout far">' + h(L.TXT_JAUH) + '</div>';
      else if (it.jauh === false) callout = '<div class="callout">' + h(L.TXT_DEKAT) + '</div>';
    }
    var btns = '';
    if (!it.habis) {
      if (!it.skipped) btns += '<button class="btn sm ' + (it.pick ? '' : 'sec') + '" data-act="add" data-sup="' + h(it.name) + '">' +
        (it.pick ? '+ Tambah ke order' : '+ Guna supplier ini') + '</button>';
      btns += '<button class="btn sm ghost" data-act="skip" data-sup="' + h(it.name) + '">' + (it.skipped ? 'Batal langkau' : 'Habis? Langkau') + '</button>';
    }
    if (it.habis && C.PURCHASER_BOLEH_TANDA_STOK) btns += '';
    if (!it.habis && C.PURCHASER_BOLEH_TANDA_STOK) btns += '<button class="btn sm danger" data-act="markhabis" data-sup="' + h(it.name) + '">Tanda HABIS (kongsi)</button>';
    return '<div class="' + cls + '"><div class="rk">' + it.rank + '</div><div class="grow">' +
      '<div class="nm">' + h(it.name) + '</div><div>' + tags + '</div>' + note + kos + callout +
      (btns ? '<div class="row wrapr" style="margin-top:10px">' + btns + '</div>' : '') + '</div></div>';
  }

  function renderResults() {
    var el = $('#results'); if (!el) return;
    var R = L.rank(data, state.kat, state.model, state.outlet, state.skips);
    var html = '';
    var on = data.outletNota && data.outletNota[state.outlet];
    if (on) html += '<div class="callout warn" style="margin:14px 0 0">⏱ ' + h(on) + '</div>';
    if (!R.items.length && !R.extras.length) {
      html += '<div class="card" style="margin-top:14px"><div class="empty"><b>Tiada supplier untuk ' + h(state.kat) + ' di ' + h(state.outlet) + '.</b><br>' +
        (R.tiada.length ? 'Tiada supplier dalam susunan HQ yang bawa brand ini. ' : 'HQ belum tetapkan susunan dan jadual brand. ') +
        'Hubungi HQ.</div></div>';
    } else {
      if (R.items.length) {
        html += '<h2>Susunan supplier · ' + h(scopeLabel(R)) + '</h2>';
        html += '<div class="muted" style="margin:-4px 0 8px"><span class="tag near">Hijau = ada / dekat</span><span class="tag far">Merah = tiada / jauh</span></div>';
        if (!R.pick) html += '<div class="callout far" style="margin:0 0 10px">Semua supplier dalam susunan ditanda habis / dilangkau. Cuba supplier "Luar susunan HQ" di bawah atau hubungi HQ.</div>';
        html += R.items.map(function (it) { return supCard(it, R); }).join('');
      } else {
        html += '<h2>HQ belum tetapkan susunan untuk ' + h(state.kat) + '</h2>' +
          '<div class="callout warn" style="margin:0 0 10px">Supplier di bawah ada ' + h(state.kat) + ' (ikut jadual brand HQ) tapi belum ada susunan keutamaan. Tiada pilihan automatik. Pilih sendiri atau tanya HQ.</div>';
      }
      if (R.extras.length) {
        if (R.items.length) html += '<h2>Ada juga (di luar susunan HQ)</h2>';
        html += R.extras.map(function (it) { return supCard(it, R); }).join('');
      }
      if (R.tiada.length) html += '<div class="muted" style="margin:4px 2px 12px"><span class="tag far">Tiada ' + h(state.kat) + '</span> ' + h(R.tiada.join(', ')) + '</div>';
    }
    el.innerHTML = html;
  }

  /* ---------- tab ORDER ---------- */
  function cartQtyTotal() { return state.cart.reduce(function (a, i) { return a + (i.qty || 0); }, 0); }
  function paintBadge() {
    var b = $('#badge'); if (!b) return;
    var n = state.cart.length; b.textContent = n; b.hidden = !n;
  }

  function groupCart() {
    var groups = {}, order = [];
    state.cart.forEach(function (it) {
      var R = L.rank(data, it.kat, it.model, state.outlet, null);
      var sup = it.sup || (R.pick ? R.pick.name : '');
      it._rec = R.pick ? R.pick.name : '';
      it._items = R.items.concat(R.extras);
      it._eff = sup;
      if (!groups[sup]) { groups[sup] = []; order.push(sup); }
      groups[sup].push(it);
    });
    return { groups: groups, order: order };
  }

  function renderOrder() {
    var v = $('#view');
    var top = '<h2>Hantar ke outlet</h2>' + outletChips('outlet2') +
      '<div class="row" style="margin-top:10px"><label class="chip' + (state.urgent ? ' on' : '') + '" style="cursor:pointer">' +
      '<input type="checkbox" id="urgent" ' + (state.urgent ? 'checked' : '') + ' style="display:none">🔥 Urgent (perlu hari ini)</label></div>';
    if (!state.cart.length) {
      v.innerHTML = top + '<div class="card" style="margin-top:14px"><div class="empty">Belum ada item.<br>Pergi ke tab <b>Semak</b> untuk pilih supplier dan tambah item.</div></div>';
      return;
    }
    var G = groupCart();
    var items = '<h2>Item order (' + state.cart.length + ' baris, ' + cartQtyTotal() + ' unit)</h2>' + state.cart.map(function (it) {
      var opts = '<option value="">Auto: ' + h(it._rec || 'tiada supplier') + '</option>' +
        it._items.map(function (x) {
          return '<option value="' + h(x.name) + '"' + (it.sup === x.name ? ' selected' : '') + '>' + (x.rank ? x.rank + '. ' : '+ ') + h(x.name) + (x.habis ? ' (HABIS)' : '') + '</option>';
        }).join('');
      var warn = it.sup && L.stokHabis(data, it.sup, it.kat, it.model) ? '<div class="callout far">Supplier ini ditanda HABIS oleh HQ.</div>' : '';
      return '<div class="card"><div class="row"><div class="grow"><b>' + h(it.model || it.kat) + '</b>' +
        (it.model ? '<div class="muted">' + h(it.kat) + '</div>' : '') + '</div>' +
        '<div class="qty"><button data-act="qty" data-id="' + h(it.id) + '" data-d="-1">−</button><span>' + it.qty + '</span>' +
        '<button data-act="qty" data-id="' + h(it.id) + '" data-d="1">+</button></div>' +
        '<button class="btn sm danger" data-act="del" data-id="' + h(it.id) + '" aria-label="Buang">✕</button></div>' +
        '<label class="l">Supplier</label><select data-act="setsup" data-id="' + h(it.id) + '">' + opts + '</select>' + warn + '</div>';
    }).join('');

    var send = '<h2>Hantar order ikut supplier</h2>' + G.order.map(function (sup) {
      var lines = G.groups[sup];
      if (!sup) return '<div class="card"><b>Belum ada supplier</b><div class="callout far">' + lines.length +
        ' item tiada senarai prioriti. Hubungi HQ.</div></div>';
      var info = L.supplierInfo(data, sup), jr = L.jarakInfo(data, state.outlet, sup), jauh = !!(jr && jr.jauh);
      var msg = L.buildMessage(state.outlet, lines, { urgent: state.urgent, jauh: jauh });
      var wa = L.waLink(info.wa, msg);
      var warn = '';
      if (jauh && state.urgent) warn = '<div class="callout far">Urgent tetapi supplier jauh dari ' + h(state.outlet) + '. Hari sama tak mungkin kecuali by hand. Pertimbang supplier lain.</div>';
      else if (jauh) warn = '<div class="callout far">' + h(L.TXT_JAUH) + '</div>';
      else if (jr) warn = '<div class="callout">' + h(L.TXT_DEKAT) + '</div>';
      if (!info.wa) warn += '<div class="callout warn">Nombor WhatsApp ' + h(sup) + ' belum diisi (tab Supplier di sheet). WhatsApp akan buka pilihan kenalan.</div>';
      return '<div class="card"><div class="row"><div class="grow"><b style="font-size:16px">' + h(sup) + '</b>' +
        '<div class="muted">' + lines.length + ' baris · ' + lines.reduce(function (a, i) { return a + i.qty; }, 0) + ' unit' +
        (info.hantar ? ' · ' + h(info.hantar) : '') + '</div></div></div>' + warn +
        '<pre style="white-space:pre-wrap;background:#f4f8ff;border-radius:10px;padding:10px;margin:10px 0;font:13px/1.45 inherit">' + h(msg) + '</pre>' +
        '<div class="row"><a class="btn wa grow" target="_blank" rel="noopener" href="' + h(wa) + '">Hantar WhatsApp</a>' +
        '<button class="btn ghost" data-act="copy" data-sup="' + h(sup) + '">Salin</button></div></div>';
    }).join('');

    v.innerHTML = top + items + send +
      '<div style="margin:6px 0 18px"><button class="btn danger block" data-act="clear">Kosongkan order</button></div>';
  }

  /* ---------- tab HQ (admin) ---------- */
  function sha256(str) {
    if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error('Perlu HTTPS untuk semak PIN'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }

  function renderAdmin() {
    var v = $('#view');
    if (!state.admin) {
      v.innerHTML = '<h2>Akses HQ</h2><div class="card"><label class="l" style="margin-top:0">PIN admin</label>' +
        '<input type="password" id="pin" inputmode="numeric" autocomplete="off" placeholder="PIN HQ">' +
        '<div style="margin-top:10px"><button class="btn block" data-act="login">Masuk</button></div>' +
        '<div class="muted" style="margin-top:8px">Hanya HQ boleh ubah susunan prioriti dan tanda stok kongsi. Purchaser boleh semak dan order.</div></div>';
      return;
    }
    var sub = '<div class="sub">' + [['prioriti', 'Prioriti'], ['brand', 'Brand'], ['stok', 'Stok'], ['sambung', 'Sambung']].map(function (t) {
      return '<button class="' + (state.adminTab === t[0] ? 'on' : '') + '" data-act="atab" data-v="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';
    v.innerHTML = '<div class="row" style="margin-top:14px"><b class="grow">Mod HQ</b><button class="btn sm ghost" data-act="logout">Keluar</button></div>' + sub + '<div id="adm"></div>';
    if (state.adminTab === 'prioriti') adminPrioriti();
    else if (state.adminTab === 'brand') adminBrand();
    else if (state.adminTab === 'stok') adminStok();
    else adminSambung();
  }

  function edKey() { return [state.ed.kat, state.ed.outlet, state.ed.model].join('|').toLowerCase(); }
  function loadEd() {
    var e = state.ed, hit = data.priority.filter(function (r) {
      return L.key(r.kat) === L.key(e.kat) && L.key(r.model) === L.key(e.model) &&
        (L.isAll(r.outlet) ? '' : L.key(r.outlet)) === L.key(e.outlet);
    })[0];
    e.list = hit ? hit.list.slice() : []; e.notes = hit ? (hit.notes || []).slice() : [];
    while (e.notes.length < e.list.length) e.notes.push('');
    e.loadedKey = edKey(); e.exists = !!hit;
  }

  function adminPrioriti() {
    var e = state.ed; if (e.loadedKey !== edKey()) loadEd();
    var rows = e.list.map(function (n, i) {
      return '<div class="edrow"><div class="n">' + (i + 1) + '</div><div><div class="nm">' + h(n) + '</div>' +
        '<input type="text" data-act="ednote" data-i="' + i + '" placeholder="Nota (cth: Segera)" value="' + h(e.notes[i] || '') + '"></div>' +
        '<div class="ctl"><button data-act="edup" data-i="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button>' +
        '<button data-act="eddown" data-i="' + i + '" ' + (i === e.list.length - 1 ? 'disabled' : '') + '>↓</button>' +
        '<button data-act="edrm" data-i="' + i + '">✕</button></div></div>';
    }).join('') || '<div class="muted" style="margin-bottom:8px">Belum ada senarai untuk skop ini. Tambah supplier di bawah.</div>';
    var avail = data.suppliers.map(function (s) { return s.name; }).filter(function (n) { return e.list.indexOf(n) < 0; });
    $('#adm').innerHTML = '<div class="card">' +
      '<label class="l" style="margin-top:0">Kategori / brand</label><select id="edkat">' + katOptions(e.kat, true, false) + '</select>' +
      '<label class="l">Outlet</label><select id="edout"><option value="">Semua outlet (umum)</option>' +
      L.OUTLETS.map(function (o) { return '<option' + (o === e.outlet ? ' selected' : '') + '>' + h(o) + '</option>'; }).join('') + '</select>' +
      '<label class="l">Model (kosongkan untuk semua model)</label><input type="text" id="edmodel" value="' + h(e.model) + '" autocomplete="off">' +
      '</div><div class="card"><b>Susunan prioriti</b><div style="margin-top:10px">' + rows + '</div>' +
      '<div class="row"><select id="edadd" class="grow">' + (avail.length ? avail.map(function (n) { return '<option>' + h(n) + '</option>'; }).join('') : '<option value="">Semua sudah ditambah</option>') + '</select>' +
      '<button class="btn sm" data-act="edadd" ' + (avail.length ? '' : 'disabled') + '>+ Tambah</button></div></div>' +
      '<button class="btn block" data-act="edsave" ' + (e.list.length ? '' : 'disabled') + '>Simpan susunan</button>' +
      (e.exists ? '<div style="margin-top:8px"><button class="btn danger block" data-act="eddelete">Padam senarai skop ini</button></div>' : '');
  }

  /* Jadual brand: supplier mana ada / tiada kategori ini (hijau / merah dalam sheet HQ) */
  function brandRow(outlet, kat) {
    var o = outlet || 'ALL';
    return data.ada.filter(function (r) { return L.key(r.kat) === L.key(kat) && L.key(r.outlet) === L.key(o); })[0] || null;
  }
  function adminBrand() {
    var b = state.br, row = brandRow(b.outlet, b.kat), cells = row ? row.cells : {};
    var rows = data.suppliers.map(function (s, i) {
      var ks = Object.keys(cells).filter(function (k) { return L.key(k) === L.key(s.name); })[0];
      var v = ks ? cells[ks] : '', st = !v ? '' : (/^(n|x|tak|tiada|no|0|false)$/i.test(v) ? 'N' : 'Y');
      var nota = st === 'Y' && !/^(y|ya|yes|1|true|ada)$/i.test(v) ? v : '';
      return '<div class="card"><div class="row"><b class="grow">' + h(s.name) + '</b>' +
        '<select data-br="st" data-i="' + i + '" style="width:auto">' +
        '<option value=""' + (st === '' ? ' selected' : '') + '>Tak pasti</option>' +
        '<option value="Y"' + (st === 'Y' ? ' selected' : '') + '>🟢 Ada</option>' +
        '<option value="N"' + (st === 'N' ? ' selected' : '') + '>🔴 Tiada</option></select></div>' +
        '<input type="text" data-br="nota" data-i="' + i + '" placeholder="Nota jika ada syarat (cth: A-Series Only)" value="' + h(nota) + '" style="margin-top:8px"></div>';
    }).join('');
    $('#adm').innerHTML = '<div class="card"><div class="muted" style="margin-bottom:8px">Tetapkan supplier mana bawa brand/kategori ini. Hijau = ada, merah = tiada. Supplier yang tiada akan dikeluarkan dari cadangan.</div>' +
      '<label class="l" style="margin-top:0">Kategori / brand</label><select id="brkat">' + katOptions(b.kat, false, false) + '</select>' +
      '<label class="l">Outlet</label><select id="brout"><option value="">Semua outlet (umum)</option>' +
      L.OUTLETS.map(function (o) { return '<option' + (o === b.outlet ? ' selected' : '') + '>' + h(o) + '</option>'; }).join('') + '</select></div>' +
      rows + '<button class="btn block" data-act="brsave">Simpan jadual brand</button>';
  }

  function adminStok() {
    var habis = data.stok.filter(function (r) { return r.status === 'HABIS'; });
    $('#adm').innerHTML = '<div class="card"><b>Tanda supplier HABIS (kongsi untuk semua purchaser)</b>' +
      '<label class="l">Supplier</label><select id="skSup">' + supOptions('') + '</select>' +
      '<label class="l">Kategori</label><select id="skKat">' + katOptions('', false, true) + '</select>' +
      '<label class="l">Model (pilihan)</label><input type="text" id="skModel" autocomplete="off">' +
      '<div style="margin-top:10px"><button class="btn danger block" data-act="skhabis">Tanda HABIS</button></div></div>' +
      '<h2>Sedang HABIS (' + habis.length + ')</h2>' + (habis.map(function (r, i) {
        return '<div class="card row"><div class="grow"><b>' + h(r.supplier) + '</b><div class="muted">' + h(r.kat || 'Semua kategori') + (r.model ? ' · ' + h(r.model) : '') + '</div></div>' +
          '<button class="btn sm sec" data-act="skada" data-i="' + i + '">Ada semula</button></div>';
      }).join('') || '<div class="card"><div class="empty">Tiada supplier ditanda habis.</div></div>');
  }

  function adminSambung() {
    $('#adm').innerHTML = '<div class="card"><b>Sambungan Google Sheet</b>' +
      '<div class="muted" style="margin:4px 0 0">Status: ' + h({ sheet: 'Sheet live', cache: 'Simpanan peranti', seed: 'Data asas dalam app' }[state.source]) +
      (state.syncedAt ? ' · ' + new Date(state.syncedAt).toLocaleString('ms-MY') : '') + '</div>' +
      (state.syncErr ? '<div class="callout far">Ralat terakhir: ' + h(state.syncErr) + '</div>' : '') +
      '<label class="l">Sheet ID</label><input type="text" id="cfgSheet" value="' + h(sheetId()) + '" placeholder="ID dari URL sheet" autocomplete="off">' +
      '<label class="l">URL Web App Apps Script (untuk simpan perubahan)</label><input type="url" id="cfgApps" value="' + h(appsUrl()) + '" placeholder="https://script.google.com/macros/s/.../exec" autocomplete="off">' +
      '<div class="row" style="margin-top:12px"><button class="btn grow" data-act="cfgsave">Simpan & muat semula</button></div></div>' +
      '<div class="card"><b>Salin ke sheet manual</b><div class="muted" style="margin:4px 0 10px">Jika Apps Script belum disambung, salin susunan prioriti semasa (TSV) dan tampal di tab Prioriti.</div>' +
      '<button class="btn sec block" data-act="copytsv">Salin prioriti (TSV)</button></div>' +
      '<div class="card"><div class="muted">Tetapan lain (PIN, kekerapan muat semula) diubah dalam fail config.js.</div></div>';
  }

  function priorityTSV() {
    var head = ['Kategori', 'Model', 'Outlet', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6'];
    var out = [head.join('\t')];
    data.priority.forEach(function (r) {
      var row = [r.kat, r.model || '', r.outlet || 'ALL'];
      for (var i = 0; i < 6; i++) row.push(r.list[i] || '');
      for (i = 0; i < 6; i++) row.push((r.notes && r.notes[i]) || '');
      out.push(row.join('\t'));
    });
    return out.join('\n');
  }

  /* ---------- render utama ---------- */
  function render() {
    document.querySelectorAll('nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === state.tab); });
    if (state.tab === 'semak') renderSemak();
    else if (state.tab === 'order') renderOrder();
    else renderAdmin();
    paintBadge(); paintStatus();
  }
  // Muat semula senyap bila data sheet datang: jangan ganggu bila HQ sedang menyunting
  function refreshView() {
    if (state.tab === 'semak') renderResults();
    else if (state.tab === 'order') renderOrder();
    paintBadge();
  }

  /* ---------- tindakan ---------- */
  function resetSkips() { state.skips = new Set(); }

  function addToCart(sup) {
    // "Auto" di tab Order tidak kira langkauan sementara, jadi pilihan selain Auto disimpan sebagai pilihan tetap
    var R = L.rank(data, state.kat, state.model, state.outlet, null);
    var auto = R.pick ? R.pick.name : '';
    var over = sup === auto ? '' : sup;
    var m = state.cart.filter(function (i) { return i.kat === state.kat && L.key(i.model) === L.key(state.model) && (i.sup || '') === over; })[0];
    if (m) m.qty++; else state.cart.push({ id: String(Date.now()) + Math.floor(Math.random() * 1000), kat: state.kat, model: state.model.trim(), qty: 1, sup: over });
    persistCart(); paintBadge(); toast('Ditambah: ' + (state.model || state.kat) + ' → ' + sup);
  }

  function upsertStok(sup, kat, model, status) {
    data.stok = data.stok.filter(function (r) {
      return !(L.key(r.supplier) === L.key(sup) && L.key(r.kat) === L.key(kat) && L.key(r.model) === L.key(model));
    });
    if (status === 'HABIS') data.stok.push({ kat: kat, model: model, supplier: sup, status: 'HABIS', tarikh: new Date().toISOString(), oleh: state.admin ? 'HQ' : 'Purchaser' });
    persistCache();
  }

  var actions = {
    outlet: function (el) { state.outlet = el.dataset.v; LS.set('outlet', state.outlet); resetSkips(); render(); },
    outlet2: function (el) { state.outlet = el.dataset.v; LS.set('outlet', state.outlet); render(); },
    add: function (el) { addToCart(el.dataset.sup); },
    skip: function (el) {
      var n = el.dataset.sup; if (state.skips.has(n)) state.skips.delete(n); else state.skips.add(n);
      renderResults();
    },
    markhabis: function (el) {
      var sup = el.dataset.sup;
      if (!confirm('Tanda ' + sup + ' HABIS untuk ' + state.kat + (state.model ? ' / ' + state.model : '') + ' (kongsi semua purchaser)?')) return;
      upsertStok(sup, state.kat, state.model.trim(), 'HABIS'); renderResults();
      api('setStock', { kat: state.kat, model: state.model.trim(), supplier: sup, status: 'HABIS', by: 'Purchaser' }).then(function (r) { reportApi(r, 'Ditanda habis'); });
    },
    qty: function (el) {
      var it = state.cart.filter(function (i) { return i.id === el.dataset.id; })[0]; if (!it) return;
      it.qty = Math.max(1, it.qty + parseInt(el.dataset.d, 10)); persistCart(); renderOrder();
    },
    del: function (el) { state.cart = state.cart.filter(function (i) { return i.id !== el.dataset.id; }); persistCart(); renderOrder(); paintBadge(); },
    clear: function () { if (confirm('Kosongkan semua item order?')) { state.cart = []; persistCart(); renderOrder(); paintBadge(); } },
    copy: function (el) {
      var sup = el.dataset.sup, G = groupCart(), lines = G.groups[sup] || [];
      var jr = L.jarakInfo(data, state.outlet, sup);
      var msg = L.buildMessage(state.outlet, lines, { urgent: state.urgent, jauh: !!(jr && jr.jauh) });
      (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(function () { toast('Mesej disalin'); }, function () { toast('Gagal salin'); });
    },
    login: function () {
      var pin = ($('#pin') || {}).value || '';
      sha256(pin).then(function (hx) {
        if (hx === C.ADMIN_PIN_SHA256) { state.admin = true; adminPin = pin; render(); }
        else toast('PIN salah');
      }, function (e) { toast(e.message); });
    },
    logout: function () { state.admin = false; adminPin = ''; render(); },
    atab: function (el) { state.adminTab = el.dataset.v; renderAdmin(); },
    edup: function (el) { swap(+el.dataset.i, -1); },
    eddown: function (el) { swap(+el.dataset.i, 1); },
    edrm: function (el) { var i = +el.dataset.i; state.ed.list.splice(i, 1); state.ed.notes.splice(i, 1); adminPrioriti(); },
    edadd: function () {
      var v = ($('#edadd') || {}).value; if (!v) return;
      state.ed.list.push(v); state.ed.notes.push(''); adminPrioriti();
    },
    edsave: function () {
      var e = state.ed, kat = e.kat, model = e.model.trim(), outlet = e.outlet;
      var row = { kat: kat, model: model, outlet: outlet, list: e.list.slice(), notes: e.notes.slice() };
      var found = false;
      data.priority = data.priority.map(function (r) {
        if (L.key(r.kat) === L.key(kat) && L.key(r.model) === L.key(model) && (L.isAll(r.outlet) ? '' : L.key(r.outlet)) === L.key(outlet)) { found = true; return row; }
        return r;
      });
      if (!found) data.priority.push(row);
      persistCache(); e.exists = true; resetSkips();
      api('savePriority', { kat: kat, model: model, outlet: outlet || 'ALL', list: row.list, notes: row.notes }).then(function (r) { reportApi(r, 'Susunan disimpan'); });
      adminPrioriti();
    },
    eddelete: function () {
      var e = state.ed, kat = e.kat, model = e.model.trim(), outlet = e.outlet;
      if (!confirm('Padam senarai ' + kat + (outlet ? ' / ' + outlet : '') + (model ? ' / ' + model : '') + '?')) return;
      data.priority = data.priority.filter(function (r) {
        return !(L.key(r.kat) === L.key(kat) && L.key(r.model) === L.key(model) && (L.isAll(r.outlet) ? '' : L.key(r.outlet)) === L.key(outlet));
      });
      persistCache(); e.loadedKey = ''; resetSkips();
      api('deletePriority', { kat: kat, model: model, outlet: outlet || 'ALL' }).then(function (r) { reportApi(r, 'Senarai dipadam'); });
      adminPrioriti();
    },
    brsave: function () {
      var b = state.br, cells = {};
      data.suppliers.forEach(function (s, i) {
        var st = ($('[data-br=st][data-i="' + i + '"]') || {}).value || '';
        var nota = (($('[data-br=nota][data-i="' + i + '"]') || {}).value || '').trim();
        if (st === 'Y') cells[s.name] = nota || 'Y'; else if (st === 'N') cells[s.name] = 'N';
      });
      var row = brandRow(b.outlet, b.kat);
      if (row) {
        // kekalkan supplier lain dalam baris, ganti yang disunting
        Object.keys(row.cells).forEach(function (k) {
          if (!data.suppliers.some(function (s) { return L.key(s.name) === L.key(k); })) cells[k] = row.cells[k];
        });
        row.cells = cells;
      } else data.ada.push({ outlet: b.outlet || 'ALL', kat: b.kat, cells: cells });
      persistCache(); resetSkips();
      api('saveBrand', { outlet: b.outlet || 'ALL', kat: b.kat, cells: cells }).then(function (r) { reportApi(r, 'Jadual brand disimpan'); });
      adminBrand();
    },
    skhabis: function () {
      var sup = $('#skSup').value, kat = $('#skKat').value, model = $('#skModel').value.trim();
      upsertStok(sup, kat, model, 'HABIS'); adminStok();
      api('setStock', { kat: kat, model: model, supplier: sup, status: 'HABIS', by: 'HQ' }).then(function (r) { reportApi(r, sup + ' ditanda habis'); });
    },
    skada: function (el) {
      var habis = data.stok.filter(function (r) { return r.status === 'HABIS'; }), r0 = habis[+el.dataset.i]; if (!r0) return;
      upsertStok(r0.supplier, r0.kat, r0.model, 'ADA'); adminStok();
      api('setStock', { kat: r0.kat, model: r0.model, supplier: r0.supplier, status: 'ADA', by: 'HQ' }).then(function (r) { reportApi(r, r0.supplier + ' ada semula'); });
    },
    cfgsave: function () {
      LS.set('sheetId', ($('#cfgSheet').value || '').trim().replace(/^.*\/d\/([^/]+).*$/, '$1'));
      LS.set('appsUrl', ($('#cfgApps').value || '').trim());
      loadSheet(true).then(function () { renderAdmin(); });
    },
    copytsv: function () {
      (navigator.clipboard ? navigator.clipboard.writeText(priorityTSV()) : Promise.reject()).then(function () { toast('TSV disalin'); }, function () { toast('Gagal salin'); });
    }
  };

  function swap(i, d) {
    var e = state.ed, j = i + d; if (j < 0 || j >= e.list.length) return;
    [e.list[i], e.list[j]] = [e.list[j], e.list[i]]; [e.notes[i], e.notes[j]] = [e.notes[j], e.notes[i]];
    adminPrioriti();
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-tab]');
    if (t) { state.tab = t.dataset.tab; render(); window.scrollTo(0, 0); return; }
    var a = ev.target.closest('[data-act]');
    if (a && actions[a.dataset.act] && a.tagName !== 'SELECT' && a.tagName !== 'INPUT') actions[a.dataset.act](a);
  });

  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.id === 'model') { state.model = t.value; applyDetect(); resetSkips(); renderResults(); }
    else if (t.id === 'edmodel') { state.ed.model = t.value; }
    else if (t.dataset && t.dataset.act === 'ednote') { state.ed.notes[+t.dataset.i] = t.value; }
  });

  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.id === 'kat') { state.kat = t.value; LS.set('kat', state.kat); resetSkips(); renderSemak(); }
    else if (t.id === 'urgent') { state.urgent = t.checked; renderOrder(); }
    else if (t.dataset && t.dataset.act === 'setsup') {
      var it = state.cart.filter(function (i) { return i.id === t.dataset.id; })[0];
      if (it) { it.sup = t.value; persistCart(); renderOrder(); }
    }
    else if (t.id === 'brkat') { state.br.kat = t.value; adminBrand(); }
    else if (t.id === 'brout') { state.br.outlet = t.value; adminBrand(); }
    else if (t.id === 'edkat') { state.ed.kat = t.value; adminPrioriti(); }
    else if (t.id === 'edout') { state.ed.outlet = t.value; adminPrioriti(); }
    else if (t.id === 'edmodel') { state.ed.model = t.value; adminPrioriti(); }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.id === 'pin') actions.login();
  });

  /* ---------- mula ---------- */
  render();
  if (sheetId()) loadSheet(false);
  var every = Math.max(20, +C.REFRESH_SAAT || 60) * 1000;
  setInterval(function () { if (!document.hidden && sheetId() && !(state.admin && state.tab === 'admin')) loadSheet(false); }, every);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && sheetId()) loadSheet(false); });
  window.addEventListener('online', function () { if (sheetId()) loadSheet(false); });

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
