import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Users,
  Send,
  CheckCircle,
  Clock,
  Layers,
  Flame,
} from 'lucide-react';
import api from '../services/api';
import { Job, Submission, ApiResponse } from '../types';
import { formatDate, priorityColors, statusColors, riskColors } from '../utils';
import { SubmissionModal } from '../components/SubmissionModal';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    job: Job;
    submissions: Submission[];
    metrics: {
      totalSubmissions: number;
      interviews: number;
      selections: number;
      pendingFeedback: number;
      conversionRate: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<any>>(`/jobs/${id}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load job details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchJobDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500 text-sm">Loading job details...</div>
      </div>
    );
  }

  if (!data?.job) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-base font-bold text-slate-800">Job Requirement Not Found</h2>
        <Link to="/jobs" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
          ← Back to Job Openings
        </Link>
      </div>
    );
  }

  const { job, submissions, metrics } = data;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/jobs"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{job.jobTitle}</h1>
              <span className="badge-green">{job.jobStatus}</span>
              <span className={priorityColors[job.priority]}>{job.priority} Priority</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Requisition ID: {job.jobId} · Client: {(job.client as any)?.companyName} · Created: {formatDate(job.createdAt)}
            </p>
          </div>
        </div>

        <button onClick={() => setIsSubmitModalOpen(true)} className="btn-primary">
          <Send size={15} />
          Submit Shortlisted Candidate
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-slate-900">{metrics.totalSubmissions}</div>
          <div className="text-xs text-slate-500 mt-1">Total Candidates Submitted</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-orange-600">{metrics.pendingFeedback}</div>
          <div className="text-xs text-slate-500 mt-1">Awaiting Manager Feedback</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-indigo-600">{metrics.interviews}</div>
          <div className="text-xs text-slate-500 mt-1">Interviews Scheduled</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-emerald-600">{metrics.conversionRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Submission Conversion Rate</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Details */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Position Details
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Client Company:</span>
                <span className="font-semibold text-slate-800">{(job.client as any)?.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span>Hiring Manager:</span>
                <span className="font-semibold text-slate-800">{(job.hiringManager as any)?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span>Manager Email:</span>
                <span className="text-indigo-600">{(job.hiringManager as any)?.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Department:</span>
                <span className="font-medium text-slate-700">{job.department}</span>
              </div>
              <div className="flex justify-between">
                <span>Experience Required:</span>
                <span className="font-medium text-slate-700">{job.experienceRequired}</span>
              </div>
              <div className="flex justify-between">
                <span>Salary Range:</span>
                <span className="font-semibold text-slate-800">{job.salaryRange || 'Competitive'}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium text-slate-700">{job.jobLocation}</span>
              </div>
              <div className="flex justify-between">
                <span>Open Positions:</span>
                <span className="font-bold text-slate-800">{job.numberOfOpenings}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Required Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.map((s, idx) => (
                  <span key={idx} className="badge-indigo text-[11px]">{s}</span>
                ))}
              </div>
            </div>

            {job.jobDescription && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</div>
                <p className="text-xs text-slate-600 leading-relaxed">{job.jobDescription}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Submitted Candidates Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                Submitted Candidates for this Opening ({submissions.length})
              </h3>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                + Submit Candidate
              </button>
            </div>

            <div className="space-y-3">
              {submissions.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  No candidates submitted yet. Click "Submit Shortlisted Candidate" above to send profiles to {(job.hiringManager as any)?.fullName}.
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub._id}
                    onClick={() => navigate(`/submissions/${sub._id}`)}
                    className="p-3.5 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-slate-50/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          {(sub.candidate as any)?.fullName}
                        </span>
                        <span className={statusColors[sub.submissionStatus] || 'badge-gray'}>
                          {sub.submissionStatus}
                        </span>
                        {sub.riskLevel === 'Critical' && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame size={11} /> Critical Risk
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Experience: {(sub.candidate as any)?.totalExperience} yrs · Submitted: {formatDate(sub.submissionDate)} · Recruiter: {(sub.recruiter as any)?.name}
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="font-semibold text-slate-700">{sub.daysWaiting} days waiting</div>
                      {sub.isOverdue && <span className="text-red-600 font-bold">⚠️ Overdue SLA</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={() => fetchJobDetails()}
        defaultJobId={job._id}
      />
    </div>
  );
};
