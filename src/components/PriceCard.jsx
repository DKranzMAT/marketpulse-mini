export default function PriceCard({ symbol, name, price = 0, change = 0 }) {
  const up = change >= 0;
  return (
    <div className="rounded-2xl shadow-sm border bg-white dark:bg-gray-800 dark:border-gray-700 p-4 flex items-center justify-between">
      <div>
        {/* Company name */}
        <div className="text-xs text-gray-500 dark:text-gray-400">{name}</div>

        {/* Ticker symbol — now fully readable in dark mode */}
        <div className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {symbol}
        </div>
      </div>

      <div className="text-right">
        {/* Price */}
        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
          ${price.toFixed(2)}
        </div>

        {/* Change percent */}
        <div className={up 
          ? "text-green-600 text-sm" 
          : "text-red-600 text-sm"
        }>
          {up ? "▲" : "▼"} {change.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
