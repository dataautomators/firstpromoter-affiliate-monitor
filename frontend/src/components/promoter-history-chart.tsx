"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  differenceInDays,
  format,
  isWithinInterval,
  parseISO,
  subMonths,
} from "date-fns";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DatePickerWithRange } from "./date-range-picker";
import { HistoryEntry } from "./promoter-history-table";

interface PromoterHistoryChartProps {
  data: HistoryEntry[];
}

const metrics = [
  { key: "unpaid", label: "Unpaid", color: "#8884d8" },
  { key: "referral", label: "Referrals", color: "#82ca9d" },
  { key: "clicks", label: "Clicks", color: "#ffc658" },
  { key: "customers", label: "Customers", color: "#ff7300" },
];

export function PromoterHistoryChart({ data }: PromoterHistoryChartProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [visibleMetrics, setVisibleMetrics] = useState(
    metrics.map((m) => m.key)
  );

  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];

    const sortedData = data
      .filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return isWithinInterval(entryDate, {
          start: dateRange.from!,
          end: dateRange.to!,
        });
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const daysBetween = differenceInDays(dateRange.to, dateRange.from);

    // Store the original date object for tooltip
    return sortedData.map((entry) => ({
      ...entry,
      unpaid: entry.unpaid / 100,
      //   unpaid: new Intl.NumberFormat("en-US", {
      //     style: "currency",
      //     currency: "USD",
      //   }).format(entry.unpaid),
      originalDate: entry.createdAt, // Keep original date for tooltip
      createdAt: parseISO(entry.createdAt).getTime(), // Convert to timestamp for x-axis
    }));
  }, [data, dateRange]);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    const daysBetween =
      dateRange?.from && dateRange?.to
        ? differenceInDays(dateRange.to, dateRange.from)
        : 0;

    if (daysBetween > 365) {
      return format(date, "MMM yyyy");
    } else if (daysBetween > 30) {
      return format(date, "MMM d");
    } else {
      return format(date, "MMM d, HH:mm");
    }
  };

  const formatTooltipDate = (timestamp: number) => {
    return format(new Date(timestamp), "MMM d, yyyy HH:mm");
  };

  const toggleMetric = (metric: string) => {
    setVisibleMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  // Calculate appropriate interval based on data points
  const calculateInterval = () => {
    if (!filteredData.length) return 0;
    const dataPoints = filteredData.length;
    if (dataPoints > 100) return Math.floor(dataPoints / 10);
    if (dataPoints > 50) return Math.floor(dataPoints / 5);
    return 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Historical Performance</CardTitle>
            <CardDescription>Trends of key metrics over time</CardDescription>
          </div>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end space-x-4 mb-4">
          {metrics.map((metric) => (
            <div key={metric.key} className="flex items-center space-x-2">
              <Checkbox
                id={metric.key}
                checked={visibleMetrics.includes(metric.key)}
                onCheckedChange={() => toggleMetric(metric.key)}
              />
              <Label htmlFor={metric.key}>{metric.label}</Label>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={filteredData}
            margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="createdAt"
              type="number"
              domain={["auto", "auto"]}
              tickFormatter={formatXAxis}
              interval={calculateInterval()}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip
              labelFormatter={formatTooltipDate}
              formatter={(value, name) => {
                if (name === "Unpaid") {
                  return [`$${value}`, "Unpaid"];
                }
                return [value, name];
              }}
            />
            <Legend verticalAlign="top" />
            {metrics.map(
              (metric) =>
                visibleMetrics.includes(metric.key) && (
                  <Area
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.key}
                    name={metric.label}
                    stroke={metric.color}
                    fill={metric.color}
                    fillOpacity={0.3}
                  />
                )
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
