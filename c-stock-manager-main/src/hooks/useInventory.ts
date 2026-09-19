import { useState, useCallback, useEffect } from "react";
import type { Product, Transaction, ParsedVoiceIntent, SortField, SortOrder } from "@/types/inventory";
import { convertTradeToBase, TRADE_UNITS } from "@/lib/tradeUnits";

const PRODUCTS_STORAGE_KEY = "ims_v2_products";
const TRANSACTIONS_STORAGE_KEY = "ims_v2_transactions";

// Force wipe any existing dummy data stored in browser localStorage
const DUMMY_FORCE_CLEARED_KEY = "ims_v2_all_dummy_cleared_v3";
if (localStorage.getItem(DUMMY_FORCE_CLEARED_KEY) !== "true") {
  localStorage.removeItem(PRODUCTS_STORAGE_KEY);
  localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
  localStorage.removeItem("ims_v2_offline_queue");
  localStorage.setItem(DUMMY_FORCE_CLEARED_KEY, "true");
}

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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

      // Record transaction
      const tx: Transaction = {
        id: "tx_" + Date.now(),
        timestamp: new Date().toISOString(),
        type: "ADD",
        productId: p.id,
        productName: p.name,
        quantityChange: p.quantity,
        tradeUnitQuantity: Number((p.quantity / p.tradeUnitSize).toFixed(1)),
        tradeUnitLabel: TRADE_UNITS[p.tradeUnit]?.label || p.tradeUnit,
        userConfirmed: true,
        notes: "New product created",
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

  /**
   * Execute voice intent parsed from Speech-to-Text
   */
  const executeVoiceIntent = useCallback(
    (intent: ParsedVoiceIntent) => {
      if (!intent.matchedProduct || intent.quantity === undefined) return;

      const target = intent.matchedProduct;
      const tradeQty = intent.quantity;
      const unitSize = target.tradeUnitSize || 1;
      const baseQtyChange = tradeQty * unitSize;

      let txType: "ADD" | "REMOVE" | "SET" = "ADD";

      if (intent.action === "ADD") txType = "ADD";
      else if (intent.action === "REMOVE") txType = "REMOVE";
      else if (intent.action === "SET") txType = "SET";

      setProducts((prev) => {
        const existingIndex = prev.findIndex((p) => p.id === target.id);
        let currentBaseQty = target.quantity;

        if (existingIndex >= 0) {
          currentBaseQty = prev[existingIndex].quantity;
        }

        let newBaseQty = currentBaseQty;
        if (txType === "ADD") {
          newBaseQty = currentBaseQty + baseQtyChange;
        } else if (txType === "REMOVE") {
          newBaseQty = Math.max(0, currentBaseQty - baseQtyChange);
        } else if (txType === "SET") {
          newBaseQty = baseQtyChange;
        }

        if (existingIndex >= 0) {
          return prev.map((p, idx) =>
            idx === existingIndex
              ? { ...p, quantity: newBaseQty, updatedAt: new Date().toISOString() }
              : p
          );
        } else {
          // Add brand new product directly with calculated quantity
          const newProduct: Product = {
            ...target,
            quantity: newBaseQty,
            createdAt: target.createdAt || new Date().toISOString(),
          };
          return [newProduct, ...prev];
        }
      });

      // Log audit transaction
      const tx: Transaction = {
        id: "tx_" + Date.now(),
        timestamp: new Date().toISOString(),
        type: txType,
        productId: target.id,
        productName: target.name,
        quantityChange: txType === "REMOVE" ? -baseQtyChange : baseQtyChange,
        tradeUnitQuantity: tradeQty,
        tradeUnitLabel: TRADE_UNITS[intent.tradeUnit || target.tradeUnit]?.label || intent.tradeUnit || "unit",
        originalVoiceText: intent.rawText,
        userConfirmed: true,
      };

      setTransactions((prev) => [tx, ...prev]);
    },
    []
  );

  const getLowStockProducts = useCallback(() => {
    return products.filter((p) => p.quantity <= p.minStockThreshold);
  }, [products]);

  // Inventory value calculations
  const totalValue = products.reduce((s, p) => {
    const tradeUnitsCount = p.tradeUnitSize > 0 ? p.quantity / p.tradeUnitSize : p.quantity;
    return s + p.price * tradeUnitsCount;
  }, 0);

  const totalItemsCount = products.length;
  const lowStockCount = getLowStockProducts().length;

  const clearAllData = useCallback(() => {
    setProducts([]);
    setTransactions([]);
    localStorage.removeItem(PRODUCTS_STORAGE_KEY);
    localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
    localStorage.removeItem("ims_v2_offline_queue");
  }, []);

  return {
    products,
    transactions,
    addProduct,
    updateProduct,
    deleteProduct,
    clearAllData,
    executeVoiceIntent,
    getLowStockProducts,
    totalValue,
    totalItemsCount,
    lowStockCount,
  };
}
