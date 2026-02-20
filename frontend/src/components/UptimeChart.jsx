import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function UptimeChart({ data }) {
  return (
    <div className="card">
      <h3>Uptime Overview</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="uptime" stroke="hsl(var(--chart-1))" />
          <Line type="monotone" dataKey="downtime" stroke="hsl(var(--chart-3))" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
