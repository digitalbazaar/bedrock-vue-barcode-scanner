<template>
  <div class="fixed-full bg-black">
    <!-- Video Stream -->
    <div
      id="video-container"
      class="video-container">
      <video
        muted
        autoplay
        playsinline />
    </div>

    <!-- Loading -->
    <div
      v-if="loadingCamera"
      class="absolute-center"
      style="width: 60vw">
      <div class="text-white text-center text-h5 q-mb-md">
        Loading Camera
      </div>
      <q-linear-progress
        rounded
        indeterminate
        color="white" />
    </div>

    <!-- Camera Error -->
    <div
      v-if="cameraError"
      class="absolute-center full-width text-center">
      <div
        class="text-white text-h5 q-mx-auto"
        style="max-width: 350px;">
        There was an error loading your camera. Please refresh the page.
      </div>
    </div>

    <!-- Close -->
    <q-btn
      flat
      fab
      :ripple="false"
      size="16px"
      icon="fas fa-times"
      :color="cameraError ? 'red-12' : 'white'"
      class="q-ma-sm absolute-top-right close-button"
      @click="handleClose" />

    <!-- Zoom slider -->
    <q-item
      v-if="!cameraError"
      v-show="!loadingCamera"
      class="absolute-bottom q-mx-xl zoom-slider">
      <q-item-section side>
        <q-icon
          color="white"
          name="fa fa-search-minus" />
      </q-item-section>
      <q-item-section>
        <q-slider
          v-model="zoom"
          color="white"
          track-color="white"
          :min="cameraConstraints.zoom.min"
          :max="cameraConstraints.zoom.max"
          :step="cameraConstraints.zoom.step"
          @change="onZoomChange" />
      </q-item-section>
      <q-item-section side>
        <q-icon
          color="white"
          name="fa fa-search-plus" />
      </q-item-section>
    </q-item>

    <!-- Tip Text -->
    <div
      v-if="tipText && !cameraError"
      v-show="!loadingCamera"
      ref="tipText"
      class="absolute-bottom tip-text text-white
      text-center full-width q-py-sm">
      {{tipText}}
    </div>

    <!-- Bottom buttons -->
    <div
      v-if="!cameraError"
      v-show="!loadingCamera"
      class="full-width absolute-bottom bottom-container">
      <q-btn-group
        spread
        class="button-group full-width shadow-0">
        <!-- Camera Button -->
        <q-btn-dropdown
          flat
          no-caps
          text-color="white"
          icon="fas fa-video"
          label="Camera Select"
          style="font-weight: 600"
          :disabled="loadingCamera">
          <q-list>
            <q-item
              v-for="camera in cameraList"
              :key="camera.deviceId"
              v-close-popup
              clickable
              @click="onChangeCamera(camera)">
              <q-item-section>
                <q-item-label>{{camera.label}}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-separator
          v-show="capabilities.torch"
          inset
          vertical
          color="grey-8" />

        <!-- Torch -->
        <q-btn
          v-show="!loadingCamera && capabilities.torch"
          flat
          no-caps
          color="white"
          text-color="white"
          icon="fas fa-bolt"
          label="Light On/ Off"
          style="font-weight: 600"
          :disabled="loadingCamera"
          @click="handleToggleTorch" />
      </q-btn-group>
    </div>
  </div>
</template>

<script>
/*!
 * Copyright (c) 2024-2025 Digital Bazaar, Inc. All rights reserved.
 */
import {ref} from 'vue';

export default {
  name: 'ScannerUI',
  props: {
    tipText: {
      type: String,
      default: '',
    },
    cameraList: {
      type: Array,
      default: () => [],
    },
    loadingCamera: {
      type: Boolean,
      default: false,
    },
    cameraError: {
      type: Boolean,
      default: false,
    },
    capabilities: {
      type: Object,
      default: () => ({zoom: false, torch: false})
    },
    cameraConstraints: {
      type: Object,
      default: () => ({
        zoom: {
          min: 1,
          max: 8,
          step: 1,
        },
      }),
    },
  },
  emits: ['close', 'updateCamera', 'upload', 'toggle-torch', 'zoom-update'],
  setup(_, {emit}) {
    const zoom = ref(1);

    async function onChangeCamera(camera) {
      emit('updateCamera', camera.deviceId);
    }

    async function onZoomChange(updatedValue) {
      emit('zoom-update', updatedValue);
    }

    function handleClose() {
      emit('close');
    }

    function handleToggleTorch() {
      emit('toggle-torch');
    }

    return {
      zoom,
      handleClose,
      onZoomChange,
      onChangeCamera,
      handleToggleTorch,
    };
  },
};
</script>

<style>
.tip-text {
  background-color: rgba(0, 0, 0, 0.7);
  /* observe safe area if value is present on mobile device */
  margin-bottom: calc(env(safe-area-inset-bottom, 0px) + 70px);
}
.bottom-container {
  height: 90px;
  display: flex;
  border-radius: 0;
  justify-content: flex-start;
  background-color: #1F2937;
  height: calc(env(safe-area-inset-bottom, 0px) + 70px);
}
.button-group {
  height: 70px;
}
.close-button {
  margin-top: calc(env(safe-area-inset-top, 0px) + 8px);
}
.zoom-slider {
  margin-bottom: calc(env(safe-area-inset-bottom, 0px) + 110px);
}
.video-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: black;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
}
video {
  width: 100%; /* prevents distorting aspect ratio */
  height: auto; /* prevents distorting aspect ratio */
  object-fit: contain; /* prevents distorting aspect ratio */
  background: black;
}
</style>
