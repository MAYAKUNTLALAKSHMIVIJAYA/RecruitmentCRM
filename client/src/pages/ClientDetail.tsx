import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Layers,
  Clock,
  Plus,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';
import { Client, HiringManager, Job, Submission, ApiResponse } from '../types';
import { formatDate, statusColors } from '../utils';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    client: Client;
    hiringManagers: HiringManager[];
    jobs: Job[];
    submissions: Submission[];
    stats: {
      totalSubmissions: number;
      pendingFeedback: number;
      averageTurnaroundDays: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHmModalOpen, setIsHmModalOpen] = useState(false);

  // New HM Form
  const [hmForm, setHmForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: '',
  });
  const [submittingHm, setSubmittingHm] = useState(false);

  const fetchClientDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<any>>(`/clients/${id}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load client details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchClientDetails();
  }, [id]);

  const handleAddHiringManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingHm(true);
    try {
      await api.post(`/clients/${id}/hiring-managers`, hmForm);
      setIsHmModalOpen(false);
      setHmForm({ fullName: '', email: '', phone: '', designation: '' });
      fetchClientDetails();
    } catch (err) {
      console.error('Failed to add HM', err);
    } finally {
      setSubmittingHm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500 text-sm">Loading client profile...</div>
      </div>
    );
  }

  if (!data?.client) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-base font-bold text-slate-800">Client Not Found</h2>
        <Link to="/clients" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
          ← Back to Clients List
        </Link>
      </div>
    );
  }

  const { client, hiringManagers, jobs, submissions, stats } = data;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/clients"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{client.companyName}</h1>
              <span className="badge-green">{client.accountStatus}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Industry: {client.industry} · Location: {client.location}
            </p>
          </div>
        </div>

        <button onClick={() => setIsHmModalOpen(true)} className="btn-primary">
          <Plus size={15} /> Add Hiring Manager
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSubmissions}</div>
            <div className="text-xs text-slate-500">Total Candidate Submissions</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingFeedback}</div>
            <div className="text-xs text-slate-500">Awaiting Manager Feedback</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.averageTurnaroundDays > 0 ? `${stats.averageTurnaroundDays} days` : 'N/A'}
            </div>
            <div className="text-xs text-slate-500">Avg Feedback Turnaround</div>
          </div>
        </div>
      </div>

      {/* Two Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Hiring Managers */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                Hiring Managers ({hiringManagers.length})
              </h3>
              <button
                onClick={() => setIsHmModalOpen(true)}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {hiringManagers.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No hiring managers added yet.</div>
              ) : (
                hiringManagers.map((hm) => (
                  <div key={hm._id} className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <div className="font-semibold text-sm text-slate-800">{hm.fullName}</div>
                    <div className="text-xs text-slate-500">{hm.designation}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Mail size={12} /> {hm.email}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Open Jobs & Submissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Job Requirements */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Briefcase size={16} className="text-indigo-600" />
              Active Job Openings ({jobs.length})
            </h3>
            <div className="space-y-2">
              {jobs.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No open job requisitions for this client.</div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job._id}
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="p-3 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-slate-50/50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-800">{job.jobTitle}</div>
                      <div className="text-xs text-slate-400">
                        {job.jobId} · {job.department} · {job.jobLocation}
                      </div>
                    </div>
                    <span className="badge-green">{job.jobStatus}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submissions Table */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Layers size={16} className="text-indigo-600" />
              Recent Candidate Submissions ({submissions.length})
            </h3>
            <div className="space-y-2">
              {submissions.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No submissions made to this client yet.</div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub._id}
                    onClick={() => navigate(`/submissions/${sub._id}`)}
                    className="p-3 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-slate-50/50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {(sub.candidate as any)?.fullName || 'Candidate'} → {(sub.job as any)?.jobTitle}
                      </div>
                      <div className="text-xs text-slate-400">
                        Submitted: {formatDate(sub.submissionDate)} · Manager: {(sub.hiringManager as any)?.fullName}
                      </div>
                    </div>
                    <span className={statusColors[sub.submissionStatus] || 'badge-gray'}>
                      {sub.submissionStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Hiring Manager Modal */}
      {isHmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add Hiring Manager</h3>
              <button onClick={() => setIsHmModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddHiringManager} className="p-5 space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={hmForm.fullName}
                  onChange={(e) => setHmForm({ ...hmForm, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={hmForm.email}
                  onChange={(e) => setHmForm({ ...hmForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Designation / Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VP Engineering, CTO"
                  className="input"
                  value={hmForm.designation}
                  onChange={(e) => setHmForm({ ...hmForm, designation: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Direct Phone</label>
                <input
                  type="text"
                  className="input"
                  value={hmForm.phone}
                  onChange={(e) => setHmForm({ ...hmForm, phone: e.target.value })}
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsHmModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingHm} className="btn-primary">
                  {submittingHm ? 'Adding...' : 'Add Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
