import { useState, useCallback, useEffect } from "react";
import type { Product, SortField, SortOrder } from "@/types/inventory";

const STORAGE_KEY = "ims_products";

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function nextId(products: Product[]): number {
  if (products.length === 0) return 1001;
  return Math.max(...products.map((p) => p.id)) + 1;
}

export function useInventory() {
  const [products, setProducts] = useState<Product[]>(loadProducts);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const addProduct = useCallback(
    (data: Omit<Product, "id" | "createdAt">) => {
      const p: Product = {
        ...data,
        id: nextId(products),
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [...prev, p]);
      return p;
    },
    [products]
  );

  const updateProduct = useCallback(
    (id: number, data: Partial<Omit<Product, "id" | "createdAt">>) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
    },
    []
  );

  const deleteProduct = useCallback((id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const searchProducts = useCallback(
    (query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return products;
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.id.toString().includes(q)
      );
    },
    [products]
  );

  const sortProducts = useCallback(
    (field: SortField, order: SortOrder) => {
      return [...products].sort((a, b) => {
        let cmp = 0;
        if (field === "price") cmp = a.price - b.price;
        else if (field === "quantity") cmp = a.quantity - b.quantity;
        else if (field === "name") cmp = a.name.localeCompare(b.name);
        else cmp = a.id - b.id;
        return order === "asc" ? cmp : -cmp;
      });
    },
    [products]
  );

  const getLowStock = useCallback(
    (threshold: number) => {
      return products.filter((p) => p.quantity <= threshold);
    },
    [products]
  );

  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const totalItems = products.reduce((s, p) => s + p.quantity, 0);

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    sortProducts,
    getLowStock,
    totalValue,
    totalItems,
    productCount: products.length,
  };
}
