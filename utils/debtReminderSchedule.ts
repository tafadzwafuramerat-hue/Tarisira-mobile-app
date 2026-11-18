export function harareDueDate(daysUntilDue: number, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Africa/Harare',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const dueDate = new Date(Date.UTC(getPart('year'), getPart('month') - 1, getPart('day') + daysUntilDue, 7));
  return dueDate;
}

export function canScheduleDebtReminder(dueAt: Date, now = new Date()): boolean {
  return dueAt.getTime() - 24 * 60 * 60 * 1000 > now.getTime();
}
