import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
  }).format(new Date(date));
}

export const DISH_PRICES = {
  tajine_sghir_poulet: 40,
  tajine_sghir_viande: 50,
  m9la_viande: 45,
  m9la_tayba: 35,
  tajine_kbir: 120,
};
