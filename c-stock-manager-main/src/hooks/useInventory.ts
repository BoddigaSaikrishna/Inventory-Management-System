import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  Product,
  Transaction,
  ParsedVoiceIntent,
  LowStockReminder,
  TimeFilter,
} from "@/types/inventory";
import { TRADE_UNITS } from "@/lib/tradeUnits";

const PRODUCTS_STORAGE_KEY = "voicestock_v3_products";
const TRANSACTIONS_STORAGE_KEY = "voicestock_v3_transactions";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO STORE: Sai General Stores (Per Build Prompt Specs)
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_SAI_STORE_PRODUCTS: Product[] = [
  {
    id: 1001,
    name: "Rice",
    category: "Grains & Staples",
    quantity: 135 * 25, // 135 Bags (1 Bag = 25 kg)
    baseUnit: "kg",
    tradeUnit: "bag",
    tradeUnitSize: 25,
    price: 1200,
    minStockThreshold: 20 * 25, // 20 Bags reorder level
    reorderQuantity: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1002,
    name: "Sugar",
    category: "Groceries",
    quantity: 50, // 50 Kg
    baseUnit: "kg",
    tradeUnit: "kg",
    tradeUnitSize: 1,
    price: 45,
    minStockThreshold: 10, // 10 Kg reorder level
    reorderQuantity: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1003,
    name: "Eggs",
    category: "Dairy & Eggs",
    quantity: 13 * 12, // 13 Dozens (1 Dozen = 12 pcs)
    baseUnit: "piece",
    tradeUnit: "dozen",
    tradeUnitSize: 12,
    price: 84,
    minStockThreshold: 5 * 12, // 5 Dozens reorder level
    reorderQuantity: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1004,
    name: "Oil",
    category: "Oils & Ghee",
    quantity: 20 * 12, // 20 Cartons (1 Carton = 12 Litres)
    baseUnit: "litre",
    tradeUnit: "carton",
    tradeUnitSize: 12,
    price: 1800,
    minStockThreshold: 5 * 12, // 5 Cartons reorder level
    reorderQuantity: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1005,
    name: "Biscuits",
    category: "Snacks & Packaged",
    quantity: 30 * 24, // 30 Boxes (1 Box = 24 pkts)
    baseUnit: "packet",
    tradeUnit: "box",
    tradeUnitSize: 24,
    price: 360,
    minStockThreshold: 8 * 24, // 8 Boxes reorder level
    reorderQuantity: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 1006,
    name: "Dal",
    category: "Pulses & Dals",
    quantity: 25, // 25 Kg
    baseUnit: "kg",
    tradeUnit: "kg",
    tradeUnitSize: 1,
    price: 125,
    minStockThreshold: 5, // 5 Kg reorder level
    reorderQuantity: 5,
    createdAt: new Date().toISOString(),
  },
];

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEMO_SAI_STORE_PRODUCTS;
  } catch {
    return DEMO_SAI_STORE_PRODUCTS;
  }
}

function saveProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Initial sample sales transactions for demo
    const now = new Date();
    return [
      {
        id: "tx_demo_1",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        type: "SELL",
        productId: 1002,
        productName: "Sugar",
        quantityChange: -10,
        tradeUnitQuantity: 10,
        tradeUnitLabel: "Kg",
        remainingStockAfter: 40,
        price: 450,
        originalVoiceText: "10 kg sugar sold",
        userConfirmed: true,
      },
      {
        id: "tx_demo_2",
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        type: "SELL",
        productId: 1003,
        productName: "Eggs",
        quantityChange: -5 * 12,
        tradeUnitQuantity: 5,
        tradeUnitLabel: "Dozen (12 pcs)",
        remainingStockAfter: 8 * 12,
        price: 420,
        originalVoiceText: "5 dozens eggs sold",
        userConfirmed: true,
      },
    ];
  } catch {
    return [];
  }
}

function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
}

function nextId(products: Product[]): number {
  if (products.length === 0) return 1001;
  return Math.max(...products.map((p) => p.id)) + 1;
}

export function useInventory() {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  const addProduct = useCallback(
    (data: Omit<Product, "id" | "createdAt">) => {
      const p: Product = {
        ...data,
        id: nextId(products),
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [p, ...prev]);

      const tx: Transaction = {
        id: "tx_" + Date.now(),
        timestamp: new Date().toISOString(),
        type: "ADD",
        productId: p.id,
        productName: p.name,
        quantityChange: p.quantity,
        tradeUnitQuantity: Number((p.quantity / (p.tradeUnitSize || 1)).toFixed(1)),
        tradeUnitLabel: TRADE_UNITS[p.tradeUnit]?.label || p.tradeUnit,
        remainingStockAfter: p.quantity,
        userConfirmed: true,
        notes: "New product added to inventory",
      };
      setTransactions((prev) => [tx, ...prev]);
      return p;
    },
    [products]
  );

  const updateProduct = useCallback(
    (id: number, data: Partial<Omit<Product, "id" | "createdAt">>) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p))
      );
    },
    []
  );

  const deleteProduct = useCallback((id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setProductReorderLevel = useCallback((productId: number, newThresholdInTradeUnits: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newThresholdBase = newThresholdInTradeUnits * (p.tradeUnitSize || 1);
          return { ...p, minStockThreshold: newThresholdBase, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  }, []);

  /**
   * Execute voice intent: ADD, SELL, SET, or SET_REORDER_LEVEL
   */
  const executeVoiceIntent = useCallback(
    (intent: ParsedVoiceIntent) => {
      if (!intent.matchedProduct) return;

      const target = intent.matchedProduct;
      const tradeQty = intent.quantity || 1;
      const unitSize = target.tradeUnitSize || 1;
      const baseQtyChange = tradeQty * unitSize;

      // Handle Reorder Level Configuration by Voice
      if (intent.action === "SET_REORDER_LEVEL" && intent.targetThreshold !== undefined) {
        setProductReorderLevel(target.id, intent.targetThreshold);
        return;
      }

      let txType: "ADD" | "SELL" | "REMOVE" | "SET" = "ADD";
      if (intent.action === "SELL") txType = "SELL";
      else if (intent.action === "REMOVE") txType = "REMOVE";
      else if (intent.action === "SET") txType = "SET";
      else txType = "ADD";

      let finalRemainingStock = 0;

      setProducts((prev) => {
        const existingIndex = prev.findIndex((p) => p.id === target.id);
        let currentBaseQty = target.quantity;

        if (existingIndex >= 0) {
          currentBaseQty = prev[existingIndex].quantity;
        }

        let newBaseQty = currentBaseQty;
        if (txType === "ADD") {
          newBaseQty = currentBaseQty + baseQtyChange;
        } else if (txType === "SELL" || txType === "REMOVE") {
          newBaseQty = Math.max(0, currentBaseQty - baseQtyChange);
        } else if (txType === "SET") {
          newBaseQty = baseQtyChange;
        }

        finalRemainingStock = newBaseQty;

        if (existingIndex >= 0) {
          return prev.map((p, idx) =>
            idx === existingIndex
              ? { ...p, quantity: newBaseQty, updatedAt: new Date().toISOString() }
              : p
          );
        } else {
          const newProduct: Product = {
            ...target,
            quantity: newBaseQty,
            createdAt: target.createdAt || new Date().toISOString(),
          };
          return [newProduct, ...prev];
        }
      });

      // Log transaction
      const tx: Transaction = {
        id: "tx_" + Date.now(),
        timestamp: new Date().toISOString(),
        type: txType,
        productId: target.id,
        productName: target.name,
        quantityChange: (txType === "SELL" || txType === "REMOVE") ? -baseQtyChange : baseQtyChange,
        tradeUnitQuantity: tradeQty,
        tradeUnitLabel: TRADE_UNITS[intent.tradeUnit || target.tradeUnit]?.label || intent.tradeUnit || "unit",
        remainingStockAfter: finalRemainingStock,
        price: (target.price || 0) * tradeQty,
        originalVoiceText: intent.rawText,
        userConfirmed: true,
      };

      setTransactions((prev) => [tx, ...prev]);
    },
    [setProductReorderLevel]
  );

  // Low stock identification
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity <= p.minStockThreshold && p.quantity > 0);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity <= 0);
  }, [products]);

  // Generate automated reminders
  const reminders: LowStockReminder[] = useMemo(() => {
    return [...lowStockProducts, ...outOfStockProducts].map((p) => {
      const currentTrade = Number((p.quantity / (p.tradeUnitSize || 1)).toFixed(1));
      const reorderTrade = Number((p.minStockThreshold / (p.tradeUnitSize || 1)).toFixed(1));
      return {
        id: `rem_${p.id}`,
        productId: p.id,
        productName: p.name,
        currentTradeUnits: currentTrade,
        reorderLevelTradeUnits: reorderTrade,
        tradeUnitLabel: TRADE_UNITS[p.tradeUnit]?.label || p.tradeUnit,
        suggestedReorder: p.reorderQuantity || Math.max(5, reorderTrade),
        timestamp: p.updatedAt || p.createdAt,
        dismissed: false,
      };
    });
  }, [lowStockProducts, outOfStockProducts]);

  // Sales transactions & metrics
  const salesTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === "SELL" || (t.type === "REMOVE" && t.quantityChange < 0));
  }, [transactions]);

  const getSalesMetrics = useCallback(
    (filter: TimeFilter) => {
      const now = new Date();
      let cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); // start of today

      if (filter === "WEEK") {
        cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      } else if (filter === "MONTH") {
        cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      }

      const filtered = salesTransactions.filter(
        (t) => new Date(t.timestamp).getTime() >= cutoff
      );

      const itemsSoldQuantity = filtered.reduce((acc, t) => acc + t.tradeUnitQuantity, 0);
      const totalRevenue = filtered.reduce((acc, t) => acc + (t.price || 0), 0);
      const transactionCount = filtered.length;

      return {
        transactionCount,
        itemsSoldQuantity: Number(itemsSoldQuantity.toFixed(1)),
        totalRevenue,
        filteredTransactions: filtered,
      };
    },
    [salesTransactions]
  );

  // Today's updates count
  const todayUpdatesCount = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return transactions.filter((t) => new Date(t.timestamp) >= todayStart).length;
  }, [transactions]);

  // Reset to Sai General Stores Demo
  const resetToSaiStoreDemo = useCallback(() => {
    setProducts(DEMO_SAI_STORE_PRODUCTS);
    const now = new Date();
    const demoTxs: Transaction[] = [
      {
        id: "tx_init_1",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        type: "SELL",
        productId: 1002,
        productName: "Sugar",
        quantityChange: -10,
        tradeUnitQuantity: 10,
        tradeUnitLabel: "Kg",
        remainingStockAfter: 40,
        price: 450,
        originalVoiceText: "10 kg sugar sold",
        userConfirmed: true,
      },
      {
        id: "tx_init_2",
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        type: "SELL",
        productId: 1003,
        productName: "Eggs",
        quantityChange: -5 * 12,
        tradeUnitQuantity: 5,
        tradeUnitLabel: "Dozen (12 pcs)",
        remainingStockAfter: 8 * 12,
        price: 420,
        originalVoiceText: "5 dozens eggs sold",
        userConfirmed: true,
      },
    ];
    setTransactions(demoTxs);
    saveProducts(DEMO_SAI_STORE_PRODUCTS);
    saveTransactions(demoTxs);
  }, []);

  const clearAllData = useCallback(() => {
    setProducts([]);
    setTransactions([]);
    localStorage.removeItem(PRODUCTS_STORAGE_KEY);
    localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
  }, []);

  return {
    products,
    transactions,
    salesTransactions,
    reminders,
    addProduct,
    updateProduct,
    deleteProduct,
    setProductReorderLevel,
    executeVoiceIntent,
    lowStockProducts,
    outOfStockProducts,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    totalItemsCount: products.length,
    todayUpdatesCount,
    getSalesMetrics,
    resetToSaiStoreDemo,
    clearAllData,
  };
}
