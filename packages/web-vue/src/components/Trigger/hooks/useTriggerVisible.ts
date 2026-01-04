import { nextTick, Ref, ref, toRefs, computed, watch, watchEffect } from 'vue';
import { TriggerEmits, TriggerType } from '../type';
import { RecordType } from '@shared/type';
import { default as useContext, TriggerProps } from './useContext';
import {
  unrefElement,
  useEventListener,
  onClickOutside,
  useControlValue,
  findFirstScrollableParent,
  isString,
} from '@shared/utils';

export default (params: {
  props: RecordType;
  emits: TriggerEmits;
  popupRef: Ref<HTMLDivElement | undefined>;
  triggerRef: Ref<HTMLElement | undefined>;
}) => {
  const { props, emits, popupRef, triggerRef } = params;
  // 解构属性
  const {
    trigger,
    popupVisible,
    defaultPopupVisible,
    clickToClose,
    blurToClose,
    clickOutsideToClose,
    mouseEnterDelay,
    mouseLeaveDelay,
    focusDelay,
    disabled,
    scrollToCloseDistance,
    scrollToClose,
    autoSetPosition,
    alignPoint,
  } = toRefs(props as TriggerProps);
  // 处理事件
  const {
    onTriggerMouseclick,
    onTriggerMouseenter,
    onTriggerMouseleave,
    onTriggerBlur,
    onTriggerFocus,
    onClickOutSide: clickOutSide,
  } = props;
  // visible
  const computedVisible = useControlValue<boolean>(
    popupVisible,
    defaultPopupVisible.value,
    (val) => {
      emits('update:popupVisible', val);
      emits('popup-visible-change', val);
    }
  );
  // 处理嵌套
  const { timeout, mosueLeaveHandler, mouseEnterHandler, clickOutsideHandler } =
    useContext({
      trigger: trigger.value,
      mouseEnterDelay,
      computedVisible,
      popupRef,
    });
  // 记录鼠标操作的位置
  const mouseX = ref<number>(0);
  const mouseY = ref<number>(0);
  // 记录滚动位置
  let oldScrollLeft = 0;
  let oldScrollTop = 0;
  // 滚动容器
  const scrollContainer = computed(() => {
    return triggerRef.value
      ? findFirstScrollableParent(unrefElement(triggerRef.value))
      : null;
  });
  // 是否是合法的trigger
  const isValidTrigger = (value: TriggerType) => {
    const triggerArray = isString(trigger.value)
      ? [trigger.value]
      : trigger.value;
    return triggerArray.includes(value);
  };
  // 点击
  const handleClickEvent = (e: MouseEvent, type: TriggerType) => {
    if (!isValidTrigger(type) || disabled.value) {
      return;
    }
    if (timeout.value) {
      clearTimeout(timeout.value);
    }
    if (!autoSetPosition.value && alignPoint.value) {
      const { pageX, pageY } = e;
      mouseX.value = pageX;
      mouseY.value = pageY;
    }
    computedVisible.value = clickToClose.value ? !computedVisible.value : true;
    // 触发click事件
    onTriggerMouseclick?.();
  };
  // 鼠标进入
  const handleMouseenter = () => {
    if (!isValidTrigger('hover') || disabled.value) {
      return;
    }
    mouseEnterHandler();
    if (timeout.value) {
      clearTimeout(timeout.value);
    }
    if (computedVisible.value) {
      return;
    }
    timeout.value = setTimeout(() => {
      computedVisible.value = true;
      // 触发enter事件
      onTriggerMouseenter?.();
    }, mouseEnterDelay.value);
  };
  // 鼠标离开
  const handleMouseleave = (e: MouseEvent) => {
    if (!isValidTrigger('hover') || disabled.value) {
      return;
    }
    if (timeout.value) {
      clearTimeout(timeout.value);
    }
    if (!computedVisible.value) {
      return;
    }
    timeout.value = setTimeout(() => {
      // 处理leave事件
      onTriggerMouseleave?.();
      // 是否处理过嵌套情况
      const isHandle = mosueLeaveHandler(e);
      // 未处理进入处理流程
      if (isHandle) {
        return;
      }
      // 处理不嵌套情况
      computedVisible.value = false;
    }, mouseLeaveDelay.value);
  };
  // 聚焦
  const handleFocus = () => {
    if (!isValidTrigger('focus') || disabled.value) {
      return;
    }
    if (timeout.value) {
      clearTimeout(timeout.value);
    }
    if (computedVisible.value) {
      return;
    }
    timeout.value = setTimeout(() => {
      computedVisible.value = true;
      // 触发foucs事件
      onTriggerFocus?.();
    }, focusDelay.value);
  };
  // 失焦
  const handleBlur = () => {
    if (!isValidTrigger('focus') || !blurToClose.value || disabled.value) {
      return;
    }
    if (timeout.value) {
      clearTimeout(timeout.value);
    }
    if (!computedVisible.value) {
      return;
    }
    computedVisible.value = false;
    onTriggerBlur?.();
  };
  // 初始化事件监听器
  watchEffect(() => {
    const lisenters: Array<() => void> = [];
    if (
      disabled.value ||
      !clickOutsideToClose.value ||
      (!isValidTrigger('click') && !isValidTrigger('contextMenu'))
    ) {
      lisenters[0]?.();
    } else {
      // 点击到contentRef外层关闭
      const { stop } = onClickOutside(
        popupRef,
        (e) => {
          // 是否处理过嵌套情况
          const isHandle = clickOutsideHandler(e);
          // 处理正常逻辑
          if (!computedVisible.value || isHandle) {
            return;
          }
          computedVisible.value = false;
          clickOutSide?.();
        },
        {
          ignore: [triggerRef],
        }
      );
      lisenters[0] = stop;
    }
    if (
      !computedVisible.value ||
      !scrollToClose.value ||
      !scrollContainer.value
    ) {
      lisenters[1]?.();
    } else {
      // 处理scroll
      lisenters[1] = useEventListener(scrollContainer, 'scroll', () => {
        const { scrollTop, scrollLeft } = scrollContainer.value!;
        if (
          Math.abs(scrollTop - oldScrollTop) >= scrollToCloseDistance.value ||
          Math.abs(scrollLeft - oldScrollLeft) >= scrollToCloseDistance.value
        ) {
          computedVisible.value = false;
          oldScrollTop = scrollTop;
          oldScrollLeft = scrollLeft;
        }
      });
    }
  });
  // 检测visible确定第一次的left top
  watch(
    () => computedVisible.value,
    async () => {
      await nextTick();
      if (!scrollContainer.value) return;
      const { scrollTop, scrollLeft } = scrollContainer.value;
      oldScrollLeft = scrollLeft;
      oldScrollTop = scrollTop;
    }
  );
  return {
    mouseX,
    mouseY,
    computedVisible,
    handleClickEvent,
    handleMouseenter,
    handleMouseleave,
    handleFocus,
    handleBlur,
  };
};
