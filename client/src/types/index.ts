export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'hiring_manager';
  designation?: string;
  phone?: string;
  avatar?: string;
}

export interface Candidate {
  _id: string;
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  totalExperience: number;
  currentCompany: string;
  currentDesignation: string;
  expectedSalary: string;
  noticePeriod: string;
  resumeUrl?: string;
  resumeOriginalName?: string;
  linkedinProfile?: string;
  recruiterOwner: User | string;
  availability: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  source: string;
  status: CandidateStatus;
  notes: string[];
  competingOffers: boolean;
  inFinalStagesElsewhere: boolean;
  dissatisfiedWithDelays?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CandidateStatus =
  | 'New'
  | 'Contacted'
  | 'Screened'
  | 'Shortlisted'
  | 'Submitted'
  | 'Interview'
  | 'Selected'
  | 'Offer'
  | 'Placed'
  | 'Rejected'
  | 'Withdrawn';

export interface Client {
  _id: string;
  companyName: string;
  industry: string;
  website: string;
  location: string;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  assignedRecruiter: User | string;
  accountStatus: 'Active' | 'Inactive' | 'On Hold';
  notes?: string;
  hiringManagersCount?: number;
  activeJobsCount?: number;
  totalSubmissionsCount?: number;
  pendingFeedbackCount?: number;
  createdAt: string;
}

export interface HiringManager {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  client: Client | string;
  assignedJobs: Job[] | string[];
  createdAt: string;
}

export interface Job {
  _id: string;
  jobId: string;
  jobTitle: string;
  client: Client | string;
  hiringManager: HiringManager | string;
  department: string;
  requiredSkills: string[];
  experienceRequired: string;
  salaryRange: string;
  jobLocation: string;
  employmentType: string;
  jobDescription: string;
  assignedRecruiter: User | string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  numberOfOpenings: number;
  jobStatus: 'Open' | 'On Hold' | 'Closed' | 'Cancelled';
  targetClosureDate?: string;
  totalSubmissions?: number;
  pendingFeedback?: number;
  interviews?: number;
  selected?: number;
  conversionRate?: number;
  createdAt: string;
}

export type SubmissionStatus =
  | 'Draft'
  | 'Submitted'
  | 'Awaiting Feedback'
  | 'Follow-up Due'
  | 'Feedback Received'
  | 'Interview Requested'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected'
  | 'Withdrawn'
  | 'Closed';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Submission {
  _id: string;
  submissionId: string;
  candidate: Candidate;
  job: Job;
  client: Client;
  hiringManager: HiringManager;
  recruiter: User;
  submissionDate: string;
  submissionMethod: string;
  emailSubject: string;
  submissionNotes: string;
  resumeAttachment?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  feedbackDueDate: string;
  lastFollowUpDate?: string;
  nextFollowUpDate?: string;
  submissionStatus: SubmissionStatus;
  reviewToken: string;
  reviewTokenExpiresAt: string;
  hiringManagerFeedback?: Feedback;
  riskLevel: RiskLevel;
  riskReasons: string[];
  daysWaiting: number;
  isOverdue: boolean;
  isEscalated: boolean;
  escalatedAt?: string;
  escalatedTo?: User;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackDecision =
  | 'Accept'
  | 'Reject'
  | 'Request Interview'
  | 'Request More Information'
  | 'Keep Under Review';

export interface Feedback {
  _id: string;
  submission: string;
  candidate: string;
  job: string;
  hiringManager: string;
  decision: FeedbackDecision;
  comments: string;
  interviewAvailability?: string;
  additionalRequirements?: string;
  submittedAt: string;
}

export interface FollowUpTask {
  _id: string;
  submission: Submission | string;
  candidate: Candidate | string;
  job: Job | string;
  client: Client | string;
  hiringManager: HiringManager | string;
  assignedRecruiter: User | string;
  stepNumber: number;
  title: string;
  dueDate: string;
  status: 'Pending' | 'Sent' | 'Snoozed' | 'Completed' | 'Escalated' | 'Cancelled';
  lastSentDate?: string;
  snoozedUntil?: string;
  escalationNotes?: string;
  history: Array<{
    action: string;
    performedBy?: string;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
}

export interface EmailLog {
  _id: string;
  submission: string | Submission;
  candidate: Candidate | string;
  job: Job | string;
  client: Client | string;
  hiringManager: HiringManager | string;
  sender: User | string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  templateType: 'Submission' | 'First Follow-up' | 'Second Follow-up' | 'Escalation' | 'Custom';
  status: 'Sent (Simulated)' | 'Failed';
  isSimulated: boolean;
  followUpNumber: number;
  sentAt: string;
  reviewUrl?: string;
}

export interface ActivityLog {
  _id: string;
  submission?: string;
  candidate?: Candidate | string;
  job?: Job | string;
  performedBy: User;
  action: string;
  details: string;
  meta?: any;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender?: User | string;
  type: string;
  title: string;
  message: string;
  submission?: Submission | string;
  candidate?: Candidate | string;
  job?: Job | string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalCandidates: number;
  activeJobs: number;
  totalClients: number;
  totalSubmissions: number;
  awaitingFeedback: number;
  feedbackReceived: number;
  overdueFollowUps: number;
  interviewsScheduled: number;
  candidatesAtRisk: number;
  successfulPlacements: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}
