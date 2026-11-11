import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Send,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  ShieldAlert,
  X,
  Play,
  Flame,
} from 'lucide-react';
import api from '../services/api';
import { FollowUpTask, ApiResponse } from '../types';
import { formatDate } from '../utils';

export const FollowUpsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Snooze Modal State
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [snoozeDays, setSnoozeDays] = useState(2);
  const [snoozeReason, setSnoozeReason] = useState('Client requested more time to review');

  // Escalate Modal State
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState('');

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (overdueOnly) params.append('isOverdue', 'true');

      const res = await api.get<ApiResponse<FollowUpTask[]>>(`/followups?${params.toString()}`);
      setTasks(res.data.data || []);
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [statusFilter, overdueOnly]);

  const handleSend = async (id: string, candidateName: string) => {
    if (!window.confirm(`Send simulated follow-up email for ${candidateName}?`)) return;
    try {
      await api.post(`/followups/${id}/send`);
      alert(`Follow-up sent for ${candidateName} (Simulated). Status and next reminder updated.`);
      fetchFollowUps();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send follow-up');
    }
  };

  const handleSnooze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await api.post(`/followups/${selectedTask._id}/snooze`, {
        days: snoozeDays,
        reason: snoozeReason,
      });
      setSnoozeModalOpen(false);
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await api.post(`/followups/${selectedTask._id}/escalate`, {
        notes: escalationNotes,
      });
      setEscalateModalOpen(false);
      alert('Task escalated to Team Leadership and Director.');
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.post(`/followups/${id}/complete`);
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    try {
      const res = await api.post('/followups/scan');
      alert(`Scan complete: ${res.data.data?.checked || 0} evaluated, ${res.data.data?.markedFollowUpDue || 0} marked due.`);
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const now = new Date();
  const overdueCount = tasks.filter((t) => t.status === 'Pending' && new Date(t.dueDate) < now).length;
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-indigo-600" size={24} />
            Follow-up & SLA Reminder Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated check intervals (Day 2/4/6) ensuring zero candidates are lost to unresponsive clients
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="btn-secondary text-xs"
            title="Execute node-cron reminder evaluation immediately"
          >
            <Play size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Running Automation Scan...' : 'Trigger SLA Scan Now'}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
          <div className="text-xs text-slate-500 mt-1">Pending Follow-up Tasks</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
          <div className="text-xs text-slate-500 mt-1">Overdue Client Feedback Follow-ups</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-emerald-600">
            {tasks.filter((t) => t.status === 'Completed' || t.status === 'Sent').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Dispatched / Resolved Tasks</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <select
          className="input w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Follow-up Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Sent">Sent</option>
          <option value="Snoozed">Snoozed</option>
          <option value="Escalated">Escalated</option>
          <option value="Completed">Completed</option>
        </select>

        <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
          <input
            type="checkbox"
            className="rounded text-indigo-600 focus:ring-indigo-500"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          Overdue Only
        </label>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3.5 px-4 table-header">Candidate & Job</th>
                <th className="py-3.5 px-4 table-header">Client</th>
                <th className="py-3.5 px-4 table-header">Hiring Manager</th>
                <th className="py-3.5 px-4 table-header">Follow-up Due</th>
                <th className="py-3.5 px-4 table-header">Status</th>
                <th className="py-3.5 px-4 table-header">Recruiter</th>
                <th className="py-3.5 px-4 table-header text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    Loading follow-up tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No follow-up tasks match this view.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const isTaskOverdue = task.status === 'Pending' && new Date(task.dueDate) < now;
                  const candidateName = (task.candidate as any)?.fullName || 'Candidate';

                  return (
                    <tr
                      key={task._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTaskOverdue ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div
                          className="cursor-pointer hover:underline font-bold text-sm text-slate-900"
                          onClick={() => navigate(`/submissions/${(task.submission as any)?._id || task.submission}`)}
                        >
                          {candidateName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {(task.job as any)?.jobTitle} · Step #{task.stepNumber}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 table-cell font-medium text-xs text-slate-800">
                        {(task.client as any)?.companyName}
                      </td>

                      <td className="py-3.5 px-4 table-cell text-xs text-slate-600">
                        <div>{(task.hiringManager as any)?.fullName}</div>
                        <div className="text-[11px] text-slate-400">{(task.hiringManager as any)?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 table-cell text-xs whitespace-nowrap">
                        <div className={isTaskOverdue ? 'text-red-600 font-bold' : 'text-slate-800'}>
                          {formatDate(task.dueDate)}
                        </div>
                        {isTaskOverdue && (
                          <div className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">
                            Overdue
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={
                            task.status === 'Sent' ? 'badge-blue' :
                            task.status === 'Completed' ? 'badge-green' :
                            task.status === 'Escalated' ? 'badge-purple' :
                            task.status === 'Snoozed' ? 'badge-gray' :
                            'badge-orange'
                          }
                        >
                          {task.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 table-cell text-xs text-slate-600">
                        {(task.assignedRecruiter as any)?.name}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {task.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSend(task._id, candidateName)}
                              className="btn-primary text-xs py-1 px-2.5"
                              title="Send follow-up email"
                            >
                              <Send size={12} /> Send
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setSnoozeModalOpen(true);
                              }}
                              className="btn-secondary text-xs py-1 px-2"
                              title="Snooze"
                            >
                              Snooze
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setEscalateModalOpen(true);
                              }}
                              className="btn-danger text-xs py-1 px-2"
                              title="Escalate to team lead"
                            >
                              Escalate
                            </button>
                            <button
                              onClick={() => handleComplete(task._id)}
                              className="btn-secondary text-xs py-1 px-2 text-emerald-600"
                              title="Mark resolved"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snooze Modal */}
      {snoozeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-sm shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Snooze Follow-up Reminder</h3>
            <form onSubmit={handleSnooze} className="space-y-3">
              <div>
                <label className="label text-xs">Snooze Duration (Days)</label>
                <select
                  className="input text-xs"
                  value={snoozeDays}
                  onChange={(e) => setSnoozeDays(Number(e.target.value))}
                >
                  <option value={1}>1 Day</option>
                  <option value={2}>2 Days</option>
                  <option value={3}>3 Days</option>
                  <option value={5}>5 Days</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Reason for Delay</label>
                <input
                  type="text"
                  className="input text-xs"
                  value={snoozeReason}
                  onChange={(e) => setSnoozeReason(e.target.value)}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setSnoozeModalOpen(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Snooze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {escalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="text-red-600" size={18} />
              Escalate to Team Leadership
            </h3>
            <form onSubmit={handleEscalateSubmit} className="space-y-3">
              <div>
                <label className="label text-xs">Escalation Notes & Urgency Context</label>
                <textarea
                  className="input min-h-[90px] text-xs"
                  placeholder="Detail client responsiveness, candidate market competition, and specific intervention required..."
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEscalateModalOpen(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-danger text-xs">
                  Escalate Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
