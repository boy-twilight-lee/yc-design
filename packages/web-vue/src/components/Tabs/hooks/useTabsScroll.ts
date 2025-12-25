import { ref, computed, Ref, watch, nextTick } from 'vue';
import { Direction, RecordType } from '@shared/type';
import { useResizeObserver } from '@shared/utils';
export default (params: {
  direction: Ref<Direction>;
  panes: Ref<RecordType[]>;
  listRef: Ref<HTMLDivElement | undefined>;
}) => {
  const { direction, panes, listRef } = params;
  // 是否可滚动
  const isScrollable = ref<boolean>(false);
  // 移动的距离
  const scrollDis = ref(0);
  // 计算总的宽度
  const listWidth = ref(0);
  // 计算总的高度
  const listHeight = ref(0);
  // 容器宽度
  const containerWidth = ref(0);
  // 容器高度
  const containerHeight = ref(0);
  // navHeight
  const navHeight = ref(0);
  // 向左向上按钮的禁用
  const preDisabled = computed(() => {
    return !scrollDis.value;
  });
  // 向下/右滚动的禁用
  const nextDisabled = computed(() => {
    return direction.value == 'horizontal'
      ? Math.abs(scrollDis.value) + containerWidth.value >= listWidth.value
      : Math.abs(scrollDis.value) + containerHeight.value >= listHeight.value;
  });
  // 检测List的宽度
  useResizeObserver(listRef, () => calcScrollable());
  // 检测panes的变化重新计算滚动
  watch(
    () => panes.value.length,
    async () => {
      await nextTick();
      calcScrollable();
    }
  );
  // 获取元素尺寸
  const getElementSize = () => {
    listHeight.value = listRef.value!.scrollHeight;
    listWidth.value = listRef.value!.scrollWidth;
    containerWidth.value = listRef.value!.parentElement!.offsetWidth;
    containerHeight.value = listRef.value!.parentElement!.offsetHeight;
    navHeight.value = listRef.value!.parentElement!.parentElement!.offsetHeight;
  };
  // 计算是否可滚动
  const calcScrollable = () => {
    getElementSize();
    if (direction.value == 'horizontal') {
      isScrollable.value = listWidth.value > containerWidth.value;
    } else {
      isScrollable.value = listHeight.value > containerHeight.value;
    }
  };
  // 处理滚动
  const handleScroll = (type: 'pre' | 'next') => {
    getElementSize();
    // 根据方向获取相应的尺寸属性
    const containerSize =
      direction.value === 'horizontal'
        ? containerWidth.value
        : containerHeight.value;
    const listSize =
      direction.value === 'horizontal' ? listWidth.value : listHeight.value;
    // 计算滚动步长（容器尺寸的80%）
    const scrollStep = containerSize * 0.8;
    // 计算新的scrollDis
    let newscrollDis = scrollDis.value;
    if (type === 'next') {
      // 向下/右滚动，确保不会滚动超过内容末尾
      newscrollDis = Math.max(
        scrollDis.value - scrollStep,
        containerSize - listSize
      );
    } else {
      // 向上/左滚动，确保不会滚动超过内容开头
      newscrollDis = Math.min(scrollDis.value + scrollStep, 0);
    }
    scrollDis.value = newscrollDis;
  };
  return {
    navHeight,
    scrollDis,
    isScrollable,
    preDisabled,
    nextDisabled,
    handleScroll,
  };
};
