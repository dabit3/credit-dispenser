"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Clock, PackageOpen, TrendingUp } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
}

function formatPercent(rate: number | null): string {
  return rate == null ? "—" : `${Math.round(rate * 100)}%`;
}

function formatForecast(
  daysToDepletion: number | null,
  projectedDepletion: number | null,
  remaining: number
): string {
  if (remaining <= 0) return "Depleted";
  if (daysToDepletion == null || projectedDepletion == null) return "No activity";
  const label = new Date(projectedDepletion).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const days = Math.max(1, Math.round(daysToDepletion));
  return `~${label} (${days}d)`;
}

const trendConfig = {
  cumulative: { label: "Total claims", color: "var(--chart-1)" },
} satisfies ChartConfig;

const hourlyConfig = {
  claims: { label: "Claims", color: "var(--chart-1)" },
} satisfies ChartConfig;

const redemptionConfig = {
  rate: { label: "Redemption", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function AnalyticsDashboard() {
  const data = useQuery(api.analytics.overview);

  const peakHour = useMemo(() => {
    if (!data) return null;
    let best: { hour: number; claims: number } | null = null;
    for (const h of data.hourly) {
      if (h.claims > 0 && (!best || h.claims > best.claims)) best = h;
    }
    return best;
  }, [data]);

  const redemptionData = useMemo(() => {
    if (!data) return [];
    return data.events
      .filter((e) => e.redemptionRate != null)
      .map((e) => ({
        name: e.name,
        rate: Math.round((e.redemptionRate ?? 0) * 100),
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8);
  }, [data]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow flex items-center gap-2 text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          Control room
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.02em]">
          Analytics
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Claim trends, redemption rates, inventory forecasts, and peak activity
          across your events.
        </p>
      </div>

      {data === undefined ? (
        <LoadingState />
      ) : data.events.length === 0 ? (
        <Empty className="border border-dashed border-border-strong py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BarChart3 />
            </EmptyMedia>
            <EmptyTitle>No data yet</EmptyTitle>
            <EmptyDescription>
              Analytics appear once you have events with codes to claim.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Events"
              value={data.totals.events.toLocaleString()}
            />
            <StatCard
              label="Codes claimed"
              value={data.totals.claimedCodes.toLocaleString()}
              hint={`${formatPercent(data.totals.codeClaimRate)} of pool`}
            />
            <StatCard
              label="Redemption rate"
              value={formatPercent(data.totals.redemptionRate)}
              hint={`${data.totals.eligibleEmails.toLocaleString()} eligible`}
            />
            <StatCard
              label="Codes remaining"
              value={data.totals.remaining.toLocaleString()}
              hint={peakHour ? `Peak ${formatHour(peakHour.hour)}` : undefined}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4 text-muted-dim" aria-hidden />
                Claim trends
              </CardTitle>
              <CardDescription>
                Cumulative codes claimed over time (UTC).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.claimTrend.length === 0 ? (
                <NoActivity />
              ) : (
                <ChartContainer
                  config={trendConfig}
                  className="aspect-auto h-64 w-full"
                >
                  <AreaChart data={data.claimTrend} margin={{ left: 4, right: 4 }}>
                    <defs>
                      <linearGradient id="fillCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-cumulative)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-cumulative)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                      tickFormatter={formatDay}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={32}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => formatDay(String(value))}
                        />
                      }
                    />
                    <Area
                      dataKey="cumulative"
                      type="monotone"
                      stroke="var(--color-cumulative)"
                      strokeWidth={2}
                      fill="url(#fillCumulative)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-muted-dim" aria-hidden />
                  Redemption rate by event
                </CardTitle>
                <CardDescription>
                  Share of eligible participants who claimed a code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {redemptionData.length === 0 ? (
                  <NoActivity text="No events with eligible emails yet." />
                ) : (
                  <ChartContainer
                    config={redemptionConfig}
                    className="aspect-auto h-64 w-full"
                  >
                    <BarChart
                      data={redemptionData}
                      layout="vertical"
                      margin={{ left: 4, right: 16 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        width={110}
                        tickFormatter={(v: string) =>
                          v.length > 16 ? `${v.slice(0, 15)}…` : v
                        }
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent formatter={(v) => `${v}%`} />
                        }
                      />
                      <Bar
                        dataKey="rate"
                        fill="var(--color-rate)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-dim" aria-hidden />
                  Peak activity by hour
                </CardTitle>
                <CardDescription>
                  When codes are claimed, by hour of day (UTC).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.totals.claimedCodes === 0 ? (
                  <NoActivity />
                ) : (
                  <ChartContainer
                    config={hourlyConfig}
                    className="aspect-auto h-64 w-full"
                  >
                    <BarChart data={data.hourly} margin={{ left: 4, right: 4 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="hour"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval={2}
                        tickFormatter={(v: number) => formatHour(v)}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={32}
                        allowDecimals={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(v) => formatHour(Number(v))}
                          />
                        }
                      />
                      <Bar dataKey="claims" radius={3}>
                        {data.hourly.map((h) => (
                          <Cell
                            key={h.hour}
                            fill={
                              peakHour && h.hour === peakHour.hour
                                ? "var(--brand)"
                                : "var(--chart-3)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageOpen className="size-4 text-muted-dim" aria-hidden />
                Inventory forecast
              </CardTitle>
              <CardDescription>
                Codes remaining and projected depletion based on the average
                daily claim rate since the first claim.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Claimed</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Claims / day</TableHead>
                    <TableHead className="text-right">Runs out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.events.map((e) => (
                    <TableRow key={e.eventId}>
                      <TableCell className="font-medium">
                        {e.name}
                        <span className="ml-2 font-mono text-xs text-muted-dim">
                          /{e.slug}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {e.claimedCodes} / {e.totalCodes}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {e.remaining}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {e.dailyRate > 0 ? e.dailyRate.toFixed(1) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {formatForecast(
                          e.daysToDepletion,
                          e.projectedDepletion,
                          e.remaining
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="gap-2">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="eyebrow text-muted-foreground">{label}</span>
          {hint ? (
            <span className="font-mono text-xs text-muted-dim tabular-nums">
              {hint}
            </span>
          ) : null}
        </div>
        <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
      </CardContent>
    </Card>
  );
}

function NoActivity({ text = "No claims recorded yet." }: { text?: string }) {
  return (
    <p className="flex h-64 items-center justify-center rounded-md border border-dashed border-border text-center text-xs text-muted-dim">
      {text}
    </p>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
