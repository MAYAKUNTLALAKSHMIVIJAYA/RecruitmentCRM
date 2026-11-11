import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  X,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { EmailLog, ApiResponse } from '../types';
import { formatDateTime } from '../utils';

export const EmailCenterPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateFilter, setTemplateFilter] = useState('');
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (templateFilter) params.append('templateType', templateFilter);

      const res = await api.get<ApiResponse<EmailLog[]>>(`/emails?${params.toString()}`);
      setEmails(res.data.data || []);
    } catch (err) {
      console.error('Failed to load email logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [templateFilter]);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="text-indigo-600" size={24} />
            Email Communications Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Full audit history of candidate submission pitches, follow-ups, and escalations sent to client stakeholders
          </p>
        </div>
      </div>

      {/* Simulated Email Notice Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <b>Safe Simulation Active:</b> Real SMTP / external email delivery is disabled for this demonstration. Every outgoing candidate profile submission, follow-up reminder, and escalation is processed, validated, formatted with real portal tokens, and logged below with zero risk of sending test emails to real corporate domains.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Filter by Template:</label>
          <select
            className="input w-52 text-xs"
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
          >
            <option value="">All Templates</option>
            <option value="Submission">Candidate Submission</option>
            <option value="First Follow-up">First Follow-up</option>
            <option value="Second Follow-up">Second Follow-up</option>
            <option value="Escalation">Escalation</option>
          </select>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total Dispatched: <b>{emails.length}</b>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3.5 px-4 table-header">Template</th>
                <th className="py-3.5 px-4 table-header">Recipient</th>
                <th className="py-3.5 px-4 table-header">Subject Line</th>
                <th className="py-3.5 px-4 table-header">Dispatched At</th>
                <th className="py-3.5 px-4 table-header">Status</th>
                <th className="py-3.5 px-4 table-header text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    Loading communication logs...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    No communication records found.
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr
                    key={email._id}
                    onClick={() => setPreviewEmail(email)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <span className="badge-indigo text-[11px] font-semibold">
                        {email.templateType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 table-cell">
                      <div className="font-semibold text-slate-900 text-xs">{email.recipientName}</div>
                      <div className="text-slate-400 text-[11px]">{email.recipientEmail}</div>
                    </td>

                    <td className="py-3.5 px-4 table-cell max-w-md truncate font-medium text-slate-800 text-xs">
                      {email.subject}
                    </td>

                    <td className="py-3.5 px-4 table-cell text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(email.sentAt)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="badge-orange text-[10px]">
                        {email.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewEmail(email);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="badge-indigo text-xs">{previewEmail.templateType}</span>
                <span className="text-xs text-slate-400">
                  {formatDateTime(previewEmail.sentAt)}
                </span>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-b border-slate-100 pb-3">
              <div><b>To:</b> {previewEmail.recipientName} ({previewEmail.recipientEmail})</div>
              <div><b>From:</b> {(previewEmail.sender as any)?.name || 'RecruitFlow Team'}</div>
              <div><b>Subject:</b> <span className="font-semibold text-slate-900">{previewEmail.subject}</span></div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
              {previewEmail.bodyText}
            </div>

            {previewEmail.reviewUrl && (
              <div className="pt-2 text-xs">
                <b>Embedded Review Link:</b>{' '}
                <a
                  href={previewEmail.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline break-all"
                >
                  {previewEmail.reviewUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
