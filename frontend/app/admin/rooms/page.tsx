'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { RoomAvailability, RoomType } from '@shared/types';
import { TIME_SLOT_DEFS } from '@/mock/demo-timetable';
import {
  DoorOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  RefreshCw,
  Info,
} from 'lucide-react';

export default function AdminRoomsPage() {
  const [selectedDate, setSelectedDate] = useState('2026-10-12'); // Default demo Monday
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'classroom' | 'lab'>('all');
  const [availability, setAvailability] = useState<RoomAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAvailability = async (date: string) => {
    setLoading(true);
    const res = await api.call('getRoomAvailability', { date });
    if (res.ok) {
      setAvailability(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const rooms = availability?.rooms ?? [];
  const filteredRooms = rooms.filter((r) => {
    if (roomTypeFilter === 'all') return true;
    return r.roomType === roomTypeFilter;
  });

  // Calculate live statistics
  let totalSlots = 0;
  let freeSlots = 0;
  let busySlots = 0;
  let openSlotsCount = 0;

  filteredRooms.forEach((r) => {
    r.slots.forEach((s) => {
      totalSlots++;
      if (s.state === 'free') freeSlots++;
      else if (s.state === 'busy') busySlots++;
      else if (s.state === 'open') openSlotsCount++;
    });
  });

  const occupancyRate = totalSlots > 0 ? Math.round(((busySlots + openSlotsCount) / totalSlots) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-700 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DoorOpen className="w-6 h-6 text-indigo-200" />
            <h1 className="text-2xl font-bold tracking-tight">Room & Lab Availability Grid</h1>
          </div>
          <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
            Live occupancy matrix across classrooms and labs. Monitor free periods, scheduled lectures, and Open Academic Slots awaiting peer reallocation.
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 self-start md:self-auto">
          <button
            onClick={handlePrevDay}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2 text-xs font-semibold text-white">
            <Calendar className="w-3.5 h-3.5 text-indigo-200" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white border-0 text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Header & KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Date View</span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-base font-bold mt-1 text-foreground truncate">{formattedDate}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{filteredRooms.length} rooms listed</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Utilization</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-foreground">{loading ? '...' : `${occupancyRate}%`}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{busySlots} of {totalSlots} slots active</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Free Slots</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-600">{loading ? '...' : freeSlots}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Available for ad-hoc use</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Open Slots</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-amber-600">{loading ? '...' : openSlotsCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Faculty on leave</div>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Room Type Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Room Type:</span>
          </div>

          <button
            onClick={() => setRoomTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              roomTypeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            All Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setRoomTypeFilter('classroom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              roomTypeFilter === 'classroom'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            Classrooms (4)
          </button>
          <button
            onClick={() => setRoomTypeFilter('lab')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              roomTypeFilter === 'lab'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            Laboratories (2)
          </button>
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
            <span className="text-muted-foreground">Free (Available)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
            <span className="text-muted-foreground">Busy (Scheduled)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-400" />
            <span className="font-semibold text-amber-800">Open Academic Slot</span>
          </div>
        </div>
      </div>

      {/* Availability Grid Matrix */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">Loading room occupancy matrix for {selectedDate}...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No rooms found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="p-3.5 font-bold text-foreground min-w-[140px] sticky left-0 bg-muted/60 z-10 backdrop-blur-xs">
                    Room
                  </th>
                  {TIME_SLOT_DEFS.slice(0, 5).map((s) => (
                    <th key={s.slotNo} className="p-3 font-semibold text-muted-foreground text-center min-w-[125px]">
                      <div>Slot {s.slotNo}</div>
                      <div className="text-[10px] font-normal text-muted-foreground/80">
                        {s.startTime}-{s.endTime}
                      </div>
                    </th>
                  ))}
                  {/* Lunch break divider */}
                  <th className="p-2 font-medium text-muted-foreground text-center bg-muted/70 w-[60px] text-[10px] uppercase tracking-wider">
                    Lunch
                  </th>
                  {TIME_SLOT_DEFS.slice(5).map((s) => (
                    <th key={s.slotNo} className="p-3 font-semibold text-muted-foreground text-center min-w-[125px]">
                      <div>Slot {s.slotNo}</div>
                      <div className="text-[10px] font-normal text-muted-foreground/80">
                        {s.startTime}-{s.endTime}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRooms.map((rm) => (
                  <tr key={rm.roomId} className="hover:bg-muted/10 transition-colors">
                    {/* Room Name Column */}
                    <td className="p-3.5 sticky left-0 bg-card z-10 border-r border-border">
                      <div className="font-bold text-sm text-foreground">{rm.roomName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            rm.roomType === 'lab'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {rm.roomType === 'lab' ? 'Lab (30)' : 'Class (60)'}
                        </span>
                      </div>
                    </td>

                    {/* Morning Slots 1-5 */}
                    {rm.slots.slice(0, 5).map((slot) => (
                      <td key={slot.slotNo} className="p-2 text-center align-middle">
                        <SlotCell slot={slot} />
                      </td>
                    ))}

                    {/* Lunch Break Cell */}
                    <td className="p-1 bg-muted/30 text-center text-[10px] text-muted-foreground font-medium select-none">
                      <div className="writing-vertical text-muted-foreground/60 py-2">Break</div>
                    </td>

                    {/* Afternoon Slots 6-7 */}
                    {rm.slots.slice(5).map((slot) => (
                      <td key={slot.slotNo} className="p-2 text-center align-middle">
                        <SlotCell slot={slot} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helpful Hint */}
      <div className="bg-muted/30 border border-border p-4 rounded-xl text-xs text-muted-foreground flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">Open Academic Slot Notice:</span> Slots marked in amber represent classrooms temporarily vacated due to approved faculty leaves. Faculty members can claim these periods via the Open Academic Slots portal.
        </div>
      </div>
    </div>
  );
}

function SlotCell({ slot }: { slot: { slotNo: number; state: 'free' | 'busy' | 'open'; who: string | null } }) {
  if (slot.state === 'free') {
    return (
      <div className="h-14 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 flex flex-col items-center justify-center p-1.5 text-emerald-800 transition-all hover:bg-emerald-100/60">
        <span className="text-[11px] font-semibold">Available</span>
        <span className="text-[9px] text-emerald-600">Free Slot</span>
      </div>
    );
  }

  if (slot.state === 'open') {
    return (
      <div className="h-14 rounded-xl border border-amber-400 bg-amber-50 flex flex-col items-center justify-center p-1.5 text-amber-900 shadow-xs hover:border-amber-500 transition-all animate-pulse">
        <div className="flex items-center gap-1 font-bold text-[11px] text-amber-800">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>OPEN SLOT</span>
        </div>
        <span className="text-[10px] text-amber-700 font-medium truncate max-w-[110px]" title={slot.who || ''}>
          {slot.who}
        </span>
      </div>
    );
  }

  // Busy
  return (
    <div className="h-14 rounded-xl border border-border bg-slate-50 flex flex-col items-center justify-center p-1.5 text-slate-800 transition-all hover:bg-slate-100">
      <span className="text-[11px] font-bold truncate max-w-[110px]" title={slot.who || ''}>
        {slot.who?.split('(')[0] || 'Scheduled'}
      </span>
      <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[110px]">
        {slot.who?.includes('(') ? `(${slot.who.split('(')[1]}` : 'Occupied'}
      </span>
    </div>
  );
}
