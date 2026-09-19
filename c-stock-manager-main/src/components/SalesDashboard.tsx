import { useState, useMemo } from "react";
import type { Transaction, Product, TimeFilter } from "@/types/inventory";
import { formatStockInTradeUnits, TRADE_UNITS } from "@/lib/tradeUnits";
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Clock,
  Search,
  Volume2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SalesDashboardProps {
  transactions: Transaction[];
  products: Product[];
  lowStockCount: number;
  onSpeakText: (text: string) => void;
  onAskVoiceSalesQuery?: (query: string) => void;
}

export const SalesDashboard = ({
  transactions,
  products,
  lowStockCount,
  onSpeakText,
}: SalesDashboardProps) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("TODAY");
  const [searchQuery, setSearchQuery] = useState("");
  const [salesQueryText, setSalesQueryText] = useState("");
  const [queryAnswer, setQueryAnswer] = useState<string | null>(null);

  // Filter sales transactions
  const salesTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.type === "SELL" || (t.type === "REMOVE" && t.quantityChange < 0)
    );
  }, [transactions]);

  // Apply time filter
  const timeFilteredTransactions = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); // Start of today

    if (timeFilter === "WEEK") {
      cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    } else if (timeFilter === "MONTH") {
      cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    }

    return salesTransactions.filter((t) => new Date(t.timestamp).getTime() >= cutoff);
  }, [salesTransactions, timeFilter]);

  // Search filtered
  const displayTransactions = useMemo(() => {
    let list = [...timeFilteredTransactions];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.productName.toLowerCase().includes(q) ||
          (t.originalVoiceText && t.originalVoiceText.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [timeFilteredTransactions, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalRevenue = timeFilteredTransactions.reduce((acc, t) => acc + (t.price || 0), 0);
    const totalItemsSold = timeFilteredTransactions.reduce((acc, t) => acc + (t.tradeUnitQuantity || 0), 0);
    const transactionCount = timeFilteredTransactions.length;

    return {
      totalRevenue,
      totalItemsSold: Number(totalItemsSold.toFixed(1)),
      transactionCount,
    };
  }, [timeFilteredTransactions]);

  // Handler for sales questions like "How much sugar did I sell today?"
  const handleAnswerSalesQuery = (query: string) => {
    if (!query.trim()) return;
    const lower = query.toLowerCase();

    // Find if a specific product is mentioned
    const matchedProduct = products.find((p) => lower.includes(p.name.toLowerCase()));

    if (matchedProduct) {
      const matchedSales = timeFilteredTransactions.filter((t) => t.productId === matchedProduct.id);
      const totalQty = matchedSales.reduce((sum, t) => sum + t.tradeUnitQuantity, 0);
      const totalRev = matchedSales.reduce((sum, t) => sum + (t.price || 0), 0);
      const unitLabel = TRADE_UNITS[matchedProduct.tradeUnit]?.label || matchedProduct.tradeUnit;

      const answer = `You sold ${totalQty} ${unitLabel} of ${matchedProduct.name} ${
        timeFilter === "TODAY" ? "today" : timeFilter === "WEEK" ? "this week" : "this month"
      } for ₹${totalRev.toLocaleString("en-IN")}.`;

      setQueryAnswer(answer);
      onSpeakText(answer);
    } else {
      // General sales overview
      const answer = `In total, you sold ${metrics.totalItemsSold} items across ${metrics.transactionCount} sales ${
        timeFilter === "TODAY" ? "today" : timeFilter === "WEEK" ? "this week" : "this month"
      }, totaling ₹${metrics.totalRevenue.toLocaleString("en-IN")}.`;

      setQueryAnswer(answer);
      onSpeakText(answer);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 p-5 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              Sales & Stock-Out Dashboard
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Auto-Voice Logged
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 font-medium">
            Real-time track of customer purchases, sales revenue & outgoing stock
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-border">
          <button
            onClick={() => setTimeFilter("TODAY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === "TODAY"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeFilter("WEEK")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === "WEEK"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeFilter("MONTH")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === "MONTH"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* 4 Sales Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Sales Value */}
        <div className="rounded-2xl border border-border bg-slate-900/80 p-4 shadow-md hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {timeFilter === "TODAY" ? "Today's" : timeFilter === "WEEK" ? "Week's" : "Month's"} Sales
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white mt-2 font-mono">
            ₹{metrics.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-indigo-300 mt-0.5 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Recorded from voice commands
          </span>
        </div>

        {/* Items Sold */}
        <div className="rounded-2xl border border-border bg-slate-900/80 p-4 shadow-md hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Items Sold
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-2 font-mono">
            {metrics.totalItemsSold}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Trade units dispatched
          </span>
        </div>

        {/* Total Transactions */}
        <div className="rounded-2xl border border-border bg-slate-900/80 p-4 shadow-md hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Transactions
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-foreground mt-2 font-mono">
            {metrics.transactionCount}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Customer sales logged
          </span>
        </div>

        {/* Low Stock Items Watch */}
        <div className="rounded-2xl border border-border bg-slate-900/80 p-4 shadow-md hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Low Stock Watch
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-400 mt-2 font-mono">
            {lowStockCount}
          </p>
          <span className="text-[11px] text-amber-400/80 mt-0.5 block">
            Items near or below reorder level
          </span>
        </div>
      </div>

      {/* Voice Sales Query Widget */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Ask Sales Assistant
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Try:
            <button
              onClick={() => {
                setSalesQueryText("How much sugar did I sell today?");
                handleAnswerSalesQuery("How much sugar did I sell today?");
              }}
              className="text-indigo-400 hover:underline"
            >
              "How much sugar did I sell today?"
            </button>
            •
            <button
              onClick={() => {
                setSalesQueryText("How many eggs sold?");
                handleAnswerSalesQuery("How many eggs sold?");
              }}
              className="text-indigo-400 hover:underline"
            >
              "Eggs sold?"
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={salesQueryText}
            onChange={(e) => setSalesQueryText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAnswerSalesQuery(salesQueryText);
            }}
            placeholder="Ask anything about sales (e.g. 'How much sugar did I sell today?')..."
            className="bg-slate-950 border-indigo-500/30 text-foreground text-xs h-10"
          />
          <Button
            size="sm"
            onClick={() => handleAnswerSalesQuery(salesQueryText)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-4 shrink-0"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Ask
          </Button>
        </div>

        {queryAnswer && (
          <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Assistant Response
              </span>
              <p className="text-sm font-semibold text-white">
                {queryAnswer}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onSpeakText(queryAnswer)}
              className="h-8 w-8 text-indigo-300 hover:text-white hover:bg-indigo-500/20 shrink-0"
              title="Speak Again"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Sales Transaction Activity Timeline */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">
              Sales History & Stock Deductions ({displayTransactions.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              ({timeFilter === "TODAY" ? "Today" : timeFilter === "WEEK" ? "Last 7 Days" : "Last 30 Days"})
            </span>
          </div>

          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sales transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-slate-900 border-border text-xs text-foreground"
            />
          </div>
        </div>

        {displayTransactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center bg-slate-900/40">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">
              No sales recorded for this time period.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Speak into the microphone to record a sale: <span className="text-indigo-400 italic">"Sold 5 kg sugar"</span>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-slate-900/80 shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-950/60 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">Quantity Sold</th>
                  <th className="px-4 py-3 text-right font-semibold">Stock Remaining</th>
                  <th className="px-4 py-3 text-right font-semibold">Sales Amount (₹)</th>
                  <th className="px-4 py-3 text-left font-semibold">Spoken Voice Quote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displayTransactions.map((tx) => {
                  const date = new Date(tx.timestamp);
                  const timeFormatted = date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const dateFormatted = date.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground block">{timeFormatted}</span>
                        <span className="text-[10px] text-slate-500">{dateFormatted}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-foreground block">{tx.productName}</span>
                        <span className="text-[10px] text-muted-foreground">ID: #{tx.productId}</span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-400">
                        -{tx.tradeUnitQuantity} {tx.tradeUnitLabel}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {tx.remainingStockAfter !== undefined ? (
                          <span className="text-slate-300 font-semibold">
                            {tx.remainingStockAfter} base units
                          </span>
                        ) : (
                          "Recorded"
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        ₹{(tx.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-xs italic text-slate-400">
                        {tx.originalVoiceText ? (
                          <span className="inline-flex items-center gap-1 text-indigo-300">
                            "{tx.originalVoiceText}"
                          </span>
                        ) : (
                          <span className="text-slate-600">Manual Entry</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;
