<template>
  <component
    :is="component"
    :class="['yc-split', `yc-split-direction-${direction}`]"
    ref="splitRef"
  >
    <!-- first -->
    <div
      class="yc-split-pane yc-split-pane-first"
      :style="{
        flex: `0 0 calc(${rate} - ${valueToPx(triggerSize / 2)}`,
      }"
    >
      <slot name="first" />
    </div>
    <!-- tirgger -->
    <div class="yc-split-trigger" ref="triggerRef">
      <slot name="resize-trigger">
        <div class="yc-split-trigger-icon-wrapper">
          <div class="yc-split-trigger-icon">
            <slot name="resize-trigger-icon">
              <icon-drag-dot
                :rotate="direction == 'horizontal' ? 90 : 0"
                :size="12"
              />
            </slot>
          </div>
        </div>
      </slot>
    </div>
    <!-- second -->
    <div class="yc-split-pane yc-split-pane-second">
      <slot name="second" />
    </div>
  </component>
</template>

<script lang="ts" setup>
import { ref, toRefs, computed, watch, nextTick } from 'vue';
import { SplitProps, SplitEmits, SplitSlots } from './type';
import { IconDragDot } from '@shared/icons';
import {
  isNumber,
  useDraggable,
  valueToPx,
  useControlValue,
} from '@shared/utils';

defineOptions({
  name: 'Split',
});
defineSlots<SplitSlots>();
const props = withDefaults(defineProps<SplitProps>(), {
  component: 'div',
  direction: 'horizontal',
  size: undefined,
  defaultSize: 0.5,
  min: 0,
  max: 1,
  disabled: false,
});
const emits = defineEmits<SplitEmits>();
const { size, defaultSize, direction, min, max } = toRefs(props);
// 受控的size
const computedSize = useControlValue<number | string>(
  size,
  defaultSize.value,
  (val) => {
    emits('update:size', val);
  }
);
// 比例
const rate = computed(() => {
  const value = isNumber(computedSize.value)
    ? computedSize.value
    : getRate(computedSize.value);
  return `${value * 100}%`;
});
// 容器ref
const splitRef = ref<HTMLDivElement>();
// 触发器
const triggerRef = ref<HTMLDivElement>();
// triggerSize
const triggerSize = computed(() => {
  const size =
    direction.value == 'horizontal'
      ? triggerRef.value?.offsetWidth
      : triggerRef.value?.offsetHeight;
  return size ?? 6;
});
// spiltSize
const splitSize = computed(() => {
  const rect = splitRef.value?.getBoundingClientRect();
  const size = direction.value == 'horizontal' ? rect?.width : rect?.height;
  return size ?? 0;
});
// 拖动
const { isDragging, x, y } = useDraggable(triggerRef, {
  onMove() {
    emits('moving');
    // 获取容器的left,top
    const { left, top } = splitRef.value!.getBoundingClientRect();
    // 计算base
    const pos = direction.value == 'horizontal' ? left : top;
    // 计算最小最大值
    const minValue = pos + getValue(min.value);
    const maxValue = pos + getValue(max.value) - triggerSize.value;
    // 中间值
    let value = '';
    // 计算拖拽
    if (direction.value == 'horizontal') {
      x.value = x.value < minValue ? minValue : x.value;
      x.value = x.value > maxValue ? maxValue : x.value;
      value = `${x.value - left}px`;
    } else {
      y.value = y.value < minValue ? minValue : y.value;
      y.value = y.value > maxValue ? maxValue : y.value;
      value = `${y.value - top}px`;
    }
    computedSize.value = isNumber(computedSize.value) ? getRate(value) : value;
  },
  onStart() {
    emits('moving-start');
  },
  onEnd() {
    emits('moving-end');
  },
});
// 获取具体的数值
const getValue = (value: number | string) => {
  return isNumber(value) ? value * splitSize.value : Number.parseFloat(value);
};
// 获取比例
const getRate = (value: string) => {
  return Number.parseFloat(value) / splitSize.value;
};
// 检测值的改变
watch(
  () => computedSize.value,
  async (val) => {
    if (isDragging.value) return;
    await nextTick();
    const { left, top } = splitRef.value!.getBoundingClientRect();
    x.value = left + getValue(val);
    y.value = top + getValue(val);
  },
  {
    immediate: true,
  }
);
</script>

<style lang="less">
@import './style/split.less';
</style>
