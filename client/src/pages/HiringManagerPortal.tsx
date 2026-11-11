import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Calendar,
  HelpCircle,
  Clock,
  Briefcase,
  MapPin,
  Building2,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  Send,
} from 'lucide-react';
import api from '../services/api';
import { FeedbackDecision, Submission, ApiResponse } from '../types';
import { formatDate } from '../utils';

export const HiringManagerPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [decision, setDecision] = useState<FeedbackDecision>('Request Interview');
  const [comments, setComments] = useState('');
  const [interviewAvailability, setInterviewAvailability] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<any>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get<ApiResponse<Submission>>(`/portal/submission/${token}`);
        if (res.data.success && res.data.data) {
          setSubmission(res.data.data);
          if (res.data.data.hiringManagerFeedback) {
            setSubmittedFeedback(res.data.data.hiringManagerFeedback);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or expired candidate review link.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchSubmission();
  }, [token]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      alert('Please provide feedback comments.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/portal/submission/${token}/feedback`, {
        decision,
        comments,
        interviewAvailability,
        additionalRequirements,
      });

      setSubmittedFeedback(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-sm text-slate-500 font-medium">Verifying review credentials...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-slate-800">Review Link Expired or Invalid</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const candidate = submission.candidate as any;
  const job = submission.job as any;
  const client = submission.client as any;
  const recruiter = submission.recruiter as any;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Portal Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Layers size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">RecruitFlow Hiring Manager Portal</div>
              <div className="text-xs text-slate-400">Candidate Evaluation & Decision Engine</div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-semibold text-slate-800">{client?.companyName}</div>
            <div className="text-slate-400">Secure Review Channel</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Candidate & Job Summary Header Card */}
        <div className="card p-6 border-indigo-100 bg-gradient-to-r from-white via-indigo-50/20 to-white shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                Candidate Profile Review
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {candidate?.fullName}
              </h1>
              <div className="text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                <span>{candidate?.currentDesignation} @ {candidate?.currentCompany}</span>
                <span>•</span>
                <span>{candidate?.totalExperience} yrs experience</span>
                <span>•</span>
                <span className="text-indigo-600 font-semibold">{job?.jobTitle}</span>
              </div>
            </div>

            <div className="text-left md:text-right text-xs text-slate-500 space-y-1">
              <div>Submitted by: <b>{recruiter?.name}</b></div>
              <div>Submission Date: <b>{formatDate(submission.submissionDate)}</b></div>
              <div>Feedback Due: <b className="text-indigo-600">{formatDate(submission.feedbackDueDate)}</b></div>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Credentials */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Candidate Background & Qualifications
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium text-slate-800">{candidate?.location}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Experience:</span>
                <span className="font-medium text-slate-800">{candidate?.totalExperience} years</span>
              </div>
              <div className="flex justify-between">
                <span>Current Employer:</span>
                <span className="font-medium text-slate-800">{candidate?.currentCompany}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Title:</span>
                <span className="font-medium text-slate-800">{candidate?.currentDesignation}</span>
              </div>
              <div className="flex justify-between">
                <span>Notice Period:</span>
                <span className="font-medium text-slate-800">{candidate?.noticePeriod}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Compensation:</span>
                <span className="font-medium text-slate-800">{candidate?.expectedSalary}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 mb-2">Verified Skillsets:</div>
              <div className="flex flex-wrap gap-1.5">
                {candidate?.skills?.map((s: string, idx: number) => (
                  <span key={idx} className="badge-indigo text-[11px] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Job Mandate & Recruiter Pitch */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Job Requirement & Recruiter Notes
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div><b>Position:</b> {job?.jobTitle} ({job?.jobId})</div>
              <div><b>Department:</b> {job?.department} · {job?.jobLocation}</div>
              <div><b>Experience Level:</b> {job?.experienceRequired}</div>
              <div><b>Target Salary Range:</b> {job?.salaryRange}</div>
            </div>

            {submission.submissionNotes && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide">
                  Recruiter Recommendation Note:
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{submission.submissionNotes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        {submittedFeedback ? (
          <div className="card p-8 border-emerald-300 bg-emerald-50/50 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-lg font-bold text-emerald-950">
              Feedback Has Been Successfully Recorded
            </h2>
            <div className="inline-block badge-green text-sm px-3 py-1 font-bold">
              Decision: {submittedFeedback.decision}
            </div>
            <div className="max-w-md mx-auto text-xs text-slate-700 bg-white p-4 rounded-xl border border-emerald-200 mt-2">
              <div className="font-semibold text-slate-900 mb-1">Your Submitted Feedback:</div>
              "{submittedFeedback.comments}"
              {submittedFeedback.interviewAvailability && (
                <div className="mt-2 text-indigo-600 font-medium">
                  Interview Availability: {submittedFeedback.interviewAvailability}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Submitted on {formatDate(submittedFeedback.submittedAt || new Date())}. The recruitment team has been alerted and will coordinate immediately.
            </p>
          </div>
        ) : (
          <div className="card p-6 shadow-md border-indigo-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Hiring Manager Decision & Feedback
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Submit your decision directly. Your recruiter and team will receive immediate notification.
            </p>

            <form onSubmit={handleSubmitFeedback} className="space-y-5">
              {/* Decision Radio Grid */}
              <div>
                <label className="label">Evaluation Decision *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { val: 'Request Interview', label: 'Request Interview', desc: 'Proceed to video / technical interview round' },
                    { val: 'Accept', label: 'Accept Candidate', desc: 'Shortlist for next hiring stages' },
                    { val: 'Keep Under Review', label: 'Keep Under Review', desc: 'Evaluating alongside other profiles' },
                    { val: 'Request More Information', label: 'Need More Info', desc: 'Ask recruiter for clarification' },
                    { val: 'Reject', label: 'Reject Candidate', desc: 'Not a fit for this role' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                        decision === opt.val
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="decision"
                          value={opt.val}
                          checked={decision === opt.val}
                          onChange={(e) => setDecision(e.target.value as FeedbackDecision)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 pl-5">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="label">Feedback Comments & Notes *</label>
                <textarea
                  required
                  className="input min-h-[100px] text-xs"
                  placeholder="Detail your impression of the candidate's skills, technical stack alignment, and specific areas to probe during the interview..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              {/* Interview Availability (shown conditionally) */}
              {decision === 'Request Interview' && (
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 animate-fade-in">
                  <label className="label text-xs text-blue-900">
                    Your Interview Availability (Date & Time Windows)
                  </label>
                  <input
                    type="text"
                    className="input text-xs"
                    placeholder="e.g. Thursday 2:00 PM - 5:00 PM IST, Friday morning after 11:00 AM"
                    value={interviewAvailability}
                    onChange={(e) => setInterviewAvailability(e.target.value)}
                  />
                  <div className="text-[11px] text-blue-700">
                    The recruiter will coordinate directly with the candidate and issue calendar invitations.
                  </div>
                </div>
              )}

              {/* Additional Requirements */}
              <div>
                <label className="label text-xs">Additional Requirements / Test Assignment (Optional)</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Please share coding sample or GitHub profile"
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 text-sm justify-center font-bold"
              >
                <Send size={16} />
                {submitting ? 'Submitting Feedback...' : 'Submit Feedback to Recruitment Team'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
