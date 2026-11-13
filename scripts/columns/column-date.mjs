// Date-only values retain their calendar date; timestamps display in Korea.
export function formatColumnDate(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value || '';
  return part('year') + '-' + part('month') + '-' + part('day');
}
