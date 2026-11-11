import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Building2,
  Layers,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Calendar,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import api from '../services/api';
import { DashboardStats, Submission, FollowUpTask } from '../types';
import { formatDate, formatRelativeTime, riskColors } from '../utils';

const KpiCard = ({
  icon: Icon,
  label,
  value,
  color,
  link,
  change,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  link?: string;
  change?: string;
}) => (
  <Link to={link || '#'} className={`card p-5 hover:shadow-md transition-shadow ${!link ? 'pointer-events-none' : ''}`}>
    <div className="flex items-start justify-between">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon size={20} />
      </div>
      {change && (
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {change}
        </span>
      )}
    </div>
    <div className="mt-4">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5 font-medium">{label}</div>
    </div>
  </Link>
);

const PIPELINE_COLORS = ['#64748b', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#3b82f6', '#94a3b8'];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [urgent, setUrgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes, urgentRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/urgent-actions'),
      ]);
      setStats(statsRes.data.data);
      setCharts(chartsRes.data.data);
      setUrgent(urgentRes.data.data);
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recruitment Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live recruitment pipeline overview</p>
        </div>
        <button onClick={loadDashboard} className="btn-secondary text-xs">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={Users} label="Total Candidates" value={stats?.totalCandidates || 0} color="bg-indigo-100 text-indigo-600" link="/candidates" />
        <KpiCard icon={Briefcase} label="Active Jobs" value={stats?.activeJobs || 0} color="bg-blue-100 text-blue-600" link="/jobs" />
        <KpiCard icon={Building2} label="Clients" value={stats?.totalClients || 0} color="bg-slate-100 text-slate-600" link="/clients" />
        <KpiCard icon={Layers} label="Total Submissions" value={stats?.totalSubmissions || 0} color="bg-purple-100 text-purple-600" link="/submissions" />
        <KpiCard icon={Clock} label="Awaiting Feedback" value={stats?.awaitingFeedback || 0} color="bg-orange-100 text-orange-600" link="/submissions?status=Awaiting Feedback" />
        <KpiCard icon={CheckCircle} label="Feedback Received" value={stats?.feedbackReceived || 0} color="bg-emerald-100 text-emerald-600" link="/submissions?status=Feedback Received" />
        <KpiCard icon={AlertTriangle} label="Overdue Follow-ups" value={stats?.overdueFollowUps || 0} color="bg-red-100 text-red-600" link="/followups" />
        <KpiCard icon={Calendar} label="Interviews Scheduled" value={stats?.interviewsScheduled || 0} color="bg-indigo-100 text-indigo-600" link="/submissions?status=Interview Scheduled" />
        <KpiCard icon={Flame} label="Candidates at Risk" value={stats?.candidatesAtRisk || 0} color="bg-red-100 text-red-600" link="/submissions?riskLevel=Critical" />
        <KpiCard icon={TrendingUp} label="Successful Placements" value={stats?.successfulPlacements || 0} color="bg-emerald-100 text-emerald-600" link="/submissions?status=Selected" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Submission Trends */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Candidate Submission Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts?.trends || []}>
              <defs>
                <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="submissions" stroke="#6366f1" strokeWidth={2} fill="url(#subGrad)" name="Submissions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Pipeline Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={charts?.pipeline?.filter((p: any) => p.value > 0) || []} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                {(charts?.pipeline || []).map((_: any, idx: number) => (
                  <Cell key={`cell-${idx}`} fill={PIPELINE_COLORS[idx % PIPELINE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recruiter Performance */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Recruiter Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.recruiters || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis dataKey="recruiter" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="submissions" fill="#6366f1" name="Submissions" radius={[0, 4, 4, 0]} />
              <Bar dataKey="interviews" fill="#3b82f6" name="Interviews" radius={[0, 4, 4, 0]} />
              <Bar dataKey="placements" fill="#10b981" name="Placements" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Follow-up Stats */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Follow-up Status Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={charts?.followupStats?.filter((f: any) => f.value > 0) || []} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {(charts?.followupStats || []).map((_: any, idx: number) => (
                  <Cell key={idx} fill={['#f59e0b', '#10b981', '#ef4444'][idx % 3]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attention Required Section */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Attention Required
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Critical items that need immediate action</p>
          </div>
          <Link to="/submissions?riskLevel=Critical" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
            View All →
          </Link>
        </div>

        {/* Critical at-risk candidates */}
        {urgent?.atRiskSubmissions?.length > 0 ? (
          <div className="space-y-3">
            {urgent.atRiskSubmissions.slice(0, 4).map((sub: Submission) => (
              <div
                key={sub._id}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow ${
                  sub.riskLevel === 'Critical' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                }`}
                onClick={() => navigate(`/submissions/${sub._id}`)}
              >
                <div className={`mt-0.5 px-2.5 py-1 rounded-full text-xs font-bold border ${riskColors[sub.riskLevel]}`}>
                  {sub.riskLevel}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{sub.candidate?.fullName}</span>
                    <span className="text-xs text-slate-500">→</span>
                    <span className="text-xs text-slate-600">{sub.job?.jobTitle}</span>
                    <span className="text-xs text-slate-500">@</span>
                    <span className="text-xs font-semibold text-slate-700">{sub.client?.companyName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {sub.riskReasons?.slice(0, 2).map((reason, idx) => (
                      <span key={idx} className="text-xs text-slate-500">• {reason}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>⏱ {sub.daysWaiting}d waiting</span>
                    <span>👤 {(sub.recruiter as any)?.name}</span>
                    {sub.isOverdue && <span className="text-red-600 font-semibold">⚠️ Feedback Overdue</span>}
                  </div>
                </div>
                <button
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); navigate(`/submissions/${sub._id}`); }}
                >
                  View <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            ✅ No critical risk submissions at this time
          </div>
        )}

        {/* Overdue Follow-up Tasks */}
        {urgent?.overdueTasks?.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Overdue Follow-up Tasks</h4>
            <div className="space-y-2">
              {urgent.overdueTasks.slice(0, 3).map((task: FollowUpTask) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:shadow-sm"
                  onClick={() => navigate('/followups')}
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{task.title}</div>
                    <div className="text-xs text-slate-500">
                      Due: {formatDate(task.dueDate)} · {(task.client as any)?.companyName}
                    </div>
                  </div>
                  <span className="badge-orange">Overdue</span>
                </div>
              ))}
            </div>
            <Link to="/followups" className="mt-3 flex items-center justify-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
              Manage All Follow-ups <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
