import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '';
  return format(new Date(date), fmt);
};

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const truncate = (str, len = 100) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');
