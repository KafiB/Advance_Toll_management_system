"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BoothPerformanceItem } from "@/lib/api/reports";

// ─────────────────────────────────────────────────────
//  booth-performance-chart.tsx
//  Bar chart comparing revenue across toll booths.
// ─────────────────────────────────────────────────────

interface BoothPerformanceChartProps {
  data: BoothPerformanceItem[];
}

export function BoothPerformanceChart({ data }: BoothPerformanceChartProps) {
  // Shorten long booth names for the x-axis
  const formatted = data.map((booth) => ({
    ...booth,
    shortName: booth.boothCode,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booth Performance</CardTitle>
        <CardDescription>Revenue comparison across toll booths</CardDescription>
      </CardHeader>
      <CardContent>
        {formatted.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No booth data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                }}
                labelStyle={{ color: "var(--foreground)" }}
                formatter={(value, _name, props) => {
                    const boothName = (props?.payload as BoothPerformanceItem)?.boothName ?? "";
                    return [`${value} BDT`, boothName] as [string, string];
                }}
                />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}