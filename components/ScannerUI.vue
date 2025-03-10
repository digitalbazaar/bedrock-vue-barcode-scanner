<template>
  <div class="fixed-full bg-black">
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

    <!-- Video Stream -->
    <div
      id="dce-video-container"
      class="dce-video-container" />

    <!-- Camera Error -->
    <div
      v-if="cameraError"
      class="absolute-top text-center q-mt-xl">
      <div class="row items-center justify-center">
        <q-icon
          color="red-12"
          name="fas fa-times"
          class="icon q-pa-lg" />
      </div>
      <div
        class="q-mt-md"
        style="max-width: 250px">
        There was an error loading your camera. Please refresh the page.
      </div>
    </div>

    <!-- Tip Text -->
    <div
      v-if="tipText"
      ref="tipText"
      class="absolute-bottom tip-text text-white
      text-center full-width q-py-sm">
      {{tipText}}
    </div>

    <!-- Close -->
    <q-btn
      flat
      fab
      :ripple="false"
      size="16px"
      :color="cameraError ? 'primary' : 'white'"
      icon="fas fa-times"
      class="q-ma-sm absolute-top-right"
      @click="handleClose" />

    <!-- Zoom slider -->
    <div
      class="absolute-bottom q-mx-xl"
      style="bottom: 100px">
      <q-slider
        v-model="zoom"
        color="white"
        track-color="white"
        :min="cameraConstraints.zoom.min"
        :max="cameraConstraints.zoom.max"
        :step="cameraConstraints.zoom.step" />
    </div>

    <!-- Bottom buttons -->
    <q-btn-group
      class="absolute-bottom full-width bottom-buttons"
      spread>
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
        inset
        vertical
        color="grey-8" />

      <!-- Torch -->
      <q-btn
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
</template>

<script>
/*!
 * Copyright (c) 2024-2025 Digital Bazaar, Inc. All rights reserved.
 */
import {ref, watch} from 'vue';

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

    watch(zoom, updatedValue => {
      emit('zoom-update', updatedValue);
    });

    const onChangeCamera = async camera => {
      emit('updateCamera', camera.deviceId);
    };

    function handleClose() {
      emit('close');
    }

    function handleToggleTorch() {
      emit('toggle-torch');
    }

    return {
      zoom,
      handleClose,
      onChangeCamera,
      handleToggleTorch,
    };
  },
};
</script>

<style>
.tip-text {
  margin-bottom: 50px;
  background-color: rgba(0, 0, 0, 0.7);
}
.bottom-buttons {
  height: 50px;
  border-radius: 0;
  background-color: rgba(31, 41, 55, 0.9);
}
</style>
