<template>
  <div
    :class="['yc-overflow-list', `yc-overflow-list-from-${from}`]"
    :style="{
      gap: valueToPx(margin),
      padding:
        from == 'start'
          ? `0 0 0 ${valueToPx(overFlowWidth)}`
          : ` 0 ${valueToPx(overFlowWidth)} 0 0`,
    }"
    ref="listRef"
  >
    <template v-for="(node, i) in tags" :key="i">
      <component v-if="i < max" id="overflowTag" :is="node" />
    </template>
    <!-- overflow -->
    <div v-if="max < tags.length" class="yc-overflow-tag" ref="overflowRef">
      <slot name="overflow" :number="overflowNumber">
        <yc-tag>
          {{ `+${overflowNumber}` }}
        </yc-tag>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, toRefs, computed, nextTick } from 'vue';
import {
  OverflowListProps,
  OverflowListEmits,
  OverflowListSlots,
} from './type';
import {
  throttle,
  valueToPx,
  useResizeObserver,
  unrefElement,
  findComponentsFromVnodes,
} from '@shared/utils';
import { default as YcTag } from '@/components/Tag';
defineOptions({
  name: 'OverflowList',
});
const $slots = defineSlots<OverflowListSlots>();
const props = withDefaults(defineProps<OverflowListProps>(), {
  min: 0,
  margin: 8,
  from: 'end',
});
const emits = defineEmits<OverflowListEmits>();
const { min, margin, from } = toRefs(props);
// 最大展示数量
const max = ref<number>(10000);
// 获取所有的widths
const widths = ref<number[]>([]);
// 获取插槽的tags
const tags = computed(() => {
  return findComponentsFromVnodes(
    $slots.default?.() || [],
    YcTag.name as string
  );
});
// list实例
const listRef = ref<HTMLDivElement>();
// 溢出tag的宽度
const overflowRef = ref<HTMLSpanElement>();
// 溢出宽度
const overFlowWidth = computed(() => {
  if (!overflowRef.value) return margin.value;
  return (
    (unrefElement(overflowRef) as HTMLDivElement).offsetWidth + margin.value
  );
});
// 溢出数量
const overflowNumber = computed(() => {
  return tags.value.length - max.value;
});
// 动态计算
useResizeObserver(
  listRef,
  throttle(async () => {
    await nextTick();
    let maxCount = 0;
    let totalWidth = 0;
    const listWidth = listRef.value!.offsetWidth;
    for (let i = 0; i < widths.value.length; i++) {
      const gap = i > 0 ? margin.value : 0;
      const newWidth = totalWidth + gap + widths.value[i];
      if (newWidth > listWidth) {
        break;
      }
      totalWidth = newWidth;
      maxCount++;
    }
    max.value = maxCount > min.value ? maxCount : min.value;
  }, 180)
);
// 检测max的改变触发change事件
watch(
  () => max.value,
  () => {
    emits('change', overflowNumber.value);
  }
);
// 检测tag的数量
watch(
  () => tags.value.length,
  async () => {
    max.value = 100000;
    await nextTick();
    const cur = [...document.querySelectorAll('#overflowTag')].map((item) => {
      return (item as HTMLSpanElement).offsetWidth as number;
    });
    widths.value = cur;
  },
  {
    immediate: true,
  }
);
</script>

<style lang="less">
@import './style/overflow-list.less';
</style>
