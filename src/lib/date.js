// lib/date.js — Date/timezone helpers

export function getTodayDate(timezone = 'Asia/Kolkata') {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getWeekDates(fromDate, days = 7) {
  const dates = [];
  const start = new Date(fromDate + 'T00:00:00');
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function getMonthDates(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const dates = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return dates;
}

export function weekStart(timezone = 'Asia/Kolkata') {
  const today = getTodayDate(timezone);
  const d = new Date(today + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function monthStart(timezone = 'Asia/Kolkata') {
  const today = getTodayDate(timezone);
  return today.slice(0, 7) + '-01';
}

export function daysAgo(n, timezone = 'Asia/Kolkata') {
  const today = getTodayDate(timezone);
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export function currentTime(timezone = 'Asia/Kolkata') {
  return new Date().toLocaleTimeString('en-IN', { timeZone: timezone, hour12: false });
}
