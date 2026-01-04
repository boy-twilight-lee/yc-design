import { ref, Ref, watchEffect } from 'vue';
import { SelectEmits, SelectOptionData, SelectValue } from '../type';
import { RecordType } from '@shared/type';
import { onKeyStroke } from '@shared/utils';

export default (params: {
  hotkeys: Ref<boolean>;
  multiple: Ref<boolean>;
  limit: Ref<number>;
  computedVisible: Ref<boolean>;
  computedValue: Ref<SelectValue>;
  options: Ref<SelectOptionData[]>;
  blur: () => void;
  emits: SelectEmits;
}) => {
  const {
    computedValue,
    computedVisible,
    options,
    hotkeys,
    multiple,
    limit,
    blur,
    emits,
  } = params;
  const curIndex = ref<number>(-1);
  watchEffect(() => {
    const lisenters: Array<() => void> = [];
    if (!computedVisible.value || !options.value.length || !hotkeys.value) {
      return lisenters[0]?.();
    }
    lisenters[0] = onKeyStroke(['ArrowUp', 'ArrowDown', 'Enter'], (e) => {
      const { key } = e;
      e.preventDefault();
      if (key == 'ArrowUp') {
        curIndex.value--;
        curIndex.value =
          curIndex.value < 0 ? options.value.length - 1 : curIndex.value;
      } else if (key == 'ArrowDown') {
        curIndex.value++;
        curIndex.value =
          curIndex.value >= options.value.length ? 0 : curIndex.value;
      } else {
        const option = options.value[curIndex.value];
        if (option.disabled) return;
        const value = option.value!;
        if (multiple.value) {
          const curValue = computedValue.value as RecordType[];
          const index = curValue.findIndex((item) => item == value);
          if (index == -1) {
            if (limit.value > 0 && curValue.length == limit.value) {
              return emits('exceedLimit', value);
            }
            computedValue.value = [...curValue, value];
          } else {
            computedValue.value = curValue.filter((item) => item != value);
          }
        } else {
          computedValue.value = value as string;
          blur();
        }
        emits('select', value);
      }
    });
  });
  return {
    curIndex,
  };
};
