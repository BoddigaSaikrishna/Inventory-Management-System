import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Product, Transaction } from "@/types/inventory";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    supabaseAnonKey.length > 10
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS CLOUD SYNC
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchProductsFromCloud(): Promise<Product[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data) {
      console.warn("[VoiceStock Supabase] Failed to fetch products:", error);
      return null;
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      quantity: Number(row.quantity),
      baseUnit: row.base_unit,
      tradeUnit: row.trade_unit,
      tradeUnitSize: Number(row.trade_unit_size || 1),
      price: Number(row.price || 0),
      minStockThreshold: Number(row.min_stock_threshold || 10),
      reorderQuantity: Number(row.reorder_quantity || 5),
      supplierName: row.supplier_name,
      supplierPhone: row.supplier_phone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn("[VoiceStock Supabase] Error fetching products:", err);
    return null;
  }
}

export async function upsertProductToCloud(product: Product): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: product.id,
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      base_unit: product.baseUnit,
      trade_unit: product.tradeUnit,
      trade_unit_size: product.tradeUnitSize,
      price: product.price,
      min_stock_threshold: product.minStockThreshold,
      reorder_quantity: product.reorderQuantity,
      supplier_name: product.supplierName || null,
      supplier_phone: product.supplierPhone || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("products").upsert(payload);
    if (error) {
      console.warn("[VoiceStock Supabase] Failed to upsert product:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[VoiceStock Supabase] Error upserting product:", err);
    return false;
  }
}

export async function deleteProductFromCloud(productId: number): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    return !error;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTIONS CLOUD SYNC
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchTransactionsFromCloud(): Promise<Transaction[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error || !data) return null;

    return data.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      type: row.type,
      productId: Number(row.product_id),
      productName: row.product_name,
      quantityChange: Number(row.quantity_change),
      tradeUnitQuantity: Number(row.trade_unit_quantity),
      tradeUnitLabel: row.trade_unit_label,
      remainingStockAfter: row.remaining_stock_after !== null ? Number(row.remaining_stock_after) : undefined,
      price: row.price !== null ? Number(row.price) : undefined,
      originalVoiceText: row.original_voice_text || undefined,
      userConfirmed: row.user_confirmed ?? true,
      notes: row.notes || undefined,
    }));
  } catch {
    return null;
  }
}

export async function insertTransactionToCloud(tx: Transaction): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: tx.id,
      timestamp: tx.timestamp,
      type: tx.type,
      product_id: tx.productId,
      product_name: tx.productName,
      quantity_change: tx.quantityChange,
      trade_unit_quantity: tx.tradeUnitQuantity,
      trade_unit_label: tx.tradeUnitLabel,
      remaining_stock_after: tx.remainingStockAfter ?? null,
      price: tx.price ?? null,
      original_voice_text: tx.originalVoiceText ?? null,
      user_confirmed: tx.userConfirmed,
      notes: tx.notes ?? null,
    };

    const { error } = await supabase.from("transactions").insert(payload);
    return !error;
  } catch {
    return false;
  }
}
