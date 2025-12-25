<template>
  <div
    class="yc-color-picker-palette"
    :style="{
      backgroundColor: baseColor,
    }"
    ref="paletteRef"
    @click="handleClick"
  >
    <div
      class="yc-color-picker-handler"
      :style="{
        transform: `translate(calc(${valueToPx(x * width)} - 50%),calc(${valueToPx(y * height)} - 50%))`,
      }"
      ref="btnRef"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, toRefs, computed, nextTick } from 'vue';
import {
  valueToPx,
  parseColor,
  useDraggable,
  useElementBounding,
} from '@shared/utils';
const props = defineProps<{
  color: string;
  baseColor: string;
  popupVisible: boolean;
  disabled: boolean;
  hideTrigger: boolean;
}>();
const emits = defineEmits<{
  (e: 'update:color', value: string): void;
  (e: 'update:baseColor', value: string): void;
}>();
const { popupVisible, baseColor, disabled, hideTrigger } = toRefs(props);
// btn实例
const btnRef = ref<HTMLDivElement>();
// 面板实例
const paletteRef = ref<HTMLDivElement>();
// plate的宽高
const { width, height, top, left } = useElementBounding(paletteRef, {
  updateTiming: 'next-frame',
});
// hsv
const hsv = computed(() => {
  return parseColor(baseColor.value).toHsv();
});
// dragger
const { x, y } = useDraggable(btnRef, {
  disabled,
  onMove() {
    setColor();
  },
});
// 处理点击
const handleClick = (e: MouseEvent) => {
  if (disabled.value) return;
  x.value = e.pageX;
  y.value = e.pageY;
  setColor();
};
// 设置颜色
const setColor = () => {
  x.value = (x.value - left.value) / width.value;
  x.value = x.value < 0 ? 0 : x.value;
  x.value = x.value > 1 ? 1 : x.value;
  y.value = (y.value - top.value) / height.value;
  y.value = y.value < 0 ? 0 : y.value;
  y.value = y.value > 1 ? 1 : y.value;
  const color = parseColor({
    ...hsv.value,
    s: x.value,
    v: 1 - y.value,
  }).toHexString();
  emits('update:color', color);
};
// 检测visible
watch(
  () => popupVisible.value,
  async (val) => {
    if (val || hideTrigger.value) {
      await nextTick();
      x.value = hsv.value.s;
      y.value = 1 - hsv.value.v;
    }
  },
  {
    immediate: true,
  }
);

defineExpose({
  setPosition(color: string) {
    const { s, v } = parseColor(color).toHsv();
    x.value = s;
    y.value = 1 - v;
  },
});
</script>

<style lang="less">
@import './style/color-picker.less';
</style>
