import { App, nextTick, h, render, reactive } from 'vue';
import _Notification from './Notification.vue';
import _NotificationList from './NotificationList.vue';
import type {
  NotificationMethod,
  NotificationConfig,
  NotificationProps,
  NotificationPosition,
} from './type';
import { Type } from '@shared/type';
import { isString } from '@shared/utils';

export type NotificationInstance = InstanceType<typeof _Notification>;
export * from './type';

// Notification-container
const container = new Map<string, HTMLDivElement>();
// notificationList
const notificationList = reactive({
  topLeft: [] as NotificationProps[],
  topRight: [] as NotificationProps[],
  bottomLeft: [] as NotificationProps[],
  bottomRight: [] as NotificationProps[],
});
// NotificationId
let notificationId = 1;
// 移除容器
const removeContainer = (position: NotificationPosition) => {
  if (notificationList[position].length) return;
  document.body.removeChild(container.get(position) as HTMLDivElement);
  container.delete(position);
};
// 处理NotificationOpen
const open = async (
  props: string | NotificationConfig,
  type: Type = 'info'
) => {
  // 消息渲染的位置
  const position = isString(props)
    ? 'topRight'
    : (props.position ?? 'topRight');
  const list = notificationList[position];
  // 创建container
  if (!container.has(position)) {
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'yc-overlay yc-overlay-notification';
    document.body.appendChild(notificationContainer);
    container.set(position, notificationContainer);
    render(
      h(_NotificationList, {
        notificationList: list,
        position,
      }),
      notificationContainer
    );
  }
  // NotificationId
  const id =
    isString(props) || !props.id
      ? `__yc_notification_${notificationId++}`
      : props.id;
  // 销毁
  const onDestory = () => {
    const index = list.findIndex((item) => item.id == id);
    if (index == -1) {
      return;
    }
    list.splice(index, 1);
    removeContainer(position);
  };
  // 创建Notification对象
  const notification = isString(props)
    ? { content: props, id, onDestory, type }
    : { ...props, id, onDestory, type };
  const index = list.findIndex((item) => item.id == id);
  // 查找是否存在
  if (index != -1) {
    list[index] = {
      ...list[index],
      ...notification,
      isReset: true,
    };
    await nextTick();
    list[index].isReset = false;
  } else {
    list.push(notification);
  }
  return {
    close: onDestory,
  };
};
// Notification通用函数
const NotificationMethod = {
  ...Object.fromEntries(
    ['success', 'warning', 'error', 'info'].map((type) => {
      return [
        type,
        (props: string | NotificationConfig) => {
          return open(props, type as Type);
        },
      ];
    })
  ),
  remove(id) {
    let posi: NotificationPosition = 'topRight';
    let i: number = -1;
    for (const [position, list] of Object.entries(notificationList)) {
      const index = list.findIndex((item) => item.id == id);
      if (index != -1) {
        posi = position as NotificationPosition;
        i = index;
        break;
      }
    }
    if (i == -1) {
      return;
    }
    notificationList[posi].splice(i, 1);
  },
  clear(position: NotificationPosition) {
    notificationList[position].splice(0);
    removeContainer(position);
  },
} as NotificationMethod;

const Notification = Object.assign(_Notification, {
  install: (app: App) => {
    app.config.globalProperties.$notification = NotificationMethod;
  },
  ...NotificationMethod,
});

export default Notification;
