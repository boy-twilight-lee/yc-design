<template>
  <component
    :is="tag"
    :class="[
      'yc-typography',
      {
        [`yc-typography-${type}`]: type,
        'yc-typography-bold': bold,
        'yc-typography-disabled': disabled,
        'yc-typography-underline': underline,
        'yc-typography-delete': deletable,
      },
    ]"
    ref="contentRef"
  >
    <!-- 渲染editable -->
    <yc-input
      v-if="computedEditing"
      v-model="computedText"
      ref="inputRef"
      @blur="handleEditEnd"
    />
    <!-- 渲染默认内容 -->
    <template v-else>
      <dynamic-tag :tags="tags">
        <slot />
      </dynamic-tag>
    </template>
    <!-- edit -->
    <span
      v-if="editable && !computedEditing"
      class="yc-typography-operation-edit"
      @click="handleEdit"
    >
      <yc-tooltip
        :content="t('typography.edit')"
        position="top"
        v-bind="editTooltiProps"
      >
        <span><icon-edit /></span>
      </yc-tooltip>
    </span>
    <!-- copy -->
    <span
      v-if="copyable"
      class="yc-typography-operation-copy"
      @click="handleCopy"
    >
      <yc-tooltip position="top" v-bind="copyTooltiProps">
        <span>
          <slot name="copy-icon" :copied="isCopied">
            <icon-info v-if="isCopied" color="rgb(0, 180, 42)" />
            <icon-copy v-else />
          </slot>
        </span>
        <template #content>
          <slot name="copy-tooltip" :copied="isCopied">
            {{ t(`typography.${isCopied ? 'copied' : 'copy'}`) }}
          </slot>
        </template>
      </yc-tooltip>
    </span>
  </component>
</template>

<script lang="ts" setup>
import {
  ref,
  toRefs,
  defineComponent,
  h,
  computed,
  VNode,
  nextTick,
} from 'vue';
import {
  TypographyBaseProps,
  TypographyBaseEmits,
  TypographyBaseSlots,
} from './type';
import {
  sleep,
  innerText,
  useClipboard,
  useI18n,
  useControlValue,
} from '@shared/utils';
import { IconEdit, IconCopy, IconInfo } from '@shared/icons';
import { default as YcInput, InputInstance } from '@/components/Input';
import YcTooltip from '@/components/Tooltip';
defineOptions({
  name: 'TypographyBase',
});
defineSlots<TypographyBaseSlots>();
const props = withDefaults(defineProps<TypographyBaseProps>(), {
  tag: 'span',
  type: undefined,
  bold: false,
  mark: false,
  underline: false,
  delete: false,
  code: false,
  editable: false,
  editing: undefined,
  defaultEditing: false,
  editText: '',
  copyable: false,
  copyText: '',
  copyDelay: 3000,
  ellipsis: true,
  editTooltiProps: () => {
    return {};
  },
  copyTooltiProps: () => {
    return {};
  },
});
const emits = defineEmits<TypographyBaseEmits>();
const {
  editing,
  defaultEditing,
  editText,
  copyText,
  copyable,
  copyDelay,
  code,
  mark,
  delete: deletable,
  underline,
  bold,
} = toRefs(props);
// 国际化
const { t } = useI18n();
// 复制hook
const { isSupported, copy } = useClipboard();
// 是否已经复制
const isCopied = ref<boolean>(false);
//  contentRef
const contentRef = ref<HTMLDivElement>();
// inputRef
const inputRef = ref<InputInstance>();
// editing
const computedEditing = useControlValue<boolean>(
  editing,
  defaultEditing.value,
  (val) => {
    emits('update:editing', val);
  }
);
// text
const computedText = useControlValue<string>(editText, '', (val) => {
  emits('update:editText', val);
  emits('change', val);
});
// 渲染的tags
const tags = computed(() => {
  const tags = ['mark', 'code', 'del', 'u', 'b'];
  const attrs = [
    mark.value,
    code.value,
    deletable.value,
    underline.value,
    bold.value,
  ];
  return tags.filter((_, i) => attrs[i]);
});
// 动态渲染tag
const DynamicTag = defineComponent({
  props: {
    tags: { type: Array<string>, default: () => [] },
  },
  setup(props, { slots }) {
    return () => {
      const { tags } = toRefs(props);
      // 递归渲染嵌套标签
      const renderContent = (content: any, index: number): VNode => {
        return index >= tags.value.length
          ? content
          : h(tags.value[index], null, renderContent(content, index + 1));
      };
      return renderContent(slots.default?.(), 0);
    };
  },
});
// 处理编辑
const handleEdit = async () => {
  computedEditing.value = true;
  computedText.value = computedText.value
    ? computedText.value
    : innerText(contentRef);
  emits('edit-start');
  await nextTick();
  inputRef.value?.focus();
};
// 处理失焦编辑借宿
const handleEditEnd = () => {
  computedEditing.value = false;
  emits('edit-end');
};
// 处理复制
const handleCopy = async () => {
  if (!copyable.value || !isSupported.value || isCopied.value) return;
  const value = copyText.value || innerText(contentRef);
  copy(value);
  emits('copy', value);
  isCopied.value = true;
  await sleep(copyDelay.value);
  isCopied.value = false;
};
</script>

<style lang="less">
@import './style/typography-base.less';
</style>
