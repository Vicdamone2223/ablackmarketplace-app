export const isBusinessOpenNow = (biz) => {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const hoursToday = biz.hours?.[day]?.trim();

  if (!hoursToday || hoursToday.toLowerCase() === 'closed') return false;

  const [openStr, closeStr] = hoursToday.split('-').map((t) => t.trim());
  
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const [time, period] = timeStr.trim().split(' ');
    if (!time || !period) return null;

    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    minutes = parseInt(minutes || '0');

    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  };

  const open = parseTime(openStr);
  const close = parseTime(closeStr);
  if (!open || !close) return false;

  const openTime = new Date(now);
  openTime.setHours(open.hours, open.minutes, 0, 0);

  const closeTime = new Date(now);
  closeTime.setHours(close.hours, close.minutes, 0, 0);

  if (closeTime <= openTime) {
    closeTime.setDate(closeTime.getDate() + 1);
  }


  return now >= openTime && now <= closeTime;
};
