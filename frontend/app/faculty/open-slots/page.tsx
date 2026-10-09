'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getSession } from '@/lib/session';
import { OpenSlotBookingDialog } from '@/components/open-slot-booking-dialog';
import type { OpenSlotView } from '@shared/types';
import {
  Sparkles,
  Clock,
  DoorOpen,
  GraduationCap,
  User,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function FacultyOpenSlotsPage() {
  const [session, setSession] = useState(getSession());
  const [slots, setSlots] = useState<OpenSlotView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<OpenSlotView | null>(null);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  const fetchSlots = async () => {
    setLoading(true);
    const res = await api.call('getOpenSlots', {
      facultyId: session?.facultyId,
      status: 'open',
    });
    if (res.ok) {
      setSlots(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [session?.facultyId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Open Academic Slots Feed
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Classrooms and lecture hours vacated by faculty leave. Claim these slots for your subjects.
          </p>
        </div>

        <Link
          href="/faculty/timetable"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>View My Schedule</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {bookedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between text-xs text-green-800 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Open Academic Slot booked successfully! Timetable has been updated.</span>
          </div>
          <Link
            href="/faculty/timetable"
            className="underline font-bold hover:text-green-900"
          >
            Inspect in Timetable &rarr;
          </Link>
        </div>
      )}

      {/* Slots Feed */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
          Scanning for available Open Academic Slots...
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-3xl text-center space-y-3">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-bold text-base text-foreground">
            No Open Academic Slots Right Now
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            When a colleague marks leave (e.g. Dr. Sharma for his Friday DBMS class), their reserved slot will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="bg-card border border-border hover:border-amber-400 p-6 rounded-2xl shadow-xs transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                      OPEN SLOT
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Originally: {slot.originalSubjectName}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                    {slot.className} &bull; {slot.roomName}
                  </h3>
                </div>

                {slot.score && (
                  <div className="text-right">
                    <div className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300">
                      {slot.score}% Match
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Recommendation Score
                    </span>
                  </div>
                )}
              </div>

              {/* Slot Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Slot {slot.slotNo} ({slot.startTime}–{slot.endTime})
                  </span>
                </div>

                <div className="flex items-center gap-2 font-medium">
                  <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Date: {slot.date}</span>
                </div>

                <div className="flex items-center gap-2 font-medium">
                  <GraduationCap className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Class: {slot.className}</span>
                </div>

                <div className="flex items-center gap-2 font-medium">
                  <User className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Vacated by: {slot.originalFacultyName}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedSlot(slot)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Claim Slot For My Subject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedSlot && session?.facultyId && (
        <OpenSlotBookingDialog
          slot={selectedSlot}
          facultyId={session.facultyId}
          facultyName={session.name}
          onClose={() => setSelectedSlot(null)}
          onBooked={() => {
            setBookedSuccess(true);
            fetchSlots();
          }}
        />
      )}
    </div>
  );
}
