<template>
  <div
    :class="['yc-scrollbar-track', `yc-scrollbar-track-direction-${direction}`]"
    ref="trackRef"
    @click.self="handleClick"
  >
    <div
      :class="[
        'yc-scrollbar-thumb',
        `yc-scrollbar-thumb-direction-${direction}`,
      ]"
      :style="style"
      ref="dragRef"
    >
      <div
        :class="[
          'yc-scrollbar-thumb-bar',
          {
            'yc-scrollbar-thumb-bar-dragging': isDragging,
            'yc-scrollbar-thumb-bar-hover': !isDragging && _isDragging,
          },
        ]"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, toRefs, computed, watch } from 'vue';
import { useDraggable, useResizeObserver, valueToPx } from '@shared/utils';
import { Direction } from '@shared/type';
import useContext from './hooks/useContext';
const props = withDefaults(
  defineProps<{
    direction?: Direction;
  }>(),
  {
    direction: 'vertical',
  }
);
const emits = defineEmits<{
  (e: 'drag', isVertical: boolean, value: number): void;
  (e: 'resize', val: number): void;
}>();
const { direction } = toRefs(props);
// 接受值
const {
  scrollRef,
  thumbHeight,
  thumbWidth,
  movableLeft,
  movableTop,
  curTop,
  curLeft,
  thumbStyle,
  isDragging: _isDragging,
} = useContext().inject();
// 是否是垂直
const isVertical = computed(() => direction.value == 'vertical');
// thumbStyle
const style = computed(() => {
  return isVertical.value
    ? {
        height: valueToPx(thumbHeight.value),
        transform: `translateY(${valueToPx(curTop.value)})`,
        ...thumbStyle.value,
      }
    : {
        width: valueToPx(thumbWidth.value),
        transform: `translateX(${valueToPx(curLeft.value)})`,
        ...thumbStyle.value,
      };
});
// 获取轨道的宽度
const trackRef = ref<HTMLDivElement>();
useResizeObserver(trackRef, () => {
  const { width, height } = trackRef.value!.getBoundingClientRect();
  emits('resize', isVertical.value ? width : height);
});
// dargRef
const dragRef = ref<HTMLDivElement>();
// 处理拖动
const { x, y, isDragging } = useDraggable(dragRef, {
  onMove() {
    const { left, top } = scrollRef.value!.getBoundingClientRect();
    const minTop = top;
    const maxTop = movableTop.value + minTop;
    const minLeft = left;
    const maxLeft = movableLeft.value + minLeft;
    if (isVertical.value) {
      y.value = y.value <= minTop ? minTop : y.value;
      y.value = y.value >= maxTop ? maxTop : y.value;
      emits('drag', true, y.value - minTop);
    } else {
      x.value = x.value <= minLeft ? minLeft : x.value;
      x.value = x.value >= maxLeft ? maxLeft : x.value;
      emits('drag', false, x.value - minLeft);
    }
  },
});
watch(
  () => isDragging.value,
  (val) => {
    _isDragging.value = val;
  },
  {
    immediate: true,
  }
);
// 处理鼠标点击
const handleClick = (e: MouseEvent) => {
  const { offsetX, offsetY } = e;
  if (isVertical.value) {
    // 计算位移的拘留
    const moveDistance =
      curTop.value < offsetY ? movableTop.value / 9 : -movableTop.value / 9;
    // 判断合法性
    let value = curTop.value + moveDistance;
    value = value <= 0 ? 0 : value;
    value = value > movableTop.value ? movableTop.value : value;
    emits('drag', true, value);
  } else {
    // 计算位移的
    const moveDistance =
      curLeft.value < offsetX ? movableLeft.value / 9 : -movableLeft.value / 9;
    // 判断合法性
    let value = curLeft.value + moveDistance;
    value = value <= 0 ? 0 : value;
    value = value > movableLeft.value ? movableLeft.value : value;
    emits('drag', false, value);
  }
};
</script>

<style lang="less">
@import './style/scrollbar.less';
</style>
