import { CurrencyCode } from '../types';

export interface SamplePreset {
  id: string;
  vendorName: string;
  marketName: string;
  businessType: string;
  currency: CurrencyCode;
  currencySymbol: string;
  notes: string;
  description: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'food-staples-accra',
    vendorName: 'Auntie Agnes',
    marketName: 'Makola Market, Accra',
    businessType: 'Rice & Provisions Stall',
    currency: 'GHS',
    currencySymbol: '₵',
    description: 'Busy Friday sales with rice, milk, gari, customer feedback & transport cost',
    notes: `End of day Friday! Sold 12 bags of perfumed Royal Feast rice at 480 cedis per bag. Also sold 18 tins of Ideal milk for 108 GHC total, and 15 bags of yellow gari at 25 GHC each.

Customer Mrs. Mensah complained that the tomatoes we bought from the wholesale truck yesterday had soft spots and spoiled too quickly. Another customer asked if we will stock 5kg bags of sugar next week.

Paid 80 GHC for market toll fee and porter transport for loading. Spent 35 GHC on lunch and water.

Counted cash in box, around 6,100 GHC. Restock needed urgently: 20 bags of perfumed rice and 10 gallons of Frytol palm oil for Saturday morning market.`
  },
  {
    id: 'produce-vegetables-kumasi',
    vendorName: 'Uncle Kofi',
    marketName: 'Kejetia Central Market, Kumasi',
    businessType: 'Fresh Produce & Vegetables',
    currency: 'GHS',
    currencySymbol: '₵',
    description: 'Wholesale produce sales, high tomato prices, customer requests for spices',
    notes: `Market was packed today Thursday. Sold 25 crates of fresh Techiman tomatoes at 120 GHC per crate. Sold 15 sacks of Bawku onions at 200 GHC each, and 30 bunches of ripe plantain at 40 GHC per bunch.

Two restaurant buyers complained tomato prices went up 15% since Monday. Three buyers asked if we have fresh ginger and garlic in bulk.

Paid 150 GHC to truck drivers for offloading crates and 50 GHC for daily market sanitation levy.

Made around 7,200 GHC total sales. Need to call Techiman supplier tonight to order 30 crates of tomatoes and get 5 bags of ginger to test demand.`
  },
  {
    id: 'spices-oils-tamale',
    vendorName: 'Fatima',
    marketName: 'Aboabo Market, Tamale',
    businessType: 'Local Oils & Groundnut Paste',
    currency: 'GHS',
    currencySymbol: '₵',
    description: 'Groundnut paste, zomi palm oil, customer packaging requests',
    notes: `Very hot day at Aboabo market. Sold 40 packs of fresh groundnut paste at 15 GHC each, 30 bottles of red palm oil at 35 GHC each, and 50 packets of seasoning cubes at 10 GHC each. Total sales came to 2,150 GHC.

Multiple customers requested smaller 5 GHC sachets or mini bottles of palm oil because 35 GHC is too big for daily cooking.

Expenses: Paid 40 GHC for polythene bags and rubber bands, plus 30 GHC for shade umbrella repair.

Need to restock groundnut paste from Nsawam supplier tomorrow. 5 bottles of palm oil leaked in storage bag.`
  },
  {
    id: 'textiles-fashion-lagos',
    vendorName: 'Mama Blessing',
    marketName: 'Balogun Market, Lagos',
    businessType: 'Ankara Prints & Fabrics',
    currency: 'NGN',
    currencySymbol: '₦',
    description: 'Lagos fabric market sales, tailor complaints, transportation costs',
    notes: `Good turnout today. Sold 8 bundles of Dutch Wax Ankara at 28,000 Naira each, 5 pieces of Lace fabric at 45,000 Naira each, and 12 headties at 3,500 Naira each.

Customer Mrs. Chukwu complained that the color on one fabric sample faded after first wash and requested a swap or discount. Another customer loved the peacock pattern design and asked for 10 more rolls for a wedding party next month.

Paid 12,000 Naira for store generator diesel and 5,000 Naira market union levy. Total revenue 491,000 Naira.

Need to order 15 rolls of peacock print Ankara and talk to fabric supplier about color fastness refund.`
  },
  {
    id: 'grains-spices-nairobi',
    vendorName: 'Joseph',
    marketName: 'Muthurwa Market, Nairobi',
    businessType: 'Cereals & Dry Beans',
    currency: 'KES',
    currencySymbol: 'KSh',
    description: 'Maize, beans, Kamande lentils, storage pest issue, delivery costs',
    notes: `Sold 15 bags of white maize at 4,200 Ksh per bag, 10 bags of Rosecoco beans at 6,500 Ksh each, and 20kg of Kamande lentils at 180 Ksh per kg.

One buyer complained that 1 bag of maize had slight moisture and requested 500 Ksh discount. Spent 3,000 Ksh on boda-boda local customer deliveries and 1,200 Ksh for stall rent levy.

Total cash collected 131,100 Ksh. Need to buy moisture-proof storage sacks and restock 15 bags of Rosecoco beans before weekend surge.`
  }
];
