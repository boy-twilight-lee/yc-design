import { VNode } from 'vue';
import { ClassName, PopupContainer, ObjectFit } from '@shared/type';

export interface ImageProps {
  src?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
  description?: string;
  fit?: ObjectFit;
  alt?: string;
  hideFooter?: HideFooter;
  footerPosition?: FooterPostion;
  showLoader?: boolean;
  preview?: boolean;
  previewVisible?: boolean;
  defaultPreviewVisible?: boolean;
  previewProps?: ImagePreviewProps;
  footerClass?: ClassName;
}

export interface ImageEmits {
  (e: 'update:previewVisible', visible: boolean): void;
  (e: 'preview-visible-change', visible: boolean): void;
}

export interface ImageSlots {
  error?: () => VNode[];
  'error-icon'?: () => VNode[];
  loader?: () => VNode[];
  extra?: () => VNode[];
  'preview-actions'?: () => VNode[];
}

export interface ImagePreviewProps {
  src?: string;
  visible?: boolean;
  defaultVisible?: boolean;
  maskClosable?: boolean;
  closable?: boolean;
  actionsLayout?: string[];
  popupContainer?: PopupContainer;
  escToClose?: boolean;
  wheelZoom?: boolean;
  keyboard?: boolean;
  defaultScale?: number;
  zoomRate?: number;
}

export interface ImagePreviewEmits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
  (e: 'beforeOpen'): void;
  (e: 'beforeClose'): void;
}

export interface ImagePreviewSlots {
  actions?: () => VNode[];
  arrow?: () => VNode[];
}

export interface ImagePreviewGroupProps extends Omit<ImagePreviewProps, 'src'> {
  srcList?: string[];
  current?: number;
  defaultCurrent?: number;
  infinite?: boolean;
}

export interface ImagePreviewGroupEmits {
  (e: 'update:visible', value: boolean): void;
  (e: 'update:current', index: number): void;
  (e: 'change', index: number): void;
  (e: 'visible-change', value: boolean): void;
}

export interface ImagePreviewGroupSlots {
  actions?: () => VNode[];
  default?: () => VNode[];
}

export interface ImagePreviewActionProps {
  name?: string;
  disabled?: boolean;
}

export interface ImagePreviewActionEmits {
  (e: 'click', ev: MouseEvent): void;
  (e: 'dblclick', ev: MouseEvent): void;
  (e: 'contextmenu', ev: MouseEvent): void;
}

export interface ImagePreviewActionSlots {
  default?: () => VNode[];
}

type HideFooter = boolean | 'never';

type FooterPostion = 'inner' | 'outer';
