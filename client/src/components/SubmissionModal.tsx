import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Candidate, Job, ApiResponse } from '../types';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultJobId?: string;
  defaultCandidateId?: string;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultJobId,
  defaultCandidateId,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidateId, setCandidateId] = useState(defaultCandidateId || '');
  const [jobId, setJobId] = useState(defaultJobId || '');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [feedbackDueDays, setFeedbackDueDays] = useState(2);
  const [customSubject, setCustomSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      if (defaultJobId) setJobId(defaultJobId);
      if (defaultCandidateId) setCandidateId(defaultCandidateId);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, defaultJobId, defaultCandidateId]);

  const loadFormData = async () => {
    try {
      const [candRes, jobsRes] = await Promise.all([
        api.get<ApiResponse<Candidate[]>>('/candidates'),
        api.get<ApiResponse<Job[]>>('/jobs?status=Open'),
      ]);
      setCandidates(candRes.data.data || []);
      setJobs(jobsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load modal data', err);
    }
  };

  const selectedCandidate = candidates.find((c) => c._id === candidateId);
  const selectedJob = jobs.find((j) => j._id === jobId);

  // Auto-generate subject
  useEffect(() => {
    if (selectedCandidate && selectedJob) {
      setCustomSubject(
        `Candidate Submission – ${selectedCandidate.fullName} – ${selectedJob.jobTitle}`
      );
    }
  }, [candidateId, jobId, selectedCandidate, selectedJob]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !jobId) {
      setError('Please select both a candidate and a job opening.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/submissions', {
        candidateId,
        jobId,
        submissionNotes,
        priority,
        feedbackDueDays,
        customSubject,
        submissionMethod: 'Email',
      });

      setSuccessMsg(
        `Successfully submitted ${selectedCandidate?.fullName} to ${selectedJob?.jobTitle}!`
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit candidate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Submit Candidate to Client
            </h3>
            <p className="text-xs text-slate-500">
              Dispatches profile review email and initiates SLA reminder tracking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="m-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="m-5 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Select Candidate *</label>
              <select
                className="input"
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                required
              >
                <option value="">-- Choose Candidate --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.fullName} ({c.totalExperience} yrs · {c.skills.slice(0, 2).join(', ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Select Job Requirement *</label>
              <select
                className="input"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                required
              >
                <option value="">-- Choose Job --</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.jobTitle} @ {(j.client as any)?.companyName || 'Client'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedJob && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-indigo-900">Target Client Details:</div>
              <div className="text-slate-600">
                Company: <span className="font-medium text-slate-800">{(selectedJob.client as any)?.companyName}</span> · Hiring Manager: <span className="font-medium text-slate-800">{(selectedJob.hiringManager as any)?.fullName || 'Assigned Manager'} ({(selectedJob.hiringManager as any)?.email})</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Priority Level</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="High">High (Active competing offers)</option>
                <option value="Critical">Critical (In final stage elsewhere)</option>
              </select>
            </div>

            <div>
              <label className="label">Feedback Due In (Days SLA)</label>
              <select
                className="input"
                value={feedbackDueDays}
                onChange={(e) => setFeedbackDueDays(Number(e.target.value))}
              >
                <option value={1}>1 Day (Urgent)</option>
                <option value={2}>2 Days (Default SLA)</option>
                <option value={3}>3 Days</option>
                <option value={5}>5 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Email Subject</label>
            <input
              type="text"
              className="input text-xs font-mono"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Recruiter Notes / Recommendation</label>
            <textarea
              className="input min-h-[90px] text-sm"
              placeholder="Highlight candidate strengths, relevant projects, salary expectations, notice period, and availability..."
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              <Send size={15} />
              {loading ? 'Submitting...' : 'Submit to Hiring Manager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
