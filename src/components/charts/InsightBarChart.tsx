"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export type BarDatum = { name: string; value: number };

export default function InsightBarChart({
  data,
  color = "#FF0000",
  height = 220,
  colorByIndex,
}: {
  data: BarDatum[];
  color?: string;
  height?: number;
  colorByIndex?: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-yt-border" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-gray-500 dark:text-gray-400"
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400" axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell key={i} fill={colorByIndex?.[i] || color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
