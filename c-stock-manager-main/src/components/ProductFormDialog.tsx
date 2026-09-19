import { useState } from "react";
import type { Product, BaseUnit, TradeUnitKey } from "@/types/inventory";
import { TRADE_UNITS } from "@/lib/tradeUnits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Product, "id" | "createdAt">) => void;
  product?: Product | null;
}

const CATEGORIES = [
  "Food Grains & Pulses",
  "Oil & Ghee",
  "Spices & Tea",
  "Snacks & Beverages",
  "Soaps & Detergents",
  "Dairy & Bakery",
  "General Trade",
  "Other",
];

const ProductFormDialog = ({ open, onClose, onSubmit, product }: ProductFormDialogProps) => {
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0]);
  const [baseUnit, setBaseUnit] = useState<BaseUnit>(product?.baseUnit ?? "kg");
  const [tradeUnit, setTradeUnit] = useState<TradeUnitKey>(product?.tradeUnit ?? "bag");
  const [tradeUnitSize, setTradeUnitSize] = useState(product?.tradeUnitSize?.toString() ?? "50");
  const [quantity, setQuantity] = useState(product?.quantity?.toString() ?? "100");
  const [price, setPrice] = useState(product?.price?.toString() ?? "2500");
  const [minStockThreshold, setMinStockThreshold] = useState(product?.minStockThreshold?.toString() ?? "30");
  const [reorderQuantity, setReorderQuantity] = useState(product?.reorderQuantity?.toString() ?? "5");
  const [supplierName, setSupplierName] = useState(product?.supplierName ?? "");
  const [supplierPhone, setSupplierPhone] = useState(product?.supplierPhone ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!product;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!quantity || parseFloat(quantity) < 0) e.quantity = "Must be ≥ 0";
    if (!price || parseFloat(price) < 0) e.price = "Must be ≥ 0";
    if (!tradeUnitSize || parseFloat(tradeUnitSize) <= 0) e.tradeUnitSize = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      category,
      baseUnit,
      tradeUnit,
      tradeUnitSize: parseFloat(tradeUnitSize) || 1,
      quantity: parseFloat(quantity) || 0,
      price: parseFloat(price) || 0,
      minStockThreshold: parseFloat(minStockThreshold) || 10,
      reorderQuantity: parseFloat(reorderQuantity) || 1,
      supplierName: supplierName.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-border text-foreground sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-bold">
            {isEdit ? "Update Product Details" : "Add New Inventory Item"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Configure product trade units (bags, cartons, kg) for automatic voice processing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs text-muted-foreground">Product Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Basmati Rice (बासमती चावल)"
                className="bg-slate-950 border-border text-sm"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-slate-950 px-3 text-xs text-foreground"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-border/50">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Base Unit</Label>
              <select
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value as BaseUnit)}
                className="w-full h-8 rounded-md border border-border bg-slate-900 px-2 text-xs text-foreground"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="litre">Litres (L)</option>
                <option value="piece">Pieces (pcs)</option>
                <option value="packet">Packets (pkt)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Trade Unit</Label>
              <select
                value={tradeUnit}
                onChange={(e) => setTradeUnit(e.target.value as TradeUnitKey)}
                className="w-full h-8 rounded-md border border-border bg-slate-900 px-2 text-xs text-foreground"
              >
                {Object.entries(TRADE_UNITS).map(([k, cfg]) => (
                  <option key={k} value={k}>{cfg.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Unit Size Ratio</Label>
              <Input
                type="number"
                min="0.1"
                step="any"
                value={tradeUnitSize}
                onChange={(e) => setTradeUnitSize(e.target.value)}
                placeholder="e.g. 50"
                className="bg-slate-900 border-border font-mono h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Initial Stock ({baseUnit})</Label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-slate-950 border-border font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Price per Trade Unit (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-slate-950 border-border font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reorder Threshold ({baseUnit})</Label>
              <Input
                type="number"
                min="0"
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
                className="bg-slate-950 border-border font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reorder Qty ({tradeUnit})</Label>
              <Input
                type="number"
                min="1"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value)}
                className="bg-slate-950 border-border font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Supplier Name (Optional)</Label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Lakshmi Traders"
                className="bg-slate-950 border-border text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Supplier Phone (Optional)</Label>
              <Input
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="bg-slate-950 border-border text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">
              {isEdit ? "Save Product Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
