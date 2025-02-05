# bedrock-vue-barcode-scanner

> [!NOTE]
> Consider using the [barcode-detector][] polyfill.

This project presently uses [html5-qrcode][] which, in turn, uses the
[BarcodeDetector][] API. This API is not yet
[supported](https://caniuse.com/?search=barcodedetector) on all
platforms, and [html5-qrcode][] relies on [zxing][] / [zxing-js][] in
those cases. On some platforms, such as iOS/Safari, this code
can result in a serious performance regression especially when trying
to scan large QR Codes, highlighting the importance of loading a
newer and more performant [BarcodeDetector][] API polyfill to support
these platforms.

One such polyfill is [barcode-detector][], which is based on the very
performant [zxing-wasm][] / [zxing-cpp][]. Loading the
[barcode-detector][] polyfill before [html5-qrcode][] is loaded can offer
considerable performance improvements and is therefore presently
recommended whenever using this project where platforms may not have
[BarcodeDetector][] API support.

It is also important to note that, as of early 2025, [html5-qrcode][] is not
maintained and neither is the older [zxing][] / [zxing-js][] code. Once this
project replaces its use of [html5-qrcode][], this message will be updated
with new recommendations for enabling scanning on platforms that
do not provide Web-native barcode scanning.

[BarcodeDetector]: https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
[barcode-detector]: https://github.com/Sec-ant/barcode-detector
[html5-qrcode]: https://github.com/mebjas/html5-qrcode
[zxing-cpp]: https://github.com/zxing-cpp/zxing-cpp
[zxing]: https://github.com/zxing/zxing
[zxing-js]: https://github.com/zxing-js
[zxing-wasm]: https://github.com/Sec-ant/zxing-wasm
