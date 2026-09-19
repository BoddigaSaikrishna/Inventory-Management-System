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

export interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number; // quantity in base units
  baseUnit: BaseUnit;
  tradeUnit: TradeUnitKey;
  tradeUnitSize: number; // conversion ratio: e.g. 50 (50kg per bag)
  price: number; // price per trade unit or base unit
  minStockThreshold: number; // threshold in base units
  reorderQuantity: number; // suggested reorder in trade units
  supplierName?: string;
  supplierPhone?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ActionType = "ADD" | "REMOVE" | "SET" | "QUERY" | "REORDER" | "UNKNOWN";

export interface ParsedVoiceIntent {
  rawText: string;
  action: ActionType;
  productName?: string;
  matchedProduct?: Product;
  quantity?: number;
  tradeUnit?: TradeUnitKey;
  baseQuantityCalculated?: number;
  confidence: number;
  language: string;
  feedbackMessage: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  type: "ADD" | "REMOVE" | "SET";
  productId: number;
  productName: string;
  quantityChange: number; // in base units
  tradeUnitQuantity: number; // quantity in trade units
  tradeUnitLabel: string;
  originalVoiceText?: string;
  userConfirmed: boolean;
  notes?: string;
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
