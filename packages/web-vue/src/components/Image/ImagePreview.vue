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
      <transition
        name="fade"
        @before-open="handleRegisterEvent"
        @before-close="handleClearEvent"
        @after-leave="handleAfterLeave"
      >
        <div
          v-show="innerVisible"
          class="yc-image-preview-wrapper"
          @click.self="handleClose('mask', $event)"
        >
          <!-- img -->
          <div
            class="yc-image-preview-img-container"
            @click.self="!isDragging && handleClose('mask', $event)"
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
            @click="handleClose('closeBtn', $event)"
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
  valueToPx,
} from '@shared/utils';
import useModalClose from '@/components/Modal/hooks/useModalClose';
import ImagePreviewToolbar from './ImagePreviewToolbar.vue';
import useImageDraggable from './hooks/useImageDraggable';
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
// 监听器
const lisenters: Array<() => void> = [];
// scale
const scale = useControlValue<number>(ref(), defaultScale.value);
// rotate
const rotate = ref<number>(0);
// imageRef
const imageRef = ref<HTMLImageElement>();
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
// 处理图片拖动
const { x, y, isDragging } = useImageDraggable(imageRef);
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
// 处理注册事件
const handleRegisterEvent = () => {
  emits('beforeOpen');
  if (wheelZoom.value) {
    lisenters[0] = useEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 判断是放大还是缩小
        const delta = e.deltaY < 0 ? 1 : -1;
        // 计算新的缩放比例
        scale.value *= Math.pow(zoomRate.value, delta);
      },
      {
        passive: false,
      }
    );
  }
  if (keyboard.value) {
    lisenters[1] = onKeyStroke(['ArrowUp', 'ArrowDown', ' '], (e) => {
      const map: Record<string, string> = {
        ArrowUp: 'zoomIn',
        ArrowDown: 'zoomOut',
        ' ': 'originalSize',
      };
      handleAction(map[e.key]);
    });
  }
};
// 处理事件注销
const handleClearEvent = () => {
  emits('beforeClose');
  lisenters.forEach((v) => v());
};
</script>

<style lang="less">
@import './style/image-preview.less';
</style>
