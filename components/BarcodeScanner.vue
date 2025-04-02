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
import {_detectBarcode, _mapFormats} from '../lib/helpers';
import {Html5Qrcode, Html5QrcodeScannerState} from 'html5-qrcode';
import {inject, onMounted, onUnmounted, reactive, ref} from 'vue';
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
    }
  },
  emits: ['result', 'close'],
  setup(props, {emit}) {
    // Props
    const {formatsToSupport} = props;

    // Constants
    let scanner = null;

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
        selectedCameraId.value ?? defaultCameraId,
        getCameraScanConfig(), onScanSuccess, onError
      );
      if(!selectedCameraId.value && cameraList.value.length) {
        const selectedCamera = scanner.getRunningTrackSettings()?.deviceId;
        updateSelectedCamera(selectedCamera);
      }
      // Default to turning light on
      if(!cameraLight.value) {
        await toggleTorch();
      }
      await getZoomConstraints();
      // Set focus mode
      scanner.applyVideoConstraints({
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
      const result = await _detectBarcode({barcodeDetector, video});
      if(result?.format && result?.rawValue) {
        emit('result', {type: result.format, text: result.rawValue});
      } else {
        video.requestVideoFrameCallback(() => {
          emitScanResult({barcodeDetector, video});
        });
      }
    }

    function startBarcodeDetection() {
      // Get video element
      const videoElement = document.querySelector(
        '#dce-video-container > video'
      );
      const {BarcodeDetector} = globalThis;
      // Check if BarcodeDetector is supported
      if(!BarcodeDetector) {
        alert('Barcode Detector is not supported in this browser.');
        return;
      } else {
        const barcodeDetector = new BarcodeDetector({
          formats: formatsToSupport
        });
        // Start the detection loop
        videoElement.requestVideoFrameCallback(() =>
          emitScanResult({barcodeDetector, video: videoElement})
        );
      }
    }

    // Update camera zoom
    async function onZoomChange(updatedValue) {
      scanner.applyVideoConstraints({
        advanced: [{zoom: updatedValue}],
      });
    }

    // Use Barcode Detection API instead of html5qrcode's logic
    function onScanSuccess() {
      return;
    }

    function onError(error) {
      console.error('BarcodeScanner error:', error);
    }

    function getCameraScanConfig() {
      const aspectRatio = parseFloat((innerHeight / innerWidth).toFixed(3));
      return {
        aspectRatio,
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
     * @returns {object} Qrbox width and height.
     */
    function qrboxFunction(viewfinderWidth, viewfinderHeight) {
      const minEdgePercentage = 0.9; // 90%
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
</script>

<style>
body {
  /* Prevents pinch to zoom on iOS & Android */
  touch-action: pan-y;
}
</style>
