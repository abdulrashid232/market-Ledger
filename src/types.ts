export type CurrencyCode = 'GHS' | 'NGN' | 'KES' | 'USD' | 'EUR' | 'GBP' | 'ZAR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export interface SalesItem {
  id: string;
  itemName: string;
  quantitySold: number;
  unitPrice: number;
  totalRevenue: number;
  category: 'Produce' | 'Grains & Staple' | 'Meat & Fish' | 'Oils & Spices' | 'Textiles & Apparel' | 'General Goods' | 'Services' | 'Other';
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  description: string;
  cost: number;
  category: 'Transport & Freight' | 'Restock / Wholesale' | 'Market Toll & Fees' | 'Packaging & Bags' | 'Personal & Food' | 'Utilities & Airtime' | 'Other';
  notes?: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  status: 'in_stock' | 'low_stock' | 'restock_needed' | 'spoiled_damaged';
  estimatedRemaining?: string;
  restockQuantityNeeded?: string;
  checked?: boolean;
  notes?: string;
}

export interface CustomerFeedback {
  id: string;
  customerComment: string;
  category: 'complaint' | 'praise' | 'inquiry' | 'price_concern';
  severity: 'low' | 'medium' | 'high';
  suggestedAction: string;
}

export interface ActionableInsight {
  id: string;
  title: string;
  description: string;
  category: 'pricing' | 'inventory' | 'customer_service' | 'operations' | 'supplier';
  impact: 'high' | 'medium' | 'low';
}

export interface DailyTask {
  id: string;
  task: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface StockProduct {
  id: string;
  name: string;
  category: string;
  unit: string; // e.g. 'bags', 'kg', 'crates', 'pieces'
  currentStock: number;
  lowStockThreshold: number;
  unitCost: number;   // buying / wholesale price
  unitPrice: number;  // selling price
  createdAt: number;
  updatedAt: number;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'adjustment' | 'spoilage';
  quantity: number; // positive = stock in, negative = stock out
  unitCost?: number;
  notes?: string;
  reportId?: string;
  date: string;
  createdAt: number;
}

export interface CashTillDenominations {
  [key: string]: number; // e.g. "200": 5 (meaning 5 notes of 200)
}

export interface DailyLedgerReport {
  id: string;
  date: string; // YYYY-MM-DD or readable
  currency: CurrencyCode;
  currencySymbol: string;
  rawNotes: string;
  vendorName?: string;
  businessType?: string;
  summaryHeadline: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  sales: SalesItem[];
  expenses: ExpenseItem[];
  inventory: InventoryItem[];
  feedback: CustomerFeedback[];
  insights: ActionableInsight[];
  tasks: DailyTask[];
  cashInDrawer?: number;
  cashDiscrepancy?: number;
  createdAt: number;
}
