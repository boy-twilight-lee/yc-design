import { ref, watch, Ref, computed, watchEffect } from 'vue'; // 引入 watchEffect
import { Direction } from '@shared/type';
import { useResizeObserver, throttle, unrefElement } from '@shared/utils';
import type { MenuTreeNode } from './useContext';

interface UseCalcMaxMenuItemProps {
  menuRef: Ref<HTMLDivElement | undefined>;
  menuTree: Ref<MenuTreeNode[]>;
  menuItemWidths: Ref<number[]>;
  mode: Ref<Direction>;
}

export default function useCalcMaxMenuItem({
  menuRef,
  menuTree,
  menuItemWidths,
  mode,
}: UseCalcMaxMenuItemProps) {
  // max
  const max = ref<number>(1000000);
  // 最大个数
  const totalItems = computed(() => menuTree.value.length);
  // 省略菜单的宽度
  const ellipsisWidth = 58;
  //   菜单间的距离
  const ITEM_HORIZONTAL_GAP = 12;
  //   计算最大你能容纳的个数
  const calculateMaxFitItems = (availableSpace: number) => {
    let currentWidth = 0;
    let count = 0;
    for (let i = 0; i < totalItems.value; i++) {
      const itemWidth = menuItemWidths.value[i];
      if (itemWidth === undefined) {
        return count;
      }
      const gap = i > 0 ? ITEM_HORIZONTAL_GAP : 0;
      const itemTotalOccupiedWidth = itemWidth + gap;
      if (currentWidth + itemTotalOccupiedWidth <= availableSpace) {
        currentWidth += itemTotalOccupiedWidth;
        count++;
      } else {
        break;
      }
    }
    return count;
  };
  // 跟新计算
  const updateMaxItems = () => {
    const menuElement = unrefElement(menuRef);
    if (!menuElement || mode.value !== 'horizontal') {
      max.value = menuTree.value.length;
      return;
    }
    const style = window.getComputedStyle(menuElement);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const menuContentWidth =
      menuElement.clientWidth - paddingLeft - paddingRight;
    let maxCount = calculateMaxFitItems(menuContentWidth);
    if (maxCount < totalItems.value) {
      const availableSpaceWithEllipsis = menuContentWidth - ellipsisWidth;
      maxCount = calculateMaxFitItems(availableSpaceWithEllipsis);
    }
    max.value = Math.max(0, Math.min(maxCount, totalItems.value));
  };
  // 使用 watchEffect 来优雅地管理副作用
  watchEffect((onCleanup) => {
    const lisenters: Array<() => void> = [];
    onCleanup(() => {
      lisenters.forEach((v) => v());
    });
    if (mode.value != 'horizontal') {
      return lisenters.forEach((v) => v());
    }
    const { stop } = useResizeObserver(menuRef, throttle(updateMaxItems, 200));
    lisenters[0] = stop;
    lisenters[1] = watch(menuItemWidths, updateMaxItems, {
      deep: true,
    });
    lisenters[2] = watch(() => menuTree.value.length, updateMaxItems);
  });

  return {
    max,
  };
}
