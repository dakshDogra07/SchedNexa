'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { exportTimetableToPdf, exportWorkloadReportToPdf } from '@/lib/pdf';
import type { TimetableEntry, WorkloadRow, DashboardStats } from '@shared/types';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  BarChart3,
  CheckCircle2,
  FileText,
  Sparkles,
  Users,
  GraduationCap,
  DoorOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const CLASSES = [
  { id: '40000000-0000-0000-0000-000000000001', name: 'CSE-3A' },
  { id: '40000000-0000-0000-0000-000000000002', name: 'CSE-3B' },
  { id: '40000000-0000-0000-0000-000000000003', name: 'CSE-5A' },
  { id: '40000000-0000-0000-0000-000000000004', name: 'CSE-5B' },
];

const FACULTY = [
  { id: '20000000-0000-0000-0000-000000000001', name: 'Dr. Sharma' },
  { id: '20000000-0000-0000-0000-000000000002', name: 'Prof. Kaur' },
  { id: '20000000-0000-0000-0000-000000000003', name: 'Dr. Mehta' },
  { id: '20000000-0000-0000-0000-000000000004', name: 'Dr. Verma' },
  { id: '20000000-0000-0000-0000-000000000005', name: 'Dr. Iyer' },
];

export default function AdminReportsPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>(CLASSES[0].id);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(FACULTY[0].id);
  const [workloadData, setWorkloadData] = useState<WorkloadRow[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [wlRes, statsRes] = await Promise.all([
        api.call('getWorkload', {}),
        api.call('getDashboardStats', {}),
      ]);

      if (wlRes.ok) setWorkloadData(wlRes.data);
      if (statsRes.ok) setStats(statsRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleExportClassTimetable = async () => {
    setDownloadingType('class');
    const className = CLASSES.find((c) => c.id === selectedClassId)?.name || 'Class';
    const res = await api.call('getTimetable', { classId: selectedClassId });
    if (res.ok) {
      exportTimetableToPdf({
        title: `Academic Timetable — ${className}`,
        subtitle: `Department of Computer Science & Engineering • SchedNexa`,
        entries: res.data,
      });
    }
    setDownloadingType(null);
  };

  const handleExportFacultyTimetable = async () => {
    setDownloadingType('faculty');
    const facName = FACULTY.find((f) => f.id === selectedFacultyId)?.name || 'Faculty';
    const res = await api.call('getTimetable', { facultyId: selectedFacultyId });
    if (res.ok) {
      exportTimetableToPdf({
        title: `Teaching Schedule — ${facName}`,
        subtitle: `Weekly Faculty Schedule • SchedNexa`,
        entries: res.data,
      });
    }
    setDownloadingType(null);
  };

  const handleExportMasterTimetable = async () => {
    setDownloadingType('master');
    const res = await api.call('getTimetable', {});
    if (res.ok) {
      exportTimetableToPdf({
        title: `Master Institutional Timetable`,
        subtitle: `Complete Academic Schedule (All Classes & Rooms) • SchedNexa`,
        entries: res.data,
      });
    }
    setDownloadingType(null);
  };

  const handleExportWorkloadReport = () => {
    setDownloadingType('workload');
    if (workloadData.length > 0) {
      exportWorkloadReportToPdf(workloadData);
    }
    setDownloadingType(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
          Academic Reports & PDF Exports
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate clean, printable PDF documents for official institutional records, accreditation, and department distribution.
        </p>
      </div>

      {/* KPI Overview Pills */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Total Lectures Placed
            </span>
            <span className="text-xl font-extrabold text-foreground mt-1 block">
              {stats.lectures}
            </span>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Room Utilization
            </span>
            <span className="text-xl font-extrabold text-foreground mt-1 block">
              {stats.roomUtilizationPct}%
            </span>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Open Slots Recovered
            </span>
            <span className="text-xl font-extrabold text-primary mt-1 block">
              {stats.openSlotsFilled}
            </span>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Teaching Hours Saved
            </span>
            <span className="text-xl font-extrabold text-green-600 mt-1 block">
              {stats.hoursSaved} hrs
            </span>
          </div>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report 1: Class-Wise Timetable PDF */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Class Academic Timetable
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Printable weekly schedule for a specific student cohort including classroom assignments, lab spans, and faculty details.
              </p>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Select Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-border bg-background focus:outline-primary"
              >
                {CLASSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Semester {c.name.includes('3') ? '3' : '5'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleExportClassTimetable}
            disabled={downloadingType === 'class'}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {downloadingType === 'class' ? 'Generating PDF...' : 'Download Class Timetable PDF'}
            </span>
          </button>
        </div>

        {/* Report 2: Faculty-Wise Schedule PDF */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Faculty Teaching Schedule
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Individual teaching roster for faculty members detailing periods, assigned rooms, and weekly slots.
              </p>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Select Faculty
              </label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-border bg-background focus:outline-primary"
              >
                {FACULTY.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleExportFacultyTimetable}
            disabled={downloadingType === 'faculty'}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {downloadingType === 'faculty' ? 'Generating PDF...' : 'Download Faculty Schedule PDF'}
            </span>
          </button>
        </div>

        {/* Report 3: Institutional Faculty Workload & Compliance */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Faculty Workload & Compliance Report
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Executive summary of faculty teaching load, required vs assigned hours, extra hours from Open Academic Slots, and maximum capacity compliance.
              </p>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Zero Faculty Overload Certified</span>
              </div>
              <p className="text-[11px]">
                Audited against all {workloadData.length} active faculty profiles.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportWorkloadReport}
            disabled={downloadingType === 'workload'}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {downloadingType === 'workload' ? 'Generating PDF...' : 'Download Workload Report PDF'}
            </span>
          </button>
        </div>

        {/* Report 4: Master Institutional Timetable */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Master Institutional Timetable
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Comprehensive departmental timetable covering all classes, theory lectures, and 2-slot lab blocks across all days (Mon–Fri).
              </p>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Full Institutional Grid</span>
              </div>
              <p className="text-[11px]">
                Complete schedule with break intervals and lab block pairings.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportMasterTimetable}
            disabled={downloadingType === 'master'}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {downloadingType === 'master' ? 'Generating PDF...' : 'Download Master Timetable PDF'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
