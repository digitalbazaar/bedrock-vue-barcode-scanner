export function detectBarcodes({barcodeDetector, video, signal} = {}) {
  return new Promise((resolve, reject) => {
    // schedule barcode detection
    video.requestVideoFrameCallback(() => _detect({
      barcodeDetector, video, signal, resolve, reject
    }));
  });
}

async function _detect({barcodeDetector, video, signal, resolve, reject}) {
  try {
    // detect barcodes in the current video frame
    const barcodes = await barcodeDetector.detect(video);
    if(barcodes.length > 0) {
      return resolve(barcodes);
    }
    // abort as needed
    signal?.throwIfAborted();
    // no barcodes found, schedule to try again
    video.requestVideoFrameCallback(() => _detect({
      barcodeDetector, video, signal, resolve, reject
    }));
  } catch(error) {
    reject(error);
  }
}
