export type EventStatus = 'upcoming' | 'live' | 'ended';

export function getEventStatus(
  eventDatetime: string,
  endDatetime: string,
): EventStatus {
  const now = new Date();
  const start = new Date(eventDatetime);
  const end = new Date(endDatetime);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'live';
  return 'ended';
}

export function getCountdownText(eventDatetime: string): string {
  const now = new Date();
  const start = new Date(eventDatetime);
  const diff = start.getTime() - now.getTime();

  if (diff <= 0) return '';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
  if (minutes > 0) return `Starts in ${minutes}m`;
  return 'Starting soon';
}

export function formatDuration(
  startDatetime: string,
  endDatetime: string,
): string {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const diff = end.getTime() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (minutes === 0) return `${hours}h`;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
