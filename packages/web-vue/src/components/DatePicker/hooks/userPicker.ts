import { computed, nextTick, ref, toRefs } from 'vue';
import { BasePickerEmits, DatePickerValue, ShortcutType } from '../type';
import {
  dayjs,
  Dayjs,
  isString,
  useControlValue,
  createReusableTemplate,
  useI18n,
  isUndefined,
  getDaysOfMonth,
  getWeeksOfMonth,
  getRangeOfYear,
  isFunction,
  isArray,
  isDayjs,
} from '@shared/utils';
import { RecordType } from '@/components/_shared/type';
import useContext from './useContext';

export default function usePicker(params: {
  props: RecordType;
  emits: BasePickerEmits;
}) {
  const { props, emits } = params;
  const {
    modelValue,
    defaultValue,
    popupVisible,
    defaultPopupVisible,
    pickerValue,
    defaultPickerValue,
    format,
    valueFormat,
    dayStartOfWeek,
    showTime,
    locale,
    abbreviation,
    hideTrigger,
    showConfirmBtn: _showConfirmBtn,
  } = toRefs(props);
  const { disabledDate } = props;
  // 格式化时间
  const computedValue = useControlValue<DatePickerValue>(
    modelValue,
    defaultValue.value,
    (val, controlValue) => {
      const date = getFormatFromDate(val as Date);
      controlValue.value = date;
      emits('update:modelValue' as any, date);
    }
  );
  // 受控的visible
  const computedVisible = useControlValue<boolean>(
    popupVisible,
    defaultPopupVisible.value,
    (val) => {
      emits('popup-visible-change', val);
      emits('update:popupVisible', val);
    }
  );
  // 受控的picker的值
  const computedPickerValue = useControlValue<DatePickerValue>(
    pickerValue,
    defaultPickerValue.value,
    (val) => {
      emits('update:pickerValue', val);
    }
  );
  // 展示的value
  const formatValue = computed(() => {
    const date = getDateFromFormat(computedValue.value);
    if (!date) return '';
    return format.value && computedValue.value
      ? dayjs(date).format(format.value)
      : (computedValue.value as string);
  });
  // timePickerValue
  const timePickerValue = computed({
    get() {
      return computedValue.value;
    },
    set(val) {
      const date = dayjs(val, valueFormat.value);
      const curDate = getDateFromFormat(computedValue.value);
      computedValue.value = curDate
        ? new Date(
            curDate.getFullYear(),
            curDate.getMonth(),
            curDate.getDate(),
            date.hour(),
            date.minute(),
            date.second()
          )
        : date.toDate();
    },
  });
  // showConfirmBtn
  const showConfirmBtn = computed(() => {
    return showTime?.value ? showTime?.value : _showConfirmBtn.value;
  });
  // 定义重用模板
  const { define: DefinePanel, reuse: ReusePanel } = createReusableTemplate();
  // 国际化
  const { t } = useI18n();
  // 旧值
  let oldDate: Date | string;
  // 选择的date
  let selectDate: Date;
  // 是否确认过
  let isConfirm = false;
  //  当前的年
  const curYear = ref<number>(0);
  // 当前的月
  const curMonth = ref<number>(0);
  // 展示年选择器
  const showYearPicker = ref<boolean>(false);
  // 展示月份选择器
  const showMonthPicker = ref<boolean>(false);
  // 处理pickerVisible发生改变
  const handleVisibleChange = (visible: boolean) => {
    if (visible) {
      isConfirm = false;
      oldDate = computedValue.value
        ? getDateFromFormat(computedValue.value)
        : (computedValue.value as string);
    } else {
      showYearPicker.value = false;
      showMonthPicker.value = false;
      if (!showConfirmBtn.value || isConfirm || isUndefined(oldDate)) return;
      computedValue.value = oldDate;
    }
  };
  // 处理shortcut
  const handleShortcut = (shortcut: ShortcutType, hover: boolean) => {
    if (shortcut.value) {
      const value = isFunction(shortcut.value)
        ? shortcut.value()
        : shortcut.value;
      if (isArray(value)) {
        computedValue.value = value.map((v) => {
          return isDayjs(v) ? v.toDate() : v;
        }) as any;
      } else {
        computedValue.value = isDayjs(value) ? value.toDate() : value;
      }
    }
    if (hover) return;
    isConfirm = true;
    computedVisible.value = false;
    emits('select-shortcut', shortcut);
  };
  // 处理选中
  const handleSelect = (date: Date) => {
    if (disabledDate?.(date)) {
      return;
    }
    computedValue.value = date;
    selectDate = date;
    const dateString = dayjs(date).format('YYYY-MM-DD');
    emits('select', computedValue.value, date, dateString);
    if (showConfirmBtn.value) return;
    emits('change', computedValue.value, date, dateString);
  };
  // 处理确认
  const handleConfirm = async () => {
    isConfirm = true;
    const dateString = dayjs(selectDate).format('YYYY-MM-DD');
    emits('change', computedValue.value, selectDate, dateString);
    emits('ok', computedValue.value, selectDate, dateString);
    await nextTick();
    computedVisible.value = false;
  };
  // 处理今天的点击
  const handleNowClick = (
    onSet: (value: Date, oldValue: Date | '') => void
  ) => {
    const value = new Date();
    const oldValue = getDateFromFormat(computedValue.value);
    computedValue.value = value;
    onSet(value, oldValue);
    if (showTime?.value) return;
    isConfirm = true;
    computedVisible.value = false;
  };
  // 从格式化的值中提取
  const getDateFromFormat = (val: DatePickerValue) => {
    if (!val) return '';
    let date: Dayjs;
    if (['timestamp', 'Date'].includes(valueFormat.value) || !isString(val)) {
      date = dayjs(val);
    } else {
      date = dayjs(val, valueFormat.value);
    }
    if (!date.isValid()) return '';
    return date.toDate();
  };
  // 把date格式化
  const getFormatFromDate = (val: Date) => {
    if (!val || !dayjs(val).isValid()) return '';
    const date: DatePickerValue = val;
    if (valueFormat.value == 'timestamp') {
      return dayjs(date).valueOf();
    }
    if (valueFormat.value != 'Date') {
      return dayjs(date).format(valueFormat.value);
    }
    return date;
  };
  // 是否inView
  const isCellInView = (v: Date, type: string) => {
    if (type == 'year') {
      const startYear = Math.floor(curYear.value / 10) * 10;
      return v.getFullYear() >= startYear && v.getFullYear() <= startYear + 10;
    }
    if (type == 'month') {
      return true;
    }
    return v.getFullYear() == curYear.value && v.getMonth() == curMonth.value;
  };
  // 是否是今天
  const isToday = (v: Date, type: string) => {
    const curDate = dayjs();
    if (type == 'year') {
      return v.getFullYear() == curDate.year();
    }
    if (type == 'month') {
      return (
        v.getMonth() == curDate.month() && v.getFullYear() == curDate.year()
      );
    }
    return (
      v.getFullYear() == curDate.year() &&
      v.getMonth() == curDate.month() &&
      v.getDate() == curDate.date()
    );
  };
  // 是否选中
  const isSelected = (v: Date, type: string) => {
    const date = getDateFromFormat(computedValue.value) as Date;
    if (!date) return false;
    if (type == 'year') {
      return date.getFullYear() == v.getFullYear();
    }
    if (type == 'month') {
      return (
        date.getFullYear() == v.getFullYear() && date.getMonth() == v.getMonth()
      );
    }
    return (
      date.getFullYear() == v.getFullYear() &&
      date.getMonth() == v.getMonth() &&
      date.getDate() == v.getDate()
    );
  };
  // input-context
  useContext().provide(
    {
      computedValue,
      computedVisible,
      formatValue,
      emits,
    },
    props
  );
  return {
    formatValue,
    timePickerValue,
    computedValue,
    computedVisible,
    computedPickerValue,
    dayStartOfWeek,
    locale,
    abbreviation,
    showYearPicker,
    showMonthPicker,
    curMonth,
    curYear,
    valueFormat,
    format,
    showConfirmBtn,
    hideTrigger,
    DefinePanel,
    ReusePanel,
    t,
    getDateFromFormat,
    getFormatFromDate,
    isCellInView,
    isToday,
    isSelected,
    handleVisibleChange,
    getRangeOfYear,
    getWeeksOfMonth,
    getDaysOfMonth,
    handleNowClick,
    handleSelect,
    handleConfirm,
    handleShortcut,
  };
}
