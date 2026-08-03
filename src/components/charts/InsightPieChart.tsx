"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export type PieDatum = { name: string; value: number };

const DEFAULT_COLORS = ["#FF0000", "#111827", "#9CA3AF", "#F59E0B", "#3B82F6", "#10B981", "#8B5CF6"];

export default function InsightPieChart({
  data,
  height = 220,
  colors = DEFAULT_COLORS,
}: {
  data: PieDatum[];
  height?: number;
  colors?: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
