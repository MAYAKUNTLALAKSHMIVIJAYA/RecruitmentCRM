import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  AlertTriangle,
  Clock,
  Send,
  Plus,
  Flame,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { Candidate, Submission, ActivityLog, ApiResponse } from '../types';
import {
  candidateStatusColors,
  statusColors,
  priorityColors,
  riskColors,
  formatDate,
  formatRelativeTime,
  getInitials,
} from '../utils';
import { SubmissionModal } from '../components/SubmissionModal';

export const CandidateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'activities' | 'notes'>('submissions');
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const fetchCandidateDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ candidate: Candidate; submissions: Submission[]; activities: ActivityLog[] }>>(`/candidates/${id}`);
      if (res.data.success && res.data.data) {
        setCandidate(res.data.data.candidate);
        setSubmissions(res.data.data.submissions || []);
        setActivities(res.data.data.activities || []);
      }
    } catch (err) {
      console.error('Failed to fetch candidate details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCandidateDetails();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      await api.post(`/candidates/${id}/notes`, { note: newNote });
      setNewNote('');
      fetchCandidateDetails();
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500 text-sm">Loading candidate profile...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-base font-bold text-slate-800">Candidate Not Found</h2>
        <Link to="/candidates" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
          ← Back to Candidates Pool
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/candidates"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{candidate.fullName}</h1>
              <span className={candidateStatusColors[candidate.status] || 'badge-gray'}>
                {candidate.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate ID: {candidate.candidateId} · Added {formatDate(candidate.createdAt)}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="btn-primary"
        >
          <Send size={15} />
          Submit to Client Job
        </button>
      </div>

      {/* Critical / High Risk Warning Alert */}
      {(candidate.inFinalStagesElsewhere || candidate.competingOffers) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <Flame size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold text-red-900">
              High Withdrawal Risk: Expedited Client Decisions Required
            </div>
            <div className="text-red-700 text-xs mt-1">
              {candidate.inFinalStagesElsewhere && '• Candidate is in final rounds with another company. '}
              {candidate.competingOffers && '• Candidate holds active competing job offers. '}
              Hiring managers must be pressed for accelerated review to avoid candidate withdrawal.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Candidate Profile
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={15} className="text-slate-400" />
                <a href={`mailto:${candidate.email}`} className="text-indigo-600 hover:underline">
                  {candidate.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={15} className="text-slate-400" />
                <span>{candidate.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={15} className="text-slate-400" />
                <span>{candidate.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building size={15} className="text-slate-400" />
                <span>
                  {candidate.currentDesignation || 'Designation'} @ {candidate.currentCompany || 'Current Company'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Briefcase size={15} className="text-slate-400" />
                <span>Total Experience: <b>{candidate.totalExperience} years</b></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Expected Salary:</span>
                <span className="font-semibold text-slate-800">{candidate.expectedSalary || 'Negotiable'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Notice Period:</span>
                <span className="font-semibold text-slate-800">{candidate.noticePeriod}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Priority:</span>
                <span className={priorityColors[candidate.priority]}>{candidate.priority}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Recruiter Owner:</span>
                <span className="font-semibold text-slate-800">{(candidate.recruiterOwner as any)?.name || 'Unassigned'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill, idx) => (
                  <span key={idx} className="badge-indigo text-[11px]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabs (Submissions, Activity, Notes) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'submissions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Client Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'activities'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Activity Timeline ({activities.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Internal Notes ({candidate.notes?.length || 0})
            </button>
          </div>

          {/* TAB 1: SUBMISSIONS */}
          {activeTab === 'submissions' && (
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <div className="card p-8 text-center text-slate-400 text-sm">
                  This candidate has not been submitted to any client requirements yet.
                  <div className="mt-2">
                    <button
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="btn-primary text-xs"
                    >
                      <Plus size={14} /> Submit to a Job Now
                    </button>
                  </div>
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub._id}
                    onClick={() => navigate(`/submissions/${sub._id}`)}
                    className="card p-4 hover:shadow-md cursor-pointer transition-shadow space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {sub.job?.jobTitle || 'Job Requirement'}
                          <span className={statusColors[sub.submissionStatus] || 'badge-gray'}>
                            {sub.submissionStatus}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Client: <span className="font-semibold text-slate-700">{sub.client?.companyName}</span> · Manager: <span className="text-slate-700">{sub.hiringManager?.fullName}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${riskColors[sub.riskLevel]}`}>
                        {sub.riskLevel} Risk
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>Submitted: {formatDate(sub.submissionDate)}</span>
                      <span>Feedback Due: {formatDate(sub.feedbackDueDate)}</span>
                      <span>Days Waiting: <b>{sub.daysWaiting}d</b></span>
                      {sub.isOverdue && <span className="text-red-600 font-bold">⚠️ Overdue</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="card p-5 space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">No activity records yet.</div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activities.map((act) => (
                    <div key={act._id} className="relative">
                      <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                      <div className="text-sm font-semibold text-slate-800">{act.action}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{act.details}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        By {(act.performedBy as any)?.name || 'System'} · {formatRelativeTime(act.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTES */}
          {activeTab === 'notes' && (
            <div className="card p-5 space-y-4">
              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Add an internal recruiter note or feedback..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="btn-primary text-xs ml-auto"
                >
                  {submittingNote ? 'Adding...' : 'Add Note'}
                </button>
              </form>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {(candidate.notes || []).map((note, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 leading-relaxed">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={() => fetchCandidateDetails()}
        defaultCandidateId={candidate._id}
      />
    </div>
  );
};
