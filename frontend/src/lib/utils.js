import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Small helper to merge Tailwind class names safely. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
