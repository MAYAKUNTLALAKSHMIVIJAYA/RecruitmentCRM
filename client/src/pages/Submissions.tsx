import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ExternalLink,
  Flame,
  Mail,
  Send,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import { Submission, SubmissionStatus, RiskLevel, ApiResponse } from '../types';
import {
  statusColors,
  riskColors,
  priorityColors,
  formatDate,
  getInitials,
} from '../utils';
import { SubmissionModal } from '../components/SubmissionModal';

export const SubmissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('riskLevel') || '');
  const [overdueOnly, setOverdueOnly] = useState(searchParams.get('isOverdue') === 'true');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (riskFilter) params.append('riskLevel', riskFilter);
      if (overdueOnly) params.append('isOverdue', 'true');

      const res = await api.get<ApiResponse<Submission[]>>(`/submissions?${params.toString()}`);
      setSubmissions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, riskFilter, overdueOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubmissions();
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-indigo-600" size={24} />
            Candidate Submissions & Feedback Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Centralized submission records across all clients, tracking manager feedback SLAs & withdrawal risks
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          New Candidate Submission
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, job requirement, client company..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            className="input md:w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Awaiting Feedback">Awaiting Feedback</option>
            <option value="Follow-up Due">Follow-up Due</option>
            <option value="Feedback Received">Feedback Received</option>
            <option value="Interview Requested">Interview Requested</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>

          <select
            className="input md:w-36"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="">All Risks</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
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

          <button onClick={fetchSubmissions} className="btn-secondary whitespace-nowrap">
            Filter
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3.5 px-4 table-header">Candidate</th>
                <th className="py-3.5 px-4 table-header">Job Requirement</th>
                <th className="py-3.5 px-4 table-header">Client</th>
                <th className="py-3.5 px-4 table-header">Hiring Manager</th>
                <th className="py-3.5 px-4 table-header">Status</th>
                <th className="py-3.5 px-4 table-header">Withdrawal Risk</th>
                <th className="py-3.5 px-4 table-header">Feedback Due</th>
                <th className="py-3.5 px-4 table-header">Waiting</th>
                <th className="py-3.5 px-4 table-header">Recruiter</th>
                <th className="py-3.5 px-4 table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-slate-400">
                    Loading submissions...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-slate-400">
                    No submissions found matching your filters.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const isCritical = sub.riskLevel === 'Critical';
                  const isOverdue = sub.isOverdue;

                  return (
                    <tr
                      key={sub._id}
                      onClick={() => navigate(`/submissions/${sub._id}`)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isCritical
                          ? 'bg-red-50/40'
                          : isOverdue
                          ? 'bg-orange-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 flex-shrink-0">
                            {getInitials((sub.candidate as any)?.fullName || 'C')}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              {(sub.candidate as any)?.fullName}
                              {(sub.candidate as any)?.inFinalStagesElsewhere && (
                                <span title="In final round elsewhere" className="text-red-500">
                                  <Flame size={13} className="fill-red-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {sub.submissionId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 table-cell">
                        <div className="font-semibold text-slate-800 text-xs">{(sub.job as any)?.jobTitle}</div>
                        <div className="text-slate-400 text-[11px]">{(sub.job as any)?.jobId}</div>
                      </td>

                      <td className="py-3.5 px-4 table-cell text-xs font-medium text-slate-700">
                        {(sub.client as any)?.companyName}
                      </td>

                      <td className="py-3.5 px-4 table-cell text-xs text-slate-600">
                        {(sub.hiringManager as any)?.fullName}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={statusColors[sub.submissionStatus] || 'badge-gray'}>
                          {sub.submissionStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskColors[sub.riskLevel]}`}
                        >
                          {isCritical && <Flame size={12} className="fill-red-700" />}
                          {sub.riskLevel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 table-cell text-xs whitespace-nowrap">
                        <div className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-700'}>
                          {formatDate(sub.feedbackDueDate)}
                        </div>
                        {isOverdue && (
                          <div className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">
                            Overdue
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 table-cell whitespace-nowrap">
                        <span className="font-bold text-xs text-slate-800">{sub.daysWaiting} days</span>
                      </td>

                      <td className="py-3.5 px-4 table-cell text-xs text-slate-600 whitespace-nowrap">
                        {(sub.recruiter as any)?.name}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/submissions/${sub._id}`);
                          }}
                          className="btn-secondary text-xs py-1 px-2.5"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <SubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchSubmissions()}
      />
    </div>
  );
};
