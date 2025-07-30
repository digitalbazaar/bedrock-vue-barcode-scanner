<template>
  <div ref="videoContainer">
    <ScannerUI
      :tip-text="tipText"
      :camera-list="cameraList"
      :camera-error="cameraError"
      :loading-camera="loadingCamera"
      :camera-constraints="cameraConstraints"
      @zoom-update="onZoomChange"
      @close="handleClose"
      @toggle-torch="toggleTorch"
      @update-camera="updateCamera" />
  </div>
</template>

<script>
/*!
 * Copyright (c) 2024-2025 Digital Bazaar, Inc. All rights reserved.
 */
import {Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats}
  from 'html5-qrcode';
import {inject, onMounted, onUnmounted, reactive, ref} from 'vue';
import {detectBarcodes} from '../lib/barcodes.js';
import ScannerUI from './ScannerUI.vue';
import {useQuasar} from 'quasar';

export default {
  name: 'BarcodeScanner',
  components: {ScannerUI},
  props: {
    formatsToSupport: {
      type: Array,
      default: () => ['qr_code']
    },
    tipText: {
      type: String,
      default: ''
    },
    showQrBox: {
      type: Boolean,
      default: false
    },
    torchOn: {
      type: Boolean,
      default: false
    }
  },
  emits: ['result', 'close'],
  setup(props, {emit}) {
    // Props
    const {formatsToSupport} = props;

    // Constants
    let scanner = null;
    const abortController = new AbortController();

    // Refs
    const cameraList = ref([]);
    const cameraError = ref(null);
    const cameraLight = ref(false);
    const loadingCamera = ref(true);
    const videoContainer = ref(null);
    const cameraConstraints = reactive({
      zoom: {
        min: 1,
        max: 8,
        step: 1
      }
    });

    // use functions
    const $q = useQuasar();

    // Inject
    const {selectedCameraId, updateSelectedCamera} = inject('selectedCameraId');

    // Lifecycle hooks
    onMounted(async () => {
      // map formats from Web standard to `Html5QrcodeSupportedFormats`
      scanner = new Html5Qrcode(
        'dce-video-container', {
          fps: 30,
          formatsToSupport: _mapFormats(formatsToSupport),
          useBarCodeDetectorIfSupported: true,
        }
      );
      const availableCameras = await Html5Qrcode.getCameras();
      cameraList.value = availableCameras.map(c => {
        return {deviceId: c.id, label: c.label};
      });
      // Attempt to default to a back-facing, non-fish-eye camera
      // Most often this is the last one in the list of back cameras
      const backCameras = cameraList.value
        .filter(camera => camera.label?.toLowerCase().includes('back'));
      const defaultCameraId =
        backCameras.at(-1)?.deviceId ?? cameraList.value.at(-1)?.deviceId;
      await scanner.start(
        {deviceId: {exact: selectedCameraId.value ?? defaultCameraId}},
        getCameraScanConfig(),
        onScanSuccess,
        onError);
      if(!selectedCameraId.value && cameraList.value.length) {
        const selectedCamera = scanner.getRunningTrackSettings()?.deviceId;
        updateSelectedCamera(selectedCamera);
      }
      // initialize torch state to `torchOn` prop value
      if(cameraLight.value !== props.torchOn) {
        await toggleTorch();
      }
      await getZoomConstraints();
      // Set focus mode
      await scanner.applyVideoConstraints({
        advanced: [
          {frameRate: 30},
          {resizeMode: 'none'},
          {focusMode: 'continuous'},
        ],
      });
      // Start scanner at zoom level 2 for iOS
      if($q.platform.is.ios) {
        onZoomChange(2);
      }
      // Use Barcode Detection API
      startBarcodeDetection();
      loadingCamera.value = false;
    });

    onUnmounted(async () => {
      if(scanner) {
        const scannerState = await scanner.getState();
        if(scannerState == Html5QrcodeScannerState.SCANNING) {
          await scanner.stop();
        }
      }
    });

    // Helper functions
    function handleClose() {
      emit('close');
      abortController.abort();
    }

    // Toggle camera light on and off
    async function toggleTorch() {
      cameraLight.value = !cameraLight.value;
      scanner.applyVideoConstraints({
        advanced: [{torch: cameraLight.value}],
      });
    }

    // Extract phone's zoom constraints
    async function getZoomConstraints() {
      const video = document.querySelector(`#dce-video-container > video`);
      const videoTracks = await video.srcObject.getVideoTracks();
      const {max = 8, min = 1, step = 1} =
        videoTracks[0]?.getCapabilities().zoom ?? {};
      // Save constraints to state
      cameraConstraints.zoom.min = min;
      cameraConstraints.zoom.max = max;
      cameraConstraints.zoom.step = step;
    }

    async function emitScanResult({barcodeDetector, video}) {
      const {signal} = abortController;
      try {
        const barcodes = await detectBarcodes({barcodeDetector, video, signal});
        const [result] = barcodes;
        emit('result', {type: result.format, text: result.rawValue});
      } catch(e) {
        // ignore scan cancellation; log errors and close scanner
        if(e.name !== 'AbortError') {
          console.error(e);
          emit('close');
        }
      }
    }

    function startBarcodeDetection() {
      // get video element
      const video = document.querySelector(
        '#dce-video-container > video');
      const {BarcodeDetector} = globalThis;
      // check if BarcodeDetector is supported
      if(!BarcodeDetector) {
        alert('Barcode Detector is not supported in this browser.');
        return;
      }
      const barcodeDetector = new BarcodeDetector({
        formats: formatsToSupport
      });
      // emit the first scanned result
      emitScanResult({barcodeDetector, video});
    }

    // Update camera zoom
    async function onZoomChange(updatedValue) {
      scanner.applyVideoConstraints({
        advanced: [{zoom: updatedValue}],
      });
    }

    // use Barcode Detection API instead of html5qrcode's logic
    function onScanSuccess() {
      return;
    }

    function onError(error) {
      if(!String(error).startsWith('QR code parse error')) {
        console.error('BarcodeScanner error:', error);
      }
    }

    function getCameraScanConfig() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // must parse float aspect ratio value
      const landscapeAspectRatio = parseFloat((width / height).toFixed(3));
      const portraitAspectRatio = parseFloat((height / width).toFixed(3));
      return {
        videoConstraints: {
          facingMode: 'environment',
          aspectRatio: $q.platform.is.desktop ?
            landscapeAspectRatio :
            width < height ?
              portraitAspectRatio :
              landscapeAspectRatio
        },
        ...(props.showQrBox && {qrbox: qrboxFunction})
      };
    }

    /**
     * A function that takes in the width and height of the video stream
     * and returns QrDimensions. Viewfinder refers to the video showing
     * camera stream.
     *
     * @param {number} viewfinderWidth - Video screen width.
     * @param {number} viewfinderHeight - Video screen height.
     * @returns {object} QR box width and height.
     */
    function qrboxFunction(viewfinderWidth, viewfinderHeight) {
      const minEdgePercentage = 0.75; // 75%
      const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
      const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
      return {
        width: qrboxSize,
        height: qrboxSize
      };
    }

    async function updateCamera(deviceId) {
      if(!scanner || selectedCameraId.value === deviceId) {
        return;
      }
      const scannerState = await scanner.getState();
      if(scannerState == Html5QrcodeScannerState.SCANNING) {
        try {
          await scanner.stop();
        } catch(e) {
          console.error(e);
        }
      }
      await scanner.start(
        deviceId,
        getCameraScanConfig(),
        onScanSuccess,
        onError
      );
      updateSelectedCamera(
        cameraList.value.find(c => c.deviceId === deviceId).deviceId
      );
    }

    return {
      emit,
      cameraList,
      cameraError,
      toggleTorch,
      handleClose,
      onZoomChange,
      updateCamera,
      loadingCamera,
      videoContainer,
      cameraConstraints,
    };
  }
};

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
          'must be given, e.g., "qr_code", not a number.');
      }
      throw new TypeError(`Unsupported format "${format}".`);
    }
    return result;
  });
}
</script>

<style>
body {
  /* Prevents pinch to zoom on iOS & Android */
  touch-action: pan-y;
}
</style>
