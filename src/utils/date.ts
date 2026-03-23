// 获取常用时间
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const BJ = 'Asia/Shanghai';

/** 解析后端时间（无时区串按北京时间），再格式化为北京时间字符串 */
export function formatPublishTimeBeijing(val: unknown): string {
  if (val == null || val === '') return '';
  if (Array.isArray(val)) {
    const [y, m, d, h = 0, mi = 0, s = 0] = val as number[];
    const str = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return dayjs.tz(str, 'YYYY-MM-DD HH:mm:ss', BJ).format('YYYY-MM-DD HH:mm:ss');
  }
  const s = String(val).trim();
  let d;
  if (/Z|[+-]\d{2}:?\d{2}$/.test(s)) {
    d = dayjs(s);
  } else {
    const space = s.replace('T', ' ');
    d = dayjs.tz(space, 'YYYY-MM-DD HH:mm:ss', BJ);
    if (!d.isValid()) {
      d = dayjs.tz(s.replace(' ', 'T'), 'YYYY-MM-DDTHH:mm:ss', BJ);
    }
  }
  if (!d.isValid()) return '';
  return d.tz(BJ).format('YYYY-MM-DD HH:mm:ss');
}

export const LAST_7_DAYS = [
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
];

export const LAST_30_DAYS = [
  dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
];
