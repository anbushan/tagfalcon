"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export type LineDatum = { name: string; value: number };

export default function InsightLineChart({
  data,
  color = "#FF0000",
  height = 220,
}: {
  data: LineDatum[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-yt-border" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400" axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400" axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
