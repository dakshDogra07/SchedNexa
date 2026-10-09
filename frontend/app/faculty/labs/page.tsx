'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession, type SessionData } from '@/lib/session';
import type { LabBooking } from '@shared/types';
import { TIME_SLOT_DEFS } from '@/mock/demo-timetable';
import {
  FlaskConical,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Cpu,
  Monitor,
  Wifi,
  Video,
  FileText,
} from 'lucide-react';

const LABS = [
  {
    id: '50000000-0000-0000-0000-000000000005',
    name: 'Lab 1 (Computer Systems Lab)',
    capacity: 30,
    features: 'High-speed LAN, 35 Core-i7 Workstations, Dual Projectors',
  },
  {
    id: '50000000-0000-0000-0000-000000000006',
    name: 'Lab 2 (Advanced Networks & AI Lab)',
    capacity: 30,
    features: 'GPU Compute Server, Gigabit Switches, Linux Workstations',
  },
];

const AVAILABLE_EQUIPMENT = [
  { id: 'lan', label: 'Gigabit LAN Connectivity', icon: Wifi },
  { id: 'projector', label: 'Overhead Projector & Screen', icon: Video },
  { id: 'gpu', label: 'GPU Compute Acceleration Node', icon: Cpu },
  { id: 'dual_screen', label: 'Instructor Dual Monitor Rig', icon: Monitor },
];

export default function FacultyLabBookingPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [bookings, setBookings] = useState<LabBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedLabId, setSelectedLabId] = useState(LABS[0].id);
  const [date, setDate] = useState('2026-10-15');
  const [selectedSlotNo, setSelectedSlotNo] = useState(6); // Default afternoon slot
  const [purpose, setPurpose] = useState('');
  const [equipment, setEquipment] = useState<string[]>(['Gigabit LAN Connectivity']);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadBookings = async (facId?: string) => {
    setLoading(true);
    const res = await api.call('listLabBookings', { facultyId: facId });
    if (res.ok) {
      setBookings(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const s = getSession();
    setSession(s);
    loadBookings(s?.facultyId);
  }, []);

  const toggleEquipment = (label: string) => {
    if (equipment.includes(label)) {
      setEquipment(equipment.filter((item) => item !== label));
    } else {
      setEquipment([...equipment, label]);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.facultyId) return;

    setSubmitting(true);
    setSuccessMessage(null);

    const slotId = `a0000000-0000-0000-0000-${String(selectedSlotNo).padStart(12, '0')}`;

    const res = await api.call('createLabBooking', {
      roomId: selectedLabId,
      facultyId: session.facultyId,
      date,
      slotId,
      purpose: purpose || 'Ad-hoc Student Project & Practical Work',
      equipment,
    });

    setSubmitting(false);

    if (res.ok) {
      const labName = selectedLabId.includes('6') ? 'Lab 2' : 'Lab 1';
      setSuccessMessage(`Booking confirmed successfully for ${labName} on ${date}!`);
      setPurpose('');
      loadBookings(session.facultyId);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-700 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-purple-200" />
            <h1 className="text-2xl font-bold tracking-tight">Ad-hoc Laboratory Booking</h1>
          </div>
          <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
            Reserve departmental computer labs for specialized experiment demonstrations, makeup practicals, and coding evaluations.
          </p>
        </div>

        <button
          onClick={() => loadBookings(session?.facultyId)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {/* Main Layout: Form + Existing Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Booking Request */}
        <div className="lg:col-span-6 bg-card border border-border p-6 rounded-2xl shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">New Lab Reservation</h2>
          </div>

          {successMessage && (
            <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs text-green-900 font-semibold animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
            {/* Lab Choice */}
            <div>
              <label className="font-semibold block mb-1.5 text-foreground">Select Laboratory</label>
              <div className="grid grid-cols-1 gap-2">
                {LABS.map((lab) => (
                  <label
                    key={lab.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                      selectedLabId === lab.id
                        ? 'bg-purple-50/60 border-purple-300 ring-1 ring-purple-400'
                        : 'bg-muted/20 border-border hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="lab"
                      value={lab.id}
                      checked={selectedLabId === lab.id}
                      onChange={() => setSelectedLabId(lab.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-foreground block">{lab.name}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">{lab.features}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date & Period */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-foreground">Reservation Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-foreground">Time Slot</label>
                <select
                  value={selectedSlotNo}
                  onChange={(e) => setSelectedSlotNo(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary cursor-pointer"
                >
                  {TIME_SLOT_DEFS.map((s) => (
                    <option key={s.slotNo} value={s.slotNo}>
                      Slot {s.slotNo} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="font-semibold block mb-1 text-foreground">Academic Purpose</label>
              <input
                type="text"
                placeholder="e.g. Operating Systems Kernel Compilation Lab"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Equipment Checklist */}
            <div>
              <label className="font-semibold block mb-1.5 text-foreground">Equipment & Infrastructure Required</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EQUIPMENT.map((eq) => {
                  const Icon = eq.icon;
                  const isChecked = equipment.includes(eq.label);
                  return (
                    <button
                      type="button"
                      key={eq.id}
                      onClick={() => toggleEquipment(eq.label)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-primary/10 border-primary text-primary font-bold'
                          : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] truncate">{eq.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                <span>{submitting ? 'Confirming Reservation...' : 'Confirm Lab Reservation'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Existing Reservations */}
        <div className="lg:col-span-6 bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">My Active Lab Bookings</h2>
            </div>
            <span className="text-xs text-muted-foreground">{bookings.length} reservations</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-xs">Loading reservation records...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
              <FlaskConical className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p>You have no active ad-hoc lab reservations.</p>
              <p className="text-[11px] text-muted-foreground/80">Use the form to book a lab period.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 bg-muted/20 border border-border rounded-xl space-y-2 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {b.room_id.includes('6') ? 'Lab 2 (Networks/AI)' : 'Lab 1 (Systems)'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      APPROVED
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{b.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Slot period</span>
                    </div>
                  </div>

                  <div className="text-xs text-foreground font-medium flex items-start gap-1.5 pt-1">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{b.purpose}</span>
                  </div>

                  {b.equipment && b.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {b.equipment.map((eq, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-muted/60 text-muted-foreground text-[10px] rounded-md font-medium"
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Policy Notice */}
          <div className="p-3 bg-muted/30 border border-border rounded-xl text-[11px] text-muted-foreground">
            <strong>Lab Usage Guideline:</strong> Ad-hoc lab sessions must conclude 10 minutes prior to the start of scheduled syllabus lab periods to permit workstation resetting.
          </div>
        </div>
      </div>
    </div>
  );
}
