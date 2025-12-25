<template>
  <yc-statistic
    :title="title"
    :value="startValue - 1000"
    :value-from="startValue"
    :start="start"
    :animation="animation"
    :format="format"
    :value-style="valueStyle"
    :easeing="easeing"
    :animation-duration="1000"
    is-countdown
    @finish="handleFinish"
  >
    <template #value>
      {{ formatSeconds(value - now, format) }}
    </template>
  </yc-statistic>
</template>

<script lang="ts" setup>
import { nextTick, ref, toRefs, watch } from 'vue';
import { CountdownProps, CountDownEmits, CountdownSlots } from './type';
import { isUndefined, formatSeconds } from '@shared/utils';
import YcStatistic from './Statistic.vue';
defineOptions({
  name: 'Countdown',
});
defineSlots<CountdownSlots>();
const props = withDefaults(defineProps<CountdownProps>(), {
  title: '',
  value: undefined,
  now: undefined,
  format: 'HH:mm:ss',
  start: true,
  easeing: 'quadOut',
  valueStyle: () => {
    return {};
  },
});
const emits = defineEmits<CountDownEmits>();
const { value: _value, now: _now, format, start } = toRefs(props);
// value
const value = ref<number>(0);
// now
const now = ref<number>(0);
// 开始的时候的value
const startValue = ref<number>(value.value);
// 是否开启动画
const animation = ref<boolean>(false);
// 处理finish
const handleFinish = () => {
  if (startValue.value - 1000 <= 0) {
    animation.value = false;
    return emits('finish');
  }
  startValue.value -= 1000;
};
// 检测start开启动画
watch(
  () => start.value,
  async (val) => {
    if (!animation.value) {
      value.value = isUndefined(_value.value)
        ? Date.now() + 5 * 60 * 1000
        : _value.value;
      now.value = isUndefined(_now.value) ? Date.now() : _now.value;
      startValue.value = value.value - now.value;
    }
    if (!val) return;
    await nextTick();
    animation.value = true;
  },
  {
    immediate: true,
  }
);
</script>
