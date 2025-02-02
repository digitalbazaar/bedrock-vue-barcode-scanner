<template>
  <div class="column col-grow justify-center">
    <div class="row items-center justify-center">
      <div class="spinner q-mx-auto" />
    </div>
    <div
      style="width: 300px"
      class="text-h6 q-mt-lg q-mb-sm text-center q-mx-auto">
      {{title}}
    </div>
    <div
      style="width: 300px"
      class="text-body1 q-pb-xl text-center q-mx-auto">
      {{description}}
    </div>
  </div>
</template>

<script>
/*!
 * Copyright (c) 2024 Digital Bazaar, Inc. All rights reserved.
 */
export default {
  name: 'LoadingIndicator',
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
  }
};
</script>

<style lang="scss" scoped>
.spinner {
  content: '';
  box-sizing: border-box;
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border-top: 8px solid #63C6C2;
  border-right: 4px solid transparent;
  animation: spinner .6s linear infinite;
}
@keyframes spinner {
  to {transform: rotate(360deg);}
}
</style>
