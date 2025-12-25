import { App, nextTick, reactive, h, render } from 'vue';
import {
  MessageMethod,
  MessageConfig,
  MessageProps,
  MessageType,
  MessagePostion,
} from './type';
import { isString } from '@shared/utils';
import _Message from './Message.vue';
import _MessageList from './MessageList.vue';

export type MessageInstance = InstanceType<typeof _Message>;
export * from './type';

// message-container
const container = new Map<string, HTMLDivElement>();
// messageList
const messageList = reactive({
  top: [] as MessageProps[],
  bottom: [] as MessageProps[],
});
// messageId
let messageId = 1;
// 移除容器
const removeContainer = (position: MessagePostion) => {
  if (messageList[position].length) return;
  document.body.removeChild(container.get(position) as HTMLDivElement);
  container.delete(position);
};
// 处理messageOpen
const open = async (
  props: string | MessageConfig,
  type: MessageType = 'info'
) => {
  // 消息渲染的位置
  const position = isString(props) ? 'top' : (props.position ?? 'top');
  const list = messageList[position];
  // 创建容器
  if (!container.has(position)) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'yc-overlay yc-overlay-message';
    document.body.appendChild(messageContainer);
    container.set(position, messageContainer);
    render(
      h(_MessageList, {
        messageList: list,
        position,
      }),
      messageContainer
    );
  }
  // messageId
  const id =
    isString(props) || !props.id ? `__yc_message_${messageId++}` : props.id;
  // 销毁
  const onDestory = () => {
    const index = list.findIndex((item) => item.id == id);
    if (index == -1) {
      return;
    }
    list.splice(index, 1);
    removeContainer(position);
  };
  // 创建message对象
  const message = isString(props)
    ? { content: props, id, onDestory, type }
    : { ...props, id, onDestory, type };
  const index = list.findIndex((item) => item.id == id);
  // 查找是否存在
  if (index != -1) {
    list[index] = {
      ...list[index],
      ...message,
      isReset: true,
    };
    await nextTick();
    list[index].isReset = false;
  } else {
    list.push(message);
  }
  return {
    close: onDestory,
  };
};
// message通用函数
const messageMethod = {
  ...Object.fromEntries(
    ['success', 'warning', 'error', 'info', 'loading', 'normal'].map((type) => {
      return [
        type,
        (props: string | MessageConfig) => {
          return open(props, type as MessageType);
        },
      ];
    })
  ),
  clear(position: MessagePostion) {
    messageList[position].splice(0);
    removeContainer(position);
  },
} as MessageMethod;

const Message = Object.assign(_Message, {
  install: (app: App) => {
    app.config.globalProperties.$message = messageMethod;
  },
  ...messageMethod,
});

export default Message;
