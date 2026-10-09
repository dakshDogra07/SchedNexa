'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { FacultyView, Subject, Class, Room } from '@shared/types';
import {
  Settings,
  Users,
  BookOpen,
  GraduationCap,
  DoorOpen,
  Plus,
  Search,
  Edit2,
  X,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

type TabType = 'faculty' | 'subjects' | 'classes' | 'rooms';

export default function AdminSetupPage() {
  const [activeTab, setActiveTab] = useState<TabType>('faculty');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Entities state
  const [facultyList, setFacultyList] = useState<FacultyView[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [roomsList, setRoomsList] = useState<Room[]>([]);

  // Modals state
  const [editingFaculty, setEditingFaculty] = useState<FacultyView | null | Partial<FacultyView>>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null | Partial<Subject>>(null);
  const [editingClass, setEditingClass] = useState<Class | null | Partial<Class>>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null | Partial<Room>>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [facRes, subjRes, clsRes, rmRes] = await Promise.all([
      api.call('listFaculty', {}),
      api.call('listSubjects', {}),
      api.call('listClasses', {}),
      api.call('listRooms', {}),
    ]);

    if (facRes.ok) setFacultyList(facRes.data);
    if (subjRes.ok) setSubjectsList(subjRes.data);
    if (clsRes.ok) setClassesList(clsRes.data);
    if (rmRes.ok) setRoomsList(rmRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Save Handlers
  const handleSaveFaculty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setSaving(true);
    const res = await api.call('upsertFaculty', {
      id: editingFaculty.id,
      user_id: editingFaculty.user_id || '10000000-0000-0000-0000-000000000099',
      department: editingFaculty.department || 'Computer Science',
      required_hours: Number(editingFaculty.required_hours) || 20,
      max_hours: Number(editingFaculty.max_hours) || 24,
    });
    setSaving(false);
    if (res.ok) {
      setEditingFaculty(null);
      loadAll();
    }
  };

  const handleSaveSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSubject) return;
    setSaving(true);
    const res = await api.call('upsertSubject', {
      id: editingSubject.id,
      name: editingSubject.name || 'New Subject',
      code: editingSubject.code || 'CS000',
      department: editingSubject.department || 'Computer Science',
      semester: Number(editingSubject.semester) || 3,
      type: (editingSubject.type as 'theory' | 'lab') || 'theory',
      hours_per_week: Number(editingSubject.hours_per_week) || 4,
    });
    setSaving(false);
    if (res.ok) {
      setEditingSubject(null);
      loadAll();
    }
  };

  const handleSaveClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClass) return;
    setSaving(true);
    const res = await api.call('upsertClass', {
      id: editingClass.id,
      name: editingClass.name || 'New Class',
      department: editingClass.department || 'Computer Science',
      semester: Number(editingClass.semester) || 3,
      student_count: Number(editingClass.student_count) || 60,
    });
    setSaving(false);
    if (res.ok) {
      setEditingClass(null);
      loadAll();
    }
  };

  const handleSaveRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRoom) return;
    setSaving(true);
    const res = await api.call('upsertRoom', {
      id: editingRoom.id,
      name: editingRoom.name || 'New Room',
      capacity: Number(editingRoom.capacity) || 60,
      type: (editingRoom.type as 'classroom' | 'lab') || 'classroom',
      equipment: editingRoom.equipment || ['Projector', 'Whiteboard'],
    });
    setSaving(false);
    if (res.ok) {
      setEditingRoom(null);
      loadAll();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-700 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-200" />
            <h1 className="text-2xl font-bold tracking-tight">Academic System Setup</h1>
          </div>
          <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
            Configure foundational academic infrastructure: Faculty load caps, Subject course codes, Class cohorts, and Classroom/Lab resources.
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => { setActiveTab('faculty'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'faculty'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty ({facultyList.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('subjects'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects ({subjectsList.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('classes'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Classes ({classesList.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('rooms'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Rooms & Labs ({roomsList.length})</span>
        </button>
      </div>

      {/* Action and Search Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          {activeTab === 'faculty' && (
            <button
              onClick={() => setEditingFaculty({ department: 'Computer Science', required_hours: 20, max_hours: 24 })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Faculty</span>
            </button>
          )}

          {activeTab === 'subjects' && (
            <button
              onClick={() => setEditingSubject({ department: 'Computer Science', semester: 3, type: 'theory', hours_per_week: 4 })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          )}

          {activeTab === 'classes' && (
            <button
              onClick={() => setEditingClass({ department: 'Computer Science', semester: 3, student_count: 60 })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class</span>
            </button>
          )}

          {activeTab === 'rooms' && (
            <button
              onClick={() => setEditingRoom({ type: 'classroom', capacity: 60, equipment: ['Projector', 'Whiteboard'] })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Room / Lab</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table for Active Tab */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">Loading academic records...</p>
          </div>
        ) : (
          <div>
            {/* Faculty Tab */}
            {activeTab === 'faculty' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="p-3.5 font-bold text-foreground">Faculty Member</th>
                      <th className="p-3.5 font-bold text-foreground">Department</th>
                      <th className="p-3.5 font-bold text-foreground text-center">Required Target</th>
                      <th className="p-3.5 font-bold text-foreground text-center">Max Weekly Limit</th>
                      <th className="p-3.5 font-bold text-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {facultyList
                      .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.department?.toLowerCase().includes(search.toLowerCase()))
                      .map((fac) => (
                        <tr key={fac.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-foreground text-sm">{fac.name}</div>
                            <div className="text-[11px] text-muted-foreground">{fac.email}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                              {fac.department || 'General'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-foreground">
                            {fac.required_hours} hrs/wk
                          </td>
                          <td className="p-3.5 text-center font-bold text-red-700">
                            {fac.max_hours} hrs/wk
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setEditingFaculty(fac)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                              title="Edit Faculty"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Subjects Tab */}
            {activeTab === 'subjects' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="p-3.5 font-bold text-foreground">Subject Code & Name</th>
                      <th className="p-3.5 font-bold text-foreground">Department</th>
                      <th className="p-3.5 font-bold text-foreground text-center">Semester</th>
                      <th className="p-3.5 font-bold text-foreground text-center">Type</th>
                      <th className="p-3.5 font-bold text-foreground text-center">Weekly Hours</th>
                      <th className="p-3.5 font-bold text-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subjectsList
                      .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
                      .map((subj) => (
                        <tr key={subj.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-foreground text-sm">{subj.name}</div>
                            <div className="text-[11px] font-mono text-primary">{subj.code}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                              {subj.department || 'General'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-medium text-foreground">
                            Sem {subj.semester}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                subj.type === 'lab'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}
                            >
                              {subj.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-foreground">
                            {subj.hours_per_week} hrs
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setEditingSubject(subj)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                              title="Edit Subject"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="p-3.5 font-bold text-foreground">Class Cohort</th>
                      <th className="p-3.5 font-bold text-foreground">Department</th>
                      <th className="p-3.5 font-bold text-foreground text-center">Semester</th>
                      <th className="p-3.5 font-bold text-foreground text-center">Batch Strength</th>
                      <th className="p-3.5 font-bold text-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classesList
                      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.department?.toLowerCase().includes(search.toLowerCase()))
                      .map((cls) => (
                        <tr key={cls.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-foreground text-sm">{cls.name}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                              {cls.department || 'General'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-medium text-foreground">
                            Semester {cls.semester}
                          </td>
                          <td className="p-3.5 text-center font-bold text-foreground">
                            {cls.student_count} Students
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setEditingClass(cls)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                              title="Edit Class"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Rooms Tab */}
            {activeTab === 'rooms' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="p-3.5 font-bold text-foreground">Room Identifier</th>
                      <th className="p-3.5 font-bold text-foreground">Type</th>
                      <th className="p-3.5 font-bold text-foreground text-center">Capacity</th>
                      <th className="p-3.5 font-bold text-foreground">Equipment & Amenities</th>
                      <th className="p-3.5 font-bold text-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {roomsList
                      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
                      .map((rm) => (
                        <tr key={rm.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-foreground text-sm">{rm.name}</div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                rm.type === 'lab'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}
                            >
                              {rm.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-foreground">
                            {rm.capacity} Seats
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1">
                              {rm.equipment?.map((eq, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-muted/50 text-muted-foreground rounded text-[10px]">
                                  {eq}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setEditingRoom(rm)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                              title="Edit Room"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Faculty Modal */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                {editingFaculty.id ? 'Edit Faculty Profile' : 'Add New Faculty Member'}
              </h3>
              <button onClick={() => setEditingFaculty(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveFaculty} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Department</label>
                <input
                  type="text"
                  value={editingFaculty.department || ''}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, department: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Required Hours (Target)</label>
                  <input
                    type="number"
                    value={editingFaculty.required_hours ?? 20}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, required_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Max Capacity (Hard Cap)</label>
                  <input
                    type="number"
                    value={editingFaculty.max_hours ?? 24}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, max_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="px-4 py-2 bg-muted rounded-xl text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                {editingSubject.id ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button onClick={() => setEditingSubject(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Subject Name</label>
                <input
                  type="text"
                  value={editingSubject.name || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Course Code</label>
                  <input
                    type="text"
                    value={editingSubject.code || ''}
                    onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Department</label>
                  <input
                    type="text"
                    value={editingSubject.department || ''}
                    onChange={(e) => setEditingSubject({ ...editingSubject, department: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Semester</label>
                  <input
                    type="number"
                    value={editingSubject.semester ?? 3}
                    onChange={(e) => setEditingSubject({ ...editingSubject, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Type</label>
                  <select
                    value={editingSubject.type || 'theory'}
                    onChange={(e) => setEditingSubject({ ...editingSubject, type: e.target.value as 'theory' | 'lab' })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Hours/Wk</label>
                  <input
                    type="number"
                    value={editingSubject.hours_per_week ?? 4}
                    onChange={(e) => setEditingSubject({ ...editingSubject, hours_per_week: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 bg-muted rounded-xl text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                {editingClass.id ? 'Edit Class Cohort' : 'Add New Class'}
              </h3>
              <button onClick={() => setEditingClass(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Cohort Name (e.g. CSE-3A)</label>
                <input
                  type="text"
                  value={editingClass.name || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Semester</label>
                  <input
                    type="number"
                    value={editingClass.semester ?? 3}
                    onChange={(e) => setEditingClass({ ...editingClass, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Student Strength</label>
                  <input
                    type="number"
                    value={editingClass.student_count ?? 60}
                    onChange={(e) => setEditingClass({ ...editingClass, student_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 bg-muted rounded-xl text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                {editingRoom.id ? 'Edit Room / Lab' : 'Add New Room / Lab'}
              </h3>
              <button onClick={() => setEditingRoom(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Room Name (e.g. Room 105 or Lab 3)</label>
                <input
                  type="text"
                  value={editingRoom.name || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Room Type</label>
                  <select
                    value={editingRoom.type || 'classroom'}
                    onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value as 'classroom' | 'lab' })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="classroom">Classroom</option>
                    <option value="lab">Laboratory</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={editingRoom.capacity ?? 60}
                    onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 bg-muted rounded-xl text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
