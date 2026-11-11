import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../services/api';
import { ApiResponse } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<any>>(`/reports?range=${range}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  const summary = data?.summary;
  const recruiterMetrics = data?.recruiterMetrics || [];
  const clientMetrics = data?.clientMetrics || [];

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={24} />
            Recruitment Analytics & SLA Turnaround Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Measure client responsiveness, conversion funnels, and follow-up effectiveness
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
          {['7d', '30d', '90d', 'all'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                range === r
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : r === '90d' ? 'Last 90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Candidate Submissions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.totalSubmissions ?? 0}</div>
          <div className="text-xs text-indigo-600 mt-1 font-medium">Profiles presented</div>
        </div>

        <div className="card p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Feedback Response Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {summary?.feedbackResponsePercentage ?? 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Clients responding on time</div>
        </div>

        <div className="card p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Avg Feedback Turnaround</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.averageFeedbackTurnaroundTimeDays ?? 0} days
          </div>
          <div className="text-xs text-slate-500 mt-1">From submission to decision</div>
        </div>

        <div className="card p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overdue Submissions</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {summary?.overduePercentage ?? 0}%
          </div>
          <div className="text-xs text-red-600 mt-1 font-medium">Exceeded feedback SLA</div>
        </div>
      </div>

      {/* Conversion Funnel Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm font-bold text-slate-800">Submission to Interview Rate</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {summary?.candidateToInterviewConv ?? 0}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Shortlisted candidates accepted for client interview</p>
        </div>

        <div className="card p-4">
          <div className="text-sm font-bold text-slate-800">Interview to Placement Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {summary?.interviewToPlacementConv ?? 0}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Candidates converted from interview to hire</p>
        </div>

        <div className="card p-4">
          <div className="text-sm font-bold text-slate-800">Withdrawals Prevented via CRM</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.followUpsCompleted ?? 0} follow-ups
          </div>
          <p className="text-xs text-slate-400 mt-1">Proactive touchpoints preventing lost talent</p>
        </div>
      </div>

      {/* Recruiter Matrix & Client Response Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruiter Performance Table */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users size={16} className="text-indigo-600" />
            Recruiter Performance Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2">Recruiter</th>
                  <th className="pb-2 text-center">Submissions</th>
                  <th className="pb-2 text-center">Interviews</th>
                  <th className="pb-2 text-center">Hires</th>
                  <th className="pb-2 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recruiterMetrics.map((r: any) => (
                  <tr key={r.recruiterId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-semibold text-slate-800">{r.name}</td>
                    <td className="py-2.5 text-center">{r.submissions}</td>
                    <td className="py-2.5 text-center text-indigo-600 font-medium">{r.interviews}</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">{r.placements}</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">{r.placementRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Responsiveness Table */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 size={16} className="text-indigo-600" />
            Client Turnaround & SLA Compliance
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2">Client Company</th>
                  <th className="pb-2 text-center">Submitted</th>
                  <th className="pb-2 text-center">Feedback Given</th>
                  <th className="pb-2 text-center">Overdue</th>
                  <th className="pb-2 text-right">SLA Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clientMetrics.map((c: any) => (
                  <tr key={c.clientId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-semibold text-slate-800">{c.companyName}</td>
                    <td className="py-2.5 text-center">{c.submissions}</td>
                    <td className="py-2.5 text-center text-emerald-600 font-medium">{c.feedbackReceived}</td>
                    <td className="py-2.5 text-center text-red-600 font-bold">{c.overdueSubmissions}</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">{c.responseRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
