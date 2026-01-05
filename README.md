# bedrock-vue-barcode-scanner

> [!NOTE]
> About the [barcode-detector][] ponyfill.

The [barcode-detector][] library is based on the very performant
[zxing-wasm][] / [zxing-cpp][].

This project uses the [barcode-detector][] ponyfill to ensure a
consistent experience across all devices. The ponyfill (and not the
polyfill) is used because some native implementations are less
performant and this creates an inconsistent user experience.

[BarcodeDetector]: https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
[barcode-detector]: https://github.com/Sec-ant/barcode-detector
[zxing-cpp]: https://github.com/zxing-cpp/zxing-cpp
[zxing-wasm]: https://github.com/Sec-ant/zxing-wasm
