export const formatRelativeTime = (date: string | number | Date): string => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now.getTime() - postDate.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const years = Math.floor(diffMs / 31536000000);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 365) return `${days}d`;
  return `${years}y`;
};
