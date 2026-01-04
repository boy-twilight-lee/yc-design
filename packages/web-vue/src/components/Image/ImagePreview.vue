<template>
  <teleport :to="popupContainer">
    <div
      v-if="outerVisible"
      :class="['yc-image-preview', $attrs.class]"
      :style="{
        ...teleportStyle,
        ...($attrs.style ?? {}),
      }"
    >
      <transition name="fade">
        <div v-show="innerVisible" class="yc-image-preview-mask"></div>
      </transition>
      <!-- body -->
      <transition name="fade" @after-leave="handleAfterLeave">
        <div
          v-show="innerVisible"
          class="yc-image-preview-wrapper"
          @click.self="handleClose('mask', $event, false)"
        >
          <!-- img -->
          <div
            class="yc-image-preview-img-container"
            @click.self="!isDragging && handleClose('mask', $event, false)"
          >
            <img
              :src="src"
              :style="{
                transform: `translate(calc(${valueToPx(x)} - 50%), calc(${valueToPx(y)} - 50%)) rotate(${rotate}deg) scale(${scale}, ${scale})`,
              }"
              @mousedown.prevent=""
              class="yc-image-preview-img"
              ref="imageRef"
            />
          </div>
          <!-- toolbar -->
          <image-preview-toolbar
            :actionsLayout="actionsLayout"
            @click="handleAction"
          >
            <template v-if="$slots.actions" #actions>
              <slot name="actions" />
            </template>
          </image-preview-toolbar>
          <!-- arrow -->
          <slot name="arrow" />
          <!-- close-btn -->
          <div
            v-if="closable"
            class="yc-image-preview-close-btn"
            @click="handleClose('closeBtn', $event, false)"
          >
            <icon-close />
          </div>
        </div>
      </transition>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { ref, toRefs } from 'vue';
import {
  ImagePreviewProps,
  ImagePreviewEmits,
  ImagePreviewSlots,
} from './type';
import { IconClose } from '@shared/icons';
import {
  useEventListener,
  onKeyStroke,
  useControlValue,
  getGlobalConfig,
  useDraggable,
  sleep,
  valueToPx,
} from '@shared/utils';
import useModalClose from '@/components/Modal/hooks/useModalClose';
import ImagePreviewToolbar from './ImagePreviewToolbar.vue';
defineOptions({
  name: 'ImagePreview',
  inheritAttrs: false,
});
const $slots = defineSlots<ImagePreviewSlots>();
const props = withDefaults(defineProps<ImagePreviewProps>(), {
  src: '',
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
});
const emits = defineEmits<ImagePreviewEmits>();
const {
  visible,
  defaultVisible,
  maskClosable,
  escToClose,
  defaultScale,
  zoomRate,
  wheelZoom,
  keyboard,
} = toRefs(props);
// 接收全局属性
const { teleportStyle, popupContainer } = getGlobalConfig(props);
// imageRef
const imageRef = ref<HTMLImageElement>();
// scale
const scale = useControlValue<number>(ref(), defaultScale.value);
// rotate
const rotate = ref<number>(0);
// 处理拖动
const x = ref<number>(0);
const y = ref<number>(0);
const isDragging = ref<boolean>(false);
useDraggable(imageRef, {
  onStart: () => {
    isDragging.value = true;
  },
  onMove(_, e) {
    if (!isDragging.value) return;
    x.value += e.movementX;
    y.value += e.movementY;
  },
  async onEnd() {
    x.value = 0;
    y.value = 0;
    await sleep(5);
    isDragging.value = false;
  },
});
// 处理Modal关闭
const { outerVisible, innerVisible, handleClose, handleAfterLeave } =
  useModalClose({
    visible,
    defaultVisible,
    escToClose,
    maskClosable,
    onBeforeOk: () => true,
    onBeforeCancel: () => true,
    emits: emits as (...args: any) => void,
  });
// 处理action
const handleAction = (action: string) => {
  switch (action) {
    case 'rotateRight':
      {
        rotate.value += 90;
      }
      break;
    case 'rotateLeft':
      {
        rotate.value -= 90;
      }
      break;
    case 'zoomIn':
      {
        scale.value *= zoomRate.value;
      }
      break;
    case 'zoomOut':
      {
        scale.value /= zoomRate.value;
      }
      break;
    case 'originalSize':
      {
        scale.value = defaultScale.value;
        rotate.value = 0;
      }
      break;
    case 'fullScreen':
      {
        const { offsetWidth, offsetHeight } = imageRef.value!;
        if (offsetWidth > offsetHeight) {
          scale.value = window.innerHeight / offsetHeight;
        } else {
          scale.value = window.innerHeight / offsetWidth;
        }
      }
      break;
  }
};
// 初始化监听器
const intLisenter = () => {
  useEventListener('wheel', (e) => {
    if (!innerVisible.value || !wheelZoom.value) return;
    e.preventDefault();
    e.stopPropagation();
    // 判断是放大还是缩小
    const delta = e.deltaY < 0 ? 1 : -1;
    // 计算新的缩放比例
    scale.value *= Math.pow(zoomRate.value, delta);
  });
  const map: Record<string, string> = {
    ArrowUp: 'zoomIn',
    ArrowDown: 'zoomOut',
    ' ': 'originalSize',
  };
  onKeyStroke(['ArrowUp', 'ArrowDown', ' '], (e) => {
    if (!innerVisible.value || !keyboard.value) return;
    handleAction(map[e.key]);
  });
};
intLisenter();
</script>

<style lang="less">
@import './style/image-preview.less';
</style>
