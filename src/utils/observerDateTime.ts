const LUNAR_DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

let lunarDateCacheKey = '';
let lunarDateCacheValue: string | null = null;

export function formatUtcDate(date: Date) {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatUtcTime(date: Date) {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatUtcDateTimeInput(date: Date) {
  return `${formatUtcDate(date)}T${formatUtcTime(date)}`;
}

export function parseUtcDateTimeInput(value: string) {
  const match = value.match(/^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = '0'] = match;
  const fields = {
    year: Number(year),
    month: Number(month) - 1,
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
  const parsed = new Date(0);
  parsed.setUTCFullYear(fields.year, fields.month, fields.day);
  parsed.setUTCHours(fields.hour, fields.minute, fields.second, 0);

  const isExactDate = parsed.getUTCFullYear() === fields.year
    && parsed.getUTCMonth() === fields.month
    && parsed.getUTCDate() === fields.day
    && parsed.getUTCHours() === fields.hour
    && parsed.getUTCMinutes() === fields.minute
    && parsed.getUTCSeconds() === fields.second;

  return isExactDate ? parsed : null;
}

export function formatLunarDate(date: Date) {
  const cacheKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
  if (cacheKey === lunarDateCacheKey) {
    return lunarDateCacheValue;
  }

  try {
    const raw = LUNAR_DATE_FORMATTER.format(date);
    const chineseDigits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const toChineseDay = (value: number) => {
      if (value <= 10) return `初${value === 10 ? '十' : chineseDigits[value]}`;
      if (value < 20) return `十${chineseDigits[value % 10]}`;
      if (value === 20) return '二十';
      if (value < 30) return `廿${chineseDigits[value % 10]}`;
      if (value === 30) return '三十';
      return `三十${chineseDigits[value % 10]}`;
    };

    const yearMatch = raw.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]年)/);
    const monthMatch = raw.match(/(闰?[正一二三四五六七八九十冬腊]+月)/);
    const dayMatch = raw.match(/(\d+)$/);
    lunarDateCacheKey = cacheKey;
    lunarDateCacheValue = yearMatch && monthMatch && dayMatch
      ? `${yearMatch[1]}${monthMatch[1]}${toChineseDay(Number(dayMatch[1]))}`
      : raw;
    return lunarDateCacheValue;
  } catch {
    lunarDateCacheKey = cacheKey;
    lunarDateCacheValue = null;
    return null;
  }
}
