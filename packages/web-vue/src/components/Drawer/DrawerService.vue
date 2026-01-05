<template>
  <yc-drawer
    v-bind="props"
    v-model:visible="visible"
    @ok="onOk?.()"
    @cancel="onCancel?.()"
    @before-open="onBeforeOpen?.()"
    @before-close="onBeforeClose?.()"
    @open="onOpen?.()"
    @close="onClose?.()"
  >
    <template #title>
      <component :is="getSlotFunction(title)" />
    </template>
    <div class="yc-drawer-body-content">
      <component :is="getSlotFunction(content)" />
    </div>
  </yc-drawer>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { DrawerConfig } from './type';
import { getSlotFunction } from '@shared/utils';
import YcDrawer from './Drawer.vue';
const props = withDefaults(defineProps<DrawerConfig>(), {
  placement: 'right',
  title: '',
  mask: true,
  maskClosable: true,
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
  unmountOnClose: false,
  width: 250,
  height: 250,
  drawerStyle: () => {
    return {};
  },
  escToClose: true,
  header: true,
  footer: true,
  hideCancel: false,
  onBeforeCancel: () => {
    return true;
  },
  onBeforeOk: () => {
    return true;
  },
});
const { onClose } = props;
// visible
const visible = ref<boolean>(false);
onMounted(() => {
  visible.value = true;
});
</script>
