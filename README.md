# bedrock-vue-barcode-scanner

> [!NOTE]
> Consider using the [barcode-detector][] polyfill.

This project uses [html5-qrcode][] which, as of early 2025, is not maintained.
It uses an embedded old version of [zxing][] / [zxing-js][] which are also not
maintained. On some platforms, such as iOS/Safari, this older code can result
in a serious performance regression especially when trying to scan large QR
Codes.

[html5-qrcode][] does have support for the [BarcodeDetector][] API, which has
[limited support](https://caniuse.com/?search=barcodedetector), but does have
polyfills. One such polyfill is [barcode-detector][] which is based on the more
performant [zxing-wasm][] / [zxing-cpp][]. Loading the [barcode-detector][]
polyfill before [html5-qrcode][] is loaded can offer considerable performance
improvements.

[BarcodeDetector]: https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
[barcode-detector]: https://github.com/Sec-ant/barcode-detector
[html5-qrcode]: https://github.com/mebjas/html5-qrcode
[zxing-cpp]: https://github.com/zxing-cpp/zxing-cpp
[zxing]: https://github.com/zxing/zxing
[zxing-js]: https://github.com/zxing-js
[zxing-wasm]: https://github.com/Sec-ant/zxing-wasm
