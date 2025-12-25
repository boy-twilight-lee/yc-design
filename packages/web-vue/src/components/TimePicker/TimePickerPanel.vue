<template>
  <div class="yc-timepicker-container">
    <div class="yc-timepicker">
      <div
        v-for="(column, i) in timeColumnCells"
        :key="i"
        class="yc-timepicker-column"
      >
        <yc-scrollbar
          v-bind="scrollbarProps"
          :outer-style="{
            height: '100%',
          }"
          :style="{
            height: '100%',
            overflow: 'auto',
          }"
          :ref="
            (el) =>
              (scrollContainer[i] = (el as ScrollbarInstance)?.getScrollRef())
          "
        >
          <ul>
            <li
              v-show="
                !hideDisabledOptions || !disabledTime(cell.value, column.unit)
              "
              v-for="(cell, k) in column.cells"
              :key="cell.value"
              :class="[
                'yc-timepicker-cell',
                {
                  'yc-timepicker-cell-selected': cell.value == curValue[i],
                  'yc-timepicker-cell-disabled': disabledTime(
                    cell.value,
                    column.unit
                  ),
                },
              ]"
              :ref="(el) => (cells[i][k] = el as HTMLLIElement)"
              @click="
                () => {
                  if (
                    disabledTime(cell.value, column.unit) ||
                    cell.value == curValue[i]
                  ) {
                    return;
                  }
                  handleClick(cell.value, i);
                }
              "
            >
              <div class="yc-timepicker-cell-inner">
                {{ cell.label }}
              </div>
            </li>
          </ul>
        </yc-scrollbar>
      </div>
    </div>
    <div v-if="$slots.extra" class="yc-timepicker-footer-extra-wrapper">
      <slot name="extra" />
    </div>
    <div v-if="!disableConfirm" class="yc-timepicker-footer-btn-wrapper">
      <yc-button size="mini" @click="hanldeJump(dayjs())">
        {{ t('datePicker.now') }}
      </yc-button>
      <yc-button
        type="primary"
        size="mini"
        :disabled="!curValue.length"
        @click="handleConfirm"
      >
        {{ t('datePicker.ok') }}
      </yc-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue';
import {
  isUndefined,
  isArray,
  useI18n,
  BTween,
  dayjs,
  Dayjs,
  UnitType,
  isValidTimeRange,
} from '@shared/utils';
import useContext from './hooks/useContext';
import YcButton from '@/components/Button';
import {
  default as YcScrollbar,
  ScrollbarInstance,
} from '@/components/Scrollbar';
// 接收注入
const {
  timeColumn,
  timeColumnCells,
  curValue,
  format,
  computedValue,
  computedVisible,
  disableConfirm,
  hideDisabledOptions,
  curIndex,
  inputRefs,
  hideTrigger,
  watchValueChange,
  disabledTime,
  scrollbarProps,
} = useContext().inject();
// 国际化
const { t } = useI18n();
// 滚动的refs
const scrollContainer = ref<HTMLDivElement[]>([]);
// cells
const cells = ref<HTMLLIElement[][]>([[], [], []]);
// 处理点击
const handleClick = (val: number, i: number) => {
  curValue.value[i] = val;
  timeColumn.value.forEach((_, i1) => {
    curValue.value[i1] = isUndefined(curValue.value[i1])
      ? 0
      : curValue.value[i1];
  });
  // 滚动的container
  const container = scrollContainer.value[i];
  // 点击的cell
  const cell = cells.value[i][val];
  // 如果触发滚动
  if (container && cell) {
    new BTween({
      from: { scroll: container.scrollTop },
      to: { scroll: cell.offsetTop },
      duration: 300,
      easing: 'quadOut',
      onUpdate: (current: { scroll: number }) => {
        container.scrollTop = current.scroll;
      },
    }).start();
  }
  // 如果禁用确定
  if (disableConfirm.value) {
    handleConfirm();
  }
};
// 处理跳转
const hanldeJump = async (newDate: Dayjs, oldDate?: Dayjs) => {
  await nextTick();
  const newTimeMap = {
    hour: newDate.hour(),
    minute: newDate.minute(),
    second: newDate.second(),
  };
  const oldTimeMap = {
    hour: oldDate?.hour(),
    minute: oldDate?.minute(),
    second: oldDate?.second(),
  };
  timeColumn.value.forEach((v, i) => {
    const time = newTimeMap[v];
    const oldTime = oldTimeMap ? oldTimeMap[timeColumn.value[i]] : -1;
    if (oldTime == time) return;
    handleClick(time, i);
  });
};
// 处理确定
const handleConfirm = () => {
  let date = dayjs();
  timeColumn.value.forEach((v, i) => {
    date = date.set(v as UnitType, curValue.value[i]);
  });
  const formatValue = date.format(format.value);
  if (!isArray(computedValue.value)) {
    computedValue.value = formatValue;
    computedVisible.value = false;
    return;
  }
  computedValue.value[curIndex.value] = formatValue;
  if (disableConfirm.value) {
    return;
  }
  if (curIndex.value || computedValue.value[curIndex.value + 1]) {
    const startTime = computedValue.value[0] as string;
    const endTime = computedValue.value[1] as string;
    const isInvalid = !isValidTimeRange(startTime, endTime, format.value);
    isInvalid && (computedValue.value = [endTime, startTime]);
    computedVisible.value = false;
    return;
  }
  curIndex.value++;
};
// 检测curIndex的改变处理值的切换逻辑
watch(
  () => [computedVisible.value, curIndex.value],
  async () => {
    const value = (
      isArray(computedValue.value)
        ? computedValue.value[curIndex.value]
        : computedValue.value
    ) as string;
    // 聚焦当前的input
    const curInput = inputRefs.value[curIndex.value];
    if (curInput && curInput != document.activeElement) {
      await nextTick();
      curInput?.focus();
    }
    // 处理滚动逻辑
    if (!value) return (curValue.value = []);
    if (!computedVisible.value || hideTrigger.value) return;
    hanldeJump(dayjs(value, format.value));
  },
  {
    immediate: true,
  }
);
// 检测computedValue的改变自动滚动
watch(
  () => computedValue.value,
  (newVal, oldVal) => {
    if (!newVal) return (curValue.value = []);
    if (!hideTrigger.value || !watchValueChange.value) return;
    hanldeJump(
      dayjs(newVal as string, format.value),
      dayjs(oldVal as string, format.value)
    );
  },
  {
    immediate: true,
  }
);
// 暴露的方法
defineExpose({
  jump: hanldeJump,
});
</script>

<style lang="less">
@import './style/time-picker-panel.less';
</style>
