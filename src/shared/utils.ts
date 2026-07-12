/**
 * Formats a user's first and last name into a single string.
 */
export function formatFullName(user?: { first_name?: string; last_name?: string } | null): string {
  if (!user) return '';
  return `${user.first_name || ''} ${user.last_name || ''}`.trim();
}

/**
 * Formats a date string into a relative timeline description (e.g., "Just now", "5 minutes ago", "Yesterday").
 */
export function formatPostTime(dateStr: string): string {
  if (!dateStr) return '';
  const created = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  
  if (diffMs < 0 || diffMs < 1000 * 60) {
    return 'Just now';
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  if (diffHours < 48) {
    return 'Yesterday';
  }
  
  return created.toLocaleDateString();
}
