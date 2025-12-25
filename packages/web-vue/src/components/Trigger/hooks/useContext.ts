import { ref, watch, Ref, provide, inject, nextTick } from 'vue';
import { TriggerType, TriggerProps as _TriggerProps } from '../type';
import { Required } from '@shared/type';
import { unrefElement, nanoid, isString } from '@shared/utils';

const TRIGGER_CONTEXT_KEY = 'trigger-context';
type TriggerContext = {
  depth: number;
  curDepth: Ref<number>;
  groupIds: Ref<string[]>;
  timeout: Ref<NodeJS.Timeout | undefined>;
  hoverTimeout: Ref<NodeJS.Timeout | undefined>;
  hide?: () => void;
};
export type TriggerProps = Required<_TriggerProps>;

/**
 *  depth 记录组件内部嵌套的层级,当curHoverLevel小于level关闭
 *  curDepth 记录当前hover的层级
 *  groupIds 同一个submenu里面的groupId集合
 *  groupId  组件标识，用于标识元素是否处于一个嵌套中
 */
export default function useTriggerContext(params: {
  trigger: TriggerType | TriggerType[];
  mouseEnterDelay: Ref<number>;
  computedVisible: Ref<boolean>;
  popupRef: Ref<HTMLDivElement | undefined>;
}) {
  const { trigger, popupRef, computedVisible, mouseEnterDelay } = params;
  // 接收
  const {
    depth: preDepth,
    curDepth,
    groupIds,
    timeout,
    hoverTimeout,
  } = inject<TriggerContext>(TRIGGER_CONTEXT_KEY, {
    depth: -1,
    curDepth: ref(0),
    groupIds: ref([]),
    timeout: ref<NodeJS.Timeout>(),
    hoverTimeout: ref<NodeJS.Timeout>(),
  });
  // 设置level
  const depth = preDepth + 1;
  // 生成groupId
  const groupId = nanoid(32);
  // 设置groupId
  groupIds.value[depth] = groupId;
  // 继续注入
  provide<TriggerContext>(TRIGGER_CONTEXT_KEY, {
    depth,
    curDepth,
    groupIds,
    hoverTimeout,
    timeout,
  });
  // 是否是合法的trigger
  const isValidTrigger = (value: TriggerType) => {
    const triggerArray = isString(trigger) ? [trigger] : trigger;
    return triggerArray.includes(value);
  };
  // 判断是否在一个嵌套组内
  const isSameGroup = (el: HTMLElement) => {
    const dataId = el.getAttribute('data-group-id') as string;
    const dataDepth = el.getAttribute('data-group-depth') as string;
    const isGroup = !!dataId && groupIds.value.includes(groupId);
    if (isGroup || el.tagName == 'BODY') {
      return {
        isGroup,
        groupId: dataId,
        depth: isGroup ? Number.parseInt(dataDepth) : -1,
      };
    } else {
      return isSameGroup(el.parentElement as HTMLElement);
    }
  };
  // 处理mouseenter 设置depth
  const mouseEnterHandler = () => {
    // 处理trigger嵌套,以及多重触发的问题
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value);
    }
    hoverTimeout.value = setTimeout(() => {
      curDepth.value = depth;
    }, mouseEnterDelay.value);
  };
  // 处理mouse离开
  const mosueLeaveHandler = (e: MouseEvent) => {
    if (groupIds.value.length <= 1) {
      return false;
    }
    const { isGroup } = isSameGroup(e.relatedTarget as HTMLDivElement);
    if (isGroup) {
      computedVisible.value = false;
    } else {
      curDepth.value = -1;
    }
    return true;
  };
  // 处理clickoutside关闭
  const clickOutsideHandler = (e: Event) => {
    if (groupIds.value.length <= 1) {
      return false;
    }
    const { isGroup, depth: _depth } = isSameGroup(
      (e.target ?? e) as HTMLElement
    );
    computedVisible.value = isGroup ? depth <= _depth : computedVisible.value;
    return isGroup;
  };
  // 检测层级的改变自动关闭
  watch(
    () => curDepth.value,
    (v) => {
      if (depth <= v || !isValidTrigger('hover')) {
        return;
      }
      computedVisible.value = false;
    }
  );
  // 检测visible设置depth和groupId
  watch(
    () => computedVisible.value,
    async (val) => {
      if (!val) return;
      await nextTick();
      const popupDom = unrefElement(popupRef)!;
      popupDom?.setAttribute('data-group-id', groupId);
      popupDom?.setAttribute('data-group-depth', `${depth}`);
    },
    {
      immediate: true,
    }
  );
  return {
    timeout,
    mouseEnterHandler,
    clickOutsideHandler,
    mosueLeaveHandler,
  };
}
