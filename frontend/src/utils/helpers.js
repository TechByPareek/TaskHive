/**
 * helpers.js
 * Shared utility functions for the frontend.
 */

/**
 * Format an ISO date string to a readable date (e.g. "Oct 17, 2026").
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format an ISO datetime to a readable datetime (e.g. "Oct 17, 2026 10:23 AM").
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/** CSS class for status badge. */
export function getStatusClass(status) {
  switch (status) {
    case 'pending':     return 'status-pending';
    case 'in_progress': return 'status-in-progress';
    case 'completed':   return 'status-completed';
    default:            return 'status-pending';
  }
}

/** Human-readable status label. */
export function getStatusLabel(status) {
  switch (status) {
    case 'pending':     return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'completed':   return 'Completed';
    default:            return status;
  }
}

/** CSS class for priority badge. */
export function getPriorityClass(priority) {
  switch (priority) {
    case 'low':    return 'priority-low';
    case 'medium': return 'priority-medium';
    case 'high':   return 'priority-high';
    default:       return 'priority-medium';
  }
}

/** Human-readable priority label. */
export function getPriorityLabel(priority) {
  switch (priority) {
    case 'low':    return 'Low';
    case 'medium': return 'Medium';
    case 'high':   return 'High';
    default:       return priority;
  }
}

/**
 * Debounce a function call.
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
