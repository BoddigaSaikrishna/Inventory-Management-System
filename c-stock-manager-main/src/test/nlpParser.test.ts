import { describe, it, expect } from "vitest";
import { parseVoiceIntent, parseCompoundVoiceIntents } from "@/lib/nlpParser";
import { convertTradeToBase, formatStockInTradeUnits } from "@/lib/tradeUnits";
import type { Product } from "@/types/inventory";

const mockProducts: Product[] = [
  {
    id: 1001,
    name: "Basmati Rice (బాస్మతి చావల్)",
    category: "Food Grains & Pulses",
    quantity: 250,
    baseUnit: "kg",
    tradeUnit: "bag",
    tradeUnitSize: 50,
    price: 3200,
    minStockThreshold: 100,
    reorderQuantity: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1002,
    name: "Fortune Sunflower Oil",
    category: "Oil & Ghee",
    quantity: 120,
    baseUnit: "piece",
    tradeUnit: "carton",
    tradeUnitSize: 24,
    price: 3600,
    minStockThreshold: 48,
    reorderQuantity: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1003,
    name: "Lux Bath Soap",
    category: "Soaps & Detergents",
    quantity: 288,
    baseUnit: "piece",
    tradeUnit: "dozen",
    tradeUnitSize: 12,
    price: 420,
    minStockThreshold: 60,
    reorderQuantity: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1004,
    name: "Tata Salt",
    category: "Spices & Salt",
    quantity: 100,
    baseUnit: "kg",
    tradeUnit: "bag",
    tradeUnitSize: 25,
    price: 800,
    minStockThreshold: 25,
    reorderQuantity: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1005,
    name: "Aashirvaad Atta",
    category: "Atta & Flour",
    quantity: 200,
    baseUnit: "kg",
    tradeUnit: "bag",
    tradeUnitSize: 10,
    price: 1500,
    minStockThreshold: 50,
    reorderQuantity: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1006,
    name: "Sugar (చక్కెర)",
    category: "Sugar & Jaggery",
    quantity: 300,
    baseUnit: "kg",
    tradeUnit: "bag",
    tradeUnitSize: 50,
    price: 1800,
    minStockThreshold: 100,
    reorderQuantity: 4,
    createdAt: new Date().toISOString(),
  },
];

// ─── English-only ───────────────────────────────────────────────────────────

describe("English Commands", () => {
  it("Add 5 bags Basmati Rice", () => {
    const i = parseVoiceIntent("Add 5 bags Basmati Rice", mockProducts, "en-IN");
    expect(i.action).toBe("ADD");
    expect(i.quantity).toBe(5);
    expect(i.matchedProduct?.id).toBe(1001);
    expect(i.baseQuantityCalculated).toBe(250);
  });

  it("Sold 2 cartons Fortune Sunflower Oil", () => {
    const i = parseVoiceIntent("Sold 2 cartons Fortune Sunflower Oil", mockProducts, "en-IN");
    expect(["SELL", "REMOVE"]).toContain(i.action);
    expect(i.quantity).toBe(2);
    expect(i.matchedProduct?.id).toBe(1002);
  });

  it("Check stock of Lux soap", () => {
    const i = parseVoiceIntent("Check stock of Lux soap", mockProducts, "en-IN");
    expect(["CHECK", "QUERY"]).toContain(i.action);
    expect(i.matchedProduct?.id).toBe(1003);
  });
});

// ─── Hindi / Hinglish ───────────────────────────────────────────────────────

describe("Hindi / Hinglish Commands", () => {
  it("5 borii chawal aayi (5 bags rice arrived)", () => {
    const i = parseVoiceIntent("5 borii chawal aayi", mockProducts, "hi-IN");
    expect(i.action).toBe("ADD");
    expect(i.quantity).toBe(5);
    expect(i.matchedProduct?.id).toBe(1001);
  });

  it("10 cartons add karo (add 10 cartons)", () => {
    const i = parseVoiceIntent("10 cartons add karo", mockProducts, "hi-IN");
    expect(i.action).toBe("ADD");
    expect(i.quantity).toBe(10);
    expect(i.tradeUnit).toBe("carton");
  });

  it("tel ka stock kitna hai (how much oil stock)", () => {
    const i = parseVoiceIntent("tel ka stock kitna hai", mockProducts, "hi-IN");
    expect(["CHECK", "QUERY"]).toContain(i.action);
    expect(i.matchedProduct?.id).toBe(1002); // Oil, not rice!
  });

  it("namak teen bag aaya (3 bags of salt arrived)", () => {
    const i = parseVoiceIntent("namak teen bag aaya", mockProducts, "hi-IN");
    expect(i.action).toBe("ADD");
    expect(i.quantity).toBe(3);
    expect(i.matchedProduct?.id).toBe(1004);
  });
});

// ─── Telugu / Tenglish ──────────────────────────────────────────────────────

describe("Telugu / Tenglish Code-Mixed Commands", () => {
  it("Rice stock check cheyyi", () => {
    const i = parseVoiceIntent("Rice stock check cheyyi", mockProducts, "te-IN");
    expect(["CHECK", "QUERY"]).toContain(i.action);
    expect(i.matchedProduct?.id).toBe(1001);
  });

  it("Sugar rendu bags add cheyyi (add 2 bags sugar)", () => {
    const i = parseVoiceIntent("Sugar rendu bags add cheyyi", mockProducts, "te-IN");
    expect(i.action).toBe("ADD");
    expect(i.quantity).toBe(2);
    expect(i.tradeUnit).toBe("bag");
    expect(i.matchedProduct).toBeDefined(); // sugar matched
  });

  it("Fortune oil aaidu cartons add chesuko (add 5 cartons oil)", () => {
    const i = parseVoiceIntent("Fortune oil aaidu cartons add chesuko", mockProducts, "te-IN");
    expect(i.action).toBe("ADD");
    expect(i.quantity).toBe(5);
    expect(i.matchedProduct?.id).toBe(1002);
    expect(i.tradeUnit).toBe("carton");
  });

  it("Lux soap rendu dozen ammesanu (sold 2 dozen soap)", () => {
    const i = parseVoiceIntent("Lux soap rendu dozen ammesanu", mockProducts, "te-IN");
    expect(["SELL", "REMOVE"]).toContain(i.action);
    expect(i.quantity).toBe(2);
    expect(i.matchedProduct?.id).toBe(1003);
  });

  it("atta moodu bags add cheyyi (add 3 bags atta)", () => {
    const i = parseVoiceIntent("atta moodu bags add cheyyi", mockProducts, "te-IN");
    expect(i.action).toBe("ADD");
    expect(i.quantity).toBe(3);
    expect(i.matchedProduct?.id).toBe(1005);
  });
});

// ─── Tamil / Tanglish ───────────────────────────────────────────────────────

describe("Tamil / Tanglish Code-Mixed Commands", () => {
  it("rice stock check pannu (check rice stock)", () => {
    const i = parseVoiceIntent("rice stock check pannu", mockProducts, "ta-IN");
    expect(["CHECK", "QUERY"]).toContain(i.action);
    expect(i.matchedProduct?.id).toBe(1001);
  });

  it("ennai irandu carton add pannu (add 2 cartons oil)", () => {
    const i = parseVoiceIntent("ennai irandu carton add pannu", mockProducts, "ta-IN");
    expect(i.action).toBe("ADD");
    expect(i.quantity).toBe(2);
    expect(i.matchedProduct?.id).toBe(1002);
  });
});

// ─── Compound Sentence Voice Parsing ────────────────────────────────────────

describe("Compound Sentence Parsing", () => {
  it("parses multi-item sentence: Rice 135 bags, sugar 50 kg", () => {
    const compound = parseCompoundVoiceIntents("Rice 135 bags, sugar 50 kg", mockProducts, "en-IN");
    expect(compound.length).toBe(2);
    expect(compound[0].quantity).toBe(135);
    expect(compound[1].quantity).toBe(50);
  });
});

// ─── Reorder Level Configuration by Voice ───────────────────────────────────

describe("Reorder Level Voice Command", () => {
  it("Set rice reorder level to 20 bags", () => {
    const i = parseVoiceIntent("Set rice reorder level to 20 bags", mockProducts, "en-IN");
    expect(i.action).toBe("SET_REORDER_LEVEL");
    expect(i.targetThreshold).toBe(20);
    expect(i.matchedProduct?.id).toBe(1001);
  });
});

// ─── Out-of-Stock Guard Detection ───────────────────────────────────────────

describe("Out of Stock Guard Detection", () => {
  it("detects insufficient stock when selling more than available", () => {
    // mockProducts[0] has 250 kg = 5 bags of 50 kg. User asks to sell 50 bags.
    const i = parseVoiceIntent("Sold 50 bags Basmati Rice", mockProducts, "en-IN");
    expect(i.action).toBe("SELL");
    expect(i.insufficientStock).toBeDefined();
    expect(i.insufficientStock?.availableTradeUnits).toBe(5);
    expect(i.insufficientStock?.requestedTradeUnits).toBe(50);
  });
});

// ─── No false defaults ──────────────────────────────────────────────────────

describe("Robustness — no silent Basmati Rice default", () => {
  it("Generic 'add 5 bags' with no product name → undefined product (must not default to Rice)", () => {
    const i = parseVoiceIntent("add 5 bags", mockProducts, "en-IN");
    expect(i.matchedProduct).toBeUndefined();
  });

  it("Oil spoken as 'tel' → matches Oil not Rice", () => {
    const i = parseVoiceIntent("2 carton tel aaya", mockProducts, "hi-IN");
    expect(i.matchedProduct?.id).toBe(1002);
  });
});

// ─── Trade Unit Conversion ──────────────────────────────────────────────────

describe("Trade Unit Conversion Engine", () => {
  it("converts trade units to base units accurately", () => {
    expect(convertTradeToBase(5, 50)).toBe(250);
    expect(convertTradeToBase(2, 24)).toBe(48);
  });

  it("formats stock nicely for trade users", () => {
    const formatted = formatStockInTradeUnits(250, "kg", "bag", 50);
    expect(formatted).toBe("5 Bags (250 kg)");
  });
});
