import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Users,
  MapPin,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { Job, Client, HiringManager, ApiResponse } from '../types';
import { priorityColors, formatDate } from '../utils';

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [hiringManagers, setHiringManagers] = useState<HiringManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Job Form State
  const [form, setForm] = useState({
    jobTitle: '',
    client: '',
    hiringManager: '',
    department: 'Engineering',
    requiredSkills: '',
    experienceRequired: '3-5 years',
    salaryRange: '₹18L - ₹25L',
    jobLocation: 'Bangalore (Hybrid)',
    employmentType: 'Full-time',
    jobDescription: '',
    priority: 'High',
    numberOfOpenings: 1,
    jobStatus: 'Open',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (search) params.append('search', search);

      const res = await api.get<ApiResponse<Job[]>>(`/jobs?${params.toString()}`);
      setJobs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    loadModalData();
  }, [statusFilter, priorityFilter]);

  const loadModalData = async () => {
    try {
      const [cRes, hmRes] = await Promise.all([
        api.get<ApiResponse<Client[]>>('/clients'),
        api.get<ApiResponse<HiringManager[]>>('/clients/hiring-managers'),
      ]);
      setClients(cRes.data.data || []);
      setHiringManagers(hmRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/jobs', form);
      setIsModalOpen(false);
      setForm({
        jobTitle: '',
        client: '',
        hiringManager: '',
        department: 'Engineering',
        requiredSkills: '',
        experienceRequired: '3-5 years',
        salaryRange: '₹18L - ₹25L',
        jobLocation: 'Bangalore (Hybrid)',
        employmentType: 'Full-time',
        jobDescription: '',
        priority: 'High',
        numberOfOpenings: 1,
        jobStatus: 'Open',
      });
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredManagers = hiringManagers.filter(
    (hm) => !form.client || (hm.client as any)?._id === form.client || hm.client === form.client
  );

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="text-indigo-600" size={24} />
            Job Requirements & Openings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Active client mandates, candidate submission pipelines, and placement conversions
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Create Job Opening
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={(e) => { e.preventDefault(); fetchJobs(); }} className="flex-1 w-full relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search job title, ID, or department..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            className="input md:w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="On Hold">On Hold</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            className="input md:w-36"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button onClick={fetchJobs} className="btn-secondary whitespace-nowrap">
            Filter
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3.5 px-4 table-header">Job Opening</th>
                <th className="py-3.5 px-4 table-header">Client</th>
                <th className="py-3.5 px-4 table-header">Hiring Manager</th>
                <th className="py-3.5 px-4 table-header">Priority</th>
                <th className="py-3.5 px-4 table-header">Location</th>
                <th className="py-3.5 px-4 table-header">Status</th>
                <th className="py-3.5 px-4 table-header">Submissions</th>
                <th className="py-3.5 px-4 table-header">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    Loading job openings...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    No job requirements found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job._id}
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-sm text-slate-900">{job.jobTitle}</div>
                      <div className="text-xs text-slate-400">
                        {job.jobId} · {job.department}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 table-cell font-medium">
                      {(job.client as any)?.companyName || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 table-cell text-xs">
                      {(job.hiringManager as any)?.fullName || 'Assigned Manager'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={priorityColors[job.priority] || 'badge-gray'}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 table-cell text-xs text-slate-500 whitespace-nowrap">
                      {job.jobLocation}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={
                          job.jobStatus === 'Open'
                            ? 'badge-green'
                            : job.jobStatus === 'On Hold'
                            ? 'badge-orange'
                            : 'badge-gray'
                        }
                      >
                        {job.jobStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{job.totalSubmissions ?? 0}</span>
                        {job.pendingFeedback ? (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                            {job.pendingFeedback} awaiting FB
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 table-cell">
                      <div className="text-xs font-semibold text-slate-700">
                        {job.conversionRate ?? 0}%
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Create New Job Requirement</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="m-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateJob} className="p-5 space-y-4">
              <div>
                <label className="label">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Java Developer"
                  className="input"
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Client Account *</label>
                  <select
                    className="input"
                    required
                    value={form.client}
                    onChange={(e) => setForm({ ...form, client: e.target.value, hiringManager: '' })}
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Hiring Manager *</label>
                  <select
                    className="input"
                    required
                    value={form.hiringManager}
                    onChange={(e) => setForm({ ...form, hiringManager: e.target.value })}
                  >
                    <option value="">-- Choose Manager --</option>
                    {filteredManagers.map((hm) => (
                      <option key={hm._id} value={hm._id}>
                        {hm.fullName} ({hm.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Department</label>
                  <input
                    type="text"
                    className="input"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Experience Needed</label>
                  <input
                    type="text"
                    className="input"
                    value={form.experienceRequired}
                    onChange={(e) => setForm({ ...form, experienceRequired: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Openings</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={form.numberOfOpenings}
                    onChange={(e) => setForm({ ...form, numberOfOpenings: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Required Skills (Comma-separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="Java, Spring Boot, Microservices, MySQL, REST APIs"
                  className="input"
                  value={form.requiredSkills}
                  onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Salary Range</label>
                  <input
                    type="text"
                    className="input"
                    value={form.salaryRange}
                    onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input
                    type="text"
                    className="input"
                    value={form.jobLocation}
                    onChange={(e) => setForm({ ...form, jobLocation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Job Description</label>
                <textarea
                  className="input min-h-[80px]"
                  value={form.jobDescription}
                  onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
