/*!
 * Copyright (c) 2022-2025 Digital Bazaar, Inc. All rights reserved.
 */
import * as helpers from '../helpers.js';
import {BarcodeDetector} from 'barcode-detector/ponyfill';
import mockData from '../mockData.js';
import '@bedrock/vue-barcode-scanner';

describe('QR Codes', function() {
  const barcodeType = 'qr_code';
  const formats = [barcodeType];
  const barcodeDetector = new BarcodeDetector({formats});

  // list all images to test from images directory
  const pathToBarcodes = '/base/images/qr_code/';
  const imageNames = ['001.gif', '002.png'];

  // test each image in imageNames
  for(const imageName of imageNames) {
    it(`should detect QR code text from ${imageName}`, async function() {
      // load image
      const imageUrl = pathToBarcodes + imageName;
      const img = await helpers.loadImage(imageUrl);
      // detect barcode
      const barcodes = await barcodeDetector.detect(img);
      if(barcodes.length === 0) {
        throw new Error('No QR code detected');
      }
      // assert barcode's specific text
      const barcodeText = barcodes[0].rawValue;
      if(!mockData[barcodeType][imageName]) {
        throw new Error(`Missing mockData text value for: ${imageName}`);
      }
      if(barcodeText !== mockData[barcodeType][imageName]) {
        throw new Error(`Unexpected QR code content: ${barcodeText}`);
      }
    });
  }
});

describe('PDF417 with zxing', function() {
  const barcodeType = 'pdf417';
  const formats = [barcodeType];
  const barcodeDetector = new BarcodeDetector({formats});

  // list all images to test from images directory
  const pathToBarcodes = '/base/images/pdf417/';
  const imageNames = ['001.png', '002.png'];

  // test each image in imageNames
  for(const imageName of imageNames) {
    it(`should detect PDF417 text from ${imageName}`, async function() {
      // load image
      const imageUrl = pathToBarcodes + imageName;
      const img = await helpers.loadImage(imageUrl);

      // detect barcode
      const barcodes = await barcodeDetector.detect(img);
      if(barcodes.length === 0) {
        throw new Error('No PDF417 detected');
      }
      // assert barcode's specific text
      const barcodeText = barcodes[0].rawValue;
      if(!mockData[barcodeType][imageName]) {
        throw new Error(`Missing mockData text value for: ${imageName}`);
      }
      if(barcodeText !== mockData[barcodeType][imageName]) {
        throw new Error(`Unexpected PDF417 content: ${barcodeText}`);
      }
    });
  }
});
