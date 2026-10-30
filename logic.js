/* KLIKI Supplier Check - logik tulen (tiada DOM) supaya boleh diuji.
   Data benih diambil dari sheet "Supplier List Brand 220826" (HQ). */
(function (root) {
  'use strict';

  var OUTLETS = ['Kulim', 'Alor Setar', 'Sg. Petani', 'Pendang'];

  var SUPPLIERS = [
    { name: 'SmartEdge',         wa: '', lokasi: 'Perai & AOR',   hantar: 'Lala & Postage',         nota: '' },
    { name: 'Satu Gadget',       wa: '', lokasi: 'Perai',         hantar: 'Lala & Postage',         nota: '' },
    { name: 'AGS/Kamazon',       wa: '', lokasi: 'Perai & AOR',   hantar: 'Runner & Lala',          nota: '' },
    { name: 'Talk Space',        wa: '', lokasi: 'Perai',         hantar: 'Lala & Postage',         nota: '' },
    { name: 'Atas Mobile (YCL)', wa: '', lokasi: 'AOR',           hantar: 'Runner & Lala',          nota: '' },
    { name: 'Three Com',         wa: '', lokasi: 'AOR',           hantar: 'Lala, Runner & Postage', nota: '' },
    { name: 'YS',                wa: '', lokasi: 'AOR',           hantar: 'Runner, Lala & Postage', nota: '' },
    { name: 'Sunjoy',            wa: '', lokasi: 'AOR',           hantar: 'Runner, Lala & Postage', nota: '' },
    { name: 'Zera',              wa: '', lokasi: 'Seberang Jaya', hantar: 'Runner, Lala & Postage', nota: '' }
  ];

  var IPHONE_IPAD = ['iP Used', 'iP eSIM', 'iP New', 'iP CPO', 'iPad New', 'iPad Used'];
  var ANDROID_BRANDS = ['Infinix', 'Tecno', 'Poco', 'Iqoo', 'Redmagic', 'Nothing', 'Oneplus',
    'Google Pixel', 'Samsung', 'Redmi/Xiaomi', 'Realme', 'Oppo', 'Vivo', 'Honor'];
  var CATEGORIES = IPHONE_IPAD.concat(ANDROID_BRANDS);

  // Brand Android ikut senarai "Android New" melainkan ada baris khas brand (cth Samsung).
  var GROUP_NAME = 'Android New';
  function groupOf(kat) {
    return ANDROID_BRANDS.indexOf(kat) >= 0 ? GROUP_NAME : '';
  }

  var N_LAMBAT = 'Ada kecenderungan order lambat siap';
  var N_SEGERA = 'Segera';
  var N_DELAY  = 'Delay order boleh berlaku, tapi supplier bagi notis awal';
  var N_YCL    = 'Delay ~30 minit untuk warranty activation, kadang-kadang boleh segera';
  var N_POST   = 'Postage 1 hari optimum';

  function P(kat, outlet, pairs) {
    return { kat: kat, model: '', outlet: outlet,
      list: pairs.map(function (p) { return p[0]; }),
      notes: pairs.map(function (p) { return p[1] || ''; }) };
  }
  var SM = 'SmartEdge', SU = 'Sunjoy', TC = 'Three Com', ZE = 'Zera', YS = 'YS',
      AG = 'AGS/Kamazon', SG = 'Satu Gadget', YC = 'Atas Mobile (YCL)', TS = 'Talk Space';

  var PRIORITY = [
    // Umum (tab General) - guna bila outlet tiada senarai sendiri
    P('iP Used', '', [[SM], [SU], [TC], [ZE]]),
    P('iPad Used', '', [[SM], [ZE]]),
    P('iP New', '', [[SM], [TC]]),
    P(GROUP_NAME, '', [[AG], [SG], [YC], [TC], [TS]]),
    // Kulim
    P('iP Used', 'Kulim', [[SM], [SU], [YS], [TC]]),
    P('iP New', 'Kulim', [[SM], [TC]]),
    P(GROUP_NAME, 'Kulim', [[AG], [SG], [YC], [TC], [TS]]),
    // Alor Setar
    P('iP Used', 'Alor Setar', [[SM, N_LAMBAT], [SU, N_SEGERA], [YS, N_SEGERA], [TC, N_DELAY]]),
    P('iP New', 'Alor Setar', [[SM, N_SEGERA], [TC, N_DELAY]]),
    P(GROUP_NAME, 'Alor Setar', [[AG, N_SEGERA], [SG, N_POST], [YC, N_YCL], [TC, N_DELAY], [TS, N_POST]]),
    // Sg. Petani
    P('iP Used', 'Sg. Petani', [[SM], [SU], [YS], [TC]]),
    P('iP New', 'Sg. Petani', [[SM], [TC]]),
    P(GROUP_NAME, 'Sg. Petani', [[AG], [TC], [YC], [TS], [SG]]),
    // Pendang
    P('iP Used', 'Pendang', [[SM, N_LAMBAT], [SU, N_SEGERA], [YS, N_SEGERA], [TC, N_SEGERA]]),
    P('iP New', 'Pendang', [[SM, N_SEGERA], [TC, N_DELAY]]),
    P(GROUP_NAME, 'Pendang', [[AG, N_SEGERA], [YC, N_YCL], [TC, N_DELAY], [SU, N_SEGERA], [TS, N_POST], [SG, N_POST]])
  ];

  // Jadual "ada brand" (warna hijau = ada, merah = tiada di sheet HQ). Setiap baris: outlet ('ALL' = tab General),
  // kategori, dan sel setiap supplier: 'Y' ada, 'N' tiada, atau teks nota (ada, dengan syarat, cth "A-Series Only").
  var ADA_SEED = /*ADA_SEED*/[{"outlet":"ALL","kat":"iP Used","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"Y","YS":"Y","Sunjoy":"Y","Zera":"Y"}},{"outlet":"ALL","kat":"iP eSIM","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"Y","YS":"Y","Sunjoy":"Y","Zera":"N"}},{"outlet":"ALL","kat":"iP New","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"Y","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"iP CPO","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"iPad New","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"Y","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"iPad Used","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"Y","Sunjoy":"N","Zera":"Y"}},{"outlet":"ALL","kat":"Infinix","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y","Zera":"N"}},{"outlet":"ALL","kat":"Tecno","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"Poco","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"Y","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"Iqoo","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"Y","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"Redmagic","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"Nothing","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"Oneplus","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"Google Pixel","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"Samsung","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"Y","Atas Mobile (YCL)":"A-Series Only","Three Com":"Y","YS":"N","Sunjoy":"N","Zera":"N"}},{"outlet":"ALL","kat":"Redmi/Xiaomi","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y","Zera":"N"}},{"outlet":"ALL","kat":"Realme","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y","Zera":"N"}},{"outlet":"ALL","kat":"Oppo","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y","Zera":"N"}},{"outlet":"ALL","kat":"Vivo","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y","Zera":"N"}},{"outlet":"ALL","kat":"Honor","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y","Zera":"N"}},{"outlet":"Kulim","kat":"iP Used","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Zera":"Y","Atas Mobile (YCL)":"N","Three Com":"Y","YS":"Y","Sunjoy":"Y"}},{"outlet":"Kulim","kat":"iP eSIM","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"Y","YS":"Y","Sunjoy":"Y"}},{"outlet":"Kulim","kat":"iP New","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"Y","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"iP CPO","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"iPad New","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"Y","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"iPad Used","cells":{"SmartEdge":"Y","Satu Gadget":"N","AGS/Kamazon":"N","Talk Space":"N","Zera":"Y","Atas Mobile (YCL)":"N","Three Com":"N","YS":"Y","Sunjoy":"N"}},{"outlet":"Kulim","kat":"Infinix","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y"}},{"outlet":"Kulim","kat":"Tecno","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"Poco","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"Y","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"Iqoo","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"Y","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"Redmagic","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"Nothing","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"Oneplus","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"Google Pixel","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"N","Three Com":"N","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"Samsung","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"N","Talk Space":"Y","Zera":"N","Atas Mobile (YCL)":"A-Series Only","Three Com":"Y","YS":"N","Sunjoy":"N"}},{"outlet":"Kulim","kat":"Redmi/Xiaomi","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y"}},{"outlet":"Kulim","kat":"Realme","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y"}},{"outlet":"Kulim","kat":"Oppo","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y"}},{"outlet":"Kulim","kat":"Vivo","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y"}},{"outlet":"Kulim","kat":"Honor","cells":{"SmartEdge":"N","Satu Gadget":"Y","AGS/Kamazon":"Y","Talk Space":"N","Zera":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","YS":"N","Sunjoy":"Y"}},{"outlet":"Alor Setar","kat":"iP Used","cells":{"SmartEdge":"Y","Sunjoy":"Y","YS":"Y","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"Y","Talk Space":"N","Satu Gadget":"N","Zera":"Y"}},{"outlet":"Alor Setar","kat":"iP eSIM","cells":{"SmartEdge":"Y","Sunjoy":"Y","YS":"Y","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"Y","Talk Space":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Alor Setar","kat":"iP New","cells":{"SmartEdge":"Y","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"Y","Talk Space":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Alor Setar","kat":"iPad New","cells":{"SmartEdge":"Y","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"Y","Talk Space":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Alor Setar","kat":"iPad Used","cells":{"SmartEdge":"Y","Sunjoy":"N","YS":"Y","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"N","Zera":"Y"}},{"outlet":"Alor Setar","kat":"Infinix","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Tecno","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Poco","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Iqoo","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Redmagic","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Nothing","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Oneplus","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Google Pixel","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Samsung","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"A-Series Only","Three Com":"Y","Talk Space":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Redmi/Xiaomi","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Realme","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Oppo","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Vivo","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Alor Setar","kat":"Honor","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"iP Used","cells":{"SmartEdge":"Y","YS":"Y","Sunjoy":"Y","Three Com":"Y","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"N","Zera":"Y"}},{"outlet":"Sg. Petani","kat":"iP eSIM","cells":{"SmartEdge":"Y","YS":"Y","Sunjoy":"Y","Three Com":"Y","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Sg. Petani","kat":"iP New","cells":{"SmartEdge":"Y","YS":"N","Sunjoy":"N","Three Com":"Y","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Sg. Petani","kat":"iPad New","cells":{"SmartEdge":"Y","YS":"N","Sunjoy":"N","Three Com":"Y","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Sg. Petani","kat":"iPad Used","cells":{"SmartEdge":"Y","YS":"Y","Sunjoy":"N","Three Com":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"N","Zera":"Y"}},{"outlet":"Sg. Petani","kat":"Infinix","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"Y","Three Com":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Tecno","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"N","Three Com":"N","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Poco","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"N","Three Com":"N","AGS/Kamazon":"N","Talk Space":"Y","Atas Mobile (YCL)":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Iqoo","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"N","Three Com":"N","AGS/Kamazon":"N","Talk Space":"Y","Atas Mobile (YCL)":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Redmagic","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"N","Three Com":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Nothing","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"N","Three Com":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Oneplus","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"N","Three Com":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Google Pixel","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"N","Three Com":"N","AGS/Kamazon":"N","Talk Space":"N","Atas Mobile (YCL)":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Samsung","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"N","Three Com":"Y","AGS/Kamazon":"N","Talk Space":"Y","Atas Mobile (YCL)":"A-Series Only","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Redmi/Xiaomi","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"Y","Three Com":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Realme","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"Y","Three Com":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Oppo","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"Y","Three Com":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Vivo","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"Y","Three Com":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Sg. Petani","kat":"Honor","cells":{"SmartEdge":"N","YS":"N","Sunjoy":"Y","Three Com":"Y","AGS/Kamazon":"Y","Talk Space":"N","Atas Mobile (YCL)":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"iP Used","cells":{"SmartEdge":"Y","Sunjoy":"Y","YS":"Y","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"Y","Talk Space":"N","Satu Gadget":"N","Zera":"Y"}},{"outlet":"Pendang","kat":"iP eSIM","cells":{"SmartEdge":"Y","Sunjoy":"Y","YS":"Y","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"Y","Talk Space":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Pendang","kat":"iP New","cells":{"SmartEdge":"Y","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"Y","Talk Space":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Pendang","kat":"iP CPO","cells":{"SmartEdge":"Y","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Pendang","kat":"iPad New","cells":{"SmartEdge":"Y","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"Y","Talk Space":"N","Satu Gadget":"N","Zera":"N"}},{"outlet":"Pendang","kat":"iPad Used","cells":{"SmartEdge":"Y","Sunjoy":"N","YS":"Y","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"N","Zera":"Y"}},{"outlet":"Pendang","kat":"Infinix","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Tecno","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Poco","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Iqoo","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Redmagic","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Nothing","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Oneplus","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Google Pixel","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"N","Three Com":"N","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Samsung","cells":{"SmartEdge":"N","Sunjoy":"N","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"A-Series Only","Three Com":"Y","Talk Space":"Y","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Redmi/Xiaomi","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Realme","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Oppo","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Vivo","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"Y","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}},{"outlet":"Pendang","kat":"Honor","cells":{"SmartEdge":"N","Sunjoy":"Y","YS":"N","AGS/Kamazon":"N","Atas Mobile (YCL)":"Y","Three Com":"Y","Talk Space":"N","Satu Gadget":"Y","Zera":"N"}}];

  // Jarak & cawangan ikut outlet. jauh = postage / by hand. runner = supplier ada runner sendiri (tanda * di sheet).
  function J(outlet, supplier, cawangan, jauh, runner) {
    return { outlet: outlet, supplier: supplier, cawangan: cawangan, jauh: !!jauh, runner: !!runner, nota: '' };
  }
  var JARAK = [
    J('Kulim', SM, 'Perai'), J('Kulim', SG, 'Perai'), J('Kulim', AG, 'Perai', 0, 1),
    J('Kulim', TS, 'Perai'), J('Kulim', ZE, 'Seberang Jaya'),
    J('Kulim', YC, 'AOR', 1), J('Kulim', TC, 'AOR', 1), J('Kulim', YS, 'AOR', 1), J('Kulim', SU, 'AOR', 1),

    J('Alor Setar', SM, 'AOR'), J('Alor Setar', SU, 'AOR', 0, 1), J('Alor Setar', YS, 'AOR', 0, 1),
    J('Alor Setar', AG, 'AOR', 0, 1), J('Alor Setar', YC, 'AOR', 0, 1), J('Alor Setar', TC, 'AOR'),
    J('Alor Setar', TS, 'Perai', 1), J('Alor Setar', SG, 'Perai', 1), J('Alor Setar', ZE, 'Seberang Jaya', 1),

    J('Sg. Petani', SM, 'Perai'), J('Sg. Petani', YS, 'AOR', 0, 1), J('Sg. Petani', SU, 'AOR', 0, 1),
    J('Sg. Petani', TC, 'AOR', 0, 1), J('Sg. Petani', AG, 'Perai & AOR', 0, 1), J('Sg. Petani', TS, 'Perai'),
    J('Sg. Petani', YC, 'AOR', 0, 1), J('Sg. Petani', SG, 'Perai'), J('Sg. Petani', ZE, 'Seberang Jaya'),

    J('Pendang', SM, 'AOR'), J('Pendang', SU, 'AOR', 0, 1), J('Pendang', YS, 'AOR', 0, 1),
    J('Pendang', AG, 'AOR', 0, 1), J('Pendang', YC, 'AOR', 0, 1), J('Pendang', TC, 'AOR'),
    J('Pendang', TS, 'Perai', 1), J('Pendang', SG, 'Perai', 1), J('Pendang', ZE, 'Seberang Jaya', 1)
  ];

  var OUTLET_NOTA = {
    'Pendang': 'Tempoh optimum Lala sampai ke Pendang anggaran 1 jam dari waktu order.'
  };

  var TXT_DEKAT = 'Boleh dapat hari yang sama melalui Lala/Runner kerana dekat. Kalau tak urgent boleh guna runner supplier (cakna trip mereka).';
  var TXT_JAUH  = 'Jauh luar kawasan. Disyorkan postage atau by hand sahaja.';

  var SEED = {
    suppliers: SUPPLIERS, categories: CATEGORIES, priority: PRIORITY, jarak: JARAK, ada: ADA_SEED,
    outletNota: OUTLET_NOTA, stok: [], harga: []
  };

  function norm(s) { return (s == null ? '' : String(s)).trim(); }
  function key(s) { return norm(s).toLowerCase(); }
  function isAll(o) { var k = key(o); return !k || k === 'all' || k === 'semua'; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function truthy(v) { return /^(y|ya|yes|1|true|jauh|\*)$/i.test(norm(v)); }

  /* ---------- CSV ---------- */
  function parseCSV(text) {
    var rows = [], row = [], f = '', q = false, i = 0, c;
    text = String(text || '').replace(/^\uFEFF/, '');
    for (; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(f); f = ''; rows.push(row); row = [];
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return norm(x) !== ''; }); });
  }

  function toObjects(rows) {
    if (!rows.length) return [];
    var head = rows[0].map(key);
    return rows.slice(1).map(function (r) {
      var o = {};
      head.forEach(function (h, i) { o[h] = norm(r[i]); });
      return o;
    });
  }

  function pick(o, names) {
    for (var i = 0; i < names.length; i++) if (o[names[i]] != null && o[names[i]] !== '') return o[names[i]];
    return '';
  }

  function parsePriority(csv) {
    return toObjects(parseCSV(csv)).map(function (o) {
      var list = [], notes = [];
      for (var i = 1; i <= 8; i++) {
        var v = norm(o['p' + i]);
        if (v) { list.push(v); notes.push(norm(o['n' + i])); }
      }
      return { kat: pick(o, ['kategori', 'kat']), model: pick(o, ['model']),
        outlet: isAll(o.outlet) ? '' : o.outlet, list: list, notes: notes };
    }).filter(function (r) { return r.kat && r.list.length; });
  }
  function parseSuppliers(csv) {
    return toObjects(parseCSV(csv)).map(function (o) {
      return { name: pick(o, ['supplier', 'nama']), wa: pick(o, ['whatsapp', 'wa', 'telefon']),
        lokasi: pick(o, ['lokasi']), hantar: pick(o, ['penghantaran', 'hantar']), nota: pick(o, ['nota']) };
    }).filter(function (s) { return s.name; });
  }
  function parseJarak(csv) {
    return toObjects(parseCSV(csv)).map(function (o) {
      return { outlet: pick(o, ['outlet']), supplier: pick(o, ['supplier']), cawangan: pick(o, ['cawangan']),
        jauh: truthy(pick(o, ['jauh'])) || /^jauh$/i.test(pick(o, ['jarak'])),
        runner: truthy(pick(o, ['runner'])), nota: pick(o, ['nota']) };
    }).filter(function (j) { return j.outlet && j.supplier; });
  }
  function parseOutlet(csv) {
    var m = {};
    toObjects(parseCSV(csv)).forEach(function (o) { if (o.outlet && o.nota) m[o.outlet] = o.nota; });
    return m;
  }
  function parseStok(csv) {
    return toObjects(parseCSV(csv)).map(function (o) {
      return { kat: pick(o, ['kategori', 'kat']), model: pick(o, ['model']), supplier: pick(o, ['supplier']),
        status: (pick(o, ['status']) || '').toUpperCase(), tarikh: pick(o, ['dikemas kini', 'tarikh']), oleh: pick(o, ['oleh']) };
    }).filter(function (s) { return s.supplier; });
  }
  function parseHarga(csv) {
    return toObjects(parseCSV(csv)).map(function (o) {
      var kos = parseFloat(String(pick(o, ['kos', 'harga'])).replace(/[^0-9.\-]/g, ''));
      return { kat: pick(o, ['kategori', 'kat']), model: pick(o, ['model']), supplier: pick(o, ['supplier']),
        kos: isNaN(kos) ? null : kos, tarikh: pick(o, ['dikemas kini', 'tarikh']) };
    }).filter(function (h) { return h.model && h.supplier && h.kos != null; });
  }

  /* ---------- prioriti ---------- */
  function bestRow(data, kat, model, outlet) {
    var best = null, bestScore = -1;
    (data.priority || []).forEach(function (r) {
      if (key(r.kat) !== key(kat)) return;
      var hasModel = !!key(r.model), hasOutlet = !isAll(r.outlet);
      if (hasModel && key(r.model) !== key(model)) return;
      if (hasOutlet && key(r.outlet) !== key(outlet)) return;
      var score = (hasModel ? 2 : 0) + (hasOutlet ? 1 : 0);
      if (score > bestScore) { best = r; bestScore = score; }
    });
    return best;
  }

  // Susunan padanan: khas model > khas outlet > umum. Brand Android jatuh ke senarai "Android New"
  // bila tiada baris khas brand.
  function resolvePriority(data, kat, model, outlet) {
    var row = bestRow(data, kat, model, outlet), viaGroup = false;
    if (!row && groupOf(kat)) { row = bestRow(data, groupOf(kat), model, outlet); viaGroup = !!row; }
    if (!row) return { list: [], notes: [], scope: 'none', row: null, viaGroup: false };
    var scope = key(row.model) ? 'model' : (!isAll(row.outlet) ? 'outlet' : 'umum');
    return { list: row.list.slice(), notes: (row.notes || []).slice(), scope: scope, row: row, viaGroup: viaGroup };
  }

  function stokHabis(data, sup, kat, model) {
    return (data.stok || []).some(function (r) {
      if (r.status !== 'HABIS' || key(r.supplier) !== key(sup)) return false;
      if (key(r.kat) && key(r.kat) !== key(kat)) return false;
      if (key(r.model) && key(r.model) !== key(model)) return false;
      return true;
    });
  }

  function supplierInfo(data, name) {
    var s = (data.suppliers || []).filter(function (x) { return key(x.name) === key(name); })[0];
    return s || { name: name, wa: '', lokasi: '', hantar: '', nota: '' };
  }

  function jarakInfo(data, outlet, sup) {
    return (data.jarak || []).filter(function (j) {
      return key(j.outlet) === key(outlet) && key(j.supplier) === key(sup);
    })[0] || null;
  }

  function findKos(data, sup, kat, model) {
    if (!key(model)) return null;
    var hits = (data.harga || []).filter(function (h) {
      return key(h.supplier) === key(sup) && key(h.model) === key(model) && (!key(h.kat) || key(h.kat) === key(kat));
    });
    return hits.length ? hits[hits.length - 1].kos : null;
  }

  /* ---------- ada brand (hijau = ada, merah = tiada) ---------- */
  function parseBrand(csv) {
    var rows = parseCSV(csv);
    if (!rows.length) return [];
    var head = rows[0].map(norm);
    return rows.slice(1).map(function (r) {
      var cells = {};
      for (var i = 2; i < head.length; i++) if (head[i] && norm(r[i]) !== '') cells[head[i]] = norm(r[i]);
      return { outlet: isAll(r[0]) ? 'ALL' : norm(r[0]), kat: norm(r[1]), cells: cells };
    }).filter(function (r) { return r.kat && Object.keys(r.cells).length; });
  }

  function cellValue(row, sup) {
    if (!row) return undefined;
    var ks = Object.keys(row.cells);
    for (var i = 0; i < ks.length; i++) if (key(ks[i]) === key(sup)) return row.cells[ks[i]];
    return undefined;
  }
  function adaRows(data, outlet, kat) {
    var own = null, gen = null;
    (data.ada || []).forEach(function (r) {
      if (key(r.kat) !== key(kat)) return;
      if (key(r.outlet) === key(outlet)) own = r;
      else if (isAll(r.outlet)) gen = r;
    });
    return { own: own, gen: gen };
  }
  // -> { ada: true | false | null (tiada data), nota }
  function adaInfo(data, outlet, kat, sup) {
    var rs = adaRows(data, outlet, kat);
    var v = cellValue(rs.own, sup);
    if (v === undefined) v = cellValue(rs.gen, sup);
    if (v === undefined || norm(v) === '') return { ada: null, nota: '' };
    if (/^(n|x|tak|tiada|no|0|false|merah)$/i.test(norm(v))) return { ada: false, nota: '' };
    if (/^(y|ya|yes|1|true|ada|hijau|✓)$/i.test(norm(v))) return { ada: true, nota: '' };
    return { ada: true, nota: norm(v) };
  }
  function adaSuppliers(data, outlet, kat) {
    var rs = adaRows(data, outlet, kat), row = rs.own || rs.gen, out = [];
    if (!row) return out;
    Object.keys(row.cells).forEach(function (s) { if (adaInfo(data, outlet, kat, s).ada) out.push(s); });
    return out;
  }

  // skips: Set nama supplier yang purchaser langkau sementara (tidak ubah data kongsi)
  // Susunan HQ ditapis ikut jadual "ada brand": supplier yang tiada brand itu dikeluarkan (senarai "tiada").
  // Supplier yang ada brand tapi tiada dalam susunan HQ masuk "extras" (bukan pilihan automatik).
  function rank(data, kat, model, outlet, skips) {
    var res = resolvePriority(data, kat, model, outlet);
    var chosen = null, seq = 0, tiada = [];
    function mk(name, rk, note) {
      var ad = adaInfo(data, outlet, kat, name);
      var jr = jarakInfo(data, outlet, name), info = supplierInfo(data, name);
      return {
        name: name, rank: rk, habis: stokHabis(data, name, kat, model), skipped: !!(skips && skips.has(name)), info: info,
        note: note || '', adaNota: ad.nota, ada: ad.ada, kos: findKos(data, name, kat, model),
        jauh: jr ? jr.jauh : null, runner: jr ? jr.runner : false,
        cawangan: jr && jr.cawangan ? jr.cawangan : info.lokasi,
        hantar: info.hantar ? info.hantar.split(/\s*(?:,|&|dan)\s*/i).filter(Boolean) : [],
        pick: false, extra: false
      };
    }
    var inList = {}, items = [];
    res.list.forEach(function (name, i) {
      inList[key(name)] = 1;
      var ad = adaInfo(data, outlet, kat, name);
      if (ad.ada === false) { tiada.push(name); return; }
      var it = mk(name, ++seq, res.notes[i]);
      if (!chosen && !it.habis && !it.skipped) { it.pick = true; chosen = it; }
      items.push(it);
    });
    var extras = adaSuppliers(data, outlet, kat).filter(function (s) { return !inList[key(s)]; }).map(function (s) {
      var it = mk(s, 0, ''); it.extra = true; return it;
    });
    return { items: items, extras: extras, tiada: tiada, pick: chosen, scope: res.scope, viaGroup: res.viaGroup };
  }

  /* ---------- mesej order ---------- */
  function buildMessage(outlet, lines, opts) {
    opts = opts || {};
    var out = ['Salam, order dari KLIKI ' + outlet + (opts.urgent ? ' (URGENT, perlu hari ini)' : '') + '.', ''];
    lines.forEach(function (l, i) {
      out.push((i + 1) + '. ' + (l.model || l.kat) + (l.model ? ' (' + l.kat + ')' : '') + ' x' + l.qty);
    });
    out.push('');
    if (opts.jauh) out.push('Hantar melalui postage / by hand ke KLIKI ' + outlet + '.');
    out.push('Boleh sahkan stok & harga? Terima kasih.');
    return out.join('\n');
  }

  function waLink(number, text) {
    var d = String(number || '').replace(/\D/g, '');
    if (d && d[0] === '0') d = '6' + d;
    return 'https://wa.me/' + d + '?text=' + encodeURIComponent(text);
  }

  var api = {
    SEED: SEED, OUTLETS: OUTLETS, CATEGORIES: CATEGORIES, IPHONE_IPAD: IPHONE_IPAD,
    ANDROID_BRANDS: ANDROID_BRANDS, GROUP_NAME: GROUP_NAME, TXT_DEKAT: TXT_DEKAT, TXT_JAUH: TXT_JAUH,
    norm: norm, key: key, clone: clone, isAll: isAll, groupOf: groupOf,
    parseCSV: parseCSV, parsePriority: parsePriority, parseSuppliers: parseSuppliers,
    parseJarak: parseJarak, parseOutlet: parseOutlet, parseStok: parseStok, parseHarga: parseHarga,
    parseBrand: parseBrand, adaInfo: adaInfo, adaSuppliers: adaSuppliers,
    resolvePriority: resolvePriority, stokHabis: stokHabis, supplierInfo: supplierInfo,
    jarakInfo: jarakInfo, findKos: findKos, rank: rank, buildMessage: buildMessage, waLink: waLink
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KlikiLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
