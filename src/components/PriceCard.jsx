export default function PriceCard({ symbol, name, price = 0, change = 0 }) {
  const up = change >= 0;
  return (
    <div className="rounded-2xl shadow-sm border bg-white p-4 flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-500">{name}</div>
        <div className="text-xl font-semibold tracking-tight">{symbol}</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-medium">${price.toFixed(2)}</div>
        <div className={up ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
          {up ? "▲" : "▼"} {change.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
