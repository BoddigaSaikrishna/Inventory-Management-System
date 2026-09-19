import { TradeUnitConfig, TradeUnitKey, BaseUnit } from "@/types/inventory";

export const TRADE_UNITS: Record<TradeUnitKey, TradeUnitConfig> = {
  bag: {
    key: "bag",
    label: "Bag / Bori",
    hindiLabel: "बोरी (Bori)",
    teluguLabel: "సంచి (Sanchi)",
    tamilLabel: "மூட்டை (Mootai)",
    defaultMultiplier: 50,
    baseUnit: "kg",
    aliases: [
      "bag","bags","bori","borii","bori","boriya","boriyaan",
      "बोरी","बोरीं","సంచి","mootai","kattai",
      // code-mixed
      "bags add","bags aaye","bags aaya","bags add karo","bags add cheyyi",
      "bag stock","sanchi",
    ],
  },
  carton: {
    key: "carton",
    label: "Carton / Box",
    hindiLabel: "पेटी (Peti)",
    teluguLabel: "బాక్స్ (Box)",
    tamilLabel: "பெட்டி (Petti)",
    defaultMultiplier: 24,
    baseUnit: "piece",
    aliases: [
      "carton","cartons","peti","petty","petiya","box","boxes",
      "पेटी","పెట్టె","బాక్స్","பெட்டி","khoka",
      // code-mixed
      "carton add","cartons add","carton aaya","cartons le aao",
      "carton cheyyi","box add karo",
    ],
  },
  box: {
    key: "box",
    label: "Box / Dabba",
    hindiLabel: "डब्बा (Dabba)",
    teluguLabel: "డబ్బా (Dabba)",
    tamilLabel: "டப்பா (Dappa)",
    defaultMultiplier: 12,
    baseUnit: "piece",
    aliases: ["box", "boxes", "dabba", "dhabba", "डब्बा", "డబ్బా", "டப்பா", "petti"],
  },
  dozen: {
    key: "dozen",
    label: "Dozen (12 pcs)",
    hindiLabel: "दर्जन (Darjan)",
    teluguLabel: "డజన్ (Dozan)",
    tamilLabel: "டஜன் (Dozan)",
    defaultMultiplier: 12,
    baseUnit: "piece",
    aliases: [
      "dozen","dozens","darjan","darzen","doj","dz",
      "दर्जन","డజన్","டஜன்",
      // code-mixed
      "dozen add","dozen check","dozen add karo","dozen add cheyyi",
    ],
  },
  quintal: {
    key: "quintal",
    label: "Quintal (100 kg)",
    hindiLabel: "क्विंटल (Quintal)",
    teluguLabel: "క్వింటాల్ (Quintal)",
    tamilLabel: "குவிண்டால் (Quintal)",
    defaultMultiplier: 100,
    baseUnit: "kg",
    aliases: ["quintal", "quintals", "kattal", "क्विंटल", "క్వింటాల్", "குவிண்டால்", "qtl"],
  },
  packet: {
    key: "packet",
    label: "Packet / Pkt",
    hindiLabel: "पैकेट (Packet)",
    teluguLabel: "ప్యాకెట్ (Packet)",
    tamilLabel: "பாக்கெட் (Packet)",
    defaultMultiplier: 1,
    baseUnit: "packet",
    aliases: ["packet", "packets", "pkt", "pkts", "pouch", "pouches", "पैकेट", "ప్యాకెట్", "பாக்கெட்"],
  },
  piece: {
    key: "piece",
    label: "Piece / Nag",
    hindiLabel: "नग (Nag)",
    teluguLabel: "పీస్ (Piece)",
    tamilLabel: "பீஸ் (Piece)",
    defaultMultiplier: 1,
    baseUnit: "piece",
    aliases: ["piece", "pieces", "pc", "pcs", "nag", "nagg", "नग", "పీస్", "பீஸ்"],
  },
  kg: {
    key: "kg",
    label: "Kilogram (kg)",
    hindiLabel: "किलो (Kilo)",
    teluguLabel: "కిలో (Kilo)",
    tamilLabel: "கிலோ (Kilo)",
    defaultMultiplier: 1,
    baseUnit: "kg",
    aliases: [
      "kg","kgs","kilo","kilos","kilogram","kilograms",
      "किलो","కిలో","கிலோ",
      // code-mixed
      "kilo add karo","kilo check karo","kilo add cheyyi","kilo check cheyyi",
    ],
  },
  litre: {
    key: "litre",
    label: "Litre (L)",
    hindiLabel: "लीटर (Litre)",
    teluguLabel: "లీటర్ (Litre)",
    tamilLabel: "லிட்டர் (Litre)",
    defaultMultiplier: 1,
    baseUnit: "litre",
    aliases: ["litre", "litres", "liter", "liters", "ltr", "lt", "लीटर", "లీటర్", "லிட்டர்"],
  },
};

/**
 * Match spoken trade unit text to standard TradeUnitKey
 */
export function matchTradeUnit(text: string): TradeUnitKey | null {
  const normalized = text.toLowerCase().trim();
  for (const [key, config] of Object.entries(TRADE_UNITS)) {
    if (config.aliases.some((alias) => normalized.includes(alias))) {
      return key as TradeUnitKey;
    }
  }
  return null;
}

/**
 * Convert quantity from trade unit to base unit
 */
export function convertTradeToBase(
  quantityInTradeUnit: number,
  tradeUnitSize: number
): number {
  return quantityInTradeUnit * tradeUnitSize;
}

/**
 * Convert quantity from base unit to trade unit
 */
export function convertBaseToTrade(
  baseQuantity: number,
  tradeUnitSize: number
): number {
  if (!tradeUnitSize || tradeUnitSize <= 0) return baseQuantity;
  return Number((baseQuantity / tradeUnitSize).toFixed(2));
}

/**
 * Format total quantity nicely for trade users
 * e.g. "150 kg (3 Bags)" or "50 pcs (2 Cartons + 2 pcs)"
 */
export function formatStockInTradeUnits(
  baseQuantity: number,
  baseUnit: BaseUnit,
  tradeUnitKey: TradeUnitKey,
  tradeUnitSize: number
): string {
  const unitConfig = TRADE_UNITS[tradeUnitKey];
  const unitName = unitConfig ? unitConfig.label.split("/")[0].trim() : tradeUnitKey;

  if (tradeUnitSize <= 1 || baseUnit === tradeUnitKey) {
    return String(baseQuantity) + " " + String(baseUnit);
  }

  const tradeCount = Math.floor(baseQuantity / tradeUnitSize);
  const remainder = baseQuantity % tradeUnitSize;

  if (tradeCount === 0) {
    return String(baseQuantity) + " " + String(baseUnit);
  }

  const pluralSuffix = tradeCount > 1 ? "s" : "";
  if (remainder === 0) {
    return String(tradeCount) + " " + unitName + pluralSuffix + " (" + String(baseQuantity) + " " + String(baseUnit) + ")";
  }

  return String(tradeCount) + " " + unitName + pluralSuffix + " + " + String(remainder) + " " + String(baseUnit) + " (" + String(baseQuantity) + " " + String(baseUnit) + ")";
}
