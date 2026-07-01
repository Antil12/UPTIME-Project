import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { useTheme } from "../contexts/ThemeContext";

export default function ResponseTimeChart({ data }) {
  const { currentTheme } = useTheme();

  return (
    <div style={{
      background: currentTheme.bgCard,
      border: `1px solid ${currentTheme.borderAccent}`,
      borderRadius: "16px",
      padding: "20px",
      backdropFilter: "blur(18px)",
    }}>
      <h3 style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "14px",
        fontWeight: 700,
        color: currentTheme.text,
        marginBottom: "16px",
        letterSpacing: "0.04em",
      }}>
        Response Time (24h)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: currentTheme.textMuted, fontFamily: "JetBrains Mono" }}
            axisLine={false} 
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: currentTheme.textMuted, fontFamily: "JetBrains Mono" }}
            axisLine={false} 
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{
              background: currentTheme.bgCard,
              border: `1px solid ${currentTheme.borderAccent}`,
              borderRadius: "8px",
              color: currentTheme.text,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
            }}
          />
          <Area 
            dataKey="ms" 
            stroke={currentTheme.accent} 
            fill={`${currentTheme.accent}35`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
