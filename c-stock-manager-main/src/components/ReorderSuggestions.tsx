import { Product } from "@/types/inventory";
import { TRADE_UNITS, formatStockInTradeUnits } from "@/lib/tradeUnits";
import { AlertTriangle, ShoppingCart, Phone, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReorderSuggestionsProps {
  lowStockProducts: Product[];
  onSpeakSummary?: (text: string) => void;
}

const ReorderSuggestions = ({ lowStockProducts, onSpeakSummary }: ReorderSuggestionsProps) => {
  if (lowStockProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950/20 py-10 px-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
        <p className="text-base font-bold text-foreground">All Stock Levels Healthy!</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          No items currently need reordering. Low stock thresholds are monitored automatically in real time.
        </p>
      </div>
    );
  }

  const totalReorderEstCost = lowStockProducts.reduce(
    (sum, p) => sum + p.price * p.reorderQuantity,
    0
  );

  const handleSendWhatsAppOrder = () => {
    let text = "📦 *Reorder Request - Inventory System*\n\nPlease arrange stock for the following items:\n\n";
    lowStockProducts.forEach((p, idx) => {
      text += `${idx + 1}. *${p.name}*: Order ${p.reorderQuantity} ${TRADE_UNITS[p.tradeUnit]?.label} (Est: ₹${(p.price * p.reorderQuantity).toFixed(2)})\n`;
    });
    text += `\n*Total Estimated Cost*: ₹${totalReorderEstCost.toFixed(2)}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleSpeakList = () => {
    let summaryText = `You have ${lowStockProducts.length} items low on stock. `;
    lowStockProducts.forEach((p) => {
      summaryText += `${p.name} needs ${p.reorderQuantity} ${TRADE_UNITS[p.tradeUnit]?.hindiLabel.split(" ")[0]}. `;
    });
    onSpeakSummary?.(summaryText);
  };

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 to-slate-900 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {lowStockProducts.length} Item{lowStockProducts.length !== 1 ? "s" : ""} Need Reordering
            </h3>
            <p className="text-xs text-muted-foreground">
              Total Estimated Order Cost:{" "}
              <span className="font-mono font-bold text-amber-300">
                ₹{totalReorderEstCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onSpeakSummary && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSpeakList}
              className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10 flex-1 sm:flex-none"
            >
              🔊 Read Aloud
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSendWhatsAppOrder}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex-1 sm:flex-none"
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Share Order on WhatsApp
          </Button>
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lowStockProducts.map((p) => {
          const unitConfig = TRADE_UNITS[p.tradeUnit];
          const stockFormatted = formatStockInTradeUnits(
            p.quantity,
            p.baseUnit,
            p.tradeUnit,
            p.tradeUnitSize
          );

          return (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 hover:border-amber-500/40 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                      Low Stock Alert
                    </span>
                    <h4 className="text-base font-bold text-foreground">{p.name}</h4>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Current Stock</p>
                    <p className="text-sm font-bold font-mono text-destructive">
                      {stockFormatted}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-950/60 p-2.5 text-xs">
                  <div>
                    <span className="text-muted-foreground">Suggested Order:</span>
                    <p className="font-bold text-emerald-400 font-mono">
                      {p.reorderQuantity} {unitConfig?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Cost:</span>
                    <p className="font-bold text-foreground font-mono">
                      ₹{(p.price * p.reorderQuantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {p.supplierName && (
                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                    <span>Supplier: <strong className="text-foreground">{p.supplierName}</strong></span>
                  </div>
                  {p.supplierPhone && (
                    <a
                      href={`tel:${p.supplierPhone}`}
                      className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-mono"
                    >
                      <Phone className="h-3 w-3" /> {p.supplierPhone}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReorderSuggestions;
