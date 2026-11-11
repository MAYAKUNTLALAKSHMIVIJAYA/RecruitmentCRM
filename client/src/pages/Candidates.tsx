import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  X,
  Flame,
} from 'lucide-react';
import api from '../services/api';
import { Candidate, CandidateStatus, ApiResponse } from '../types';
import {
  candidateStatusColors,
  priorityColors,
  formatDate,
  getInitials,
} from '../utils';

export const CandidatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Candidate Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    skills: '',
    totalExperience: 3,
    currentCompany: '',
    currentDesignation: '',
    expectedSalary: '',
    noticePeriod: '30 days',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    source: 'LinkedIn',
    inFinalStagesElsewhere: false,
    competingOffers: false,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const res = await api.get<ApiResponse<Candidate[]>>(`/candidates?${params.toString()}`);
      setCandidates(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch candidates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/candidates', form);
      setIsModalOpen(false);
      setForm({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        skills: '',
        totalExperience: 3,
        currentCompany: '',
        currentDesignation: '',
        expectedSalary: '',
        noticePeriod: '30 days',
        priority: 'Medium',
        source: 'LinkedIn',
        inFinalStagesElsewhere: false,
        competingOffers: false,
      });
      fetchCandidates();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete candidate ${name}?`)) {
      try {
        await api.delete(`/candidates/${id}`);
        fetchCandidates();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete candidate.');
      }
    }
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-indigo-600" size={24} />
            Candidates Pool
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage, screen, and submit candidates across multiple client requirements
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={16} />
          Add Candidate
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name, email, skills, company..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            className="input md:w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Screened">Screened</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Submitted">Submitted</option>
            <option value="Interview">Interview</option>
            <option value="Selected">Selected</option>
            <option value="Placed">Placed</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>

          <select
            className="input md:w-40"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <button onClick={fetchCandidates} className="btn-secondary whitespace-nowrap">
            Filter
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3.5 px-4 table-header">Candidate</th>
                <th className="py-3.5 px-4 table-header">Status</th>
                <th className="py-3.5 px-4 table-header">Skills</th>
                <th className="py-3.5 px-4 table-header">Exp.</th>
                <th className="py-3.5 px-4 table-header">Current Company</th>
                <th className="py-3.5 px-4 table-header">Priority</th>
                <th className="py-3.5 px-4 table-header">Recruiter</th>
                <th className="py-3.5 px-4 table-header">Created</th>
                <th className="py-3.5 px-4 table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-slate-400">
                    Loading candidates...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="text-slate-400 text-sm">No candidates found</div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-2 text-indigo-600 text-xs font-semibold hover:underline"
                    >
                      + Add a new candidate
                    </button>
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => navigate(`/candidates/${c._id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 flex-shrink-0">
                          {getInitials(c.fullName)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                            {c.fullName}
                            {c.inFinalStagesElsewhere && (
                              <span title="Final stage with another company" className="text-red-500">
                                <Flame size={13} className="fill-red-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{c.candidateId}</span>
                            <span>·</span>
                            <span>{c.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={candidateStatusColors[c.status] || 'badge-gray'}>
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {c.skills.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{c.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 table-cell whitespace-nowrap">
                      {c.totalExperience} yrs
                    </td>

                    <td className="py-3 px-4 table-cell">
                      <div className="text-slate-800 font-medium text-xs">{c.currentCompany || 'N/A'}</div>
                      <div className="text-slate-400 text-[11px]">{c.currentDesignation}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={priorityColors[c.priority] || 'badge-gray'}>
                        {c.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 table-cell text-xs text-slate-600 whitespace-nowrap">
                      {(c.recruiterOwner as any)?.name || 'Unassigned'}
                    </td>

                    <td className="py-3 px-4 table-cell text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => handleDelete(c._id, c.fullName, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete candidate"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for creating candidate */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add New Candidate</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="m-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCandidate} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Location *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Bangalore, India"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Total Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="input"
                    value={form.totalExperience}
                    onChange={(e) => setForm({ ...form, totalExperience: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Skills (Comma-separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="Java, Spring Boot, Microservices, MySQL, REST APIs"
                  className="input"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Current Company</label>
                  <input
                    type="text"
                    className="input"
                    value={form.currentCompany}
                    onChange={(e) => setForm({ ...form, currentCompany: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Current Designation</label>
                  <input
                    type="text"
                    className="input"
                    value={form.currentDesignation}
                    onChange={(e) => setForm({ ...form, currentDesignation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Expected Salary</label>
                  <input
                    type="text"
                    placeholder="₹24L"
                    className="input"
                    value={form.expectedSalary}
                    onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Notice Period</label>
                  <select
                    className="input"
                    value={form.noticePeriod}
                    onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })}
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="15 days">15 days</option>
                    <option value="30 days">30 days</option>
                    <option value="45 days">45 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Risk Detection Factors */}
              <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-xl space-y-2">
                <div className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                  Risk & Competing Offer Indicators
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={form.inFinalStagesElsewhere}
                      onChange={(e) => setForm({ ...form, inFinalStagesElsewhere: e.target.checked })}
                    />
                    Candidate is in final interview stages with another employer
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={form.competingOffers}
                      onChange={(e) => setForm({ ...form, competingOffers: e.target.checked })}
                    />
                    Candidate holds active competing job offers
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Creating...' : 'Create Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
