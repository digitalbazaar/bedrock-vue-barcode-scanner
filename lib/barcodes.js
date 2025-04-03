/*!
 * Copyright (c) 2025 Digital Bazaar, Inc. All rights reserved.
 */
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
    // try both default barcode detection and detection w/an HSP color model
    const [result1, result2] = await Promise.all([
      barcodeDetector.detect(video),
      _detectWithHspLuminance({barcodeDetector, video})
    ]);
    const barcodes = result1.concat(result2);
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

async function _detectWithHspLuminance({barcodeDetector, video}) {
  // grab image from video and update it using HSP luminance values
  const canvas = document.createElement('canvas');
  const width = video.videoWidth
  const height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = visibleCanvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const {data} = imageData;
  for(let i = 0; i < data.length; i += 4) {
    const luminance = _hspLuminance(
      data[i], data[i + 1], data[i + 2]);
    data[i] = data[i + 1] = data[i + 2] = luminance;
  }
  ctx.putImageData(imageData, 0, 0);

  // try to detect barcode in updated image
  return barcodeDetector.detect(canvas);
}

// HSP = hue, saturation, and "perceived brightness" -- a potential improvement
// over HSL (L = "lightness") and HSV (V = "value")
// see: https://alienryderflex.com/hsp.html
function _hspLuminance(r, g, b) {
  return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
}
