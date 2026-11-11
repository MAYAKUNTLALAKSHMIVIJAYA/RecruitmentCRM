import { SubmissionStatus, RiskLevel, CandidateStatus } from '../types';

export const statusColors: Record<SubmissionStatus, string> = {
  Draft: 'badge-gray',
  Submitted: 'badge-blue',
  'Awaiting Feedback': 'badge-orange',
  'Follow-up Due': 'badge-red',
  'Feedback Received': 'badge-green',
  'Interview Requested': 'badge-purple',
  'Interview Scheduled': 'badge-indigo',
  Selected: 'badge-green',
  Rejected: 'badge-red',
  Withdrawn: 'badge-gray',
  Closed: 'badge-green',
};

export const riskColors: Record<RiskLevel, string> = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-orange-50 text-orange-700 border-orange-200',
  High: 'bg-red-50 text-red-700 border-red-200',
  Critical: 'bg-red-100 text-red-800 border-red-400',
};

export const riskBg: Record<RiskLevel, string> = {
  Low: 'bg-emerald-50 border-emerald-200',
  Medium: 'bg-orange-50 border-orange-200',
  High: 'bg-red-50 border-red-200',
  Critical: 'bg-red-100 border-red-400',
};

export const candidateStatusColors: Record<CandidateStatus, string> = {
  New: 'badge-gray',
  Contacted: 'badge-blue',
  Screened: 'badge-indigo',
  Shortlisted: 'badge-purple',
  Submitted: 'badge-orange',
  Interview: 'badge-indigo',
  Selected: 'badge-green',
  Offer: 'badge-green',
  Placed: 'badge-green',
  Rejected: 'badge-red',
  Withdrawn: 'badge-gray',
};

export const priorityColors: Record<string, string> = {
  Low: 'badge-gray',
  Medium: 'badge-blue',
  High: 'badge-orange',
  Critical: 'badge-red',
  Urgent: 'badge-red',
};

export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date | undefined): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(date as string);
};

export const getDaysWaiting = (submissionDate: string): number => {
  return Math.max(0, Math.floor((Date.now() - new Date(submissionDate).getTime()) / (1000 * 60 * 60 * 24)));
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const clsx = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};
