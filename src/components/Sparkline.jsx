import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function Sparkline({ data }) {
  // data: [{t:0, v:number}, ...]
  return (
    <div className="h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
