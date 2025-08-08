<template>
  <ScannerUI
    :tip-text="tipText"
    :camera-list="cameraList"
    :camera-error="cameraError"
    :capabilities="capabilities"
    :loading-camera="loadingCamera"
    :camera-constraints="cameraConstraints"
    @close="handleClose"
    @toggle-torch="toggleTorch"
    @update-camera="onCameraChange"
    @zoom-update="onZoomChange" />
</template>

<script>
/*!
 * Copyright (c) 2024-2025 Digital Bazaar, Inc. All rights reserved.
 */
import {onBeforeUnmount, onMounted, reactive, ref} from 'vue';
import {BarcodeDetector} from 'barcode-detector/ponyfill';
import {detectBarcodes} from '../lib/barcodes.js';
import ScannerUI from './ScannerUI.vue';

export default {
  name: 'BarcodeScanner',
  components: {
    ScannerUI
  },
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
    // constants
    let abortController = new AbortController();

    // refs
    let stream = null;
    const video = ref(null);
    const running = ref(false);
    const cameraList = ref([]);
    const cameraError = ref(null);
    const cameraTorch = ref(false);
    const loadingCamera = ref(false);
    const cameraConstraints = reactive({
      zoom: {min: 1, max: 8, step: 1}
    });
    const capabilities = reactive({
      zoom: false, torch: false
    });

    // start camera on mount
    onMounted(async () => startCamera());

    // stop camera on unmount
    onBeforeUnmount(() => stopCamera());

    async function startCamera({constraints} = {}) {
      if(running.value) {
        stopCamera();
      }
      loadingCamera.value = true;
      cameraError.value = false;
      running.value = true;
      try {
        await startVideoStream({constraints});
        getCapabilities();
        await getCameraList(); // call after startVideoStream for permissions
        startBarcodeDetection();
      } catch(err) {
        console.error('Could not start camera:', err);
        running.value = false;
        cameraError.value = true;
      } finally {
        loadingCamera.value = false;
      }
    }

    async function startVideoStream({constraints} = {}) {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'environment',
          width: {ideal: 1280},
          height: {ideal: 720}
        },
        ...constraints
      });
      const videoElement = document.querySelector('#video-container > video');
      video.value = videoElement;
      video.value.srcObject = stream;
      // wait until metadata is loaded
      await new Promise(res => {
        video.value.onloadedmetadata = () => res();
      });
    }

    async function getCameraList() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameraList.value = devices.reduce((all, device) => {
          const isVideoInput = device.kind === 'videoinput';
          return isVideoInput ? [...all, device] : all;
        }, []);
      } catch(err) {
        console.error('Unable to get camera list', err);
        cameraList.value = [];
      }
    }

    function startBarcodeDetection() {
      const {formatsToSupport: formats} = props;
      const barcodeDetector = new BarcodeDetector({formats});
      emitScanResult({barcodeDetector, video: video.value});
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

    async function onCameraChange(deviceId) {
      const constraints = {
        video: {
          deviceId: {exact: deviceId},
          width: {ideal: 1280},
          height: {ideal: 720}
        }
      };
      await startCamera({constraints});
    }

    function stopCamera() {
      abortController.abort();
      abortController = new AbortController();
      running.value = false;
      if(stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
    }

    // Helper functions
    function handleClose() {
      stopCamera();
      emit('close');
    }

    function getCapabilities() {
      if(!stream) {
        return;
      }
      const track = stream.getVideoTracks()[0];
      const {zoom, torch} = track.getCapabilities();
      capabilities.zoom = !!zoom;
      capabilities.torch = !!torch;
      if(zoom) {
        const {max = 8, min = 1, step = 1} = zoom;
        // Save constraints to state
        cameraConstraints.zoom.min = min;
        cameraConstraints.zoom.max = max;
        cameraConstraints.zoom.step = step;
      }
    }

    function toggleTorch() {
      if(!stream) {
        return;
      }
      const track = stream.getVideoTracks()[0];
      cameraTorch.value = !cameraTorch.value;
      const constraints = {advanced: [{torch: cameraTorch.value}]};
      track.applyConstraints(constraints)
        .catch(err => console.error('Torch error:', err));
    }

    async function onZoomChange(updatedValue) {
      if(!stream) {
        return;
      }
      const track = stream.getVideoTracks()[0];
      const constraints = {advanced: [{zoom: updatedValue}]};
      track.applyConstraints(constraints)
        .catch(err => console.error('Zoom error:', err));
    }

    return {
      cameraList,
      cameraError,
      toggleTorch,
      handleClose,
      capabilities,
      onZoomChange,
      loadingCamera,
      onCameraChange,
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
