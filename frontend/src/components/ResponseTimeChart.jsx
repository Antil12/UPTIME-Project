import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function ResponseTimeChart({ data }) {
  return (
    <div className="card">
      <h3>Response Time (24h)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Area dataKey="ms" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4) / 0.35)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
