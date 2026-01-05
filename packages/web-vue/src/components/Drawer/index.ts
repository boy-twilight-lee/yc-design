import { App, render, h } from 'vue';
import { DrawerConfig } from './type';
import _Drawer from './Drawer.vue';
import _DrawerService from './DrawerService.vue';
import { getElement } from '@shared/utils';

export type DrawerInstance = InstanceType<typeof _Drawer>;
export * from './type';

// open
const open = (props: DrawerConfig) => {
  // 挂在容器
  const popupContainer =
    getElement(props.popupContainer) || document.createElement('div');
  document.body.appendChild(popupContainer);
  // 关闭函数
  const close = () => {
    render(null, popupContainer as HTMLDivElement);
    document.body.removeChild(popupContainer);
  };
  // 挂在vnode
  const vnode = h(_DrawerService, {
    ...props,
    popupContainer,
    style: {
      position: props.popupContainer ? 'absolute' : 'fixed',
    },
    onClose: () => {
      close();
      props.onClose?.();
    },
  });
  // 渲染 VNode 到容器
  render(vnode, popupContainer);
  return {
    close,
  };
};

const Drawer = Object.assign(_Drawer, {
  install: (app: App) => {
    app.component('Yc' + _Drawer.name, _Drawer);
    app.config.globalProperties.$drawer = {
      open,
    };
  },
  open,
});

export default Drawer;
