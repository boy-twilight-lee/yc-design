<template>
  <div class="test">
    <yc-button
      @click="
        $drawer.open({
          content: '11',
        })
      "
    >
      测试
    </yc-button>
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
