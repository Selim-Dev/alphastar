/**
 * Format duration in hours to human-readable format
 * Requirements: 6.3, 7.3, 17.1
 * 
 * Rules:
 * - < 24 hours: "X hours"
 * - 1-7 days: "X days Y hours"
 * - > 7 days: "X days"
 * - > 30 days: "X months Y days"
 */
export function formatDuration(hours: number): string {
  if (hours < 0) {
    return '0 hours';
  }

  // Less than 24 hours
  if (hours < 24) {
    const roundedHours = Math.round(hours);
    return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''}`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);

  // 1-7 days: show days and hours
  if (days <= 7) {
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
  }

  // 8-30 days: show only days
  if (days <= 30) {
    return `${days} days`;
  }

  // More than 30 days: show months and days
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (remainingDays === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  return `${months} month${months !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
}

/**
 * Format duration with icon-friendly short format
 */
export function formatDurationShort(hours: number): string {
  if (hours < 0) {
    return '0h';
  }

  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);

  if (days <= 7) {
    if (remainingHours === 0) {
      return `${days}d`;
    }
    return `${days}d ${remainingHours}h`;
  }

  if (days <= 30) {
    return `${days}d`;
  }

  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (remainingDays === 0) {
    return `${months}mo`;
  }

  return `${months}mo ${remainingDays}d`;
}
