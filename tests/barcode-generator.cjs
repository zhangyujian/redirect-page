const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const root = __dirname + '/../';
const html = fs.readFileSync(root + 'barcode-generator.html', 'utf8');
const app = fs.readFileSync(root + 'barcode-generator.js', 'utf8');
const lib = fs.readFileSync(root + 'assets/vendor/JsBarcode.all-3.11.6.min.js', 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only' });
const { window: w } = dom;
// jsdom has no canvas rasterizer; SVG text measurement is the only stub.
w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: text => ({ width: text.length * 9 }) });
const q = selector => w.document.querySelector(selector);
const input = value => { q('#barcode-value').value = value; q('#barcode-value').dispatchEvent(new w.Event('input', { bubbles: true })); };
const valid = () => {
  assert.equal(q('#value-error').textContent, '');
  assert.equal(q('#barcode-output').hasAttribute('hidden'), false);
  assert.ok(q('#barcode-output rect'));
  assert.equal(q('#error-state').hidden, true);
  for (const id of ['download-png', 'download-svg', 'copy-image']) assert.equal(q('#' + id).disabled, false);
};
w.eval(lib); w.eval(app);
valid();
for (const value of ['690123456789', '10103790', 'ABC-123', '12345']) { input(value); valid(); }
input('中文');
assert.equal(q('#barcode-value').getAttribute('aria-invalid'), 'true');
assert.equal(q('#barcode-output').hasAttribute('hidden'), true);
assert.equal(w.getComputedStyle(q('#barcode-output')).display, 'none');
assert.equal(q('#download-png').disabled, true);
input('10103790'); valid();
q('#clear-value').click();
assert.equal(q('#error-state strong').textContent, '等待输入');
for (const option of q('#barcode-format').options) {
  q('#barcode-format').value = option.value;
  q('#barcode-format').dispatchEvent(new w.Event('change'));
  valid();
}
q('#barcode-format').value = 'EAN13'; input('123');
assert.match(q('#value-error').textContent, /12 位数字/);
assert.equal(q('#download-svg').disabled, true);
input('690123456789'); valid();
const generator = w.JsBarcode;
w.JsBarcode = undefined; input('690123456789');
assert.equal(q('#error-state strong').textContent, '生成组件未加载');
assert.equal(q('#barcode-value').getAttribute('aria-invalid'), 'false');
assert.equal(q('#copy-image').disabled, true);
w.JsBarcode = generator; input('690123456789'); valid();
w.JsBarcode = () => { throw new Error('simulated rendering failure'); };
w.console.error = () => {};
input('690123456789');
assert.equal(q('#error-state strong').textContent, '暂时无法生成');
assert.equal(q('#barcode-value').getAttribute('aria-invalid'), 'false');
console.log('PASS: screenshot values, nine formats, invalid/recovery, empty, missing library, rendering errors, SVG visibility and export action states');
dom.window.close();
