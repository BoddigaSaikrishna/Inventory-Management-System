import { Package, DollarSign, AlertTriangle, Boxes } from "lucide-react";

interface StatsCardsProps {
  productCount: number;
  totalValue: number;
  totalItems: number;
  lowStockCount: number;
}

const StatsCards = ({ productCount, totalValue, totalItems, lowStockCount }: StatsCardsProps) => {
  const stats = [
    {
      label: "Total Products",
      value: productCount.toString(),
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Inventory Value",
      value: `₹${totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Total Units",
      value: totalItems.toLocaleString(),
      icon: Boxes,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      label: "Low Stock",
      value: lowStockCount.toString(),
      icon: AlertTriangle,
      color: lowStockCount > 0 ? "text-destructive" : "text-success",
      bgColor: lowStockCount > 0 ? "bg-destructive/10" : "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="animate-slide-up rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <div className={`rounded-lg p-2 ${s.bgColor}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
