import { DATE_FORMAT_OPTIONS } from "./constants";

export const formatDate = (date: Date): string => {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return new Intl.DateTimeFormat("en-US", DATE_FORMAT_OPTIONS).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}; 