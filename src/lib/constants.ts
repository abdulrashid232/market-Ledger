import { CurrencyCode, CurrencyConfig } from '../types';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  GHS: { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi (GHS)' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira (NGN)' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling (KES)' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand (ZAR)' },
};

export const LOCAL_STORAGE_KEY = 'market_vendor_ledger_reports_v1';
export const LOCAL_SETTINGS_KEY = 'market_vendor_ledger_settings_v1';

export function formatMoney(amount: number, currencyCode: CurrencyCode = 'GHS'): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.GHS;
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${config.symbol}${formattedNumber}`;
}
