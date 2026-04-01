import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
  }).format(amount);
};

export const DISH_PRICES = {
  tajine_poulet: 45,
  tajine_viande: 55,
  m9la_viande: 40,
  m9la_tayba: 35,
  tajine_kbir: 120,
};

export const ROLES = [
  { id: 'server_morning', label: 'Serveur Matin' },
  { id: 'server_evening', label: 'Serveur Soir' },
  { id: 'cook_1', label: 'Cuisinier 1' },
  { id: 'cook_2', label: 'Cuisinier 2' },
  { id: 'barman', label: 'Barman' },
  { id: 'manager', label: 'Gérant' },
];

export const EXPENSE_CATEGORIES = [
  { id: 'vegetables', label: 'Légumes' },
  { id: 'meat', label: 'Boucher / Viande' },
  { id: 'grocery', label: 'Épicier / Mol lhanout' },
  { id: 'other', label: 'Autres achats' },
];

export const MONTHLY_CHARGE_CATEGORIES = [
  { id: 'rent', label: 'Loyer du local' },
  { id: 'cnss', label: 'CNSS des employés' },
  { id: 'electricity', label: 'Électricité' },
  { id: 'water', label: 'Eau' },
  { id: 'internet', label: 'Internet' },
  { id: 'gas', label: 'Gaz' },
  { id: 'other', label: 'Autres charges' },
];
