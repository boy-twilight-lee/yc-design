<template>
  <yc-trigger
    v-if="!hideTrigger"
    v-model:popup-visible="computedVisible"
    :popup-offset="4"
    :popup-container="popupContainer"
    :disabled="disabled"
    :content-style="{
      background: 'transparent',
    }"
    position="bl"
    trigger="focus"
    animation-name="slide-dynamic-origin"
    prevent-focus
    v-bind="triggerProps"
  >
    <div
      :class="[
        'yc-cascader',
        {
          'yc-cascader-allow-clear': showClearBtn,
          'yc-cascader-allow-search': allowSearch,
          'yc-cascader-loading': loading,
        },
        $attrs.class,
      ]"
      :style="<StyleValue>$attrs.style"
    >
      <!-- multiple -->
      <yc-input-tag
        v-if="multiple"
        v-model:input-value="computedInputValue"
        :model-value="selectOptions"
        :placeholder="placeholder"
        :readonly="isReadonly"
        :disabled="disabled"
        :size="size"
        :error="error"
        :max-tag-count="maxTagCount"
        :tag-nowrap="tagNowrap"
        ref="inputRef"
        @focus="handleEvent('focus')"
        @blur="handleEvent('blur')"
        @input="(v) => handleEvent('search', v)"
        @update:model-value="(v) => handleEvent('updateValue', v)"
      >
        <template v-if="$slots.label" #tag="scope">
          <slot name="label" v-bind="scope" />
        </template>
        <!-- prefix -->
        <template v-if="$slots.prefix" #prefix>
          <slot name="prefix" />
        </template>
        <!-- suffix -->
        <template #suffix>
          <cascader-icon
            :popup-visible="computedVisible"
            :allow-search="allowSearch"
            :loading="loading"
            :show-clear-btn="showClearBtn"
            @clear="handleEvent('clear')"
          />
        </template>
      </yc-input-tag>
      <!-- single -->
      <yc-input
        v-else
        v-model="computedInputValue"
        :show-input="computedVisible"
        :readonly="isReadonly"
        :disabled="disabled"
        :size="size"
        :error="error"
        :placeholder="selectOptions[0]?.label?.toString() || ''"
        ref="inputRef"
        @click="handleEvent('focus')"
        @blur="handleEvent('blur')"
        @input="(v) => handleEvent('search', v)"
      >
        <template #label>
          <slot name="label" :data="selectOptions[0]">
            <span
              :class="[
                {
                  'yc-input-placeholder': !selectOptions[0]?.label,
                },
              ]"
            >
              {{ selectOptions[0]?.label || placeholder }}
            </span>
          </slot>
        </template>
        <!-- prefix -->
        <template v-if="$slots.prefix" #prefix>
          <slot name="prefix" />
        </template>
        <!-- suffix -->
        <template #suffix>
          <cascader-icon
            :popup-visible="computedVisible"
            :allow-search="allowSearch"
            :loading="loading"
            :show-clear-btn="showClearBtn"
            @clear="handleEvent('clear')"
          />
        </template>
      </yc-input>
    </div>
    <template #content>
      <cascader-search-panel v-if="isSearchMode" />
      <cascader-panel v-else />
    </template>
  </yc-trigger>
  <cascader-panel v-else />
</template>

<script lang="ts" setup>
import { ref, computed, StyleValue, nextTick } from 'vue';
import { CascaderProps, CascaderEmits, CascaderOptionValue } from './type';
import { sleep } from '@shared/utils';
import useContext from './hooks/useContext';
import { default as YcInput, InputInstance } from '@/components/Input';
import {
  default as YcInputTag,
  InputTagValue,
  TagData,
} from '@/components/InputTag';
import YcTrigger from '@/components/Trigger';
import CascaderPanel from './CascaderPanel.vue';
import CascaderSearchPanel from './CascaderSearchPanel.vue';
import CascaderIcon from './CascaderIcon.vue';
defineOptions({
  name: 'Cascader',
});
const props = withDefaults(defineProps<CascaderProps>(), {
  pathMode: false,
  multiple: false,
  modelValue: undefined,
  defaultValue: (props) => {
    return props.multiple ? [] : '';
  },
  options: () => [],
  disabled: false,
  error: false,
  size: undefined,
  allowSearch: false,
  allowClear: false,
  inputValue: undefined,
  defaultInputValue: '',
  popupVisible: undefined,
  defaultPopupVisible: false,
  expandTrigger: 'click',
  placeholder: '',
  filterOption: (inputValue, option) => {
    const label = (option.label ?? '').toLowerCase();
    return label.includes(inputValue.toLowerCase());
  },
  popupContainer: undefined,
  maxTagCount: 0,
  formatLabel: undefined,
  triggerProps: () => {
    return {};
  },
  loadMore: undefined,
  loading: false,
  searchOptionOnlyLabel: false,
  searchDelay: 500,
  fieldNames: () => {
    return {};
  },
  valueKey: 'value',
  fallback: true,
  expandChild: false,
  tagNowrap: false,
  hideTrigger: false,
});
const emits = defineEmits<CascaderEmits>();
// 输入实例
const inputRef = ref<InputInstance>();
// 注入数据
const {
  computedValue,
  computedInputValue,
  computedVisible,
  selectOptions,
  searchDelay,
  multiple,
  pathMode,
  disabled,
  allowClear,
  allowSearch,
  loading,
  curLevel,
  curPath,
  getValueKey,
  getOption,
} = useContext().provide(props, emits, inputRef);
// 是否展示清除按钮
const showClearBtn = computed(() => {
  let hasValue;
  if (pathMode.value) {
    hasValue = multiple.value
      ? (computedValue.value as CascaderOptionValue[][]).flat(1).length
      : (computedValue.value as CascaderOptionValue[]).length;
  } else {
    hasValue = multiple.value
      ? (computedValue.value as CascaderOptionValue[]).length
      : computedValue.value;
  }
  return allowClear.value && !disabled.value && !loading.value && !!hasValue;
});
// 是否只读
const isReadonly = computed(() => {
  return !allowSearch.value || loading.value;
});
// 是否搜索模式
const isSearchMode = computed(() => {
  return allowSearch.value && computedInputValue.value;
});
// 处理事件
const handleEvent = async (
  type: string,
  value: string | InputTagValue = ''
) => {
  switch (type) {
    case 'clear':
      {
        computedValue.value = multiple.value || pathMode.value ? [] : '';
        emits('clear');
      }
      break;
    case 'search':
      {
        await sleep(searchDelay.value);
        emits('search', value as string);
      }
      break;
    case 'focus':
      {
        if (disabled.value) {
          return;
        }
        if (computedVisible.value) {
          return inputRef.value?.blur();
        }
        // 计算回显的面板
        const value = getValueKey(
          multiple.value
            ? (computedValue.value as CascaderOptionValue[])[0]
            : computedValue.value
        );
        const option = value ? getOption(value) : null;
        if (option) {
          curPath.value = option.nodePath!.map((item) => item.index!);
          curLevel.value = option.level!;
        } else {
          curPath.value = [];
          curLevel.value = 1;
        }
        computedVisible.value = true;
        await nextTick();
        inputRef.value?.focus();
      }
      break;
    case 'blur':
      {
        computedVisible.value = false;
      }
      break;
    case 'updateValue':
      {
        computedValue.value = (value as InputTagValue).map(
          (item) => (item as TagData).value
        );
      }
      break;
  }
};
</script>

<style lang="less">
@import './style/cascader.less';
</style>
