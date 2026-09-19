import { Transaction } from "@/types/inventory";
import { History, Mic, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar } from "lucide-react";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onClearHistory?: () => void;
}

const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-12 px-4 text-center">
        <History className="h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-semibold text-foreground">No Stock Transactions Yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Speak natural commands like "Add 5 bags rice" or use manual forms to see real-time voice stock logs here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            Recent Voice & Stock Transactions
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {transactions.length} record{transactions.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3.5 hover:border-emerald-500/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
                  tx.type === "ADD"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : tx.type === "REMOVE"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {tx.type === "ADD" ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : tx.type === "REMOVE" ? (
                  <ArrowDownRight className="h-5 w-5" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-foreground">
                  {tx.productName}
                </p>

                {tx.originalVoiceText && (
                  <p className="text-xs text-emerald-300/80 italic flex items-center gap-1 mt-0.5">
                    <Mic className="h-3 w-3 shrink-0" /> "{tx.originalVoiceText}"
                  </p>
                )}

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Change Badge */}
            <div className="text-right">
              <span
                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                  tx.type === "ADD"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : tx.type === "REMOVE"
                    ? "bg-rose-500/15 text-rose-400"
                    : "bg-blue-500/15 text-blue-400"
                }`}
              >
                {tx.type === "ADD" ? "+" : tx.type === "REMOVE" ? "-" : ""}
                {tx.tradeUnitQuantity} {tx.tradeUnitLabel}
              </span>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                ({tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange} base)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
