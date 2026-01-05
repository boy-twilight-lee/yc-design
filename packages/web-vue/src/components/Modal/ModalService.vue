<template>
  <yc-modal
    v-bind="props"
    v-model:visible="visible"
    :modal-class="[
      'yc-service-modal',
      {
        [`yc-service-modal-${type}`]: !!type,
      },
    ]"
    @ok="onOk?.()"
    @cancel="onCancel?.()"
    @before-open="onBeforeOpen?.()"
    @before-close="onBeforeClose?.()"
    @open="onOpen?.()"
    @close="onClose?.()"
  >
    <template #title>
      <span v-if="type" class="yc-modal-title-icon">
        <component :is="TYPE_ICON_MAP[type]" />
      </span>
      <span class="yc-modal-title-content text-ellipsis">
        <component :is="getSlotFunction(title)" />
      </span>
    </template>
    <div class="yc-modal-body-content text-ellipsis">
      <component :is="getSlotFunction(content)" />
    </div>
  </yc-modal>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { ModalConfig } from './type';
import { getSlotFunction } from '@shared/utils';
import { TYPE_ICON_MAP } from '@shared/constants';
import YcModal from './Modal.vue';
const props = withDefaults(defineProps<ModalConfig>(), {
  width: 520,
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
  content: '',
  popupContainer: undefined,
});
// visible
const visible = ref<boolean>(false);
// 进入
onMounted(() => {
  visible.value = true;
});
</script>

<style lang="less">
@import './style/modal-service.less';
</style>
