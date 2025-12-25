import { ref, Ref, computed, CSSProperties, watch, nextTick } from 'vue';
import { useDraggable, valueToPx } from '@shared/utils';

export default (params: {
  draggable: Ref<boolean>;
  fullscreen: Ref<boolean>;
  alignCenter: Ref<boolean>;
  top: Ref<number>;
  visible: Ref<boolean>;
  triggerRef: Ref<HTMLDivElement | undefined>;
  modalRef: Ref<HTMLDivElement | undefined>;
}) => {
  // 结构钢通用属性
  const {
    visible,
    triggerRef,
    modalRef,
    draggable,
    fullscreen,
    alignCenter,
    top,
  } = params;
  // 用于计算初始modal位置
  const originX = ref<number>(0);
  const originY = ref<number>(0);
  //   拖拽
  const { x, y } = useDraggable(triggerRef, {
    onMove() {
      if (!isDraggable.value) return;
      const maxX = window.innerWidth - modalRef.value!.offsetWidth;
      const maxY = window.innerHeight - modalRef.value!.offsetHeight;
      x.value = x.value >= maxX ? maxX : x.value;
      x.value = x.value <= 0 ? 0 : x.value;
      y.value = y.value >= maxY ? maxY : y.value;
      y.value = y.value <= 0 ? 0 : y.value;
    },
  });
  // 是否可拖拽
  const isDraggable = computed(() => draggable.value && !fullscreen.value);
  // 拖拽样式
  const dragStyle = computed<CSSProperties>(() => {
    return isDraggable.value &&
      (x.value != originX.value || y.value != originY.value)
      ? {
          transform: `translate(${valueToPx(x.value)},${valueToPx(y.value)})`,
        }
      : {
          left: valueToPx(originX.value),
          top: valueToPx(originY.value),
        };
  });
  // 计算初始位置
  watch(
    () => visible.value,
    async (v) => {
      if (!v) return;
      await nextTick();
      const offsetX = (window.innerWidth - modalRef.value!.offsetWidth) / 2;
      const offsetY = (window.innerHeight - modalRef.value!.offsetHeight) / 2;
      const finalX = offsetX <= 0 ? 0 : offsetX;
      const finalY = offsetY <= 0 ? 0 : offsetY;
      originX.value = finalX;
      originY.value = alignCenter.value ? finalY : top.value;
      x.value = originX.value;
      y.value = originY.value;
    },
    {
      immediate: true,
    }
  );

  return {
    dragStyle,
    isDraggable,
  };
};
