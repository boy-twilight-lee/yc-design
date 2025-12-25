<template>
  <div class="test">
    <yc-image
      width="200"
      src="https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a8c8cdb109cb051163646151a4a5083b.png~tplv-uwbnlip3yd-webp.webp"
      :preview-props="{
        actionsLayout: ['rotateRight', 'zoomIn', 'zoomOut'],
      }"
    >
      <template #preview-actions>
        <yc-image-preview-action name="下载"
          ><icon-download
        /></yc-image-preview-action>
      </template>
    </yc-image>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="less">
#app {
  height: 100vh;
  width: 100vw;
  .test {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
}
</style>
