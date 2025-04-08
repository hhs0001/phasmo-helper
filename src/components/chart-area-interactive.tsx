"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "An interactive area chart";

interface TimeFilter {
  value: string;
  label: string;
  days: number;
}

interface DataSeries {
  key: string;
  label: string;
  color: string;
}

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface ChartAreaInteractiveProps {
  data: ChartDataPoint[];
  series: DataSeries[];
  timeFilters: TimeFilter[];
  title?: string;
  description?: string;
  defaultTimeFilter?: string;
  height?: number;
  dateFormat?: Intl.DateTimeFormatOptions;
}

export function ChartAreaInteractive({
  data,
  series,
  timeFilters,
  title = "Chart",
  description = "Data visualization over time",
  defaultTimeFilter,
  height = 250,
  dateFormat = { month: "short", day: "numeric" },
}: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState(
    defaultTimeFilter || timeFilters[0]?.value
  );

  React.useEffect(() => {
    if (isMobile && timeFilters.length > 0) {
      setTimeRange(timeFilters[0].value);
    }
  }, [isMobile, timeFilters]);

  const selectedFilter = timeFilters.find(
    (filter) => filter.value === timeRange
  );

  const filteredData = React.useMemo(() => {
    if (!selectedFilter) return data;

    const referenceDate = new Date(data[data.length - 1]?.date || new Date());
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - selectedFilter.days);

    return data.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [data, selectedFilter]);

  // Transformar as séries em um formato compatível com o ChartConfig
  const chartConfig = React.useMemo(() => {
    return series.reduce((config, serie) => {
      config[serie.key] = {
        label: serie.label,
        color: serie.color,
      };
      return config;
    }, {} as Record<string, { label: string; color: string }>);
  }, [series]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">{description}</span>
          <span className="@[540px]/card:hidden">{description}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            {timeFilters.map((filter) => (
              <ToggleGroupItem key={filter.value} value={filter.value}>
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a time range"
            >
              <SelectValue placeholder={timeFilters[0]?.label} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {timeFilters.map((filter) => (
                <SelectItem
                  key={filter.value}
                  value={filter.value}
                  className="rounded-lg"
                >
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto w-full"
          style={{ height: `${height}px` }}
        >
          <AreaChart data={filteredData}>
            <defs>
              {series.map((serie) => (
                <linearGradient
                  key={serie.key}
                  id={`fill${serie.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={serie.color} stopOpacity={0.8} />
                  <stop
                    offset="95%"
                    stopColor={serie.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", dateFormat);
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString(
                      "en-US",
                      dateFormat
                    );
                  }}
                  indicator="dot"
                />
              }
            />
            {series.map((serie) => (
              <Area
                key={serie.key}
                dataKey={serie.key}
                name={serie.label}
                type="natural"
                fill={`url(#fill${serie.key})`}
                stroke={serie.color}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
