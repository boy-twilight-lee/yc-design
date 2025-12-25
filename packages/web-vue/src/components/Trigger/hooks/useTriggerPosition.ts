import {
  watch,
  computed,
  CSSProperties,
  Ref,
  ref,
  toRefs,
  nextTick,
} from 'vue';
import { TriggerProps } from './useContext';
import { RecordType, PopupPosition } from '@shared/type';
import {
  unrefElement,
  useElementBounding,
  useElementSize,
  valueToPx,
  isArray,
  isString,
} from '@shared/utils';
import { TriggerType } from '../type';

export default (params: {
  props: RecordType;
  popupRef: Ref<HTMLDivElement | undefined>;
  triggerRef: Ref<HTMLElement | undefined>;
  arrowRef: Ref<HTMLElement | undefined>;
  computedVisible: Ref<boolean>;
  mouseX: Ref<number>;
  mouseY: Ref<number>;
}) => {
  const {
    props,
    computedVisible,
    popupRef,
    triggerRef,
    arrowRef,
    mouseX,
    mouseY,
  } = params;
  // 解构需要使用的属性
  const {
    trigger,
    alignPoint,
    popupTranslate,
    popupOffset,
    autoFitPosition,
    autoFitPopupMinWidth,
    autoFitPopupWidth,
    autoSetPosition,
    updateAtScroll,
    position: _position,
    arrowStyle: _arrowStyle,
    contentStyle: _contentStyle,
  } = toRefs(props as TriggerProps);
  // 动态计算当前的位置
  const position = ref<PopupPosition>(_position.value);
  // 获取popup的size
  const { width: popupWidth, height: popupHeight } = useElementSize(
    popupRef,
    undefined,
    {
      box: 'border-box',
    }
  );
  // 获取arrow的size
  const { width: arrowWidth, height: arrowHeight } = useElementSize(
    arrowRef,
    undefined,
    {
      box: 'border-box',
    }
  );
  // 获取trigger元素bounding
  const {
    left,
    top,
    bottom,
    right,
    width: triggerWidth,
    height: triggerHeight,
  } = useElementBounding(triggerRef, {
    windowScroll: updateAtScroll.value as boolean,
    updateTiming: 'next-frame',
  });
  // 是否是合法的trigger
  const isValidTrigger = (value: TriggerType) => {
    const triggerArray = isString(trigger.value)
      ? [trigger.value]
      : trigger.value;
    return triggerArray.includes(value);
  };
  // 计算trigge的位置
  const popupStyle = computed(() => {
    // 计算偏移量
    const [offsetX, offsetY] = calcPopupOffset();
    // 是否是自由设置位置，或者跟随鼠标位置
    const isMousePosition =
      alignPoint.value &&
      !isValidTrigger('click') &&
      !isValidTrigger('contextMenu');
    // 如果跟随鼠标点击位置
    if (autoSetPosition.value || isMousePosition) {
      return {
        top: valueToPx(mouseY.value + offsetY),
        left: valueToPx(
          mouseX.value -
            (autoFitPosition.value ? 0 : popupWidth.value / 2) +
            offsetX
        ),
      };
    }
    // 计算初始位置
    const [offsetLeft, offsetTop] = calcPopupPosition({
      position: position.value,
      triggerWidth: triggerWidth.value,
      triggerHeight: triggerHeight.value,
      popupHeight: popupHeight.value,
      popupWidth: popupWidth.value,
      top: top.value,
      left: left.value,
      right: right.value,
      bottom: bottom.value,
    });
    // 如果不进行边界检测
    if (!autoFitPosition.value) {
      return {
        top: valueToPx(offsetTop + offsetY),
        left: valueToPx(offsetLeft + offsetX),
      };
    }
    // 边界检测
    const [newLeft, newTop] = calcCurPopupPosition({
      offsetLeft,
      offsetTop,
      position: position.value,
      top: top.value,
      left: left.value,
      right: right.value,
      bottom: bottom.value,
      popupHeight: popupHeight.value,
      popupWidth: popupWidth.value,
    });
    // 计算trigger当前的位置
    position.value = calcPositionRef({
      offsetLeft: newLeft,
      offsetTop: newTop,
      top: top.value,
      left: left.value,
      right: right.value,
      bottom: bottom.value,
      triggerWidth: triggerWidth.value,
      triggerHeight: triggerHeight.value,
      popupHeight: popupHeight.value,
      popupWidth: popupWidth.value,
    }) as PopupPosition;
    // 计算新的offset
    const [newOffsetX, newOffsetY] = calcPopupOffset();
    // 返回最终结果
    return {
      left: valueToPx(newLeft + newOffsetX),
      top: valueToPx(newTop + newOffsetY),
    };
  });
  // contentStyle
  const contentStyle = computed(() => {
    return {
      width: autoFitPopupWidth.value ? valueToPx(triggerWidth.value) : '',
      minWidth: autoFitPopupMinWidth.value ? valueToPx(triggerWidth.value) : '',
      ..._contentStyle.value,
    } as CSSProperties;
  });
  // arrowStyle
  const arrowStyle = computed(() => {
    return {
      ..._arrowStyle.value,
      ...calcArrowPosition({
        position: position.value,
        popupWidth: popupWidth.value,
        popupHeight: popupHeight.value,
        arrowWidth: arrowWidth.value,
        arrowHeight: arrowHeight.value,
        triggerHeight: triggerHeight.value,
        triggerWidth: triggerWidth.value,
      }),
    } as CSSProperties;
  });
  // 计算offset
  const calcPopupOffset = () => {
    let offsetX: number = 0;
    let offsetY: number = 0;
    if (isArray(popupTranslate.value)) {
      offsetX = popupTranslate.value?.[0] || 0;
      offsetY = popupTranslate.value?.[1] || 0;
    } else {
      offsetX = popupTranslate.value[position.value]?.[0] || 0;
      offsetY = popupTranslate.value[position.value]?.[1] || 0;
    }
    if (position.value.startsWith('t')) {
      offsetY += -popupOffset.value;
    } else if (position.value.startsWith('b')) {
      offsetY += popupOffset.value;
    } else if (position.value.startsWith('l')) {
      offsetX += -popupOffset.value;
    } else if (position.value.startsWith('r')) {
      offsetX += popupOffset.value;
    }
    return [offsetX, offsetY];
  };
  // 计算最初的pop位置
  const calcPopupPosition = (params: {
    position: PopupPosition;
    top: number;
    bottom: number;
    left: number;
    right: number;
    triggerWidth: number;
    triggerHeight: number;
    popupHeight: number;
    popupWidth: number;
  }) => {
    let offsetTop = 0;
    let offsetLeft = 0;
    const {
      position,
      triggerWidth,
      triggerHeight,
      popupWidth,
      popupHeight,
      left,
      top,
      right,
      bottom,
    } = params;
    // 初始位置计算
    if (['top', 'tl', 'tr', 'bottom', 'bl', 'br'].includes(position)) {
      offsetTop = position.startsWith('t') ? top - popupHeight : bottom;
      if (['top', 'bottom'].includes(position)) {
        offsetLeft = left + (triggerWidth - popupWidth) / 2;
      } else if (['tl', 'bl'].includes(position)) {
        offsetLeft = left;
      } else {
        offsetLeft = right - popupWidth;
      }
    } else {
      offsetLeft = position.startsWith('l') ? left - popupWidth : right;
      if (['left', 'right'].includes(position)) {
        offsetTop = top + (triggerHeight - popupHeight) / 2;
      } else if (['lt', 'rt'].includes(position)) {
        offsetTop = top;
      } else {
        offsetTop = bottom - popupHeight;
      }
    }
    return [offsetLeft, offsetTop];
  };
  // 计算边界
  const calcCurPopupPosition = (params: {
    position: PopupPosition;
    offsetLeft: number;
    offsetTop: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
    popupHeight: number;
    popupWidth: number;
  }) => {
    const {
      position,
      offsetLeft,
      offsetTop,
      bottom,
      left,
      right,
      top,
      popupHeight,
      popupWidth,
    } = params;
    let newLeft = offsetLeft;
    let newTop = offsetTop;
    if (['top', 'tl', 'tr', 'bottom', 'bl', 'br'].includes(position)) {
      // 上下检测
      if (offsetTop < 0 && ['top', 'tl', 'tr'].includes(position)) {
        newTop = bottom;
      } else if (
        offsetTop + popupHeight > window.innerHeight &&
        ['bottom', 'bl', 'br'].includes(position)
      ) {
        newTop = top - popupHeight;
      }
      // 左右检测
      if (offsetLeft < 0) {
        newLeft = left;
      } else if (offsetLeft + popupWidth > window.innerWidth) {
        newLeft = right - popupWidth;
      }
    } else {
      // 左右检测
      if (offsetLeft < 0 && ['left', 'lt', 'lb'].includes(position)) {
        newLeft = right;
      } else if (
        offsetLeft + popupWidth > window.innerWidth &&
        ['right', 'rt', 'rb'].includes(position)
      ) {
        newLeft = left - popupWidth;
      }
      // 上下检测
      if (offsetTop < 0) {
        newTop = top;
      } else if (newTop + popupHeight > window.innerHeight) {
        newTop = top - popupHeight;
      }
    }
    return [newLeft, newTop];
  };
  // 计算arrow的positon
  const calcArrowPosition = (params: {
    position: PopupPosition;
    triggerWidth: number;
    triggerHeight: number;
    arrowWidth: number;
    arrowHeight: number;
    popupHeight: number;
    popupWidth: number;
  }) => {
    const {
      position,
      triggerWidth,
      triggerHeight,
      popupWidth,
      popupHeight,
      arrowHeight,
      arrowWidth,
    } = params;
    let inset: CSSProperties;
    if (['top', 'tl', 'tr', 'bottom', 'bl', 'br'].includes(position)) {
      let arrowLeft = '';
      let arrowRight = '';
      if (['top', 'bottom'].includes(position)) {
        arrowLeft = valueToPx((popupWidth - arrowWidth) / 2);
      } else if (['tl', 'bl'].includes(position)) {
        arrowLeft = valueToPx((triggerWidth - arrowWidth) / 2);
      } else {
        arrowRight = valueToPx((triggerWidth - arrowWidth) / 2);
      }
      inset = {
        top: position.startsWith('b') ? valueToPx(-arrowHeight / 2) : '',
        right: arrowRight,
        bottom: position.startsWith('t') ? valueToPx(-arrowHeight / 2) : '',
        left: arrowLeft,
      };
    } else {
      let arrowTop = '';
      let arrowBottom = '';
      if (['left', 'right'].includes(position)) {
        arrowTop = valueToPx((popupHeight - arrowHeight) / 2);
      } else if (['lt', 'rt'].includes(position)) {
        arrowTop = valueToPx((triggerHeight - arrowHeight) / 2);
      } else {
        arrowBottom = valueToPx((triggerHeight - arrowHeight) / 2);
      }
      inset = {
        top: arrowTop,
        right: position.startsWith('l') ? valueToPx(-arrowWidth / 2) : '',
        bottom: arrowBottom,
        left: position.startsWith('r') ? valueToPx(-arrowWidth / 2) : '',
      };
    }
    return inset;
  };
  // 根据offsettop与offsetleft反向计算当前的位置
  const calcPositionRef = (params: {
    offsetLeft: number;
    offsetTop: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
    triggerWidth: number;
    triggerHeight: number;
    popupHeight: number;
    popupWidth: number;
  }) => {
    const {
      offsetLeft,
      offsetTop,
      top,
      left,
      bottom,
      right,
      triggerWidth,
      triggerHeight,
      popupHeight,
      popupWidth,
    } = params;
    const epsilon = 0.00001;
    const dirArray = [
      [top - popupHeight, left + (triggerWidth - popupWidth) / 2, 'top'],
      [top - popupHeight, left, 'tl'],
      [top - popupHeight, right - popupWidth, 'tr'],
      [bottom, left + (triggerWidth - popupWidth) / 2, 'bottom'],
      [bottom, left, 'bl'],
      [bottom, right - popupWidth, 'br'],
      [top + (triggerHeight - popupHeight) / 2, left - popupWidth, 'left'],
      [top, left - popupWidth, 'lt'],
      [bottom - popupHeight, left - popupWidth, 'lb'],
      [top + (triggerHeight - popupHeight) / 2, right, 'right'],
      [top, right, 'rt'],
      [bottom - popupHeight, right, 'rb'],
    ];
    const target = dirArray.find(([finalTop, finalLeft]) => {
      return (
        Math.abs((finalLeft as number) - offsetLeft) < epsilon &&
        Math.abs((finalTop as number) - offsetTop) < epsilon
      );
    });
    return target?.[2] ?? position.value;
  };
  // 强制重新获取位置
  watch(
    () => computedVisible.value,
    async (val) => {
      if (!val) return;
      await nextTick();
      position.value = _position.value;
      const triggerDom = unrefElement(triggerRef);
      const popupDom = unrefElement(popupRef);
      if (triggerDom) {
        // 获取trigger
        const {
          left: _left,
          right: _right,
          top: _top,
          bottom: _bottom,
          width: _triggerWidth,
          height: _triggerHeight,
        } = triggerDom.getBoundingClientRect();
        left.value = _left;
        right.value = _right;
        top.value = _top;
        bottom.value = _bottom;
        triggerWidth.value = _triggerWidth;
        triggerHeight.value = _triggerHeight;
      }
      // 获取popup
      if (popupDom) {
        const { offsetWidth: _popupWidth, offsetHeight: _popupHeight } =
          popupDom;
        popupWidth.value = _popupWidth;
        popupHeight.value = _popupHeight;
      }
      // 回去arrow
      if (arrowRef.value) {
        const { offsetWidth: _arrowWidth, offsetHeight: _arrowHeight } =
          arrowRef.value;
        arrowWidth.value = _arrowWidth;
        arrowHeight.value = _arrowHeight;
      }
    }
  );
  return {
    position,
    left,
    top,
    bottom,
    right,
    popupWidth,
    popupHeight,
    triggerWidth,
    triggerHeight,
    arrowWidth,
    arrowHeight,
    popupStyle,
    contentStyle,
    arrowStyle,
  };
};
