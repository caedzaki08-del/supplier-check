/* Tetapan KLIKI Supplier Check. Ubah di sini sahaja, tak perlu sentuh app.js. */
window.KLIKI_CONFIG = {
  // ID Google Sheet data supplier (bahagian antara /d/ dan /edit dalam URL sheet).
  // Sheet mesti dikongsi "Anyone with the link: Viewer". Kosongkan = guna data asas dalam app.
  SHEET_ID: '',

  // URL Web App Apps Script (dari apps-script/Code.gs) untuk simpan perubahan HQ ke sheet.
  // Kosongkan = perubahan HQ hanya tersimpan dalam peranti itu.
  APPS_SCRIPT_URL: '',

  // PIN admin HQ (SHA-256). Lalai: 1234. Tukar: jalankan  printf 'PINBARU' | sha256sum
  ADMIN_PIN_SHA256: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',

  // false = hanya HQ (PIN) boleh tanda supplier HABIS secara kongsi.
  // true  = purchaser pun boleh tanda HABIS (tanpa PIN).
  PURCHASER_BOLEH_TANDA_STOK: false,

  // Kekerapan muat semula data sheet (saat)
  REFRESH_SAAT: 60
};
