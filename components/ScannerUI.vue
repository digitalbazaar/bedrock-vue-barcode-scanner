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

    <!-- Close -->
    <q-btn
      flat
      fab
      :ripple="false"
      size="16px"
      icon="fas fa-times"
      :color="cameraError ? 'primary' : 'white'"
      class="q-ma-sm absolute-top-right close-button"
      @click="handleClose" />

    <!-- Zoom slider -->
    <q-item class="absolute-bottom q-mx-xl zoom-slider">
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
          :step="cameraConstraints.zoom.step" />
      </q-item-section>
      <q-item-section side>
        <q-icon
          color="white"
          name="fa fa-search-plus" />
      </q-item-section>
    </q-item>

    <!-- Tip Text -->
    <div
      v-if="tipText"
      ref="tipText"
      class="absolute-bottom tip-text text-white
      text-center full-width q-py-sm">
      {{tipText}}
    </div>

    <!-- Bottom buttons -->
    <div class="full-width absolute-bottom bottom-container">
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
  </div>
</template>

<script>
/*!
 * Copyright (c) 2024-2025 Digital Bazaar, Inc. All rights reserved.
 */
import {ref, watch} from 'vue';
import {useQuasar} from 'quasar';

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
    // use functions
    const $q = useQuasar();

    // start scanner at zoom level 2 for iOS
    const zoom = ref($q.platform.is.ios ? 2 : 1);

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
  background-color: rgba(0, 0, 0, 0.7);
  /* observe safe area if value is present on mobile device */
  margin-bottom: calc(env(safe-area-inset-bottom, 0px) + 70px);
}
.bottom-container {
  height: 90px;
  display: flex;
  border-radius: 0;
  justify-content: flex-start;
  background-color: rgba(31, 41, 55, 0.9);
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
</style>
