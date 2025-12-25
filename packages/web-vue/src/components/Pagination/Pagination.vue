<template>
  <div
    v-if="!hideOnSinglePage || (hideOnSinglePage && pages <= 1)"
    :class="['yc-pagination', `yc-pagination-size-${size}`]"
  >
    <!-- total -->
    <span v-if="showTotal" class="yc-pagination-total">
      <slot name="total" :total="total">
        {{ t('pagination.total', [total]) }}
      </slot>
    </span>
    <!-- page-list -->
    <ul :class="[simple ? 'yc-pagination-simple' : 'yc-pagination-list']">
      <!-- pre -->
      <pagination-item type="pre" class="yc-pagination-item-previous">
        <slot
          v-if="$slots['page-item-step']"
          name="page-item-step"
          type="previous"
        />
      </pagination-item>
      <!-- item -->
      <template v-if="!simple">
        <pagination-item
          v-for="i in pagesArray"
          :type="isNumber(i) ? 'item' : i"
          :key="<string>i"
          :page="isNumber(i) ? i : -1"
        >
          <slot v-if="isNumber(i)" name="page-item" :page="i">
            {{ i }}
          </slot>
          <slot
            v-else-if="$slots['page-item-ellipsis']"
            name="page-item-ellipsis"
          />
        </pagination-item>
      </template>
      <span v-else class="yc-pagination-jumper yc-pagination-jumper-simple">
        <yc-input-number
          v-model="computedCurrent"
          hide-button
          :size="size"
          :disabled="disabled"
          :min="1"
          :max="pages"
        />
        <span class="yc-pagination-jumper-separator">/</span>
        <span class="yc-pagination-jumper-total-page">{{ pages }}</span>
      </span>
      <!-- more -->
      <pagination-item
        v-if="showMore && !simple"
        type="more-right"
        class="'yc-pagination-item-ellipsis'"
      >
      </pagination-item>
      <!-- next -->
      <pagination-item type="next" class="yc-pagination-item-next">
        <slot
          v-if="$slots['page-item-step']"
          name="page-item-step"
          type="next"
        />
      </pagination-item>
    </ul>
    <!-- pageSize -->
    <span v-if="showPageSize" class="yc-pagination-options">
      <yc-select
        v-model="computedPageSize"
        :options="sizeOptions"
        :size="size"
        v-bind="pageSizeProps"
        :format-label="
          (option) => `${option.value}${t('pagination.countPerPage')}`
        "
        :disabled="disabled"
      />
    </span>
    <!-- jumper -->
    <span v-if="showJumper" class="yc-pagination-jumper">
      <span class="yc-pagination-jumper-text-goto">
        {{ t('pagination.goto') }}
      </span>
      <yc-input-number
        v-model="tempCurrent"
        :size="size"
        :disabled="disabled"
        :min="1"
        :max="pages"
        hide-button
        @focus="tempCurrent = computedCurrent"
        @blur="handleBlur"
      />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue';
import { PaginationProps, PaginationEmits, PaginationSlots } from './type';
import { isNumber, useI18n } from '@shared/utils';
import useContext from './hooks/useContext';
import PaginationItem from './PaginationItem.vue';
import YcSelect from '@/components/Select';
import YcInputNumber from '@/components/InputNumber';
defineOptions({
  name: 'Pagination',
});
const $slots = defineSlots<PaginationSlots>();
const props = withDefaults(defineProps<PaginationProps>(), {
  current: undefined,
  defaultCurrent: 1,
  pageSize: undefined,
  defaultPageSize: 10,
  disabled: false,
  hideOnSinglePage: false,
  simple: false,
  showTotal: false,
  showJumper: false,
  showMore: false,
  showPageSize: false,
  pageSizeOptions: () => [10, 20, 30, 40, 50],
  pageSizeProps: () => {
    return {};
  },
  size: undefined,
  pageItemStyle: () => {
    return {};
  },
  activePageItemStyle: () => {
    return {};
  },
  baseSize: 6,
  bufferSize: 2,
  autoAdjust: true,
});
const emits = defineEmits<PaginationEmits>();
const {
  computedCurrent,
  pages,
  pagesArray,
  computedPageSize,
  size,
  total,
  sizeOptions,
} = useContext().provide(props, emits);
// 国际化
const { t } = useI18n();
// 设置失焦的时候设置value
const tempCurrent = ref(computedCurrent.value);
watch(
  () => computedCurrent.value,
  () => {
    if (tempCurrent.value == computedCurrent.value) return;
    tempCurrent.value = computedCurrent.value;
  }
);
// 处理失焦
const handleBlur = async (e: Event) => {
  if (`${tempCurrent.value}`.length) {
    computedCurrent.value = tempCurrent.value;
  }
  await nextTick();
  const target = e.target as HTMLInputElement;
  if (+target.value != computedCurrent.value) {
    target.value = String(computedCurrent.value);
  }
};
</script>

<style lang="less">
@import './style/pagination.less';
</style>
