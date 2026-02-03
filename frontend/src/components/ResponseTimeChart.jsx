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
          <Area dataKey="ms" stroke="#38bdf8" fill="#0ea5e9" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
