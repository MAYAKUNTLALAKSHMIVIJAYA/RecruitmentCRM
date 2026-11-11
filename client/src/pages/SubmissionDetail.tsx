import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  Building2,
  Briefcase,
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Copy,
  ExternalLink,
  Send,
  Mail,
  ShieldAlert,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import api from '../services/api';
import {
  Submission,
  FollowUpTask,
  ActivityLog,
  SubmissionStatus,
  ApiResponse,
} from '../types';
import {
  statusColors,
  riskColors,
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '../utils';

export const SubmissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    submission: Submission;
    followUpTasks: FollowUpTask[];
    timeline: ActivityLog[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<any>>(`/submissions/${id}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load submission details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: SubmissionStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/submissions/${id}`, { status: newStatus });
      fetchDetails();
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendFollowUp = async (taskId: string) => {
    try {
      await api.post(`/followups/${taskId}/send`);
      alert('Follow-up email dispatched (Simulated Mode). Status and timeline updated.');
      fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send follow-up');
    }
  };

  const handleEscalate = async (taskId: string) => {
    const reason = prompt('Reason for escalation to Team Leadership / Admin:', 'Client unresponsive for multiple days; candidate at high withdrawal risk.');
    if (!reason) return;
    try {
      await api.post(`/followups/${taskId}/escalate`, { notes: reason });
      alert('Submission successfully escalated to Team Lead & Director. Escalation logged.');
      fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to escalate');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500 text-sm">Loading submission record...</div>
      </div>
    );
  }

  if (!data?.submission) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-base font-bold text-slate-800">Submission Not Found</h2>
        <Link to="/submissions" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
          ← Back to Submissions
        </Link>
      </div>
    );
  }

  const { submission, followUpTasks, timeline } = data;
  const candidate = submission.candidate as any;
  const job = submission.job as any;
  const client = submission.client as any;
  const hiringManager = submission.hiringManager as any;
  const reviewUrl = `${window.location.origin}/portal/review/${submission.reviewToken}`;

  const copyReviewLink = () => {
    navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/submissions"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {submission.submissionId}
              </span>
              <h1 className="text-lg font-bold text-slate-900">
                {candidate?.fullName} → {job?.jobTitle}
              </h1>
              <span className={statusColors[submission.submissionStatus] || 'badge-gray'}>
                {submission.submissionStatus}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskColors[submission.riskLevel]}`}>
                {submission.riskLevel === 'Critical' && <Flame size={12} className="fill-red-700" />}
                {submission.riskLevel} Risk
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Client: <b>{client?.companyName}</b> · Manager: <b>{hiringManager?.fullName}</b> · Recruiter: <b>{(submission.recruiter as any)?.name}</b>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={copyReviewLink}
            className="btn-secondary text-xs"
            title="Copy unique hiring manager review link"
          >
            {copied ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? 'Copied Review Link!' : 'Copy Review Link'}
          </button>

          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs"
          >
            <ExternalLink size={14} />
            Open Portal View
          </a>
        </div>
      </div>

      {/* Critical / High Risk Warning Alert Banner */}
      {(submission.riskLevel === 'Critical' || submission.riskLevel === 'High') && (
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          submission.riskLevel === 'Critical' ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'
        }`}>
          <ShieldAlert size={22} className={`flex-shrink-0 mt-0.5 ${
            submission.riskLevel === 'Critical' ? 'text-red-600' : 'text-orange-600'
          }`} />
          <div className="flex-1 min-w-0">
            <div className={`font-bold text-sm ${
              submission.riskLevel === 'Critical' ? 'text-red-900' : 'text-orange-900'
            }`}>
              ⚠️ Candidate at Risk – Immediate Follow-up & Decision Required
            </div>
            <div className="mt-1 text-xs space-y-1 text-slate-700">
              {submission.riskReasons?.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {reason}
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-800 bg-white/70 p-2 rounded-lg border border-slate-200/60">
              💡 Recommended Next Action: Contact hiring manager {hiringManager?.fullName} immediately via phone ({hiringManager?.phone || 'direct'}) or send urgent 2nd follow-up. Update candidate to keep them engaged.
            </div>
          </div>
        </div>
      )}

      {/* Overdue Feedback Alert */}
      {submission.isOverdue && submission.riskLevel !== 'Critical' && (
        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2 text-xs text-orange-900 font-medium">
          <Clock size={16} className="text-orange-600 flex-shrink-0" />
          <span>Hiring manager feedback deadline ({formatDate(submission.feedbackDueDate)}) has expired. Days waiting: {submission.daysWaiting} days.</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submission Context */}
        <div className="space-y-6">
          {/* Submission Info Card */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Submission Metadata
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Submitted Date:</span>
                <span className="font-semibold text-slate-800">{formatDateTime(submission.submissionDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Feedback Due Date:</span>
                <span className={`font-semibold ${submission.isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatDate(submission.feedbackDueDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Days Waiting:</span>
                <span className="font-bold text-slate-900">{submission.daysWaiting} days</span>
              </div>
              <div className="flex justify-between">
                <span>Last Follow-up:</span>
                <span className="font-medium text-slate-800">{formatDate(submission.lastFollowUpDate) || 'None yet'}</span>
              </div>
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="font-medium text-slate-700">{submission.submissionMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Recruiter Owner:</span>
                <span className="font-semibold text-slate-800">{(submission.recruiter as any)?.name}</span>
              </div>
            </div>

            {/* Quick Status Override */}
            <div className="pt-3 border-t border-slate-100">
              <label className="label text-xs">Update Submission Status</label>
              <select
                className="input text-xs"
                value={submission.submissionStatus}
                onChange={(e) => handleStatusChange(e.target.value as SubmissionStatus)}
                disabled={updatingStatus}
              >
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Awaiting Feedback">Awaiting Feedback</option>
                <option value="Follow-up Due">Follow-up Due</option>
                <option value="Feedback Received">Feedback Received</option>
                <option value="Interview Requested">Interview Requested</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Candidate Snapshot */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Candidate Snapshot</h3>
              <Link to={`/candidates/${candidate?._id}`} className="text-xs text-indigo-600 hover:underline">
                View Full Profile →
              </Link>
            </div>
            <div className="text-xs space-y-2 text-slate-600">
              <div><b>Name:</b> {candidate?.fullName}</div>
              <div><b>Experience:</b> {candidate?.totalExperience} years</div>
              <div><b>Current:</b> {candidate?.currentDesignation} @ {candidate?.currentCompany}</div>
              <div><b>Notice Period:</b> {candidate?.noticePeriod}</div>
              <div><b>Expected:</b> {candidate?.expectedSalary}</div>
              <div>
                <b>Skills:</b> {candidate?.skills?.join(', ')}
              </div>
            </div>
          </div>

          {/* Client & Hiring Manager Snapshot */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Target Client Stakeholder
            </h3>
            <div className="text-xs space-y-2 text-slate-600">
              <div><b>Company:</b> {client?.companyName}</div>
              <div><b>Hiring Manager:</b> {hiringManager?.fullName} ({hiringManager?.designation})</div>
              <div><b>Manager Email:</b> <a href={`mailto:${hiringManager?.email}`} className="text-indigo-600">{hiringManager?.email}</a></div>
              <div><b>Phone:</b> {hiringManager?.phone || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Follow-up Tasks, Hiring Manager Feedback & Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hiring Manager Feedback Received Card (if present) */}
          {submission.hiringManagerFeedback ? (
            <div className="card p-5 border-emerald-300 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  Hiring Manager Feedback Recorded
                </div>
                <span className="badge-green text-xs font-bold">
                  {(submission.hiringManagerFeedback as any)?.decision}
                </span>
              </div>
              <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-200">
                <div className="font-semibold text-slate-900 mb-1">Manager Comments:</div>
                "{(submission.hiringManagerFeedback as any)?.comments}"
              </div>
              {(submission.hiringManagerFeedback as any)?.interviewAvailability && (
                <div className="text-xs text-slate-600">
                  <b>Interview Availability:</b> {(submission.hiringManagerFeedback as any)?.interviewAvailability}
                </div>
              )}
              <div className="text-[11px] text-slate-400">
                Submitted at: {formatDateTime((submission.hiringManagerFeedback as any)?.submittedAt)}
              </div>
            </div>
          ) : (
            /* Follow-up Tasks Workflow */
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600" />
                    Automated Follow-up Tasks
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Schedules and triggers follow-up reminders if hiring manager feedback is delayed
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {followUpTasks.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3">No active follow-up tasks scheduled.</div>
                ) : (
                  followUpTasks.map((task) => (
                    <div
                      key={task._id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        task.status === 'Pending' && new Date(task.dueDate) < new Date()
                          ? 'bg-red-50/70 border-red-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          {task.title}
                          <span className={
                            task.status === 'Sent' ? 'badge-blue' :
                            task.status === 'Completed' ? 'badge-green' :
                            task.status === 'Escalated' ? 'badge-purple' :
                            'badge-orange'
                          }>
                            {task.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Due: <b>{formatDate(task.dueDate)}</b> · Step #{task.stepNumber}
                        </div>
                      </div>

                      {task.status === 'Pending' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleSendFollowUp(task._id)}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <Send size={13} />
                            Send Follow-up
                          </button>
                          <button
                            onClick={() => handleEscalate(task._id)}
                            className="btn-danger text-xs py-1.5 px-3"
                          >
                            Escalate
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare size={16} className="text-indigo-600" />
              Submission Communication History & Activity Timeline
            </h3>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((act) => (
                <div key={act._id} className="relative">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                  <div className="text-sm font-semibold text-slate-800">{act.action}</div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{act.details}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    By {(act.performedBy as any)?.name || 'System'} · {formatDateTime(act.createdAt)} ({formatRelativeTime(act.createdAt)})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
