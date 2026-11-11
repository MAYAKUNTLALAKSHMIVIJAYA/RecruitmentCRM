import React from 'react';
import {
  Settings,
  Clock,
  Shield,
  Mail,
  Layers,
  CheckCircle,
  Database,
  Cpu,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="text-indigo-600" size={24} />
          Application Settings & Automation Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Follow-up schedules, reminder intervals, role controls, and email simulation settings
        </p>
      </div>

      {/* Follow-up Intervals Configuration Card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
          <Clock size={18} className="text-indigo-600" />
          Default Follow-up Reminder Schedule (RecruitFlow Automation Engine)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase">Step 0 · Initial Submission</div>
            <div className="text-sm font-bold text-slate-900">Day 0 (Instant)</div>
            <p className="text-xs text-slate-500">
              Candidate profile, credentials, and secure review token dispatched to client manager.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase">Step 1 · First Reminder</div>
            <div className="text-sm font-bold text-slate-900">Day 2 (48 Hours)</div>
            <p className="text-xs text-slate-500">
              Polite follow-up inquiring if profile has been reviewed and scheduling can commence.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase">Step 2 · Second Reminder</div>
            <div className="text-sm font-bold text-slate-900">Day 4 (96 Hours)</div>
            <p className="text-xs text-slate-500">
              Urgent notification alerting manager that candidate is exploring competing options.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase">Step 3 · Team Lead Escalation</div>
            <div className="text-sm font-bold text-slate-900">Day 6 (144 Hours)</div>
            <p className="text-xs text-slate-500">
              Automatic escalation to agency leadership to intervene directly with client sponsors.
            </p>
          </div>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-red-900">Overdue SLA Threshold:</span>{' '}
            <span className="text-red-800">
              Submissions past Day 2 without feedback are automatically tagged "Follow-up Due" and highlighted across the CRM.
            </span>
          </div>
          <span className="badge-red font-bold">Enforced</span>
        </div>
      </div>

      {/* Email Simulation Provider Card */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
          <Mail size={18} className="text-indigo-600" />
          Email Delivery Infrastructure
        </div>

        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-emerald-600" />
            <span><b>Mock Email Provider Active:</b> All generated emails are safely recorded in MongoDB with complete metadata.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-emerald-600" />
            <span><b>Zero Risk:</b> No unsolicited emails are dispatched to real client email addresses.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-emerald-600" />
            <span><b>Production-Ready:</b> Easy drop-in architecture for SendGrid, AWS SES, or Resend.</span>
          </div>
        </div>
      </div>

      {/* System Architecture Specs */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
          <Cpu size={18} className="text-indigo-600" />
          System Information
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-slate-400">Application</div>
            <div className="font-bold text-slate-800 mt-0.5">RecruitFlow CRM</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-slate-400">Version</div>
            <div className="font-bold text-slate-800 mt-0.5">1.0.0 (Production Build)</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-slate-400">Database</div>
            <div className="font-bold text-slate-800 mt-0.5">MongoDB + Mongoose</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-slate-400">Real-time Sockets</div>
            <div className="font-bold text-slate-800 mt-0.5">Socket.IO Enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
};
