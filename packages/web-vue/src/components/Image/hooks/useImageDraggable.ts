import { Ref, ref } from 'vue';
import { sleep, useDraggable } from '@shared/utils';

export default (imageRef: Ref<HTMLImageElement | undefined>) => {
  // 处理拖动
  const x = ref<number>(0);
  const y = ref<number>(0);
  const isDragging = ref<boolean>(false);
  useDraggable(imageRef, {
    onStart: () => {
      isDragging.value = true;
    },
    onMove(_, e) {
      if (!isDragging.value) return;
      x.value += e.movementX;
      y.value += e.movementY;
    },
    async onEnd() {
      x.value = 0;
      y.value = 0;
      await sleep(5);
      isDragging.value = false;
    },
  });
  return {
    x,
    y,
    isDragging,
  };
};
