import {Html5QrcodeSupportedFormats} from 'html5-qrcode';

// see: `BarcodeFormat`
// https://wicg.github.io/shape-detection-api/#enumdef-barcodeformat
const FORMAT_MAP = new Map([
  ['aztec', Html5QrcodeSupportedFormats.AZTEC],
  ['code_128', Html5QrcodeSupportedFormats.CODE_128],
  ['code_39', Html5QrcodeSupportedFormats.CODE_39],
  ['code_93', Html5QrcodeSupportedFormats.CODE_93],
  ['codabar', Html5QrcodeSupportedFormats.CODABAR],
  ['data_matrix', Html5QrcodeSupportedFormats.DATA_MATRIX],
  ['ean_13', Html5QrcodeSupportedFormats.EAN_13],
  ['ean_8', Html5QrcodeSupportedFormats.EAN_8],
  ['itf', Html5QrcodeSupportedFormats.ITF],
  ['pdf417', Html5QrcodeSupportedFormats.PDF_417],
  ['qr_code', Html5QrcodeSupportedFormats.QR_CODE],
  ['upc_a', Html5QrcodeSupportedFormats.UPC_A],
  ['upc_e', Html5QrcodeSupportedFormats.UPC_E],
]);

// map from Web-native format to `Html5QrcodeSupportedFormats`
export function _mapFormats(formats) {
  return formats.map(format => {
    const result = FORMAT_MAP.get(format);
    if(result === undefined) {
      if(typeof result !== 'string' || !isNaN(Number.parseInt(result, 10))) {
        throw new TypeError(
          `Unsupported format "${format}"; ` +
            'a string supported by the "BarcodeFormat" enumeration ' +
            'must be given, e.g., "qr_code", not a number.'
        );
      }
      throw new TypeError(`Unsupported format "${format}".`);
    }
    return result;
  });
}

export async function _detectBarcode({barcodeDetector, video}) {
  try {
    // Detect barcodes in the current video frame
    const barcodes = await barcodeDetector.detect(video);
    if(barcodes.length > 0) {
      for(const barcode of barcodes) {
        if(barcode.format && barcode.rawValue) {
          console.log('Barcode Detection API:', barcode);
          return barcode;
        }
      }
    }
  } catch(error) {
    console.error('Barcode detection failed:', error);
  }
}
