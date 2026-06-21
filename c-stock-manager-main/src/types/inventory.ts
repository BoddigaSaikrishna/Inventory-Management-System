export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: string;
  createdAt: string;
}

export type SortField = "price" | "quantity" | "name" | "id";
export type SortOrder = "asc" | "desc";
