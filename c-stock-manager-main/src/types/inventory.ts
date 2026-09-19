export type BaseUnit = "kg" | "g" | "litre" | "ml" | "piece" | "packet" | "meter";

export type TradeUnitKey =
  | "bag"
  | "carton"
  | "box"
  | "dozen"
  | "quintal"
  | "packet"
  | "piece"
  | "kg"
  | "litre";

export interface TradeUnitConfig {
  key: TradeUnitKey;
  label: string;
  hindiLabel: string;
  teluguLabel: string;
  tamilLabel: string;
  defaultMultiplier: number; // e.g. 1 Bag = 50 kg, 1 Dozen = 12 pcs
  baseUnit: BaseUnit;
  aliases: string[];
}

export type ProductStockStatus = "IN_STOCK" | "WATCH" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number; // quantity in base units
  baseUnit: BaseUnit;
  tradeUnit: TradeUnitKey;
  tradeUnitSize: number; // conversion ratio: e.g. 50 (50kg per bag), 12 (12 pcs per dozen)
  price: number; // estimated unit selling price (₹)
  minStockThreshold: number; // reorder level in base units
  reorderQuantity: number; // suggested reorder in trade units
  supplierName?: string;
  supplierPhone?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ActionType =
  | "ADD"
  | "SELL"
  | "REMOVE"
  | "SET"
  | "CHECK"
  | "QUERY"
  | "LOW_STOCK_QUERY"
  | "SALES_QUERY"
  | "REORDER_QUERY"
  | "SET_REORDER_LEVEL"
  | "UNKNOWN";

export interface ParsedVoiceItem {
  name: string;
  action: ActionType;
  quantity: number;
  tradeUnit: TradeUnitKey;
  matchedProduct?: Product;
  baseQuantityCalculated?: number;
}

export interface ParsedVoiceIntent {
  rawText: string;
  action: ActionType;
  productName?: string;
  matchedProduct?: Product;
  quantity?: number;
  tradeUnit?: TradeUnitKey;
  baseQuantityCalculated?: number;
  targetThreshold?: number; // for SET_REORDER_LEVEL
  confidence: number;
  language: string;
  feedbackMessage: string;
  multipleItems?: ParsedVoiceItem[]; // for compound items like "Rice 135 bags, sugar 50 kg, eggs 13 dozens"
  insufficientStock?: {
    availableTradeUnits: number;
    requestedTradeUnits: number;
    unitLabel: string;
  };
}

export interface Transaction {
  id: string;
  timestamp: string;
  type: "ADD" | "SELL" | "REMOVE" | "SET";
  productId: number;
  productName: string;
  quantityChange: number; // in base units
  tradeUnitQuantity: number; // quantity in trade units
  tradeUnitLabel: string;
  remainingStockAfter?: number; // base units remaining after transaction
  price?: number; // total value if applicable
  originalVoiceText?: string;
  userConfirmed: boolean;
  notes?: string;
}

export interface LowStockReminder {
  id: string;
  productId: number;
  productName: string;
  currentTradeUnits: number;
  reorderLevelTradeUnits: number;
  tradeUnitLabel: string;
  suggestedReorder: number;
  timestamp: string;
  dismissed: boolean;
}

export type LanguageCode = "hi-IN" | "en-IN" | "te-IN" | "ta-IN" | "mr-IN" | "kn-IN";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export type SortField = "price" | "quantity" | "name" | "id";
export type SortOrder = "asc" | "desc";
export type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type TimeFilter = "TODAY" | "WEEK" | "MONTH";
