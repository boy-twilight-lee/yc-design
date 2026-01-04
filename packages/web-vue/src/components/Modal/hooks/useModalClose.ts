import { nextTick, ref, Ref, watch, watchEffect } from 'vue';
import { OnBeforeOk, OnBeforeCancel } from '../type';
import { ModalEmits } from '@/components/Modal/type';
import { onKeyStroke, useControlValue } from '@shared/utils';
import useOnBeforeClose from './useOnBeforeClose';

export type CloseEventType =
  | 'confirmBtn'
  | 'cancelBtn'
  | 'closeBtn'
  | 'mask'
  | 'esc';

export default (params: {
  visible: Ref<boolean | undefined>;
  defaultVisible: Ref<boolean>;
  maskClosable: Ref<boolean>;
  escToClose: Ref<boolean>;
  onBeforeOk: OnBeforeOk;
  onBeforeCancel: OnBeforeCancel;
  emits: ModalEmits;
  onClose?: (ev: MouseEvent | KeyboardEvent) => void;
}) => {
  const {
    maskClosable,
    escToClose,
    visible,
    defaultVisible,
    onBeforeCancel,
    onBeforeOk,
    emits,
    onClose,
  } = params;
  // 内存visible，用于显示组件
  const computedVisible = useControlValue<boolean>(
    visible,
    defaultVisible.value,
    (val) => {
      emits('update:visible', val);
    }
  );
  // 外层visible，用于播放动画
  const outerVisible = ref<boolean>(false);
  // false
  const innerVisible = ref<boolean>(false);
  // loading
  const asyncLoading = ref<boolean>(false);
  // 处理动画离开
  const handleAfterLeave = () => {
    emits('close');
    outerVisible.value = false;
  };
  // 处理关闭
  const handleClose = async (
    type: CloseEventType,
    ev: MouseEvent | KeyboardEvent
  ) => {
    // 执行关闭之前的函数
    const isClose = ['confirmBtn', 'cancelBtn'].includes(type)
      ? await useOnBeforeClose(type, asyncLoading, onBeforeOk, onBeforeCancel)
      : true;
    if (!isClose) {
      return;
    }
    if (type == 'mask' && !maskClosable.value) {
      return;
    }
    if (type == 'confirmBtn') {
      emits('ok');
    }
    onClose?.(ev);
    computedVisible.value = false;
  };
  // 注册事件监听器
  watchEffect(async () => {
    const lisenters: Array<() => void> = [];
    if (computedVisible.value) {
      outerVisible.value = true;
      await nextTick();
      innerVisible.value = true;
    } else {
      innerVisible.value = false;
    }
    if (!computedVisible.value || !escToClose.value) {
      return lisenters[0]?.();
    }
    lisenters[0] = onKeyStroke(['Escape'], (ev) => {
      handleClose('esc', ev);
    });
  });
  return {
    asyncLoading,
    computedVisible,
    outerVisible,
    innerVisible,
    handleClose,
    handleAfterLeave,
  };
};
