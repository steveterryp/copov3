export function formatDate(date: Date | string, timezone: string = 'UTC', format: string = 'DD/MM/YYYY'): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: timezone || 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
}

export function formatTime(date: Date | string, timezone: string = 'UTC', format: '12h' | '24h' = '24h'): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }

    return new Intl.DateTimeFormat('en-AU', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
    }).format(d);
  } catch (error) {
    console.error('Time formatting error:', error);
    return 'Invalid time';
  }
}

export function formatDateTime(date: Date | string, timezone: string = 'UTC', timeFormat: '12h' | '24h' = '24h'): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }

    return new Intl.DateTimeFormat('en-AU', {
      timeZone: timezone || 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12h',
    }).format(d);
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return 'Invalid date/time';
  }
}
