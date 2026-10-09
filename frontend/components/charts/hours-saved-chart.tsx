'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

interface HoursSavedData {
  date: string;
  daily: number;
  cumulative: number;
}

interface OpenSlotRatioItem {
  name: string;
  value: number;
  fill: string;
}

interface WeeklyTrendItem {
  week: string;
  created: number;
  rescued: number;
  lost: number;
}

interface HoursSavedChartProps {
  timeline: HoursSavedData[];
  ratio: OpenSlotRatioItem[];
  weekly: WeeklyTrendItem[];
}

export function HoursSavedChart({ timeline, ratio, weekly }: HoursSavedChartProps) {
  const totalRescued = timeline.length > 0 ? timeline[timeline.length - 1].cumulative : 0;
  const ratioTotal = ratio.reduce((acc, curr) => acc + curr.value, 0);
  const rescuedPercent =
    ratioTotal > 0
      ? Math.round(((ratio.find((r) => r.name.includes('Claimed'))?.value || 0) / ratioTotal) * 100)
      : 80;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cumulative Hours Saved Area Chart (2 cols) */}
      <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-foreground">
                  Cumulative Academic Hours Rescued
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lecture hours preserved via automated peer Open Academic Slot claiming.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-primary">{totalRescued} hrs</span>
              <span className="block text-[11px] font-semibold text-emerald-600 flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3 h-3" /> 100% Zero-Loss
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis unit="h" tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as HoursSavedData;
                      return (
                        <div className="bg-card border border-border p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <p className="font-bold text-foreground">{item.date}</p>
                          <p className="text-primary font-semibold">
                            Total Rescued: {item.cumulative} hrs
                          </p>
                          <p className="text-emerald-600 font-medium">
                            Added Today: +{item.daily} hrs
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCumulative)"
                  name="Cumulative Rescued"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Weekly velocity: <strong>+18 hrs / week</strong></span>
          <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
            View Rescued Lectures &rarr;
          </span>
        </div>
      </div>

      {/* Donut Chart: Open Slots Outcome Ratio (1 col) */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-foreground">
                Open Slots Conversion
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Efficiency ratio of leave openings claimed vs wasted.
            </p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratio}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {ratio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as OpenSlotRatioItem;
                      const pct = Math.round((item.value / ratioTotal) * 100);
                      return (
                        <div className="bg-card border border-border p-2.5 rounded-xl shadow-md text-xs">
                          <p className="font-bold text-foreground">{item.name}</p>
                          <p className="font-semibold text-primary">{item.value} slots ({pct}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center metric */}
            <div className="absolute text-center pointer-events-none">
              <span className="text-xl font-extrabold text-foreground">{rescuedPercent}%</span>
              <span className="block text-[10px] text-muted-foreground font-semibold">Rescued</span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {ratio.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-bold text-foreground">{item.value} slots</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground">
          Zero-waste target: <strong>95%</strong> (Current: {rescuedPercent}%)
        </div>
      </div>
    </div>
  );
}
