<template>
  <slot v-if="$slots.default && !_srcList.length" />
  <image-preview
    v-bind="props"
    v-model:visible="computedVisible"
    :src="src"
    :class="$attrs.class"
    :style="$attrs.style"
  >
    <template #arrow>
      <div class="yc-image-preview-arrow">
        <image-preview-arrow type="left" @click="handleCurrentChange('pre')" />
        <image-preview-arrow
          type="right"
          @click="handleCurrentChange('next')"
        />
      </div>
    </template>
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </image-preview>
</template>

<script lang="ts" setup>
import { toRefs, watchEffect } from 'vue';
import {
  ImagePreviewGroupProps,
  ImagePreviewGroupEmits,
  ImagePreviewGroupSlots,
} from './type';
import { onKeyStroke } from '@shared/utils';
import useContext from './hooks/useContext';
import ImagePreview from './ImagePreview.vue';
import ImagePreviewArrow from './ImagePreviewArrow.vue';
defineOptions({
  name: 'ImagePreviewGroup',
  inheritAttrs: false,
});
const $slots = defineSlots<ImagePreviewGroupSlots>();
const props = withDefaults(defineProps<ImagePreviewGroupProps>(), {
  visible: undefined,
  defaultVisible: false,
  maskClosable: true,
  closable: true,
  actionsLayout: () => [
    'fullScreen',
    'rotateRight',
    'rotateLeft',
    'zoomIn',
    'zoomOut',
    'originalSize',
  ],
  popupContainer: undefined,
  escToClose: true,
  wheelZoom: true,
  keyboard: true,
  defaultScale: 1,
  zoomRate: 1.1,
  srcList: () => [],
  current: undefined,
  defaultCurrent: 0,
  infinite: false,
});
const emits = defineEmits<ImagePreviewGroupEmits>();
// 解构属性
const { srcList: _srcList, infinite, keyboard } = toRefs(props);
// 注入数据
const { src, srcList, computedCurrent, computedVisible } = useContext().provide(
  props,
  emits
);
// 处理index发生改变
const handleCurrentChange = (type: string) => {
  let index = 0;
  if (
    !infinite.value &&
    ((type == 'pre' && computedCurrent.value == 0) ||
      (type == 'next' && computedCurrent.value == srcList.value.length - 1))
  ) {
    return;
  }
  if (type == 'pre') {
    index = computedCurrent.value - 1;
    index = index < 0 ? srcList.value.length - 1 : index;
  } else {
    index = computedCurrent.value + 1;
    index = index == srcList.value.length ? 0 : index;
  }
  computedCurrent.value = index;
};
// 注册事件监听器
watchEffect(() => {
  const lisenters: Array<() => void> = [];
  if (!computedVisible.value || !keyboard.value) {
    return lisenters[0]?.();
  }
  lisenters[0] = onKeyStroke(['ArrowLeft', 'ArrowRight'], (e) => {
    const map: Record<string, string> = {
      ArrowLeft: 'pre',
      ArrowRight: 'next',
    };
    handleCurrentChange(map[e.key]);
  });
});
</script>
