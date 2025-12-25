<template>
  <yc-input
    v-bind="$attrs"
    :input-attrs="{
      type: computedVisibility ? 'text' : 'password',
    }"
    ref="inputRef"
  >
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>
    <template #extra>
      <icon-button v-if="invisibleButton" :size="14" @click="handleClick">
        <icon-eye-open v-if="computedVisibility" />
        <icon-eye-close v-else />
      </icon-button>
    </template>
  </yc-input>
</template>

<script lang="ts" setup>
import { nextTick, ref, toRefs } from 'vue';
import { InputPasswordProps, InputPasswordEmits, InputExpose } from './type';
import { useControlValue } from '@shared/utils';
import { IconEyeOpen, IconEyeClose } from '@shared/icons';
import { IconButton } from '@shared/components';
import YcInput from './Input.vue';
defineOptions({
  name: 'InputPassword',
});
const props = withDefaults(defineProps<InputPasswordProps>(), {
  visibility: undefined,
  defaultVisibility: false,
  invisibleButton: true,
});
const emits = defineEmits<InputPasswordEmits>();
const { visibility, defaultVisibility } = toRefs(props);
// 非受控的vis
const computedVisibility = useControlValue<boolean>(
  visibility,
  defaultVisibility.value,
  (val) => {
    emits('update:visibility', val);
    emits('visibility-change', val);
  }
);
// inputRef
const inputRef = ref<InstanceType<typeof YcInput>>();
// 处理点击
const handleClick = async () => {
  inputRef.value?.recordCursor?.();
  await nextTick();
  computedVisibility.value = !computedVisibility.value;
  inputRef.value?.setCursor?.();
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
