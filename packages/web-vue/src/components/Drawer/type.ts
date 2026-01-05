import { CSSProperties, VNode } from 'vue';
import { ButtonProps } from '@/components/Button';
import { OnBeforeCancel, OnBeforeOk } from '@/components/Modal';
import { RenderContent, PopupContainer, Position } from '@shared/type';

export interface DrawerProps {
  visible?: boolean;
  defaultVisible?: boolean;
  placement?: Position;
  title?: string;
  mask?: boolean;
  maskClosable?: boolean;
  closable?: boolean;
  okText?: string;
  cancelText?: string;
  okLoading?: boolean;
  okButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  unmountOnClose?: boolean;
  width?: number | string;
  height?: number | string;
  popupContainer?: PopupContainer;
  drawerStyle?: CSSProperties;
  escToClose?: boolean;
  header?: boolean;
  footer?: boolean;
  hideCancel?: boolean;
  onBeforeCancel?: OnBeforeCancel;
  onBeforeOk?: OnBeforeOk;
}

export interface DrawerSlots {
  default?: () => VNode[];
  header?: () => VNode[];
  footer?: () => VNode[];
  title?: () => VNode[];
}

export interface DrawerEmits {
  (e: 'update:visible', value: boolean): void;
  (e: 'ok'): void;
  (e: 'cancel', event: MouseEvent | KeyboardEvent): void;
  (e: 'before-open'): void;
  (e: 'open'): void;
  (e: 'before-close'): void;
  (e: 'close'): void;
}

export type DrawerConfig = Omit<DrawerProps, 'visible' | 'defaultVisible'> & {
  content?: RenderContent;
  title?: RenderContent;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onOpen?: () => void;
  onClose?: () => void;
  onBeforeOpen?: () => void;
  onBeforeClose?: () => void;
};

export type DrawerMethod = {
  open: (props: DrawerConfig) => DrawerReturn;
};

export type DrawerReturn = {
  close: () => void;
};
