<template>
  <yc-trigger
    v-model:popup-visible="computedVisible"
    :unmount-on-close="unmountonClose"
    :popup-container="popupContainer"
    :disabled="disabled"
    :popup-offset="4"
    trigger="focus"
    position="bl"
    animation-name="slide-dynamic-origin"
    need-transform-origin
    auto-fit-popup-width
    prevent-focus
    ref="popupRef"
    v-bind="triggerProps"
  >
    <div
      :class="[
        'yc-select',
        {
          'yc-select-allow-search': allowSearch,
          'yc-select-allow-clear': showClearBtn,
          'yc-select-no-border': !bordered,
          'yc-select-loading': loading,
        },
        $attrs.class,
      ]"
      :style="<StyleValue>$attrs.style"
    >
      <slot name="trigger">
        <!-- single  -->
        <yc-input
          v-if="!multiple"
          v-model="computedInputValue"
          :show-input="computedVisible"
          :readonly="isReadonly"
          :disabled="disabled"
          :size="size"
          :error="error"
          :placeholder="(selectOptions[0]?.label as string) || ''"
          ref="inputRef"
          @click="handleEvent('focus')"
          @blur="handleEvent('blur')"
          @input="(v) => handleEvent('search', v)"
          @press-enter="handleEvent('create')"
        >
          <template #label>
            <slot name="label" :data="selectOptions[0]">
              <span
                :class="[
                  {
                    'yc-input-placeholder': !selectOptions.length,
                  },
                ]"
              >
                {{ selectOptions[0]?.label || placeholder }}
              </span>
            </slot>
          </template>
          <!-- suffix -->
          <template #suffix>
            <select-icon
              :popup-visible="computedVisible"
              :allow-search="allowSearch"
              :loading="loading"
              :show-clear-btn="showClearBtn"
              @clear="handleEvent('clear')"
            />
          </template>
        </yc-input>
        <!-- multiple -->
        <yc-input-tag
          v-else
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
          @remove="(v, ev) => $emit('remove', v, ev)"
          @press-enter="handleEvent('create')"
          @update:model-value="(v) => handleEvent('updateValue', v)"
        >
          <template #tag="{ tag }">
            <slot v-if="$slots.label" name="label" :data="tag" />
          </template>
          <!-- suffix -->
          <template #suffix>
            <select-icon
              :popup-visible="computedVisible"
              :allow-search="allowSearch"
              :loading="loading"
              :show-clear-btn="showClearBtn"
              @clear="handleEvent('clear')"
            />
          </template>
        </yc-input-tag>
      </slot>
    </div>
    <!-- dropdown -->
    <template #content>
      <select-view
        :loading="loading"
        :virtual-list-props="virtualListProps"
        :show-footer-on-empty="showFooterOnEmpty"
        :show-header-on-empty="showHeaderOnEmpty"
      />
    </template>
  </yc-trigger>
</template>

<script lang="ts" setup>
import { ref, computed, toRefs, StyleValue, nextTick } from 'vue';
import {
  SelectProps,
  SelectEmits,
  SelectSlots,
  SelectExpose,
  SelectOptionValue,
  SelectOptionData,
} from './type';
import { sleep } from '@shared/utils';
import useContext from './hooks/useContext';
import SelectIcon from './SelectIcon.vue';
import SelectView from './SelectView.vue';
import { default as YcInput, InputInstance } from '@/components/Input';
import {
  default as YcInputTag,
  InputTagValue,
  TagData,
} from '@/components/InputTag';
import { default as YcTrigger, TriggerInstance } from '@/components/Trigger';
defineOptions({
  name: 'Select',
});
const $slots = defineSlots<SelectSlots>();
const props = withDefaults(defineProps<SelectProps>(), {
  multiple: false,
  modelValue: undefined,
  defaultValue: (props) => {
    return props.multiple ? [] : '';
  },
  inputValue: undefined,
  defaultInputValue: '',
  size: undefined,
  placeholder: '',
  loading: false,
  disabled: false,
  error: false,
  allowClear: false,
  allowSearch: (props) => {
    return props.multiple as boolean;
  },
  allowCreate: false,
  maxTagCount: 0,
  popupContainer: undefined,
  bordered: true,
  popupVisible: undefined,
  defaultPopupVisible: false,
  unmountOnClose: false,
  filterOption: (inputValue: string, option: SelectOptionData) => {
    return option.label
      ?.toLowerCase()
      ?.includes(inputValue.toLowerCase()) as boolean;
  },
  options: () => [],
  showExtraOptions: true,
  valueKey: '',
  triggerProps: () => {
    return {
      contentStyle: {},
    };
  },
  limit: 0,
  fieldNames: () => {
    return {};
  },
  searchDelay: 500,
  showHeaderOnEmpty: false,
  showFooterOnEmpty: false,
  tagNowrap: false,
  hotKeys: false,
  virtualListProps: undefined,
  showEmpty: true,
});
const emits = defineEmits<SelectEmits>();
const {
  allowClear,
  disabled,
  loading,
  searchDelay,
  showFooterOnEmpty,
  showHeaderOnEmpty,
  multiple,
  allowSearch,
  allowCreate,
  virtualListProps,
} = toRefs(props);
// 输入实例
const inputRef = ref<InputInstance>();
// triggerRef
const popupRef = ref<TriggerInstance>();
// 注入值
const {
  computedVisible,
  computedValue,
  computedInputValue,
  selectOptions,
  createOptions,
} = useContext().provide(props, emits, inputRef);
// 是否展示清除按钮
const showClearBtn = computed(() => {
  const hasValue = multiple.value
    ? (computedValue.value as SelectOptionValue[]).length
    : String(computedValue.value).length;
  return allowClear.value && !disabled.value && !loading.value && !!hasValue;
});
// 是否只读
const isReadonly = computed(() => {
  return !allowSearch.value || loading.value || !allowCreate.value;
});
// 处理事件
const handleEvent = async (
  type: string,
  value: string | InputTagValue = ''
) => {
  switch (type) {
    case 'create':
      {
        if (!allowCreate.value) return;
        const target = createOptions.value.find(
          (item) => item == computedInputValue.value
        );
        if (target) return;
        createOptions.value.push({
          label: computedInputValue.value,
          value: computedInputValue.value,
        });
        if (allowSearch.value) {
          inputRef.value?.blur();
        }
      }
      break;
    case 'clear':
      {
        computedValue.value = multiple.value ? [] : '';
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
        if (disabled.value) return;
        if (computedVisible.value) {
          return inputRef.value?.blur();
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
defineExpose<SelectExpose>({
  focus() {
    inputRef.value?.focus();
  },
  blur() {
    inputRef.value?.blur();
  },
  getPopupRef() {
    return popupRef.value as TriggerInstance;
  },
});
</script>

<style lang="less">
@import './style/select.less';
</style>
