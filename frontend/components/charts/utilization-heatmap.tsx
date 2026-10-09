'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Flame, Clock, Layers } from 'lucide-react';

interface HeatmapRow {
  day: string;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  s5: number;
  s6: number;
  s7: number;
  [key: string]: string | number;
}

interface UtilizationHeatmapProps {
  data: HeatmapRow[];
}

const SLOTS = [
  { id: 's1', label: 'Slot 1', time: '09:00 - 10:00' },
  { id: 's2', label: 'Slot 2', time: '10:00 - 11:00' },
  { id: 's3', label: 'Slot 3', time: '11:15 - 12:15' },
  { id: 's4', label: 'Slot 4', time: '12:15 - 13:15' },
  { id: 's5', label: 'Slot 5', time: '14:00 - 15:00' },
  { id: 's6', label: 'Slot 6', time: '15:00 - 16:00' },
  { id: 's7', label: 'Slot 7', time: '16:15 - 17:15' },
];

function getIntensityClass(val: number) {
  if (val >= 95) return 'bg-indigo-700 text-white ring-1 ring-indigo-800';
  if (val >= 85) return 'bg-indigo-600 text-white';
  if (val >= 70) return 'bg-indigo-400 text-white';
  if (val >= 50) return 'bg-indigo-200 text-indigo-950 font-semibold';
  return 'bg-slate-100 text-slate-600';
}

export function UtilizationHeatmap({ data }: UtilizationHeatmapProps) {
  const [activeView, setActiveView] = useState<'matrix' | 'barchart'>('matrix');

  // Compute average utilization per slot across days
  const averageBySlot = SLOTS.map((slot) => {
    const total = data.reduce((acc, row) => acc + (Number(row[slot.id]) || 0), 0);
    const avg = data.length > 0 ? Math.round(total / data.length) : 0;
    return {
      slot: slot.label,
      time: slot.time,
      utilization: avg,
    };
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-foreground">
              Peak-Hour Room & Slot Utilization
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hourly capacity load across academic facilities and classroom allocations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveView('matrix')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'matrix'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Heatmap Grid
          </button>
          <button
            onClick={() => setActiveView('barchart')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'barchart'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Hourly Load Chart
          </button>
        </div>
      </div>

      {activeView === 'matrix' ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2.5 text-left font-bold text-muted-foreground w-20">
                    Day
                  </th>
                  {SLOTS.map((slot) => (
                    <th key={slot.id} className="p-2 text-center font-bold text-foreground min-w-[72px]">
                      <div>{slot.label}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">{slot.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.map((row) => (
                  <tr key={row.day} className="hover:bg-muted/10 transition-colors">
                    <td className="p-2.5 font-bold text-foreground">{row.day}</td>
                    {SLOTS.map((slot) => {
                      const val = Number(row[slot.id]) || 0;
                      return (
                        <td key={slot.id} className="p-1.5 text-center">
                          <div
                            className={`py-2 px-1 rounded-xl transition-transform hover:scale-105 cursor-default ${getIntensityClass(
                              val
                            )}`}
                            title={`${row.day} ${slot.label} (${slot.time}): ${val}% utilization`}
                          >
                            <span className="font-bold text-xs">{val}%</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border gap-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Lunch Break: 13:15 - 14:00 (0% allocation)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Utilization:</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">&lt;50%</span>
              <span className="px-2 py-0.5 rounded bg-indigo-200 text-indigo-950">50-69%</span>
              <span className="px-2 py-0.5 rounded bg-indigo-400 text-white">70-84%</span>
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white">85-94%</span>
              <span className="px-2 py-0.5 rounded bg-indigo-700 text-white font-bold">95%+ Peak</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={averageBySlot} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-card border border-border p-2.5 rounded-xl shadow-md text-xs">
                        <p className="font-bold text-foreground">{item.slot} ({item.time})</p>
                        <p className="text-primary font-semibold mt-0.5">
                          Avg Load: {item.utilization}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="utilization" radius={[6, 6, 0, 0]}>
                {averageBySlot.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.utilization >= 90
                        ? '#4338CA'
                        : entry.utilization >= 75
                        ? '#4F46E5'
                        : entry.utilization >= 50
                        ? '#818CF8'
                        : '#C7D2FE'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
