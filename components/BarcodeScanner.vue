<template>
  <div ref="videoContainer">
    <ScannerUI
      :tip-text="tipText"
      :camera-list="cameraList"
      :camera-error="cameraError"
      :loading-camera="loadingCamera"
      @close="handleClose"
      @toggle-torch="toggleTorch"
      @update-camera="updateCamera" />
  </div>
</template>

<script>
/*!
 * Copyright (c) 2024 Digital Bazaar, Inc. All rights reserved.
 */
import {Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats}
  from 'html5-qrcode';
import {inject, onMounted, onUnmounted, ref} from 'vue';
import ScannerUI from './ScannerUI.vue';

export default {
  name: 'BarcodeScanner',
  components: {ScannerUI},
  props: {
    formatsToSupport: {
      type: Array,
      default: () => [Html5QrcodeSupportedFormats.QR_CODE]
    },
    tipText: {
      type: String,
      default: ''
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

    // Inject
    const {selectedCameraId, updateSelectedCamera} = inject('selectedCameraId');

    // Lifecycle hooks
    onMounted(async () => {
      scanner = new Html5Qrcode(
        'dce-video-container', {
          fps: 60,
          formatsToSupport,
          useBarCodeDetectorIfSupported: true,
        }
      );
      const availableCameras = await Html5Qrcode.getCameras();
      cameraList.value = availableCameras.map(c => {
        return {deviceId: c.id, label: c.label};
      });
      /**
       * Select last camera in list in to default
       * to back facing non-fish eye camera
       */
      const defaultCameraId = cameraList.value.at(-1).deviceId;
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

    function onScanSuccess(decodedText, decodedResult) {
      const text = decodedText;
      const type = decodedResult?.result?.format?.formatName;
      console.log(
        'BarcodeScanner detected something:',
        decodedText ? decodedText : '<empty string>'
      );
      if(!type || !text) {
        return;
      }
      emit('result', {type, text});
    }

    function onError(error) {
      console.error('BarcodeScanner error:', error);
    }

    function getCameraScanConfig() {
      // Was causing problems for MacOS continuity camera
      // (box showed up but with 0 height despite height being nonzero
      // as returned from this function)

      // const videoElement = document.getElementById('dce-video-container');
      // const aspectRatio =
      //   formatsToSupport?.[0] == Html5QrcodeSupportedFormats.PDF_417 ?
      //     1.0 : 1.0;
      // // The smaller of 90% of the available width or max-height/aspectRatio
      // const width = Math.round(
      //   constrainedDimension(
      //     videoElement.clientWidth * 0.9,
      //     (videoElement.clientHeight - 90) * aspectRatio
      //   )
      // );
      // const height = Math.round(constrainedDimension(
      //   videoElement.clientHeight - 90,
      //   width / aspectRatio,
      // ));
      // return {
      //   qrbox: {width, height}
      // };
      const aspectRatio = parseFloat((innerHeight / innerWidth).toFixed(3));
      return {
        aspectRatio
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

    // function constrainedDimension(
    //   containerDimension, maxDesiredDimension, buffer = 0
    // ) {
    //   if(containerDimension > maxDesiredDimension + buffer) {
    //     return maxDesiredDimension;
    //   }
    //   return containerDimension - buffer;
    // }

    return {
      emit,
      cameraList,
      cameraError,
      toggleTorch,
      handleClose,
      updateCamera,
      loadingCamera,
      videoContainer,
    };
  }
};
</script>
