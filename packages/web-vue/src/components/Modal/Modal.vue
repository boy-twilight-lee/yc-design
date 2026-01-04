<template>
  <teleport :to="popupContainer">
    <div
      v-if="!unmountOnClose || outerVisible"
      v-show="outerVisible"
      :class="[
        'yc-modal-container',
        $attrs.class,
        {
          'yc-modal-simple': simple,
        },
      ]"
      :style="{
        ...teleportStyle,
        ...($attrs.style ?? {}),
      }"
    >
      <!-- mask -->
      <transition :name="maskAnimationName">
        <div
          v-if="mask"
          v-show="innerVisible"
          class="yc-modal-mask"
          :style="maskStyle"
        ></div>
      </transition>
      <!-- modal-wrapper -->
      <div class="yc-modal-wrapper" @click.self="handleClose('mask', $event)">
        <transition
          :name="modalAnimationName"
          @before-enter="$emit('before-open')"
          @before-leave="$emit('before-close')"
          @after-enter="$emit('open')"
          @after-leave="handleAfterLeave"
        >
          <!-- modal -->
          <div
            v-show="innerVisible"
            :class="[
              'yc-modal',
              modalClass,
              {
                // 拖拽
                'yc-modal-draggable': isDraggable,
                // 全屏
                'yc-modal-fullscreen': fullscreen,
              },
            ]"
            :style="modalStyle"
            ref="modalRef"
          >
            <!-- header -->
            <slot name="header">
              <div class="yc-modal-header" ref="headerRef">
                <!-- title -->
                <div
                  v-if="!hideTitle"
                  :class="[
                    'yc-modal-title',
                    'text-ellipsis',
                    {
                      'title-align-center': titleAlign == 'center',
                    },
                  ]"
                >
                  <slot name="title">
                    {{ title }}
                  </slot>
                </div>
                <!-- close-btn -->
                <icon-button
                  v-if="closable && !simple"
                  class="yc-modal-close-button"
                  @click="handleClose('closeBtn', $event)"
                />
              </div>
            </slot>
            <!-- body -->
            <div class="yc-modal-body" :class="bodyClass" :style="bodyStyle">
              <slot />
            </div>
            <!-- footer -->
            <div v-if="footer" class="yc-modal-footer">
              <slot name="footer">
                <yc-button
                  v-if="!hideCancel"
                  v-bind="cancelButtonProps"
                  @click="handleClose('cancelBtn', $event)"
                >
                  {{ cancelText || t('modal.cancelText') }}
                </yc-button>
                <yc-button
                  type="primary"
                  :loading="okLoading || asyncLoading"
                  v-bind="okButtonProps"
                  @click="handleClose('confirmBtn', $event)"
                >
                  {{ okText || t('modal.okText') }}
                </yc-button>
              </slot>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { ref, toRefs, computed, CSSProperties } from 'vue';
import { ModalProps, ModalEmits, ModalSlots } from './type';
import { getGlobalConfig, valueToPx, useI18n } from '@shared/utils';
import useModalClose from './hooks/useModalClose';
import useModalDraggable from './hooks/useModalDraggable';
import YcButton from '@/components/Button';
import { IconButton } from '@shared/components';
defineOptions({
  name: 'Modal',
  inheritAttrs: false,
});
defineSlots<ModalSlots>();
const props = withDefaults(defineProps<ModalProps>(), {
  visible: undefined,
  defaultVisible: false,
  width: 400,
  top: 100,
  mask: true,
  title: '',
  titleAlign: 'center',
  alignCenter: true,
  unmountOnClose: false,
  maskClosable: true,
  hideCancel: false,
  closable: true,
  okText: '',
  cancelText: '',
  okLoading: false,
  okButtonProps: () => {
    return {};
  },
  cancelButtonProps: () => {
    return {};
  },
  footer: true,
  popupContainer: undefined,
  maskStyle: () => {
    return {};
  },
  modalClass: '',
  modalStyle: () => {
    return {};
  },
  escToClose: true,
  draggable: false,
  fullscreen: false,
  maskAnimationName: 'fade',
  modalAnimationName: 'zoom-modal',
  bodyClass: '',
  bodyStyle: () => {
    return {};
  },
  hideTitle: false,
  simple: false,
  onBeforeCancel: () => {
    return true;
  },
  onBeforeOk: () => {
    return true;
  },
});
const emits = defineEmits<ModalEmits>();
const {
  visible,
  defaultVisible,
  width,
  top,
  alignCenter,
  maskClosable,
  escToClose,
  modalStyle: _modalStyle,
  fullscreen,
  draggable,
} = toRefs(props);
const { onBeforeOk, onBeforeCancel } = props;
// 接收属性
const { teleportStyle, popupContainer } = getGlobalConfig(props);
// 国际化
const { t } = useI18n();
// 处理组件关闭开启
const {
  outerVisible,
  innerVisible,
  asyncLoading,
  handleClose,
  handleAfterLeave,
} = useModalClose({
  visible,
  defaultVisible,
  escToClose,
  maskClosable,
  onBeforeOk,
  onBeforeCancel,
  emits,
  onClose: (ev) => {
    emits('cancel', ev);
  },
});
// headerRef,用于拖拽
const headerRef = ref<HTMLDivElement>();
// modalRef,用于获取宽高处理越界问题
const modalRef = ref<HTMLDivElement>();
// modal
const { dragStyle, isDraggable } = useModalDraggable({
  visible: innerVisible,
  draggable,
  fullscreen,
  alignCenter,
  top,
  triggerRef: headerRef,
  modalRef,
});
// modalCss
const modalStyle = computed(() => {
  return {
    width: fullscreen.value
      ? '100%'
      : width.value == 'auto'
        ? 'fit-content'
        : valueToPx(width.value),
    ...dragStyle.value,
    ..._modalStyle.value,
  } as CSSProperties;
});
</script>

<style lang="less">
@import './style/modal.less';
</style>
