# Barcode regression check

From the repository root, with Node.js installed:

```sh
npm install --no-save --package-lock=false jsdom@26.1.0
node tests/barcode-generator.cjs
```

This exercises the actual bundled JsBarcode and page script, including the two reported CODE128 inputs, all nine format samples, invalid input recovery, missing dependencies, render failures, SVG visibility, and export button states. jsdom does not rasterize canvas; text measurement is stubbed. PNG downloads, clipboard access, and visual layout still require a browser check.
