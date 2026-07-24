import { DailyLedgerReport } from '../types';
import { LOCAL_STORAGE_KEY } from './constants';

const SEED_REPORTS: DailyLedgerReport[] = [
  {
    id: 'seed-report-1',
    date: '2026-07-23',
    currency: 'GHS',
    currencySymbol: '₵',
    rawNotes: 'Sold 10 bags of perfumed rice at 480 GHC each, 12 tins of milk for 72 GHC, 10 bags of yellow gari at 25 GHC each. Mrs. Mensah complained tomatoes had soft spots. Paid 60 GHC market toll and 40 GHC porter transport. Restock needed: 15 bags rice, 5 gallons palm oil.',
    vendorName: 'Auntie Agnes',
    businessType: 'Rice & Provisions Stall',
    summaryHeadline: 'Strong rice sales driven by weekend demand, netting 4,822 GHC profit after minor toll and transport fees.',
    totalRevenue: 5122,
    totalExpenses: 100,
    netProfit: 5022,
    createdAt: Date.now() - 86400000,
    sales: [
      { id: 's1', itemName: 'Perfumed Royal Feast Rice (50kg)', quantitySold: 10, unitPrice: 480, totalRevenue: 4800, category: 'Grains & Staple' },
      { id: 's2', itemName: 'Ideal Canned Milk (Tin)', quantitySold: 12, unitPrice: 6, totalRevenue: 72, category: 'General Goods' },
      { id: 's3', itemName: 'Yellow Gari Bag (10kg)', quantitySold: 10, unitPrice: 25, totalRevenue: 250, category: 'Grains & Staple' }
    ],
    expenses: [
      { id: 'e1', description: 'Market Sanitation & Toll Fee', cost: 60, category: 'Market Toll & Fees' },
      { id: 'e2', description: 'Porter Loading & Offloading', cost: 40, category: 'Transport & Freight' }
    ],
    inventory: [
      { id: 'i1', itemName: 'Perfumed Rice Bags', status: 'restock_needed', estimatedRemaining: '2 bags left', restockQuantityNeeded: '15 bags' },
      { id: 'i2', itemName: 'Frytol Palm Oil (Gallons)', status: 'low_stock', estimatedRemaining: '1 gallon', restockQuantityNeeded: '5 gallons' },
      { id: 'i3', itemName: 'Yellow Gari Bags', status: 'in_stock', estimatedRemaining: '8 bags left' }
    ],
    feedback: [
      { id: 'f1', customerComment: 'Mrs. Mensah reported soft spots and fast spoilage on wholesale tomatoes.', category: 'complaint', severity: 'medium', suggestedAction: 'Inspect supplier tomato crates individually before accepting delivery.' }
    ],
    insights: [
      { id: 'in1', title: 'Bundle High-Margin Staples', description: 'Offer 1 bag of rice + 1 tin of milk at a 5 GHC bundled discount to clear remaining milk inventory faster.', category: 'pricing', impact: 'high' },
      { id: 'in2', title: 'Supplier Quality Check', description: 'Request a fresh non-soft batch of tomatoes from Techiman supplier before paying full crate rate.', category: 'supplier', impact: 'high' }
    ],
    tasks: [
      { id: 't1', task: 'Call Techiman supplier at 7:00 AM for fresh tomato crates', priority: 'high', completed: true },
      { id: 't2', task: 'Restock 15 bags of perfumed rice from wholesale depot', priority: 'high', completed: false }
    ]
  },
  {
    id: 'seed-report-2',
    date: '2026-07-22',
    currency: 'GHS',
    currencySymbol: '₵',
    rawNotes: 'Sold 8 crates tomatoes at 120 GHC, 10 sacks onions at 190 GHC, 20 plantain bunches at 38 GHC. Customer complained prices increased. Paid 100 GHC truck offloading.',
    vendorName: 'Uncle Kofi',
    businessType: 'Fresh Produce Vendor',
    summaryHeadline: 'High produce volume with steady demand; total revenue reached 3,620 GHC.',
    totalRevenue: 3620,
    totalExpenses: 100,
    netProfit: 3520,
    createdAt: Date.now() - 172800000,
    sales: [
      { id: 's21', itemName: 'Techiman Fresh Tomatoes (Crate)', quantitySold: 8, unitPrice: 120, totalRevenue: 960, category: 'Produce' },
      { id: 's22', itemName: 'Bawku Onions (Sack)', quantitySold: 10, unitPrice: 190, totalRevenue: 1900, category: 'Produce' },
      { id: 's23', itemName: 'Ripe Plantain Bunches', quantitySold: 20, unitPrice: 38, totalRevenue: 760, category: 'Produce' }
    ],
    expenses: [
      { id: 'e21', description: 'Truck Offloading & Loading', cost: 100, category: 'Transport & Freight' }
    ],
    inventory: [
      { id: 'i21', itemName: 'Fresh Tomatoes', status: 'restock_needed', estimatedRemaining: '1 crate left', restockQuantityNeeded: '12 crates' },
      { id: 'i22', itemName: 'Onion Sacks', status: 'in_stock', estimatedRemaining: '5 sacks' }
    ],
    feedback: [
      { id: 'f21', customerComment: 'Buyer complained tomato price increased by 10 GHC since last week.', category: 'price_concern', severity: 'low', suggestedAction: 'Explain wholesale transportation cost increase gently to regular buyers.' }
    ],
    insights: [
      { id: 'in21', title: 'Diversify into Ginger & Garlic', description: 'Several buyers inquired about ginger; starting with a small 10kg bag could add 150 GHC daily profit.', category: 'inventory', impact: 'medium' }
    ],
    tasks: [
      { id: 't21', task: 'Purchase 12 crates of fresh tomatoes from early morning truck', priority: 'high', completed: false }
    ]
  }
];

export function getSavedReports(): DailyLedgerReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_REPORTS));
      return SEED_REPORTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load saved reports:', err);
    return SEED_REPORTS;
  }
}

export function saveReport(report: DailyLedgerReport): DailyLedgerReport[] {
  try {
    const reports = getSavedReports();
    const existingIndex = reports.findIndex((r) => r.id === report.id);
    let updated: DailyLedgerReport[];
    if (existingIndex >= 0) {
      updated = [...reports];
      updated[existingIndex] = report;
    } else {
      updated = [report, ...reports];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save report:', err);
    return [];
  }
}

export function deleteReport(reportId: string): DailyLedgerReport[] {
  try {
    const reports = getSavedReports();
    const filtered = reports.filter((r) => r.id !== reportId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete report:', err);
    return [];
  }
}
