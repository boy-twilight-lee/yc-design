<template>
  <yc-input
    :size="size"
    :disabled="disabled"
    v-bind="$attrs"
    class="yc-input-search"
    ref="inputRef"
  >
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append || searchButton" #append>
      <slot name="append">
        <yc-button
          type="primary"
          :size="size"
          :disabled="disabled"
          :loading="loading"
          v-bind="buttonProps"
          @click="handleSearch"
        >
          <template v-if="buttonText" #default>
            {{ buttonText }}
          </template>
          <template v-else #icon>
            <icon-search />
          </template>
        </yc-button>
      </slot>
    </template>
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>
    <template v-if="!searchButton" #extra>
      <yc-spin v-if="loading" is-size-inherit style="color: inherit" />
      <icon-button :disabled="disabled" v-else @click="handleSearch">
        <icon-search />
      </icon-button>
    </template>
  </yc-input>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue';
import { InputSearchProps, InputSearchEmits, InputExpose } from './type';
import { IconSearch } from '@shared/icons';
import { IconButton } from '@shared/components';
import YcInput from './Input.vue';
import YcButton from '@/components/Button';
import YcSpin from '@/components/Spin';
defineOptions({
  name: 'InputSearch',
});
withDefaults(defineProps<InputSearchProps>(), {
  searchButton: false,
  loading: false,
  disabled: false,
  size: undefined,
  buttonText: undefined,
  buttonProps: () => ({}),
});
const emits = defineEmits<InputSearchEmits>();
// inputRef
const inputRef = ref<InstanceType<typeof YcInput>>();
// 处理搜索
const handleSearch = async (e: MouseEvent) => {
  emits('search', inputRef.value!.getInputRef().value, e);
  await nextTick();
  inputRef.value?.focus();
};
defineExpose<InputExpose>({
  focus() {
    inputRef.value?.focus();
  },
  blur() {
    inputRef.value?.blur();
  },
  getInputRef() {
    return inputRef.value!.getInputRef();
  },
});
</script>
